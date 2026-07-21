import { Paging } from '@/app/type/incentive';

export interface CollectionReportAppliedInvoice {
  invoiceId: number;
  document: string;
  clientCode: string;
  clientName: string | null;
  amountNio: number;
}

export interface CollectionsReportRecord {
  collectionId: number;
  number: string;
  collectionDate: string;
  currency: string;
  cashTotal: number;
  transferTotal: number;
  totalReceived: number;
  appliedAmountNio: number;
  status: string;
  cashManagementId: number | null;
  cashRegisterId: number;
  cashRegisterCode: string;
  cashRegisterName: string;
  branchCode: string;
  branchName: string | null;
  appliedInvoices: CollectionReportAppliedInvoice[];
}

export interface CollectionsReportSummary {
  collectionCount: number;
  cashTotal: number;
  transferTotal: number;
  totalReceived: number;
  appliedAmountNio: number;
}

export interface CollectionsReportRecords {
  records: CollectionsReportRecord[];
  paging: Paging;
}

export interface CollectionsReportResponse {
  summary: CollectionsReportSummary;
  records: CollectionsReportRecords;
}

export type CollectionsReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  cashManagementId?: number;
  cashRegisterId?: number;
  branchCode?: string;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  page?: number;
  perPage?: number;
};
