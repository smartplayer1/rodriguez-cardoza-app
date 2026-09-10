'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, GitMerge, Link2, Unlink } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import {
  getBankTransferImports,
  reconcileBankTransferImports,
  unlinkBankTransferImport,
} from '@/app/services/billing/bank-transfer';
import {
  BankTransferImportRecord,
  BankTransferImportStatus,
  ReconcileBankTransferResponse,
} from '@/app/type/bank-transfer';
import RelacionarManualModal from '../relacionar-manual-modal';

type StatusFilter = BankTransferImportStatus | 'All';

const FETCH_CAP = 1000;
const PAGE_SIZE = 20;

const STATUS_LABEL: Record<BankTransferImportStatus, string> = {
  Pending: 'Pendiente',
  Reconciled: 'Conciliada',
  NoMatch: 'Sin coincidencia',
  Ambiguous: 'Ambigua',
};

const STATUS_BADGE_CLASS: Record<BankTransferImportStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Reconciled: 'bg-green-100 text-green-700',
  NoMatch: 'bg-rose-100 text-rose-700',
  Ambiguous: 'bg-purple-100 text-purple-700',
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

type Props = {
  initialStatus: BankTransferImportStatus;
};

export default function ConciliarClient({ initialStatus }: Props) {
  const router = useRouter();
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [documentFilter, setDocumentFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');

  const [allRecords, setAllRecords] = useState<BankTransferImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [reconciling, setReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [reconcileResult, setReconcileResult] = useState<ReconcileBankTransferResponse | null>(null);

  const [linkingRow, setLinkingRow] = useState<BankTransferImportRecord | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const response = await getBankTransferImports({
        status: status === 'All' ? undefined : status,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        document: documentFilter.trim() || undefined,
        page: 1,
        perPage: FETCH_CAP,
      });
      setAllRecords(response.records || []);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'No se pudieron cargar los registros');
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  }, [status, dateFrom, dateTo, documentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, dateFrom, dateTo, documentFilter, amountFilter, descriptionFilter]);

  // amount/descripción no son filtros soportados por el backend para este
  // listado; se aplican aquí sobre el lote ya traído (hasta FETCH_CAP) para
  // que busquen en todo el conjunto que corresponde a fecha/documento/estado,
  // no solo en la página visible.
  const filteredRecords = useMemo(() => {
    const amountQuery = amountFilter.trim();
    const descriptionQuery = descriptionFilter.trim().toLowerCase();

    return allRecords.filter((record) => {
      if (amountQuery) {
        const amountValue = Number(amountQuery.replace(/,/g, ''));
        if (Number.isFinite(amountValue) && Math.abs(record.amount - amountValue) > 0.01) {
          return false;
        }
      }
      if (descriptionQuery && !record.description.toLowerCase().includes(descriptionQuery)) {
        return false;
      }
      return true;
    });
  }, [allRecords, amountFilter, descriptionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pageRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const canManage = mounted && can(PERMISSIONS.BANK_TRANSFER_CREATE);
  const canView = mounted && can(PERMISSIONS.BANK_TRANSFER_VIEW);

  const handleReconcile = async () => {
    setReconcileError(null);

    const scopedFilters = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      document: documentFilter.trim() || undefined,
    };

    try {
      // El reconcile procesa todo lo que no esté ya "Reconciled" (Pending,
      // NoMatch y Ambiguous son elegibles) dentro del rango de
      // fecha/documento seleccionado. Consultamos cuántos hay antes de
      // confirmar para que el número sea exacto.
      const [pendingCount, noMatchCount, ambiguousCount] = await Promise.all([
        getBankTransferImports({ ...scopedFilters, status: 'Pending', page: 1, perPage: 1 }),
        getBankTransferImports({ ...scopedFilters, status: 'NoMatch', page: 1, perPage: 1 }),
        getBankTransferImports({ ...scopedFilters, status: 'Ambiguous', page: 1, perPage: 1 }),
      ]);

      const totalEligible =
        (pendingCount.paging?.totalRecords ?? 0) +
        (noMatchCount.paging?.totalRecords ?? 0) +
        (ambiguousCount.paging?.totalRecords ?? 0);

      if (totalEligible === 0) {
        alert('No hay transferencias por conciliar para el filtro de fecha/documento seleccionado.');
        return;
      }

      const hasDateOrDocumentFilter = Boolean(dateFrom || dateTo || documentFilter.trim());
      const scopeMessage = hasDateOrDocumentFilter
        ? 'para el período/documento seleccionado'
        : 'en todo el sistema (no hay filtro de fecha ni documento aplicado)';

      const confirmed = confirm(
        `Se encontraron ${totalEligible} transferencia${totalEligible === 1 ? '' : 's'} por conciliar ${scopeMessage}.\n\n¿Desea ejecutar la conciliación?`,
      );
      if (!confirmed) return;

      setReconciling(true);
      const result = await reconcileBankTransferImports(scopedFilters);
      setReconcileResult(result);
      await loadRecords();
    } catch (error) {
      setReconcileError(
        error instanceof Error ? error.message : 'No se pudo ejecutar la conciliación bancaria',
      );
    } finally {
      setReconciling(false);
    }
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDocumentFilter('');
    setAmountFilter('');
    setDescriptionFilter('');
  };

  const handleUnlink = async (record: BankTransferImportRecord) => {
    const confirmed = confirm(
      `¿Desea deshacer la vinculación del documento ${record.document}? Volverá a quedar como pendiente y la transferencia interna quedará libre para relacionarse de nuevo.`,
    );
    if (!confirmed) return;

    try {
      setUnlinkingId(record.id);
      await unlinkBankTransferImport(record.id);
      await loadRecords();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo deshacer la vinculación');
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => router.push('/gestion-de-caja/conciliacion-bancaria')}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al resumen
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <GitMerge size={28} className="text-primary" />
          <h2 className="text-foreground">Conciliación de Transferencias</h2>
        </div>
        <p className="text-muted-foreground">
          Consulte los registros importados del banco, filtre por lo que necesite revisar y ejecute
          la conciliación cuando esté listo.
        </p>
      </div>

      <details className="group bg-surface rounded elevation-2 p-4 mb-6 space-y-4" open>
        <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
          <span>Filtros</span>
          <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-muted-foreground">Estado</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="All">Todos</option>
              <option value="Pending">Pendiente</option>
              <option value="Reconciled">Conciliada</option>
              <option value="NoMatch">Sin coincidencia</option>
              <option value="Ambiguous">Ambigua</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-muted-foreground">Fecha desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-muted-foreground">Fecha hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-muted-foreground">Documento</span>
            <input
              type="text"
              value={documentFilter}
              onChange={(e) => setDocumentFilter(e.target.value)}
              placeholder="Número de documento"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-muted-foreground">Monto</span>
            <input
              type="text"
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              placeholder="Ej: 318.20"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-muted-foreground">Descripción</span>
            <input
              type="text"
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              placeholder="Texto de la descripción"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
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

      {canManage && status !== 'Reconciled' && (
        <div className="bg-surface rounded elevation-2 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-foreground mb-1">Ejecutar conciliación</h3>
              <p className="text-sm text-muted-foreground">
                Compara los registros pendientes, sin coincidencia o ambiguos contra las
                transferencias internas por fecha y monto exactos. Se aplica sobre el rango de fecha
                y documento seleccionados arriba (si no hay filtro, procesa todo el sistema).
              </p>
            </div>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<GitMerge size={18} />}
              onClick={handleReconcile}
              disabled={reconciling}
            >
              {reconciling ? 'Conciliando...' : 'Ejecutar conciliación'}
            </MaterialButton>
          </div>

          {reconcileError && (
            <div className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {reconcileError}
            </div>
          )}

          {reconcileResult && (
            <div className="mt-4 grid grid-cols-4 gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Procesados</p>
                <p className="text-foreground">{reconcileResult.processed}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Conciliados</p>
                <p className="text-green-600">{reconcileResult.matched}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Sin coincidencia</p>
                <p className="text-amber-600">{reconcileResult.noMatch}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ambiguos</p>
                <p className="text-amber-600">{reconcileResult.ambiguous}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {canView && (
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
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Documento</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Transferencia interna encontrada</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <TableSkeleton columns={7} />
                  ) : pageRecords.length > 0 ? (
                    pageRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {formatDate(record.transferDate)}
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground">{record.document}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={record.description}>
                          {record.description}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          {formatAmount(record.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE_CLASS[record.status]}`}
                          >
                            {STATUS_LABEL[record.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {record.status === 'Reconciled' ? (
                            <div>
                              <div className="text-foreground">
                                {record.collectionBankTransferAccountNumber || '-'}
                              </div>
                              <div className="text-xs">
                                {record.collectionBankTransferAmount != null
                                  ? formatAmount(record.collectionBankTransferAmount)
                                  : ''}
                                {record.collectionBankTransferDate
                                  ? ` · ${formatDate(record.collectionBankTransferDate)}`
                                  : ''}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {record.status !== 'Reconciled' && canManage && (
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<Link2 size={16} />}
                              onClick={() => setLinkingRow(record)}
                            >
                              Relacionar manualmente
                            </MaterialButton>
                          )}
                          {record.status === 'Reconciled' && canManage && (
                            <MaterialButton
                              variant="text"
                              color="error"
                              startIcon={<Unlink size={16} />}
                              onClick={() => handleUnlink(record)}
                              disabled={unlinkingId === record.id}
                            >
                              {unlinkingId === record.id ? 'Deshaciendo...' : 'Deshacer vinculación'}
                            </MaterialButton>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay registros para este filtro
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
                Página {currentPage} de {totalPages} — {filteredRecords.length} registros
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
      )}

      <RelacionarManualModal
        isOpen={!!linkingRow}
        bankImportRow={linkingRow}
        onClose={() => setLinkingRow(null)}
        onResolved={() => void loadRecords()}
      />
    </div>
  );
}
