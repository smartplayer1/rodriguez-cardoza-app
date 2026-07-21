"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";

import { getCashManagementClosingSummary } from "@/app/services/cash-management";
import {
  CashManagementClosingSummary,
  CashManagementRecord,
} from "@/app/type/cash-management";
import ClosingSummaryModal from "./closing-summary-modal";
import ReabrirCajaModal from "./reabrir-caja-modal";
import { exportArqueoDeCajaToPdf } from "./arqueo-de-caja-export";
import { useUserStore } from "@/app/store/useUserStore";
import { PERMISSIONS } from "@/app/domain/auth/permissions";

type Props = {
  records: CashManagementRecord[];
};

type MenuAnchor = {
  recordId: number;
  top: number;
  left: number;
};

const ACTION_MENU_WIDTH = 176;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Pendiente";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
};

const formatCurrency = (value: number, currency: "NIO" | "USD") => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const getStatusClasses = (status: string) => {
  return status.toLowerCase() === "abierta"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-200 text-slate-700";
};

export default function GestionesHeaderTable({ records }: Props) {
  const { can } = useUserStore();
  const [selectedRecord, setSelectedRecord] =
    useState<CashManagementRecord | null>(null);
  const [closingSummary, setClosingSummary] =
    useState<CashManagementClosingSummary | null>(null);
  const [loadingSummaryId, setLoadingSummaryId] = useState<number | null>(
    null,
  );
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [recordToReopen, setRecordToReopen] =
    useState<CashManagementRecord | null>(null);
  const [printingArqueoId, setPrintingArqueoId] = useState<number | null>(
    null,
  );

  const menuRecord = menuAnchor
    ? (records.find((record) => record.id === menuAnchor.recordId) ?? null)
    : null;

  const closeMenu = () => setMenuAnchor(null);

  const handleOpenClosingSummary = async (record: CashManagementRecord) => {
    closeMenu();
    setSummaryError(null);
    setLoadingSummaryId(record.id);

    try {
      const summary = await getCashManagementClosingSummary(record.id);
      setClosingSummary(summary);
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "No se pudo obtener el resumen de cierre.",
      );
    } finally {
      setLoadingSummaryId(null);
    }
  };

  const handlePrintArqueo = async (record: CashManagementRecord) => {
    closeMenu();
    setSummaryError(null);
    setPrintingArqueoId(record.id);

    try {
      const summary = await getCashManagementClosingSummary(record.id);
      exportArqueoDeCajaToPdf(summary);
    } catch (error) {
      setSummaryError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el arqueo de caja.",
      );
    } finally {
      setPrintingArqueoId(null);
    }
  };

  const toggleMenu = (
    record: CashManagementRecord,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (menuAnchor?.recordId === record.id) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setMenuAnchor({
      recordId: record.id,
      top: rect.bottom + 8,
      left: Math.max(8, rect.right - ACTION_MENU_WIDTH),
    });
  };

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Caja
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Responsable
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Apertura
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Cierre
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Balance NIO
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Balance USD
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Dif. NIO
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Dif. USD
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="align-top transition-colors hover:bg-muted/15"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {record.cashRegisterName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.cashRegisterCode}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-foreground">
                        {record.responsibleEmployeeName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Apertura por {record.openedByUserName}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(record.openedAt)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(record.closedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-foreground">
                      {formatCurrency(record.balance.nio, "NIO")}
                    </td>
                    <td className="px-4 py-4 text-right text-foreground">
                      {formatCurrency(record.balance.usd, "USD")}
                    </td>
                    <td
                      className={`px-4 py-4 text-right ${record.differenceNioAtClose > 0 ? "text-emerald-600" : record.differenceNioAtClose < 0 ? "text-rose-600" : "text-muted-foreground"}`}
                    >
                      {formatCurrency(record.differenceNioAtClose, "NIO")}
                    </td>
                    <td
                      className={`px-4 py-4 text-right ${record.differenceUsdAtClose > 0 ? "text-emerald-600" : record.differenceUsdAtClose < 0 ? "text-rose-600" : "text-muted-foreground"}`}
                    >
                      {formatCurrency(record.differenceUsdAtClose, "USD")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(event) => toggleMenu(record, event)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                          menuAnchor?.recordId === record.id
                            ? "border-primary bg-accent text-foreground"
                            : "border-border text-foreground hover:bg-accent"
                        }`}
                      >
                        Acciones
                        <ChevronDown
                          className={`size-3.5 transition-transform ${menuAnchor?.recordId === record.id ? "rotate-180" : ""}`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No se encontraron gestiones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {menuAnchor && menuRecord && typeof document !== "undefined"
        ? createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenu} />
              <div
                className="fixed z-50 w-44 overflow-hidden rounded-xl border border-border/60 bg-surface text-left shadow-lg"
                style={{ top: menuAnchor.top, left: menuAnchor.left }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(menuRecord);
                    closeMenu();
                  }}
                  className="block w-full px-4 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                >
                  Ver detalle
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintArqueo(menuRecord)}
                  disabled={printingArqueoId === menuRecord.id}
                  className="block w-full px-4 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {printingArqueoId === menuRecord.id
                    ? "Generando arqueo..."
                    : "Imprimir Arqueo"}
                </button>
                {can(PERMISSIONS.CASH_MANAGEMENT_CLOSE) &&
                  (menuRecord.status.toLowerCase() === "open" ? (
                    <button
                      type="button"
                      onClick={() => handleOpenClosingSummary(menuRecord)}
                      disabled={loadingSummaryId === menuRecord.id}
                      className="block w-full px-4 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingSummaryId === menuRecord.id
                        ? "Cargando resumen..."
                        : "Cerrar gestión"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRecordToReopen(menuRecord);
                        closeMenu();
                      }}
                      className="block w-full px-4 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      Abrir caja
                    </button>
                  ))}
              </div>
            </>,
            document.body,
          )
        : null}

      {selectedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedRecord(null)}
          />

          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl border border-border/60 bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-foreground">
                  {selectedRecord.cashRegisterName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Responsable: {selectedRecord.responsibleEmployeeName} · Tasa{" "}
                  {selectedRecord.exchangeRateNioPerUsd} NIO/USD
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DetailCard
                label="Observación apertura"
                value={selectedRecord.openingObservation || "Sin observación"}
              />
              <DetailCard
                label="Observación cierre"
                value={selectedRecord.closingObservation || "Sin observación"}
              />
              <DetailCard
                label="Esperado al cierre"
                value={`${formatCurrency(selectedRecord.expectedNioAtClose, "NIO")} · ${formatCurrency(selectedRecord.expectedUsdAtClose, "USD")}`}
              />
              <DetailCard
                label="Real al cierre"
                value={`${formatCurrency(selectedRecord.actualNioAtClose, "NIO")} · ${formatCurrency(selectedRecord.actualUsdAtClose, "USD")}`}
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <DenominationTable
                title="Denominaciones apertura"
                items={selectedRecord.openingDenominations}
              />
              <DenominationTable
                title="Denominaciones cierre"
                items={selectedRecord.closingDenominations}
              />
            </div>
          </div>
        </div>
      ) : null}

      {closingSummary ? (
        <ClosingSummaryModal
          summary={closingSummary}
          onClose={() => setClosingSummary(null)}
        />
      ) : null}

      {recordToReopen ? (
        <ReabrirCajaModal
          record={recordToReopen}
          onClose={() => setRecordToReopen(null)}
        />
      ) : null}

      {summaryError && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
              <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
                <span>{summaryError}</span>
                <button
                  type="button"
                  onClick={() => setSummaryError(null)}
                  aria-label="Cerrar aviso"
                  className="text-rose-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
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

function DenominationTable({
  title,
  items,
}: {
  title: string;
  items: Array<{
    currency: string;
    denomination: number;
    quantity: number;
    total: number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/60">
      <div className="border-b border-border/60 px-4 py-3">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      </div>

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Moneda
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Denominación
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
              {items.map((item, index) => (
                <tr
                  key={`${title}-${item.currency}-${item.denomination}-${index}`}
                  className="border-t border-border/40"
                >
                  <td className="px-4 py-2 text-foreground">{item.currency}</td>
                  <td className="px-4 py-2 text-right text-foreground">
                    {item.denomination}
                  </td>
                  <td className="px-4 py-2 text-right text-foreground">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-foreground">
                    {item.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No hay denominaciones registradas.
        </p>
      )}
    </div>
  );
}
