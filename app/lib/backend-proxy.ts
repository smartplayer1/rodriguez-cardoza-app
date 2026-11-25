import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

// Mensaje legible de un ProblemDetails del backend: detail, mensajes de
// validación (errors) o title.
export const readProblemMessage = (body: unknown, fallback: string) => {
  if (!body || typeof body !== 'object') return fallback;
  const data = body as {
    detail?: string;
    message?: string;
    title?: string;
    errors?: Record<string, string[] | string>;
  };
  const validation: string[] = [];
  if (data.errors && typeof data.errors === 'object') {
    Object.values(data.errors).forEach((value) =>
      Array.isArray(value) ? validation.push(...value) : value && validation.push(String(value)),
    );
  }
  return data.detail || data.message || (validation.length ? validation.join(' ') : '') || data.title || fallback;
};

type ProxyOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Ruta del backend sin el prefijo de la API, ej. `/v1/billing/cash-management/inflow`. */
  path: string;
  /** Query string a reenviar (sin "?"). */
  query?: string;
  body?: unknown;
  errorMessage: string;
  successStatus?: number;
};

// Reenvía la petición al backend con el token del usuario. Si la respuesta no
// es OK devuelve { message, error } con el mismo status.
export async function proxyToBackend({ method, path, query, body, errorMessage, successStatus }: ProxyOptions) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'NEXT_PUBLIC_API_URL no esta configurada' }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}${query ? `?${query}` : ''}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
      cache: 'no-store',
    });

    // 204 No Content (ej. DELETE): no hay JSON que leer ni que devolver.
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: readProblemMessage(responseBody, errorMessage), error: responseBody },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody, { status: successStatus ?? response.status });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : errorMessage },
      { status: 500 },
    );
  }
}
