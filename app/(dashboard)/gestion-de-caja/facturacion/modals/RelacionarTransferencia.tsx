"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";

import { MaterialButton } from "@/components/MaterialButton";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { applyBankTransfer, getAvailableBankTransfers } from "@/app/services/billing/bank-transfer";
import { getCashManagementRecords } from "@/app/services/cash-management";
import { getCreditInvoices } from "@/app/services/invoice";
import { BankTransferRecord } from "@/app/type/bank-transfer";

type Props = {
  isOpen: boolean;
  invoiceId: number;
  invoiceDocument: string;
  onClose: () => void;
  /** Tras aplicar: el padre recarga la factura (saldo y estado). */
  onLinked?: () => void;
};

type CashManagementOption = { id: string; label: string };

const formatAmount = (value: number) =>
  new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const toCents = (value: number) => Math.round((Number(value) || 0) * 100);

// Aplica el saldo de una transferencia (o depósito) a esta factura. Reemplaza
// al antiguo "relacionar" (link-invoice), que no afectaba el saldo.
export default function RelacionarTransferenciaModal({
  isOpen,
  invoiceId,
  invoiceDocument,
  onClose,
  onLinked,
}: Props) {
  const [transfers, setTransfers] = useState<BankTransferRecord[]>([]);
  const [cashOptions, setCashOptions] = useState<CashManagementOption[]>([]);
  const [cashManagementId, setCashManagementId] = useState("");
  // null = la factura no aparece en el resumen de pagos (sin saldo pendiente).
  const [pendingNio, setPendingNio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setSelectedId(null);
      setAmount("");
      setSearch("");
      setErrorMessage(null);
      setPendingNio(null);
      try {
        setLoading(true);
        const [transfersResponse, cashResponse, invoiceResponse] = await Promise.all([
          getAvailableBankTransfers({ page: 1, perPage: 200 }),
          getCashManagementRecords({ status: "OPEN", page: 1, perPage: 100 }),
          getCreditInvoices({ document: invoiceDocument, page: 1, perPage: 20 }),
        ]);
        setTransfers(transfersResponse.records || []);
        const options = (cashResponse.records || []).map((record) => ({
          id: String(record.id),
          label: `${record.cashRegisterCode} - ${record.cashRegisterName} - ${record.responsibleEmployeeName}`,
        }));
        setCashOptions(options);
        setCashManagementId(options[0]?.id ?? "");
        const invoice = (invoiceResponse.records || []).find((record) => record.invoiceId === invoiceId);
        setPendingNio(invoice && !invoice.isVoided ? Number(invoice.remainingBalanceNio) || 0 : null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudieron cargar las transferencias con saldo",
        );
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [isOpen, invoiceId, invoiceDocument]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transfers;
    return transfers.filter((transfer) =>
      `${transfer.document ?? transfer.accountNumber} ${transfer.bankName} ${transfer.amount}`
        .toLowerCase()
        .includes(query),
    );
  }, [transfers, search]);

  const selected = transfers.find((transfer) => transfer.id === selectedId) ?? null;
  const selectedAvailable = Number(selected?.availableAmountNio ?? 0);

  const selectTransfer = (transfer: BankTransferRecord) => {
    setSelectedId(transfer.id);
    setErrorMessage(null);
    // Precarga: min(disponible de la transferencia, pendiente de la factura).
    const transferAvailable = Number(transfer.availableAmountNio ?? 0);
    const max = pendingNio === null ? transferAvailable : Math.min(transferAvailable, pendingNio);
    setAmount(max > 0 ? (toCents(max) / 100).toFixed(2) : "");
  };

  const amountValue = Number(amount);
  const amountError = !selected
    ? null
    : !amount.trim() || !Number.isFinite(amountValue) || amountValue <= 0
      ? "Ingrese un monto mayor a 0"
      : toCents(amountValue) > toCents(selectedAvailable)
        ? `Excede el disponible de la transferencia (${formatAmount(selectedAvailable)})`
        : pendingNio !== null && toCents(amountValue) > toCents(pendingNio)
          ? `Excede el saldo pendiente de la factura (${formatAmount(pendingNio)})`
          : null;

  const blockReason =
    cashOptions.length === 0
      ? "No hay una gestión de caja abierta: las transferencias solo se aplican con la gestión abierta."
      : pendingNio !== null && pendingNio <= 0
        ? "La factura no tiene saldo pendiente."
        : null;

  const canSave = !saving && !loading && !!selected && !amountError && !blockReason && !!cashManagementId;

  const handleSave = async () => {
    if (!selected || !canSave) return;
    setErrorMessage(null);
    try {
      setSaving(true);
      await applyBankTransfer(selected.id, {
        cashManagementId: Number(cashManagementId),
        invoices: [{ invoiceId, amountNio: toCents(amountValue) / 100 }],
      });
      toast.success(`Transferencia aplicada a la factura ${invoiceDocument}`);
      onLinked?.();
      onClose();
    } catch (error) {
      // Se queda abierto con el `detail` del backend.
      setErrorMessage(error instanceof Error ? error.message : "No se pudo aplicar la transferencia");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-surface elevation-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Link2 size={20} className="text-primary" />
              <h3 className="text-foreground">Aplicar transferencia · Factura {invoiceDocument}</h3>
            </div>
            {!loading && (
              <p className="mt-1 text-sm text-muted-foreground">
                Saldo pendiente:{" "}
                {pendingNio === null ? "sin saldo pendiente registrado" : `C$ ${formatAmount(pendingNio)}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por documento, banco o monto..."
            className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />

          {loading ? (
            <ListSkeleton count={3} itemClassName="h-10 rounded-2xl" />
          ) : filteredTransfers.length === 0 ? (
            <p className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              No hay transferencias con saldo disponible.
            </p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2 text-left">Documento</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Banco</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-right">Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      onClick={() => !saving && selectTransfer(transfer)}
                      className={`cursor-pointer hover:bg-muted/30 ${selectedId === transfer.id ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="radio"
                          name="transfer"
                          checked={selectedId === transfer.id}
                          onChange={() => selectTransfer(transfer)}
                          disabled={saving}
                        />
                      </td>
                      <td className="px-3 py-2 text-foreground">{transfer.document || transfer.accountNumber}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(transfer.transferDate).toLocaleDateString("es-NI", { timeZone: "UTC" })}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{transfer.bankName}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatAmount(transfer.amount)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">
                        {formatAmount(transfer.availableAmountNio ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selected && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-foreground">
                Monto a aplicar (C$) *
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={saving}
                  className={`mt-1 w-full rounded-xl border bg-background px-3 py-2 text-right font-mono outline-none focus:border-primary ${
                    amountError ? "border-red-400" : "border-border"
                  }`}
                />
                {amountError && <span className="mt-1 block text-xs text-red-600">{amountError}</span>}
              </label>
              {cashOptions.length > 1 && (
                <label className="text-sm text-foreground">
                  Gestión de caja *
                  <select
                    value={cashManagementId}
                    onChange={(e) => setCashManagementId(e.target.value)}
                    disabled={saving}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {cashOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {!loading && blockReason && (
            <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {blockReason}
            </div>
          )}

          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <MaterialButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </MaterialButton>
          <MaterialButton variant="contained" color="primary" onClick={() => void handleSave()} disabled={!canSave}>
            {saving ? "Aplicando..." : "Aplicar"}
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
