import {
  ClientsWithoutPurchasesFilters,
  ClientsWithoutPurchasesResponse,
} from "@/app/type/client-report";
import { createJsonHeaders, resolveServiceUrl } from "@/app/services/http";

type ClientsWithoutPurchasesFiltersWithContext = ClientsWithoutPurchasesFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: ClientsWithoutPurchasesFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (filters.clientType?.trim()) params.set("clientType", filters.clientType.trim());
  if (filters.clientCode?.trim()) params.set("clientCode", filters.clientCode.trim());
  if (filters.clientName?.trim()) params.set("clientName", filters.clientName.trim());
  if (filters.promoterCode?.trim()) params.set("promoterCode", filters.promoterCode.trim());
  if (filters.canton?.trim()) params.set("canton", filters.canton.trim());
  if (filters.phoneNumber?.trim()) params.set("phoneNumber", filters.phoneNumber.trim());
  if (typeof filters.page === "number") params.set("Page", String(filters.page));
  if (typeof filters.perPage === "number") params.set("PerPage", String(filters.perPage));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getClientsWithoutPurchasesReport = async (
  filters?: ClientsWithoutPurchasesFiltersWithContext,
): Promise<ClientsWithoutPurchasesResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/clients/reports/without-purchases${buildQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: "GET",
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch clients without purchases report");
  }

  return await response.json();
};
