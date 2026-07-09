import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al consultar cobros';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al consultar cobros';
};

export async function GET(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const queryString = requestUrl.searchParams.toString();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/collection${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        message: readErrorMessage(responseBody),
        error: responseBody,
      },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody);
}

export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
console.log('body', body);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/collection`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    },
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        message: readErrorMessage(responseBody),
        error: responseBody,
      },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody, { status: 201 });
}
