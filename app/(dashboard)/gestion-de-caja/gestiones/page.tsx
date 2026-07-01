import { headers } from 'next/headers';
import { ArrowUpDown, Banknote, ChevronDown, CircleDollarSign, Filter, Wallet } from 'lucide-react';

import { getCashManagementRecords } from '@/app/services/cash-management';
import AperturaCajaForm from './apertura-caja-form';

type SearchParams = {
  cashRegisterId?: string | string[];
  responsibleEmployeeId?: string | string[];
  status?: string | string[];
  openedFrom?: string | string[];
  openedTo?: string | string[];
  Page?: string | string[];
  page?: string | string[];
  perPage?: string | string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const GESTIONES_PATH = '/gestion-de-caja/gestiones';

const toPositiveInt = (value: string | string[] | undefined, fallback: number) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOptionalString = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = rawValue?.trim();

  return trimmedValue ? trimmedValue : undefined;
};

type ActiveFilters = {
  cashRegisterId?: string;
  responsibleEmployeeId?: string;
  status?: string;
  openedFrom?: string;
  openedTo?: string;
};

const buildPageHref = (pageNumber: number, perPage: number, filters: ActiveFilters) => {
  const params = new URLSearchParams();

  if (filters.cashRegisterId) {
    params.set('cashRegisterId', filters.cashRegisterId);
  }

  if (filters.responsibleEmployeeId) {
    params.set('responsibleEmployeeId', filters.responsibleEmployeeId);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.openedFrom) {
    params.set('openedFrom', filters.openedFrom);
  }

  if (filters.openedTo) {
    params.set('openedTo', filters.openedTo);
  }

  if (pageNumber > 1) {
    params.set('page', String(pageNumber));
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set('perPage', String(perPage));
  }

  const query = params.toString();
  return query ? `?${query}` : '?';
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Pendiente';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatCurrency = (value: number, currency: 'NIO' | 'USD') => {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const getStatusClasses = (status: string) => {
  return status.toLowerCase() === 'abierta'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-200 text-slate-700';
};

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'medium',
  }).format(date);
};

