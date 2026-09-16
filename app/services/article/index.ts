import { Article, UpdateArticle } from "@/app/type/article";
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
    name?: string;
    category?: string;
    code?: string;
    description?: string;
    baseUrl?: string;
    cookieHeader?: string;
};

const buildQueryString = (filters?: GetArticleFilters) => {
    if (!filters) {
        return '';
    }

    const params = new URLSearchParams();

    if (filters.name?.trim()) params.set('name', filters.name.trim());
    if (filters.category?.trim()) params.set('category', filters.category.trim());
    if (filters.code?.trim()) params.set('code', filters.code.trim());
    if (filters.description?.trim()) params.set('description', filters.description.trim());

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
}

export const getArticles = async (filters?: GetArticleFilters) => {
    const res = await fetch(resolveServiceUrl(`/api/article${buildQueryString(filters)}`, {
        baseUrl: filters?.baseUrl,
    }), {
        headers: createJsonHeaders(filters?.cookieHeader),
    });
    if (!res.ok) {
        throw new Error('Failed to fetch articles');
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

