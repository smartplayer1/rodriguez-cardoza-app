import { headers } from 'next/headers';
import { CreditCard, MapPin, Package2, Plus, Warehouse } from 'lucide-react';

import { getCashRegisters } from '@/app/services/cash-management';
import NuevoCajaRegistradoraModal from './nuevo-caja-registradora-modal';
import EditarCajaLink from './editar-caja-link';

type SearchParams = {
  Page?: string | string[];
  page?: string | string[];
  perPage?: string | string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const toPositiveInt = (value: string | string[] | undefined, fallback: number) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPageHref = (pageNumber: number, perPage: number) => {
  const params = new URLSearchParams();

  if (pageNumber > 1) {
    params.set('page', String(pageNumber));
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set('perPage', String(perPage));
  }

  const query = params.toString();
  return query ? `?${query}` : '?';
};

export default async function CajasRegistradoras({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = toPositiveInt(resolvedSearchParams.page ?? resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.perPage, DEFAULT_PER_PAGE);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  let fetchError: string | null = null;
  let response;

  try {
    response = await getCashRegisters({
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar las cajas registradoras';
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Warehouse size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Cajas Registradoras</h2>
                  <p className="text-muted-foreground">
                    Catálogo de cajas registradoras asociadas a sucursales.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<CreditCard className="size-4" />} />
              <StatCard label="Sucursales" value={new Set(response.records.map((item) => item.branchId)).size} icon={<MapPin className="size-4" />} />
              <StatCard label="Página" value={response.paging.currentPage} icon={<Plus className="size-4" />} />
              <StatCard label="Total páginas" value={response.paging.totalPages} icon={<Package2 className="size-4" />} />
            </div>
          </div>
        </header>

        <NuevoCajaRegistradoraModal />

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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {response.records.length > 0 ? (
                  response.records.map((record) => (
                    <tr key={record.id} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4 text-foreground">{record.code}</td>
                      <td className="px-4 py-4 text-foreground">{record.name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{record.branchName}</td>
                      <td className="px-4 py-4 text-muted-foreground">{record.description || 'Sin descripción'}</td>
                      <td className="px-4 py-4 text-right">
                        <EditarCajaLink id={record.id} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No hay cajas registradoras para mostrar.
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
              <article key={`cash-register-${record.id}`} className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
                <div className="flex flex-col gap-2">
                  <h3 className="text-foreground">{record.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {record.code} · {record.branchName}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailCard label="Sucursal" value={record.branchName} />
                  <DetailCard label="Código" value={record.code} />
                  <DetailCard label="Descripción" value={record.description || 'Sin descripción'} />
                  <DetailCard label="ID" value={`#${record.id}`} />
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {response.paging.totalPages > 1 ? (
          <nav aria-label="Paginación cajas registradoras" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {response.paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(response.paging.currentPage - 1, response.paging.perPage)}
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
                    href={buildPageHref(response.paging.currentPage + 1, response.paging.perPage)}
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