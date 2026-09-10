import {
  BankTransferImportFilters,
  BankTransferImportListResponse,
  BankTransferImportRecord,
  BankTransferListResponse,
  BankTransferRecord,
  CreateBankTransferPayload,
  ImportBankTransferPayload,
  ImportBankTransferResponse,
  ReconcileBankTransferFilters,
  ReconcileBankTransferResponse,
} from '@/app/type/bank-transfer';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

const readServiceErrorMessage = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { message?: string; detail?: string } | null)?.message ||
    (errorBody as { message?: string; detail?: string } | null)?.detail ||
    fallback
  );
};

export type UnrelatedBankTransferFilters = {
  // Sin este filtro: criterio original (excluye las ya relacionadas a una
  // Collection o a un Invoice) — usado para relacionar transferencias con
  // facturas. Con isReconciled=false: transferencias internas que todavía
  // no están vinculadas a ningún bank_transfer_import — es el criterio para
  // poblar el picker de la conciliación manual. isReconciled=true trae el
  // complemento. Son criterios independientes entre sí.
  isReconciled?: boolean;
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};

const buildQueryString = (filters?: Omit<UnrelatedBankTransferFilters, 'baseUrl' | 'cookieHeader'>) => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (typeof filters.isReconciled === 'boolean') params.set('isReconciled', String(filters.isReconciled));
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

// Conciliación bancaria: el frontend lee el Excel del banco y manda el
// array de filas ya procesadas; el backend no parsea el archivo.
export const importBankTransfers = async (
  payload: ImportBankTransferPayload,
  context?: ServiceRequestContext,
): Promise<ImportBankTransferResponse> => {
  const response = await fetch(resolveServiceUrl('/api/billing/bank-transfer/import', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudo importar el archivo del banco'));
  }

  return response.json();
};

const buildImportQueryString = (filters?: BankTransferImportFilters) => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (typeof filters.isReconciled === 'boolean') params.set('isReconciled', String(filters.isReconciled));
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.document?.trim()) params.set('document', filters.document.trim());
  if (typeof filters.page === 'number' && filters.page > 0) params.set('page', String(filters.page));
  if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('perPage', String(filters.perPage));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getBankTransferImports = async (
  filters?: BankTransferImportFilters & ServiceRequestContext,
): Promise<BankTransferImportListResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/import${buildImportQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: 'GET',
      headers: createJsonHeaders(filters?.cookieHeader),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      await readServiceErrorMessage(response, 'No se pudieron cargar los registros de conciliación bancaria'),
    );
  }

  return response.json();
};

const buildReconcileQueryString = (filters?: ReconcileBankTransferFilters) => {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.document?.trim()) params.set('document', filters.document.trim());

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const reconcileBankTransferImports = async (
  filters?: ReconcileBankTransferFilters & ServiceRequestContext,
): Promise<ReconcileBankTransferResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/import/reconcile${buildReconcileQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    {
      method: 'POST',
      headers: createJsonHeaders(filters?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudo ejecutar la conciliación bancaria'));
  }

  return response.json();
};

export const linkBankTransferImport = async (
  bankTransferImportId: number,
  collectionBankTransferId: number,
  context?: ServiceRequestContext,
): Promise<BankTransferImportRecord> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/import/${bankTransferImportId}/link`, context),
    {
      method: 'POST',
      headers: createJsonHeaders(context?.cookieHeader),
      body: JSON.stringify({ collectionBankTransferId }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readServiceErrorMessage(response, 'No se pudo relacionar el registro del banco con la transferencia'),
    );
  }

  return response.json();
};

export const unlinkBankTransferImport = async (
  bankTransferImportId: number,
  context?: ServiceRequestContext,
): Promise<BankTransferImportRecord> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/import/${bankTransferImportId}/link`, context),
    {
      method: 'DELETE',
      headers: createJsonHeaders(context?.cookieHeader),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readServiceErrorMessage(response, 'No se pudo deshacer la vinculación'),
    );
  }

  return response.json();
};
