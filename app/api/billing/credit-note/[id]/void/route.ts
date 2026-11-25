import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/credit-note/{id}/void: anula una nota de crédito. 200 con la nota
// actualizada. Rechaza (400) si tiene aplicaciones activas a facturas, una devolución de caja
// activa o si su gestión de caja está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/credit-note/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular la nota de crédito',
  });
}
