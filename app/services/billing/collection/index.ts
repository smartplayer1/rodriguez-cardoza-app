import {
  CollectionCreatePayload,
  CollectionListResponse,
  CollectionRecord,
} from "@/app/type/collection";
import { createJsonHeaders, resolveServiceUrl } from "@/app/services/http";

export type CollectionFilters = {
  number?: string;
  invoiceId?: string;
  invoiceDocument?: string;
  cashRegisterId?: string;
  cashManagementId?: string;
  currency?: string;
  applicationStatus?: string;
  status?: string;
  collectionDate?: string;
  clientCode?: string;
  branchId?: string;
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: Omit<CollectionFilters, "baseUrl">) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.number?.trim()) params.set("number", filters.number.trim());
  if (filters.invoiceId?.trim())
    params.set("invoiceId", filters.invoiceId.trim());
  if (filters.invoiceDocument?.trim())
    params.set("invoiceDocument", filters.invoiceDocument.trim());
  if (filters.cashRegisterId?.trim())
    params.set("cashRegisterId", filters.cashRegisterId.trim());
  if (filters.cashManagementId?.trim())
    params.set("cashManagementId", filters.cashManagementId.trim());
  if (filters.currency?.trim()) params.set("currency", filters.currency.trim());
  if (filters.applicationStatus?.trim())
    params.set("applicationStatus", filters.applicationStatus.trim());
  if (filters.status?.trim()) params.set("status", filters.status.trim());
  if (filters.collectionDate?.trim())
    params.set("collectionDate", filters.collectionDate.trim());
  if (filters.clientCode?.trim())
    params.set("clientCode", filters.clientCode.trim());
  if (filters.branchId?.trim()) params.set("branchId", filters.branchId.trim());

  if (typeof filters.page === "number" && filters.page > 0) {
    params.set("Page", String(filters.page));
  }

  if (typeof filters.perPage === "number" && filters.perPage > 0) {
    params.set("PerPage", String(filters.perPage));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const getCollections = async (
  filters?: CollectionFilters,
): Promise<CollectionListResponse> => {
  const queryString = buildQueryString(filters);
  const endpoint = resolveServiceUrl(`/api/billing/collection${queryString}`, {
    baseUrl: filters?.baseUrl,
  });

  const response = await fetch(endpoint, {
    method: "GET",
    headers: createJsonHeaders(filters?.cookieHeader),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to fetch collections";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const createCollection = async (
  payload: CollectionCreatePayload,
  cookieHeader?: string,
): Promise<CollectionRecord> => {
  const response = await fetch(resolveServiceUrl("/api/billing/collection"), {
    method: "POST",
    headers: createJsonHeaders(cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to create collection";

    // 409 = transferencia duplicada (mismo documento el mismo día).
    throw Object.assign(new Error(errorMessage), { status: response.status });
  }

  return await response.json();
};

// Anula un cobro: revierte su efectivo en la caja y devuelve el saldo a las facturas.
// Solo mientras su gestión de caja esté abierta; si no, lanza el mensaje del backend.
export const voidCollection = async (id: number): Promise<CollectionRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/collection/${id}/void`), {
    method: "POST",
    headers: createJsonHeaders(),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      (errorBody as { message?: string; detail?: string } | null)?.message ||
        (errorBody as { message?: string; detail?: string } | null)?.detail ||
        "No se pudo anular el cobro",
    );
  }

  return await response.json();
};
