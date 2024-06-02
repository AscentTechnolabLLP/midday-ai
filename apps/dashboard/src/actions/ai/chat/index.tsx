"use server";

import { BotMessage, SpinnerMessage } from "@/components/chat/messages";
// import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";
import { client as RedisClient } from "@midday/kv";
import {
  getBankAccountsCurrencies,
  getUser,
} from "@midday/supabase/cached-queries";
import { Ratelimit } from "@upstash/ratelimit";
import { nanoid } from "ai";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { startOfMonth, subMonths } from "date-fns";
import { headers } from "next/headers";
import { ollama } from "ollama-ai-provider";
import { getAssistantSettings, saveChat } from "../storage";
import type { AIState, Chat, ClientMessage, UIState } from "../types";
import { getBurnRateTool } from "./tools/burn-rate";
import { getDocumentsTool } from "./tools/get-documents";
import { getTransactionsTool } from "./tools/get-transactions";
import { getProfitTool } from "./tools/profit";
import { getRunwayTool } from "./tools/runway";
import { getSpendingTool } from "./tools/spending";

const ratelimit = new Ratelimit({
  limiter: Ratelimit.fixedWindow(10, "10s"),
  redis: RedisClient,
});

async function selectModel() {
  const settings = await getAssistantSettings();

  switch (settings.provider) {
    // case "mistralai": {
    //   return mistral("mistral-large-latest");
    // }
    default: {
      return ollama("mistral");
      // return openai("gpt-4o");
    }
  }
}

export async function submitUserMessage(
  content: string
): Promise<ClientMessage> {
  "use server";
  const ip = headers().get("x-forwarded-for");
  const user = await getUser();
  const teamId = user?.data?.team_id as string;

  const defaultValues = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
    currency:
      (await getBankAccountsCurrencies())?.data?.at(0)?.currency ?? "USD",
  };

  const model = await selectModel();

  const { success } = await ratelimit.limit(ip);

  const aiState = getMutableAIState<typeof AI>();

  if (!success) {
    aiState.update({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: "assistant",
          content:
            "Not so fast, tiger. You've reached your message limit. Please wait a minute and try again.",
        },
      ],
    });
  }

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: "user",
        content,
      },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  const result = await streamUI({
    model,
    initial: <SpinnerMessage />,
    system: `\
    You are a helful asssitant in Midday that can help users ask questions around their transactions, revenue, spending find invoices and more.`,
    messages: [
      ...aiState.get().messages,
      {
        role: "user",
        content,
      },
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue("");
        textNode = <BotMessage content={textStream.value} />;
      }

      if (done) {
        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: "assistant",
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
    tools: {
      get_spending: getSpendingTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      get_burn_rate: getBurnRateTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      get_runway: getRunwayTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      get_profit: getProfitTool({
        aiState,
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      get_transactions: getTransactionsTool({ aiState }),
      get_documents: getDocumentsTool({ aiState, teamId }),
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  onSetAIState: async ({ state, done }) => {
    "use server";

    const settings = await getAssistantSettings();
    const createdAt = new Date();
    const userId = state.user.id;

    const { chatId, messages } = state;

    const firstMessageContent = messages?.at(0).content as string;
    const title = firstMessageContent.substring(0, 100);

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      createdAt,
      messages,
    };

    if (done && settings?.enabled) {
      await saveChat(chat);
    }
  },
});
