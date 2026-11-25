import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/bank-transfer/application/{id}/void: anula una aplicación.
// 200 con la transferencia actualizada; 400 si su gestión ya está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/bank-transfer/application/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular la aplicación de la transferencia',
  });
}
