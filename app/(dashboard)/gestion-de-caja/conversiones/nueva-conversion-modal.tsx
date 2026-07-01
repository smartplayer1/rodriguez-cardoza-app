'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';

import { createCashManagementConversion } from '@/app/services/cash-management';
import { CashManagementConversionCreatePayload } from '@/app/type/cash-management';

type DenominationRow = {
  id: string;
  currency: 'NIO' | 'USD';
  denomination: string;
  quantity: string;
};

type AllocationRow = {
  id: string;
  collectionId: string;
  usdAmount: string;
  appliedAmountNio: string;
};

const createDenominationRow = (): DenominationRow => ({
  id: crypto.randomUUID(),
  currency: 'NIO',
  denomination: '0',
  quantity: '0',
});



export default function NuevaConversionModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cashManagementId, setCashManagementId] = useState('');
  const [direction, setDirection] = useState('NIO_TO_USD');
  const [exchangeRate, setExchangeRate] = useState('36.5');
  const [observation, setObservation] = useState('');
  const [sourceRows, setSourceRows] = useState<DenominationRow[]>([createDenominationRow()]);
  const [targetRows, setTargetRows] = useState<DenominationRow[]>([createDenominationRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateDenominationRow = (
    rows: DenominationRow[],
    setter: React.Dispatch<React.SetStateAction<DenominationRow[]>>,
    rowId: string,
    patch: Partial<DenominationRow>,
  ) => {
    setter(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };


  const resetForm = () => {
    setCashManagementId('');
    setDirection('NIO_TO_USD');
    setExchangeRate('36.5');
    setObservation('');
    setSourceRows([createDenominationRow()]);
    setTargetRows([createDenominationRow()]);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedCashManagementId = Number.parseInt(cashManagementId, 10);

    if (!Number.isFinite(parsedCashManagementId) || parsedCashManagementId <= 0) {
      setErrorMessage('El campo Gestión ID es obligatorio y debe ser mayor a 0.');
      return;
    }

    const sourceDenominations = sourceRows
      .map((row) => ({
        currency: row.currency,
        denomination: Number.parseFloat(row.denomination),
        quantity: Number.parseInt(row.quantity, 10),
      }))
      .filter(
        (row) => Number.isFinite(row.denomination) && row.denomination > 0 && Number.isFinite(row.quantity) && row.quantity > 0,
      );

    if (sourceDenominations.length === 0) {
      setErrorMessage('Agrega al menos una denominación válida en origen.');
      return;
    }

    const targetDenominations = targetRows
      .map((row) => ({
        currency: row.currency,
        denomination: Number.parseFloat(row.denomination),
        quantity: Number.parseInt(row.quantity, 10),
      }))
      .filter(
        (row) => Number.isFinite(row.denomination) && row.denomination > 0 && Number.isFinite(row.quantity) && row.quantity > 0,
      );

    if (targetDenominations.length === 0) {
      setErrorMessage('Agrega al menos una denominación válida en destino.');
      return;
    }


    const payload: CashManagementConversionCreatePayload = {
      cashManagementId: parsedCashManagementId,
      direction: direction as CashManagementConversionCreatePayload['direction'],
      observation: observation.trim() ? observation.trim() : null,
      sourceDenominations,
      targetDenominations
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
                  Captura los datos de conversión. El guardado quedará conectado cuando se defina el endpoint POST y su payload final.
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
                    <span className="text-sm text-muted-foreground">Gestión ID</span>
                    <input
                      type="number"
                      min="1"
                      value={cashManagementId}
                      onChange={(event) => setCashManagementId(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Dirección</span>
                    <select
                      value={direction}
                      onChange={(event) => setDirection(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="NIO_TO_USD">NIO a USD</option>
                      <option value="USD_TO_NIO">USD a NIO</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Tasa NIO/USD</span>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={exchangeRate}
                      onChange={(event) => setExchangeRate(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      disabled
                    />
                  </label>

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
                  title="Denominaciones origen"
                  rows={sourceRows}
                  onAdd={() => setSourceRows((previousRows) => [...previousRows, createDenominationRow()])}
                  onRemove={(rowId) =>
                    setSourceRows((previousRows) =>
                      previousRows.length === 1 ? previousRows : previousRows.filter((row) => row.id !== rowId),
                    )
                  }
                  onUpdate={(rowId, patch) => updateDenominationRow(sourceRows, setSourceRows, rowId, patch)}
                />

                <DenominationEditor
                  title="Denominaciones destino"
                  rows={targetRows}
                  onAdd={() => setTargetRows((previousRows) => [...previousRows, createDenominationRow()])}
                  onRemove={(rowId) =>
                    setTargetRows((previousRows) =>
                      previousRows.length === 1 ? previousRows : previousRows.filter((row) => row.id !== rowId),
                    )
                  }
                  onUpdate={(rowId, patch) => updateDenominationRow(targetRows, setTargetRows, rowId, patch)}
                />

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
                    disabled={isSubmitting}
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
  rows,
  onAdd,
  onRemove,
  onUpdate,
}: {
  title: string;
  rows: DenominationRow[];
  onAdd: () => void;
  onRemove: (rowId: string) => void;
  onUpdate: (rowId: string, patch: Partial<DenominationRow>) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
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
          <div key={row.id} className="grid gap-2 rounded-xl border border-border/50 bg-background p-3 md:grid-cols-[120px_1fr_1fr_auto]">
            <select
              value={row.currency}
              onChange={(event) => onUpdate(row.id, { currency: event.target.value as 'NIO' | 'USD' })}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              <option value="NIO">NIO</option>
              <option value="USD">USD</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.denomination}
              onChange={(event) => onUpdate(row.id, { denomination: event.target.value })}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              placeholder="Denominación"
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