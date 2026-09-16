import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al procesar la imagen del artículo';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al procesar la imagen del artículo';
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article/${id}/images`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody), error: responseBody },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await req.formData();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article/${id}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody), error: responseBody },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody, { status: 201 });
}
