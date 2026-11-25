'use client';

import { useMemo, useState } from 'react';
import { ArrowDownToLine, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { MaterialButton } from '@/components/MaterialButton';
import { ListSkeleton } from '@/components/ui/loading-skeleton';
import { getCreditInvoices } from '@/app/services/invoice';
import { applyBankTransfer } from '@/app/services/billing/bank-transfer';
import type { BankTransferRecord } from '@/app/type/bank-transfer';
import type { CreditInvoiceRecord } from '@/app/type/invoice';

type CashManagementOption = { id: string; label: string };

type Props = {
  transfer: BankTransferRecord;
  openCashManagementOptions: CashManagementOption[];
  onClose: () => void;
  onApplied: (updated: BankTransferRecord) => void;
};

type Line = {
  invoiceId: number;
  document: string;
  clientName: string;
  pendingNio: number;
  amount: string;
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

// Se compara en centavos para no fallar por decimales flotantes.
const toCents = (value: number) => Math.round((Number(value) || 0) * 100);
const round2 = (value: number) => toCents(value) / 100;

export default function AplicarTransferenciaModal({ transfer, openCashManagementOptions, onClose, onApplied }: Props) {
  const available = Number(transfer.availableAmountNio ?? 0);
  const defaultCashManagementId =
    openCashManagementOptions.find((option) => Number(option.id) === transfer.cashManagementId)?.id ??
    openCashManagementOptions[0]?.id ??
    '';

  const [cashManagementId, setCashManagementId] = useState(defaultCashManagementId);
  const [observation, setObservation] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CreditInvoiceRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalCents = lines.reduce((sum, line) => sum + toCents(Number(line.amount)), 0);
  const remainingCents = toCents(available) - totalCents;

  const lineErrors = useMemo(
    () =>
      lines.map((line) => {
        const amount = Number(line.amount);
        if (!line.amount.trim() || !Number.isFinite(amount) || amount <= 0) return 'Ingrese un monto mayor a 0';
        if (toCents(amount) > toCents(line.pendingNio)) return `Excede el pendiente (${formatAmount(line.pendingNio)})`;
        return null;
      }),
    [lines],
  );

  const exceedsAvailable = remainingCents < 0;
  const canSave =
    !saving && !!cashManagementId && lines.length > 0 && !exceedsAvailable && lineErrors.every((error) => !error);

  const runSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const query = search.trim();
    if (!query) return;
    try {
      setSearching(true);
      setErrorMessage(null);
      // El endpoint filtra por documento o por cliente (no ambos a la vez):
      // se consultan los dos y se combinan.
      const [byDocument, byClient] = await Promise.all([
        getCreditInvoices({ document: query, page: 1, perPage: 20 }),
        getCreditInvoices({ clientName: query, page: 1, perPage: 20 }),
      ]);
      const seen = new Set<number>();
      const merged = [...(byDocument.records ?? []), ...(byClient.records ?? [])].filter((invoice) => {
        if (seen.has(invoice.invoiceId)) return false;
        seen.add(invoice.invoiceId);
        return !invoice.isVoided && Number(invoice.remainingBalanceNio) > 0;
      });
      setResults(merged);
    } catch (error) {
      setResults([]);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron buscar las facturas');
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const addInvoice = (invoice: CreditInvoiceRecord) => {
    if (lines.some((line) => line.invoiceId === invoice.invoiceId)) return;
    const pending = Number(invoice.remainingBalanceNio) || 0;
    // Precarga: el menor entre lo que le queda a la transferencia y el pendiente.
    const prefill = Math.max(0, Math.min(remainingCents / 100, pending));
    setLines((prev) => [
      ...prev,
      {
        invoiceId: invoice.invoiceId,
        document: invoice.document,
        clientName: [invoice.clientCode, invoice.clientName].filter(Boolean).join(' – '),
        pendingNio: pending,
        amount: prefill > 0 ? round2(prefill).toFixed(2) : '',
      },
    ]);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      const updated = await applyBankTransfer(transfer.id, {
        cashManagementId: Number(cashManagementId),
        observation: observation.trim() || null,
        invoices: lines.map((line) => ({ invoiceId: line.invoiceId, amountNio: round2(Number(line.amount)) })),
      });
      toast.success(`Transferencia aplicada a ${lines.length} factura${lines.length === 1 ? '' : 's'}`);
      onApplied(updated);
    } catch (error) {
      // El modal se queda abierto con el `detail` del backend.
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo aplicar la transferencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-surface elevation-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <ArrowDownToLine size={20} className="text-primary" />
              <h3 className="text-foreground">Aplicar transferencia a facturas</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {transfer.bankName} · Doc. {transfer.document || transfer.accountNumber} · Monto C${' '}
              {formatAmount(transfer.amount)} · Disponible C$ {formatAmount(available)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-foreground">
              Gestión de caja *
              <select
                value={cashManagementId}
                onChange={(e) => setCashManagementId(e.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {openCashManagementOptions.length === 0 && <option value="">No hay gestiones abiertas</option>}
                {openCashManagementOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-foreground">
              Observación (opcional)
              <input
                type="text"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          {/* Buscador de facturas con saldo pendiente */}
          <form onSubmit={runSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar factura por documento o cliente..."
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <MaterialButton type="submit" variant="outlined" color="primary" disabled={searching || !search.trim()}>
              Buscar
            </MaterialButton>
          </form>

          {searching ? (
            <ListSkeleton count={3} itemClassName="h-9 rounded-xl" />
          ) : results.length > 0 ? (
            <div className="max-h-48 divide-y divide-border overflow-auto rounded-xl border border-border">
              {results.map((invoice) => {
                const added = lines.some((line) => line.invoiceId === invoice.invoiceId);
                return (
                  <div key={invoice.invoiceId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{invoice.document}</p>
                      <p className="text-xs text-muted-foreground">
                        {[invoice.clientCode, invoice.clientName].filter(Boolean).join(' – ') || 'Sin cliente'} · Pendiente C${' '}
                        {formatAmount(invoice.remainingBalanceNio)}
                      </p>
                    </div>
                    <MaterialButton
                      variant="text"
                      color="primary"
                      onClick={() => addInvoice(invoice)}
                      disabled={added || saving}
                    >
                      {added ? 'Agregada' : 'Agregar'}
                    </MaterialButton>
                  </div>
                );
              })}
            </div>
          ) : searched ? (
            <p className="text-sm text-muted-foreground">No se encontraron facturas con saldo pendiente.</p>
          ) : null}

          {/* Facturas a aplicar */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Factura</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-right">Pendiente</th>
                  <th className="px-3 py-2 text-right">Monto a aplicar</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Busque y agregue una o varias facturas.
                    </td>
                  </tr>
                ) : (
                  lines.map((line, index) => (
                    <tr key={line.invoiceId}>
                      <td className="px-3 py-2 font-medium text-foreground">{line.document}</td>
                      <td className="px-3 py-2 text-muted-foreground">{line.clientName || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatAmount(line.pendingNio)}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.amount}
                          disabled={saving}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((item) =>
                                item.invoiceId === line.invoiceId ? { ...item, amount: e.target.value } : item,
                              ),
                            )
                          }
                          className={`w-32 rounded-lg border bg-background px-2 py-1 text-right font-mono outline-none focus:border-primary ${
                            lineErrors[index] ? 'border-red-400' : 'border-border'
                          }`}
                        />
                        {lineErrors[index] && <p className="mt-1 text-xs text-red-600">{lineErrors[index]}</p>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          title="Quitar"
                          disabled={saving}
                          onClick={() => setLines((prev) => prev.filter((item) => item.invoiceId !== line.invoiceId))}
                          className="text-muted-foreground transition-colors hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-end gap-6 text-sm">
            <span className="text-muted-foreground">
              Total a aplicar: <strong className="font-mono text-foreground">C$ {formatAmount(totalCents / 100)}</strong>
            </span>
            <span className="text-muted-foreground">
              Saldo que quedará:{' '}
              <strong className={`font-mono ${exceedsAvailable ? 'text-red-600' : 'text-foreground'}`}>
                C$ {formatAmount(remainingCents / 100)}
              </strong>
            </span>
          </div>
          {exceedsAvailable && (
            <p className="text-right text-sm text-red-600">
              El total supera el disponible de la transferencia (C$ {formatAmount(available)}).
            </p>
          )}

          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <MaterialButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </MaterialButton>
          <MaterialButton variant="contained" color="primary" onClick={() => void handleSave()} disabled={!canSave}>
            {saving ? 'Aplicando...' : 'Guardar'}
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
