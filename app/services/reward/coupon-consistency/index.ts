import { CouponConsistencyFlag, CouponConsistencyFlagFilters } from '@/app/type/reward';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

type CouponConsistencyFlagFiltersWithContext = CouponConsistencyFlagFilters & ServiceRequestContext;

const buildQueryString = (filters?: CouponConsistencyFlagFiltersWithContext) => {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.clientCode?.trim()) params.set('clientCode', filters.clientCode.trim());
  if (filters.period) params.set('period', filters.period);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const getCouponConsistencyFlags = async (
  filters?: CouponConsistencyFlagFiltersWithContext,
): Promise<CouponConsistencyFlag[]> => {
  const response = await fetch(
    resolveServiceUrl(`/api/reward/coupon-consistency-flags${buildQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: 'GET',
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch coupon consistency flags');
  }

  return await response.json();
};
