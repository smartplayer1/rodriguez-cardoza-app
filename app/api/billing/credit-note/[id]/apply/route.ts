import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al aplicar la nota de credito';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al aplicar la nota de credito';
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  let token: string | undefined;

  try {
    token = await getValidToken();
  } catch {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'NEXT_PUBLIC_API_URL no esta configurada' },
      { status: 500 },
    );
  }

  const { id } = await context.params;
  const body = await req.json();

  try {
    const response = await fetch(`${apiBaseUrl}/v1/billing/credit-note/${id}/apply`, {
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
        {
          message: readErrorMessage(responseBody),
          error: responseBody,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de red al aplicar la nota de credito';

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
