import { NextResponse } from 'next/server';
import { getValidToken } from '@/app/lib/helper';

export async function GET() {
   const token = await getValidToken();
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
      Authorization: `Bearer ${token}`,
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

export async function POST(req: Request) {
   const token = await getValidToken();
  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const body = await req.json();


  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/bank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: body.name, acronymun: body.acronymus }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || 'Error al crear banco' },
      { status: res.status }
    );
  }

  const data = await res.json();

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  try{
   const token = await getValidToken();
  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { id,  name, acronymus } = body; 

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/bank/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, acronymus }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || 'Error al actualizar banco' },
      { status: res.status }
    );
  }

  return NextResponse.json({ message: 'Banco actualizado correctamente' });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { message: 'Error al actualizar el banco: ' + errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }
  
  const body = await req.json();
  const { id } = body;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/bank/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || 'Error al eliminar banco' },
      { status: res.status }
    );
  }

  return NextResponse.json({ message: 'Banco eliminado correctamente' });
}