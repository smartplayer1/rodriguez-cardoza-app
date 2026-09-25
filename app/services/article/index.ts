import {
    Article,
    ArticlePriceHistoryResponse,
    ArticleRecord,
    ArticleResponse,
    UpdateArticle,
} from "@/app/type/article";
import { EntityImage } from "@/app/type/entity-image";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

const readImageErrorMessage = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { message?: string; detail?: string } | null)?.detail ||
    (errorBody as { message?: string; detail?: string } | null)?.message ||
    fallback
  );
};

export type GetArticleFilters = {
    id?: number;
    name?: string;
    category?: string;
    code?: string;
    description?: string;
    year?: number;
    month?: number;
    hasPrice?: boolean;
    includeImages?: boolean;
    page?: number;
    perPage?: number;
    baseUrl?: string;
    cookieHeader?: string;
};

const buildQueryString = (filters?: GetArticleFilters) => {
    if (!filters) {
        return '';
    }

    const params = new URLSearchParams();

    if (typeof filters.id === 'number') params.set('id', String(filters.id));
    if (filters.name?.trim()) params.set('name', filters.name.trim());
    if (filters.category?.trim()) params.set('category', filters.category.trim());
    if (filters.code?.trim()) params.set('code', filters.code.trim());
    if (filters.description?.trim()) params.set('description', filters.description.trim());
    if (typeof filters.year === 'number') params.set('year', String(filters.year));
    if (typeof filters.month === 'number') params.set('month', String(filters.month));
    if (typeof filters.hasPrice === 'boolean') params.set('hasPrice', String(filters.hasPrice));
    if (typeof filters.includeImages === 'boolean') params.set('includeImages', String(filters.includeImages));
    if (typeof filters.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
    if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
}

// GET /v1/article ya pagina de verdad (PerPage=10 por defecto): sin Page/
// PerPage solo trae la primera página, no todos los artículos.
export const getArticles = async (filters?: GetArticleFilters): Promise<ArticleResponse> => {
    const res = await fetch(resolveServiceUrl(`/api/article${buildQueryString(filters)}`, {
        baseUrl: filters?.baseUrl,
    }), {
        headers: createJsonHeaders(filters?.cookieHeader),
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch articles');
    }
    return res.json();
}

// Para selectores que necesitan TODOS los artículos (ej. elegir productos de
// un incentivo): recorre las páginas. Sin imágenes por defecto, no se usan.
export const getAllArticles = async (
    filters?: Omit<GetArticleFilters, 'page' | 'perPage'>,
): Promise<ArticleRecord[]> => {
    const perPage = 500;
    const all: ArticleRecord[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const response = await getArticles({ includeImages: false, ...filters, page, perPage });
        all.push(...(response.records ?? []));
        totalPages = response.paging?.totalPages ?? 1;
        page += 1;
    } while (page <= totalPages);

    return all;
}

export type GetArticleDetailFilters = {
    year?: number;
    month?: number;
};

export const getArticleByCode = async (
    code: string,
    filters?: GetArticleDetailFilters,
    context?: ServiceRequestContext,
): Promise<ArticleRecord> => {
    const params = new URLSearchParams();
    if (typeof filters?.year === 'number') params.set('year', String(filters.year));
    if (typeof filters?.month === 'number') params.set('month', String(filters.month));
    const query = params.toString();

    const res = await fetch(
        resolveServiceUrl(`/api/article/${encodeURIComponent(code)}${query ? `?${query}` : ''}`, context),
        { headers: createJsonHeaders(context?.cookieHeader), cache: 'no-store' },
    );

    if (res.status === 404) {
        throw new Error('Artículo no encontrado');
    }
    if (!res.ok) {
        throw new Error(await readImageErrorMessage(res, 'No se pudo cargar el artículo'));
    }

    return res.json();
}

export type GetArticlePriceHistoryFilters = {
    year?: number;
    month?: number;
    page?: number;
    perPage?: number;
};

export const getArticlePriceHistory = async (
    code: string,
    filters?: GetArticlePriceHistoryFilters,
    context?: ServiceRequestContext,
): Promise<ArticlePriceHistoryResponse> => {
    const params = new URLSearchParams();
    if (typeof filters?.year === 'number') params.set('year', String(filters.year));
    if (typeof filters?.month === 'number') params.set('month', String(filters.month));
    if (typeof filters?.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
    if (typeof filters?.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));
    const query = params.toString();

    const res = await fetch(
        resolveServiceUrl(`/api/article/${encodeURIComponent(code)}/prices${query ? `?${query}` : ''}`, context),
        { headers: createJsonHeaders(context?.cookieHeader), cache: 'no-store' },
    );

    if (!res.ok) {
        throw new Error(await readImageErrorMessage(res, 'No se pudo cargar el historial de precios'));
    }

    return res.json();
}

export const createArticle = async (articleData: Article, context?: ServiceRequestContext) => {
    return await fetch(resolveServiceUrl('/api/article', context), {
        method: 'POST',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify(articleData)
    });
}

export const updateArticle = async (articleData: UpdateArticle, context?: ServiceRequestContext) => {
    const res = await fetch(resolveServiceUrl('/api/article', context), {
        method: 'PUT',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify(articleData)
    });

    if (!res.ok) {
        throw new Error('Failed to update article');
    }

    return res.json();
}

export const deleteArticle = async (articleId: number, context?: ServiceRequestContext) => {
    const res = await fetch(resolveServiceUrl('/api/article', context), {
        method: 'DELETE',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify({ id: articleId })
    });

    if (!res.ok) {
        throw new Error('Failed to delete article');
    }

    return res.json();
}

export const getArticleImages = async (
    articleId: number,
    context?: ServiceRequestContext,
): Promise<EntityImage[]> => {
    const response = await fetch(resolveServiceUrl(`/api/article/${articleId}/images`, context), {
        method: 'GET',
        headers: createJsonHeaders(context?.cookieHeader),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(await readImageErrorMessage(response, 'No se pudieron cargar las imágenes del artículo'));
    }

    return response.json();
};

export const uploadArticleImage = async (
    articleId: number,
    file: File,
    context?: ServiceRequestContext,
): Promise<EntityImage> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(resolveServiceUrl(`/api/article/${articleId}/images`, context), {
        method: 'POST',
        headers: context?.cookieHeader ? { Cookie: context.cookieHeader } : undefined,
        body: formData,
    });

    if (!response.ok) {
        throw new Error(await readImageErrorMessage(response, 'No se pudo subir la imagen'));
    }

    return response.json();
};

export const deleteArticleImage = async (
    imageId: number,
    context?: ServiceRequestContext,
): Promise<void> => {
    const response = await fetch(resolveServiceUrl(`/api/article/images/${imageId}`, context), {
        method: 'DELETE',
        headers: createJsonHeaders(context?.cookieHeader),
    });

    if (!response.ok) {
        throw new Error(await readImageErrorMessage(response, 'No se pudo eliminar la imagen'));
    }
};

export const setArticleImagePrimary = async (
    imageId: number,
    context?: ServiceRequestContext,
): Promise<void> => {
    const response = await fetch(resolveServiceUrl(`/api/article/images/${imageId}/primary`, context), {
        method: 'POST',
        headers: createJsonHeaders(context?.cookieHeader),
    });

    if (!response.ok) {
        throw new Error(await readImageErrorMessage(response, 'No se pudo marcar la imagen como principal'));
    }
};

