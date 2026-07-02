export interface ServerInvoicePayload {
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

export interface InvoiceGetFilters {
  document?: string;
  chargeStatus?: string;
  clientCode?: string;
  branchCode?: string;
  issuedAt?: string;
  page?: number;
  perPage?: number;
}

export interface ServerInvoiceUpdateHeaderPayload {
  id: number;
  cashManagementId: number | null;
  document: string | null;
  chargeStatus: string | null;
  clientCode: string | null;
  clientName: string | null;
  warehouse: number | null;
  branchCode: string | null;
  cashier: string | null;
  issuedAt: string | null;
  store: string | null;
  promoterCode: string | null;
  promoterName: string | null;
  priceLevel: string | null;
  coupon: number | null;
  grossTotal: number | null;
  lineDiscountTotal: number | null;
  generalDiscountTotal: number | null;
  tax1Total: number | null;
  tax2Total: number | null;
  netTotal: number | null;
  totalItems: number | null;
  currentDetailVersion: number | null;
  isVoided: boolean | null;
}

export interface ServerInvoiceUpdateDetailPayload {
  id: number;
  article: string | null;
  quantity: number | null;
  salePrice: number | null;
  price: number | null;
  tax1: number | null;
  tax2: number | null;
  lineDiscount: number | null;
  generalDiscount: number | null;
  isExempt: string | null;
}

export interface ServerInvoiceUpdatePayload {
  header: ServerInvoiceUpdateHeaderPayload;
  details: ServerInvoiceUpdateDetailPayload[];
}
