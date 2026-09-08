export interface ClienteResponse {
  id: number;
  code: string;
  name: string;
  phoneNumber: string | null;
  idNumber: string;
  address: string | null;
  canton: string | null;
  province: string | null;
  district: string | null;
  clientType: string;
  zoneCode: string;
  dateOfEntry: string;
  isZermat: boolean;
  promoter: {
    id: number;
    code: string;
    name: string;
  };
  branch: {
    id: number;
    name: string;
    code: string;
  };
}

export interface Paging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface Client {
  id: number | null;
  code: string;
  name: string;
  phoneNumber: string | null;
  idNumber: string;
  clientType: string;
  zoneCode: string;
  dateOfEntry: string;
  creator: string;
  branchCode: string;
  address: string | null;
  province: string | null;
  district: string | null;
  canton: string | null;
  promotorCode: string;
}

export interface ErrorResponse {
 "type": string | null,
  "title": string | null,
  "status": number | null,
  "detail": string | null,
  "instance": string | null
}

export interface ClientErrorItem {
  fila: number;
  name: string;
  error: string;
  titulo: string;
}


export interface ClienteExcel {
  code: string;
  name: string;
  phoneNumber: string | null;
  idNumber: string | null;
  address: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  clientType: string;
  zoneCode: string;
  dateOfEntry: string;
  promoterCode: string;
  branchName: string | null;
}

export interface ClientRewardProgress {
  incentiveRuleId: number;
  incentiveRuleName: string;
  ruleType: string;
  amountProgress: number;
  amountCondition: number;
  productVolumeProgress: number;
  productVolumeTargetQuantity: number;
  winsCount: number;
  maxWinsPerClient: number | null;
}

export interface EarnedRewardArticle {
  articleCode: string;
  articleName: string;
  category: string;
  description: string;
  quantity: number;
}

export interface ClientEarnedReward {
  id: number;
  incentiveRuleId: number;
  incentiveRuleName: string;
  sourceInvoiceId: number;
  sourceInvoiceDocument: string;
  sequence: number;
  rewardType: string;
  status: string;
  articleCode: string | null;
  quantity: number;
  article?: EarnedRewardArticle | null;
}

export interface RewardLedgerStatus {
  clientCode: string;
  isRewardLedgerClosed: boolean;
  rewardLedgerClosedAt: string | null;
  rewardLedgerClosedBy: string | null;
}

export type EarnedRewardStatus = 'Pending' | 'Credited';

export interface UpdateEarnedRewardPayload {
  status?: EarnedRewardStatus;
  articleCode?: string;
  quantity?: number;
}

export interface ClientCouponMovement {
  id: number;
  movementType: 'MonthlyAccrualCredit' | 'MonthlyAccrualDebit';
  invoiceId: number | null;
  invoiceDocument: string | null;
  amount: number;
  remainingAmount: number | null;
  appliedAt: string;
}

export interface ClientCouponBalance {
  clientCode: string;
  totalBalance: number;
}

export type UpdateClientPayload = {
  Code?: string;
  Name?: string;
  PhoneNumber?: string | null;
  IDNumber?: string;
  ClientType?: 'ASESOR' | 'PROMOTOR';
  ZoneCode?: string;
  DateOfEntry?: string;
  Address?: string | null;
  Province?: string | null;
  District?: string | null;
  Canton?: string | null;
  BranchCode?: string;
  PromoterCode?: string;
  IsZermat?: boolean;
};