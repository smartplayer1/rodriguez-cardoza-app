"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";

import { createCashManagement } from "@/app/services/cash-management";
import { CashManagementCreatePayload } from "@/app/type/cash-management";

type DenominationRow = {
  id: string;
  currency: "NIO" | "USD";
  denomination: string;
  quantity: string;
};

type SelectOption = {
  id: string;
  label: string;
};

const createDefaultRow = (): DenominationRow => ({
  id: crypto.randomUUID(),
  currency: "NIO",
  denomination: "0",
  quantity: "0",
});

export default function AperturaCajaForm({
  cashRegisterOptions,
  employeeOptions,
}: {
  cashRegisterOptions: SelectOption[];
  employeeOptions: SelectOption[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");
  const [exchangeRateNioPerUsd, setExchangeRateNioPerUsd] = useState("36.5");
  const [observation, setObservation] = useState("");
  const [rows, setRows] = useState<DenominationRow[]>([createDefaultRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const estimatedTotalNio = useMemo(() => {
    return rows.reduce((sum, row) => {
      const denomination = Number.parseFloat(row.denomination) || 0;
      const quantity = Number.parseInt(row.quantity, 10) || 0;
      const lineTotal = denomination * quantity;

      if (row.currency === "USD") {
        const rate = Number.parseFloat(exchangeRateNioPerUsd) || 0;
        return sum + lineTotal * rate;
      }

      return sum + lineTotal;
    }, 0);
  }, [rows, exchangeRateNioPerUsd]);

  const updateRow = (rowId: string, patch: Partial<DenominationRow>) => {
    setRows((previousRows) =>
      previousRows.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    );
  };

  const addRow = () => {
    setRows((previousRows) => [...previousRows, createDefaultRow()]);
  };

  const removeRow = (rowId: string) => {
    setRows((previousRows) => {
      if (previousRows.length === 1) {
        return previousRows;
      }

      return previousRows.filter((row) => row.id !== rowId);
    });
  };

  const resetForm = () => {
    setCashRegisterId("");
    setResponsibleEmployeeId("");
    setExchangeRateNioPerUsd("36.5");
    setObservation("");
    setRows([createDefaultRow()]);
  };

  const openModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedCashRegisterId = Number.parseInt(cashRegisterId, 10);
    const parsedResponsibleEmployeeId = Number.parseInt(
      responsibleEmployeeId,
      10,
    );
    const parsedExchangeRate = Number.parseFloat(exchangeRateNioPerUsd);

    if (!Number.isFinite(parsedCashRegisterId) || parsedCashRegisterId <= 0) {
      setErrorMessage("Debes seleccionar una caja.");
      return;
    }

    if (
      !Number.isFinite(parsedResponsibleEmployeeId) ||
      parsedResponsibleEmployeeId <= 0
    ) {
      setErrorMessage("Debes seleccionar un responsable.");
      return;
    }

    if (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0) {
      setErrorMessage("La tasa NIO/USD debe ser mayor a 0.");
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
      setErrorMessage(
        "Agrega al menos una denominacion valida (denominacion y cantidad mayor a 0).",
      );
      return;
    }

    const payload: CashManagementCreatePayload = {
      cashRegisterId: parsedCashRegisterId,
      responsibleEmployeeId: parsedResponsibleEmployeeId,
      exchangeRateNioPerUsd: parsedExchangeRate,
      observation: observation.trim() ? observation.trim() : null,
      denominations,
    };

    setIsSubmitting(true);

    try {
      await createCashManagement(payload);
      setSuccessMessage("Gestion de caja creada correctamente.");
      resetForm();
      closeModal();
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo crear la gestion de caja.",
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
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Nueva apertura de caja
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
                <h3 className="text-foreground">Apertura de caja</h3>
                <p className="text-sm text-muted-foreground">
                  Registra una gestion de caja con tipo de cambio y
                  denominaciones iniciales.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Caja</span>
                    <select
                      value={cashRegisterId}
                      onChange={(event) =>
                        setCashRegisterId(event.target.value)
                      }
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Selecciona una caja</option>
                      {cashRegisterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Responsable
                    </span>
                    <select
                      value={responsibleEmployeeId}
                      onChange={(event) =>
                        setResponsibleEmployeeId(event.target.value)
                      }
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Selecciona un empleado</option>
                      {employeeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Tasa NIO/USD
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={exchangeRateNioPerUsd}
                      onChange={(event) =>
                        setExchangeRateNioPerUsd(event.target.value)
                      }
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2 xl:col-span-1">
                    <span className="text-sm text-muted-foreground">
                      Observacion
                    </span>
                    <input
                      type="text"
                      value={observation}
                      onChange={(event) => setObservation(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      Denominaciones
                    </p>
                    <button
                      type="button"
                      onClick={addRow}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <Plus className="size-3" />
                      Agregar linea
                    </button>
                  </div>

                  <div className="space-y-2 p-3">
                    {rows.map((row, index) => (
                      <div
                        key={row.id}
                        className="grid gap-2 rounded-xl border border-border/50 bg-background p-3 md:grid-cols-[120px_1fr_1fr_auto]"
                      >
                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">
                            Moneda
                          </span>
                          <select
                            value={row.currency}
                            onChange={(event) =>
                              updateRow(row.id, {
                                currency: event.target.value as "NIO" | "USD",
                              })
                            }
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                          >
                            <option value="NIO">NIO</option>
                            <option value="USD">USD</option>
                          </select>
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">
                            Denominación
                          </span>
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
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                            placeholder="Denominacion"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">
                            Cantidad
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.quantity}
                            onChange={(event) =>
                              updateRow(row.id, {
                                quantity: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                            placeholder="Cantidad"
                          />
                        </label>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                            disabled={rows.length === 1}
                            aria-label={`Eliminar linea ${index + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Total estimado en NIO:{" "}
                    <span className="font-semibold text-foreground">
                      {estimatedTotalNio.toFixed(2)}
                    </span>
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                      disabled={isSubmitting}
                    >
                      Limpiar
                    </button>
                    <button
                      type="submit"
                      className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Guardando..." : "Guardar apertura"}
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
