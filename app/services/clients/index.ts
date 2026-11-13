import { Client, ClientFilters, UpdateClientPayload } from "@/app/type/client";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export type GetClientsFilters = ServiceRequestContext & ClientFilters;

// Error de GET /v1/client con el status y el mensaje (`detail`) del backend.
export class ClientsRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ClientsRequestError';
    this.status = status;
  }
}

const isPositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1;

// Arma el query string de GET /v1/client. Los filtros vacíos no se envían.
export const buildClientsQuery = (filters?: ClientFilters) => {
  const params = new URLSearchParams();
  if (!filters) return params;

  const text: Array<[string, string | undefined]> = [
    ['Code', filters.code],
    ['Name', filters.name],
    ['IDNumber', filters.idNumber],
    ['PhoneNumber', filters.phoneNumber],
    ['ClientType', filters.clientType],
    ['ZoneCode', filters.zoneCode],
    ['Address', filters.address],
    ['Province', filters.province],
    ['District', filters.district],
    ['Canton', filters.canton],
    ['DateOfEntry', filters.dateOfEntry],
  ];
  text.forEach(([key, value]) => {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  });

  const exact: Array<[string, number | undefined]> = [
    ['Id', filters.id],
    ['BranchId', filters.branchId],
    ['PromoterId', filters.promoterId],
  ];
  exact.forEach(([key, value]) => {
    if (isPositiveInt(value)) params.set(key, String(value));
  });

  if (filters.page !== undefined) {
    if (!isPositiveInt(filters.page)) throw new ClientsRequestError('La página debe ser un número mayor o igual a 1', 400);
    params.set('Page', String(filters.page));
  }
  if (filters.perPage !== undefined) {
    if (!isPositiveInt(filters.perPage)) throw new ClientsRequestError('Registros por página debe ser un número mayor o igual a 1', 400);
    params.set('PerPage', String(filters.perPage));
  }

  return params;
};

export const getclients = async (filters?: GetClientsFilters) => {
  const queryString = buildClientsQuery(filters).toString();

  const res = await fetch(resolveServiceUrl(`/api/clients${queryString ? `?${queryString}` : ''}`, filters), {
    headers: createJsonHeaders(filters?.cookieHeader),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new ClientsRequestError(
      errorData?.detail || errorData?.message || errorData?.error || 'No se pudieron cargar los clientes',
      res.status,
    );
  }
  return res.json();
};

export const createClient = async (clientData: Client, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/clients', context), {
    method: "POST",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(clientData),
  });
};

export const updateClient = async (
  id: number,
  payload: UpdateClientPayload,
  context?: ServiceRequestContext,
) => {
  const res = await fetch(resolveServiceUrl(`/api/clients/${id}`, context), {
    method: "PUT",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || errorData?.detail || "Failed to update client");
  }
};

export const deleteClient = async (clientId: string, context?: ServiceRequestContext) => {
  const res = await fetch(resolveServiceUrl('/api/clients', context), {
    method: "DELETE",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id: clientId }),
  });
  if (!res.ok) {
    throw new Error("Failed to delete client");
  }
  return res.json();
};
