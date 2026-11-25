'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';

import { createCashManagementConversion, getCashManagementRecords } from '@/app/services/cash-management';
import { CashManagementConversionCreatePayload, CashManagementRecord } from '@/app/type/cash-management';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

type Currency = 'NIO' | 'USD';
type Direction = 'NIO_TO_USD' | 'USD_TO_NIO';

type DenominationRow = {
  id: string;
  denomination: string;
  quantity: string;
};

const createDenominationRow = (): DenominationRow => ({
  id: crypto.randomUUID(),
  denomination: '',
  quantity: '',
});

const round2 = (value: number) => Math.round(value * 100) / 100;
const round4 = (value: number) => Math.round(value * 10000) / 10000;
// Margen que acepta el backend entre lo entregado y el teórico (protege de errores de captura).
const MAX_DIFFERENCE_RATIO = 0.05;
const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const formatAmount4 = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);

const toDenominations = (rows: DenominationRow[], currency: Currency) =>
  rows
    .map((row) => ({
      currency,
      denomination: Number.parseFloat(row.denomination),
      quantity: Number.parseInt(row.quantity, 10),
    }))
    .filter(
      (row) => Number.isFinite(row.denomination) && row.denomination > 0 && Number.isFinite(row.quantity) && row.quantity > 0,
    );

const sumRows = (rows: DenominationRow[], currency: Currency) =>
  round2(toDenominations(rows, currency).reduce((sum, row) => sum + row.denomination * row.quantity, 0));

