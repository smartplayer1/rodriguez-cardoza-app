import { CreatePromotionRequest, IncentiveResponse, Promotion } from "@/app/type/incentive";

export type GetIncentiveRuleFilters = {
  name?: string;
  ruleType?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  withdrawalStartDate?: string;
  withdrawalDeadline?: string;
};

const buildQueryString = (filters?: GetIncentiveRuleFilters) => {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.name?.trim()) params.set('name', filters.name.trim());
  if (filters.ruleType?.trim()) params.set('ruleType', filters.ruleType.trim());
  if (typeof filters.isActive === 'boolean') params.set('isActive', String(filters.isActive));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.withdrawalStartDate) params.set('withdrawalStartDate', filters.withdrawalStartDate);
  if (filters.withdrawalDeadline) params.set('withdrawalDeadline', filters.withdrawalDeadline);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const getRewardIncentiveRules = async (filters?: GetIncentiveRuleFilters): Promise<IncentiveResponse> => {
  const response = await fetch(`/api/reward/incentive-rule${buildQueryString(filters)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reward incentive rules');
  }

  return await response.json();
};

export const createRewardIncentiveRule = async (incentiveData: CreatePromotionRequest): Promise<Promotion> => {
  const response = await fetch('/api/reward/incentive-rule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(incentiveData),
  });

  if (!response.ok) {
    throw new Error('Failed to create reward incentive rule');
  }

  return await response.json();
};

export const updateRewardIncentiveRule = async (incentiveData: CreatePromotionRequest): Promise<Promotion> => {
  const response = await fetch('/api/reward/incentive-rule', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(incentiveData),
  });

  if (!response.ok) {
    throw new Error('Failed to update reward incentive rule');
  }

  return await response.json();
};

export const deleteRewardIncentiveRule = async (incentiveId: number): Promise<void> => {
  const response = await fetch('/api/reward/incentive-rule', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: incentiveId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete reward incentive rule');
  }
};