import { InvoiceGetFilters, InvoiceListResponse, ServerInvoicePayload } from "@/app/type/invoice";

const buildQueryString = (filters?: InvoiceGetFilters) => {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.document?.trim()) params.set("document", filters.document.trim());
  if (filters.chargeStatus?.trim()) params.set("chargeStatus", filters.chargeStatus.trim());
  if (filters.clientCode?.trim()) params.set("clientCode", filters.clientCode.trim());
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (filters.issuedAt?.trim()) params.set("issuedAt", filters.issuedAt.trim());

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const getInvoices = async (filters?: InvoiceGetFilters): Promise<InvoiceListResponse> => {
  const res = await fetch(`/api/invoice${buildQueryString(filters)}`);

  if (!res.ok) {
    throw new Error("Failed to fetch invoices");
  }

  return res.json();
};

export const createInvoices = async (payload: ServerInvoicePayload[]) => {
  return await fetch("/api/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};
