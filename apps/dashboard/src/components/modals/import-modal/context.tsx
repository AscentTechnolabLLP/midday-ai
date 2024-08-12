import { createContext, useContext } from "react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { z } from "zod";

export const mappableFields = {
  date: {
    label: "Date",
    required: true,
  },
  description: {
    label: "Description",
    required: true,
  },
  amount: {
    label: "Amount",
    required: true,
  },
} as const;

export const importSchema = z.object({
  file: z.custom<File>(),
  currency: z.string(),
  bank_account_id: z.string(),
  amount: z.string(),
  date: z.string(),
  description: z.string(),
});

export type ImportCsvFormData = {
  file: File | null;
  currency: string;
  bank_account_id: string;
} & Record<keyof typeof mappableFields, string>;

export const ImportCsvContext = createContext<{
  fileColumns: string[] | null;
  setFileColumns: (columns: string[] | null) => void;
  firstRows: Record<string, string>[] | null;
  setFirstRows: (rows: Record<string, string>[] | null) => void;
  control: Control<ImportCsvFormData>;
  watch: UseFormWatch<ImportCsvFormData>;
  setValue: UseFormSetValue<ImportCsvFormData>;
} | null>(null);

export function useCsvContext() {
  const context = useContext(ImportCsvContext);

  if (!context)
    throw new Error(
      "useCsvContext must be used within an ImportCsvContext.Provider",
    );

  return context;
}