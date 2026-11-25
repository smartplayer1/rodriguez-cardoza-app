import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/cash-management/{id}/denominations/current
// (permiso Billing.CashManagement.View)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'GET',
    path: `/v1/billing/cash-management/${encodeURIComponent(id)}/denominations/current`,
    errorMessage: 'Error al obtener el desglose actual de la caja',
  });
}
