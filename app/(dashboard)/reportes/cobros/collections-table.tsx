'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CollectionsReportRecord } from '@/app/type/collections-report';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
};

const getStatusClasses = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('anulad') || normalizedStatus.includes('void')) {
    return 'bg-rose-100 text-rose-700';
  }

  if (
    normalizedStatus.includes('activ') ||
    normalizedStatus.includes('completed') ||
    normalizedStatus.includes('aplicad')
  ) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalizedStatus.includes('pendiente')) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-200 text-slate-700';
};

export default function CollectionsTable({ records }: { records: CollectionsReportRecord[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Número</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Moneda</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caja</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Efectivo</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Transferencia</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aplicado C$</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Facturas</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {records.length > 0 ? (
              records.map((record) => (
                <Fragment key={record.collectionId}>
                  <tr className="align-top transition-colors hover:bg-muted/15">
                    <td className="px-4 py-4 text-foreground">{record.number}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{formatDateTime(record.collectionDate)}</td>
                    <td className="px-4 py-4 text-foreground">{record.currency}</td>
                    <td className="px-4 py-4">
                      <div className="text-foreground">{record.cashRegisterName}</div>
                      <div className="text-xs text-muted-foreground">{record.cashRegisterCode}</div>
                    </td>
                    <td className="px-4 py-4 text-foreground">{record.branchName ?? record.branchCode}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-foreground">{formatCurrency(record.cashTotal)}</td>
                    <td className="px-4 py-4 text-right font-mono text-foreground">{formatCurrency(record.transferTotal)}</td>
                    <td className="px-4 py-4 text-right font-mono text-foreground">{formatCurrency(record.totalReceived)}</td>
                    <td className="px-4 py-4 text-right font-mono text-foreground">{formatCurrency(record.appliedAmountNio)}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === record.collectionId ? null : record.collectionId)}
                        className="inline-flex items-center gap-1 rounded-xl border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent"
                      >
                        {record.appliedInvoices.length}
                        {expandedId === record.collectionId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>

                  {expandedId === record.collectionId && (
                    <tr>
                      <td colSpan={11} className="bg-muted/20 px-4 py-4">
                        {record.appliedInvoices.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Facturas aplicadas</p>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                              {record.appliedInvoices.map((invoice) => (
                                <div
                                  key={invoice.invoiceId}
                                  className="flex items-center justify-between rounded-xl border border-border/60 bg-surface px-3 py-2 text-xs"
                                >
                                  <div>
                                    <div className="text-foreground">{invoice.document}</div>
                                    <div className="text-muted-foreground">
                                      {invoice.clientName ?? invoice.clientCode}
                                    </div>
                                  </div>
                                  <div className="font-mono text-foreground">C${formatCurrency(invoice.amountNio)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin facturas aplicadas.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                  No hay cobros para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
