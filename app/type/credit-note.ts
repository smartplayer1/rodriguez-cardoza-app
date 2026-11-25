export interface CreditNoteDetail {
  invoiceLineId: number;
  quantity: number;
}

export interface CreditNoteImportDetail {
  invoiceLineId: number | null;
  article: string;
  quantity: number;
  salePrice: number;
  price: number;
  tax1: number;
  tax2: number;
  lineDiscount: number;
  generalDiscount: number;
  isExempt: string | null;
}

export interface CreditNoteImportPayload {
  number: string;
  invoiceId: number | null;
  invoiceDocument: string;
  startDate: string;
  details: CreditNoteImportDetail[];
}

export interface CreditNoteCreatePayload {
  number: string;
  invoiceId: number | null;
  invoiceDocument: string | null;
  cashManagementId: number;
  startDate: string;
  details: CreditNoteDetail[];
}

export interface CreditNoteHeader {
  id: number;
  number: string;
  advisorCode: string;
  invoiceId: number | null;
  invoiceDocument: string | null;
  startDate: string;
  total: number;
  // Lo ya aplicado a facturas y lo que queda disponible para aplicar.
  appliedAmountNio: number;
  availableAmountNio: number;
  status: string;
  cashManagementId: number | null;
  cashRegisterId: number | null;
  cashRegisterCode: string | null;
  cashRegisterName: string | null;
  issuedBy: string | null;
}

export interface CreditNoteDetailRecord {
  id: number;
  invoiceLineId: number;
  article: string;
  quantity: number;
  salePrice: number;
  price: number;
  tax1: number;
  tax2: number;
  lineDiscount: number;
  generalDiscount: number;
  isExempt: string;
  total: number;
}

export interface CreditNoteRecord {
  header: CreditNoteHeader;
  details: CreditNoteDetailRecord[];
}

export interface CreditNotePaging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface CreditNoteListResponse {
  records: CreditNoteRecord[];
  paging: CreditNotePaging;
}

export interface CreditNoteApplyPayload {
  targetInvoiceId: number;
  cashManagementId: number;
  amountNio: number | null;
  observation: string | null;
}

// Aplicación de una nota de crédito a una factura (GET /credit-note/{id}/applications).
export interface CreditNoteApplication {
  id: number;
  creditNoteId: number;
  creditNoteNumber: string;
  sourceInvoiceId: number;
  sourceInvoiceDocument: string;
  targetInvoiceId: number;
  targetInvoiceDocument: string;
  cashManagementId: number;
  appliedAmountNio: number;
  observation: string | null;
  status: string; // "Activo" | "Anulado"
  createdAt: string;
  voidedAt: string | null;
  voidedBy: string | null;
}

// POST /credit-note/{id}/apply y POST /credit-note/application/{id}/void devuelven la aplicación.
export type CreditNoteApplyResult = CreditNoteApplication;
