// Fila del Excel de importación de artículos (ya normalizada).
// Clase y Estado vacíos = no se envían (no se modifica el artículo existente).
export interface ArticleExcel {
    Codigo: string,
    Nombre: string,
    Categoria: string,
    Descripcion?: string,
    Clase?: string,
    Estado?: string,
    /** Número de fila en el Excel (para reportar errores). */
    fila?: number,
}

// POST /v1/article: crea el artículo o, si el código existe, lo actualiza.
export interface Article{
  name:string,
  category: string,
  code: string,
  description: string,
  /** Si no viene (o viene vacío) no se modifica la clase del artículo existente. */
  articleClass?: string | null,
  /** Si no viene no se modifica el estado; un artículo nuevo se crea activo. */
  isActive?: boolean,
}
export interface UpdateArticle {
  id: number;
  code: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  articleClass?: string | null;
  isActive?: boolean | null;
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
  articleClass: string | null;
  isActive: boolean;
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