import {
  CashManagementClosePayload,
  CashManagementClosingSummary,
  CashManagementConversionCreatePayload,
  CashManagementConversionResponse,
  CashManagementCreatePayload,
  CashManagementOutflowCreatePayload,
  CashManagementOutflowResponse,
  CashManagementReopenPayload,
  CashRegisterCreatePayload,
  CashRegisterResponse,
  CashRegisterUpdatePayload,
  CashManagementRecord,
  CashManagementResponse,
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
): Promise<void> => {
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
