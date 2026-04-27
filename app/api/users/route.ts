import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();

  const cookieStore = await cookies(); // 🔥 importante
  const token = cookieStore.get('token');

  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.value}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();

    return NextResponse.json(
      { message: errorData.detail || 'Error al crear usuario' },
      { status: res.status }
    );
  }


  const data = await res.json();

  return NextResponse.json(data);
}


export async function PUT(req: Request) {
  const body = await req.json();
 console.log('Datos recibidos para actualización:', body); // 🔍 Debug
  const cookieStore = await cookies(); // 🔥 importante
  const token = cookieStore.get('token');

  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user/${body.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.value}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();

    return NextResponse.json(
      { message: errorData.detail || 'Error al actualizar usuario' },
      { status: res.status }
    );
  }


  const data = await res.json();

  return NextResponse.json(data);
}


export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.value}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || 'Error al obtener usuarios' },
      { status: res.status }
    );
  }

  const data = await res.json();


  return NextResponse.json(data);
}