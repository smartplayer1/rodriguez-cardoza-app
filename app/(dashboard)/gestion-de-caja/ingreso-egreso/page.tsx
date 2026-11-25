'use client';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import {
  Ban,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import {
  deleteCashManagementInflow,
  deleteCashManagementOutflow,
  getCashLedger,
  getCashManagementInflowById,
  getCashManagementOutflowById,
  getCashManagementRecords,
  voidCashManagementInflow,
  voidCashManagementOutflow,
} from '@/app/services/cash-management';
import {
  CashLedgerEntry,
  CashManagementInflowRecord,
  CashManagementOutflowRecord,
  CashManagementPaging,
  CashManagementRecord,
} from '@/app/type/cash-management';
import { formatCashAmount, formatDenomination, toCashCurrency } from '@/app/domain/cash/currency';
import { ListSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import CrearIngresoEgresoModal, { LINKED_CREDIT_NOTE_MESSAGE, TipoMovimiento } from './crear-ingreso-egreso-modal';
import CurrentDenominationsPanel from '../shared/current-denominations';

type MovementDetail = CashManagementInflowRecord | (CashManagementOutflowRecord & { creditNoteId?: number | null });

const isVoided = (status: string | null | undefined) =>
  ['voided', 'anulado', 'anulada', 'void'].includes(String(status ?? '').trim().toLowerCase());

const statusLabel = (status: string | null | undefined) => (isVoided(status) ? 'Anulado' : 'Activo');

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' });
};

const COLUMN_COUNT = 11;

const isOutflowEntry = (entry: CashLedgerEntry) => entry.sourceType === 'CashOutflow' || entry.type === 'Egreso';

export default function IngresosEgresos() {
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // can() depende del store de permisos (hidratado desde localStorage):
    // sin este flag hay hydration mismatch entre SSR y el cliente.
    setMounted(true);
  }, []);
  const canCreateInflow = mounted && can(PERMISSIONS.CASH_INFLOW_CREATE);
  const canCreateOutflow = mounted && can(PERMISSIONS.CASH_OUTFLOW_CREATE);
  const canCreate = canCreateInflow || canCreateOutflow;
  const canEditInflow = mounted && can(PERMISSIONS.CASH_INFLOW_EDIT);
  const canEditOutflow = mounted && can(PERMISSIONS.CASH_OUTFLOW_EDIT);
  const canDeleteInflow = mounted && can(PERMISSIONS.CASH_INFLOW_DELETE);
  const canDeleteOutflow = mounted && can(PERMISSIONS.CASH_OUTFLOW_DELETE);
  const canVoidInflow = mounted && can(PERMISSIONS.CASH_INFLOW_VOID);
  const canVoidOutflow = mounted && can(PERMISSIONS.CASH_OUTFLOW_VOID);
  // Fila con un DELETE en curso (evita doble clic).
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<{ tipo: TipoMovimiento; id: number } | null>(null);

  // Filtros (se aplican con "Buscar"; el tipo y la paginación al cambiar).
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'' | 'Ingreso' | 'Egreso'>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [entries, setEntries] = useState<CashLedgerEntry[]>([]);
  const [paging, setPaging] = useState<CashManagementPaging | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState<Record<string, MovementDetail | 'loading' | { error: string }>>({});

  // Gestiones abiertas para el panel "Desglose actual".
  const [openRecords, setOpenRecords] = useState<CashManagementRecord[]>([]);
  const [openRecordsLoading, setOpenRecordsLoading] = useState(false);
  const [denominationsGestionId, setDenominationsGestionId] = useState('');

  const loadLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCashLedger({
        search,
        type: filterTipo,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: currentPage,
        perPage: rowsPerPage,
      });
      setEntries(response.records || []);
      setPaging(response.paging ?? null);
    } catch (err) {
      setEntries([]);
      setPaging(null);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el libro de caja');
    } finally {
      setLoading(false);
    }
  }, [search, filterTipo, dateFrom, dateTo, currentPage, rowsPerPage]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setOpenRecordsLoading(true);
    getCashManagementRecords({ status: 'OPEN', page: 1, perPage: 100 })
      .then((response) => {
        if (cancelled) return;
        const records = response.records || [];
        setOpenRecords(records);
        setDenominationsGestionId((current) => current || (records[0] ? String(records[0].id) : ''));
      })
      .catch(() => {
        if (!cancelled) setOpenRecords([]);
      })
      .finally(() => {
        if (!cancelled) setOpenRecordsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const rowKey = (entry: CashLedgerEntry) => `${entry.sourceType}-${entry.id}`;

  const toggleRow = async (entry: CashLedgerEntry) => {
    const key = rowKey(entry);
    const willExpand = !expanded[key];
    setExpanded((prev) => ({ ...prev, [key]: willExpand }));
    if (!willExpand || details[key]) return;

    setDetails((prev) => ({ ...prev, [key]: 'loading' }));
    try {
      const detail =
        isOutflowEntry(entry)
          ? await getCashManagementOutflowById(entry.id)
          : await getCashManagementInflowById(entry.id);
      setDetails((prev) => ({ ...prev, [key]: detail }));
    } catch (err) {
      setDetails((prev) => ({
        ...prev,
        [key]: { error: err instanceof Error ? err.message : 'No se pudo cargar el detalle' },
      }));
    }
  };

  // Totales por moneda (solo registros activos; nunca se suman monedas distintas).
  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { ingresos: number; egresos: number }>();
    entries
      .filter((entry) => !isVoided(entry.status))
      .forEach((entry) => {
        const currency = toCashCurrency(entry.currency);
        const current = totals.get(currency) ?? { ingresos: 0, egresos: 0 };
        const amount = Math.abs(Number(entry.amount) || 0);
        if (entry.type === 'Egreso' || Number(entry.amount) < 0) current.egresos += amount;
        else current.ingresos += amount;
        totals.set(currency, current);
      });
    return Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const applySearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSaved = () => {
    // Al crear se vuelve a la primera página; al editar se queda donde estaba.
    if (!editing) setCurrentPage(1);
    setShowCreate(false);
    setEditing(null);
    setExpanded({});
    setDetails({});
    // Refresca el listado y el desglose actual.
    setRefreshKey((key) => key + 1);
  };

  // Solo se editan registros activos de una gestión abierta, con permiso del tipo.
  // Ids normalizados a número: si el backend los manda como texto, Set.has fallaría.
  const openGestionIds = new Set(openRecords.map((record) => Number(record.id)));
  const isEntryGestionOpen = (entry: CashLedgerEntry) => {
    const gestionId = Number(entry.cashManagementId);
    if (Number.isFinite(gestionId) && gestionId > 0) return openGestionIds.has(gestionId);
    // El ledger no trajo cashManagementId: se compara por caja con las gestiones
    // abiertas. Al editar, el formulario vuelve a validar con el registro por id.
    return openRecords.some((record) => record.cashRegisterName === entry.cashRegisterName);
  };
  const canEditEntry = (entry: CashLedgerEntry) =>
    !isVoided(entry.status) && isEntryGestionOpen(entry) && (isOutflowEntry(entry) ? canEditOutflow : canEditInflow);

  // Eliminar (borrado lógico): registros activos o anulados de una gestión abierta.
  const canDeleteEntry = (entry: CashLedgerEntry) =>
    isEntryGestionOpen(entry) && (isOutflowEntry(entry) ? canDeleteOutflow : canDeleteInflow);

  // Anular: registros activos de una gestión abierta; quedan en el historial como anulados.
  const canVoidEntry = (entry: CashLedgerEntry) =>
    !isVoided(entry.status) && isEntryGestionOpen(entry) && (isOutflowEntry(entry) ? canVoidOutflow : canVoidInflow);

  // Por qué una fila no tiene acciones (se muestra como tooltip del "—").
  const noActionsReason = (entry: CashLedgerEntry) => {
    const outflow = isOutflowEntry(entry);
    const hasEdit = outflow ? canEditOutflow : canEditInflow;
    const hasDelete = outflow ? canDeleteOutflow : canDeleteInflow;
    const hasVoid = outflow ? canVoidOutflow : canVoidInflow;
    if (!hasEdit && !hasDelete && !hasVoid) {
      return `Sin permiso para editar/anular/eliminar ${outflow ? 'egresos' : 'ingresos'}`;
    }
    if (openRecordsLoading) return 'Cargando gestiones...';
    if (!isEntryGestionOpen(entry)) return 'Gestión de caja cerrada';
    return 'Anulado';
  };

  const handleDelete = async (entry: CashLedgerEntry, number: string) => {
    if (deletingKey) return;
    const outflow = isOutflowEntry(entry);
    const label = outflow ? 'egreso' : 'ingreso';
    const message = isVoided(entry.status)
      ? `¿Eliminar el ${label} anulado ${number}? Dejará de aparecer en el sistema.`
      : `¿Eliminar el ${label} ${number}? Se revertirá su efecto en la caja y dejará de aparecer en el sistema. Esta acción no se puede deshacer.`;
    if (!window.confirm(message)) return;

    const key = rowKey(entry);
    setDeletingKey(key);
    try {
      if (outflow) await deleteCashManagementOutflow(entry.id);
      else await deleteCashManagementInflow(entry.id);
      toast.success('Registro eliminado');
      // Cierra el detalle abierto y recarga el listado y el desglose actual.
      setExpanded({});
      setDetails({});
      setRefreshKey((value) => value + 1);
    } catch (err) {
      // La fila se queda: solo se muestra el `detail` del backend.
      toast.error(err instanceof Error ? err.message : `No se pudo eliminar el ${label}`);
    } finally {
      setDeletingKey(null);
    }
  };

  const handleVoid = async (entry: CashLedgerEntry, number: string) => {
    if (deletingKey) return;
    const outflow = isOutflowEntry(entry);
    const label = outflow ? 'egreso' : 'ingreso';
    if (
      !window.confirm(
        `¿Anular el ${label} ${number}? Se revertirá su efecto en la caja y quedará en el historial como anulado.`,
      )
    )
      return;

    const key = rowKey(entry);
    setDeletingKey(key);
    try {
      if (outflow) await voidCashManagementOutflow(entry.id);
      else await voidCashManagementInflow(entry.id);
      toast.success(`${outflow ? 'Egreso' : 'Ingreso'} anulado`);
      setExpanded({});
      setDetails({});
      setRefreshKey((value) => value + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `No se pudo anular el ${label}`);
    } finally {
      setDeletingKey(null);
    }
  };

  if (showCreate || editing) {
    return (
      <CrearIngresoEgresoModal
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        canCreateInflow={canCreateInflow}
        canCreateOutflow={canCreateOutflow}
        editing={editing}
      />
    );
  }

  const totalPages = Math.max(1, paging?.totalPages ?? 1);
  const totalRecords = paging?.totalRecords ?? entries.length;
  const hasFilters = Boolean(search || filterTipo || dateFrom || dateTo);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={32} className="text-primary" />
              <h2 className="text-foreground">Ingresos y Egresos</h2>
            </div>
            <p className="text-muted-foreground">Libro de caja: ingresos y egresos de efectivo en NIO y USD</p>
          </div>
          {canCreate && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={() => setShowCreate(true)}
            >
              Nuevo Registro
            </MaterialButton>
          )}
        </div>

        {/* Filtros */}
        <details className="group bg-surface rounded elevation-2 p-4 mb-6" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
            <span>Filtros de búsqueda</span>
            <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <form onSubmit={applySearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="relative lg:col-span-2">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por concepto, descripción o caja..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterTipo}
                onChange={(e) => {
                  setFilterTipo(e.target.value as '' | 'Ingreso' | 'Egreso');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="">Todos los tipos</option>
                <option value="Ingreso">Ingresos</option>
                <option value="Egreso">Egresos</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Desde"
              className="w-full px-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
            />
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Hasta"
              className="w-full px-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
            />

            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="flex gap-2 lg:col-span-4 lg:justify-end">
              {hasFilters && (
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setFilterTipo('');
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(1);
                  }}
                >
                  Limpiar
                </MaterialButton>
              )}
              <MaterialButton variant="contained" color="primary" type="submit" startIcon={<Search size={16} />}>
                Buscar
              </MaterialButton>
            </div>
          </form>
        </details>

        {/* Desglose actual de una gestión abierta */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-foreground">Desglose actual de la caja:</span>
            {openRecordsLoading ? (
              <ListSkeleton count={1} itemClassName="h-9 w-64 rounded" />
            ) : openRecords.length === 0 ? (
              <span className="text-sm text-muted-foreground">No hay gestiones de caja abiertas.</span>
            ) : (
              <div className="relative">
                <select
                  value={denominationsGestionId}
                  onChange={(e) => setDenominationsGestionId(e.target.value)}
                  className="pl-3 pr-9 py-2 text-sm bg-input-background border-b-2 border-border focus:border-primary rounded-t outline-none appearance-none"
                >
                  {openRecords.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.cashRegisterCode} - {record.cashRegisterName} - {record.responsibleEmployeeName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>
          {denominationsGestionId && (
            <CurrentDenominationsPanel cashManagementId={Number(denominationsGestionId)} refreshKey={refreshKey} />
          )}
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Libro de caja */}
        <div className="bg-surface rounded elevation-2 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="w-8 px-3 py-4" />
                  <th className="px-4 py-4 text-left text-sm text-foreground">Fecha</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Tipo</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Concepto</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Caja</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Descripción</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Moneda</th>
                  <th className="px-4 py-4 text-right text-sm text-foreground">Monto</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Estado</th>
                  <th className="px-4 py-4 text-left text-sm text-foreground">Usuario</th>
                  <th className="px-4 py-4 text-right text-sm text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <TableSkeleton columns={COLUMN_COUNT} />
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} className="py-16 text-center">
                      <Wallet size={48} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground">No hay ingresos ni egresos</p>
                      <p className="text-sm text-muted-foreground">
                        {hasFilters ? 'No se encontraron registros con los filtros aplicados' : 'Registre un ingreso o egreso para empezar'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const key = rowKey(entry);
                    const isOpen = !!expanded[key];
                    const isIngreso = entry.type !== 'Egreso' && Number(entry.amount) >= 0;
                    const voided = isVoided(entry.status);
                    const currency = toCashCurrency(entry.currency);
                    const detail = details[key];
                    // El ledger no trae creditNoteId: solo se sabe si ya se abrió el
                    // detalle. Si no, el formulario de edición lo detecta y bloquea.
                    const linkedToCreditNote =
                      !!detail &&
                      detail !== 'loading' &&
                      !('error' in detail) &&
                      'creditNoteId' in detail &&
                      !!detail.creditNoteId;
                    const showEdit = canEditEntry(entry);
                    const showDelete = canDeleteEntry(entry);
                    const showVoid = canVoidEntry(entry);
                    const isDeleting = deletingKey === key;
                    const entryNumber =
                      (detail && detail !== 'loading' && !('error' in detail) ? detail.number : '') ||
                      entry.number ||
                      `#${entry.id}`;
                    return (
                      <Fragment key={key}>
                        <tr
                          className={`cursor-pointer transition-colors hover:bg-muted/30 ${voided ? 'text-muted-foreground' : ''}`}
                          onClick={() => void toggleRow(entry)}
                        >
                          <td className="px-3 py-3 text-muted-foreground">
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDateTime(entry.occurredAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isIngreso ? (
                                <TrendingUp size={16} className="text-green-600" />
                              ) : (
                                <TrendingDown size={16} className="text-red-600" />
                              )}
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  isIngreso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isIngreso ? 'Ingreso' : 'Egreso'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{entry.concept || '—'}</td>
                          <td className="px-4 py-3 text-sm">
                            {entry.cashRegisterName}
                            {entry.branchName ? <span className="block text-xs text-muted-foreground">{entry.branchName}</span> : null}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{entry.description || '—'}</td>
                          <td className="px-4 py-3 text-sm">{currency}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span
                              className={`text-sm font-mono ${voided ? 'line-through' : isIngreso ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {isIngreso ? '+' : '-'} {formatCashAmount(Math.abs(Number(entry.amount) || 0), currency)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs ${
                                voided ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {statusLabel(entry.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{entry.createdBy || '—'}</td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-2">
                              {showEdit && (
                                <button
                                  type="button"
                                  disabled={linkedToCreditNote}
                                  title={linkedToCreditNote ? LINKED_CREDIT_NOTE_MESSAGE : 'Editar'}
                                  onClick={() =>
                                    setEditing({ tipo: isOutflowEntry(entry) ? 'Egreso' : 'Ingreso', id: entry.id })
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Pencil size={14} />
                                  Editar
                                </button>
                              )}
                              {showVoid && (
                                <button
                                  type="button"
                                  disabled={isDeleting || !!deletingKey}
                                  title="Anular: revierte su efecto en la caja y queda en el historial como anulado."
                                  onClick={() => void handleVoid(entry, entryNumber)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Ban size={14} />
                                  Anular
                                </button>
                              )}
                              {showDelete && (
                                <button
                                  type="button"
                                  disabled={isDeleting || !!deletingKey}
                                  title="Eliminar: el registro desaparece de todas las vistas (para registros hechos por error). Para dejarlo en el historial, use Anular."
                                  onClick={() => void handleDelete(entry, entryNumber)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  {isDeleting ? 'Eliminando…' : 'Eliminar'}
                                </button>
                              )}
                              {!showEdit && !showDelete && !showVoid && (
                                <span className="max-w-[12rem] text-left text-xs text-muted-foreground">
                                  {noActionsReason(entry)}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-muted/20">
                            <td />
                            <td colSpan={COLUMN_COUNT - 1} className="px-4 py-3">
                              {detail === 'loading' || detail === undefined ? (
                                <ListSkeleton count={2} itemClassName="h-5 rounded" />
                              ) : 'error' in detail ? (
                                <p className="text-sm text-rose-700">{detail.error}</p>
                              ) : (
                                <MovementDetailView detail={detail} />
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalsByCurrency.length > 0 && (
            <div className="border-t border-border bg-muted/30 px-4 py-3">
              <p className="mb-2 text-xs text-muted-foreground">Totales de esta página por moneda (solo registros activos)</p>
              <div className="flex flex-wrap gap-6 text-sm">
                {totalsByCurrency.map(([currency, totals]) => (
                  <div key={currency} className="space-y-0.5">
                    <p className="font-semibold text-foreground">{currency}</p>
                    <p className="text-green-700">Ingresos: {formatCashAmount(totals.ingresos, currency)}</p>
                    <p className="text-red-700">Egresos: {formatCashAmount(totals.egresos, currency)}</p>
                    <p className="font-medium text-foreground">
                      Neto: {formatCashAmount(totals.ingresos - totals.egresos, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!loading && entries.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Total registros: {totalRecords}</div>
            <div className="flex gap-2">
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </MaterialButton>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-foreground">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </MaterialButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MovementDetailView({ detail }: { detail: MovementDetail }) {
  const currency = toCashCurrency(detail.currency);
  const denominations = [...(detail.denominations ?? [])].sort((a, b) => b.denomination - a.denomination);
  const creditNoteId = 'creditNoteId' in detail ? detail.creditNoteId : null;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Número</dt>
        <dd className="font-mono">{detail.number}</dd>
        <dt className="text-muted-foreground">Concepto contable</dt>
        <dd>{detail.accountingConceptName || detail.concept || '—'}</dd>
        <dt className="text-muted-foreground">Monto</dt>
        <dd className="font-mono">{formatCashAmount(detail.total, currency)}</dd>
        {creditNoteId ? (
          <>
            <dt className="text-muted-foreground">Nota de crédito</dt>
            <dd className="font-mono">#{creditNoteId}</dd>
          </>
        ) : null}
        {detail.voidedAt ? (
          <>
            <dt className="text-muted-foreground">Anulado</dt>
            <dd>
              {formatDateTime(detail.voidedAt)}
              {detail.voidedBy ? ` · ${detail.voidedBy}` : ''}
            </dd>
          </>
        ) : null}
      </dl>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Desglose</p>
        {denominations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Registrado sin desglose de billetes.</p>
        ) : (
          <table className="w-full max-w-sm text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-1 text-left font-medium">Denominación</th>
                <th className="py-1 text-right font-medium">Cantidad</th>
                <th className="py-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {denominations.map((line) => (
                <tr key={`${line.currency}-${line.denomination}`} className="border-b border-border/30">
                  <td className="py-1 font-mono">{formatDenomination(line.denomination)}</td>
                  <td className="py-1 text-right tabular-nums">{line.quantity}</td>
                  <td className="py-1 text-right font-mono">
                    {formatCashAmount(line.total ?? line.denomination * line.quantity, line.currency || currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
