import { Article, UpdateArticle } from "@/app/type/article";

export type GetArticleFilters = {
    name?: string;
    category?: string;
    code?: string;
    description?: string;
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
    const res = await fetch(`/api/article${buildQueryString(filters)}`);
    if (!res.ok) {
        throw new Error('Failed to fetch articles');
    }
    return res.json();
}

export const createArticle = async (articleData: Article) => {
    return await fetch('/api/article', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
    });
}

export const updateArticle = async (articleData: UpdateArticle) => {
    const res = await fetch('/api/article', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
    });

    if (!res.ok) {
        throw new Error('Failed to update article');
    }

    return res.json();
}

export const deleteArticle = async (articleId: number) => {
    const res = await fetch('/api/article', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: articleId })
    });

    if (!res.ok) {
        throw new Error('Failed to delete article');
    }

    return res.json();
}

