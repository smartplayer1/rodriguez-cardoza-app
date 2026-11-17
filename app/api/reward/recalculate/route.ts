import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';
import { postJsonWithoutTimeout } from '@/app/lib/long-request';

// El recálculo puede tardar varios minutos: se usa http/https de Node en vez
// de fetch, que corta a los 5 minutos sin respuesta (HeadersTimeoutError).
export const runtime = 'nodejs';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al recalcular las recompensas';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al recalcular las recompensas';
};

export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const response = await postJsonWithoutTimeout(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/reward/recalculate`,
      body,
      { Authorization: `Bearer ${token}` },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: readErrorMessage(response.body), error: response.body },
        { status: response.status },
      );
    }

    return NextResponse.json(response.body);
  } catch (error) {
    console.error('Error recalculating rewards:', error);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor para recalcular las recompensas' },
      { status: 502 },
    );
  }
}
