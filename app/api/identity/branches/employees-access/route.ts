import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

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

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/branches/employees-access`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch branch employees access');
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching branch employees access:', error);
    return NextResponse.json({ error: 'Failed to fetch branch employees access' }, { status: 500 });
  }
}
