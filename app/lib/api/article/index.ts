import { Article, UpdateArticle } from "@/app/type/article";

export const getArticles = async () => {
    const res = await fetch('/api/article');
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

