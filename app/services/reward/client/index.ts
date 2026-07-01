import {
  ClientCouponMovement,
  ClientEarnedReward,
  ClientRewardProgress,
} from '@/app/type/client';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getClientRewardProgress = async (
  clientCode: string,
  context?: ServiceRequestContext,
): Promise<ClientRewardProgress[]> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/client/${clientCode}/progress`, context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client reward progress');
  }

  return response.json();
};

export const getClientEarnedRewards = async (
  clientCode: string,
  context?: ServiceRequestContext,
): Promise<ClientEarnedReward[]> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/client/${clientCode}/earned-rewards`, context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client earned rewards');
  }

  return response.json();
};

export const getClientCouponMovements = async (
  clientCode: string,
  context?: ServiceRequestContext,
): Promise<ClientCouponMovement[]> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/client/${clientCode}/coupon-movements`, context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client coupon movements');
  }

  return response.json();
};
