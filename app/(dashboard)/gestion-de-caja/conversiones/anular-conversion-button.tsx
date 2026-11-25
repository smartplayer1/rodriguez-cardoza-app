'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban } from 'lucide-react';
import { toast } from 'sonner';

import { voidCashManagementConversion } from '@/app/services/cash-management';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

// Anula una conversión activa: el backend revierte sus movimientos de caja y la rechaza si la
// gestión ya está cerrada (se muestra su mensaje).
export default function AnularConversionButton({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = ['active', 'activo', 'activa'].includes(String(status ?? '').trim().toLowerCase());
  if (!mounted || !isActive || !can(PERMISSIONS.CURRENCY_CONVERSION_VOID)) return null;

  const handleVoid = async () => {
    if (!window.confirm(`¿Anular la conversión #${id}? Se revierten sus movimientos de caja.`)) return;
    try {
      setBusy(true);
      await voidCashManagementConversion(id);
      toast.success(`Conversión #${id} anulada`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo anular la conversión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleVoid()}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
    >
      <Ban size={14} />
      {busy ? 'Anulando...' : 'Anular'}
    </button>
  );
}
