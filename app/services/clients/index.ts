import { Client, UpdateClientPayload } from "@/app/type/client";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export type GetClientsFilters = ServiceRequestContext & {
  branchCode?: string;
  page?: number;
  perPage?: number;
};

export const getclients = async (filters?: GetClientsFilters) => {
  const params = new URLSearchParams();
  if (filters?.branchCode) params.set('branchCode', filters.branchCode);
  if (typeof filters?.page === 'number') params.set('Page', String(filters.page));
  if (typeof filters?.perPage === 'number') params.set('PerPage', String(filters.perPage));
  const queryString = params.toString();

  const res = await fetch(resolveServiceUrl(`/api/clients${queryString ? `?${queryString}` : ''}`, filters), {
    headers: createJsonHeaders(filters?.cookieHeader),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }
  return res.json();
};

export const createClient = async (clientData: Client, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/clients', context), {
    method: "POST",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(clientData),
  });
};

export const updateClient = async (
  id: number,
  payload: UpdateClientPayload,
  context?: ServiceRequestContext,
) => {
  const res = await fetch(resolveServiceUrl(`/api/clients/${id}`, context), {
    method: "PUT",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || errorData?.detail || "Failed to update client");
  }
};

export const deleteClient = async (clientId: string, context?: ServiceRequestContext) => {
  const res = await fetch(resolveServiceUrl('/api/clients', context), {
    method: "DELETE",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id: clientId }),
  });
  if (!res.ok) {
    throw new Error("Failed to delete client");
  }
  return res.json();
};
