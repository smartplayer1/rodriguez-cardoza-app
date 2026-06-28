import { ServerInvoicePayload } from "@/app/type/invoice";

export const createInvoices = async (payload: ServerInvoicePayload[]) => {
  return await fetch("/api/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};
