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

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) {
    return NextResponse.json(
      { message: 'No autorizado' },
      { status: 401 }
    );
  }

  const body = await req.json();

  console.log('Datos recibidos en el backend:', body); // Agrega este log para verificar los datos

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/bank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.value}`,
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
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
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
      Authorization: `Bearer ${token.value}`,
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
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token'); 

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
      Authorization: `Bearer ${token.value}`,
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