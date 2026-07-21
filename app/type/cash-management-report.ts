import { Paging } from '@/app/type/incentive';

export interface CashManagementReportRecord {
  cashManagementId: number;
  cashRegisterId: number;
  cashRegisterCode: string;
  cashRegisterName: string;
  branchCode: string;
  branchName: string | null;
  responsibleEmployeeId: number;
  responsibleEmployeeName: string;
  openedByUserId: string;
  openedByUserName: string;
  closedByUserId: string | null;
  closedByUserName: string | null;
  openedAt: string;
  closedAt: string | null;
  status: string;
  exchangeRateNioPerUsd: number;
  expectedNio: number;
  expectedUsd: number;
  actualNio: number;
  actualUsd: number;
  differenceNio: number;
  differenceUsd: number;
}

export interface CashManagementReportSummary {
  managementCount: number;
  openCount: number;
  closedCount: number;
  expectedNio: number;
  expectedUsd: number;
  actualNio: number;
  actualUsd: number;
  differenceNio: number;
  differenceUsd: number;
}

export interface CashManagementReportRecords {
  records: CashManagementReportRecord[];
  paging: Paging;
}

export interface CashManagementReportResponse {
  summary: CashManagementReportSummary;
  records: CashManagementReportRecords;
}

export type CashManagementReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  cashRegisterId?: number;
  branchCode?: string;
  responsibleEmployeeId?: number;
  status?: string;
  page?: number;
  perPage?: number;
};
