import { Paging } from '@/app/type/incentive';

export interface SalesInvoiceRecord {
  invoiceId: number;
  document: string;
  issuedAt: string;
  clientCode: string;
  clientName: string | null;
  promoterCode: string;
  promoterName: string | null;
  branchCode: string;
  branchName: string | null;
  cashier: string;
  chargeStatus: string;
  grossTotal: number;
  discountTotal: number;
  taxTotal: number;
  netTotal: number;
  isVoided: boolean;
}

export interface SalesInvoicesSummary {
  invoiceCount: number;
  grossTotal: number;
  lineDiscountTotal: number;
  generalDiscountTotal: number;
  tax1Total: number;
  tax2Total: number;
  netTotal: number;
  voidedCount: number;
}

export interface SalesInvoicesRecords {
  records: SalesInvoiceRecord[];
  paging: Paging;
}

export interface SalesInvoicesResponse {
  summary: SalesInvoicesSummary;
  records: SalesInvoicesRecords;
}

export type SalesInvoicesFilters = {
  dateFrom?: string;
  dateTo?: string;
  branchCode?: string;
  clientCode?: string;
  promoterCode?: string;
  cashier?: string;
  chargeStatus?: string;
  includeVoided?: boolean;
  page?: number;
  perPage?: number;
};
