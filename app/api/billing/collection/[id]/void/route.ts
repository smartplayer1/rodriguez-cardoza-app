import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/collection/{id}/void: anula un cobro. Revierte su efectivo en la caja y
// devuelve el saldo pendiente a las facturas. 200 con el cobro actualizado; 400 si su gestión
// de caja ya está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/collection/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular el cobro',
  });
}
