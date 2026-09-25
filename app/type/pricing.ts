// Todos los porcentajes son fracción (0.20 = 20%), no 0-100.
export interface PriceCategory {
  id: number;
  category: string;
  catalogMarkupPercent: number;
  advisorMarkupPercent: number;
  distributorMarkupPercent: number;
  publicPriceMarkupPercent: number;
}

export interface PriceCategoryPaging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface PriceCategoryResponse {
  records: PriceCategory[];
  paging: PriceCategoryPaging;
}

export interface ArticlePricingBatchRow {
  articleCode: string;
  category: string;
  netPrice: number;
  discountPercent: number;
}

export interface ArticlePricingPeriod {
  year: number;
  month: number;
}

export interface ArticlePricingBatchRequest extends ArticlePricingPeriod {
  rows: ArticlePricingBatchRow[];
}

export interface ArticlePricingBatchResult {
  articleCode: string;
  success: boolean;
  netPrice: number | null;
  catalogPrice: number | null;
  advisorPrice: number | null;
  distributorPrice: number | null;
  publicPrice: number | null;
  errors: string[];
}
