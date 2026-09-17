import { Suspense, type ReactNode } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Search } from 'lucide-react';

import BranchManagementClient from './branch-management-client';
import { getBranches } from '@/app/services/company/branch';
import { getDepartments } from '@/app/services/localities';
import { BranchResponse } from '@/app/type/branch';
import { LocalityDepartment } from '@/app/type/locality';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/loading-skeleton';

type SearchParams = {
  code?: string | string[];
  name?: string | string[];
  address?: string | string[];
  Page?: string | string[];
  PerPage?: string | string[];
};

const DEFAULT_PAGE = 1;
// El backend, si no se manda PerPage, por defecto trae 100 (a diferencia
// del resto de la API). Pedimos explícitamente 10 para que la vista sea
// consistente con el resto de listados y el usuario vea páginas manejables.
const DEFAULT_PER_PAGE = 10;
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const toPositiveInt = (value: string | string[] | undefined, fallback: number) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Ventana de números de página alrededor de la página actual, con el
// primero/último siempre visibles y "…" para los huecos — evita renderizar
// cientos de links si algún día hay muchas páginas.
const getPageWindow = (current: number, total: number): (number | 'ellipsis')[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: (number | 'ellipsis')[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push('ellipsis');
    }
    result.push(page);
  });

  return result;
};

export default async function SucursalesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  // Solo se resuelve la URL acá (instantáneo, no pega al backend). El fetch
  // real vive en <BranchResults>, envuelto en su propio <Suspense>, para que
  // cambiar de página/filtro solo reemplace esa parte — el encabezado y la
  // barra de filtros de abajo nunca se desmontan ni parpadean.
  const resolvedSearchParams = (await searchParams) ?? {};
  const code = toStringValue(resolvedSearchParams.code);
  const name = toStringValue(resolvedSearchParams.name);
  const address = toStringValue(resolvedSearchParams.address);
  const page = toPositiveInt(resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.PerPage, DEFAULT_PER_PAGE);

  const hasAnyFilter = !!code || !!name || !!address;

  const buildHref = (overrides: Partial<{ code: string; name: string; address: string; page: number }>) => {
    const next = {
      code: overrides.code !== undefined ? overrides.code : code,
      name: overrides.name !== undefined ? overrides.name : name,
      address: overrides.address !== undefined ? overrides.address : address,
      page: overrides.page !== undefined ? overrides.page : page,
    };

    const params = new URLSearchParams();
    if (next.code) params.set('code', next.code);
    if (next.name) params.set('name', next.name);
    if (next.address) params.set('address', next.address);
    if (next.page > 1) params.set('Page', String(next.page));
    if (perPage !== DEFAULT_PER_PAGE) params.set('PerPage', String(perPage));

    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 p-6">
        {/* Barra de filtros */}
        <div className="rounded-2xl border border-border/60 bg-surface px-5 py-4">
          <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
            <label className="flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Buscar por nombre</span>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="name"
                  defaultValue={name}
                  placeholder="Buscar por nombre de sucursal..."
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </label>

            <label className="w-full space-y-1 lg:w-48">
              <span className="text-xs font-medium text-muted-foreground">Código</span>
              <input
                name="code"
                defaultValue={code}
                placeholder="TD-02"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="w-full space-y-1 lg:w-36">
              <span className="text-xs font-medium text-muted-foreground">Por página</span>
              <select
                name="PerPage"
                defaultValue={String(perPage)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} por página
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Buscar
              </button>
              {hasAnyFilter ? (
                <Link
                  href="/configuraciones/empresa/sucursales"
                  className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Limpiar
                </Link>
              ) : null}
            </div>
          </form>

          <details className="group mt-2">
            <summary className="inline-flex cursor-pointer list-none items-center text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              Más filtros
            </summary>
            <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="code" value={code} />
              <input type="hidden" name="PerPage" value={perPage} />
              <label className="w-full space-y-1 sm:w-64">
                <span className="text-xs font-medium text-muted-foreground">Dirección</span>
                <input
                  name="address"
                  defaultValue={address}
                  placeholder="CLARO 30 VRS AL NORTE"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                Aplicar
              </button>
            </form>
          </details>

          {hasAnyFilter ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {name ? <FilterChip label="Nombre" value={name} href={buildHref({ name: '', page: 1 })} /> : null}
              {code ? <FilterChip label="Código" value={code} href={buildHref({ code: '', page: 1 })} /> : null}
              {address ? <FilterChip label="Dirección" value={address} href={buildHref({ address: '', page: 1 })} /> : null}
              <Link
                href="/configuraciones/empresa/sucursales"
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Limpiar todos
              </Link>
            </div>
          ) : null}
        </div>

        <Suspense key={`${code}-${name}-${address}-${page}-${perPage}`} fallback={<ResultsSkeleton />}>
          <BranchResults code={code} name={name} address={address} page={page} perPage={perPage} hasAnyFilter={hasAnyFilter} />
        </Suspense>
      </div>
    </div>
  );
}

