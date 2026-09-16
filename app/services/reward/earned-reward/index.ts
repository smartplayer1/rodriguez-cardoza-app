import { ClientEarnedReward, UpdateEarnedRewardPayload } from '@/app/type/client';
import { EarnedRewardListFilters, EarnedRewardListResponse } from '@/app/type/reward';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

const extractErrorMessage = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { message?: string; detail?: string } | null)?.message ||
    (errorBody as { message?: string; detail?: string } | null)?.detail ||
    fallback
  );
};

const buildEarnedRewardsQueryString = (filters?: EarnedRewardListFilters) => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.clientCode?.trim()) params.set('clientCode', filters.clientCode.trim());
  if (typeof filters.incentiveRuleId === 'number') params.set('incentiveRuleId', String(filters.incentiveRuleId));
  if (filters.status) params.set('status', filters.status);
  if (filters.rewardType?.trim()) params.set('rewardType', filters.rewardType.trim());
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (typeof filters.page === 'number' && filters.page > 0) params.set('page', String(filters.page));
  if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('perPage', String(filters.perPage));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getEarnedRewards = async (
  filters?: EarnedRewardListFilters & ServiceRequestContext,
): Promise<EarnedRewardListResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/reward/earned-rewards${buildEarnedRewardsQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: 'GET',
      headers: createJsonHeaders(filters?.cookieHeader),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudieron cargar los premios ganados'));
  }

  return response.json();
};

export const updateEarnedReward = async (
  id: number,
  payload: UpdateEarnedRewardPayload,
  context?: ServiceRequestContext,
): Promise<ClientEarnedReward> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/earned-reward/${id}`, context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudo editar el premio ganado'));
  }

  return response.json();
};

export const deleteEarnedReward = async (
  id: number,
  context?: ServiceRequestContext,
): Promise<void> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/earned-reward/${id}`, context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudo eliminar el premio ganado'));
  }
};
