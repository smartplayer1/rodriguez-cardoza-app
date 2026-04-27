/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: 'ID inválido' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );

    if (!res.ok) {
      let errorMessage = 'Error al eliminar';

      try {
        const error = await res.json();
        errorMessage = error.detail || errorMessage;
      } catch {
        // fallback si no viene JSON
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /users error:', error);

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}