import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/bank-transfer/available: transferencias con saldo por aplicar
// (search = documento). Paginado { records, paging }.
export async function GET(req: Request) {
  return proxyToBackend({
    method: 'GET',
    path: '/v1/billing/bank-transfer/available',
    query: new URL(req.url).searchParams.toString(),
    errorMessage: 'Error al consultar transferencias con saldo disponible',
  });
}
