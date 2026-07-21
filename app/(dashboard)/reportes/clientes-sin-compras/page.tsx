import { headers } from 'next/headers';
import { Building2, Phone, UserX, Users } from 'lucide-react';

import { getClientsWithoutPurchasesReport } from '@/app/services/clients/reports';
import { getBranches } from '@/app/services/company/branch';
import { ClientsWithoutPurchasesResponse } from '@/app/type/client-report';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';
import ExportButtons from './export-buttons';

type SearchParams = {
  dateFrom?: string | string[];
  dateTo?: string | string[];
  branchCode?: string | string[];
  clientType?: string | string[];
  clientCode?: string | string[];
  clientName?: string | string[];
  promoterCode?: string | string[];
  canton?: string | string[];
  phoneNumber?: string | string[];
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

const pad = (value: number) => String(value).padStart(2, '0');

const getFirstDayOfCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
};

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

const normalizeBranchOptions = (payload: unknown) => {
  const records = (payload as BranchResponse | null)?.records;

  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((branch) => ({
    code: (branch as RecordsBranch).code,
    name: (branch as RecordsBranch).name,
  }));
};

export default async function ClientesSinComprasPage({
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

  const context = { baseUrl, cookieHeader };

  const dateFrom = toStringValue(resolvedSearchParams.dateFrom) || getFirstDayOfCurrentMonth();
  const dateTo = toStringValue(resolvedSearchParams.dateTo) || getToday();

  const filterFields = [
    ['dateFrom', dateFrom],
    ['dateTo', dateTo],
    ['branchCode', toStringValue(resolvedSearchParams.branchCode)],
    ['clientType', toStringValue(resolvedSearchParams.clientType)],
    ['clientCode', toStringValue(resolvedSearchParams.clientCode)],
    ['clientName', toStringValue(resolvedSearchParams.clientName)],
    ['promoterCode', toStringValue(resolvedSearchParams.promoterCode)],
    ['canton', toStringValue(resolvedSearchParams.canton)],
    ['phoneNumber', toStringValue(resolvedSearchParams.phoneNumber)],
  ] as const;

  const filterParams = new URLSearchParams();
  for (const [key, value] of filterFields) {
    if (value) {
      filterParams.set(key, value);
    }
  }

  const branchesResult = await getBranches(context).catch(() => null);
  const branches = branchesResult ? normalizeBranchOptions(branchesResult) : [];

  let response: ClientsWithoutPurchasesResponse;
  let fetchError: string | null = null;

  try {
    response = await getClientsWithoutPurchasesReport({
      dateFrom,
      dateTo,
      branchCode: toStringValue(resolvedSearchParams.branchCode) || undefined,
      clientType: toStringValue(resolvedSearchParams.clientType) || undefined,
      clientCode: toStringValue(resolvedSearchParams.clientCode) || undefined,
      clientName: toStringValue(resolvedSearchParams.clientName) || undefined,
      promoterCode: toStringValue(resolvedSearchParams.promoterCode) || undefined,
      canton: toStringValue(resolvedSearchParams.canton) || undefined,
      phoneNumber: toStringValue(resolvedSearchParams.phoneNumber) || undefined,
      page,
      perPage,
      ...context,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar el reporte';
    response = {
      summary: { clientCount: 0 },
      records: { records: [], paging: { perPage, currentPage: page, totalRecords: 0, totalPages: 1 } },
    };
  }

  const { summary } = response;
  const { records, paging } = response.records;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <UserX size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Clientes Sin Compras</h2>
                  <p className="text-muted-foreground">
                    Clientes que no registran compras en el período seleccionado.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <StatCard label="Clientes sin compras" value={summary.clientCount} icon={<Users className="size-4" />} />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-end">
          <ExportButtons filtersQueryString={filterParams.toString()} recordCount={summary.clientCount} />
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
              <FilterInput label="Desde" name="dateFrom" type="date" defaultValue={dateFrom} />
              <FilterInput label="Hasta" name="dateTo" type="date" defaultValue={dateTo} />

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Sucursal</span>
                <select
                  name="branchCode"
                  defaultValue={toStringValue(resolvedSearchParams.branchCode)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.code} value={branch.code}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <FilterInput
                label="Tipo de cliente"
                name="clientType"
                defaultValue={toStringValue(resolvedSearchParams.clientType)}
                placeholder="Tipo de cliente"
              />
              <FilterInput
                label="Código de cliente"
                name="clientCode"
                defaultValue={toStringValue(resolvedSearchParams.clientCode)}
                placeholder="Código de cliente"
              />
              <FilterInput
                label="Nombre de cliente"
                name="clientName"
                defaultValue={toStringValue(resolvedSearchParams.clientName)}
                placeholder="Nombre de cliente"
              />
              <FilterInput
                label="Código de promotor"
                name="promoterCode"
                defaultValue={toStringValue(resolvedSearchParams.promoterCode)}
                placeholder="Código de promotor"
              />
              <FilterInput
                label="Cantón"
                name="canton"
                defaultValue={toStringValue(resolvedSearchParams.canton)}
                placeholder="Cantón"
              />
              <FilterInput
                label="Teléfono"
                name="phoneNumber"
                defaultValue={toStringValue(resolvedSearchParams.phoneNumber)}
                placeholder="Teléfono"
              />

              <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-end justify-between gap-3 pt-2">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Buscar
                  </button>
                  <a
                    href="/reportes/clientes-sin-compras"
                    className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Limpiar
                  </a>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Por página</span>
                  <select
                    name="PerPage"
                    defaultValue={String(perPage)}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {[10, 25, 50, 100].map((value) => (
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
            No se pudo cargar la información desde el endpoint: {fetchError}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cantón</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Promotor</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {records.length > 0 ? (
                  records.map((record, index) => (
                    <tr key={`${record.clientCode}-${index}`} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.clientName}</div>
                        <div className="text-xs text-muted-foreground">{record.clientCode}</div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-4" />
                          {record.phoneNumber || 'N/D'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground">{record.canton || '-'}</td>
                      <td className="px-4 py-4 text-foreground">{record.clientType}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-foreground">
                          <Building2 className="size-4" />
                          {record.branchName || record.branchCode}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.promoterName ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{record.promoterCode ?? '-'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No hay clientes para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {paging.totalPages > 1 ? (
          <nav aria-label="Paginación clientes sin compras" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(paging.currentPage - 1, paging.perPage, filterParams)}
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
                Página {paging.currentPage} de {paging.totalPages}
              </li>
              <li>
                {paging.currentPage < paging.totalPages ? (
                  <a
                    href={buildPageHref(paging.currentPage + 1, paging.perPage, filterParams)}
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
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type={type}
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
