import { getValidToken } from '@/app/lib/helper';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientCode: string }> }
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { clientCode } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/reward/client/${clientCode}/progress`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { message: errorData?.detail || 'Error al obtener progreso del cliente' },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
