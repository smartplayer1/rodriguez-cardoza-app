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
  accountingConceptId: number | null;
  accountingConceptName: string | null;
  accountingConceptCategoryName: string | null;
  isRelated: boolean;
  /** Número de documento (= accountNumber). */
  document?: string;
  /** Suma de aplicaciones activas a facturas (NIO). */
  appliedAmountNio?: number;
  /** Saldo por aplicar (NIO). 0 si la transferencia se usó en un cobro. */
  availableAmountNio?: number;
  applications?: BankTransferApplication[];
}

export type BankTransferApplicationStatus = 'ACTIVE' | 'VOIDED';

// Aplicación (parcial o total) de una transferencia a una factura.
export interface BankTransferApplication {
  id: number;
  collectionBankTransferId: number;
  transferDocument: string;
  transferDate: string | null;
  transferAmount: number | null;
  bankName: string;
  invoiceId: number;
  invoiceDocument: string;
  clientCode: string;
  cashManagementId: number;
  appliedAmountNio: number;
  observation: string | null;
  status: BankTransferApplicationStatus | string;
  createdAt: string;
  createdBy: string;
  voidedAt: string | null;
  voidedBy: string | null;
}

// POST /v1/billing/bank-transfer/{id}/apply (todo o nada). Sin amountNio el
// backend aplica min(saldo de la transferencia, pendiente de la factura).
export interface ApplyBankTransferPayload {
  cashManagementId: number;
  observation?: string | null;
  invoices: { invoiceId: number; amountNio?: number }[];
}

export interface AvailableBankTransferFilters {
  search?: string;
  companyBankAccountId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface BankTransferApplicationFilters {
  cashManagementId?: number;
  invoiceId?: number;
  collectionBankTransferId?: number;
  status?: BankTransferApplicationStatus;
  page?: number;
  perPage?: number;
}

export interface BankTransferApplicationListResponse {
  records: BankTransferApplication[];
  paging: BankTransferPaging;
}

export interface AccountingConceptOption {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
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
  accountingConceptId?: number | null;
}

// PUT /v1/billing/bank-transfer/{id}: mismos campos que al crear.
export type UpdateBankTransferPayload = CreateBankTransferPayload;

export interface UpdateBankTransferAccountingConceptPayload {
  accountingConceptId: number | null;
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
