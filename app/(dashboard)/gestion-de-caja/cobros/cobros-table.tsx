"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import type { CollectionRecord } from "@/app/type/collection";

type Props = {
  records: CollectionRecord[];
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

  if (normalizedStatus.includes("anulad") || normalizedStatus.includes("void")) {
    return "bg-rose-100 text-rose-700";
  }

  if (
    normalizedStatus.includes("activ") ||
    normalizedStatus.includes("completed") ||
    normalizedStatus.includes("aplicad")
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalizedStatus.includes("pendiente")) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
};

export default function CobrosTable({ records }: Props) {
  const [selectedRecord, setSelectedRecord] = useState<CollectionRecord | null>(
    null,
  );

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Número
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Factura
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Caja
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Moneda
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr
                    key={record.header.id}
                    className="align-top transition-colors hover:bg-muted/15"
                  >
                    <td className="px-4 py-4 text-foreground">
                      {record.header.number}
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      {record.header.invoiceDocument}
                      {record.header.invoiceCount > 1
                        ? ` (+${record.header.invoiceCount - 1})`
                        : ""}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {record.header.cashRegisterCode} -{" "}
                      {record.header.cashRegisterName}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(record.header.collectionDate)}
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      {record.header.currency}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.header.status)}`}
                      >
                        {record.header.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-foreground">
                      {formatAmount(record.summary.total)}
                    </td>
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
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No hay cobros para mostrar.
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
                <h3 className="text-foreground">
                  Detalle de cobro #{selectedRecord.header.number}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Factura {selectedRecord.header.invoiceDocument} ·{" "}
                  {selectedRecord.header.cashRegisterCode} -{" "}
                  {selectedRecord.header.cashRegisterName}
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
              <div className="grid gap-3 md:grid-cols-3">
                <DetailCard
                  label="Fecha"
                  value={formatDateTime(selectedRecord.header.collectionDate)}
                />
                <DetailCard label="Moneda" value={selectedRecord.header.currency} />
                <DetailCard label="Estado" value={selectedRecord.header.status} />
                <DetailCard
                  label="Estado de aplicación"
                  value={selectedRecord.header.applicationStatus}
                />
                <DetailCard
                  label="Descripción"
                  value={selectedRecord.header.description || "Sin descripción"}
                />
                <DetailCard
                  label="Anulado"
                  value={
                    selectedRecord.header.voidedAt
                      ? `${formatDateTime(selectedRecord.header.voidedAt)} · ${selectedRecord.header.voidedBy ?? "N/D"}`
                      : "No"
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailCard
                  label="Total efectivo"
                  value={formatAmount(selectedRecord.summary.cashTotal)}
                />
                <DetailCard
                  label="Total transferencias"
                  value={formatAmount(selectedRecord.summary.transferTotal)}
                />
                <DetailCard
                  label="Total"
                  value={formatAmount(selectedRecord.summary.total)}
                />
                <DetailCard
                  label="Vuelto (NIO)"
                  value={formatAmount(selectedRecord.summary.changeTotalNio)}
                />
                <DetailCard
                  label="Aplicado NIO"
                  value={formatAmount(selectedRecord.summary.appliedAmountNio)}
                />
                <DetailCard
                  label="Aplicado USD"
                  value={formatAmount(selectedRecord.summary.appliedAmountUsd)}
                />
                <DetailCard
                  label="Pendiente USD"
                  value={formatAmount(selectedRecord.summary.pendingAmountUsd)}
                />
              </div>

              <DetailSection title="Facturas aplicadas">
                {selectedRecord.invoiceAllocations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Factura
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Cliente
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Monto factura
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Pagado previo
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Aplicado
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Saldo restante
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.invoiceAllocations.map((allocation) => (
                          <tr key={allocation.id} className="border-t border-border/40">
                            <td className="px-4 py-2 text-foreground">
                              {allocation.invoiceDocument}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {allocation.clientCode}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(allocation.invoiceAmountNio)}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(allocation.previousPaidAmountNio)}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(allocation.appliedAmountNio)}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(allocation.remainingBalanceNio)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyDetail text="No hay facturas aplicadas." />
                )}
              </DetailSection>

              <DetailSection title="Efectivo recibido">
                {selectedRecord.cashDetails.length > 0 ? (
                  <DenominationTable items={selectedRecord.cashDetails} />
                ) : (
                  <EmptyDetail text="No hay denominaciones registradas." />
                )}
              </DetailSection>

              <DetailSection title="Vuelto entregado">
                {selectedRecord.changeDetails.length > 0 ? (
                  <DenominationTable items={selectedRecord.changeDetails} />
                ) : (
                  <EmptyDetail text="No hay vuelto registrado." />
                )}
              </DetailSection>

              <DetailSection title="Transferencias bancarias">
                {selectedRecord.bankTransfers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Cuenta
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Banco
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.bankTransfers.map((transfer) => (
                          <tr key={transfer.id} className="border-t border-border/40">
                            <td className="px-4 py-2 text-foreground">
                              {transfer.accountNumber}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {transfer.companyBankAccount?.bankName} ·{" "}
                              {transfer.companyBankAccount?.description}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {formatDateTime(transfer.transferDate)}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground">
                              {formatAmount(transfer.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyDetail text="No hay transferencias registradas." />
                )}
              </DetailSection>
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
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
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

function DenominationTable({
  items,
}: {
  items: { id: number; denomination: number; quantity: number; total: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
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
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border/40">
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
  );
}
