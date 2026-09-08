import { headers } from 'next/headers';
import { Users } from 'lucide-react';

import { getclients } from '@/app/services/clients';
import { getBranches } from '@/app/services/company/branch';
import { ClienteResponse, Paging } from '@/app/type/client';
import { BranchResponse } from '@/app/type/branch';
import ClientesClient from './ClientesClient';

type SearchParams = {
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

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const branchCode = toStringValue(resolvedSearchParams.branchCode);
  const page = toPositiveInt(resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.PerPage, DEFAULT_PER_PAGE);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;
  const context = { baseUrl, cookieHeader };

  let clientes: ClienteResponse[] = [];
  let paging: Paging = { perPage, currentPage: page, totalRecords: 0, totalPages: 1 };
  let fetchError: string | null = null;

  try {
    const response = await getclients({
      branchCode: branchCode || undefined,
      page,
      perPage,
      ...context,
    });
    clientes = response.records ?? [];
    paging = response.paging ?? paging;
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron cargar los clientes';
  }

  let branches: BranchResponse['records'] = [];
  try {
    const branchesResult: BranchResponse = await getBranches(context);
    branches = branchesResult.records;
  } catch (error) {
    console.error('Error al cargar sucursales:', error);
  }

  const buildPageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (branchCode) params.set('branchCode', branchCode);
    if (pageNumber > 1) params.set('Page', String(pageNumber));
    if (perPage !== DEFAULT_PER_PAGE) params.set('PerPage', String(perPage));
    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users size={32} className="text-primary" />
              <h2 className="text-foreground">Clientes</h2>
            </div>
            <p className="text-muted-foreground">Administre los clientes del sistema</p>
          </div>

          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="space-y-1">
              <span className="text-sm text-muted-foreground">Sucursal</span>
              <select
                name="branchCode"
                defaultValue={branchCode}
                className="border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.code}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-muted-foreground">Por página</span>
              <select
                name="PerPage"
                defaultValue={String(perPage)}
                className="border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Filtrar
            </button>
            {branchCode ? (
              <a
                href="/clientes"
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                Limpiar
              </a>
            ) : null}
          </form>
        </div>

        {fetchError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la información desde el endpoint: {fetchError}
          </div>
        ) : null}

        <ClientesClient
          key={`${branchCode}-${page}-${perPage}`}
          initialClientes={clientes}
          branches={branches}
        />

        {paging.totalPages > 1 ? (
          <nav aria-label="Paginación clientes" className="mt-4 rounded-2xl border border-border/60 bg-surface px-4 py-3">
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(paging.currentPage - 1)}
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
                Página {paging.currentPage} de {paging.totalPages} — Total registros: {paging.totalRecords}
              </li>
              <li>
                {paging.currentPage < paging.totalPages ? (
                  <a
                    href={buildPageHref(paging.currentPage + 1)}
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
