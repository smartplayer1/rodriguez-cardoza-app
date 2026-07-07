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
  status: string;
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
