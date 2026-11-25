import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/cash-management/inflow/{id}/void: anula un ingreso de caja (revierte su
// efecto en la caja y queda en el historial como anulado). 400 si la gestión está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/cash-management/inflow/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular el ingreso de caja',
  });
}
