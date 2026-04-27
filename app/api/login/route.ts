import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
        { message: errorData.message || 'Error al iniciar sesión' },
        { status: res.status }
    );
    }
  const data = await res.json();

  const response = NextResponse.json(data);

  response.cookies.set('token', data.token, {
    httpOnly: true, // 🔐 clave
    secure: true,
    sameSite: 'strict',
    path: '/',
  });

  return response;
}