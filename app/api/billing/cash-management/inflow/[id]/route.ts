import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/cash-management/inflow/{id}
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'GET',
    path: `/v1/billing/cash-management/inflow/${encodeURIComponent(id)}`,
    errorMessage: 'Error al obtener el ingreso de caja',
  });
}

// PUT /v1/billing/cash-management/inflow/{id}: reemplaza el registro completo
// (sin desglose = se borra el anterior). Errores con `detail` (400) o 404.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  return proxyToBackend({
    method: 'PUT',
    path: `/v1/billing/cash-management/inflow/${encodeURIComponent(id)}`,
    body,
    errorMessage: 'Error al editar el ingreso de caja',
  });
}

// DELETE /v1/billing/cash-management/inflow/{id}: borrado lógico. 204 sin
// contenido; 400 con `detail` (gestión cerrada, saldo insuficiente) o 404.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'DELETE',
    path: `/v1/billing/cash-management/inflow/${encodeURIComponent(id)}`,
    errorMessage: 'Error al eliminar el ingreso de caja',
  });
}
