import { ClientHistoryFilters, ClientHistoryResponse } from '@/app/type/client-history';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

// Error con el status y el mensaje (`detail`) del backend: 404 (no existe el
// código), 403 (sin acceso a la sucursal del cliente), 400 (falta el código).
export class ClientHistoryError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ClientHistoryError';
    this.status = status;
  }
}

export const getClientHistory = async (
  code: string,
  filters?: ClientHistoryFilters,
  context?: ServiceRequestContext,
): Promise<ClientHistoryResponse> => {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new ClientHistoryError('Ingrese el código del cliente', 400);
  }

  const params = new URLSearchParams();
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  const queryString = params.toString();

  const res = await fetch(
    resolveServiceUrl(
      `/api/client/${encodeURIComponent(trimmedCode)}/history${queryString ? `?${queryString}` : ''}`,
      context,
    ),
    { headers: createJsonHeaders(context?.cookieHeader), cache: 'no-store' },
  );

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ClientHistoryError(
      body?.message || body?.error?.detail || 'No se pudo consultar el histórico del cliente',
      res.status,
    );
  }

  return body as ClientHistoryResponse;
};
