import {
  IncentiveProgressFilters,
  IncentiveProgressResponse,
} from "@/app/type/incentive";
import { createJsonHeaders, resolveServiceUrl } from '@/app/services/http';

type IncentiveProgressFiltersWithContext = IncentiveProgressFilters & {
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: IncentiveProgressFiltersWithContext) => {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.clientCode?.trim()) {
    params.set("clientCode", filters.clientCode.trim());
  }

  if (typeof filters.incentiveRuleId === "number") {
    params.set("incentiveRuleId", String(filters.incentiveRuleId));
  }

  if (filters.incentiveRuleName?.trim()) {
    params.set("incentiveRuleName", filters.incentiveRuleName.trim());
  }

  if (filters.ruleType?.trim()) {
    params.set("ruleType", filters.ruleType.trim());
  }

  if (filters.participantClientType?.trim()) {
    params.set("participantClientType", filters.participantClientType.trim());
  }

  if (typeof filters.isActive === "boolean") {
    params.set("isActive", String(filters.isActive));
  }

  if (filters.startDateFrom) params.set("startDateFrom", filters.startDateFrom);
  if (filters.startDateTo) params.set("startDateTo", filters.startDateTo);
  if (filters.endDateFrom) params.set("endDateFrom", filters.endDateFrom);
  if (filters.endDateTo) params.set("endDateTo", filters.endDateTo);
  if (filters.withdrawalStartDateFrom) {
    params.set("withdrawalStartDateFrom", filters.withdrawalStartDateFrom);
  }
  if (filters.withdrawalStartDateTo) {
    params.set("withdrawalStartDateTo", filters.withdrawalStartDateTo);
  }
  if (filters.withdrawalDeadlineFrom) {
    params.set("withdrawalDeadlineFrom", filters.withdrawalDeadlineFrom);
  }
  if (filters.withdrawalDeadlineTo) {
    params.set("withdrawalDeadlineTo", filters.withdrawalDeadlineTo);
  }
  if (filters.contributionDateFrom) {
    params.set("contributionDateFrom", filters.contributionDateFrom);
  }
  if (filters.contributionDateTo) {
    params.set("contributionDateTo", filters.contributionDateTo);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const getRewardIncentiveProgress = async (
  filters?: IncentiveProgressFiltersWithContext,
): Promise<IncentiveProgressResponse> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/progress${buildQueryString(filters)}`, {
    baseUrl: filters?.baseUrl,
  }), {
    method: "GET",
    headers: createJsonHeaders(filters?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reward incentive progress");
  }

  return await response.json();
};
