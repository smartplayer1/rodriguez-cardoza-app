export type CollectionHeader = {
  id: number;
  number: string;
  invoiceId: number;
  invoiceDocument: string;
  invoiceCount: number;
  cashRegisterId: number;
  cashManagementId: number | null;
  currency: string;
  applicationStatus: string;
  cashRegisterCode: string;
  cashRegisterName: string;
  collectionDate: string;
  description: string | null;
  status: string;
  voidedAt: string | null;
  voidedBy: string | null;
};

export type CollectionSummary = {
  cashTotal: number;
  transferTotal: number;
  total: number;
  appliedAmountNio: number;
  appliedAmountUsd: number;
  pendingAmountUsd: number;
  changeTotalNio: number;
};

export type CollectionInvoiceAllocationDetail = {
  id: number;
  invoiceId: number;
  invoiceDocument: string;
  clientCode: string;
  invoiceAmountNio: number;
  previousPaidAmountNio: number;
  appliedAmountNio: number;
  remainingBalanceNio: number;
};

export type CollectionDenominationDetail = {
  id: number;
  denomination: number;
  quantity: number;
  total: number;
};

export type CollectionCompanyBankAccount = {
  id: number;
  accountNumber: string;
  description: string;
  bankId: number;
  bankName: string;
};

export type CollectionBankTransferDetail = {
  id: number;
  accountNumber: string;
  companyBankAccountId: number;
  transferDate: string;
  amount: number;
  companyBankAccount: CollectionCompanyBankAccount;
};

export type CollectionRecord = {
  header: CollectionHeader;
  summary: CollectionSummary;
  invoiceAllocations: CollectionInvoiceAllocationDetail[];
  cashDetails: CollectionDenominationDetail[];
  changeDetails: CollectionDenominationDetail[];
  bankTransfers: CollectionBankTransferDetail[];
};

export type CollectionBankTransfer = {
  accountNumber: string;
  companyBankAccountId: number;
  transferDate: string;
  amount: number;
};

export type InvoiceAllocations = {
  invoiceId: number;
  amountNio: number;
}

export type CollectionCreatePayload = {
  number: string;
  cashManagementId: number;
  currency: string;
  collectionDate: string;
  description: string | null;
  cashAmount: number;
  bankTransfers: CollectionBankTransfer[];
  invoiceAllocations: InvoiceAllocations[];
};

export type CollectionPaging = {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
};

export type CollectionListResponse = {
  records: CollectionRecord[];
  paging: CollectionPaging;
};
