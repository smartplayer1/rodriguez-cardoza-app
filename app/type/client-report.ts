import { Paging } from '@/app/type/incentive';

export interface ClientWithoutPurchaseRecord {
  clientCode: string;
  clientName: string;
  phoneNumber: string | null;
  canton: string | null;
  clientType: string;
  branchCode: string;
  branchName: string | null;
  promoterCode: string | null;
  promoterName: string | null;
}

export interface ClientsWithoutPurchasesSummary {
  clientCount: number;
}

export interface ClientsWithoutPurchasesRecords {
  records: ClientWithoutPurchaseRecord[];
  paging: Paging;
}

export interface ClientsWithoutPurchasesResponse {
  summary: ClientsWithoutPurchasesSummary;
  records: ClientsWithoutPurchasesRecords;
}

export type ClientsWithoutPurchasesFilters = {
  dateFrom?: string;
  dateTo?: string;
  branchCode?: string;
  clientType?: string;
  clientCode?: string;
  clientName?: string;
  promoterCode?: string;
  canton?: string;
  phoneNumber?: string;
  page?: number;
  perPage?: number;
};
