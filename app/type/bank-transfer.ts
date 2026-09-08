export interface BankTransferRecord {
  id: number;
  accountNumber: string;
  companyBankAccountId: number;
  companyBankAccountDescription: string;
  bankName: string;
  transferDate: string;
  amount: number;
  collectionId: number | null;
  cashManagementId: number | null;
  isRelated: boolean;
}

export interface BankTransferPaging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface BankTransferListResponse {
  records: BankTransferRecord[];
  paging: BankTransferPaging;
}

export interface CreateBankTransferPayload {
  accountNumber: string;
  companyBankAccountId: number;
  transferDate: string;
  amount: number;
  cashManagementId?: number | null;
}
