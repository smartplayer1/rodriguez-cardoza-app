import {
  AccountsReceivableFilters,
  AccountsReceivableResponse,
} from "@/app/type/accounts-receivable-report";
import {
  CashManagementReportFilters,
  CashManagementReportResponse,
} from "@/app/type/cash-management-report";
import {
  CollectionsReportFilters,
  CollectionsReportResponse,
} from "@/app/type/collections-report";
import { createJsonHeaders, resolveServiceUrl } from "@/app/services/http";

type AccountsReceivableFiltersWithContext = AccountsReceivableFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

type CashManagementReportFiltersWithContext = CashManagementReportFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

type CollectionsReportFiltersWithContext = CollectionsReportFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: AccountsReceivableFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (typeof filters.cashRegisterId === "number") {
    params.set("cashRegisterId", String(filters.cashRegisterId));
  }
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (typeof filters.responsibleEmployeeId === "number") {
    params.set("responsibleEmployeeId", String(filters.responsibleEmployeeId));
  }
  if (filters.status?.trim()) params.set("status", filters.status.trim());
  if (typeof filters.page === "number") params.set("Page", String(filters.page));
  if (typeof filters.perPage === "number") params.set("PerPage", String(filters.perPage));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getAccountsReceivableClientPromotersReport = async (
  filters?: AccountsReceivableFiltersWithContext,
): Promise<AccountsReceivableResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/reports/accounts-receivable/client-promoters${buildQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: "GET",
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch accounts receivable report");
  }

  return await response.json();
};

const buildCashManagementReportQueryString = (filters?: CashManagementReportFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (typeof filters.cashRegisterId === "number") {
    params.set("cashRegisterId", String(filters.cashRegisterId));
  }
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (typeof filters.responsibleEmployeeId === "number") {
    params.set("responsibleEmployeeId", String(filters.responsibleEmployeeId));
  }
  if (filters.status?.trim()) params.set("status", filters.status.trim());
  if (typeof filters.page === "number") params.set("Page", String(filters.page));
  if (typeof filters.perPage === "number") params.set("PerPage", String(filters.perPage));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getCashManagementReport = async (
  filters?: CashManagementReportFiltersWithContext,
): Promise<CashManagementReportResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/reports/cash-management${buildCashManagementReportQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: "GET",
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch cash management report");
  }

  return await response.json();
};

const buildCollectionsReportQueryString = (filters?: CollectionsReportFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (typeof filters.cashManagementId === "number") {
    params.set("cashManagementId", String(filters.cashManagementId));
  }
  if (typeof filters.cashRegisterId === "number") {
    params.set("cashRegisterId", String(filters.cashRegisterId));
  }
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (filters.currency?.trim()) params.set("currency", filters.currency.trim());
  if (filters.status?.trim()) params.set("status", filters.status.trim());
  if (filters.paymentMethod?.trim()) params.set("paymentMethod", filters.paymentMethod.trim());
  if (typeof filters.page === "number") params.set("Page", String(filters.page));
  if (typeof filters.perPage === "number") params.set("PerPage", String(filters.perPage));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getCollectionsReport = async (
  filters?: CollectionsReportFiltersWithContext,
): Promise<CollectionsReportResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/reports/collections${buildCollectionsReportQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: "GET",
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch collections report");
  }

  return await response.json();
};
