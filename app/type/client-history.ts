// GET /v1/client/{code}/history
// Todos los montos están en córdobas (NIO) y los totales ya vienen
// calculados por el backend (no se recalculan en pantalla).

export interface ClientHistoryFilters {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD (incluye todo ese día)
}

export interface ClientHistoryClient {
  id: number;
  code: string;
  name: string;
  clientType: string;
  phoneNumber: string | null;
  dateOfEntry: string | null;
  branchCode: string | null;
  branchName: string | null;
  promoterCode: string | null;
  promoterName: string | null;
}

export interface ClientHistorySummary {
  invoiceCount: number;
  voidedInvoiceCount: number;
  invoicedTotal: number;
  paidTotal: number;
  creditedTotal: number;
  pendingBalance: number;
  creditNoteCount: number;
  creditNoteTotal: number;
  paymentCount: number;
  paymentTotal: number;
  transferCount: number;
  transferTotal: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
}

export interface ClientHistoryInvoice {
  invoiceId: number;
  document: string;
  issuedAt: string;
  dueDate: string | null;
  branchCode: string | null;
  promoterCode: string | null;
  cashier: string | null;
  chargeStatus: string;
  saleType: string;
  netTotal: number;
  paidAmountNio: number;
  creditedAmountNio: number;
  cashSalePaidAmountNio: number;
  remainingBalanceNio: number;
  isVoided: boolean;
}

export interface ClientHistoryCreditNote {
  creditNoteId: number;
  number: string;
  startDate: string;
  status: string;
  total: number;
  appliedAmountNio: number;
  invoiceId: number | null;
  invoiceDocument: string | null;
  cashManagementId: number | null;
}

export interface ClientHistoryPaymentInvoice {
  invoiceId: number;
  document: string;
  amountNio: number;
}

export interface ClientHistoryPayment {
  collectionId: number;
  number: string;
  collectionDate: string;
  currency: string;
  cashTotal: number;
  transferTotal: number;
  total: number;
  changeTotalNio: number;
  appliedToClientNio: number;
  status: string;
  voidedAt: string | null;
  cashRegisterCode: string | null;
  branchCode: string | null;
  invoices: ClientHistoryPaymentInvoice[];
}

export interface ClientHistoryTransfer {
  transferId: number;
  transferDate: string;
  amount: number;
  accountNumber: string | null;
  bankName: string | null;
  accountingConcept: string | null;
  collectionId: number | null;
  collectionNumber: string | null;
  collectionStatus: string | null;
  invoiceDocuments: string[] | string | null;
}

export interface ClientHistoryArticle {
  article: string;
  purchasedQuantity: number;
  purchasedTotal: number;
  invoiceCount: number;
  lastPurchaseAt: string | null;
  creditedQuantity: number;
  creditedTotal: number;
}

export interface ClientHistoryResponse {
  client: ClientHistoryClient;
  summary: ClientHistorySummary;
  invoices: ClientHistoryInvoice[];
  creditNotes: ClientHistoryCreditNote[];
  payments: ClientHistoryPayment[];
  transfers: ClientHistoryTransfer[];
  articles: ClientHistoryArticle[];
}
