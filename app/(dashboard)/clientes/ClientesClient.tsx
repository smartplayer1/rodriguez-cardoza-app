'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Edit,
  Eye,
  Gift,
  Lock,
  Plus,
  Ticket,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';

import { MaterialButton } from '../../../components/MaterialButton';
import {
  ClientCouponBalance,
  ClientCouponMovement,
  ClientEarnedReward,
  ClientErrorItem,
  ClientRewardProgress,
  Client,
  ClienteExcel,
  ClienteResponse,
  ErrorResponse,
} from '@/app/type/client';
import { ImportarClientesModal } from '@/components/excel-upload-client';
import { withAuthRedirectSuppressed } from '@/components/AuthFetchGuard';
import { createClient } from '@/app/services/clients';
import { BranchResponse } from '@/app/type/branch';
import ModaleErrorCreateClient from '@/components/modal-error-create-client';
import {
  closeClientRewardLedger,
  getClientCouponBalance,
  getClientCouponMovements,
  getClientEarnedRewards,
  getClientRewardProgress,
  reopenClientRewardLedger,
} from '@/app/services/reward/client';
import { deleteEarnedReward } from '@/app/services/reward/earned-reward';
import EditarPremioModal from './editar-premio-modal';
import EditarClienteModal from './editar-cliente-modal';
import { ListSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

type Props = {
  initialClientes: ClienteResponse[];
  branches: BranchResponse['records'];
};

// Máximo de creaciones de cliente en vuelo al mismo tiempo durante el import.
// Sin este límite, un Excel grande dispara todas las peticiones POST /v1/client
// en paralelo y satura las conexiones a la base de datos del backend
// ("too many clients already").
const IMPORT_CONCURRENCY = 5;

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export default function ClientesClient({ initialClientes, branches }: Props) {
  const router = useRouter();
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [clientes, setClientes] = useState<ClienteResponse[]>(initialClientes);
  const [errorCreateClient, setErrorCreateClient] = useState<ClientErrorItem[]>([]);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProcessed, setImportProcessed] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importSuccessCount, setImportSuccessCount] = useState(0);

  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteResponse | null>(null);
  const [rewardTab, setRewardTab] = useState<'progress' | 'earned' | 'coupons'>('progress');
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [clientProgress, setClientProgress] = useState<ClientRewardProgress[]>([]);
  const [clientEarnedRewards, setClientEarnedRewards] = useState<ClientEarnedReward[]>([]);
  const [clientCouponMovements, setClientCouponMovements] = useState<ClientCouponMovement[]>([]);
  const [clientCouponBalance, setClientCouponBalance] = useState<ClientCouponBalance | null>(null);

  const [isRewardLedgerClosed, setIsRewardLedgerClosed] = useState(false);
  const [ledgerActionLoading, setLedgerActionLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<ClientEarnedReward | null>(null);
  const [editingCliente, setEditingCliente] = useState<ClienteResponse | null>(null);

  const handleImport = async (data: ClienteExcel[]) => {
    setImporting(true);
    setErrorCreateClient([]);
    setImportSuccessCount(0);
    setImportProcessed(0);

    const dataProcessed: Client[] = data.map((item) => ({
      id: 0,
      code: item.code,
      name: item.name,
      phoneNumber: item.phoneNumber || '',
      idNumber: item.idNumber || '',
      address: item.address || '',
      province: item.province || '',
      canton: item.canton || '',
      district: item.district || '',
      clientType: item.clientType,
      zoneCode: item.zoneCode,
      dateOfEntry: item.dateOfEntry,
      promotorCode: item.promoterCode,
      branchCode:
        branches.length > 0
          ? branches.find((b) => b.name === item.branchName)?.code || 'DEFAULT_BRANCH'
          : 'DEFAULT_BRANCH',
      creator: 'admin',
    }));

    setImportTotal(dataProcessed.length);

    // Se procesa en lotes pequeños (Promise.all por lote, lotes en serie) en
    // vez de disparar todas las peticiones a la vez: eso saturaba las
    // conexiones a la base de datos del backend.
    const rows = dataProcessed.map((client, index) => ({ client, index }));
    const batches = chunkArray(rows, IMPORT_CONCURRENCY);

    // Se suprime la redirección global a /login por 401 mientras dura el
    // import: con muchas peticiones seguidas, basta que UNA reciba 401 (token
    // venciendo a mitad del proceso, etc.) para que ese guard navegara fuera
    // de la página y abortara todo el lote sin dejar rastro de qué filas ya
    // se habían creado. Un 401 durante el import se trata como cualquier
    // otro error de fila.
    await withAuthRedirectSuppressed(async () => {
      for (const batch of batches) {
        await Promise.all(
          batch.map(async ({ client, index }) => {
            try {
              const response = await createClient({ ...client, promotorCode: String(client.promotorCode) });
              if (!response.ok) {
                const errorData: ErrorResponse | null = await response.json().catch(() => null);
                console.error(`Error al importar cliente ${client.name}:`, errorData);
                setErrorCreateClient((prev) => [
                  ...prev,
                  {
                    fila: index + 1,
                    name: client.name,
                    error: errorData?.detail || 'Error desconocido',
                    titulo: errorData?.title || 'Error',
                  },
                ]);
              } else {
                setImportSuccessCount((prev) => prev + 1);
              }
            } catch (error) {
              console.error(`Error al importar cliente ${client.name}:`, error);
              setErrorCreateClient((prev) => [
                ...prev,
                {
                  fila: index + 1,
                  name: client.name,
                  error: error instanceof Error ? error.message : 'Error de conexión al importar',
                  titulo: 'Error de red',
                },
              ]);
            } finally {
              setImportProcessed((prev) => prev + 1);
            }
          }),
        );
      }
    });

    setImporting(false);
    router.refresh();
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Desea eliminar este cliente?')) {
      setClientes((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const handleOpenRewards = async (cliente: ClienteResponse) => {
    setSelectedClient(cliente);
    setRewardTab('progress');
    setShowRewardsModal(true);
    setRewardsLoading(true);
    setRewardError(null);
    setIsRewardLedgerClosed(false);
    setLedgerError(null);

    try {
      const [progressData, earnedRewardsData, couponMovementsData, couponBalanceData] = await Promise.all([
        getClientRewardProgress(cliente.code),
        getClientEarnedRewards(cliente.code),
        getClientCouponMovements(cliente.code),
        getClientCouponBalance(cliente.code),
      ]);

      setClientProgress(progressData);
      setClientEarnedRewards(earnedRewardsData);
      setClientCouponMovements(couponMovementsData);
      setClientCouponBalance(couponBalanceData);
    } catch (error) {
      console.error('Error al cargar premios del cliente:', error);
      setRewardError('No se pudieron cargar los datos de premios del cliente');
    } finally {
      setRewardsLoading(false);
    }
  };

  const handleCloseRewards = () => {
    setShowRewardsModal(false);
    setSelectedClient(null);
    setRewardError(null);
    setClientProgress([]);
    setClientEarnedRewards([]);
    setClientCouponMovements([]);
    setClientCouponBalance(null);
    setIsRewardLedgerClosed(false);
    setLedgerError(null);
    setEditingReward(null);
  };

  const handleToggleRewardLedger = async () => {
    if (!selectedClient) return;

    try {
      setLedgerActionLoading(true);
      setLedgerError(null);
      const result = isRewardLedgerClosed
        ? await reopenClientRewardLedger(selectedClient.code)
        : await closeClientRewardLedger(selectedClient.code);
      setIsRewardLedgerClosed(result.isRewardLedgerClosed);
    } catch (error) {
      console.error('Error al cambiar el estado del ledger de recompensas:', error);
      setLedgerError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado del ledger de recompensas',
      );
    } finally {
      setLedgerActionLoading(false);
    }
  };

  const handleDeleteEarnedReward = async (reward: ClientEarnedReward) => {
    if (!confirm(`¿Desea eliminar el premio #${reward.id}?`)) {
      return;
    }

    try {
      await deleteEarnedReward(reward.id);
      setClientEarnedRewards((prev) => prev.filter((item) => item.id !== reward.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el premio ganado');
    }
  };

  const MOVEMENT_TYPE_LABELS: Record<string, string> = {
    MonthlyAccrualCredit: 'Bonificación mensual (crédito)',
    MonthlyAccrualDebit: 'Bonificación mensual (débito)',
  };
  const formatMovementType = (type: string) => MOVEMENT_TYPE_LABELS[type] || type;

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        {mounted && can(PERMISSIONS.CLIENT_CREATE) && (
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => setImportModalOpen(true)}
            disabled={importing}
          >
            {importing ? 'Importando...' : 'Importar Cliente'}
          </MaterialButton>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl elevation-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm">Código</th>
                <th className="px-6 py-4 text-left text-sm">Nombre</th>
                <th className="px-6 py-4 text-left text-sm">Identificación</th>
                <th className="px-6 py-4 text-left text-sm">Tipo</th>
                <th className="px-6 py-4 text-left text-sm">Sucursal</th>
                <th className="px-6 py-4 text-right text-sm">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {importing ? (
                <TableSkeleton columns={6} />
              ) : clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{cliente.code}</span>
                    </td>

                    <td className="px-6 py-4">{cliente.name}</td>

                    <td className="px-6 py-4">{cliente.idNumber}</td>

                    <td className="px-6 py-4">{cliente.clientType}</td>

                    <td className="px-6 py-4">{cliente.branch.name}</td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-amber-100 text-amber-600"
                          onClick={() => handleOpenRewards(cliente)}
                          title="Ver premios"
                        >
                          <Award size={18} />
                        </button>

                        {mounted && can(PERMISSIONS.CLIENT_EDIT) && (
                          <button
                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                            onClick={() => setEditingCliente(cliente)}
                            title="Editar cliente"
                          >
                            <Edit size={18} />
                          </button>
                        )}

                        {mounted && can(PERMISSIONS.CLIENT_DELETE) && (
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                            title="Eliminar cliente"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRewardsModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg elevation-4 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Gift size={22} className="text-primary" />
                    <h3 className="text-foreground">Premios del Cliente</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.name} ({selectedClient.code})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {can(PERMISSIONS.LEDGER_CLOSE) && (
                    <MaterialButton
                      variant="outlined"
                      color={isRewardLedgerClosed ? 'secondary' : 'primary'}
                      startIcon={isRewardLedgerClosed ? <Unlock size={16} /> : <Lock size={16} />}
                      onClick={handleToggleRewardLedger}
                      disabled={ledgerActionLoading}
                    >
                      {ledgerActionLoading
                        ? 'Procesando...'
                        : isRewardLedgerClosed
                          ? 'Reabrir recompensas'
                          : 'Cerrar recompensas'}
                    </MaterialButton>
                  )}

                  <button
                    onClick={handleCloseRewards}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {ledgerError && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ledgerError}
                </div>
              )}

              <div className="bg-surface rounded elevation-2 mb-6">
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setRewardTab('progress')}
                    className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                      rewardTab === 'progress' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Eye size={18} />
                    <span>Progreso</span>
                    {rewardTab === 'progress' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>

                  <button
                    onClick={() => setRewardTab('earned')}
                    className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                      rewardTab === 'earned' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Award size={18} />
                    <span>Premios Ganados</span>
                    {rewardTab === 'earned' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>

                  <button
                    onClick={() => setRewardTab('coupons')}
                    className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                      rewardTab === 'coupons' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Ticket size={18} />
                    <span>Movimientos de Cupon</span>
                    {clientCouponBalance && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Saldo: {clientCouponBalance.totalBalance.toFixed(2)}
                      </span>
                    )}
                    {rewardTab === 'coupons' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                </div>
              </div>

              {rewardsLoading ? (
                <ListSkeleton count={6} itemClassName="h-12" />
              ) : rewardError ? (
                <div className="text-center py-10 text-red-600">{rewardError}</div>
              ) : (
                <>
                  {rewardTab === 'progress' && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-muted border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm">Regla</th>
                            <th className="px-4 py-3 text-left text-sm">Tipo</th>
                            <th className="px-4 py-3 text-right text-sm">Monto</th>
                            <th className="px-4 py-3 text-right text-sm">Meta monto</th>
                            <th className="px-4 py-3 text-right text-sm">Progreso productos</th>
                            <th className="px-4 py-3 text-right text-sm">Meta productos</th>
                            <th className="px-4 py-3 text-right text-sm">Ganados</th>
                            <th className="px-4 py-3 text-right text-sm">Max ganes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {clientProgress.length > 0 ? (
                            clientProgress.map((item) => (
                              <tr key={`${item.incentiveRuleId}-${item.ruleType}`}>
                                <td className="px-4 py-3">{item.incentiveRuleName}</td>
                                <td className="px-4 py-3">{item.ruleType}</td>
                                <td className="px-4 py-3 text-right">{item.amountProgress.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">{item.amountCondition.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">{item.productVolumeProgress}</td>
                                <td className="px-4 py-3 text-right">{item.productVolumeTargetQuantity}</td>
                                <td className="px-4 py-3 text-right">{item.winsCount}</td>
                                <td className="px-4 py-3 text-right">
                                  {item.maxWinsPerClient == null ? 'Ilimitado' : item.maxWinsPerClient}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                No hay progreso para este cliente
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {rewardTab === 'earned' && (
                    <div className="overflow-x-auto">
                      {can(PERMISSIONS.LEDGER_EDIT) && !isRewardLedgerClosed && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          Cierra el ledger del cliente para poder editar sus premios.
                        </p>
                      )}
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-muted border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm">ID</th>
                            <th className="px-4 py-3 text-left text-sm">Regla</th>
                            <th className="px-4 py-3 text-left text-sm">Documento</th>
                            <th className="px-4 py-3 text-left text-sm">Tipo premio</th>
                            <th className="px-4 py-3 text-left text-sm">Estado</th>
                            <th className="px-4 py-3 text-left text-sm">Articulo</th>
                            <th className="px-4 py-3 text-right text-sm">Cantidad</th>
                            {can(PERMISSIONS.LEDGER_EDIT) && (
                              <th className="px-4 py-3 text-right text-sm">Acciones</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {clientEarnedRewards.length > 0 ? (
                            clientEarnedRewards.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3">{item.id}</td>
                                <td className="px-4 py-3">{item.incentiveRuleName}</td>
                                <td className="px-4 py-3">{item.sourceInvoiceDocument}</td>
                                <td className="px-4 py-3">{item.rewardType}</td>
                                <td className="px-4 py-3">{item.status}</td>
                                <td className="px-4 py-3">{item.articleCode || '-'}</td>
                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                {can(PERMISSIONS.LEDGER_EDIT) && (
                                  <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setEditingReward(item)}
                                        disabled={!isRewardLedgerClosed}
                                        title={
                                          isRewardLedgerClosed
                                            ? 'Editar premio'
                                            : 'Cierra el ledger del cliente para editar'
                                        }
                                        className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEarnedReward(item)}
                                        disabled={!isRewardLedgerClosed}
                                        title={
                                          isRewardLedgerClosed
                                            ? 'Eliminar premio'
                                            : 'Cierra el ledger del cliente para eliminar'
                                        }
                                        className="p-2 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={can(PERMISSIONS.LEDGER_EDIT) ? 8 : 7}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No hay premios ganados para este cliente
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {rewardTab === 'coupons' && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-muted border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm">ID</th>
                            <th className="px-4 py-3 text-left text-sm">Tipo movimiento</th>
                            <th className="px-4 py-3 text-left text-sm">Documento</th>
                            <th className="px-4 py-3 text-right text-sm">Monto</th>
                            <th className="px-4 py-3 text-right text-sm">Monto restante</th>
                            <th className="px-4 py-3 text-left text-sm">Aplicado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {clientCouponMovements.length > 0 ? (
                            clientCouponMovements.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3">{item.id}</td>
                                <td className="px-4 py-3">{formatMovementType(item.movementType)}</td>
                                <td className="px-4 py-3">{item.invoiceDocument || '-'}</td>
                                <td className="px-4 py-3 text-right">{item.amount.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                  {item.remainingAmount == null ? '-' : item.remainingAmount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">{new Date(item.appliedAt).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                No hay movimientos de cupon para este cliente
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 flex justify-end">
                <MaterialButton variant="outlined" color="secondary" onClick={handleCloseRewards}>
                  Cerrar
                </MaterialButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingReward && (
        <EditarPremioModal
          reward={editingReward}
          onClose={() => setEditingReward(null)}
          onSaved={(updated) => {
            setClientEarnedRewards((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditingReward(null);
          }}
        />
      )}

      {editingCliente && (
        <EditarClienteModal
          cliente={editingCliente}
          branches={branches}
          onClose={() => setEditingCliente(null)}
          onSaved={(updated) => {
            setClientes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditingCliente(null);
          }}
        />
      )}

      <ImportarClientesModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        loadingImport={importing}
        processed={importProcessed}
        total={importTotal}
        successCount={importSuccessCount}
      />
      <ModaleErrorCreateClient
        open={errorCreateClient.length > 0}
        errors={errorCreateClient}
        onClose={() => setErrorCreateClient([])}
      />
    </>
  );
}
