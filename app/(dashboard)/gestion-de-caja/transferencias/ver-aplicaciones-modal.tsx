'use client';

import { useCallback, useEffect, useState } from 'react';
import { ListChecks, X } from 'lucide-react';
import { toast } from 'sonner';

import { MaterialButton } from '@/components/MaterialButton';
import { ListSkeleton } from '@/components/ui/loading-skeleton';
import { getBankTransferById, voidBankTransferApplication } from '@/app/services/billing/bank-transfer';
import type { BankTransferApplication, BankTransferRecord } from '@/app/type/bank-transfer';

type Props = {
  transfer: BankTransferRecord;
  canVoid: boolean;
  onClose: () => void;
  /** Se llama con la transferencia actualizada tras anular una aplicación. */
  onUpdated: (updated: BankTransferRecord) => void;
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' });
};

const isActive = (application: BankTransferApplication) => String(application.status).toUpperCase() === 'ACTIVE';

export default function VerAplicacionesModal({ transfer: initial, canVoid, onClose, onUpdated }: Props) {
  const [transfer, setTransfer] = useState<BankTransferRecord>(initial);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);

  // Se recarga por id para traer las aplicaciones al día.
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const fresh = await getBankTransferById(initial.id);
      setTransfer(fresh);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la transferencia');
    } finally {
      setLoading(false);
    }
  }, [initial.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleVoid = async (application: BankTransferApplication) => {
    if (voidingId) return;
    const confirmed = window.confirm(
      `¿Anular la aplicación de C$ ${formatAmount(application.appliedAmountNio)} a la factura ${application.invoiceDocument}? ` +
        'El monto vuelve al saldo de la transferencia y al pendiente de la factura.',
    );
    if (!confirmed) return;
    try {
      setVoidingId(application.id);
      setErrorMessage(null);
      const updated = await voidBankTransferApplication(application.id);
      setTransfer(updated);
      onUpdated(updated);
      toast.success('Aplicación anulada');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo anular la aplicación');
    } finally {
      setVoidingId(null);
    }
  };

  const applications = transfer.applications ?? [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-surface elevation-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks size={20} className="text-primary" />
              <h3 className="text-foreground">Aplicaciones de la transferencia</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {transfer.bankName} · Doc. {transfer.document || transfer.accountNumber} · Monto C${' '}
              {formatAmount(transfer.amount)} · Aplicado C$ {formatAmount(transfer.appliedAmountNio ?? 0)} · Disponible
              C$ {formatAmount(transfer.availableAmountNio ?? 0)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-5">
          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          )}

          {loading ? (
            <ListSkeleton count={3} itemClassName="h-9 rounded-xl" />
          ) : applications.length === 0 ? (
            <p className="rounded-xl border border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Esta transferencia no se ha aplicado a ninguna factura.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Factura</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-left">Gestión</th>
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applications.map((application) => {
                    const active = isActive(application);
                    return (
                      <tr key={application.id} className={active ? '' : 'text-muted-foreground'}>
                        <td className="px-3 py-2">
                          <span className="font-medium">{application.invoiceDocument}</span>
                          {application.clientCode ? (
                            <span className="block text-xs text-muted-foreground">{application.clientCode}</span>
                          ) : null}
                          {application.observation ? (
                            <span className="block text-xs text-muted-foreground">{application.observation}</span>
                          ) : null}
                        </td>
                        <td className={`px-3 py-2 text-right font-mono ${active ? '' : 'line-through'}`}>
                          {formatAmount(application.appliedAmountNio)}
                        </td>
                        <td className="px-3 py-2">#{application.cashManagementId}</td>
                        <td className="px-3 py-2">{application.createdBy || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(application.createdAt)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs ${
                              active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                            title={
                              !active && application.voidedAt
                                ? `Anulada ${formatDateTime(application.voidedAt)}${application.voidedBy ? ` · ${application.voidedBy}` : ''}`
                                : undefined
                            }
                          >
                            {active ? 'Activa' : 'Anulada'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {active && canVoid && (
                            <MaterialButton
                              variant="text"
                              color="secondary"
                              onClick={() => void handleVoid(application)}
                              disabled={voidingId !== null}
                            >
                              {voidingId === application.id ? 'Anulando...' : 'Anular'}
                            </MaterialButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-5 py-4">
          <MaterialButton variant="outlined" color="secondary" onClick={onClose}>
            Cerrar
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
