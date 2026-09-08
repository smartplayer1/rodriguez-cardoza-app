'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { updateEarnedReward } from '@/app/services/reward/earned-reward';
import { ClientEarnedReward, EarnedRewardStatus, UpdateEarnedRewardPayload } from '@/app/type/client';

type Props = {
  reward: ClientEarnedReward;
  onClose: () => void;
  onSaved: (updated: ClientEarnedReward) => void;
};

const STATUS_OPTIONS: EarnedRewardStatus[] = ['Pending', 'Credited'];

export default function EditarPremioModal({ reward, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<EarnedRewardStatus>(
    (reward.status as EarnedRewardStatus) || 'Pending',
  );
  const [articleCode, setArticleCode] = useState(reward.articleCode || '');
  const [quantity, setQuantity] = useState(String(reward.quantity ?? 0));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMessage(null);

    const payload: UpdateEarnedRewardPayload = {
      status,
      articleCode: articleCode.trim() || undefined,
      quantity: Number.isFinite(Number(quantity)) ? Number(quantity) : undefined,
    };

    try {
      setSaving(true);
      const updated = await updateEarnedReward(reward.id, payload);
      onSaved(updated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo editar el premio ganado',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface elevation-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-foreground">Editar premio #{reward.id}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="text-sm text-foreground mb-2 block">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EarnedRewardStatus)}
              disabled={saving}
              className="w-full pl-4 pr-4 py-3 bg-input-background border-b-2 border-border
                       focus:border-primary rounded-t transition-colors outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'Pending' ? 'Pendiente' : 'Acreditado'}
                </option>
              ))}
            </select>
          </div>

          <MaterialInput
            label="Código de artículo"
            fullWidth
            value={articleCode}
            onChange={(e) => setArticleCode(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Cantidad"
            type="number"
            min={0}
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={saving}
          />

          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <MaterialButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </MaterialButton>
            <MaterialButton variant="contained" color="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>
  );
}
