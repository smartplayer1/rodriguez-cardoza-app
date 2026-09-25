export interface ArticleExcel {
    Codigo: string,
    Nombre: string,
    Categoria: string
}

export interface Article{
  name:string,
  category: string,
  code: string,
  description: string

}
export interface UpdateArticle {
  id: number;
  code: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
}
export interface ArticleImage {
  id: number;
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
  isPrimary: boolean;
}

// Los campos de precio vienen en null cuando el artículo no tiene precio en
// el período consultado ("Sin precio") — no tratarlos como 0.
// discountPercent es fracción (0.10 = 10%).
export interface ArticleRecord {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  basePrice?: number | null;
  discountPercent?: number | null;
  netPrice?: number | null;
  catalogPrice?: number | null;
  advisorPrice?: number | null;
  distributorPrice?: number | null;
  publicPrice?: number | null;
  priceYear?: number | null;
  priceMonth?: number | null;
  primaryImageUrl?: string | null;
  images?: ArticleImage[];
}

export interface ArticlePaging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface ArticleResponse {
  records: ArticleRecord[];
  paging: ArticlePaging;
}

export interface ArticlePriceHistoryRecord {
  id: number;
  articleId: number;
  articleCode: string;
  year: number;
  month: number;
  basePrice: number;
  discountPercent: number;
  netPrice: number;
  catalogMarkupPercent: number;
  catalogPrice: number;
  advisorMarkupPercent: number;
  advisorPrice: number;
  distributorMarkupPercent: number;
  distributorPrice: number;
  publicPriceMarkupPercent: number;
  publicPrice: number;
  calculatedAt: string;
}

export interface ArticlePriceHistoryResponse {
  records: ArticlePriceHistoryRecord[];
  paging: ArticlePaging;
}