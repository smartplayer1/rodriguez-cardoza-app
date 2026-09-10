import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al ejecutar la conciliación bancaria';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al ejecutar la conciliación bancaria';
};

export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const queryString = requestUrl.searchParams.toString();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/bank-transfer/import/reconcile${queryString ? `?${queryString}` : ''}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { message: readErrorMessage(responseBody), error: responseBody },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody);
}
