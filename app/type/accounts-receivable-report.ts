import { Paging } from '@/app/type/incentive';

export interface ClientPromoterReceivableRecord {
  clientCode: string;
  clientName: string;
  clientType: string;
  promoterCode: string;
  promoterName: string | null;
  invoiceDate: string;
  invoiceNumber: string;
  invoiceTotalNio: number;
  paidAmountNio: number;
  pendingBalanceNio: number;
  dueDate: string | null;
  branchCode: string;
  branchName: string | null;
  branchCanton: string | null;
}

export interface AccountsReceivableSummary {
  invoiceCount: number;
  invoiceTotalNio: number;
  paidTotalNio: number;
  pendingBalanceTotalNio: number;
}

export interface AccountsReceivableRecords {
  records: ClientPromoterReceivableRecord[];
  paging: Paging;
}

export interface AccountsReceivableResponse {
  summary: AccountsReceivableSummary;
  records: AccountsReceivableRecords;
}

export type AccountsReceivableFilters = {
  dateFrom?: string;
  dateTo?: string;
  cashRegisterId?: number;
  branchCode?: string;
  responsibleEmployeeId?: number;
  status?: string;
  page?: number;
  perPage?: number;
};
