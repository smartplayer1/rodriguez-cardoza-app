import {
  CreditNoteApplication,
  CreditNoteApplyPayload,
  CreditNoteApplyResult,
  CreditNoteCreatePayload,
  CreditNoteListResponse,
  CreditNoteRecord,
} from '@/app/type/credit-note';
import { ServerInvoicePayload } from '@/app/type/invoice';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export type CreditNoteFilters = {
  number?: string;
  invoiceDocument?: string;
  advisorCode?: string;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: CreditNoteFilters) => {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.number?.trim()) params.set('number', filters.number.trim());
  if (filters.invoiceDocument?.trim()) params.set('invoiceDocument', filters.invoiceDocument.trim());
  if (filters.advisorCode?.trim()) params.set('advisorCode', filters.advisorCode.trim());
  if (filters.status?.trim()) params.set('status', filters.status.trim());
  if (filters.startDateFrom) params.set('startDateFrom', filters.startDateFrom);
  if (filters.startDateTo) params.set('startDateTo', filters.startDateTo);
  if (typeof filters.page === 'number') params.set('page', String(filters.page));
  if (typeof filters.perPage === 'number') params.set('perPage', String(filters.perPage));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getCreditNotes = async (filters?: CreditNoteFilters): Promise<CreditNoteListResponse> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/credit-note${buildQueryString(filters)}`, {
    baseUrl: filters?.baseUrl,
  }), {
    method: 'GET',
    headers: createJsonHeaders(filters?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit notes');
  }

  return response.json();
};

export const createCreditNote = async (
  payload: CreditNoteCreatePayload,
  context?: ServiceRequestContext,
): Promise<CreditNoteRecord> => {
  const response = await fetch(resolveServiceUrl('/api/billing/credit-note', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create credit note');
  }

  return response.json();
};

// Nota de crédito con el mismo formato que una factura (header + details).
// header.document = número de la nota, header.clientCode = cliente,
// header.issuedAt = fecha. Los valores pueden ir en negativo.
export type CreditNoteImportPayload = {
  cashManagementId?: number | null;
  header: ServerInvoicePayload['header'];
  details: ServerInvoicePayload['details'];
};

export type CreditNoteImportResult = {
  number: string;
  success: boolean;
  skipped: boolean;
  creditNote: CreditNoteRecord | null;
  errors: string[];
};

// Crea las notas en borrador y sin factura (se relacionan después a mano).
// Cada nota se procesa por separado: devuelve un resultado por nota.
export const importCreditNotes = async (
  creditNotes: CreditNoteImportPayload[],
  context?: ServiceRequestContext,
): Promise<CreditNoteImportResult[]> => {
  const response = await fetch(resolveServiceUrl('/api/billing/credit-note/import', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ creditNotes }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || 'Failed to import credit notes');
  }

  return response.json();
};

export const issueCreditNote = async (
  creditNoteId: number,
  context?: ServiceRequestContext,
): Promise<CreditNoteRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/credit-note/${creditNoteId}/issue`, context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || 'Failed to issue credit note');
  }

  return response.json();
};

export const applyCreditNote = async (
  creditNoteId: number,
  payload: CreditNoteApplyPayload,
  context?: ServiceRequestContext,
): Promise<CreditNoteApplyResult> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/credit-note/${creditNoteId}/apply`, context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || 'Failed to apply credit note');
  }

  return response.json();
};

export const getCreditNoteApplications = async (
  creditNoteId: number,
  context?: ServiceRequestContext,
): Promise<CreditNoteApplication[]> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/credit-note/${creditNoteId}/applications`, context),
    {
      method: 'GET',
      headers: createJsonHeaders(context?.cookieHeader),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || 'No se pudieron cargar las aplicaciones');
  }

  return response.json();
};

// Anula una nota de crédito. El backend rechaza si tiene aplicaciones activas o una
// devolución de caja activa (hay que anularlas antes), o si su gestión está cerrada.
export const voidCreditNote = async (
  creditNoteId: number,
  context?: ServiceRequestContext,
): Promise<CreditNoteRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/credit-note/${creditNoteId}/void`, context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || 'No se pudo anular la nota de crédito');
  }

  return response.json();
};

// Anula la aplicación de una nota de crédito a una factura: el monto vuelve al saldo de la
// nota y al pendiente de la factura. Solo con la gestión de la aplicación abierta.
export const voidCreditNoteApplication = async (
  applicationId: number,
  context?: ServiceRequestContext,
): Promise<CreditNoteApplyResult> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/credit-note/application/${applicationId}/void`, context),
    {
      method: 'POST',
      headers: createJsonHeaders(context?.cookieHeader),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || 'No se pudo anular la aplicación');
  }

  return response.json();
};
