import { headers } from 'next/headers';
import { BarChart3, Percent, Target, Users } from 'lucide-react';

import { getAgentsNearGoalsReport } from '@/app/services/reward/reports';
import { getRewardIncentiveRules } from '@/app/services/reward/incentive';
import { getBranches } from '@/app/services/company/branch';
import { AgentsNearGoalsResponse } from '@/app/type/reward-report';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';
import ExportButtons from './export-buttons';

type SearchParams = {
  activeOnFrom?: string | string[];
  activeOnTo?: string | string[];
  incentiveRuleId?: string | string[];
  incentiveRuleName?: string | string[];
  ruleType?: string | string[];
  participantClientType?: string | string[];
  clientCode?: string | string[];
  clientName?: string | string[];
  clientType?: string | string[];
  promoterCode?: string | string[];
  branchCode?: string | string[];
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

const formatPercentage = (value: number | null) =>
  value === null || value === undefined ? '-' : `${value.toFixed(1)}%`;

const formatNumber = (value: number | null) =>
  value === null || value === undefined ? '-' : value.toLocaleString('es-NI', { maximumFractionDigits: 2 });

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-orange-500';
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

export default async function AgentesCercaDeMetaPage({
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
    ['activeOnFrom', resolvedSearchParams.activeOnFrom],
    ['activeOnTo', resolvedSearchParams.activeOnTo],
    ['incentiveRuleId', resolvedSearchParams.incentiveRuleId],
    ['incentiveRuleName', resolvedSearchParams.incentiveRuleName],
    ['ruleType', resolvedSearchParams.ruleType],
    ['participantClientType', resolvedSearchParams.participantClientType],
    ['clientCode', resolvedSearchParams.clientCode],
    ['clientName', resolvedSearchParams.clientName],
    ['clientType', resolvedSearchParams.clientType],
    ['promoterCode', resolvedSearchParams.promoterCode],
    ['branchCode', resolvedSearchParams.branchCode],
  ] as const;

  const filterParams = new URLSearchParams();
  for (const [key, value] of filterFields) {
    const normalized = toStringValue(value);
    if (normalized) {
      filterParams.set(key, normalized);
    }
  }

  const [rulesResult, branchesResult] = await Promise.allSettled([
    getRewardIncentiveRules(context),
    getBranches(context),
  ]);

  const rules = rulesResult.status === 'fulfilled' ? rulesResult.value.records : [];
  const branches = branchesResult.status === 'fulfilled' ? normalizeBranchOptions(branchesResult.value) : [];

  let response: AgentsNearGoalsResponse;
  let fetchError: string | null = null;

  try {
    response = await getAgentsNearGoalsReport({
      activeOnFrom: toStringValue(resolvedSearchParams.activeOnFrom) || undefined,
      activeOnTo: toStringValue(resolvedSearchParams.activeOnTo) || undefined,
      incentiveRuleId: resolvedSearchParams.incentiveRuleId
        ? Number(toStringValue(resolvedSearchParams.incentiveRuleId))
        : undefined,
      incentiveRuleName: toStringValue(resolvedSearchParams.incentiveRuleName) || undefined,
      ruleType: toStringValue(resolvedSearchParams.ruleType) || undefined,
      participantClientType: toStringValue(resolvedSearchParams.participantClientType) || undefined,
      clientCode: toStringValue(resolvedSearchParams.clientCode) || undefined,
      clientName: toStringValue(resolvedSearchParams.clientName) || undefined,
      clientType: toStringValue(resolvedSearchParams.clientType) || undefined,
      promoterCode: toStringValue(resolvedSearchParams.promoterCode) || undefined,
      branchCode: toStringValue(resolvedSearchParams.branchCode) || undefined,
      page,
      perPage,
      ...context,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar el reporte';
    response = {
      summary: { participantCount: 0, recordCount: 0, averageOverallProgressPercentage: 0 },
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
                <BarChart3 size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Agentes Cerca de Meta</h2>
                  <p className="text-muted-foreground">
                    Progreso de clientes y promotores frente a las metas de incentivos activos.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              <StatCard label="Participantes" value={summary.participantCount} icon={<Users className="size-4" />} />
              <StatCard label="Registros" value={summary.recordCount} icon={<Target className="size-4" />} />
              <StatCard
                label="Progreso promedio"
                value={`${summary.averageOverallProgressPercentage.toFixed(1)}%`}
                icon={<Percent className="size-4" />}
              />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-end">
          <ExportButtons filtersQueryString={filterParams.toString()} recordCount={summary.recordCount} />
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
              <FilterInput
                label="Activo desde"
                name="activeOnFrom"
                type="date"
                defaultValue={toStringValue(resolvedSearchParams.activeOnFrom)}
              />
              <FilterInput
                label="Activo hasta"
                name="activeOnTo"
                type="date"
                defaultValue={toStringValue(resolvedSearchParams.activeOnTo)}
              />

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Regla de incentivo</span>
                <select
                  name="incentiveRuleId"
                  defaultValue={toStringValue(resolvedSearchParams.incentiveRuleId)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todas las reglas</option>
                  {rules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </label>

              <FilterInput
                label="Nombre de regla"
                name="incentiveRuleName"
                defaultValue={toStringValue(resolvedSearchParams.incentiveRuleName)}
                placeholder="Buscar por nombre de regla"
              />

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Tipo de regla</span>
                <select
                  name="ruleType"
                  defaultValue={toStringValue(resolvedSearchParams.ruleType)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos los tipos</option>
                  <option value="ProductVolume">Por Productos</option>
                  <option value="AmountPurchased">Por Monto</option>
                  <option value="Mixed">Mixto</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Tipo de participante</span>
                <select
                  name="participantClientType"
                  defaultValue={toStringValue(resolvedSearchParams.participantClientType)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos</option>
                  <option value="Promotor">Promotor</option>
                  <option value="Asesor">Asesor</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </label>

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
                label="Tipo de cliente"
                name="clientType"
                defaultValue={toStringValue(resolvedSearchParams.clientType)}
                placeholder="Tipo de cliente"
              />
              <FilterInput
                label="Código de promotor"
                name="promoterCode"
                defaultValue={toStringValue(resolvedSearchParams.promoterCode)}
                placeholder="Código de promotor"
              />

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
                    href="/reportes/agentes-cerca-de-meta"
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Promotor</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Regla</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vigencia</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">% Monto</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">% Producto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Progreso general</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ganados</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {records.length > 0 ? (
                  records.map((record, index) => (
                    <tr key={`${record.clientCode}-${record.incentiveRuleId}-${index}`} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.clientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.clientCode} · {record.clientType}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.promoterName ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{record.promoterCode ?? '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-foreground">{record.incentiveRuleName}</div>
                        <div className="text-xs text-muted-foreground">{record.ruleType}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {formatDate(record.ruleStartDate)} - {formatDate(record.ruleEndDate)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {record.amountTarget != null ? (
                          <>
                            {formatPercentage(record.amountProgressPercentage)}
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(record.amountProgress)} / {formatNumber(record.amountTarget)}
                            </div>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-foreground">
                        {record.productVolumeTargetQuantity != null ? (
                          <>
                            {formatPercentage(record.productVolumeProgressPercentage)}
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(record.productVolumeProgress)} / {formatNumber(record.productVolumeTargetQuantity)}
                            </div>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-foreground">{record.overallProgressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full ${getProgressBarColor(record.overallProgressPercentage)} transition-all duration-500`}
                              style={{ width: `${Math.min(record.overallProgressPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-foreground">
                        {record.winsCount}/{record.maxWinsPerClient ?? '∞'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              record.isGoalReached ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {record.isGoalReached ? 'Meta alcanzada' : 'En progreso'}
                          </span>
                          {record.isMaxWinsReached && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                              Máximo alcanzado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No hay registros para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {paging.totalPages > 1 ? (
          <nav aria-label="Paginación agentes cerca de meta" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
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
