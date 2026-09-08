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
  periodStart: string;
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
