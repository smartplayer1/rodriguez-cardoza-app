import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/client/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        return NextResponse.json({ error: errorData?.detail || 'Failed to update client' }, { status: res.status });
    }

    return new NextResponse(null, { status: 200 });
}
