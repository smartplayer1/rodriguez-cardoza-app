"use client";

import { useEffect, useState } from "react";

import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { getCreditInvoices } from "@/app/services/invoice";
import type { CreditInvoiceRecord } from "@/app/type/invoice";

const formatAmount = (value: number) =>
  new Intl.NumberFormat("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-NI");
};

type Props = { invoiceId: number; document: string };

// Desglose de pagos de la factura (resumen de /v1/invoice/credit).
// `paidAmountNio` YA incluye lo pagado con transferencias: "Cobros" se obtiene
// restando `bankTransferAmountNio`, nunca se suman los dos.
export default function ResumenPagos({ invoiceId, document }: Props) {
  const [summary, setSummary] = useState<CreditInvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await getCreditInvoices({ document, page: 1, perPage: 20 });
        if (cancelled) return;
        setSummary((response.records || []).find((record) => record.invoiceId === invoiceId) ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el resumen de pagos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, document]);

  if (loading) {
    return (
      <div className="mb-6">
        <ListSkeleton count={2} itemClassName="h-6 rounded" />
      </div>
    );
  }
  if (error) return <p className="mb-6 text-sm text-rose-700">{error}</p>;
  if (!summary) return null;

  const paid = Number(summary.paidAmountNio) || 0;
  const byTransfers = Number(summary.bankTransferAmountNio) || 0;
  const applications = summary.bankTransferApplications ?? [];

  return (
    <div className="mb-6 rounded border border-border p-4">
      <h3 className="mb-4 text-foreground">Pagos</h3>
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
        <div>
          <span className="text-muted-foreground">Monto factura</span>
          <p className="font-mono text-foreground">C$ {formatAmount(summary.invoiceAmountNio)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Cobros</span>
          <p className="font-mono text-foreground">C$ {formatAmount(paid - byTransfers)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Transferencias</span>
          <p className="font-mono text-foreground">C$ {formatAmount(byTransfers)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Total pagado</span>
          <p className="font-mono text-foreground">C$ {formatAmount(paid)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Saldo pendiente</span>
          <p className={`font-mono ${summary.remainingBalanceNio > 0 ? "text-amber-700" : "text-green-700"}`}>
            C$ {formatAmount(summary.remainingBalanceNio)}
          </p>
        </div>
      </div>

      {applications.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Transferencias aplicadas</p>
          <table className="w-full max-w-xl text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-1 text-left font-medium">Documento</th>
                <th className="py-1 text-left font-medium">Banco</th>
                <th className="py-1 text-left font-medium">Fecha</th>
                <th className="py-1 text-right font-medium">Monto</th>
                <th className="py-1 text-left font-medium pl-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const active = String(application.status).toUpperCase() === "ACTIVE";
                return (
                  <tr key={application.id} className={`border-b border-border/30 ${active ? "" : "text-muted-foreground"}`}>
                    <td className="py-1">{application.transferDocument}</td>
                    <td className="py-1">{application.bankName || "—"}</td>
                    <td className="py-1">{formatDate(application.transferDate ?? application.createdAt)}</td>
                    <td className={`py-1 text-right font-mono ${active ? "" : "line-through"}`}>
                      {formatAmount(application.appliedAmountNio)}
                    </td>
                    <td className="py-1 pl-3">{active ? "Activa" : "Anulada"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
