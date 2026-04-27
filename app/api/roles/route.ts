import {NextResponse} from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {

  const cookieStore = await cookies(); // 🔥 importante
  const token = cookieStore.get('token');
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
      Authorization: `Bearer ${token.value}`,
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