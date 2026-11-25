import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/cash-management/inflow (filtros: id, number, cashManagementId,
// status, occurredFrom, occurredTo, Page, PerPage)
export async function GET(req: Request) {
  return proxyToBackend({
    method: 'GET',
    path: '/v1/billing/cash-management/inflow',
    query: new URL(req.url).searchParams.toString(),
    errorMessage: 'Error al obtener ingresos de caja',
  });
}

// POST /v1/billing/cash-management/inflow (permiso Billing.CashInflow.Create)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend({
    method: 'POST',
    path: '/v1/billing/cash-management/inflow',
    body,
    errorMessage: 'Error al registrar el ingreso de caja',
    successStatus: 201,
  });
}
