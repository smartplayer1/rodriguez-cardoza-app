import type { BankTransferApplication } from "./bank-transfer";

export type SaleType =
  | "ENTREGA INMEDIATA"
  | "DELIVERY INMEDIATO"
  | "DELIVERY PENDIENTE"
  | "RETIRO EN TIENDA";

export const SALE_TYPE_OPTIONS: SaleType[] = [
  "ENTREGA INMEDIATA",
  "DELIVERY INMEDIATO",
  "DELIVERY PENDIENTE",
  "RETIRO EN TIENDA",
];

export interface ServerInvoicePayload {
  // A nivel raíz, hermano de header/details — no dentro de header. El
  // backend de POST /v1/invoice lo espera ahí; mandarlo dentro de header
  // hace que llegue como si no se hubiera mandado ("cashManagementId es
  // requerido para facturas normales").
  cashManagementId: number;
  header: {
    document: string;
    chargeStatus: string;
    clientCode: string;
    warehouse: number;
    branchCode: string;
    cashier: string;
    issuedAt: string;
    store: string;
    promoterCode: string;
    priceLevel: string;
    saleType: SaleType;
    coupon: number;
  };
  details: Array<{
    article: string;
    quantity: number;
    salePrice: number;
    price: number;
    tax1: number;
    tax2: number;
    lineDiscount: number;
    generalDiscount: number;
    isExempt: string;
  }>;
  collectionBankTransferIds?: number[];
}

export interface ServerInvoiceResponse {
  header: {
    id: number;
    document: string;
    chargeStatus: string;
    clientCode: string;
    clientName: string;
    warehouse: number;
    branchCode: string;
    cashier: string;
    issuedAt: string;
    store: string;
    promoterCode: string;
    promoterName: string;
    priceLevel: string;
    saleType: SaleType | string;
    coupon: number;
    grossTotal: number;
    lineDiscountTotal: number;
    generalDiscountTotal: number;
    tax1Total: number;
    tax2Total: number;
    netTotal: number;
    totalItems: number;
    currentDetailVersion: number;
    isVoided: boolean;
    // Gestión de caja donde se registró; null = factura histórica (no se puede anular).
    cashManagementId?: number | null;
  };
  details: Array<{
    id: number;
    article: string;
    quantity: number;
    salePrice: number;
    price: number;
    tax1: number;
    tax2: number;
    lineDiscount: number;
    generalDiscount: number;
    isExempt: string;
  }>;
}

export interface InvoicePostResult {
  ok: boolean;
  status: number;
  document: string;
  invoice: ServerInvoiceResponse | null;
  error: unknown;
}

export interface InvoiceBatchPostResponse {
  message: string;
  total: number;
  success?: number;
  failed?: number;
  results: InvoicePostResult[];
}

export interface InvoicePaging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface InvoiceListResponse {
  records: ServerInvoiceResponse[];
  paging: InvoicePaging;
}

export interface CreditCollectionSummary {
  id: number;
  number: string;
  collectionDate: string;
  currency: string;
  receivedAmount: number;
  appliedAmountNio: number;
  changeTotalNio: number;
  cashManagementId: number | null;
  applicationStatus: string;
  status: string;
}

export interface CreditInvoiceRecord {
  invoiceId: number;
  document: string;
  clientCode: string;
  clientName: string;
  /** Promotor de la factura. `promoterName` llega "" si no está en el catálogo de clientes. */
  promoterCode: string;
  promoterName: string;
  chargeStatus: string;
  isVoided: boolean;
  invoiceAmountNio: number;
  paidAmountNio: number;
  remainingBalanceNio: number;
  isCredit: boolean;
  collectionCount: number;
  collections: CreditCollectionSummary[];
  /** Parte de `paidAmountNio` pagada con transferencias (ya incluida; no sumar de nuevo). */
  bankTransferAmountNio?: number;
  bankTransferApplications?: BankTransferApplication[];
}

// Respuesta 201 de POST /v1/invoice/batch/with-credit-notes.
// `invoices` y `creditNotes` traen SOLO lo creado; lo que ya existía o venía
// repetido se omite sin error. Omitidos = enviados − length de cada lista.
export interface ImportInvoicesAndCreditNotesResult {
  invoices: ServerInvoiceResponse[];
  creditNotes: {
    number: string;
    success: boolean;
    skipped: boolean;
    creditNote: unknown | null;
    errors: string[];
  }[];
}

export interface CreditInvoiceListResponse {
  records: CreditInvoiceRecord[];
  paging: InvoicePaging;
}

export interface InvoiceGetFilters {
  document?: string;
  chargeStatus?: string;
  clientCode?: string;
  clientName?: string;
  promoterCode?: string;
  branchCode?: string;
  issuedAt?: string;
  page?: number;
  perPage?: number;
}

export interface ServerInvoiceUpdateHeaderPayload {
  id: number;
  chargeStatus: string | null;
  clientCode: string | null;
  warehouse: number | null;
  branchCode: string | null;
  cashier: string | null;
  issuedAt: string | null;
  store: string | null;
  promoterCode: string | null;
  priceLevel: string | null;
  saleType: SaleType | null;
  coupon: number | null;
}

export interface ServerInvoiceUpdateDetailPayload {
  id: number;
  article: string;
  quantity: number;
  salePrice: number;
  price: number;
  tax1: number;
  tax2: number;
  lineDiscount: number;
  generalDiscount: number;
  isExempt: string;
}

export interface ServerInvoiceUpdatePayload {
  header: ServerInvoiceUpdateHeaderPayload;
  details: ServerInvoiceUpdateDetailPayload[] | null;
}
