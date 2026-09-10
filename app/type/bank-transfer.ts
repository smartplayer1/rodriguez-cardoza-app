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

// Conciliación bancaria (bank-transfer-import): el frontend lee el Excel del
// banco y manda las filas ya procesadas; el backend NO parsea el archivo.
export interface BankTransferImportRow {
  transferDate: string;
  document: string;
  description: string;
  amount: number;
}

export type ImportBankTransferPayload = BankTransferImportRow[];

export interface ImportBankTransferResultRow {
  id: number;
  transferDate: string;
  document: string;
  amount: number;
  imported: boolean;
  reason: string | null;
}

export interface ImportBankTransferResponse {
  totalReceived: number;
  imported: number;
  skippedDuplicates: number;
  rows: ImportBankTransferResultRow[];
}

export interface ReconcileBankTransferResponse {
  processed: number;
  matched: number;
  noMatch: number;
  ambiguous: number;
}

export type BankTransferImportStatus = 'Pending' | 'Reconciled' | 'NoMatch' | 'Ambiguous';

export interface BankTransferImportRecord {
  id: number;
  transferDate: string;
  document: string;
  description: string;
  amount: number;
  status: BankTransferImportStatus;
  isReconciled: boolean;
  collectionBankTransferId: number | null;
  collectionBankTransferAccountNumber: string | null;
  collectionBankTransferAmount: number | null;
  collectionBankTransferDate: string | null;
}

export interface BankTransferImportListResponse {
  records: BankTransferImportRecord[];
  paging: BankTransferPaging;
}

export interface BankTransferImportFilters {
  isReconciled?: boolean;
  status?: BankTransferImportStatus;
  dateFrom?: string;
  dateTo?: string;
  document?: string;
  page?: number;
  perPage?: number;
}

export interface LinkBankTransferImportPayload {
  collectionBankTransferId: number;
}

export interface ReconcileBankTransferFilters {
  dateFrom?: string;
  dateTo?: string;
  document?: string;
}
