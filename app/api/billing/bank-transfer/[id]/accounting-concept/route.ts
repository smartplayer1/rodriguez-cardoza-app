import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al asignar el concepto contable a la transferencia';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return (
    errorBody.detail || errorBody.message || errorBody.error || 'Error al asignar el concepto contable a la transferencia'
  );
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/bank-transfer/${id}/accounting-concept`,
    {
      method: 'PUT',
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
      { message: readErrorMessage(responseBody), error: responseBody },
      { status: response.status },
    );
  }

  return NextResponse.json(responseBody);
}
