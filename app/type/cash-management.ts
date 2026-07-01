export type CashManagementDenomination = {
  currency: string;
  denomination: number;
  quantity: number;
  total: number;
};

export type CashManagementCreateDenomination = {
  currency: string;
  denomination: number;
  quantity: number;
};

export type CashManagementCreatePayload = {
  cashRegisterId: number;
  responsibleEmployeeId: number;
  exchangeRateNioPerUsd: number;
  observation: string | null;
  denominations: CashManagementCreateDenomination[];
};

export type CashManagementClosePayload = {
  observation: string | null;
  denominations: CashManagementCreateDenomination[];
};

export type CashManagementBalance = {
  cashManagementId: number;
  nio: number;
  usd: number;
};

export type CashManagementRecord = {
  id: number;
  cashRegisterId: number;
  cashRegisterCode: string;
  cashRegisterName: string;
  responsibleEmployeeId: number;
  responsibleEmployeeName: string;
  openedByUserId: string;
  openedByUserName: string;
  openedAt: string;
  closedByUserId: string | null;
  closedByUserName: string | null;
  closedAt: string | null;
  exchangeRateNioPerUsd: number;
  status: string;
  openingObservation: string;
  closingObservation: string;
  balance: CashManagementBalance;
  expectedNioAtClose: number;
  expectedUsdAtClose: number;
  actualNioAtClose: number;
  actualUsdAtClose: number;
  differenceNioAtClose: number;
  differenceUsdAtClose: number;
  openingDenominations: CashManagementDenomination[];
  closingDenominations: CashManagementDenomination[];
};

export type CashManagementPaging = {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
};

export type CashManagementResponse = {
  records: CashManagementRecord[];
  paging: CashManagementPaging;
};

export type CashManagementConversionAllocation = {
  collectionId: number;
  usdAmount: number;
  appliedAmountNio: number;
};

export type CashManagementConversionRecord = {
  id: number;
  cashManagementId: number;
  direction: string;
  exchangeRateNioPerUsd: number;
  sourceTotal: number;
  targetTotal: number;
  theoreticalTargetTotal: number;
  exchangeDifference: number;
  convertedAt: string;
  status: string;
  observation: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  sourceDenominations: CashManagementDenomination[];
  targetDenominations: CashManagementDenomination[];
  allocations: CashManagementConversionAllocation[];
};

export type CashManagementConversionResponse = {
  records: CashManagementConversionRecord[];
  paging: CashManagementPaging;
};

export type CashManagementConversionCreateAllocation = {
  collectionId: number;
  usdAmount: number;
};

export type CashManagementConversionCreatePayload = {
  cashManagementId: number;
  direction: 'USD_TO_NIO' | 'NIO_TO_USD';
  observation: string | null;
  sourceDenominations: CashManagementCreateDenomination[];
  targetDenominations: CashManagementCreateDenomination[];
};

export type CashManagementOutflowCreatePayload = {
  cashManagementId: number;
  number: string;
  occurredAt: string;
  concept: string;
  description: string | null;
  creditNoteId: number | null;
  denominations: CashManagementCreateDenomination[];
};

export type CashManagementOutflowRecord = {
  id: number;
  cashManagementId: number;
  number: string;
  occurredAt: string;
  concept: string;
  description: string | null;
  total: number;
  status: string;
  creditNoteId: number | null;
  voidedAt: string | null;
  voidedBy: string | null;
  denominations: CashManagementDenomination[];
};

export type CashManagementOutflowResponse = {
  records: CashManagementOutflowRecord[];
  paging: CashManagementPaging;
};

export type CashRegisterRecord = {
  id: number;
  name: string;
  description: string;
  code: string;
  branchId: number;
  branchName: string;
};

export type CashRegisterResponse = {
  records: CashRegisterRecord[];
  paging: CashManagementPaging;
};

export type CashRegisterCreatePayload = {
  name: string;
  description: string;
  code: string;
  branchId: number;
};

export type CashRegisterUpdatePayload = {
  name: string | null;
  description: string | null;
  code: string | null;
  branchId: number | null;
};