import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';

export async function GET(request: Request) {
   const token = await getValidToken();

    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    try {
        const requestUrl = new URL(request.url);
        const queryString = requestUrl.searchParams.toString();

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article${queryString ? `?${queryString}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error('Failed to fetch articles');
        }
        const articles = await res.json();
        return NextResponse.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json({error: 'Failed to fetch articles'}, {status: 500});
    }
}

export async function POST(req: Request) {
     const token = await getValidToken();
    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    const body = await req.json();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const response = await res.json()
        if (!res.ok) {
            return NextResponse.json({message: 'Error al crear el articulo, ' + response.detail},{status: res.status})
        }
      
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json({error: 'Failed to create article'}, {status: 500});
    }
}

export async function PUT(req: Request) {
    const token = await getValidToken();
    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    const body = await req.json();
    console.log(body)
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article/${body.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error('Failed to update article');
        }
        const article = await res.json();
        return NextResponse.json(article);
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json({error: 'Failed to update article'}, {status: 500});
    }
}

export async function DELETE(req: Request) {
    const token = await getValidToken();
    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    const body = await req.json();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article/${body.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }); 
        if (!res.ok) {
            throw new Error('Failed to delete article');
        }
        return NextResponse.json({message: 'Article deleted successfully'});
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json({error: 'Failed to delete article'}, {status: 500});
    }
}