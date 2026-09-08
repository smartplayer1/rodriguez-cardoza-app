import {
  MonthlyAccrualSetting,
  RunMonthlyAccrualPayload,
  RunMonthlyAccrualResult,
  UpdateMonthlyAccrualSettingPayload,
} from '@/app/type/reward';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getMonthlyAccrualSetting = async (
  context?: ServiceRequestContext,
): Promise<MonthlyAccrualSetting> => {
  const response = await fetch(resolveServiceUrl('/api/reward/monthly-accrual-setting', context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch monthly accrual setting');
  }

  return response.json();
};

export const updateMonthlyAccrualSetting = async (
  payload: UpdateMonthlyAccrualSettingPayload,
  context?: ServiceRequestContext,
): Promise<MonthlyAccrualSetting> => {
  const response = await fetch(resolveServiceUrl('/api/reward/monthly-accrual-setting', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to update monthly accrual setting';
    throw new Error(message);
  }

  return response.json();
};

export const runMonthlyAccrual = async (
  payload?: RunMonthlyAccrualPayload,
  context?: ServiceRequestContext,
): Promise<RunMonthlyAccrualResult> => {
  const response = await fetch(resolveServiceUrl('/api/reward/monthly-accrual/run', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload ?? {}),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to run monthly accrual';
    throw new Error(message);
  }

  return response.json();
};
