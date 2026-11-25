import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/cash-management/outflow/{id}/void: anula un egreso de caja (revierte su
// efecto en la caja y queda en el historial como anulado). 400 si la gestión está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/cash-management/outflow/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular el egreso de caja',
  });
}
