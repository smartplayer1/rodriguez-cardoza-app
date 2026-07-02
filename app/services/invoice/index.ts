import {
  InvoiceGetFilters,
  InvoiceListResponse,
  ServerInvoicePayload,
  ServerInvoiceUpdatePayload,
} from "@/app/type/invoice";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

type InvoiceGetFiltersWithContext = InvoiceGetFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: InvoiceGetFiltersWithContext) => {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.document?.trim()) params.set("document", filters.document.trim());
  if (filters.chargeStatus?.trim()) params.set("chargeStatus", filters.chargeStatus.trim());
  if (filters.clientCode?.trim()) params.set("clientCode", filters.clientCode.trim());
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (filters.issuedAt?.trim()) params.set("issuedAt", filters.issuedAt.trim());
  if (typeof filters.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
  if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const getInvoices = async (filters?: InvoiceGetFiltersWithContext): Promise<InvoiceListResponse> => {
  const res = await fetch(resolveServiceUrl(`/api/invoice${buildQueryString(filters)}`, {
    baseUrl: filters?.baseUrl,
  }), {
    headers: createJsonHeaders(filters?.cookieHeader),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch invoices");
  }

  return res.json();
};

export const createInvoices = async (payload: ServerInvoicePayload[], context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/invoice', context), {
    method: "POST",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });
};

export const updateInvoice = async (payload: ServerInvoiceUpdatePayload, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/invoice', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.error || 'Failed to update invoice');
  }

  return response.json();
};