async function BranchResults({
  code,
  name,
  address,
  page,
  perPage,
  hasAnyFilter,
}: {
  code: string;
  name: string;
  address: string;
  page: number;
  perPage: number;
  hasAnyFilter: boolean;
}) {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;
  const context = { baseUrl, cookieHeader };

  let response: BranchResponse = {
    records: [],
    paging: {
      perPage,
      currentPage: page,
      totalRecords: 0,
      totalPages: 1,
    },
  };
  let departments: LocalityDepartment[] = [];
  let fetchError: string | null = null;

  try {
    const [branchesResult, departmentsResult] = await Promise.all([
      getBranches({ code, name, address, page, perPage, ...context }),
      getDepartments(context),
    ]);
    response = branchesResult;
    departments = departmentsResult;
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar las sucursales';
  }

  const buildHref = (overrides: Partial<{ page: number }>) => {
    const next = { page: overrides.page !== undefined ? overrides.page : page };

    const params = new URLSearchParams();
    if (code) params.set('code', code);
    if (name) params.set('name', name);
    if (address) params.set('address', address);
    if (next.page > 1) params.set('Page', String(next.page));
    if (perPage !== DEFAULT_PER_PAGE) params.set('PerPage', String(perPage));

    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  const { totalRecords, totalPages, currentPage } = response.paging;
  const rangeFrom = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeTo = Math.min(currentPage * perPage, totalRecords);
  const pageWindow = getPageWindow(currentPage, totalPages);

  return (
    <>
      {!fetchError && (
        <p className="text-sm text-muted-foreground">
          {totalRecords === 0
            ? '0 sucursales encontradas'
            : `Mostrando ${rangeFrom}–${rangeTo} de ${totalRecords} sucursales`}
        </p>
      )}

      <BranchManagementClient
        initialRecords={response.records ?? []}
        departments={departments}
        fetchError={fetchError}
        hasAnyFilter={hasAnyFilter}
      />

      {!fetchError && totalPages > 1 ? (
        <nav aria-label="Paginación sucursales" className="flex items-center justify-center gap-1">
          <PageLink
            href={currentPage > 1 ? buildHref({ page: currentPage - 1 }) : undefined}
            disabled={currentPage <= 1}
          >
            ‹ Anterior
          </PageLink>

          {pageWindow.map((entry, index) =>
            entry === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={entry}
                href={buildHref({ page: entry })}
                aria-current={entry === currentPage ? 'page' : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition-colors ${
                  entry === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-foreground hover:bg-accent'
                }`}
              >
                {entry}
              </Link>
            ),
          )}

          <PageLink
            href={currentPage < totalPages ? buildHref({ page: currentPage + 1 }) : undefined}
            disabled={currentPage >= totalPages}
          >
            Siguiente ›
          </PageLink>
        </nav>
      ) : null}
    </>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string | undefined;
  disabled: boolean;
  children: ReactNode;
}) {
  const className = `inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm transition-colors ${
    disabled ? 'pointer-events-none opacity-40' : 'hover:bg-accent'
  }`;

  if (!href) {
    return (
      <span aria-disabled className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-disabled={disabled} className={className}>
      {children}
    </Link>
  );
}

function FilterChip({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
      {label}: {value}
      <Link href={href} aria-label={`Quitar filtro ${label}`} className="text-primary/70 hover:text-primary">
        ×
      </Link>
    </span>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-56" />
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <table className="min-w-full">
          <tbody>
            <TableSkeleton rows={6} columns={6} />
          </tbody>
        </table>
      </div>
    </>
  );
}
