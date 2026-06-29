import {
  ClientCouponMovement,
  ClientEarnedReward,
  ClientRewardProgress,
} from '@/app/type/client';

export const getClientRewardProgress = async (
  clientCode: string,
): Promise<ClientRewardProgress[]> => {
  const response = await fetch(`/api/reward/client/${clientCode}/progress`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client reward progress');
  }

  return response.json();
};

export const getClientEarnedRewards = async (
  clientCode: string,
): Promise<ClientEarnedReward[]> => {
  const response = await fetch(`/api/reward/client/${clientCode}/earned-rewards`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client earned rewards');
  }

  return response.json();
};

export const getClientCouponMovements = async (
  clientCode: string,
): Promise<ClientCouponMovement[]> => {
  const response = await fetch(`/api/reward/client/${clientCode}/coupon-movements`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client coupon movements');
  }

  return response.json();
};
