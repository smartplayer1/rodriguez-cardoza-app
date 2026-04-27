import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  const body = await req.json();

  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user/${body?.id}/change-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();

    return NextResponse.json(
      { message: errorData.detail || 'Error al cambiar contraseña' },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
