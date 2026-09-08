import {
  RecalculateRewardsPayload,
  RecalculateRewardsResult,
} from '@/app/type/reward';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const recalculateRewards = async (
  payload: RecalculateRewardsPayload,
  context?: ServiceRequestContext,
): Promise<RecalculateRewardsResult> => {
  const response = await fetch(resolveServiceUrl('/api/reward/recalculate', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to recalculate rewards';
    throw new Error(message);
  }

  return response.json();
};
