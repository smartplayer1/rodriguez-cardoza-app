import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';



export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/bank`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.value}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || 'Error al obtener bancos' },
      { status: res.status }
    );
  }

  const data = await res.json();


  return NextResponse.json(data);
}