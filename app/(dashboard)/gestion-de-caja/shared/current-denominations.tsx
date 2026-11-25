'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { getCurrentDenominations } from '@/app/services/cash-management';
import { CashCurrentDenominations } from '@/app/type/cash-management';
import { formatCashAmount, formatDenomination, toCashCurrency } from '@/app/domain/cash/currency';
import { ListSkeleton } from '@/components/ui/loading-skeleton';

/**
 * Carga el desglose actual de efectivo de una gestión de caja.
 * `refreshKey`: cámbielo (ej. tras guardar un ingreso/egreso) para recargar.
 */
export function useCurrentDenominations(cashManagementId: number | null, refreshKey: unknown = 0) {
  const [reloadCount, setReloadCount] = useState(0);
  // Resultado de la última respuesta, con la "clave" de la petición que lo produjo.
  const [result, setResult] = useState<{
    key: string | null;
    data: CashCurrentDenominations | null;
    error: string | null;
  }>({ key: null, data: null, error: null });

  const requestKey = cashManagementId ? `${cashManagementId}:${String(refreshKey)}:${reloadCount}` : null;

  useEffect(() => {
    if (!cashManagementId || !requestKey) return;

    let cancelled = false;
    getCurrentDenominations(cashManagementId)
      .then((response) => {
        if (!cancelled) setResult({ key: requestKey, data: response, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            data: null,
            error: err instanceof Error ? err.message : 'No se pudo cargar el desglose actual',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cashManagementId, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  // Cargando mientras la última respuesta no corresponde a la petición actual.
  const loading = requestKey !== null && result.key !== requestKey;
  const isCurrent = requestKey !== null && result.key === requestKey;

  return {
    data: isCurrent ? result.data : null,
    loading,
    error: isCurrent ? result.error : null,
    reload,
  };
}

type CardProps = {
  data: CashCurrentDenominations | null;
  loading: boolean;
  error: string | null;
  /** Solo mostrar esta moneda (ej. la del egreso que se está registrando). */
  currency?: string;
  onReload?: () => void;
  title?: string;
};

/** Tarjeta "Desglose actual": una tabla por moneda, saldo esperado y aviso de monto sin desglose. */
export function CurrentDenominationsCard({
  data,
  loading,
  error,
  currency,
  onReload,
  title = 'Desglose actual',
}: CardProps) {
  const currencies = (data?.currencies ?? []).filter(
    (item) => !currency || toCashCurrency(item.currency) === toCashCurrency(currency),
  );

  return (
    <section className="rounded-2xl border border-border/60 bg-background/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <ListSkeleton count={3} itemClassName="h-6 rounded" />
        ) : error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : currencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin efectivo registrado{currency ? ` en ${currency}` : ''}.</p>
        ) : (
          <div className={`grid gap-4 ${currencies.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {currencies.map((item) => {
              const code = toCashCurrency(item.currency);
              const lines = [...(item.denominations ?? [])].sort((a, b) => b.denomination - a.denomination);
              return (
                <div key={code} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{code}</span>
                    <span className="text-xs text-muted-foreground">
                      Saldo esperado:{' '}
                      <span className="font-mono text-foreground">{formatCashAmount(item.expectedTotal, code)}</span>
                    </span>
                  </div>

                  {lines.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin billetes ni monedas con desglose.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-xs text-muted-foreground">
                          <th className="py-1 text-left font-medium">Denominación</th>
                          <th className="py-1 text-right font-medium">Cantidad</th>
                          <th className="py-1 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) => (
                          <tr key={line.denomination} className="border-b border-border/30">
                            <td className="py-1 font-mono">{formatDenomination(line.denomination)}</td>
                            <td className="py-1 text-right tabular-nums">{line.quantity}</td>
                            <td className="py-1 text-right font-mono">{formatCashAmount(line.total, code)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="text-xs">
                          <td className="pt-1 text-muted-foreground" colSpan={2}>
                            Total con desglose
                          </td>
                          <td className="pt-1 text-right font-mono font-semibold">
                            {formatCashAmount(item.denominatedTotal, code)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                  {Number(item.undenominatedAmount) !== 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      {formatCashAmount(item.undenominatedAmount, code)} sin desglose de billetes
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** Tarjeta autónoma: carga y muestra el desglose actual de una gestión. */
export default function CurrentDenominationsPanel({
  cashManagementId,
  refreshKey,
  currency,
  title,
}: {
  cashManagementId: number;
  refreshKey?: unknown;
  currency?: string;
  title?: string;
}) {
  const { data, loading, error, reload } = useCurrentDenominations(cashManagementId, refreshKey);
  return (
    <CurrentDenominationsCard
      data={data}
      loading={loading}
      error={error}
      currency={currency}
      onReload={reload}
      title={title}
    />
  );
}
