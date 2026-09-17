import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown, fallback: string) => {
    if (!body || typeof body !== 'object') {
        return fallback;
    }

    const errorBody = body as { detail?: string; message?: string; error?: string };
    return errorBody.detail || errorBody.message || errorBody.error || fallback;
};

export async function GET() {
    let token: string | null = null;
    try {
        token = await getValidToken();
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/localities/department`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    const responseBody = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to fetch departments') },
            { status: res.status },
        );
    }

    return NextResponse.json(responseBody);
}
