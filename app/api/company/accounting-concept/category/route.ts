import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';

export async function GET() {
    const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting-concept-category`, {
        headers: {
            Authorization: `Bearer ${token}`,
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