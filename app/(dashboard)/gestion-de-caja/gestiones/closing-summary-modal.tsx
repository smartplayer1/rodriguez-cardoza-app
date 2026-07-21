"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, Trash2, X } from "lucide-react";

import { closeCashManagement } from "@/app/services/cash-management";
import type {
  CashManagementClosePayload,
  CashManagementClosingSummary,
} from "@/app/type/cash-management";
import { exportArqueoDeCajaToPdf } from "./arqueo-de-caja-export";

type DenominationRow = {
  id: string;
  currency: "NIO" | "USD";
  denomination: string;
  quantity: string;
};

const createDefaultRow = (): DenominationRow => ({
  id: crypto.randomUUID(),
  currency: "NIO",
  denomination: "0",
  quantity: "0",
});

const tipoMovimientoMap: Record<string, string> = {
  CASH_OUTFLOW: "Salida de efectivo",
  CASH_INFLOW: "Entrada de efectivo",
  COLLECTION: "Conversión de efectivo",
  OPENING: "Apertura de caja",
  INVOICE_CASH: "Factura contado",
};



const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Pendiente";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-NI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatAmount = (value: number | null) => {
  if (value === null) {
    return "N/D";
  }

  return new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function ClosingSummaryModal({
  summary,
  onClose,
}: {
  summary: CashManagementClosingSummary;
  onClose: () => void;
}) {

  const router = useRouter();
  const { cashManagement, balances, movementTotals, closingPreview, invoices } = summary;

  const { closingDenominations } = cashManagement;

  const [showDetail, setShowDetail] = useState(false);
  const [observation, setObservation] = useState("");
  const [rows, setRows] = useState<DenominationRow[]>(() =>
    closingDenominations.length > 0
      ? closingDenominations.map((denomination) => ({
          id: crypto.randomUUID(),
          currency: denomination.currency as "NIO" | "USD",
          denomination: String(denomination.denomination),
          quantity: String(denomination.quantity),
        }))
      : [createDefaultRow()],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const estimatedTotalNio = useMemo(() => {
    return rows.reduce((sum, row) => {
      const denomination = Number.parseFloat(row.denomination) || 0;
      const quantity = Number.parseInt(row.quantity, 10) || 0;
      const lineTotal = denomination * quantity;

      if (row.currency === "USD") {
        return sum + lineTotal * cashManagement.exchangeRateNioPerUsd;
      }

      return sum + lineTotal;
    }, 0);
  }, [rows, cashManagement.exchangeRateNioPerUsd]);

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

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);

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

    const payload: CashManagementClosePayload = {
      observation: observation.trim() ? observation.trim() : null,
      denominations,
    };

    setIsSubmitting(true);

    try {
      await closeCashManagement(cashManagement.id, payload);
      router.refresh();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la gestion de caja.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
        <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <h3 className="text-foreground">Resumen y cierre de caja</h3>
              <p className="text-sm text-muted-foreground">
                {cashManagement.cashRegisterCode} -{" "}
                {cashManagement.cashRegisterName} · Responsable:{" "}
                {cashManagement.responsibleEmployeeName}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
              aria-label="Cerrar modal"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {closingPreview.requiresObservationIfClosingNow ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Esta gestión requiere una observación al momento de
                  cerrarse.
                </p>
              ) : null}

              <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3">
                  <span>Abierta desde</span>
                  <span className="text-foreground">
                    {formatDateTime(cashManagement.openedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Abierta por</span>
                  <span className="text-foreground">
                    {cashManagement.openedByUserName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Tipo de cambio (NIO/USD)</span>
                  <span className="text-foreground">
                    {formatAmount(cashManagement.exchangeRateNioPerUsd)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Estado</span>
                  <span className="text-foreground">
                    {cashManagement.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailCard
                  label="Saldo actual NIO"
                  value={formatAmount(balances.nio)}
                />
                <DetailCard
                  label="Saldo actual USD"
                  value={formatAmount(balances.usd)}
                />
                <DetailCard
                  label="Esperado NIO"
                  value={formatAmount(closingPreview.expectedNio)}
                />
                <DetailCard
                  label="Esperado USD"
                  value={formatAmount(closingPreview.expectedUsd)}
                />
                {closingPreview.isClosed ? (
                  <>
                    <DetailCard
                      label="Real NIO"
                      value={formatAmount(closingPreview.actualNioAtClose)}
                    />
                    <DetailCard
                      label="Real USD"
                      value={formatAmount(closingPreview.actualUsdAtClose)}
                    />
                    <DetailCard
                      label="Diferencia NIO"
                      value={formatAmount(
                        closingPreview.differenceNioAtClose,
                      )}
                    />
                    <DetailCard
                      label="Diferencia USD"
                      value={formatAmount(
                        closingPreview.differenceUsdAtClose,
                      )}
                    />
                  </>
                ) : null}
              </div>

              <DetailSection title="Totales de movimientos">
                {movementTotals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Moneda
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Tipo de movimiento
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Cantidad
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {movementTotals.map((item, index) => (
                          <tr
                            key={`${item.currency}-${item.movementType}-${index}`}
                            className="border-t border-border/40"
                          >
                            <td className="px-4 py-2 text-foreground">
                              {item.currency}
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              {tipoMovimientoMap[item.movementType] ?? item.movementType}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {item.count}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(item.total)}
                            </td>
                          </tr>
                        ))}
                         <tr
                            className="border-t border-border/40"
                          >
                            <td className="px-4 py-2 text-foreground">
                              NIO
                            </td>
                            <td className="px-4 py-2 text-foreground">
                              Factura contado
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {invoices.filter((invoice) => invoice.chargeStatus.toUpperCase() === "CONTADO").length}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(invoices.filter((invoice) => invoice.chargeStatus.toUpperCase() === "CONTADO").reduce((sum, invoice) => sum + invoice.invoiceAmountNio, 0))}
                            </td>
                          </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyDetail text="No hay movimientos registrados." />
                )}
              </DetailSection>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <CountCard label="Cobros" value={summary.collections.length} />
                <CountCard label="Facturas" value={summary.invoices.length} />
                <CountCard
                  label="Fact. pagadas"
                  value={summary.paidInvoices.length}
                />
                <CountCard
                  label="Notas crédito"
                  value={summary.creditNotes.length}
                />
                <CountCard label="Salidas" value={summary.outflows.length} />
                <CountCard
                  label="Conversiones"
                  value={summary.conversions.length}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Eye className="size-4" />
                Ver detalle completo
              </button>

              <label className="block space-y-2">
                <span className="text-sm text-muted-foreground">
                  Observación
                </span>
                <input
                  type="text"
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  placeholder="Opcional"
                />
              </label>

              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    Denominaciones de cierre
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
                            updateRow(row.id, { quantity: event.target.value })
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
                  Total real en NIO:{" "}
                  <span className="font-semibold text-foreground">
                    {estimatedTotalNio.toFixed(2)}
                  </span>
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => exportArqueoDeCajaToPdf(summary)}
                    className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Imprimir Arqueo
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Cerrando..." : "Cerrar caja"}
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

      {showDetail ? (
        <ClosingSummaryDetailModal
          summary={summary}
          onClose={() => setShowDetail(false)}
        />
      ) : null}
    </>
  );
}

