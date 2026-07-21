import { headers } from 'next/headers';
import { CircleDollarSign, Landmark, Receipt } from 'lucide-react';

import { getCollectionsReport } from '@/app/services/billing/reports';
import { getCashRegisters } from '@/app/services/cash-management';
import { getBranches } from '@/app/services/company/branch';
import { CollectionsReportResponse } from '@/app/type/collections-report';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';
import ExportButtons from './export-buttons';
import CollectionsTable from './collections-table';

type SearchParams = {
  dateFrom?: string | string[];
  dateTo?: string | string[];
  cashManagementId?: string | string[];
  cashRegisterId?: string | string[];
  branchCode?: string | string[];
  currency?: string | string[];
  status?: string | string[];
  paymentMethod?: string | string[];
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

const formatCurrency = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

export default async function CobrosReportePage({
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
    ['cashManagementId', toStringValue(resolvedSearchParams.cashManagementId)],
    ['cashRegisterId', toStringValue(resolvedSearchParams.cashRegisterId)],
    ['branchCode', toStringValue(resolvedSearchParams.branchCode)],
    ['currency', toStringValue(resolvedSearchParams.currency)],
    ['status', toStringValue(resolvedSearchParams.status)],
    ['paymentMethod', toStringValue(resolvedSearchParams.paymentMethod)],
  ] as const;

  const filterParams = new URLSearchParams();
  for (const [key, value] of filterFields) {
    if (value) {
      filterParams.set(key, value);
    }
  }

  const [branchesResult, cashRegistersResult] = await Promise.allSettled([
    getBranches(context),
    getCashRegisters(context),
  ]);

  const branches = branchesResult.status === 'fulfilled' ? normalizeBranchOptions(branchesResult.value) : [];
  const cashRegisters = cashRegistersResult.status === 'fulfilled' ? cashRegistersResult.value.records : [];

  let response: CollectionsReportResponse;
  let fetchError: string | null = null;

  try {
    response = await getCollectionsReport({
      dateFrom,
      dateTo,
      cashManagementId: resolvedSearchParams.cashManagementId
        ? Number(toStringValue(resolvedSearchParams.cashManagementId))
        : undefined,
      cashRegisterId: resolvedSearchParams.cashRegisterId
        ? Number(toStringValue(resolvedSearchParams.cashRegisterId))
        : undefined,
      branchCode: toStringValue(resolvedSearchParams.branchCode) || undefined,
      currency: toStringValue(resolvedSearchParams.currency) || undefined,
      status: toStringValue(resolvedSearchParams.status) || undefined,
      paymentMethod: toStringValue(resolvedSearchParams.paymentMethod) || undefined,
      page,
      perPage,
      ...context,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar el reporte';
    response = {
      summary: { collectionCount: 0, cashTotal: 0, transferTotal: 0, totalReceived: 0, appliedAmountNio: 0 },
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
                <Receipt size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Reporte de Cobros</h2>
                  <p className="text-muted-foreground">
                    Cobros recibidos en efectivo y transferencia, con las facturas que aplican.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              <StatCard label="Cobros" value={summary.collectionCount} icon={<Receipt className="size-4" />} />
              <StatCard
                label="Efectivo C$"
                value={formatCurrency(summary.cashTotal)}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Transferencia C$"
                value={formatCurrency(summary.transferTotal)}
                icon={<Landmark className="size-4" />}
              />
              <StatCard
                label="Total Recibido C$"
                value={formatCurrency(summary.totalReceived)}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Aplicado C$"
                value={formatCurrency(summary.appliedAmountNio)}
                icon={<CircleDollarSign className="size-4" />}
              />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-end">
          <ExportButtons filtersQueryString={filterParams.toString()} recordCount={summary.collectionCount} />
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

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Caja registradora</span>
                <select
                  name="cashRegisterId"
                  defaultValue={toStringValue(resolvedSearchParams.cashRegisterId)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todas las cajas</option>
                  {cashRegisters.map((register) => (
                    <option key={register.id} value={register.id}>
                      {register.name} ({register.code})
                    </option>
                  ))}
                </select>
              </label>

              <FilterInput
                label="Gestión de caja"
                name="cashManagementId"
                defaultValue={toStringValue(resolvedSearchParams.cashManagementId)}
                placeholder="ID de gestión de caja"
              />

              <FilterInput
                label="Moneda"
                name="currency"
                defaultValue={toStringValue(resolvedSearchParams.currency)}
                placeholder="USD o NIO"
              />

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Estado</span>
                <select
                  name="status"
                  defaultValue={toStringValue(resolvedSearchParams.status)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </label>

              <FilterInput
                label="Método de pago"
                name="paymentMethod"
                defaultValue={toStringValue(resolvedSearchParams.paymentMethod)}
                placeholder="Efectivo o Transferencia"
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
                    href="/reportes/cobros"
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

        <CollectionsTable records={records} />

        {paging.totalPages > 1 ? (
          <nav aria-label="Paginación cobros" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
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
