import {
  ClientCouponBalance,
  ClientCouponMovement,
  ClientEarnedReward,
  ClientRewardProgress,
  RewardLedgerStatus,
} from '@/app/type/client';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

const extractErrorMessage = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { message?: string; detail?: string } | null)?.message ||
    (errorBody as { message?: string; detail?: string } | null)?.detail ||
    fallback
  );
};

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

export const getClientCouponBalance = async (
  clientCode: string,
  context?: ServiceRequestContext,
): Promise<ClientCouponBalance> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/client/${clientCode}/coupon-balance`, context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client coupon balance');
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

export const closeClientRewardLedger = async (
  clientCode: string,
  context?: ServiceRequestContext,
): Promise<RewardLedgerStatus> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/client/${clientCode}/reward-ledger/close`, context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudo cerrar el ledger de recompensas'));
  }

  return response.json();
};

export const reopenClientRewardLedger = async (
  clientCode: string,
  context?: ServiceRequestContext,
): Promise<RewardLedgerStatus> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/client/${clientCode}/reward-ledger/reopen`, context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudo reabrir el ledger de recompensas'));
  }

  return response.json();
};
