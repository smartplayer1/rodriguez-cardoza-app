'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, ChevronDown, Edit, RefreshCw, Trash2 } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import { recalculateRewards } from '@/app/services/reward/recalculate';
import { deleteEarnedReward, getEarnedRewards } from '@/app/services/reward/earned-reward';
import { getRewardIncentiveRules } from '@/app/services/reward/incentive';
import { EarnedRewardListFilters, EarnedRewardRecord, RecalculateRewardsResult } from '@/app/type/reward';
import { EarnedRewardStatus } from '@/app/type/client';
import EditarPremioModal from '@/app/(dashboard)/clientes/editar-premio-modal';

const DEFAULT_PER_PAGE = 10;

type IncentiveRuleOption = {
  id: number;
  name: string;
};

const STATUS_LABEL: Record<EarnedRewardStatus, string> = {
  Pending: 'Pendiente',
  Credited: 'Acreditado',
};

const toMonthStart = (monthValue: string) => {
  if (!monthValue) return undefined;
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return undefined;
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

export default function PremiosGanadosPage() {
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const canView = mounted && can(PERMISSIONS.LEDGER_VIEW);
  const canEdit = mounted && can(PERMISSIONS.LEDGER_EDIT);
  const canRecalculate = mounted && can(PERMISSIONS.LEDGER_RECALCULATE);

  const [recalculateMonth, setRecalculateMonth] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState<RecalculateRewardsResult | null>(null);
  const [recalculateError, setRecalculateError] = useState<string | null>(null);

  const [incentiveRules, setIncentiveRules] = useState<IncentiveRuleOption[]>([]);

  const [clientCodeFilter, setClientCodeFilter] = useState('');
  const [incentiveRuleIdFilter, setIncentiveRuleIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | EarnedRewardStatus>('');
  const [rewardTypeFilter, setRewardTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const [records, setRecords] = useState<EarnedRewardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [editingReward, setEditingReward] = useState<EarnedRewardRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadIncentiveRules = async () => {
      try {
        const response = await getRewardIncentiveRules();
        setIncentiveRules((response.records || []).map((rule) => ({ id: rule.id, name: rule.name })));
      } catch (error) {
        console.error('Error loading incentive rules:', error);
        setIncentiveRules([]);
      }
    };

    void loadIncentiveRules();
  }, []);

  const filters = useMemo<EarnedRewardListFilters>(
    () => ({
      clientCode: clientCodeFilter.trim() || undefined,
      incentiveRuleId: incentiveRuleIdFilter ? Number(incentiveRuleIdFilter) : undefined,
      status: statusFilter || undefined,
      rewardType: rewardTypeFilter.trim() || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      page: currentPage,
      perPage: DEFAULT_PER_PAGE,
    }),
    [clientCodeFilter, incentiveRuleIdFilter, statusFilter, rewardTypeFilter, dateFromFilter, dateToFilter, currentPage],
  );

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const response = await getEarnedRewards(filters);
      setRecords(response.records || []);
      setTotalPages(Math.max(1, response.paging?.totalPages || 1));
      setTotalRecords(response.paging?.totalRecords || 0);
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : 'No se pudieron cargar los premios ganados',
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  const handleClearFilters = () => {
    setClientCodeFilter('');
    setIncentiveRuleIdFilter('');
    setStatusFilter('');
    setRewardTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  const handleRecalculate = async () => {
    const month = toMonthStart(recalculateMonth);

    if (!month) {
      alert('Seleccione el mes a recalcular');
      return;
    }

    if (
      !confirm(
        'Esto reconstruye el historial COMPLETO de premios de todos los clientes/promotores que facturaron ese mes (no solo ese mes). ¿Desea continuar?',
      )
    ) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalculateError(null);
      setRecalculateResult(null);
      const result = await recalculateRewards({ month });
      setRecalculateResult(result);
      await loadRecords();
    } catch (error) {
      setRecalculateError(
        error instanceof Error ? error.message : 'No se pudieron recalcular los premios',
      );
    } finally {
      setRecalculating(false);
    }
  };

  const handleDelete = async (reward: EarnedRewardRecord) => {
    if (!confirm(`¿Desea eliminar el premio #${reward.id}?`)) {
      return;
    }

    try {
      setDeletingId(reward.id);
      await deleteEarnedReward(reward.id);
      setRecords((prev) => prev.filter((item) => item.id !== reward.id));
      setTotalRecords((prev) => Math.max(0, prev - 1));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el premio ganado');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Award size={28} className="text-primary" />
          <h2 className="text-foreground">Incentivos: Recalcular y Premios Ganados</h2>
        </div>
        <p className="text-muted-foreground">
          Reconstruya el historial de premios generados por reglas de incentivo y administre los
          premios ya ganados.
        </p>
      </div>

      {canRecalculate && (
        <div className="bg-surface rounded elevation-2 p-6 mb-6">
          <h3 className="text-foreground mb-1">Recalcular</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Acción administrativa (ej. después de corregir una regla). Recalcula el historial
            COMPLETO de premios de cada cliente/promotor con al menos una factura en el mes
            seleccionado — no solo ese mes, ya que el motor de metas es acumulativo.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <MaterialInput
              label="Mes a recalcular"
              type="month"
              value={recalculateMonth}
              onChange={(e) => setRecalculateMonth(e.target.value)}
              disabled={recalculating}
            />

            <MaterialButton
              variant="contained"
              color="secondary"
              startIcon={<RefreshCw size={18} />}
              onClick={handleRecalculate}
              disabled={recalculating}
            >
              {recalculating ? 'Recalculando...' : 'Recalcular'}
            </MaterialButton>
          </div>

          {recalculateError && (
            <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {recalculateError}
            </div>
          )}

          {recalculateResult && (
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Periodo: {formatDate(recalculateResult.period)}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Clientes procesados</span>
                  <p className="text-2xl text-foreground font-mono">
                    {recalculateResult.clientsProcessed}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Clientes fallidos</span>
                  <p className="text-2xl text-primary font-mono">
                    {recalculateResult.clientsFailed}
                  </p>
                </div>
              </div>
              {recalculateResult.failedClientCodes.length > 0 && (
                <p className="mt-3 text-xs text-red-700">
                  Códigos con error: {recalculateResult.failedClientCodes.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {canView && (
        <>
          <details className="group bg-surface rounded elevation-2 p-4 mb-6 space-y-4" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
              <span>Filtros</span>
              <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Cliente</span>
                <input
                  type="text"
                  value={clientCodeFilter}
                  onChange={(e) => {
                    setClientCodeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Código de cliente"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Regla de incentivo</span>
                <select
                  value={incentiveRuleIdFilter}
                  onChange={(e) => {
                    setIncentiveRuleIdFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Todas</option>
                  {incentiveRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Estado</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as '' | EarnedRewardStatus);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="Pending">Pendiente</option>
                  <option value="Credited">Acreditado</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">Tipo de premio</span>
                <input
                  type="text"
                  value={rewardTypeFilter}
                  onChange={(e) => {
                    setRewardTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Ej: Product"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-sm text-muted-foreground">Desde</span>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => {
                      setDateFromFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm text-muted-foreground">Hasta</span>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => {
                      setDateToFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </details>

          <div className="bg-surface rounded elevation-2 p-6">
            {listError ? (
              <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {listError}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Regla</th>
                      <th className="px-4 py-3 text-left">Factura origen</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Artículo</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <TableSkeleton columns={8} />
                    ) : records.length > 0 ? (
                      records.map((reward) => (
                        <tr key={reward.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="text-foreground">{reward.clientName}</div>
                            <div className="text-xs text-muted-foreground">{reward.clientCode}</div>
                          </td>
                          <td className="px-4 py-3 text-foreground">{reward.incentiveRuleName}</td>
                          <td className="px-4 py-3">
                            <div className="text-foreground">{reward.sourceInvoiceDocument}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(reward.sourceInvoiceIssuedAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{reward.rewardType}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                reward.status === 'Credited'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {STATUS_LABEL[reward.status as EarnedRewardStatus] || reward.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {reward.article?.articleName || reward.articleCode || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-foreground">
                            {reward.quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canEdit && (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingReward(reward)}
                                  title="Editar premio"
                                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(reward)}
                                  disabled={deletingId === reward.id}
                                  title="Eliminar premio"
                                  className="p-2 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay premios ganados para este filtro
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-foreground">
                  Página {currentPage} de {totalPages} — {totalRecords} registros
                </span>
                <div className="flex gap-2">
                  <MaterialButton
                    variant="outlined"
                    color="secondary"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </MaterialButton>
                  <MaterialButton
                    variant="outlined"
                    color="secondary"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </MaterialButton>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {editingReward && (
        <EditarPremioModal
          reward={editingReward}
          onClose={() => setEditingReward(null)}
          onSaved={(updated) => {
            setRecords((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
            );
            setEditingReward(null);
          }}
        />
      )}
    </div>
  );
}
