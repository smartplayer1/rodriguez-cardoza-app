"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { CashManagementOutflowRecord } from "@/app/type/cash-management";

type Props = {
  records: CashManagementOutflowRecord[];
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

const formatAmount = (value: number) => {
  return new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusClasses = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("anulada") || normalizedStatus.includes("void")) {
    return "bg-rose-100 text-rose-700";
  }

  if (normalizedStatus.includes("activa") || normalizedStatus.includes("completed") || normalizedStatus.includes("aplicada")) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-200 text-slate-700";
};

export default function SalidasTableModal({ records }: Props) {
  const [selectedRecord, setSelectedRecord] =
    useState<CashManagementOutflowRecord | null>(null);

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Numero</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gestion</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Concepto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nota credito</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {records.length > 0 ? (
                records.map((record) => (
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
                    <td className="px-4 py-4 text-muted-foreground">{record.creditNoteId ? `#${record.creditNoteId}` : "Sin vinculo"}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent"
                      >
                        <Eye className="size-4" />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No hay salidas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Detalle de salida #{selectedRecord.number}</h3>
                <p className="text-sm text-muted-foreground">
                  Gestion #{selectedRecord.cashManagementId} · {selectedRecord.concept}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-80px)] space-y-5 overflow-y-auto p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailCard label="Fecha" value={formatDateTime(selectedRecord.occurredAt)} />
                <DetailCard label="Estado" value={selectedRecord.status} />
                <DetailCard label="Descripcion" value={selectedRecord.description || "Sin descripcion"} />
                <DetailCard label="Nota credito" value={selectedRecord.creditNoteId ? `#${selectedRecord.creditNoteId}` : "Sin vinculo"} />
                <DetailCard
                  label="Anulada"
                  value={selectedRecord.voidedAt ? `${formatDateTime(selectedRecord.voidedAt)} · ${selectedRecord.voidedBy ?? "N/D"}` : "No"}
                />
                <DetailCard label="Total" value={formatAmount(selectedRecord.total)} />
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/60">
                <div className="border-b border-border/60 px-4 py-3">
                  <h4 className="text-sm font-medium text-foreground">Denominaciones</h4>
                </div>

                {selectedRecord.denominations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Moneda</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Denominacion</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantidad</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.denominations.map((item, index) => (
                          <tr key={`${selectedRecord.id}-${item.currency}-${item.denomination}-${index}`} className="border-t border-border/40">
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
            </div>
          </div>
        </div>
      ) : null}
    </>
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
