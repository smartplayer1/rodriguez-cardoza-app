import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown, fallback: string) => {
  if (!body || typeof body !== 'object') {
    return fallback;
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || fallback;
};

const resolveToken = async () => {
  try {
    return await getValidToken();
  } catch {
    return null;
  }
};

export async function GET(req: Request) {
  const token = await resolveToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const queryString = requestUrl.searchParams.toString();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/company/job-role${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody, 'Error al consultar cargos') },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody);
}

export async function POST(req: Request) {
  const token = await resolveToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/job-role`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody, 'Error al crear cargo') },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody, { status: 201 });
}

export async function PUT(req: Request) {
  const token = await resolveToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/job-role/${body.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody, 'Error al actualizar cargo') },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody);
}

export async function DELETE(req: Request) {
  const token = await resolveToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/company/job-role/${body.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody, 'Error al eliminar cargo') },
      { status: response.status },
    );
  }

  return NextResponse.json({ success: true });
}
