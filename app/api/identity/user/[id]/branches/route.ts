import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let token: string | null = null;
  try {
    token = await getValidToken();
  } catch {
    token = null;
  }
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user/${id}/branches`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Failed to update user branches');
    }
    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user branches:', error);
    return NextResponse.json({ error: 'Failed to update user branches' }, { status: 500 });
  }
}
