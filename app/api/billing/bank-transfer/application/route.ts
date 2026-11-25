import { proxyToBackend } from '@/app/lib/backend-proxy';

// GET /v1/billing/bank-transfer/application: historial de aplicaciones
// (cashManagementId, invoiceId, collectionBankTransferId, status, Page, PerPage).
export async function GET(req: Request) {
  return proxyToBackend({
    method: 'GET',
    path: '/v1/billing/bank-transfer/application',
    query: new URL(req.url).searchParams.toString(),
    errorMessage: 'Error al consultar las aplicaciones de transferencias',
  });
}
