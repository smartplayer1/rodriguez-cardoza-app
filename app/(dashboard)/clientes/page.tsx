'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Gift,
  Plus,
  Ticket,
  Trash2,
  X,
  Users
} from 'lucide-react';

import { MaterialButton } from '../../../components/MaterialButton';
import {
  Client,
  ClientCouponMovement,
  ClientEarnedReward,
  ClientErrorItem,
  ClientRewardProgress,
  ClienteExcel,
  ClienteResponse,
  ErrorResponse,
  Paging,
} from '@/app/type/client';
import { ImportarClientesModal } from '@/components/excel-upload-client';
import { createClient, getclients } from '@/app/services/clients';
import { getBranches } from '@/app/services/company/branch';
import { BranchResponse } from '@/app/type/branch';
import ModaleErrorCreateClient from '@/components/modal-error-create-client';
import {
  getClientCouponMovements,
  getClientEarnedRewards,
  getClientRewardProgress,
} from '@/app/services/reward/client';
import { ListSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';


interface ApiResponse {
  records: ClienteResponse[];
  paging: Paging;
}

export default function ClientesPage () {
  const { can, user } = useUserStore();
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse['records']>([]);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [errorCreateClient, setErrorCreateClient] = useState<ClientErrorItem[]>([]);
  const [paging, setPaging] = useState<Paging>({
    perPage: 10,
    currentPage: 1,
    totalRecords: 0,
    totalPages: 1
  });

  console.log('User permissions:', user?.permissions);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteResponse | null>(null);
  const [rewardTab, setRewardTab] = useState<'progress' | 'earned' | 'coupons'>('progress');
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [clientProgress, setClientProgress] = useState<ClientRewardProgress[]>([]);
  const [clientEarnedRewards, setClientEarnedRewards] = useState<ClientEarnedReward[]>([]);
  const [clientCouponMovements, setClientCouponMovements] = useState<ClientCouponMovement[]>([]);

  useEffect(() => {
    loadClientes(1);
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const branches : BranchResponse = await getBranches();
     setBranches(branches.records);
    }
    catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleImport = async (data: ClienteExcel[]) => {
   
    const dataProcessed: Client[] = data
  .map((item) => ({
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
  }))
    dataProcessed.forEach(async (client, index) => {
      try {
      const response = await createClient({...client, promotorCode: String(client.promotorCode)});
      if (!response.ok) {        
        const errorData : ErrorResponse = await response.json();
        console.error(`Error al importar cliente ${client.name}:`, errorData);
        setErrorCreateClient((prev) => [...prev, 
          { fila: index + 1,
            name: client.name, 
            error: errorData.detail || 'Error desconocido',
            titulo : errorData.title || 'Error' }]);
      }
      } catch (error) {
        console.error(`Error al importar cliente ${client.name}:`, error);
      }
    });
  };

  const loadClientes = async (_page: number) => {
    void _page;
    try {
      setLoading(true);

      // EJEMPLO API
       const response: ApiResponse  = await getclients(); // Reemplaza con tu función real para obtener clientes


      // DEMO
      
      setClientes(response.records);
      setPaging(response.paging);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > paging.totalPages ||
      page === paging.currentPage
    ) {
      return;
    }

    loadClientes(page);
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

    try {
      const [progressData, earnedRewardsData, couponMovementsData] = await Promise.all([
        getClientRewardProgress(cliente.code),
        getClientEarnedRewards(cliente.code),
        getClientCouponMovements(cliente.code),
      ]);

      setClientProgress(progressData);
      setClientEarnedRewards(earnedRewardsData);
      setClientCouponMovements(couponMovementsData);
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
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users size={32} className="text-primary" />

              <h2 className="text-foreground">
                Clientes
              </h2>
            </div>

            <p className="text-muted-foreground">
              Administre los clientes del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <select className="border border-border rounded-lg px-3 py-2" value={selectedBranch} onChange={(e) => setSelectedBranch(parseInt(e.target.value))}>
                <option value={0}>Todas las sucursales</option>
                {
                  branches.length > 0 && branches.map((branch) => (
                    <option key={branch.id} value={branch.code}>{branch.name}</option>
                  ))
                }
              </select>
            </div>
            </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              <select
                className="border border-border rounded-lg px-3 py-2"
                value={paging.perPage}
                onChange={(e) => {
                  const perPage = parseInt(e.target.value);
                  setPaging((prev) => ({ ...prev, perPage }));
                }}
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
          {can(PERMISSIONS.CLIENT_CREATE) && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={() => setImportModalOpen(true)}
            >
              Importar Cliente
            </MaterialButton>
          )}
        </div>

        {/* Table */}
        <div className="bg-surface rounded-xl elevation-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">
                    Código
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Nombre
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Identificación
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Sucursal
                  </th>

                  <th className="px-6 py-4 text-right text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <TableSkeleton columns={6} />
                ) : clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">
                          {cliente.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {cliente.name}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.idNumber}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.clientType}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.branch.name}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="
                              p-2
                              rounded-lg
                              hover:bg-amber-100
                              text-amber-600
                            "
                            onClick={() => handleOpenRewards(cliente)}
                            title="Ver premios"
                          >
                            <Award size={18} />
                          </button>

                          {can(PERMISSIONS.CLIENT_EDIT) && (
                            <button
                              className="
                                p-2
                                rounded-lg
                                hover:bg-blue-100
                                text-blue-600
                              "
                            >
                              <Edit size={18} />
                            </button>
                          )}

                          {can(PERMISSIONS.CLIENT_DELETE) && (
                            <button
                              onClick={() =>
                                handleDelete(cliente.id)
                              }
                              className="
                                p-2
                                rounded-lg
                                hover:bg-red-100
                                text-red-600
                              "
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
                    <td
                      colSpan={6}
                      className="text-center py-10"
                    >
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div
            className="
              flex
              flex-col
              md:flex-row
              items-center
              justify-between
              gap-4
              px-6
              py-4
              border-t
              border-border
            "
          >
            {/* Info */}
            <div className="text-sm text-muted-foreground">
              Mostrando página{' '}
              <span className="font-medium text-foreground">
                {paging.currentPage}
              </span>{' '}
              de{' '}
              <span className="font-medium text-foreground">
                {paging.totalPages}
              </span>{' '}
              — Total registros:{' '}
              <span className="font-medium text-foreground">
                {paging.totalRecords}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {/* Previous */}
              <button
                onClick={() =>
                  goToPage(paging.currentPage - 1)
                }
                disabled={paging.currentPage === 1}
                className="
                  h-10
                  px-4
                  rounded-lg
                  border
                  border-border
                  flex
                  items-center
                  gap-2
                  hover:bg-muted
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                <ChevronLeft size={18} />
                Anterior
              </button>

              {/* Page Numbers */}
              {Array.from(
                { length: paging.totalPages },
                (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`
                        h-10
                        w-10
                        rounded-lg
                        border
                        transition-colors
                        ${
                          paging.currentPage === page
                            ? 'bg-primary text-white border-primary'
                            : 'border-border hover:bg-muted'
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                }
              )}

              {/* Next */}
              <button
                onClick={() =>
                  goToPage(paging.currentPage + 1)
                }
                disabled={
                  paging.currentPage === paging.totalPages
                }
                className="
                  h-10
                  px-4
                  rounded-lg
                  border
                  border-border
                  flex
                  items-center
                  gap-2
                  hover:bg-muted
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            </div>
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

                  <button
                    onClick={handleCloseRewards}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="bg-surface rounded elevation-2 mb-6">
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setRewardTab('progress')}
                      className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                        rewardTab === 'progress'
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
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
                        rewardTab === 'earned'
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
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
                        rewardTab === 'coupons'
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Ticket size={18} />
                      <span>Movimientos de Cupon</span>
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
                              <th className="px-4 py-3 text-left text-sm">Cupon</th>
                              <th className="px-4 py-3 text-right text-sm">Monto cupon</th>
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
                                  <td className="px-4 py-3">{item.couponName || '-'}</td>
                                  <td className="px-4 py-3 text-right">{item.couponAmount.toFixed(2)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={9} className="text-center py-8 text-muted-foreground">
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
                              <th className="px-4 py-3 text-left text-sm">Regla</th>
                              <th className="px-4 py-3 text-left text-sm">Documento</th>
                              <th className="px-4 py-3 text-left text-sm">Cupon</th>
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
                                  <td className="px-4 py-3">{item.movementType}</td>
                                  <td className="px-4 py-3">{item.incentiveRuleName || '-'}</td>
                                  <td className="px-4 py-3">{item.invoiceDocument}</td>
                                  <td className="px-4 py-3">{item.couponName}</td>
                                  <td className="px-4 py-3 text-right">{item.amount.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-right">
                                    {item.remainingAmount == null ? '-' : item.remainingAmount.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {new Date(item.appliedAt).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="text-center py-8 text-muted-foreground">
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
        <ImportarClientesModal isOpen={importModalOpen}  onClose={()=> setImportModalOpen(false)} onImport={handleImport} />
        <ModaleErrorCreateClient open={errorCreateClient.length > 0} errors={errorCreateClient} onClose={() => setErrorCreateClient([])} />
      </div>
    </div>
  );
}