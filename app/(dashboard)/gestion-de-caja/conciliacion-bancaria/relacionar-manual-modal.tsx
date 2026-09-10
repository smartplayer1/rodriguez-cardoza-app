'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link2, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { ListSkeleton } from '@/components/ui/loading-skeleton';
import { getUnrelatedBankTransfers, linkBankTransferImport } from '@/app/services/billing/bank-transfer';
import { BankTransferImportRecord, BankTransferRecord } from '@/app/type/bank-transfer';

type Props = {
  isOpen: boolean;
  bankImportRow: BankTransferImportRecord | null;
  onClose: () => void;
  onResolved: () => void;
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

export default function RelacionarManualModal({ isOpen, bankImportRow, onClose, onResolved }: Props) {
  const [transfers, setTransfers] = useState<BankTransferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedId(null);
    setSearch('');
    setErrorMessage(null);

    const loadTransfers = async () => {
      try {
        setLoading(true);
        const response = await getUnrelatedBankTransfers({ isReconciled: false, page: 1, perPage: 500 });
        setTransfers(response.records || []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudieron cargar las transferencias internas',
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

  if (!isOpen || !bankImportRow) return null;

  const handleSave = async () => {
    if (!selectedId) {
      setErrorMessage('Seleccione una transferencia interna');
      return;
    }

    setErrorMessage(null);

    try {
      setSaving(true);
      await linkBankTransferImport(bankImportRow.id, selectedId);
      onResolved();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo relacionar el registro del banco',
      );
      // Un 409 casi siempre significa que el estado ya cambió (esta fila u
      // otra transferencia ya quedaron tomadas por otro lado) — refrescamos
      // la lista de fondo para que no quede desincronizada, sin cerrar el
      // modal, así el usuario ve el motivo del error.
      onResolved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface elevation-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 size={20} className="text-primary" />
            <h3 className="text-foreground">Relacionar manualmente</h3>
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
          <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
            <div className="text-foreground">
              {bankImportRow.document} · {formatDate(bankImportRow.transferDate)}
            </div>
            <div className="text-muted-foreground">{bankImportRow.description}</div>
            <div className="mt-1 font-mono text-foreground">{formatAmount(bankImportRow.amount)}</div>
          </div>

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
              No hay transferencias internas pendientes de relacionar.
            </p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-2xl border border-border divide-y divide-border">
              {filteredTransfers.map((transfer) => (
                <label
                  key={transfer.id}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="internal-transfer"
                      checked={selectedId === transfer.id}
                      onChange={() => setSelectedId(transfer.id)}
                      disabled={saving}
                    />
                    <span className="text-foreground">
                      {transfer.bankName} · {transfer.accountNumber} ·{' '}
                      {new Date(transfer.transferDate).toLocaleDateString('es-NI')}
                    </span>
                  </span>
                  <span className="font-medium text-foreground">{formatAmount(transfer.amount)}</span>
                </label>
              ))}
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
          <MaterialButton variant="contained" color="primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Relacionando...' : 'Relacionar'}
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
