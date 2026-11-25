import { proxyToBackend } from '@/app/lib/backend-proxy';

// PUT /v1/billing/exchange-rate/{id}: corrige la tasa y la observación (la fecha no cambia).
// 400 si el tipo de cambio ya se usó en alguna gestión, ingreso o egreso.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend({
    method: 'PUT',
    path: `/v1/billing/exchange-rate/${encodeURIComponent(id)}`,
    body,
    errorMessage: 'Error al corregir el tipo de cambio',
  });
}

// DELETE /v1/billing/exchange-rate/{id}: eliminado lógico (204). 400 si ya se usó.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'DELETE',
    path: `/v1/billing/exchange-rate/${encodeURIComponent(id)}`,
    errorMessage: 'Error al eliminar el tipo de cambio',
  });
}
