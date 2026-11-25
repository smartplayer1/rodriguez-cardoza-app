import {
  ApplyBankTransferPayload,
  AvailableBankTransferFilters,
  BankTransferApplicationFilters,
  BankTransferApplicationListResponse,
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
  UpdateBankTransferPayload,
} from '@/app/type/bank-transfer';
import { EntityImage } from '@/app/type/entity-image';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

// Error del backend al registrar una transferencia duplicada (409: mismo
// documento el mismo día). La pantalla lo muestra junto al campo documento.
export class DuplicateBankTransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateBankTransferError';
  }
}

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
    const message = await readServiceErrorMessage(response, 'No se pudo registrar la transferencia');
    if (response.status === 409) throw new DuplicateBankTransferError(message);
    throw new Error(message);
  }

  return response.json();
};

export const updateBankTransfer = async (
  transferId: number,
  payload: UpdateBankTransferPayload,
  context?: ServiceRequestContext,
): Promise<BankTransferRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/bank-transfer/${transferId}`, context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'No se pudo actualizar la transferencia';
    throw new Error(message);
  }

  return response.json();
};

const buildAvailableQueryString = (filters?: AvailableBankTransferFilters) => {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.companyBankAccountId) params.set('companyBankAccountId', String(filters.companyBankAccountId));
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (typeof filters.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
  if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));
  const query = params.toString();
  return query ? `?${query}` : '';
};

/** Transferencias con saldo disponible para aplicar a facturas. */
export const getAvailableBankTransfers = async (
  filters?: AvailableBankTransferFilters & ServiceRequestContext,
): Promise<BankTransferListResponse> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/available${buildAvailableQueryString(filters)}`, {
      baseUrl: filters?.baseUrl,
    }),
    { method: 'GET', headers: createJsonHeaders(filters?.cookieHeader), cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudieron cargar las transferencias con saldo'));
  }
  return response.json();
};

/** Transferencia con su saldo y aplicaciones. */
export const getBankTransferById = async (
  transferId: number,
  context?: ServiceRequestContext,
): Promise<BankTransferRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/bank-transfer/${transferId}`, context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await readServiceErrorMessage(response, 'No se pudo cargar la transferencia'));
  return response.json();
};

/** Aplica la transferencia a facturas (todo o nada). Devuelve la transferencia actualizada. */
export const applyBankTransfer = async (
  transferId: number,
  payload: ApplyBankTransferPayload,
  context?: ServiceRequestContext,
): Promise<BankTransferRecord> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/bank-transfer/${transferId}/apply`, context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudo aplicar la transferencia a las facturas'));
  }
  return response.json();
};

/** Historial de aplicaciones de transferencias. */
export const getBankTransferApplications = async (
  filters?: BankTransferApplicationFilters & ServiceRequestContext,
): Promise<BankTransferApplicationListResponse> => {
  const params = new URLSearchParams();
  if (filters?.cashManagementId) params.set('cashManagementId', String(filters.cashManagementId));
  if (filters?.invoiceId) params.set('invoiceId', String(filters.invoiceId));
  if (filters?.collectionBankTransferId) params.set('collectionBankTransferId', String(filters.collectionBankTransferId));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page && filters.page > 0) params.set('Page', String(filters.page));
  if (filters?.perPage && filters.perPage > 0) params.set('PerPage', String(filters.perPage));
  const query = params.toString();

  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/application${query ? `?${query}` : ''}`, {
      baseUrl: filters?.baseUrl,
    }),
    { method: 'GET', headers: createJsonHeaders(filters?.cookieHeader), cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudieron cargar las aplicaciones'));
  }
  return response.json();
};

/** Anula una aplicación: el monto vuelve a la transferencia y a la factura. */
export const voidBankTransferApplication = async (
  applicationId: number,
  context?: ServiceRequestContext,
): Promise<BankTransferRecord> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/application/${applicationId}/void`, context),
    { method: 'POST', headers: createJsonHeaders(context?.cookieHeader) },
  );
  if (!response.ok) throw new Error(await readServiceErrorMessage(response, 'No se pudo anular la aplicación'));
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

export const updateBankTransferAccountingConcept = async (
  bankTransferId: number,
  accountingConceptId: number | null,
  context?: ServiceRequestContext,
): Promise<BankTransferRecord> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/${bankTransferId}/accounting-concept`, context),
    {
      method: 'PUT',
      headers: createJsonHeaders(context?.cookieHeader),
      body: JSON.stringify({ accountingConceptId }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readServiceErrorMessage(response, 'No se pudo asignar el concepto contable a la transferencia'),
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

export const getBankTransferImages = async (
  bankTransferId: number,
  context?: ServiceRequestContext,
): Promise<EntityImage[]> => {
  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/${bankTransferId}/images`, context),
    {
      method: 'GET',
      headers: createJsonHeaders(context?.cookieHeader),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      await readServiceErrorMessage(response, 'No se pudieron cargar las imágenes de la transferencia'),
    );
  }

  return response.json();
};

export const uploadBankTransferImage = async (
  bankTransferId: number,
  file: File,
  context?: ServiceRequestContext,
): Promise<EntityImage> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    resolveServiceUrl(`/api/billing/bank-transfer/${bankTransferId}/images`, context),
    {
      method: 'POST',
      headers: context?.cookieHeader ? { Cookie: context.cookieHeader } : undefined,
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudo subir la imagen'));
  }

  return response.json();
};

export const deleteBankTransferImage = async (
  imageId: number,
  context?: ServiceRequestContext,
): Promise<void> => {
  const response = await fetch(resolveServiceUrl(`/api/billing/bank-transfer/images/${imageId}`, context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, 'No se pudo eliminar la imagen'));
  }
};
