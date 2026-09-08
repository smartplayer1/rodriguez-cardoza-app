import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown, fallback: string) => {
    if (!body || typeof body !== 'object') {
        return fallback;
    }

    const errorBody = body as { detail?: string; message?: string; error?: string };
    return errorBody.detail || errorBody.message || errorBody.error || fallback;
};

export async function GET(request: Request) {
    let token: string | null = null;
    try {
        token = await getValidToken()
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const responseBody = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to fetch branches') },
            { status: res.status },
        );
    }

    return NextResponse.json(responseBody);
}

export async function POST(req: Request) {
    let token: string | null = null;
    try {
        token = await getValidToken()
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const responseBody = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to create branch') },
            { status: res.status },
        );
    }

    return NextResponse.json(responseBody);
}

export async function PUT(req: Request) {
    let token: string | null = null;
    try {
        token = await getValidToken()
    } catch {
        token = null;
    }

    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${body.id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const responseBody = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to update branch') },
            { status: res.status },
        );
    }

    return NextResponse.json(responseBody);
}

export async function DELETE(req: Request) {
    let token: string | null = null;
    try {
        token = await getValidToken()
    } catch {
        token = null;
    }
    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${body.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const responseBody = await res.json().catch(() => null);
        return NextResponse.json(
            { error: readErrorMessage(responseBody, 'Failed to delete branch') },
            { status: res.status },
        );
    }

    return NextResponse.json({message: 'Branch deleted successfully'});
}
