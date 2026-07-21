import {
  AgentsNearGoalsFilters,
  AgentsNearGoalsResponse,
} from "@/app/type/reward-report";
import { createJsonHeaders, resolveServiceUrl } from "@/app/services/http";

type AgentsNearGoalsFiltersWithContext = AgentsNearGoalsFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: AgentsNearGoalsFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.activeOnFrom) params.set("activeOnFrom", filters.activeOnFrom);
  if (filters.activeOnTo) params.set("activeOnTo", filters.activeOnTo);
  if (typeof filters.incentiveRuleId === "number") {
    params.set("incentiveRuleId", String(filters.incentiveRuleId));
  }
  if (filters.incentiveRuleName?.trim()) {
    params.set("incentiveRuleName", filters.incentiveRuleName.trim());
  }
  if (filters.ruleType?.trim()) params.set("ruleType", filters.ruleType.trim());
  if (filters.participantClientType?.trim()) {
    params.set("participantClientType", filters.participantClientType.trim());
  }
  if (filters.clientCode?.trim()) params.set("clientCode", filters.clientCode.trim());
  if (filters.clientName?.trim()) params.set("clientName", filters.clientName.trim());
  if (filters.clientType?.trim()) params.set("clientType", filters.clientType.trim());
  if (filters.promoterCode?.trim()) params.set("promoterCode", filters.promoterCode.trim());
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (typeof filters.page === "number") params.set("Page", String(filters.page));
  if (typeof filters.perPage === "number") params.set("PerPage", String(filters.perPage));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getAgentsNearGoalsReport = async (
  filters?: AgentsNearGoalsFiltersWithContext,
): Promise<AgentsNearGoalsResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/reward/reports/agents-near-goals${buildQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: "GET",
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch agents near goals report");
  }

  return await response.json();
};
