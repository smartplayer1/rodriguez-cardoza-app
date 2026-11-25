import { proxyToBackend } from '@/app/lib/backend-proxy';

// POST /v1/billing/credit-note/application/{id}/void: anula la aplicación de una nota de
// crédito a una factura. El monto vuelve al saldo de la nota y al pendiente de la factura.
// 400 si la gestión de caja de la aplicación ya está cerrada.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend({
    method: 'POST',
    path: `/v1/billing/credit-note/application/${encodeURIComponent(id)}/void`,
    errorMessage: 'Error al anular la aplicación de la nota de crédito',
  });
}
