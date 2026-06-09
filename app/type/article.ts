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
export interface ArticleRecord {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
}

export interface ArticleResponse {
  records: ArticleRecord[];
  paging: {
    perPage: number;
    currentPage: number;
    totalRecords: number;
    totalPages: number;
  };
}