function ClosingSummaryDetailModal({
  summary,
  onClose,
}: {
  summary: CashManagementClosingSummary;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="text-foreground">Detalle del cierre</h3>
            <p className="text-sm text-muted-foreground">
              {summary.cashManagement.cashRegisterCode} -{" "}
              {summary.cashManagement.cashRegisterName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-80px)] space-y-5 overflow-y-auto p-5">
          <DetailSection title="Movimientos">
            {summary.movements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Origen
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Descripción
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.movements.map((movement) => (
                      <tr key={movement.id} className="border-t border-border/40">
                        <td className="px-4 py-2 text-muted-foreground">
                          {formatDateTime(movement.occurredAt)}
                        </td>
                        <td className="px-4 py-2 text-foreground">
                          {movement.movementType}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {movement.sourceType}
                          {movement.sourceNumber
                            ? ` · ${movement.sourceNumber}`
                            : ""}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {movement.description || "Sin descripción"}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(movement.amount)} {movement.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay movimientos registrados." />
            )}
          </DetailSection>

          <DetailSection title="Cobros">
            {summary.collections.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Número
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Factura
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.collections.map((collection) => (
                      <tr
                        key={collection.header.id}
                        className="border-t border-border/40"
                      >
                        <td className="px-4 py-2 text-foreground">
                          {collection.header.number}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {collection.header.invoiceDocument}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {collection.header.status}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(collection.summary.total)}{" "}
                          {collection.header.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay cobros registrados." />
            )}
          </DetailSection>

          <DetailSection title="Facturas">
            {summary.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Documento
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Monto NIO
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-border/40">
                        <td className="px-4 py-2 text-foreground">
                          {invoice.document}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {invoice.clientName}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {invoice.chargeStatus}
                          {invoice.isVoided ? " · Anulada" : ""}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(invoice.invoiceAmountNio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay facturas registradas." />
            )}
          </DetailSection>

          <DetailSection title="Facturas pagadas">
            {summary.paidInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Documento
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Pagado en gestión
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Pagado total
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Saldo restante
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.paidInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-border/40">
                        <td className="px-4 py-2 text-foreground">
                          {invoice.document}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {invoice.clientName}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(invoice.paidInManagementNio)}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(invoice.paidAmountNio)}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(invoice.remainingBalanceNio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay facturas pagadas en esta gestión." />
            )}
          </DetailSection>

          <DetailSection title="Notas de crédito">
            {summary.creditNotes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Número
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Factura
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.creditNotes.map((creditNote) => (
                      <tr
                        key={creditNote.header.id}
                        className="border-t border-border/40"
                      >
                        <td className="px-4 py-2 text-foreground">
                          {creditNote.header.number}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {creditNote.header.invoiceDocument}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {creditNote.header.status}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(creditNote.header.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay notas de crédito registradas." />
            )}
          </DetailSection>

          <DetailSection title="Salidas">
            {summary.outflows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Número
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Concepto
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.outflows.map((outflow) => (
                      <tr key={outflow.id} className="border-t border-border/40">
                        <td className="px-4 py-2 text-foreground">
                          {outflow.number}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {outflow.concept}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {outflow.status}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(outflow.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay salidas registradas." />
            )}
          </DetailSection>

          <DetailSection title="Conversiones">
            {summary.conversions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Dirección
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Origen
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Destino
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                        Diferencia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.conversions.map((conversion) => (
                      <tr
                        key={conversion.id}
                        className="border-t border-border/40"
                      >
                        <td className="px-4 py-2 text-foreground">
                          {conversion.direction}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {conversion.status}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(conversion.sourceTotal)}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(conversion.targetTotal)}
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">
                          {formatAmount(conversion.exchangeDifference)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail text="No hay conversiones registradas." />
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/60">
      <div className="border-b border-border/60 px-4 py-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function EmptyDetail({ text }: { text: string }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground">{text}</p>;
}
