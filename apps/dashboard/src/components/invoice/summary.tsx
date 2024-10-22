import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { useAction } from "next-safe-action/hooks";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormatAmount } from "../format-amount";
import { LabelInput } from "./label-input";

export function Summary() {
  const { control, setValue } = useFormContext<InvoiceFormValues>();

  const currency = useWatch({
    control,
    name: "template.currency",
  });

  const lineItems = useWatch({
    control,
    name: "line_items",
  });

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const { totalAmount, totalVAT } = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const itemVAT = (itemTotal * (item.vat || 0)) / 100;
        return {
          totalAmount: acc.totalAmount + itemTotal,
          totalVAT: acc.totalVAT + itemVAT,
        };
      },
      { totalAmount: 0, totalVAT: 0 },
    );
  }, [lineItems]);

  const total = totalAmount + totalVAT;

  useMemo(() => {
    if (total) {
      setValue("amount", total, { shouldValidate: true });
    }

    if (totalVAT) {
      setValue("vat", totalVAT, { shouldValidate: true });
    }
  }, [total, totalVAT, setValue]);

  return (
    <div className="w-[280px] flex flex-col space-y-4 divide-y divide-border">
      <div className="flex justify-between items-center">
        <LabelInput
          name="template.vat_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              vat_label: value,
            });
          }}
        />
        <span className="text-right font-mono text-[11px] text-[#878787]">
          <FormatAmount
            amount={totalVAT}
            minimumFractionDigits={0}
            maximumFractionDigits={2}
            currency={currency}
          />
        </span>
      </div>

      <div className="flex justify-between items-center pt-2">
        <LabelInput
          name="template.total_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              total_label: value,
            });
          }}
        />
        <span className="text-right font-mono text-[21px]">
          <FormatAmount
            amount={total}
            currency={currency}
            minimumFractionDigits={0}
            maximumFractionDigits={2}
          />
        </span>
      </div>
    </div>
  );
}