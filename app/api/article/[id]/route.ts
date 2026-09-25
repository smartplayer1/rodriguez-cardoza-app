import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

// Nota: el segmento se llama [id] (y no [code]) porque Next no permite
// nombres distintos para el mismo segmento dinámico y ya existe
// article/[id]/images. Acá el valor es el CÓDIGO del artículo.
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
    const { id: code } = await params;

    const token = await getValidToken();
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = new URL(request.url).search;

    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/article/${encodeURIComponent(code)}${query}`,
            { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
        );

        const body = await res.json().catch(() => null);

        if (!res.ok) {
            const message =
                (body as { detail?: string; message?: string } | null)?.detail ||
                (body as { detail?: string; message?: string } | null)?.message ||
                'Failed to fetch article';
            return NextResponse.json({ error: message }, { status: res.status });
        }

        return NextResponse.json(body);
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }
}
