"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, X } from "lucide-react";

import { MaterialButton } from "@/components/MaterialButton";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import {
  getUnrelatedBankTransfers,
  linkBankTransferToInvoice,
} from "@/app/services/billing/bank-transfer";
import { BankTransferRecord } from "@/app/type/bank-transfer";

type Props = {
  isOpen: boolean;
  invoiceId: number;
  invoiceDocument: string;
  onClose: () => void;
  onLinked?: () => void;
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function RelacionarTransferenciaModal({
  isOpen,
  invoiceId,
  invoiceDocument,
  onClose,
  onLinked,
}: Props) {
  const [transfers, setTransfers] = useState<BankTransferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedIds([]);
    setSearch("");
    setErrorMessage(null);

    const loadTransfers = async () => {
      try {
        setLoading(true);
        const response = await getUnrelatedBankTransfers({ page: 1, perPage: 500 });
        setTransfers(response.records || []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las transferencias pendientes",
        );
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };

    void loadTransfers();
  }, [isOpen]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transfers;

    return transfers.filter((transfer) => {
      const haystack = `${transfer.bankName} ${transfer.accountNumber} ${transfer.amount}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [transfers, search]);

  const toggleTransfer = (transferId: number) => {
    setSelectedIds((previous) =>
      previous.includes(transferId)
        ? previous.filter((id) => id !== transferId)
        : [...previous, transferId],
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage("Seleccione al menos una transferencia");
      return;
    }

    setErrorMessage(null);

    try {
      setSaving(true);
      for (const transferId of selectedIds) {
        await linkBankTransferToInvoice(transferId, invoiceId);
      }
      onLinked?.();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo relacionar la transferencia con la factura",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface elevation-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 size={20} className="text-primary" />
            <h3 className="text-foreground">
              Relacionar transferencia · Factura {invoiceDocument}
            </h3>
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
            placeholder="Buscar por banco, cuenta o monto..."
            className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />

          {loading ? (
            <ListSkeleton count={3} itemClassName="h-10 rounded-2xl" />
          ) : filteredTransfers.length === 0 ? (
            <p className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              No hay transferencias pendientes de relacionar.
            </p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-2xl border border-border divide-y divide-border">
              {filteredTransfers.map((transfer) => {
                const isSelected = selectedIds.includes(transfer.id);

                return (
                  <label
                    key={transfer.id}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTransfer(transfer.id)}
                        disabled={saving}
                      />
                      <span className="text-foreground">
                        {transfer.bankName} · {transfer.accountNumber} ·{" "}
                        {new Date(transfer.transferDate).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="font-medium text-foreground">
                      {formatAmount(transfer.amount)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <MaterialButton
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </MaterialButton>
          <MaterialButton
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Relacionando..." : "Relacionar"}
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
