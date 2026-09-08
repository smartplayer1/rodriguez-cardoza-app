import { headers } from 'next/headers';
import { ChevronDown, Ticket, TrendingDown, TrendingUp } from 'lucide-react';

import { getCouponMovementsReport } from '@/app/services/reward/reports';
import { getBranches } from '@/app/services/company/branch';
import {
  CouponMovementsReportResponse,
  CouponMovementType,
} from '@/app/type/reward-report';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';
import ExportButtons from './export-buttons';

type SearchParams = {
  dateFrom?: string | string[];
  dateTo?: string | string[];
  clientCode?: string | string[];
  movementType?: string | string[];
  branchCode?: string | string[];
  Page?: string | string[];
  PerPage?: string | string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const MOVEMENT_TYPE_OPTIONS: { value: CouponMovementType; label: string }[] = [
  { value: 'MonthlyAccrualCredit', label: 'Bono mensual (crédito)' },
  { value: 'MonthlyAccrualDebit', label: 'Consumo bono mensual (débito)' },
];

const MOVEMENT_TYPE_LABELS: Record<CouponMovementType, string> = {
  MonthlyAccrualCredit: 'Bono mensual (crédito)',
  MonthlyAccrualDebit: 'Consumo bono mensual (débito)',
};

const MOVEMENT_TYPE_BADGE_CLASS: Record<CouponMovementType, string> = {
  MonthlyAccrualCredit: 'bg-blue-100 text-blue-700',
  MonthlyAccrualDebit: 'bg-orange-100 text-orange-700',
};

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

const formatAmount = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
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

export default async function MovimientosDeCuponPage({
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

  const filterFields = [
    ['dateFrom', resolvedSearchParams.dateFrom],
    ['dateTo', resolvedSearchParams.dateTo],
    ['clientCode', resolvedSearchParams.clientCode],
    ['movementType', resolvedSearchParams.movementType],
    ['branchCode', resolvedSearchParams.branchCode],
  ] as const;

  const filterParams = new URLSearchParams();
  for (const [key, value] of filterFields) {
    const normalized = toStringValue(value);
    if (normalized) {
      filterParams.set(key, normalized);
    }
  }

  const branchesResult = await getBranches(context).catch(() => null);
  const branches = normalizeBranchOptions(branchesResult);

  let response: CouponMovementsReportResponse;
  let fetchError: string | null = null;

  try {
    response = await getCouponMovementsReport({
      dateFrom: toStringValue(resolvedSearchParams.dateFrom) || undefined,
      dateTo: toStringValue(resolvedSearchParams.dateTo) || undefined,
      clientCode: toStringValue(resolvedSearchParams.clientCode) || undefined,
      movementType: (toStringValue(resolvedSearchParams.movementType) || undefined) as
        | CouponMovementType
        | undefined,
      branchCode: toStringValue(resolvedSearchParams.branchCode) || undefined,
      page,
      perPage,
      ...context,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar el reporte';
    response = {
      summary: {
        recordCount: 0,
        monthlyAccrualCreditCount: 0,
        monthlyAccrualDebitCount: 0,
        totalCreditedAmount: 0,
        totalDebitedAmount: 0,
        netAmount: 0,
      },
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
                <Ticket size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Movimientos de Cupón</h2>
                  <p className="text-muted-foreground">
                    Créditos y débitos de cupón por bonificación mensual de compras, en un
                    rango de fechas, para todos los clientes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Total acreditado"
                value={formatAmount(summary.totalCreditedAmount)}
                icon={<TrendingUp className="size-4" />}
                tone="positive"
              />
              <StatCard
                label="Total debitado"
                value={formatAmount(summary.totalDebitedAmount)}
                icon={<TrendingDown className="size-4" />}
                tone="negative"
              />
              <StatCard
                label="Neto"
                value={formatAmount(summary.netAmount)}
                icon={summary.netAmount >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                tone={summary.netAmount >= 0 ? 'positive' : 'negative'}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <CountCard label="Registros" value={summary.recordCount} />
            <CountCard label="Bono mensual (crédito)" value={summary.monthlyAccrualCreditCount} />
            <CountCard label="Consumo bono mensual (débito)" value={summary.monthlyAccrualDebitCount} />
          </div>
        </header>

        <div className="flex items-center justify-end">
          <ExportButtons filtersQueryString={filterParams.toString()} recordCount={summary.recordCount} />
        </div>

        <details className="group rounded-3xl border border-border/60 bg-surface p-5 shadow-sm" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-foreground [&::-webkit-details-marker]:hidden">
            <span>Filtros de búsqueda</span>
            <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="mt-5">
            <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FilterInput
                label="Desde"
                name="dateFrom"
                type="date"
                defaultValue={toStringValue(resolvedSearchParams.dateFrom)}
              />
              <FilterInput
                label="Hasta"
                name="dateTo"
                type="date"
                defaultValue={toStringValue(resolvedSearchParams.dateTo)}
              />
              <FilterInput
                label="Código de cliente"
                name="clientCode"
                defaultValue={toStringValue(resolvedSearchParams.clientCode)}
                placeholder="Código de cliente"
              />

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Tipo de movimiento</span>
                <select
                  name="movementType"
                  defaultValue={toStringValue(resolvedSearchParams.movementType)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos los tipos</option>
                  {MOVEMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

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

              <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-end justify-between gap-3 pt-2">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Buscar
                  </button>
                  <a
                    href="/reportes/movimientos-de-cupon"
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
                    {[20, 50, 100].map((value) => (
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Factura</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Saldo disponible</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(record.movementDate)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.clientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.clientCode} · {record.clientType}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.branchName}</div>
                        <div className="text-xs text-muted-foreground">{record.branchCode}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${MOVEMENT_TYPE_BADGE_CLASS[record.movementType]}`}
                        >
                          {MOVEMENT_TYPE_LABELS[record.movementType]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {record.invoiceDocument ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {formatAmount(record.amount)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                        {record.remainingAmount == null ? '-' : formatAmount(record.remainingAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No hay movimientos de cupón para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {paging.totalPages > 1 ? (
          <nav aria-label="Paginación movimientos de cupón" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
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
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: 'positive' | 'negative';
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div
        className={`flex items-center gap-2 text-xs uppercase tracking-wide ${
          tone === 'positive' ? 'text-green-600' : 'text-rose-600'
        }`}
      >
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
