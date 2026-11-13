'use client';

import { useState } from 'react';
import { ChevronDown, Save, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { updateBankTransfer } from '@/app/services/billing/bank-transfer';
import { AccountingConceptOption, BankTransferRecord } from '@/app/type/bank-transfer';

type Option = { id: number | string; label: string };

type Props = {
  transfer: BankTransferRecord;
  bankAccountOptions: Option[];
  /** Solo gestiones de caja ABIERTAS: la transferencia no se puede mover a una cerrada. */
  openCashManagementOptions: Option[];
  conceptOptions: AccountingConceptOption[];
  onClose: () => void;
  onSaved: (updated: BankTransferRecord) => void;
};

const selectClass =
  'w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none';

export default function EditarTransferenciaModal({
  transfer,
  bankAccountOptions,
  openCashManagementOptions,
  conceptOptions,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState({
    companyBankAccountId: String(transfer.companyBankAccountId ?? ''),
    accountNumber: transfer.accountNumber ?? '',
    // La fecha se guarda como medianoche UTC; se toma la parte YYYY-MM-DD.
    transferDate: (transfer.transferDate ?? '').slice(0, 10),
    amount: String(transfer.amount ?? ''),
    cashManagementId: transfer.cashManagementId ? String(transfer.cashManagementId) : '',
    accountingConceptId: transfer.accountingConceptId ? String(transfer.accountingConceptId) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const companyBankAccountId = Number(form.companyBankAccountId);
    const amount = Number(form.amount);

    if (!companyBankAccountId) return setError('Seleccione una cuenta bancaria de la empresa');
    if (!form.accountNumber.trim()) return setError('Ingrese el número de referencia / documento');
    if (!form.transferDate) return setError('Ingrese la fecha de la transferencia');
    if (!Number.isFinite(amount) || amount <= 0) return setError('Ingrese un monto válido');
    if (!form.cashManagementId) return setError('Seleccione una gestión de caja abierta');

    try {
      setSaving(true);
      setError(null);
      const updated = await updateBankTransfer(transfer.id, {
        accountNumber: form.accountNumber.trim(),
        companyBankAccountId,
        transferDate: new Date(form.transferDate).toISOString(),
        amount,
        cashManagementId: Number(form.cashManagementId),
        accountingConceptId: form.accountingConceptId ? Number(form.accountingConceptId) : null,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la transferencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-surface elevation-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-foreground">Editar transferencia</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label className="text-sm text-foreground mb-2 block">Cuenta bancaria (empresa) *</label>
            <div className="relative">
              <select
                value={form.companyBankAccountId}
                onChange={(e) => set('companyBankAccountId')(e.target.value)}
                className={selectClass}
              >
                <option value="">Seleccione una cuenta</option>
                {bankAccountOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <MaterialInput
            label="Número de referencia / documento *"
            fullWidth
            value={form.accountNumber}
            onChange={(e) => set('accountNumber')(e.target.value)}
          />

          <MaterialInput
            label="Fecha *"
            type="date"
            fullWidth
            value={form.transferDate}
            onChange={(e) => set('transferDate')(e.target.value)}
          />

          <MaterialInput
            label="Monto *"
            type="number"
            min={0}
            step="0.01"
            fullWidth
            value={form.amount}
            onChange={(e) => set('amount')(e.target.value)}
          />

          <div>
            <label className="text-sm text-foreground mb-2 block">Gestión de caja (abierta) *</label>
            <div className="relative">
              <select
                value={form.cashManagementId}
                onChange={(e) => set('cashManagementId')(e.target.value)}
                className={selectClass}
              >
                <option value="">Seleccione una gestión de caja</option>
                {openCashManagementOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm text-foreground mb-2 block">Concepto contable (opcional)</label>
            <div className="relative">
              <select
                value={form.accountingConceptId}
                onChange={(e) => set('accountingConceptId')(e.target.value)}
                className={selectClass}
              >
                <option value="">Sin concepto</option>
                {conceptOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.name} ({option.category?.name ?? '—'})
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <MaterialButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </MaterialButton>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Save size={18} />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>
  );
}
