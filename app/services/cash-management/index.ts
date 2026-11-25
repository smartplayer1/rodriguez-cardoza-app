import {
  CashManagementClosePayload,
  CashManagementClosingSummary,
  CashManagementConversionCreatePayload,
  CashManagementConversionResponse,
  CashManagementCreatePayload,
  CashCurrentDenominations,
  CashLedgerResponse,
  CashManagementInflowCreatePayload,
  CashManagementInflowRecord,
  CashManagementInflowResponse,
  CashManagementOutflowCreatePayload,
  CashManagementOutflowRecord,
  CashManagementOutflowResponse,
  CashManagementReopenPayload,
  CashRegisterCreatePayload,
  CashRegisterResponse,
  CashRegisterUpdatePayload,
  CashManagementRecord,
  CashManagementResponse,
  UpdateCashEntryPayload,
} from "@/app/type/cash-management";
import { createJsonHeaders, resolveServiceUrl } from "@/app/services/http";

export type GetCashManagementFilters = {
  cashRegisterId?: string;
  responsibleEmployeeId?: string | null;
  status?: string;
  openedFrom?: string;
  openedTo?: string;
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

export type GetCashManagementConversionFilters = {
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

export type GetCashManagementOutflowFilters = {
  id?: number;
  number?: string;
  cashManagementId?: number;
  status?: string;
  occurredFrom?: string;
  occurredTo?: string;
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

export type GetCashRegisterFilters = {
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (
  filters?: Omit<GetCashManagementFilters, "baseUrl">,
) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.cashRegisterId?.trim()) {
    params.set("cashRegisterId", filters.cashRegisterId.trim());
  }

  if (filters.responsibleEmployeeId?.trim()) {
    params.set("responsibleEmployeeId", filters.responsibleEmployeeId.trim());
  }

  if (filters.status?.trim()) {
    params.set("status", filters.status.trim());
  }

  if (filters.openedFrom) {
    params.set("openedFrom", filters.openedFrom);
  }

  if (filters.openedTo) {
    params.set("openedTo", filters.openedTo);
  }

  if (filters.page && filters.page > 0) {
    params.set("page", String(filters.page));
    params.set("Page", String(filters.page));
  }

  if (filters.perPage && filters.perPage > 0) {
    params.set("perPage", String(filters.perPage));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const buildConversionQueryString = (
  filters?: Omit<GetCashManagementConversionFilters, "baseUrl">,
) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.page && filters.page > 0) {
    params.set("page", String(filters.page));
    params.set("Page", String(filters.page));
  }

  if (filters.perPage && filters.perPage > 0) {
    params.set("perPage", String(filters.perPage));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const buildOutflowQueryString = (
  filters?: Omit<GetCashManagementOutflowFilters, "baseUrl">,
) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.id) params.set("id", String(filters.id));
  if (filters.number?.trim()) params.set("number", filters.number.trim());
  if (filters.cashManagementId) params.set("cashManagementId", String(filters.cashManagementId));
  if (filters.status?.trim()) params.set("status", filters.status.trim());
  if (filters.occurredFrom) params.set("occurredFrom", filters.occurredFrom);
  if (filters.occurredTo) params.set("occurredTo", filters.occurredTo);

  if (filters.page && filters.page > 0) {
    params.set("page", String(filters.page));
    params.set("Page", String(filters.page));
  }

  if (filters.perPage && filters.perPage > 0) {
    params.set("perPage", String(filters.perPage));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const buildCashRegisterQueryString = (
  filters?: Omit<GetCashRegisterFilters, "baseUrl">,
) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.page && filters.page > 0) {
    params.set("page", String(filters.page));
    params.set("Page", String(filters.page));
  }

  if (filters.perPage && filters.perPage > 0) {
    params.set("perPage", String(filters.perPage));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getCashManagementRecords = async (
  filters?: GetCashManagementFilters,
): Promise<CashManagementResponse> => {
  const queryString = buildQueryString(filters);
  const endpoint = resolveServiceUrl(
    `/api/billing/cash-management${queryString}`,
    {
      baseUrl: filters?.baseUrl,
    },
  );

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
      "Failed to fetch cash management records";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const getCashManagementConversions = async (
  filters?: GetCashManagementConversionFilters,
): Promise<CashManagementConversionResponse> => {
  const queryString = buildConversionQueryString(filters);
  const endpoint = resolveServiceUrl(
    `/api/billing/cash-management/conversion${queryString}`,
    {
      baseUrl: filters?.baseUrl,
    },
  );

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
      "Failed to fetch cash management conversions";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const getCashManagementOutflows = async (
  filters?: GetCashManagementOutflowFilters,
): Promise<CashManagementOutflowResponse> => {
  const queryString = buildOutflowQueryString(filters);
  const endpoint = resolveServiceUrl(
    `/api/billing/cash-management/outflow${queryString}`,
    {
      baseUrl: filters?.baseUrl,
    },
  );

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
      "Failed to fetch cash management outflows";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const getCashRegisters = async (
  filters?: GetCashRegisterFilters,
): Promise<CashRegisterResponse> => {
  const queryString = buildCashRegisterQueryString(filters);
  const endpoint = resolveServiceUrl(
    `/api/billing/cash-register${queryString}`,
    {
      baseUrl: filters?.baseUrl,
    },
  );

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
      "Failed to fetch cash registers";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const getActiveCashManagementByCashRegister = async (
  cashRegisterId: number,
  cookieHeader?: string,
): Promise<CashManagementRecord> => {
  const response = await fetch(
    resolveServiceUrl(
      `/api/billing/cash-management/active/cash-register/${cashRegisterId}`,
    ),
    {
      method: "GET",
      headers: createJsonHeaders(cookieHeader),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to fetch active cash management record";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const getCashManagementClosingSummary = async (
  id: number,
  cookieHeader?: string,
): Promise<CashManagementClosingSummary> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-management/${id}/closing-summary`),
    {
      method: "GET",
      headers: createJsonHeaders(cookieHeader),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to fetch cash management closing summary";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const getCashRegisterById = async (
  id: number,
  baseUrl?: string,
  cookieHeader?: string,
): Promise<CashRegisterResponse["records"][number]> => {
  const endpoint = resolveServiceUrl(`/api/billing/cash-register/${id}`, {
    baseUrl,
  });

  const response = await fetch(endpoint, {
    method: "GET",
    headers: createJsonHeaders(cookieHeader),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to fetch cash register";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const createCashManagementConversion = async (
  payload: CashManagementConversionCreatePayload,
  cookieHeader?: string,
): Promise<void> => {
  const response = await fetch(
    resolveServiceUrl("/api/billing/cash-management/conversion"),
    {
      method: "POST",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to create cash management conversion";

    throw new Error(errorMessage);
  }
};

export const createCashManagementOutflow = async (
  payload: CashManagementOutflowCreatePayload,
  cookieHeader?: string,
): Promise<CashManagementOutflowRecord> => {
  const response = await fetch(
    resolveServiceUrl("/api/billing/cash-management/outflow"),
    {
      method: "POST",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to create cash management outflow";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const createCashRegister = async (
  payload: CashRegisterCreatePayload,
  cookieHeader?: string,
): Promise<CashRegisterResponse["records"][number]> => {
  const response = await fetch(
    resolveServiceUrl("/api/billing/cash-register"),
    {
      method: "POST",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to create cash register";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const updateCashRegister = async (
  id: number,
  payload: CashRegisterUpdatePayload,
  cookieHeader?: string,
): Promise<CashRegisterResponse["records"][number]> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-register/${id}`),
    {
      method: "PUT",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to update cash register";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const createCashManagement = async (
  payload: CashManagementCreatePayload,
  cookieHeader?: string,
): Promise<CashManagementRecord> => {
  const response = await fetch(
    resolveServiceUrl("/api/billing/cash-management"),
    {
      method: "POST",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to create cash management record";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const closeCashManagement = async (
  id: number,
  payload: CashManagementClosePayload,
  cookieHeader?: string,
): Promise<CashManagementRecord> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-management/${id}/close`),
    {
      method: "POST",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to close cash management record";

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const reopenCashManagement = async (
  id: number,
  payload: CashManagementReopenPayload,
  cookieHeader?: string,
): Promise<CashManagementRecord> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-management/${id}/reopen`),
    {
      method: "POST",
      headers: createJsonHeaders(cookieHeader),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      "Failed to reopen cash management record";

    throw new Error(errorMessage);
  }

  return await response.json();
};

// ---- Ingresos / egresos con moneda, libro de caja y desglose actual ----

const readServiceError = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { message?: string; detail?: string } | null)?.message ||
    (errorBody as { message?: string; detail?: string } | null)?.detail ||
    fallback
  );
};

export type GetCashManagementInflowFilters = GetCashManagementOutflowFilters;

export const getCashManagementInflows = async (
  filters?: GetCashManagementInflowFilters,
): Promise<CashManagementInflowResponse> => {
  const queryString = buildOutflowQueryString(filters);
  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-management/inflow${queryString}`, { baseUrl: filters?.baseUrl }),
    { method: "GET", headers: createJsonHeaders(filters?.cookieHeader), cache: "no-store" },
  );
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudieron cargar los ingresos de caja"));
  return await response.json();
};

/** Registra un ingreso. Los errores traen el `detail` del backend (moneda, desglose, concepto...). */
export const createCashManagementInflow = async (
  payload: CashManagementInflowCreatePayload,
): Promise<CashManagementInflowRecord> => {
  const response = await fetch(resolveServiceUrl("/api/billing/cash-management/inflow"), {
    method: "POST",
    headers: createJsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo registrar el ingreso"));
  return await response.json();
};

/** PUT: reemplaza el ingreso completo. Lanza el `detail` del backend. */
export const updateCashManagementInflow = async (
  id: number,
  payload: UpdateCashEntryPayload,
): Promise<CashManagementInflowRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/cash-management/inflow/${id}`), {
    method: "PUT",
    headers: createJsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo editar el ingreso"));
  return await response.json();
};

/** PUT: reemplaza el egreso completo. Lanza el `detail` del backend. */
export const updateCashManagementOutflow = async (
  id: number,
  payload: UpdateCashEntryPayload,
): Promise<CashManagementOutflowRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/cash-management/outflow/${id}`), {
    method: "PUT",
    headers: createJsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo editar el egreso"));
  return await response.json();
};

/** DELETE (borrado lógico): 204 sin contenido. Lanza el `detail` del backend. */
export const deleteCashManagementInflow = async (id: number): Promise<void> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/cash-management/inflow/${id}`), {
    method: "DELETE",
    headers: createJsonHeaders(),
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo eliminar el ingreso"));
};

/** DELETE (borrado lógico): 204 sin contenido. Lanza el `detail` del backend. */
export const deleteCashManagementOutflow = async (id: number): Promise<void> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/cash-management/outflow/${id}`), {
    method: "DELETE",
    headers: createJsonHeaders(),
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo eliminar el egreso"));
};

/** Anula (queda en el historial como anulado y revierte su efecto en caja). Lanza el `detail` del backend. */
const postVoid = async (path: string, fallback: string): Promise<void> => {
  const response = await fetch(resolveServiceUrl(path), { method: "POST", headers: createJsonHeaders() });
  if (!response.ok) throw new Error(await readServiceError(response, fallback));
};

export const voidCashManagementInflow = (id: number) =>
  postVoid(`/api/billing/cash-management/inflow/${id}/void`, "No se pudo anular el ingreso");

export const voidCashManagementOutflow = (id: number) =>
  postVoid(`/api/billing/cash-management/outflow/${id}/void`, "No se pudo anular el egreso");

export const voidCashManagementConversion = (id: number) =>
  postVoid(`/api/billing/cash-management/conversion/${id}/void`, "No se pudo anular la conversión");

export const getCashManagementInflowById = async (id: number): Promise<CashManagementInflowRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/cash-management/inflow/${id}`), {
    method: "GET",
    headers: createJsonHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo cargar el ingreso"));
  return await response.json();
};

export const getCashManagementOutflowById = async (id: number): Promise<CashManagementOutflowRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/cash-management/outflow/${id}`), {
    method: "GET",
    headers: createJsonHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo cargar el egreso"));
  return await response.json();
};

export type GetCashLedgerFilters = {
  search?: string;
  type?: "Ingreso" | "Egreso" | "";
  cashManagementId?: number;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  page?: number;
  perPage?: number;
};

/** Libro de caja: ingresos y egresos juntos (egresos en negativo), con `currency` por fila. */
export const getCashLedger = async (filters?: GetCashLedgerFilters): Promise<CashLedgerResponse> => {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.type) params.set("type", filters.type);
  if (filters?.cashManagementId) params.set("cashManagementId", String(filters.cashManagementId));
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.page && filters.page > 0) params.set("Page", String(filters.page));
  if (filters?.perPage && filters.perPage > 0) params.set("PerPage", String(filters.perPage));
  const query = params.toString();

  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-management/ledger${query ? `?${query}` : ""}`),
    { method: "GET", headers: createJsonHeaders(), cache: "no-store" },
  );
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo cargar el libro de caja"));
  return await response.json();
};

/** Desglose actual de efectivo de una gestión, por moneda. */
export const getCurrentDenominations = async (cashManagementId: number): Promise<CashCurrentDenominations> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/cash-management/${cashManagementId}/denominations/current`),
    { method: "GET", headers: createJsonHeaders(), cache: "no-store" },
  );
  if (!response.ok) throw new Error(await readServiceError(response, "No se pudo cargar el desglose actual de la caja"));
  return await response.json();
};
