import { CouponResponse,  CreateCouponPayload} from "@/app/type/reward";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';
export interface UpdateCouponPayload extends CreateCouponPayload {
  id: number;
}

export const getRewardCoupon = async (context?: ServiceRequestContext): Promise<CouponResponse> => {
  const response = await fetch(resolveServiceUrl('/api/reward/coupon', context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reward coupons');
  }

  return await response.json();
};

export const createRewardCoupon = async (couponData: CreateCouponPayload, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/reward/coupon', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create reward coupon');
  }

  return response.json();
};

export const updateRewardCoupon = async (couponData: UpdateCouponPayload, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/reward/coupon', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update reward coupon');
  }

  return response.json();
};

export const deleteRewardCoupon = async (couponId: number, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/reward/coupon', context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id: couponId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to delete reward coupon');
  }

  return response.json();
};
