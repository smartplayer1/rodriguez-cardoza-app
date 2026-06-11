import { CouponResponse,  CreateCouponPayload} from "@/app/type/reward";
export interface UpdateCouponPayload extends CreateCouponPayload {
  id: number;
}

export const getRewardCoupon = async (): Promise<CouponResponse> => {
  const response = await fetch('/api/reward/coupon', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reward coupons');
  }

  return await response.json();
};

export const createRewardCoupon = async (couponData: CreateCouponPayload) => {
  const response = await fetch('/api/reward/coupon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create reward coupon');
  }

  return response.json();
};

export const updateRewardCoupon = async (couponData: UpdateCouponPayload) => {
  const response = await fetch('/api/reward/coupon', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update reward coupon');
  }

  return response.json();
};

export const deleteRewardCoupon = async (couponId: number) => {
  const response = await fetch('/api/reward/coupon', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: couponId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to delete reward coupon');
  }

  return response.json();
};
