'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, DollarSign, Pencil, RefreshCw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import {
  createExchangeRate,
  deleteExchangeRate,
  getExchangeRates,
  getLatestExchangeRate,
  updateExchangeRate,
} from '@/app/services/billing/exchange-rate';
import type { ExchangeRate, ExchangeRatePaging } from '@/app/type/exchange-rate';

const PER_PAGE = 10;

// Fecha local de hoy en formato YYYY-MM-DD (para el input date y para comparar).
const todayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

// effectiveDate llega como medianoche UTC: se toma la parte de fecha tal cual para no correrla
// un día por la zona horaria del navegador.
const dateKey = (iso: string) => (iso || '').slice(0, 10);
const formatDate = (iso: string) => {
  const [year, month, day] = dateKey(iso).split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
};
const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const formatRate = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);

export default function CurrencySettings() {
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // can() depende del store hidratado desde localStorage, que difiere entre SSR y el
    // primer render del cliente; sin este flag se produce un hydration mismatch.
    setMounted(true);
  }, []);
  const canCreate = mounted && can(PERMISSIONS.EXCHANGE_RATE_CREATE);
  const canEdit = mounted && can(PERMISSIONS.EXCHANGE_RATE_EDIT);
  const canDelete = mounted && can(PERMISSIONS.EXCHANGE_RATE_DELETE);

  // Corrección en línea de una fila del historial (solo tasa y observación).
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState('');
  const [editObservation, setEditObservation] = useState('');
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);

  const [latest, setLatest] = useState<ExchangeRate | null>(null);
  const [latestLoaded, setLatestLoaded] = useState(false);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [paging, setPaging] = useState<ExchangeRatePaging>({ perPage: PER_PAGE, currentPage: 1, totalRecords: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [effectiveDate, setEffectiveDate] = useState(todayLocal);
  const [rateValue, setRateValue] = useState('');
  const [observation, setObservation] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    try {
      setLatest(await getLatestExchangeRate());
    } catch {
      setLatest(null);
    } finally {
      setLatestLoaded(true);
    }
  }, []);

  const loadRates = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await getExchangeRates({
        effectiveDateFrom: dateFrom || undefined,
        effectiveDateTo: dateTo || undefined,
        page,
        perPage: PER_PAGE,
      });
      setRates(response.records ?? []);
      setPaging(response.paging ?? { perPage: PER_PAGE, currentPage: page, totalRecords: 0, totalPages: 1 });
    } catch (error) {
      setRates([]);
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los tipos de cambio');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, page]);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  const today = todayLocal();
  const hasTodayRate = latest ? dateKey(latest.effectiveDate) === today : false;
  const parsedRate = Number(rateValue);
  const rateIsValid = rateValue.trim() !== '' && Number.isFinite(parsedRate) && parsedRate > 0;

  const handleSave = async () => {
    setFormError(null);
    if (!effectiveDate) {
      setFormError('Seleccione la fecha.');
      return;
    }
    if (!rateIsValid) {
      setFormError('La tasa debe ser un número mayor que cero.');
      return;
    }

    try {
      setSaving(true);
      const created = await createExchangeRate({
        effectiveDate,
        nioPerUsd: Math.round(parsedRate * 10000) / 10000,
        observation: observation.trim() || null,
      });
      toast.success(`Tipo de cambio del ${formatDate(created.effectiveDate)} registrado: C$ ${formatRate(created.nioPerUsd)}`);
      setRateValue('');
      setObservation('');
      setEffectiveDate(todayLocal());
      await loadLatest();
      // En la página 1 se recarga directo; en otra, volver a la 1 dispara la recarga.
      if (page === 1) await loadRates();
      else setPage(1);
    } catch (error) {
      // 409: ya existe uno para esa fecha (el backend no permite editarlo).
      setFormError(error instanceof Error ? error.message : 'No se pudo registrar el tipo de cambio');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (rate: ExchangeRate) => {
    setEditingId(rate.id);
    setEditRate(String(rate.nioPerUsd));
    setEditObservation(rate.observation ?? '');
  };

  // El backend solo deja corregir o eliminar un tipo de cambio que ninguna gestión, ingreso o
  // egreso haya usado; si ya se usó responde 400 con el detalle y se muestra tal cual.
  const handleSaveEdit = async (rate: ExchangeRate) => {
    const value = Number(editRate);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('La tasa debe ser un número mayor que cero.');
      return;
    }
    try {
      setRowBusyId(rate.id);
      await updateExchangeRate(rate.id, {
        nioPerUsd: Math.round(value * 10000) / 10000,
        observation: editObservation.trim() || null,
      });
      toast.success(`Tipo de cambio del ${formatDate(rate.effectiveDate)} corregido`);
      setEditingId(null);
      await Promise.all([loadLatest(), loadRates()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo corregir el tipo de cambio');
    } finally {
      setRowBusyId(null);
    }
  };

  const handleDelete = async (rate: ExchangeRate) => {
    if (
      !window.confirm(
        `¿Eliminar el tipo de cambio del ${formatDate(rate.effectiveDate)} (C$ ${formatRate(rate.nioPerUsd)})? ` +
          'Desde esa fecha regirá el tipo de cambio anterior.',
      )
    )
      return;
    try {
      setRowBusyId(rate.id);
      await deleteExchangeRate(rate.id);
      toast.success(`Tipo de cambio del ${formatDate(rate.effectiveDate)} eliminado`);
      await Promise.all([loadLatest(), loadRates()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el tipo de cambio');
    } finally {
      setRowBusyId(null);
    }
  };

  const totalPages = Math.max(1, paging.totalPages || 1);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Configuración de Moneda</h2>
        <p className="text-muted-foreground">
          Tipo de cambio diario del dólar (USD) a córdobas (NIO). Se usa para abrir caja, cobros,
          conversiones e ingresos y egresos en dólares.
        </p>
      </div>

      {latestLoaded && !hasTodayRate && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            {latest ? (
              <>
                No hay tipo de cambio registrado para hoy. Las operaciones de hoy usarán el del{' '}
                <strong>{formatDate(latest.effectiveDate)}</strong> (C$ {formatRate(latest.nioPerUsd)}).
              </>
            ) : (
              <>
                No hay ningún tipo de cambio registrado. <strong>No se puede abrir caja</strong> hasta
                registrar uno.
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-surface rounded elevation-2 p-6">
            <p className="text-sm text-muted-foreground">Tipo de cambio vigente</p>
            {latest ? (
              <>
                <p className="mt-1 text-3xl text-foreground">C$ {formatRate(latest.nioPerUsd)}</p>
                <p className="text-sm text-muted-foreground">
                  por 1 USD · desde el {formatDate(latest.effectiveDate)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  1 NIO = {formatRate(1 / latest.nioPerUsd)} USD
                </p>
              </>
            ) : (
              <p className="mt-1 text-foreground">{latestLoaded ? 'Sin registrar' : 'Cargando...'}</p>
            )}
          </div>

          {canCreate && (
            <div className="bg-surface rounded elevation-2 p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign size={24} className="text-primary" />
                <h3 className="text-foreground">Registrar tipo de cambio</h3>
              </div>

              <div className="flex flex-col gap-4">
                <MaterialInput
                  label="Fecha de vigencia"
                  type="date"
                  fullWidth
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
                <MaterialInput
                  label="Córdobas por 1 dólar"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="36.6243"
                  fullWidth
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  helperText={rateIsValid ? `1 USD = C$ ${formatRate(parsedRate)} · 1 NIO = ${formatRate(1 / parsedRate)} USD` : undefined}
                />
                <MaterialInput
                  label="Observación (opcional)"
                  fullWidth
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />

                <p className="text-xs text-muted-foreground">
                  Solo se registra un tipo de cambio por fecha. Se puede corregir o eliminar
                  mientras ninguna gestión, ingreso o egreso lo haya usado.
                </p>

                {formError && <p className="text-sm text-rose-600">{formError}</p>}

                <MaterialButton
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<Save size={18} />}
                  onClick={() => void handleSave()}
                  disabled={saving || !rateIsValid || !effectiveDate}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </MaterialButton>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <h3 className="text-foreground">Historial</h3>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm text-muted-foreground">
                  Desde
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 block rounded border border-border bg-input-background px-3 py-2 text-foreground"
                  />
                </label>
                <label className="text-sm text-muted-foreground">
                  Hasta
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 block rounded border border-border bg-input-background px-3 py-2 text-foreground"
                  />
                </label>
                <MaterialButton
                  variant="text"
                  color="primary"
                  startIcon={<RefreshCw size={18} />}
                  onClick={() => {
                    void loadLatest();
                    void loadRates();
                  }}
                >
                  Actualizar
                </MaterialButton>
              </div>
            </div>

            {loadError ? (
              <p className="py-8 text-center text-sm text-rose-600">{loadError}</p>
            ) : loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>
            ) : rates.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {dateFrom || dateTo ? 'No hay tipos de cambio en ese rango.' : 'No hay tipos de cambio registrados.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Fecha</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">C$ por USD</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Observación</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Registrado por</th>
                      {(canEdit || canDelete) && (
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rates.map((rate) => {
                      const isEditing = editingId === rate.id;
                      const busy = rowBusyId === rate.id;
                      return (
                        <tr key={rate.id}>
                          <td className="px-4 py-2 text-foreground">
                            {formatDate(rate.effectiveDate)}
                            {latest?.id === rate.id && (
                              <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                                Vigente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-foreground">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={editRate}
                                onChange={(e) => setEditRate(e.target.value)}
                                className="w-28 rounded border border-border bg-input-background px-2 py-1 text-right"
                              />
                            ) : (
                              formatRate(rate.nioPerUsd)
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {isEditing ? (
                              <input
                                value={editObservation}
                                onChange={(e) => setEditObservation(e.target.value)}
                                className="w-full rounded border border-border bg-input-background px-2 py-1"
                              />
                            ) : (
                              rate.observation || '—'
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {rate.createdBy} · {formatDateTime(rate.createdAt)}
                          </td>
                          {(canEdit || canDelete) && (
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {isEditing ? (
                                <span className="inline-flex gap-2">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleSaveEdit(rate)}
                                    className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
                                  >
                                    {busy ? 'Guardando...' : 'Guardar'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setEditingId(null)}
                                    className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                                  >
                                    Cancelar
                                  </button>
                                </span>
                              ) : (
                                <span className="inline-flex gap-1">
                                  {canEdit && (
                                    <button
                                      type="button"
                                      title="Corregir"
                                      aria-label="Corregir"
                                      disabled={busy}
                                      onClick={() => startEdit(rate)}
                                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      title="Eliminar"
                                      aria-label="Eliminar"
                                      disabled={busy}
                                      onClick={() => void handleDelete(rate)}
                                      className="rounded p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loadError && totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Página {page} de {totalPages} · {paging.totalRecords} registros
                </span>
                <div className="flex gap-2">
                  <MaterialButton variant="outlined" color="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Anterior
                  </MaterialButton>
                  <MaterialButton variant="outlined" color="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Siguiente
                  </MaterialButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
