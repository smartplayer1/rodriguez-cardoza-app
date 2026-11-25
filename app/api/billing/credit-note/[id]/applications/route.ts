import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/credit-note/{id}/applications: aplicaciones de la nota a facturas
// (activas y anuladas).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'GET',
    path: `/v1/billing/credit-note/${encodeURIComponent(id)}/applications`,
    errorMessage: 'Error al consultar las aplicaciones de la nota de crédito',
  });
}
