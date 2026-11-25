import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/cash-management/outflow/{id}
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'GET',
    path: `/v1/billing/cash-management/outflow/${encodeURIComponent(id)}`,
    errorMessage: 'Error al obtener el egreso de caja',
  });
}

// PUT /v1/billing/cash-management/outflow/{id}: reemplaza el registro completo
// (sin desglose = se borra el anterior). Errores con `detail` (400) o 404.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  return proxyToBackend({
    method: 'PUT',
    path: `/v1/billing/cash-management/outflow/${encodeURIComponent(id)}`,
    body,
    errorMessage: 'Error al editar el egreso de caja',
  });
}

// DELETE /v1/billing/cash-management/outflow/{id}: borrado lógico. 204 sin
// contenido; 400 con `detail` (gestión cerrada, saldo insuficiente) o 404.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'DELETE',
    path: `/v1/billing/cash-management/outflow/${encodeURIComponent(id)}`,
    errorMessage: 'Error al eliminar el egreso de caja',
  });
}
