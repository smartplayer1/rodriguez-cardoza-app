import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/cash-management/conversion/{id}/void: anula una conversión de moneda
// (revierte sus movimientos de caja). 400 si la gestión está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/cash-management/conversion/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular la conversión',
  });
}
