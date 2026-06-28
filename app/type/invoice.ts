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
    warehouse: number;
    branchCode: string;
    cashier: string;
    issuedAt: string;
    store: string;
    promoterCode: string;
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
