import {
  CreateExchangeRatePayload,
  ExchangeRate,
  ExchangeRateFilters,
  ExchangeRateListResponse,
} from '@/app/type/exchange-rate';
import { createJsonHeaders, resolveServiceUrl } from '@/app/services/http';

const readError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { message?: string; detail?: string } | null;
  return body?.message || body?.detail || fallback;
};

export const getExchangeRates = async (filters?: ExchangeRateFilters): Promise<ExchangeRateListResponse> => {
  const params = new URLSearchParams();
  if (filters?.effectiveDateFrom) params.set('effectiveDateFrom', filters.effectiveDateFrom);
  if (filters?.effectiveDateTo) params.set('effectiveDateTo', filters.effectiveDateTo);
  if (filters?.page && filters.page > 0) params.set('Page', String(filters.page));
  if (filters?.perPage && filters.perPage > 0) params.set('PerPage', String(filters.perPage));
  const query = params.toString();

  const response = await fetch(resolveServiceUrl(`/api/billing/exchange-rate${query ? `?${query}` : ''}`), {
    method: 'GET',
    headers: createJsonHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readError(response, 'No se pudieron cargar los tipos de cambio'));
  return response.json();
};

// Tipo de cambio vigente; null si todavía no hay ninguno registrado (404).
export const getLatestExchangeRate = async (): Promise<ExchangeRate | null> => {
  const response = await fetch(resolveServiceUrl('/api/billing/exchange-rate/latest'), {
    method: 'GET',
    headers: createJsonHeaders(),
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readError(response, 'No se pudo cargar el tipo de cambio vigente'));
  return response.json();
};

// Corrige tasa y observación. El backend rechaza si el tipo de cambio ya se usó en alguna
// gestión, ingreso o egreso; lanza ese mensaje.
export const updateExchangeRate = async (
  id: number,
  payload: { nioPerUsd: number; observation: string | null },
): Promise<ExchangeRate> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/exchange-rate/${id}`), {
    method: 'PUT',
    headers: createJsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response, 'No se pudo corregir el tipo de cambio'));
  return response.json();
};

export const deleteExchangeRate = async (id: number): Promise<void> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/exchange-rate/${id}`), {
    method: 'DELETE',
    headers: createJsonHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response, 'No se pudo eliminar el tipo de cambio'));
};

// La fecha se manda como medianoche UTC para que el backend la guarde en ese mismo día
// sin importar la zona horaria del navegador.
export const createExchangeRate = async (payload: CreateExchangeRatePayload): Promise<ExchangeRate> => {
  const response = await fetch(resolveServiceUrl('/api/billing/exchange-rate'), {
    method: 'POST',
    headers: createJsonHeaders(),
    body: JSON.stringify({
      effectiveDate: `${payload.effectiveDate}T00:00:00Z`,
      nioPerUsd: payload.nioPerUsd,
      observation: payload.observation,
    }),
  });
  if (!response.ok) throw new Error(await readError(response, 'No se pudo registrar el tipo de cambio'));
  return response.json();
};
