export type CollectionRecord = {
  id: number;
  name: string;
  description: string;
  code: string;
  branchId: number;
  branchName: string;
};

export type CollectionCashDetail = {
  denomination: number;
  quantity: number;
};

export type CollectionBankTransfer = {
  accountNumber: string;
  companyBankAccountId: number;
  transferDate: string;
  amount: number;
};

export type CollectionCreatePayload = {
  number: string;
  invoiceId: number | null;
  invoiceDocument: string | null;
  cashManagementId: number;
  currency: string;
  collectionDate: string;
  description: string | null;
  cashDetails: CollectionCashDetail[];
  bankTransfers: CollectionBankTransfer[];
  changeDetails: CollectionCashDetail[];
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
