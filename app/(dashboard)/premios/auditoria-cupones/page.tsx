import { headers } from 'next/headers';
import { AlertTriangle, ShieldAlert, Users } from 'lucide-react';

import { getCouponConsistencyFlags } from '@/app/services/reward/coupon-consistency';
import { CouponConsistencyFlag } from '@/app/type/reward';

type SearchParams = {
  clientCode?: string | string[];
  period?: string | string[];
};

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const toMonthStart = (monthValue: string) => {
  if (!monthValue) return undefined;
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return undefined;
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
};

const formatAmount = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
};

export default async function AuditoriaCuponesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const clientCode = toStringValue(resolvedSearchParams.clientCode);
  const periodInput = toStringValue(resolvedSearchParams.period);
  const period = toMonthStart(periodInput);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  const context = { baseUrl, cookieHeader };

  let flags: CouponConsistencyFlag[] = [];
  let fetchError: string | null = null;

  try {
    flags = await getCouponConsistencyFlags({
      clientCode: clientCode || undefined,
      period,
      ...context,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudo consultar la auditoría de cupones';
  }

  const affectedClientCount = new Set(flags.map((flag) => flag.clientCode)).size;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ShieldAlert size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Auditoría de Cupones Inconsistentes</h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <AlertTriangle className="size-4" />
                  <span>Casos marcados</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">{flags.length}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Users className="size-4" />
                  <span>Clientes afectados</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">{affectedClientCount}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
          <form method="get" className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">Código de cliente</span>
              <input
                type="text"
                name="clientCode"
                defaultValue={clientCode}
                placeholder="Ej: CLI001"
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">Mes</span>
              <input
                type="month"
                name="period"
                defaultValue={periodInput}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              >
                Buscar
              </button>
              <a
                href="/premios/auditoria-cupones"
                className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                Limpiar
              </a>
            </div>
          </form>
        </section>

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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Factura</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Periodo</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cupón aplicado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cupón esperado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Diferencia</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Cupón acumulado del mes
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Neto acumulado del mes
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Detectado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {flags.length > 0 ? (
                  flags.map((flag) => {
                    const difference = flag.indicatedCouponAmount - flag.expectedMonthlyBonusAmount;

                    return (
                      <tr key={flag.id} className="align-top transition-colors hover:bg-muted/15">
                        <td className="px-4 py-4 text-foreground">{flag.clientCode}</td>
                        <td className="px-4 py-4 font-mono text-foreground">{flag.invoiceDocument}</td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">{formatDate(flag.period)}</td>
                        <td className="px-4 py-4 text-right font-mono text-foreground">
                          {formatAmount(flag.indicatedCouponAmount)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-foreground">
                          {formatAmount(flag.expectedMonthlyBonusAmount)}
                        </td>
                        <td
                          className={`px-4 py-4 text-right font-mono ${
                            difference === 0 ? 'text-muted-foreground' : 'text-rose-600 font-semibold'
                          }`}
                        >
                          {difference > 0 ? '+' : ''}
                          {formatAmount(difference)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                          {formatAmount(flag.monthCumulativeCouponAmount)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                          {formatAmount(flag.monthCumulativeNetTotal)}
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(flag.detectedAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No hay casos marcados para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
