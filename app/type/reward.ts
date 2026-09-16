import type { ClientEarnedReward, EarnedRewardStatus } from '@/app/type/client';
import type { Paging } from '@/app/type/incentive';

export interface MonthlyAccrualSetting {
  id: number;
  purchaseAmountThreshold: number;
  couponBonusAmount: number;
  expirationDays: number;
  isActive: boolean;
}

export interface UpdateMonthlyAccrualSettingPayload {
  purchaseAmountThreshold?: number;
  couponBonusAmount?: number;
  expirationDays?: number;
  isActive?: boolean;
}

export interface RunMonthlyAccrualPayload {
  period?: string;
}

export interface RunMonthlyAccrualResult {
  periodStart: string;
  clientsCredited: number;
  totalAmountCredited: number;
}

export interface RecalculateRewardsPayload {
  month: string;
}

export interface RecalculateRewardsResult {
  period: string;
  clientsProcessed: number;
  clientsFailed: number;
  failedClientCodes: string[];
}

export interface CouponConsistencyFlag {
  id: number;
  invoiceId: number;
  invoiceDocument: string;
  clientCode: string;
  period: string;
  indicatedCouponAmount: number;
  monthCumulativeCouponAmount: number;
  monthCumulativeNetTotal: number;
  expectedMonthlyBonusAmount: number;
  detectedAt: string;
}

export type CouponConsistencyFlagFilters = {
  clientCode?: string;
  period?: string;
};

// Listado administrativo (global, no por cliente) de premios ganados por
// incentivos, con filtros y paginación.
export interface EarnedRewardRecord extends ClientEarnedReward {
  clientCode: string;
  clientName: string;
  sourceInvoiceIssuedAt: string;
}

export type EarnedRewardListFilters = {
  clientCode?: string;
  incentiveRuleId?: number;
  status?: EarnedRewardStatus;
  rewardType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
};

export interface EarnedRewardListResponse {
  records: EarnedRewardRecord[];
  paging: Paging;
}
