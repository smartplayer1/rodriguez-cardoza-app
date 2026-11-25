import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/exchange-rate/latest: tipo de cambio vigente (el más reciente a hoy).
// 404 si todavía no hay ninguno registrado.
export async function GET() {
  return proxyToBackend({
    method: 'GET',
    path: '/v1/billing/exchange-rate/latest',
    errorMessage: 'Error al obtener el tipo de cambio vigente',
  });
}
