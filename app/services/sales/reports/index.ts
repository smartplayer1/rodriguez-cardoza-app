import {
  SalesInvoicesFilters,
  SalesInvoicesResponse,
} from "@/app/type/sales-report";
import { createJsonHeaders, resolveServiceUrl } from "@/app/services/http";

type SalesInvoicesFiltersWithContext = SalesInvoicesFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: SalesInvoicesFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (filters.clientCode?.trim()) params.set("clientCode", filters.clientCode.trim());
  if (filters.promoterCode?.trim()) params.set("promoterCode", filters.promoterCode.trim());
  if (filters.cashier?.trim()) params.set("cashier", filters.cashier.trim());
  if (filters.chargeStatus?.trim()) params.set("chargeStatus", filters.chargeStatus.trim());
  if (typeof filters.includeVoided === "boolean") {
    params.set("includeVoided", String(filters.includeVoided));
  }
  if (typeof filters.page === "number") params.set("Page", String(filters.page));
  if (typeof filters.perPage === "number") params.set("PerPage", String(filters.perPage));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getSalesInvoicesReport = async (
  filters?: SalesInvoicesFiltersWithContext,
): Promise<SalesInvoicesResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/sales/reports/invoices${buildQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: "GET",
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sales invoices report");
  }

  return await response.json();
};
