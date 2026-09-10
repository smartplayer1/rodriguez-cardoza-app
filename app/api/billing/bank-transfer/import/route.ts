import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al procesar la conciliación bancaria';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al procesar la conciliación bancaria';
};

const toUtcIso = (value: string, boundary: 'start' | 'end') => {
  const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';
  const date = new Date(`${value}T${time}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export async function GET(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const params = new URLSearchParams(requestUrl.searchParams);

  const dateFrom = params.get('dateFrom');
  if (dateFrom) {
    const utcValue = toUtcIso(dateFrom, 'start');
    if (utcValue) params.set('dateFrom', utcValue);
  }

  const dateTo = params.get('dateTo');
  if (dateTo) {
    const utcValue = toUtcIso(dateTo, 'end');
    if (utcValue) params.set('dateTo', utcValue);
  }

  const queryString = params.toString();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/bank-transfer/import${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
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

export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/billing/bank-transfer/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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
