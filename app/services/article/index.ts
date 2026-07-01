import { Article, UpdateArticle } from "@/app/type/article";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

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

