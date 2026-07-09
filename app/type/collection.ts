export type CollectionRecord = {
  id: number;
  name: string;
  description: string;
  code: string;
  branchId: number;
  branchName: string;
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
