import { headers } from 'next/headers';
import { CircleDollarSign, Scale, Wallet } from 'lucide-react';

import { getCashManagementReport } from '@/app/services/billing/reports';
import { getCashRegisters } from '@/app/services/cash-management';
import { getBranches } from '@/app/services/company/branch';
import { getEmployees } from '@/app/services/employee';
import { CashManagementReportResponse } from '@/app/type/cash-management-report';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';
import ExportButtons from './export-buttons';

type SearchParams = {
  dateFrom?: string | string[];
  dateTo?: string | string[];
  cashRegisterId?: string | string[];
  branchCode?: string | string[];
  responsibleEmployeeId?: string | string[];
  status?: string | string[];
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

const formatCurrency = (value: number, currency: 'NIO' | 'USD') =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
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

const buildEmployeeFullName = (employee: {
  firstname: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
}) =>
  [employee.firstname, employee.middleName, employee.lastName, employee.secondLastName]
    .filter(Boolean)
    .join(' ');

export default async function GestionDeCajaReportePage({
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
    ['cashRegisterId', toStringValue(resolvedSearchParams.cashRegisterId)],
    ['branchCode', toStringValue(resolvedSearchParams.branchCode)],
    ['responsibleEmployeeId', toStringValue(resolvedSearchParams.responsibleEmployeeId)],
    ['status', toStringValue(resolvedSearchParams.status)],
  ] as const;

  const filterParams = new URLSearchParams();
  for (const [key, value] of filterFields) {
    if (value) {
      filterParams.set(key, value);
    }
  }

  const [branchesResult, cashRegistersResult, employeesResult] = await Promise.allSettled([
    getBranches(context),
    getCashRegisters(context),
    getEmployees(context),
  ]);

  const branches = branchesResult.status === 'fulfilled' ? normalizeBranchOptions(branchesResult.value) : [];
  const cashRegisters = cashRegistersResult.status === 'fulfilled' ? cashRegistersResult.value.records : [];
  const employees = employeesResult.status === 'fulfilled' ? employeesResult.value.records : [];

  let response: CashManagementReportResponse;
  let fetchError: string | null = null;

  try {
    response = await getCashManagementReport({
      dateFrom,
      dateTo,
      cashRegisterId: resolvedSearchParams.cashRegisterId
        ? Number(toStringValue(resolvedSearchParams.cashRegisterId))
        : undefined,
      branchCode: toStringValue(resolvedSearchParams.branchCode) || undefined,
      responsibleEmployeeId: resolvedSearchParams.responsibleEmployeeId
        ? Number(toStringValue(resolvedSearchParams.responsibleEmployeeId))
        : undefined,
      status: toStringValue(resolvedSearchParams.status) || undefined,
      page,
      perPage,
      ...context,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar el reporte';
    response = {
      summary: {
        managementCount: 0,
        openCount: 0,
        closedCount: 0,
        expectedNio: 0,
        expectedUsd: 0,
        actualNio: 0,
        actualUsd: 0,
        differenceNio: 0,
        differenceUsd: 0,
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
                <Wallet size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Reporte de Gestión de Caja</h2>
                  <p className="text-muted-foreground">
                    Aperturas, cierres y diferencias de caja por período.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              <StatCard label="Gestiones" value={summary.managementCount} icon={<Wallet className="size-4" />} />
              <StatCard label="Abiertas" value={summary.openCount} icon={<Wallet className="size-4" />} />
              <StatCard label="Cerradas" value={summary.closedCount} icon={<Wallet className="size-4" />} />
              <StatCard
                label="Esperado C$"
                value={formatCurrency(summary.expectedNio, 'NIO')}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Real C$"
                value={formatCurrency(summary.actualNio, 'NIO')}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Diferencia C$"
                value={formatCurrency(summary.differenceNio, 'NIO')}
                icon={<Scale className="size-4" />}
              />
              <StatCard
                label="Esperado US$"
                value={formatCurrency(summary.expectedUsd, 'USD')}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Real US$"
                value={formatCurrency(summary.actualUsd, 'USD')}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Diferencia US$"
                value={formatCurrency(summary.differenceUsd, 'USD')}
                icon={<Scale className="size-4" />}
              />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-end">
          <ExportButtons filtersQueryString={filterParams.toString()} recordCount={summary.managementCount} />
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

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Empleado responsable</span>
                <select
                  name="responsibleEmployeeId"
                  defaultValue={toStringValue(resolvedSearchParams.responsibleEmployeeId)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos los empleados</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {buildEmployeeFullName(employee)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Estado</span>
                <select
                  name="status"
                  defaultValue={toStringValue(resolvedSearchParams.status)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos</option>
                  <option value="Abierta">Abierta</option>
                  <option value="Cerrada">Cerrada</option>
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
                    href="/reportes/gestion-de-caja"
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caja</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsable</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Abierta</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cerrada</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Esperado C$</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Real C$</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Dif. C$</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Esperado US$</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Real US$</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Dif. US$</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.cashManagementId} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.cashRegisterName}</div>
                        <div className="text-xs text-muted-foreground">{record.cashRegisterCode}</div>
                      </td>
                      <td className="px-4 py-4 text-foreground">{record.branchName ?? record.branchCode}</td>
                      <td className="px-4 py-4 text-foreground">{record.responsibleEmployeeName}</td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {formatDateTime(record.openedAt)}
                        <div>{record.openedByUserName}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {formatDateTime(record.closedAt)}
                        {record.closedByUserName && <div>{record.closedByUserName}</div>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            record.status.toLowerCase() === 'abierta'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {formatCurrency(record.expectedNio, 'NIO')}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {formatCurrency(record.actualNio, 'NIO')}
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-mono ${
                          record.differenceNio === 0
                            ? 'text-foreground'
                            : record.differenceNio > 0
                              ? 'text-green-700'
                              : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(record.differenceNio, 'NIO')}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {formatCurrency(record.expectedUsd, 'USD')}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {formatCurrency(record.actualUsd, 'USD')}
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-mono ${
                          record.differenceUsd === 0
                            ? 'text-foreground'
                            : record.differenceUsd > 0
                              ? 'text-green-700'
                              : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(record.differenceUsd, 'USD')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                      No hay registros para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {paging.totalPages > 1 ? (
          <nav aria-label="Paginación gestión de caja" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
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
