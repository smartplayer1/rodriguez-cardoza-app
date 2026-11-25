import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/exchange-rate (filtros: effectiveDateFrom, effectiveDateTo, Page, PerPage).
// Ordenado de la fecha más reciente a la más antigua.
export async function GET(req: Request) {
  return proxyToBackend({
    method: 'GET',
    path: '/v1/billing/exchange-rate',
    query: new URL(req.url).searchParams.toString(),
    errorMessage: 'Error al obtener los tipos de cambio',
  });
}

// POST /v1/billing/exchange-rate: registra el tipo de cambio de una fecha. 409 si ya existe
// uno para esa fecha; 400 si la tasa no es mayor que cero.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend({
    method: 'POST',
    path: '/v1/billing/exchange-rate',
    body,
    errorMessage: 'Error al registrar el tipo de cambio',
  });
}
