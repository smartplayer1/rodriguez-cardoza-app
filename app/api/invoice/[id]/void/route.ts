import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/invoice/{id}/void: anula una factura. Responde 204. Rechaza (400) si la factura
// tiene cobros activos, si es histórica o si su gestión de caja está cerrada. Las
// transferencias y notas de crédito aplicadas a la factura se liberan automáticamente.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/invoice/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular la factura',
  });
}
