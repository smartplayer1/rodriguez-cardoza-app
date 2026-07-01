import { headers } from 'next/headers';
import { ArrowUpFromLine, FileText, ReceiptText, Wallet } from 'lucide-react';

import NuevaSalidaModal from './nueva-salida-modal';
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

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Pendiente';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatAmount = (value: number) => {
  return new Intl.NumberFormat('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusClasses = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('anulada') || normalizedStatus.includes('void')) {
    return 'bg-rose-100 text-rose-700';
  }

  if (normalizedStatus.includes('activa') || normalizedStatus.includes('completed') || normalizedStatus.includes('aplicada')) {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-slate-200 text-slate-700';
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

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Número</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gestión</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Concepto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nota crédito</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {response.records.length > 0 ? (
                  response.records.map((record) => (
                    <tr key={record.id} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4 text-foreground">{record.number}</td>
                      <td className="px-4 py-4 text-muted-foreground">#{record.cashManagementId}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDateTime(record.occurredAt)}</td>
                      <td className="px-4 py-4 text-foreground">{record.concept}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-foreground">{formatAmount(record.total)}</td>
                      <td className="px-4 py-4 text-muted-foreground">{record.creditNoteId ? `#${record.creditNoteId}` : 'Sin vínculo'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No hay salidas para mostrar.
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
              <article key={`outflow-${record.id}`} className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-foreground">Salida #{record.number}</h3>
                    <p className="text-sm text-muted-foreground">
                      Gestión #{record.cashManagementId} · {record.concept}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.status)}`}>
                    {record.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailCard label="Fecha" value={formatDateTime(record.occurredAt)} />
                  <DetailCard label="Descripción" value={record.description || 'Sin descripción'} />
                  <DetailCard label="Nota crédito" value={record.creditNoteId ? `#${record.creditNoteId}` : 'Sin vínculo'} />
                  <DetailCard label="Anulada" value={record.voidedAt ? `${formatDateTime(record.voidedAt)} · ${record.voidedBy ?? 'N/D'}` : 'No'} />
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-border/60 bg-background/60">
                  <div className="border-b border-border/60 px-4 py-3">
                    <h4 className="text-sm font-medium text-foreground">Denominaciones</h4>
                  </div>

                  {record.denominations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Moneda</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Denominación</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.denominations.map((item, index) => (
                            <tr key={`${record.id}-${item.currency}-${item.denomination}-${index}`} className="border-t border-border/40">
                              <td className="px-4 py-2 text-foreground">{item.currency}</td>
                              <td className="px-4 py-2 text-right text-foreground">{item.denomination}</td>
                              <td className="px-4 py-2 text-right text-foreground">{item.quantity}</td>
                              <td className="px-4 py-2 text-right text-foreground">{item.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-4 py-6 text-sm text-muted-foreground">No hay denominaciones registradas.</p>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : null}

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

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}