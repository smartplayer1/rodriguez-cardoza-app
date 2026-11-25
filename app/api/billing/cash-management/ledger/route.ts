import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/cash-management/ledger (filtros: search, type=Ingreso|Egreso,
// cashManagementId, dateFrom, dateTo, Page, PerPage)
export async function GET(req: Request) {
  return proxyToBackend({
    method: 'GET',
    path: '/v1/billing/cash-management/ledger',
    query: new URL(req.url).searchParams.toString(),
    errorMessage: 'Error al obtener el libro de caja',
  });
}
