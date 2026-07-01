"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { createCashManagementOutflow } from "@/app/services/cash-management";
import { CashManagementOutflowCreatePayload } from "@/app/type/cash-management";

type DenominationRow = {
  id: string;
  currency: "NIO" | "USD";
  denomination: string;
  quantity: string;
};

const createDenominationRow = (): DenominationRow => ({
  id: crypto.randomUUID(),
  currency: "NIO",
  denomination: "0",
  quantity: "0",
});

export default function NuevaSalidaModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cashManagementId, setCashManagementId] = useState("");
  const [number, setNumber] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [creditNoteId, setCreditNoteId] = useState("");
  const [rows, setRows] = useState<DenominationRow[]>([
    createDenominationRow(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateRow = (rowId: string, patch: Partial<DenominationRow>) => {
    setRows((previousRows) =>
      previousRows.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    );
  };

  const resetForm = () => {
    setCashManagementId("");
    setNumber("");
    setOccurredAt("");
    setConcept("");
    setDescription("");
    setCreditNoteId("");
    setRows([createDenominationRow()]);
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

    if (
      !Number.isFinite(parsedCashManagementId) ||
      parsedCashManagementId <= 0
    ) {
      setErrorMessage(
        "El campo Gestión ID es obligatorio y debe ser mayor a 0.",
      );
      return;
    }

    if (!number.trim()) {
      setErrorMessage("El número es obligatorio.");
      return;
    }

    if (!occurredAt) {
      setErrorMessage("La fecha y hora de ocurrencia es obligatoria.");
      return;
    }

    if (!concept.trim()) {
      setErrorMessage("El concepto es obligatorio.");
      return;
    }

    const denominations = rows
      .map((row) => ({
        currency: row.currency,
        denomination: Number.parseFloat(row.denomination),
        quantity: Number.parseInt(row.quantity, 10),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.denomination) &&
          row.denomination > 0 &&
          Number.isFinite(row.quantity) &&
          row.quantity > 0,
      );

    if (denominations.length === 0) {
      setErrorMessage("Agrega al menos una denominación válida.");
      return;
    }

    const parsedCreditNoteId = creditNoteId.trim()
      ? Number.parseInt(creditNoteId, 10)
      : null;

    if (
      creditNoteId.trim() &&
      (!Number.isFinite(parsedCreditNoteId) || (parsedCreditNoteId ?? 0) <= 0)
    ) {
      setErrorMessage(
        "El crédito ID debe ser un número válido o quedar vacío.",
      );
      return;
    }

    const payload: CashManagementOutflowCreatePayload = {
      cashManagementId: parsedCashManagementId,
      number: number.trim(),
      occurredAt: new Date(occurredAt).toISOString(),
      concept: concept.trim(),
      description: description.trim() ? description.trim() : null,
      creditNoteId: parsedCreditNoteId,
      denominations,
    };

    setIsSubmitting(true);

    try {
      await createCashManagementOutflow(payload);
      setSuccessMessage("Salida creada correctamente.");
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo crear la salida.",
      );
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
          Nueva salida
        </button>
      </div>

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Nueva salida</h3>
                <p className="text-sm text-muted-foreground">
                  Registra una salida de caja con concepto, fecha y
                  denominaciones.
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
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Gestión ID
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={cashManagementId}
                      onChange={(event) =>
                        setCashManagementId(event.target.value)
                      }
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Número
                    </span>
                    <input
                      type="text"
                      value={number}
                      onChange={(event) => setNumber(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Ocurrió en
                    </span>
                    <input
                      type="datetime-local"
                      value={occurredAt}
                      onChange={(event) => setOccurredAt(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Concepto
                    </span>
                    <input
                      type="text"
                      value={concept}
                      onChange={(event) => setConcept(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2 xl:col-span-4">
                    <span className="text-sm text-muted-foreground">
                      Descripción
                    </span>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>

                <section className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      Denominaciones
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setRows((previousRows) => [
                          ...previousRows,
                          createDenominationRow(),
                        ])
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <Plus className="size-3" />
                      Agregar línea
                    </button>
                  </div>

                  <div className="space-y-2 p-3">
                    {rows.map((row, index) => (
                      <div
                        key={row.id}
                        className="grid gap-2 rounded-xl border border-border/50 bg-background p-3 md:grid-cols-[120px_1fr_1fr_auto]"
                      >
                        <select
                          value={row.currency}
                          onChange={(event) =>
                            updateRow(row.id, {
                              currency: event.target.value as "NIO" | "USD",
                            })
                          }
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
                          onChange={(event) =>
                            updateRow(row.id, {
                              denomination: event.target.value,
                            })
                          }
                          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                          placeholder="Denominación"
                        />

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.quantity}
                          onChange={(event) =>
                            updateRow(row.id, { quantity: event.target.value })
                          }
                          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                          placeholder="Cantidad"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setRows((previousRows) =>
                              previousRows.length === 1
                                ? previousRows
                                : previousRows.filter(
                                    (item) => item.id !== row.id,
                                  ),
                            )
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                          aria-label={`Eliminar línea ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

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
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar salida"}
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
