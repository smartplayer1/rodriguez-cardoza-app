import {
  CreditNoteCreatePayload,
  CreditNoteListResponse,
  CreditNoteRecord,
} from '@/app/type/credit-note';

export type CreditNoteFilters = {
  number?: string;
  invoiceDocument?: string;
  advisorCode?: string;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  perPage?: number;
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

export const getCreditNotes = async (
  filters?: CreditNoteFilters,
): Promise<CreditNoteListResponse> => {
  const response = await fetch(`/api/billing/credit-note${buildQueryString(filters)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit notes');
  }

  return response.json();
};

export const createCreditNote = async (
  payload: CreditNoteCreatePayload,
): Promise<CreditNoteRecord> => {
  const response = await fetch('/api/billing/credit-note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create credit note');
  }

  return response.json();
};
