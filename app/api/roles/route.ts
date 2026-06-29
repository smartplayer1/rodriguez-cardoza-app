import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';

export async function GET() {

  const token = await getValidToken();
    if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/role`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

    if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.message || 'Error al obtener roles' },
      { status: res.status }
    );
  }

    const data = await res.json();
    return NextResponse.json(data);

}

export async function POST(req: Request) {

  const token = await getValidToken();
    if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const body = await req.json();

   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

    if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { message: errorData?.detail || errorData?.message || 'Error al crear rol' },
      { status: res.status }
    );
  }

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
}