export default async function GestionCaja({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = toPositiveInt(resolvedSearchParams.page ?? resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.perPage, DEFAULT_PER_PAGE);
  const activeFilters: ActiveFilters = {
    cashRegisterId: toOptionalString(resolvedSearchParams.cashRegisterId),
    responsibleEmployeeId: toOptionalString(resolvedSearchParams.responsibleEmployeeId),
    status: toOptionalString(resolvedSearchParams.status),
    openedFrom: toOptionalString(resolvedSearchParams.openedFrom),
    openedTo: toOptionalString(resolvedSearchParams.openedTo),
  };

  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : undefined;

  let fetchError: string | null = null;
  let response;

  try {
    response = await getCashManagementRecords({
      ...activeFilters,
      page,
      perPage,
      baseUrl,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar la gestion de caja';
    response = {
      records: [],
      paging: {
        perPage,
        currentPage: page,
        totalRecords: 0,
        totalPages: 1,
      },
    };
  }

  const totalNio = response.records.reduce((sum, record) => sum + record.balance.nio, 0);
  const totalUsd = response.records.reduce((sum, record) => sum + record.balance.usd, 0);
  const openRecords = response.records.filter((record) => record.status.toLowerCase() === 'abierta').length;
  const selectedFilterChips = [
    activeFilters.cashRegisterId ? `Caja: ${activeFilters.cashRegisterId}` : null,
    activeFilters.responsibleEmployeeId ? `Responsable: ${activeFilters.responsibleEmployeeId}` : null,
    activeFilters.status ? `Estado: ${activeFilters.status}` : null,
    activeFilters.openedFrom ? `Desde: ${formatDateLabel(activeFilters.openedFrom)}` : null,
    activeFilters.openedTo ? `Hasta: ${formatDateLabel(activeFilters.openedTo)}` : null,
  ].filter((value): value is string => Boolean(value));
  const shouldOpenFilters = selectedFilterChips.length === 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Wallet size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Gestión de Caja</h2>
                  <p className="text-muted-foreground">
                    Vista server-side render con aperturas, cierres y balances por caja.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<ArrowUpDown className="size-4" />} />
              <StatCard label="Cajas abiertas" value={openRecords} icon={<Banknote className="size-4" />} />
              <StatCard label="Balance NIO" value={formatCurrency(totalNio, 'NIO')} icon={<CircleDollarSign className="size-4" />} />
              <StatCard label="Balance USD" value={formatCurrency(totalUsd, 'USD')} icon={<CircleDollarSign className="size-4" />} />
            </div>
          </div>
        </header>

        <AperturaCajaForm />

        <details
          className="group overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm"
          open={shouldOpenFilters}
        >
          <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Filter className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Filtros</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFilterChips.length > 0
                    ? 'Filtros aplicados actualmente'
                    : 'Expanda para filtrar por caja, responsable, estado y fechas'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedFilterChips.length > 0 ? (
                selectedFilterChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-foreground"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Sin filtros aplicados</span>
              )}

              <span className="rounded-full border border-border/60 p-2 text-muted-foreground transition-transform group-open:rotate-180">
                <ChevronDown className="size-4" />
              </span>
            </div>
          </summary>

          <div className="border-t border-border/60 px-5 py-5">
            <form action={GESTIONES_PATH} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Caja ID</span>
                  <input
                    type="number"
                    min="1"
                    name="cashRegisterId"
                    defaultValue={activeFilters.cashRegisterId}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    placeholder="Ej. 1"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Responsable ID</span>
                  <input
                    type="number"
                    min="1"
                    name="responsibleEmployeeId"
                    defaultValue={activeFilters.responsibleEmployeeId}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    placeholder="Ej. 12"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <select
                    name="status"
                    defaultValue={activeFilters.status ?? ''}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Todos</option>
                    <option value="Abierta">Abierta</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Abierta desde</span>
                  <input
                    type="date"
                    name="openedFrom"
                    defaultValue={activeFilters.openedFrom}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Abierta hasta</span>
                  <input
                    type="date"
                    name="openedTo"
                    defaultValue={activeFilters.openedTo}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Por página</span>
                  <select
                    name="perPage"
                    defaultValue={String(perPage)}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={GESTIONES_PATH}
                    className="inline-flex items-center rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Limpiar
                  </a>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </form>
          </div>
        </details>

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la informacion desde el endpoint: {fetchError}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caja</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsable</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Apertura</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cierre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance NIO</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance USD</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Dif. NIO</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Dif. USD</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {response.records.length > 0 ? (
                  response.records.map((record) => (
                    <tr key={record.id} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{record.cashRegisterName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{record.cashRegisterCode}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-foreground">{record.responsibleEmployeeName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Apertura por {record.openedByUserName}</p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDateTime(record.openedAt)}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDateTime(record.closedAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-foreground">{formatCurrency(record.balance.nio, 'NIO')}</td>
                      <td className="px-4 py-4 text-right text-foreground">{formatCurrency(record.balance.usd, 'USD')}</td>
                      <td className={`px-4 py-4 text-right ${record.differenceNioAtClose > 0 ? 'text-emerald-600' : record.differenceNioAtClose < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(record.differenceNioAtClose, 'NIO')}
                      </td>
                      <td className={`px-4 py-4 text-right ${record.differenceUsdAtClose > 0 ? 'text-emerald-600' : record.differenceUsdAtClose < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(record.differenceUsdAtClose, 'USD')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No se encontraron gestiones con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {response.records.length > 0 ? (
          <section className="grid gap-4 xl:grid-cols-2">
            {response.records.map((record) => (
              <article key={`detail-${record.id}`} className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-foreground">{record.cashRegisterName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Responsable: {record.responsibleEmployeeName} · Tasa {record.exchangeRateNioPerUsd} NIO/USD
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.status)}`}>
                    {record.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailCard
                    label="Observación apertura"
                    value={record.openingObservation || 'Sin observación'}
                  />
                  <DetailCard
                    label="Observación cierre"
                    value={record.closingObservation || 'Sin observación'}
                  />
                  <DetailCard
                    label="Esperado al cierre"
                    value={`${formatCurrency(record.expectedNioAtClose, 'NIO')} · ${formatCurrency(record.expectedUsdAtClose, 'USD')}`}
                  />
                  <DetailCard
                    label="Real al cierre"
                    value={`${formatCurrency(record.actualNioAtClose, 'NIO')} · ${formatCurrency(record.actualUsdAtClose, 'USD')}`}
                  />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <DenominationTable title="Denominaciones apertura" items={record.openingDenominations} />
                  <DenominationTable title="Denominaciones cierre" items={record.closingDenominations} />
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {response.paging.totalPages > 1 ? (
          <nav aria-label="Paginación gestión de caja" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {response.paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(response.paging.currentPage - 1, response.paging.perPage, activeFilters)}
                    className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    Anterior
                  </a>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center rounded-md border border-border px-3 py-2 text-sm opacity-50">
                    Anterior
                  </span>
                )}
              </li>
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Página {response.paging.currentPage} de {response.paging.totalPages}
              </li>
              <li>
                {response.paging.currentPage < response.paging.totalPages ? (
                  <a
                    href={buildPageHref(response.paging.currentPage + 1, response.paging.perPage, activeFilters)}
                    className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    Siguiente
                  </a>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center rounded-md border border-border px-3 py-2 text-sm opacity-50">
                    Siguiente
                  </span>
                )}
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function DenominationTable({
  title,
  items,
}: {
  title: string;
  items: Array<{
    currency: string;
    denomination: number;
    quantity: number;
    total: number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/60">
      <div className="border-b border-border/60 px-4 py-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Moneda</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Denominación</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${title}-${item.currency}-${item.denomination}-${index}`} className="border-t border-border/40">
                  <td className="px-4 py-2 text-foreground">{item.currency}</td>
                  <td className="px-4 py-2 text-right text-foreground">{item.denomination}</td>
                  <td className="px-4 py-2 text-right text-foreground">{item.quantity}</td>
                  <td className="px-4 py-2 text-right text-foreground">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-muted-foreground">No hay denominaciones registradas.</p>
      )}
    </div>
  );
}