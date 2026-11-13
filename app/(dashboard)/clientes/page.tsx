import { headers } from 'next/headers';
import { Users } from 'lucide-react';

import { ClientsRequestError, getclients } from '@/app/services/clients';
import { getBranches } from '@/app/services/company/branch';
import { ClienteResponse, ClientFilters, ClientTypeFilter, Paging } from '@/app/type/client';
import { BranchResponse } from '@/app/type/branch';
import ClientesClient from './ClientesClient';
import ClientesFiltros, { ClientesFiltrosValues, EMPTY_FILTERS } from './clientes-filtros';
import { PromotorOption } from './promotor-search';

type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const CLIENT_TYPES: ClientTypeFilter[] = ['ASESOR', 'PROMOTOR'];

const first = (value: string | string[] | undefined) =>
  ((Array.isArray(value) ? value[0] : value) ?? '').trim();

// Page/PerPage deben ser >= 1 (la API responde error con 0 o negativos).
const toPositiveInt = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
};

const toOptionalId = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
};

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  const values: ClientesFiltrosValues = {
    ...EMPTY_FILTERS,
    Code: first(sp.Code),
    Name: first(sp.Name),
    IDNumber: first(sp.IDNumber),
    PhoneNumber: first(sp.PhoneNumber),
    ClientType: CLIENT_TYPES.includes(first(sp.ClientType) as ClientTypeFilter) ? first(sp.ClientType) : '',
    ZoneCode: first(sp.ZoneCode),
    Address: first(sp.Address),
    Province: first(sp.Province),
    District: first(sp.District),
    Canton: first(sp.Canton),
    Id: toOptionalId(first(sp.Id)) ? first(sp.Id) : '',
    BranchId: toOptionalId(first(sp.BranchId)) ? first(sp.BranchId) : '',
    PromoterId: toOptionalId(first(sp.PromoterId)) ? first(sp.PromoterId) : '',
    DateOfEntry: isIsoDate(first(sp.DateOfEntry)) ? first(sp.DateOfEntry) : '',
  };

  const page = toPositiveInt(first(sp.Page), DEFAULT_PAGE);
  const perPage = toPositiveInt(first(sp.PerPage), DEFAULT_PER_PAGE);
  values.PerPage = String(perPage);

  const filters: ClientFilters = {
    code: values.Code,
    name: values.Name,
    idNumber: values.IDNumber,
    phoneNumber: values.PhoneNumber,
    clientType: values.ClientType as ClientTypeFilter | '',
    zoneCode: values.ZoneCode,
    address: values.Address,
    province: values.Province,
    district: values.District,
    canton: values.Canton,
    id: toOptionalId(values.Id),
    branchId: toOptionalId(values.BranchId),
    promoterId: toOptionalId(values.PromoterId),
    dateOfEntry: values.DateOfEntry,
    page,
    perPage,
  };

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;
  const context = { baseUrl, cookieHeader };

  let clientes: ClienteResponse[] = [];
  let paging: Paging = { perPage, currentPage: page, totalRecords: 0, totalPages: 0 };
  let fetchError: string | null = null;
  let forbidden = false;

  // La API pagina y ordena por nombre; se usa su paging tal cual.
  try {
    const response = await getclients({ ...filters, ...context });
    clientes = response.records ?? [];
    paging = response.paging ?? paging;
  } catch (error) {
    // 403: el usuario no tiene sucursales asignadas; se muestra el detail.
    forbidden = error instanceof ClientsRequestError && error.status === 403;
    fetchError = error instanceof Error ? error.message : 'No se pudieron cargar los clientes';
  }

  let branches: BranchResponse['records'] = [];
  try {
    const branchesResult: BranchResponse = await getBranches(context);
    branches = branchesResult.records;
  } catch (error) {
    console.error('Error al cargar sucursales:', error);
  }

  // Nombre del promotor seleccionado, para mostrarlo en el buscador.
  let initialPromoter: PromotorOption | null = null;
  if (filters.promoterId) {
    const fromResults = clientes.find((c) => c.promoter?.id === filters.promoterId)?.promoter;
    if (fromResults) {
      initialPromoter = fromResults;
    } else {
      try {
        const response = await getclients({ id: filters.promoterId, page: 1, perPage: 1, ...context });
        const match: ClienteResponse | undefined = response.records?.[0];
        initialPromoter = match
          ? { id: match.id, code: match.code, name: match.name }
          : { id: filters.promoterId, code: String(filters.promoterId), name: 'Promotor' };
      } catch {
        initialPromoter = { id: filters.promoterId, code: String(filters.promoterId), name: 'Promotor' };
      }
    }
  }

  const buildPageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    (Object.keys(values) as Array<keyof ClientesFiltrosValues>).forEach((key) => {
      if (key === 'PerPage') return;
      if (values[key]) params.set(key, values[key]);
    });
    if (perPage !== DEFAULT_PER_PAGE) params.set('PerPage', String(perPage));
    if (pageNumber > 1) params.set('Page', String(pageNumber));
    const query = params.toString();
    return query ? `/clientes?${query}` : '/clientes';
  };

  const filtersKey = buildPageHref(page);
  const totalPages = Math.max(paging.totalPages, 0);
  const currentPage = paging.currentPage || page;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={32} className="text-primary" />
            <h2 className="text-foreground">Clientes</h2>
          </div>
          <p className="text-muted-foreground">Administre los clientes del sistema</p>
        </div>

        <ClientesFiltros
          key={`filtros:${filtersKey}`}
          initialValues={values}
          initialPromoter={initialPromoter}
          branches={branches}
        />

        {fetchError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {forbidden ? fetchError : `No se pudieron cargar los clientes: ${fetchError}`}
          </div>
        ) : null}

        <ClientesClient key={`tabla:${filtersKey}`}initialClientes={clientes} branches={branches} />

        {!fetchError && (
          <nav
            aria-label="Paginación clientes"
            className="mt-4 rounded-2xl border border-border/60 bg-surface px-4 py-3"
          >
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {currentPage > 1 ? (
                  <a
                    href={buildPageHref(currentPage - 1)}
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
                Página {totalPages === 0 ? 0 : currentPage} de {totalPages} — Total registros: {paging.totalRecords}
              </li>
              <li>
                {currentPage < totalPages ? (
                  <a
                    href={buildPageHref(currentPage + 1)}
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
        )}
      </div>
    </div>
  );
}
