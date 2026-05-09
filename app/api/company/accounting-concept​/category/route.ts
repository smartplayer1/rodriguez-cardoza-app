import {NextResponse} from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    console.log('Token in GET /accounting-concept:', token);
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept-category`, {
        headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json'
        }
    });

    if (!categories.ok) {
        const errorData = await categories.json();
        return NextResponse.json({ error: errorData.detail || 'Failed to fetch accounting concept categories' },
             { status: categories.status });
    }   

    const categoryList = await categories.json();
    return NextResponse.json(categoryList);

}