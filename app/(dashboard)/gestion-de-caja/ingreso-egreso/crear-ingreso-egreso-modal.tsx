'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { AlertTriangle, CheckCircle2, ChevronDown, Plus, Save, Trash2, Wallet, X } from 'lucide-react';
import { getAccountingConcepts } from '@/app/services/company/accounting-concept';
import {
  createCashManagementInflow,
  createCashManagementOutflow,
  getCashManagementInflowById,
  getCashManagementOutflowById,
  getCashManagementRecords,
  updateCashManagementInflow,
  updateCashManagementOutflow,
} from '@/app/services/cash-management';
import { getCreditNotes } from '@/app/services/billing/credit-note';
import {
  CashCurrency,
  CashManagementInflowRecord,
  CashManagementOutflowRecord,
  CashManagementRecord,
  CashMovementDenominationInput,
  UpdateCashEntryPayload,
} from '@/app/type/cash-management';
import { CreditNoteRecord } from '@/app/type/credit-note';
import {
  CASH_CURRENCIES,
  CASH_DENOMINATIONS,
  formatCashAmount,
  formatDenomination,
  roundCents,
  toCashCurrency,
} from '@/app/domain/cash/currency';
import { ListSkeleton } from '@/components/ui/loading-skeleton';
import {
  CurrentDenominationsCard,
  useCurrentDenominations,
} from '../shared/current-denominations';

export type TipoMovimiento = 'Ingreso' | 'Egreso';

interface AccountingConcept {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
}

const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

const selectClass =
  'w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none disabled:opacity-60';

