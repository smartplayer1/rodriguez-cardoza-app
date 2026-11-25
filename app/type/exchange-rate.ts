// Tipo de cambio diario: cuántos córdobas (NIO) vale un dólar (USD) desde effectiveDate.
// El backend guarda uno por día; las operaciones usan el vigente más reciente a su fecha.
export interface ExchangeRate {
  id: number;
  effectiveDate: string;
  nioPerUsd: number;
  observation: string;
  createdBy: string;
  createdAt: string;
}

export interface ExchangeRatePaging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface ExchangeRateListResponse {
  records: ExchangeRate[];
  paging: ExchangeRatePaging;
}

export interface ExchangeRateFilters {
  effectiveDateFrom?: string; // YYYY-MM-DD
  effectiveDateTo?: string; // YYYY-MM-DD
  page?: number;
  perPage?: number;
}

export interface CreateExchangeRatePayload {
  effectiveDate: string; // YYYY-MM-DD
  nioPerUsd: number;
  observation: string | null;
}
