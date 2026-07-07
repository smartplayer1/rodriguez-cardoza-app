import { headers } from 'next/headers';
import { ArrowUpFromLine, FileText, ReceiptText, Wallet } from 'lucide-react';

import NuevaSalidaModal from './nueva-salida-modal';
import SalidasTableModal from './salidas-table-modal';
import { getCashManagementOutflows } from '@/app/services/cash-management';

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

const formatAmount = (value: number) => {
  return new Intl.NumberFormat('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default async function SalidasCaja({
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
  const baseUrl = host ? `${protocol}://${host}` : undefined;

  let fetchError: string | null = null;
  let response;

  try {
    response = await getCashManagementOutflows({
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar las salidas de caja';
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

  const totalOutflow = response.records.reduce((sum, record) => sum + record.total, 0);
  const creditNoteLinked = response.records.filter((record) => record.creditNoteId !== null).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ArrowUpFromLine size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Salidas de Caja</h2>
                  <p className="text-muted-foreground">
                    Salidas con detalle de denominaciones y anulaciones.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<Wallet className="size-4" />} />
              <StatCard label="Total salidas" value={formatAmount(totalOutflow)} icon={<ReceiptText className="size-4" />} />
              <StatCard label="Con nota crédito" value={creditNoteLinked} icon={<FileText className="size-4" />} />
              <StatCard label="Página" value={response.paging.currentPage} icon={<ArrowUpFromLine className="size-4" />} />
            </div>
          </div>
        </header>

        <NuevaSalidaModal />

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la informacion desde el endpoint: {fetchError}
          </section>
        ) : null}

        <SalidasTableModal records={response.records} />

        {response.paging.totalPages > 1 ? (
          <nav aria-label="Paginación salidas de caja" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
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
