import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';

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

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error('Failed to fetch branches');
        }
        const branches = await res.json();
        return NextResponse.json(branches);
    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({error: 'Failed to fetch branches'}, {status: 500});
    }
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
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            throw new Error('Failed to create branch');
        }
        const branch = await res.json();
        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error creating branch:', error);
        return NextResponse.json({error: 'Failed to create branch'}, {status: 500});
    }
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
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${body.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            throw new Error('Failed to update branch');
        }
        const branch = await res.json();
        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error updating branch:', error);
        return NextResponse.json({error: 'Failed to update branch'}, {status: 500});
    }
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
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/branch/${body.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error('Failed to delete branch');
        }
        return NextResponse.json({message: 'Branch deleted successfully'});
    } catch (error) {
        console.error('Error deleting branch:', error);
        return NextResponse.json({error: 'Failed to delete branch'}, {status: 500});
    }
}
