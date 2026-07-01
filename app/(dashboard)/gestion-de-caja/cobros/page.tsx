import { headers } from 'next/headers';
import { CalendarDays, Hash, ReceiptText, Search, Wallet } from 'lucide-react';

import CrearCobroModal from './crear-cobro-modal';
import { getCollections } from '@/app/services/billing/collection';

type SearchParams = {
  number?: string | string[];
  invoiceId?: string | string[];
  invoiceDocument?: string | string[];
  cashRegisterId?: string | string[];
  cashManagementId?: string | string[];
  currency?: string | string[];
  applicationStatus?: string | string[];
  status?: string | string[];
  collectionDate?: string | string[];
  Page?: string | string[];
  PerPage?: string | string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const toPositiveInt = (value: string | string[] | undefined, fallback: number) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPageHref = (pageNumber: number, perPage: number, searchParams: URLSearchParams) => {
  const params = new URLSearchParams(searchParams);

  if (pageNumber > 1) {
    params.set('Page', String(pageNumber));
  } else {
    params.delete('Page');
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set('PerPage', String(perPage));
  } else {
    params.delete('PerPage');
  }

  const query = params.toString();
  return query ? `?${query}` : '?';
};

export default async function CobrosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = toPositiveInt(resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.PerPage, DEFAULT_PER_PAGE);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  const filterParams = new URLSearchParams();

  const filterFields = [
    ['number', resolvedSearchParams.number],
    ['invoiceId', resolvedSearchParams.invoiceId],
    ['invoiceDocument', resolvedSearchParams.invoiceDocument],
    ['cashRegisterId', resolvedSearchParams.cashRegisterId],
    ['cashManagementId', resolvedSearchParams.cashManagementId],
    ['currency', resolvedSearchParams.currency],
    ['applicationStatus', resolvedSearchParams.applicationStatus],
    ['status', resolvedSearchParams.status],
    ['collectionDate', resolvedSearchParams.collectionDate],
  ] as const;

  for (const [key, value] of filterFields) {
    const normalized = toStringValue(value);

    if (normalized) {
      filterParams.set(key, normalized);
    }
  }

  let fetchError: string | null = null;
  let response;

  try {
    response = await getCollections({
      number: toStringValue(resolvedSearchParams.number),
      invoiceId: toStringValue(resolvedSearchParams.invoiceId),
      invoiceDocument: toStringValue(resolvedSearchParams.invoiceDocument),
      cashRegisterId: toStringValue(resolvedSearchParams.cashRegisterId),
      cashManagementId: toStringValue(resolvedSearchParams.cashManagementId),
      currency: toStringValue(resolvedSearchParams.currency),
      applicationStatus: toStringValue(resolvedSearchParams.applicationStatus),
      status: toStringValue(resolvedSearchParams.status),
      collectionDate: toStringValue(resolvedSearchParams.collectionDate),
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar los cobros';
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

  const activeFiltersCount = Array.from(filterParams.values()).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Wallet size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Cobros</h2>
                  <p className="text-muted-foreground">
                    Consulta de collections con filtros por factura, caja y estado.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<Hash className="size-4" />} />
              <StatCard label="Filtros" value={activeFiltersCount} icon={<Search className="size-4" />} />
              <StatCard label="Página" value={response.paging.currentPage} icon={<CalendarDays className="size-4" />} />
              <StatCard label="Por página" value={response.paging.perPage} icon={<ReceiptText className="size-4" />} />
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Los filtros se pueden expandir o contraer según lo necesites.
          </p>
          <CrearCobroModal />
        </div>

        <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm" open>
          <summary className="cursor-pointer list-none text-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Filtros de búsqueda</span>
              <span className="text-sm text-muted-foreground">Contraer / expandir</span>
            </div>
          </summary>

          <div className="mt-5">
            <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FilterInput label="Número" name="number" defaultValue={toStringValue(resolvedSearchParams.number)} placeholder="Número de cobro" />
              <FilterInput label="Factura ID" name="invoiceId" defaultValue={toStringValue(resolvedSearchParams.invoiceId)} placeholder="ID de factura" />
              <FilterInput label="Documento factura" name="invoiceDocument" defaultValue={toStringValue(resolvedSearchParams.invoiceDocument)} placeholder="Documento" />
              <FilterInput label="Caja registradora ID" name="cashRegisterId" defaultValue={toStringValue(resolvedSearchParams.cashRegisterId)} placeholder="ID de caja" />
              <FilterInput label="Gestión de caja ID" name="cashManagementId" defaultValue={toStringValue(resolvedSearchParams.cashManagementId)} placeholder="ID de gestión" />
              <FilterInput label="Moneda" name="currency" defaultValue={toStringValue(resolvedSearchParams.currency)} placeholder="USD o NIO" />
              <FilterInput label="Estado de aplicación" name="applicationStatus" defaultValue={toStringValue(resolvedSearchParams.applicationStatus)} placeholder="applicationStatus" />
              <FilterInput label="Estado" name="status" defaultValue={toStringValue(resolvedSearchParams.status)} placeholder="status" />
              <FilterInput label="Fecha de cobro" name="collectionDate" defaultValue={toStringValue(resolvedSearchParams.collectionDate)} placeholder="YYYY-MM-DD" />

              <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-end justify-between gap-3 pt-2">
                <div className="flex gap-3">
                  <button type="submit" className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90">
                    Buscar
                  </button>
                  <a href="/gestion-de-caja/cobros" className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                    Limpiar
                  </a>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Por página</span>
                  <select name="PerPage" defaultValue={String(perPage)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary">
                    {[10, 20, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {response.records.length > 0 ? (
                  response.records.map((record) => (
                    <tr key={record.id} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4 text-foreground">{record.id}</td>
                      <td className="px-4 py-4 text-foreground">{record.name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{record.description || 'Sin descripción'}</td>
                      <td className="px-4 py-4 text-foreground">{record.code}</td>
                      <td className="px-4 py-4 text-foreground">{record.branchName}</td>
                      <td className="px-4 py-4 text-muted-foreground">{record.branchId}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No hay cobros para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {response.paging.totalPages > 1 ? (
          <nav aria-label="Paginación cobros" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {response.paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(response.paging.currentPage - 1, response.paging.perPage, filterParams)}
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
                    href={buildPageHref(response.paging.currentPage + 1, response.paging.perPage, filterParams)}
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

function FilterInput({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
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
