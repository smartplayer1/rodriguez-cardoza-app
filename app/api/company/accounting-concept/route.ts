import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';


export async function GET() {
   const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate fetching accounting concepts from a database
    const accountingConcepts = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const concepts = await accountingConcepts.json();
    return NextResponse.json(concepts);
}

export async function POST(req: Request) {
     const token = await getValidToken()

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const newConcept = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const concept = await newConcept.json();
    return NextResponse.json(concept);
}

export async function DELETE(req: Request) {
     const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept/${body.id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const errorData = await res.json();
        return NextResponse.json({ error: errorData.detail || 'Failed to delete accounting concept' }, { status: res.status });
    }
    return NextResponse.json({ message: 'Concepto contable eliminado exitosamente' });    
}