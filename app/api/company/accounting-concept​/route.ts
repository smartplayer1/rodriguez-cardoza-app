import {NextResponse} from 'next/server';
import { cookies } from 'next/headers';


export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    console.log('Token in GET /accounting-concept:', token);
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate fetching accounting concepts from a database
    const accountingConcepts = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept`, {
        headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json'
        }
    });
    const concepts = await accountingConcepts.json();
    return NextResponse.json(concepts);
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const newConcept = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const concept = await newConcept.json();
    return NextResponse.json(concept);
}