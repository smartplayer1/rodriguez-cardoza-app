import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/bank-transfer/{id}/apply: aplica la transferencia a una o
// varias facturas (todo o nada). 201 con la transferencia actualizada.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/bank-transfer/${encodeURIComponent(id)}/apply`,
    body,
    errorMessage: 'Error al aplicar la transferencia a facturas',
  });
}
