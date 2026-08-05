/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = await getValidToken()

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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorMessage = 'Error al crear usuario';

      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // fallback si no viene JSON
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST /users error:', error);

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const token = await getValidToken()

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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorMessage = 'Error al actualizar usuario';

      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // fallback si no viene JSON
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT /users error:', error);

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const token = await getValidToken()

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
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      let errorMessage = 'Error al obtener usuarios';

      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // fallback si no viene JSON
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /users error:', error);

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}