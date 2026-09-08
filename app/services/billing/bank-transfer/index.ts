import {
  BankTransferListResponse,
  BankTransferRecord,
  CreateBankTransferPayload,
} from '@/app/type/bank-transfer';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export type UnrelatedBankTransferFilters = {
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: Omit<UnrelatedBankTransferFilters, 'baseUrl' | 'cookieHeader'>) => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (typeof filters.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
  if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getUnrelatedBankTransfers = async (
  filters?: UnrelatedBankTransferFilters,
): Promise<BankTransferListResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/unrelated${buildQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: 'GET',
      headers: createJsonHeaders(filters?.cookieHeader),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to fetch unrelated bank transfers';
    throw new Error(message);
  }

  return response.json();
};

export const createBankTransfer = async (
  payload: CreateBankTransferPayload,
  context?: ServiceRequestContext,
): Promise<BankTransferRecord> => {
  const response = await fetch(resolveServiceUrl('/api/billing/bank-transfer', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to create bank transfer';
    throw new Error(message);
  }

  return response.json();
};

export const linkBankTransferToInvoice = async (
  transferId: number,
  invoiceId: number,
  context?: ServiceRequestContext,
): Promise<void> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/${transferId}/link-invoice`, context),
    {
      method: 'POST',
      headers: createJsonHeaders(context?.cookieHeader),
      body: JSON.stringify({ invoiceId }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to link bank transfer to invoice';
    throw new Error(message);
  }
};
