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
  couponId: number | null;
  couponName: string | null;
  couponAmount: number;
}

export interface ClientCouponMovement {
  id: number;
  movementType: string;
  incentiveRuleId: number | null;
  incentiveRuleName: string | null;
  invoiceId: number;
  invoiceDocument: string;
  couponId: number;
  couponName: string;
  amount: number;
  remainingAmount: number | null;
  appliedAt: string;
}