// Fecha/hora local actual para <input type="datetime-local">.
const nowLocalInput = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// ISO del backend → valor local para <input type="datetime-local">.
const isoToLocalInput = (iso: string | null | undefined) => {
  const date = new Date(iso ?? '');
  if (Number.isNaN(date.getTime())) return nowLocalInput();
  date.setSeconds(0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

type MovementRecord = CashManagementInflowRecord | CashManagementOutflowRecord;

export const LINKED_CREDIT_NOTE_MESSAGE = 'Ligado a una nota de crédito: anúlelo y regístrelo de nuevo';

// Fila del desglose: se escribe la denominación y la cantidad (como en la apertura de caja).
type DenominationRow = {
  id: string;
  denomination: string;
  quantity: string;
};

const createDenominationRow = (): DenominationRow => ({
  id: crypto.randomUUID(),
  denomination: '',
  quantity: '',
});

const isVoidedStatus = (status: string | null | undefined) =>
  ['voided', 'anulada', 'anulado'].includes(String(status ?? '').trim().toLowerCase());

interface CrearIngresoEgresoModalProps {
  onClose: () => void;
  /** Se llama tras guardar: el listado y el desglose actual deben refrescarse. */
  onSaved: (record: CashManagementInflowRecord | CashManagementOutflowRecord, tipo: TipoMovimiento) => void;
  canCreateInflow: boolean;
  canCreateOutflow: boolean;
  /**
   * Modo edición: el registro se carga por id y se guarda con PUT (reemplaza
   * todo). No se puede cambiar el tipo, el número, la gestión ni la nota de crédito.
   */
  editing?: { tipo: TipoMovimiento; id: number } | null;
}

export default function CrearIngresoEgresoModal({
  onClose,
  onSaved,
  canCreateInflow,
  canCreateOutflow,
  editing = null,
}: CrearIngresoEgresoModalProps) {
  const isEdit = editing !== null;
  const [conceptos, setConceptos] = useState<AccountingConcept[]>([]);
  const [conceptosLoading, setConceptosLoading] = useState(false);
  const [cashManagementRecords, setCashManagementRecords] = useState<CashManagementRecord[]>([]);
  const [cashManagementLoading, setCashManagementLoading] = useState(false);
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([]);
  const [creditNotesLoading, setCreditNotesLoading] = useState(false);

  const [tipo, setTipo] = useState<TipoMovimiento>(
    editing ? editing.tipo : canCreateInflow ? 'Ingreso' : 'Egreso',
  );
  const [moneda, setMoneda] = useState<CashCurrency>('NIO');
  const [formData, setFormData] = useState({
    conceptoId: '',
    gestionId: '',
    number: '',
    occurredAt: nowLocalInput(),
    descripcion: '',
    creditNoteId: '',
    montoManual: '',
  });
  // Desglose opcional: oculto hasta que se agrega la primera denominación.
  const [rows, setRows] = useState<DenominationRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modo edición: registro original tal como lo devuelve el GET por id.
  const [editRecord, setEditRecord] = useState<MovementRecord | null>(null);
  const [editLoading, setEditLoading] = useState(isEdit);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const editingTipo = editing?.tipo;
  const editingId = editing?.id;

  const loadEditRecord = useCallback(async () => {
    if (!editingTipo || !editingId) return;
    try {
      setEditLoading(true);
      setEditLoadError(null);
      const record: MovementRecord =
        editingTipo === 'Ingreso'
          ? await getCashManagementInflowById(editingId)
          : await getCashManagementOutflowById(editingId);
      const currency = toCashCurrency(record.currency);
      setEditRecord(record);
      setMoneda(currency);
      setFormData({
        conceptoId: record.accountingConceptId ? String(record.accountingConceptId) : '',
        gestionId: String(record.cashManagementId),
        number: record.number,
        occurredAt: isoToLocalInput(record.occurredAt),
        descripcion: record.description ?? '',
        creditNoteId: 'creditNoteId' in record && record.creditNoteId ? String(record.creditNoteId) : '',
        montoManual: roundCents(Number(record.total) || 0).toFixed(2),
      });
      // Se precarga el desglose actual: el PUT reemplaza todo, así que si no
      // se reenvía se perdería.
      setRows(
        (record.denominations ?? []).map((line) => ({
          id: crypto.randomUUID(),
          denomination: String(line.denomination),
          quantity: String(line.quantity),
        })),
      );
    } catch (error) {
      setEditLoadError(error instanceof Error ? error.message : 'No se pudo cargar el registro.');
    } finally {
      setEditLoading(false);
    }
  }, [editingTipo, editingId]);

  useEffect(() => {
    void loadEditRecord();
  }, [loadEditRecord]);

  const loadAccountingConcepts = useCallback(async () => {
    try {
      setConceptosLoading(true);
      const response = await getAccountingConcepts();
      const records = Array.isArray(response) ? response : response?.records;
      setConceptos(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('Error loading accounting concepts:', error);
      setConceptos([]);
    } finally {
      setConceptosLoading(false);
    }
  }, []);

  const loadOpenCashManagementRecords = useCallback(async () => {
    try {
      setCashManagementLoading(true);
      const response = await getCashManagementRecords({
        status: 'OPEN',
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });
      const records = response.records || [];
      setCashManagementRecords(records);
      setFormData((prev) => ({ ...prev, gestionId: prev.gestionId || (records[0] ? String(records[0].id) : '') }));
    } catch (error) {
      console.error('Error loading open cash management records:', error);
      setCashManagementRecords([]);
    } finally {
      setCashManagementLoading(false);
    }
  }, []);

  const loadCreditNotes = useCallback(async () => {
    try {
      setCreditNotesLoading(true);
      const response = await getCreditNotes({ page: 1, perPage: 200 });
      setCreditNotes((response.records || []).filter((note) => !isVoidedStatus(note.header.status)));
    } catch (error) {
      console.error('Error loading credit notes:', error);
      setCreditNotes([]);
    } finally {
      setCreditNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccountingConcepts();
    void loadOpenCashManagementRecords();
  }, [loadAccountingConcepts, loadOpenCashManagementRecords]);

  useEffect(() => {
    if (!isEdit && tipo === 'Egreso' && creditNotes.length === 0 && !creditNotesLoading) void loadCreditNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const gestionId = formData.gestionId ? Number(formData.gestionId) : null;
  const gestionActual = cashManagementRecords.find((g) => g.id === gestionId) ?? null;
  const conceptosActuales = conceptos.filter((c) => c.category?.name === tipo);
  const denominaciones = CASH_DENOMINATIONS[moneda];
  const hasCreditNote = tipo === 'Egreso' && formData.creditNoteId !== '';

  // Desglose actual de la gestión (para el egreso: saldo y billetes disponibles).
  const currentDenominations = useCurrentDenominations(tipo === 'Egreso' ? gestionId : null);
  const currentForCurrency = currentDenominations.data?.currencies.find(
    (item) => toCashCurrency(item.currency) === moneda,
  );
  // Al editar un egreso, lo que él mismo sacó de la caja vuelve a estar
  // disponible (el cambio reemplaza al egreso original).
  const originalOutflow =
    isEdit && tipo === 'Egreso' && editRecord && toCashCurrency(editRecord.currency) === moneda ? editRecord : null;
  const availableByDenomination = useMemo(() => {
    const map = new Map<number, number>();
    (currentForCurrency?.denominations ?? []).forEach((line) => map.set(roundCents(line.denomination), line.quantity));
    (originalOutflow?.denominations ?? []).forEach((line) => {
      const key = roundCents(line.denomination);
      map.set(key, (map.get(key) ?? 0) + line.quantity);
    });
    return map;
  }, [currentForCurrency, originalOutflow]);
  const availableBalance =
    currentForCurrency !== undefined
      ? roundCents(Number(currentForCurrency.expectedTotal || 0) + (Number(originalOutflow?.total) || 0))
      : null;

  // Filas con denominación o cantidad escritas (las totalmente vacías no cuentan).
  const parsedRows = rows.map((row) => {
    const denominationValue = roundCents(Number.parseFloat(row.denomination));
    const quantityValue = Number.parseInt(row.quantity, 10);
    const filled = row.denomination.trim() !== '' || row.quantity.trim() !== '';
    const validDenomination = denominaciones.some((value) => roundCents(value) === denominationValue);
    const validQuantity = Number.isInteger(quantityValue) && quantityValue > 0;
    return { ...row, denominationValue, quantityValue, filled, validDenomination, validQuantity };
  });
  const filledRows = parsedRows.filter((row) => row.filled);
  const denominationRows: CashMovementDenominationInput[] = filledRows
    .filter((row) => row.validDenomination && row.validQuantity)
    .map((row) => ({ currency: moneda, denomination: row.denominationValue, quantity: row.quantityValue }));

  const duplicatedDenominations = Array.from(
    new Set(
      denominationRows
        .map((row) => row.denomination)
        .filter((value, index, list) => list.indexOf(value) !== index),
    ),
  );

  const hasBreakdown = filledRows.length > 0;
  const breakdownTotal = roundCents(
    denominationRows.reduce((sum, row) => sum + row.denomination * row.quantity, 0),
  );
  // El monto siempre se escribe; con desglose, debe ser igual a la suma.
  const amount = roundCents(Number(formData.montoManual) || 0);
  const breakdownDifference = roundCents(amount - breakdownTotal);
  const breakdownMatches = hasBreakdown && breakdownDifference === 0;

  const exceedsBalance = tipo === 'Egreso' && availableBalance !== null && amount > availableBalance;

  // Edición: motivos por los que no se puede guardar.
  const editGestionClosed =
    isEdit &&
    !!editRecord &&
    !cashManagementLoading &&
    !cashManagementRecords.some((g) => g.id === editRecord.cashManagementId);
  const editBlockedReason = !isEdit || !editRecord
    ? null
    : isVoidedStatus(editRecord.status)
      ? `No se puede editar un ${tipo.toLowerCase()} anulado.`
      : 'creditNoteId' in editRecord && editRecord.creditNoteId
        ? LINKED_CREDIT_NOTE_MESSAGE
        : editGestionClosed
          ? `La gestión de caja de este ${tipo.toLowerCase()} está cerrada; ya no se puede editar.`
          : null;
  // Concepto de texto libre (registros sin concepto del catálogo).
  const freeTextConcept =
    isEdit && editRecord && !editRecord.accountingConceptId ? editRecord.concept?.trim() || null : null;
  const breakdownWillBeRemoved = isEdit && (editRecord?.denominations?.length ?? 0) > 0 && !hasBreakdown;
  const exceedsDenominations = tipo === 'Egreso'
    ? denominationRows.filter(
        (row) => row.quantity > (availableByDenomination.get(roundCents(row.denomination)) ?? 0),
      )
    : [];

  const addRow = () => setRows((prev) => [...prev, createDenominationRow()]);
  const updateRow = (rowId: string, patch: Partial<DenominationRow>) =>
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  const removeRow = (rowId: string) => setRows((prev) => prev.filter((row) => row.id !== rowId));

  const handleTipoChange = (nuevoTipo: TipoMovimiento) => {
    setTipo(nuevoTipo);
    setFormData((prev) => ({ ...prev, conceptoId: '', creditNoteId: '' }));
    setErrorMessage(null);
  };

  const handleMonedaChange = (nuevaMoneda: CashCurrency) => {
    setMoneda(nuevaMoneda);
    // Al cambiar de moneda se limpia el desglose: las denominaciones son otras.
    setRows([]);
  };

  const handleCreditNoteChange = (value: string) => {
    setFormData((prev) => ({ ...prev, creditNoteId: value }));
    // Un egreso ligado a nota de crédito debe ser en NIO.
    if (value && moneda !== 'NIO') handleMonedaChange('NIO');
  };

  const handleSave = async () => {
    setErrorMessage(null);

    if (editBlockedReason) return setErrorMessage(editBlockedReason);
    if (!gestionId) return setErrorMessage('Seleccione una gestión de caja abierta.');
    if (!formData.conceptoId && !freeTextConcept) return setErrorMessage('Seleccione un concepto contable.');
    if (!formData.number.trim()) return setErrorMessage('Ingrese el número del registro.');
    if (!formData.occurredAt) return setErrorMessage('Ingrese la fecha y hora.');

    const occurredAt = new Date(formData.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) return setErrorMessage('La fecha y hora no es válida.');
    if (occurredAt.getTime() > Date.now() + 60000) return setErrorMessage('La fecha no puede ser futura.');
    if (gestionActual?.openedAt && occurredAt.getTime() < new Date(gestionActual.openedAt).getTime()) {
      return setErrorMessage('La fecha no puede ser anterior a la apertura de la gestión.');
    }
    if (!(amount > 0)) return setErrorMessage('Ingrese un monto mayor que 0.');

    if (hasBreakdown) {
      const invalidDenomination = filledRows.find((row) => !row.validDenomination);
      if (invalidDenomination) {
        return setErrorMessage(
          `"${invalidDenomination.denomination || 'vacía'}" no es una denominación válida de ${moneda}. Válidas: ${denominaciones
            .map(formatDenomination)
            .join(', ')}.`,
        );
      }
      if (filledRows.some((row) => !row.validQuantity)) {
        return setErrorMessage('Cada denominación debe tener una cantidad entera mayor que 0.');
      }
      if (duplicatedDenominations.length > 0) {
        return setErrorMessage(
          `La denominación ${duplicatedDenominations.map(formatDenomination).join(', ')} está repetida; súmela en una sola fila.`,
        );
      }
      if (!breakdownMatches) {
        return setErrorMessage(
          `El desglose suma ${formatCashAmount(breakdownTotal, moneda)} y no coincide con el monto ${formatCashAmount(amount, moneda)}.`,
        );
      }
    }
    if (hasCreditNote && moneda !== 'NIO') return setErrorMessage('El egreso ligado a una nota de crédito debe ser en NIO.');

    if (editing) {
      if (breakdownWillBeRemoved && !window.confirm('El desglose se eliminará y se guardará solo el monto. ¿Continuar?')) {
        return;
      }
      // PUT reemplaza todo: se envía el formulario completo, con el desglose
      // actual (vacío = se borra el anterior).
      const payload: UpdateCashEntryPayload = {
        occurredAt: occurredAt.toISOString(),
        accountingConceptId: formData.conceptoId ? Number(formData.conceptoId) : null,
        concept: formData.conceptoId ? null : freeTextConcept,
        description: formData.descripcion.trim() || null,
        currency: moneda,
        amount,
        denominations: hasBreakdown ? denominationRows : [],
      };
      try {
        setSaving(true);
        const record =
          editing.tipo === 'Ingreso'
            ? await updateCashManagementInflow(editing.id, payload)
            : await updateCashManagementOutflow(editing.id, payload);
        onSaved(record, editing.tipo);
      } catch (error) {
        // `detail` del backend: saldo insuficiente, gestión cerrada, concepto de otra categoría...
        setErrorMessage(error instanceof Error ? error.message : `No se pudo editar el ${tipo.toLowerCase()}.`);
      } finally {
        setSaving(false);
      }
      return;
    }

    const base = {
      cashManagementId: gestionId,
      number: formData.number.trim(),
      occurredAt: occurredAt.toISOString(),
      currency: moneda,
      amount,
      accountingConceptId: Number(formData.conceptoId),
      concept: null,
      description: formData.descripcion.trim() || null,
      // Sin desglose no se envía `denominations`; nunca se mandan filas en 0.
      ...(hasBreakdown ? { denominations: denominationRows } : {}),
    };

    try {
      setSaving(true);
      if (tipo === 'Ingreso') {
        const record = await createCashManagementInflow(base);
        onSaved(record, 'Ingreso');
      } else {
        const record = await createCashManagementOutflow({
          ...base,
          creditNoteId: formData.creditNoteId ? Number(formData.creditNoteId) : null,
        });
        onSaved(record, 'Egreso');
      }
    } catch (error) {
      // `detail` del backend: saldo insuficiente, desglose que no cuadra, concepto de otra categoría...
      setErrorMessage(error instanceof Error ? error.message : `No se pudo registrar el ${tipo.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const colorTotal = tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={32} className="text-primary" />
            <h2 className="text-foreground">{isEdit ? 'Editar' : 'Registrar'} {tipo}</h2>
          </div>
          <p className="text-muted-foreground">
            {isEdit
              ? `Corrija el ${tipo.toLowerCase()}${editRecord ? ` ${editRecord.number}` : ''}. Se guarda el formulario completo.`
              : `Registre un ${tipo.toLowerCase()} de efectivo en una gestión de caja abierta`}
          </p>
        </div>

        {isEdit && editLoading ? (
          <div className="bg-surface rounded elevation-2 p-6">
            <ListSkeleton count={6} itemClassName="h-12 rounded" />
          </div>
        ) : isEdit && editLoadError ? (
          <div className="bg-surface rounded elevation-2 p-6 space-y-4">
            <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{editLoadError}</div>
            <MaterialButton variant="outlined" color="secondary" startIcon={<X size={18} />} onClick={onClose}>
              Cerrar
            </MaterialButton>
          </div>
        ) : (
        <div className="bg-surface rounded elevation-2 p-6">
          {editBlockedReason && (
            <div className="mb-6 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {editBlockedReason}
            </div>
          )}
          <div className="space-y-6">
            {/* Información general */}
            <div>
              <h3 className="text-foreground mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-foreground mb-2 block">Tipo *</label>
                  {isEdit ? (
                    // Un ingreso no se puede convertir en egreso (ni al revés).
                    <input value={tipo} readOnly disabled className={selectClass} />
                  ) : (
                    <div className="relative">
                      <select
                        value={tipo}
                        onChange={(e) => handleTipoChange(e.target.value as TipoMovimiento)}
                        className={selectClass}
                        disabled={saving}
                      >
                        {canCreateInflow && <option value="Ingreso">Ingreso</option>}
                        {canCreateOutflow && <option value="Egreso">Egreso</option>}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-foreground mb-2 block">Concepto Contable *</label>
                  {conceptosLoading ? (
                    <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.conceptoId}
                        onChange={(e) => setFormData({ ...formData, conceptoId: e.target.value })}
                        className={selectClass}
                        disabled={saving}
                      >
                        <option value="">
                          {freeTextConcept
                            ? `Sin concepto del catálogo ("${freeTextConcept}")`
                            : `Seleccione un concepto de ${tipo.toLowerCase()}`}
                        </option>
                        {conceptosActuales.map((concepto) => (
                          <option key={concepto.id} value={concepto.id}>
                            {concepto.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-foreground mb-2 block">Gestión de Caja Abierta *</label>
                  {cashManagementLoading ? (
                    <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.gestionId}
                        onChange={(e) => setFormData({ ...formData, gestionId: e.target.value })}
                        className={selectClass}
                        disabled={saving || isEdit}
                      >
                        <option value="">Seleccione una caja aperturada</option>
                        {cashManagementRecords.map((gestion) => (
                          <option key={gestion.id} value={gestion.id}>
                            {gestion.cashRegisterCode} - {gestion.cashRegisterName} - {gestion.responsibleEmployeeName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-foreground mb-2 block">Moneda *</label>
                  <div className="relative">
                    <select
                      value={moneda}
                      onChange={(e) => handleMonedaChange(e.target.value as CashCurrency)}
                      className={selectClass}
                      disabled={saving || hasCreditNote}
                    >
                      {CASH_CURRENCIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  {hasCreditNote && (
                    <p className="mt-1 text-xs text-muted-foreground">Con nota de crédito el egreso es en NIO.</p>
                  )}
                </div>

                <MaterialInput
                  label="Número *"
                  fullWidth
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder={tipo === 'Ingreso' ? 'ING-0001' : 'EGR-0001'}
                  disabled={saving || isEdit}
                />

                <MaterialInput
                  label="Fecha y hora *"
                  type="datetime-local"
                  fullWidth
                  value={formData.occurredAt}
                  max={nowLocalInput()}
                  onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                  disabled={saving}
                />

                {tipo === 'Egreso' && !isEdit && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-foreground mb-2 block">Nota de crédito (opcional)</label>
                    {creditNotesLoading ? (
                      <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                    ) : (
                      <div className="relative">
                        <select
                          value={formData.creditNoteId}
                          onChange={(e) => handleCreditNoteChange(e.target.value)}
                          className={selectClass}
                          disabled={saving}
                        >
                          <option value="">Sin nota de crédito</option>
                          {creditNotes.map((note) => (
                            <option key={note.header.id} value={note.header.id}>
                              {note.header.number} · {formatCashAmount(note.header.total, 'NIO')} · {note.header.status}
                              {note.header.cashRegisterCode ? ` · ${note.header.cashRegisterCode}` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      La nota debe pertenecer a la misma gestión de caja.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label className="text-sm text-foreground mb-2 block">Descripción (opcional)</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none resize-none"
                  rows={3}
                  placeholder="Describa brevemente el motivo o contexto"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Monto y desglose opcional */}
            <div>
              <h3 className="text-foreground mb-4">Monto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <MaterialInput
                  label={`Monto en ${moneda} *`}
                  type="number"
                  min={0}
                  step="0.01"
                  fullWidth
                  value={formData.montoManual}
                  onChange={(e) => setFormData({ ...formData, montoManual: e.target.value })}
                  disabled={saving}
                />
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className={`text-2xl font-mono ${colorTotal}`}>
                    {tipo === 'Ingreso' ? '+' : '-'} {formatCashAmount(amount, moneda)}
                  </span>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="mt-4">
                  <MaterialButton
                    variant="outlined"
                    color="primary"
                    startIcon={<Plus size={18} />}
                    onClick={addRow}
                    disabled={saving}
                  >
                    Agregar denominación
                  </MaterialButton>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Opcional: desglose de billetes y monedas en {moneda}.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Denominaciones ({moneda})</p>
                    <button
                      type="button"
                      onClick={addRow}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <Plus className="size-3" />
                      Agregar denominación
                    </button>
                  </div>

                  <datalist id="cash-denominations">
                    {denominaciones.map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>

                  <div className="space-y-2 p-3">
                    {parsedRows.map((row, index) => {
                      const lineTotal =
                        row.validDenomination && row.validQuantity ? row.denominationValue * row.quantityValue : 0;
                      const available = availableByDenomination.get(row.denominationValue) ?? 0;
                      const overAvailable =
                        tipo === 'Egreso' && row.validDenomination && row.validQuantity && row.quantityValue > available;
                      const showDenominationError = row.denomination.trim() !== '' && !row.validDenomination;
                      return (
                        <div
                          key={row.id}
                          className="grid gap-2 rounded-xl border border-border/50 bg-background p-3 md:grid-cols-[1fr_1fr_auto_auto]"
                        >
                          <label className="space-y-1">
                            <span className="text-xs text-muted-foreground">Denominación</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              list="cash-denominations"
                              value={row.denomination}
                              onChange={(e) => updateRow(row.id, { denomination: e.target.value })}
                              disabled={saving}
                              placeholder="Ej. 100"
                              className={`w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary ${
                                showDenominationError ? 'border-rose-400' : 'border-border'
                              }`}
                            />
                            {showDenominationError && (
                              <span className="block text-xs text-rose-600">No es válida en {moneda}</span>
                            )}
                          </label>

                          <label className="space-y-1">
                            <span className="text-xs text-muted-foreground flex justify-between gap-2">
                              <span>Cantidad</span>
                              {tipo === 'Egreso' && currentDenominations.data && row.validDenomination && (
                                <span className={overAvailable ? 'text-amber-700' : ''}>hay {available}</span>
                              )}
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={row.quantity}
                              onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                              disabled={saving}
                              placeholder="Cantidad"
                              className={`w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary ${
                                overAvailable ? 'border-amber-500' : 'border-border'
                              }`}
                            />
                          </label>

                          <div className="flex items-end justify-end pb-2 text-sm font-mono text-foreground md:min-w-[8rem]">
                            = {formatCashAmount(lineTotal, moneda)}
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              disabled={saving}
                              className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                              aria-label={`Eliminar denominación ${index + 1}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasBreakdown && (
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm ${
                        breakdownMatches
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        {breakdownMatches ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        Suma del desglose:
                        <span className="font-mono font-semibold">{formatCashAmount(breakdownTotal, moneda)}</span>
                        {!breakdownMatches && (
                          <>
                            · Diferencia con el monto:
                            <span className="font-mono font-semibold">{formatCashAmount(breakdownDifference, moneda)}</span>
                          </>
                        )}
                      </span>
                      {!breakdownMatches && breakdownTotal > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, montoManual: breakdownTotal.toFixed(2) }))}
                          disabled={saving}
                          className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs hover:bg-amber-100"
                        >
                          Usar la suma como monto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Egreso: desglose actual y avisos de disponibilidad */}
            {tipo === 'Egreso' && gestionId && (
              <div className="space-y-3">
                <CurrentDenominationsCard
                  data={currentDenominations.data}
                  loading={currentDenominations.loading}
                  error={currentDenominations.error}
                  currency={moneda}
                  onReload={currentDenominations.reload}
                  title={`Disponible en caja (${moneda})`}
                />
                {exceedsBalance && (
                  <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    El monto supera el saldo disponible en {moneda} (
                    {formatCashAmount(availableBalance ?? 0, moneda)}
                    {originalOutflow ? ', contando lo que ya sacó este egreso' : ''}). El servidor rechazará el egreso.
                  </div>
                )}
                {!exceedsBalance && exceedsDenominations.length > 0 && (
                  <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    Pide más billetes de los registrados en caja para:{' '}
                    {exceedsDenominations.map((row) => formatDenomination(row.denomination)).join(', ')}.
                  </div>
                )}
              </div>
            )}

            {breakdownWillBeRemoved && (
              <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                El desglose se eliminará y se guardará solo el monto.
              </div>
            )}

            {errorMessage && (
              <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
            )}
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Save size={18} />}
              onClick={handleSave}
              disabled={saving || Boolean(editBlockedReason)}
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : `Registrar ${tipo}`}
            </MaterialButton>
            <MaterialButton
              variant="outlined"
              color="secondary"
              startIcon={<X size={18} />}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </MaterialButton>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
