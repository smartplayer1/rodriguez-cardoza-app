import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown, fallback: string) => {
    if (!body || typeof body !== 'object') {
        return fallback;
    }

    const errorBody = body as { detail?: string; message?: string; error?: string };
    return errorBody.detail || errorBody.message || errorBody.error || fallback;
};

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
    const { id } = await params;

    let token: string | null = null;
    try {
        token = await getValidToken();
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (res.status === 404) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const responseBody = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to fetch branch') },
            { status: res.status },
        );
    }

    return NextResponse.json(responseBody);
}

export async function PUT(req: Request, { params }: RouteParams) {
    const { id } = await params;

    let token: string | null = null;
    try {
        token = await getValidToken();
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const responseBody = await res.json().catch(() => null);
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to update branch') },
            { status: res.status },
        );
    }

    return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    const { id } = await params;

    let token: string | null = null;
    try {
        token = await getValidToken();
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const responseBody = await res.json().catch(() => null);
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to delete branch') },
            { status: res.status },
        );
    }

    return new NextResponse(null, { status: 204 });
}