// La conversión usa el tipo de cambio fijo de la gestión de caja. El monto teórico se calcula
// con 4 decimales (origen × tasa, o origen ÷ tasa); se guarda lo realmente entregado y la
// diferencia (entregado − teórico) queda como diferencia cambiaria.
export default function NuevaConversionModal() {
  const router = useRouter();
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [openManagements, setOpenManagements] = useState<CashManagementRecord[]>([]);
  const [loadingManagements, setLoadingManagements] = useState(false);
  const [cashManagementId, setCashManagementId] = useState('');
  const [direction, setDirection] = useState<Direction>('NIO_TO_USD');
  const [observation, setObservation] = useState('');
  const [sourceRows, setSourceRows] = useState<DenominationRow[]>([createDenominationRow()]);
  const [targetRows, setTargetRows] = useState<DenominationRow[]>([createDenominationRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingManagements(true);
    getCashManagementRecords({ status: 'Abierta', page: 1, perPage: 100 })
      .then((response) => {
        if (cancelled) return;
        const records = response.records ?? [];
        setOpenManagements(records);
        if (records.length === 1) setCashManagementId(String(records[0].id));
      })
      .catch(() => {
        if (!cancelled) setOpenManagements([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingManagements(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const management = openManagements.find((record) => String(record.id) === cashManagementId) ?? null;
  const rate = management?.exchangeRateNioPerUsd ?? 0;
  const sourceCurrency: Currency = direction === 'NIO_TO_USD' ? 'NIO' : 'USD';
  const targetCurrency: Currency = direction === 'NIO_TO_USD' ? 'USD' : 'NIO';

  const sourceTotal = useMemo(() => sumRows(sourceRows, sourceCurrency), [sourceRows, sourceCurrency]);
  const targetTotal = useMemo(() => sumRows(targetRows, targetCurrency), [targetRows, targetCurrency]);
  const theoreticalTarget = rate > 0
    ? round4(direction === 'USD_TO_NIO' ? sourceTotal * rate : sourceTotal / rate)
    : 0;
  const difference = round4(targetTotal - theoreticalTarget);
  const differenceTooLarge = theoreticalTarget > 0 && Math.abs(difference) > theoreticalTarget * MAX_DIFFERENCE_RATIO;
  const canSave = sourceTotal > 0 && targetTotal > 0 && !differenceTooLarge;

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<DenominationRow[]>>,
    rowId: string,
    patch: Partial<DenominationRow>,
  ) => setter((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));

  const resetForm = () => {
    setCashManagementId('');
    setDirection('NIO_TO_USD');
    setObservation('');
    setSourceRows([createDenominationRow()]);
    setTargetRows([createDenominationRow()]);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!management) {
      setErrorMessage('Seleccione una gestión de caja abierta.');
      return;
    }
    const sourceDenominations = toDenominations(sourceRows, sourceCurrency);
    const targetDenominations = toDenominations(targetRows, targetCurrency);
    if (sourceDenominations.length === 0) {
      setErrorMessage(`Agregue al menos una denominación en ${sourceCurrency} (lo que entrega el cliente).`);
      return;
    }
    if (targetDenominations.length === 0) {
      setErrorMessage(`Agregue al menos una denominación en ${targetCurrency} (lo que se le entrega).`);
      return;
    }
    if (differenceTooLarge) {
      setErrorMessage(
        `Lo entregado difiere más de ${MAX_DIFFERENCE_RATIO * 100}% del teórico (${formatAmount4(theoreticalTarget)} ${targetCurrency}); revise los montos.`,
      );
      return;
    }

    const payload: CashManagementConversionCreatePayload = {
      cashManagementId: management.id,
      direction,
      observation: observation.trim() ? observation.trim() : null,
      sourceDenominations,
      targetDenominations,
    };

    setIsSubmitting(true);
    try {
      await createCashManagementConversion(payload);
      setSuccessMessage('Conversión creada correctamente.');
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear la conversión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !can(PERMISSIONS.CURRENCY_CONVERSION_CREATE)) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Nueva conversión
        </button>
      </div>

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Nueva conversión</h3>
                <p className="text-sm text-muted-foreground">
                  Registre los billetes que entrega el cliente y los que se le dan, con la tasa fija de la gestión.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-5">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Gestión de caja</span>
                    <select
                      value={cashManagementId}
                      onChange={(event) => setCashManagementId(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="">
                        {loadingManagements
                          ? 'Cargando...'
                          : openManagements.length === 0
                            ? 'No hay gestiones abiertas'
                            : 'Seleccione una gestión'}
                      </option>
                      {openManagements.map((record) => (
                        <option key={record.id} value={record.id}>
                          #{record.id} · {record.cashRegisterCode} - {record.cashRegisterName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Dirección</span>
                    <select
                      value={direction}
                      onChange={(event) => setDirection(event.target.value as Direction)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="NIO_TO_USD">NIO a USD</option>
                      <option value="USD_TO_NIO">USD a NIO</option>
                    </select>
                  </label>

                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Tasa de la gestión</span>
                    <div className="w-full rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                      {management ? `C$ ${rate.toFixed(4)} por USD` : '—'}
                    </div>
                  </div>

                  <label className="space-y-2 md:col-span-2 xl:col-span-1">
                    <span className="text-sm text-muted-foreground">Observación</span>
                    <input
                      type="text"
                      value={observation}
                      onChange={(event) => setObservation(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>

                <DenominationEditor
                  title={`Entrega el cliente (${sourceCurrency})`}
                  total={sourceTotal}
                  currency={sourceCurrency}
                  rows={sourceRows}
                  onAdd={() => setSourceRows((rows) => [...rows, createDenominationRow()])}
                  onRemove={(rowId) => setSourceRows((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.id !== rowId)))}
                  onUpdate={(rowId, patch) => updateRow(setSourceRows, rowId, patch)}
                />

                <DenominationEditor
                  title={`Se entrega al cliente (${targetCurrency})`}
                  total={targetTotal}
                  currency={targetCurrency}
                  rows={targetRows}
                  onAdd={() => setTargetRows((rows) => [...rows, createDenominationRow()])}
                  onRemove={(rowId) => setTargetRows((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.id !== rowId)))}
                  onUpdate={(rowId, patch) => updateRow(setTargetRows, rowId, patch)}
                />

                {management && sourceTotal > 0 ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      differenceTooLarge
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : difference === 0
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    Teórico: <strong>{formatAmount4(theoreticalTarget)} {targetCurrency}</strong> por{' '}
                    {formatAmount(sourceTotal)} {sourceCurrency}
                    {targetTotal > 0 ? (
                      <>
                        {' '}· Se entrega {formatAmount(targetTotal)} {targetCurrency} · Diferencia cambiaria{' '}
                        <strong>{difference > 0 ? '+' : ''}{formatAmount4(difference)} {targetCurrency}</strong>
                        {differenceTooLarge ? ` (supera el ${MAX_DIFFERENCE_RATIO * 100}% permitido)` : ''}
                      </>
                    ) : null}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    disabled={isSubmitting}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !management || !canSave}
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar conversión'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DenominationEditor({
  title,
  total,
  currency,
  rows,
  onAdd,
  onRemove,
  onUpdate,
}: {
  title: string;
  total: number;
  currency: Currency;
  rows: DenominationRow[];
  onAdd: () => void;
  onRemove: (rowId: string) => void;
  onUpdate: (rowId: string, patch: Partial<DenominationRow>) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          {title} · Total {formatAmount(total)} {currency}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
        >
          <Plus className="size-3" />
          Agregar línea
        </button>
      </div>

      <div className="space-y-2 p-3">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-2 rounded-xl border border-border/50 bg-background p-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.denomination}
              onChange={(event) => onUpdate(row.id, { denomination: event.target.value })}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              placeholder={`Denominación (${currency})`}
            />
            <input
              type="number"
              min="0"
              step="1"
              value={row.quantity}
              onChange={(event) => onUpdate(row.id, { quantity: event.target.value })}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              placeholder="Cantidad"
            />
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              aria-label={`Eliminar línea ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
