'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { ChevronDown, Plus, Save, Wallet, X } from 'lucide-react';
import { getAccountingConcepts } from '@/app/services/company/accounting-concept';
import { getCashManagementRecords } from '@/app/services/cash-management';
import { getBankAccounts } from '@/app/services/company/account';
import { CashManagementRecord } from '@/app/type/cash-management';
import { BankAccount } from '@/app/type/bank';
import { ListSkeleton } from '@/components/ui/loading-skeleton';

export interface BilleteDetalle {
  denominacion: number;
  cantidad: number;
  total: number;
}

export interface TransferenciaBancaria {
  id: string;
  numeroReferencia: string;
  cuentaBancariaId: string;
  cuentaBancariaNombre: string;
  fecha: string;
  monto: number;
}

export interface IngresoEgreso {
  id: string;
  tipo: 'Ingreso' | 'Egreso';
  conceptoId: string;
  conceptoNombre: string;
  cajaId: string;
  cajaNombre: string;
  gestionId: string;
  fecha: string;
  descripcion: string;
  billetes: BilleteDetalle[];
  transferencias: TransferenciaBancaria[];
  montoEfectivo: number;
  montoTransferencias: number;
  montoTotal: number;
  moneda: string;
  usuarioRegistro: string;
  createdAt: string;
}

interface AccountingConcept {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
}

// Mock data - Denominaciones disponibles
const denominacionesNIO = [500, 200, 100, 50, 20, 10, 5, 1];
const denominacionesUSD = [100, 50, 20, 10, 5, 1];

const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

interface CrearIngresoEgresoModalProps {
  onClose: () => void;
  onSave: (registro: IngresoEgreso) => void;
}

export default function CrearIngresoEgresoModal({
  onClose,
  onSave,
}: CrearIngresoEgresoModalProps) {
  // Conceptos contables, gestiones de caja activas y cuentas bancarias reales
  const [conceptos, setConceptos] = useState<AccountingConcept[]>([]);
  const [conceptosLoading, setConceptosLoading] = useState(false);
  const [cashManagementRecords, setCashManagementRecords] = useState<CashManagementRecord[]>([]);
  const [cashManagementLoading, setCashManagementLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [moneda, setMoneda] = useState<'NIO' | 'USD'>('NIO');

  const [formData, setFormData] = useState({
    tipo: 'Ingreso' as 'Ingreso' | 'Egreso',
    conceptoId: '',
    gestionId: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    usuarioRegistro: 'Admin'
  });

  const [billetes, setBilletes] = useState<BilleteDetalle[]>([]);
  const [transferencias, setTransferencias] = useState<TransferenciaBancaria[]>([]);

  // Form state for adding new transfer
  const [showTransferenciaForm, setShowTransferenciaForm] = useState(false);
  const [transferenciaForm, setTransferenciaForm] = useState({
    numeroReferencia: '',
    cuentaBancariaId: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: 0
  });

  const loadAccountingConcepts = useCallback(async () => {
    try {
      setConceptosLoading(true);
      const response = await getAccountingConcepts();
      setConceptos(response?.records || []);
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
      setCashManagementRecords(response.records || []);
    } catch (error) {
      console.error('Error loading open cash management records:', error);
      setCashManagementRecords([]);
    } finally {
      setCashManagementLoading(false);
    }
  }, []);

  const loadBankAccounts = useCallback(async () => {
    try {
      setBankAccountsLoading(true);
      const response = await getBankAccounts();
      setBankAccounts(response?.records || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      setBankAccounts([]);
    } finally {
      setBankAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccountingConcepts();
    loadOpenCashManagementRecords();
    loadBankAccounts();
  }, [loadAccountingConcepts, loadOpenCashManagementRecords, loadBankAccounts]);

  const gestionActual = cashManagementRecords.find(g => String(g.id) === formData.gestionId);
  const denominacionesActuales = moneda === 'USD' ? denominacionesUSD : denominacionesNIO;
  const conceptosActuales = conceptos.filter(c => c.category?.name === formData.tipo);

  const handleSave = () => {
    // Validation
    if (!formData.gestionId) {
      alert('Por favor seleccione una gestión de caja activa');
      return;
    }

    if (!formData.conceptoId) {
      alert('Por favor seleccione un concepto contable');
      return;
    }

    if (!formData.descripcion.trim()) {
      alert('Por favor ingrese una descripción');
      return;
    }

    if (billetes.length === 0 && transferencias.length === 0) {
      alert('Debe ingresar al menos una denominación de billetes o una transferencia bancaria');
      return;
    }

    const concepto = conceptosActuales.find(c => String(c.id) === formData.conceptoId);
    const montoTotal = billetes.reduce((sum, b) => sum + b.total, 0) + transferencias.reduce((sum, t) => sum + t.monto, 0);

    const nuevoRegistro: IngresoEgreso = {
      id: Date.now().toString(),
      tipo: formData.tipo,
      conceptoId: formData.conceptoId,
      conceptoNombre: concepto?.name || '',
      cajaId: gestionActual ? String(gestionActual.cashRegisterId) : '',
      cajaNombre: gestionActual ? `${gestionActual.cashRegisterCode} - ${gestionActual.cashRegisterName}` : '',
      gestionId: formData.gestionId,
      fecha: formData.fecha,
      descripcion: formData.descripcion,
      billetes: [...billetes],
      transferencias: [...transferencias],
      montoEfectivo: billetes.reduce((sum, b) => sum + b.total, 0),
      montoTransferencias: transferencias.reduce((sum, t) => sum + t.monto, 0),
      montoTotal,
      moneda,
      usuarioRegistro: formData.usuarioRegistro,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onSave(nuevoRegistro);
  };

  const handleTipoChange = (tipo: 'Ingreso' | 'Egreso') => {
    setFormData({
      ...formData,
      tipo,
      conceptoId: ''
    });
  };

  const updateBilleteCount = (denominacion: number, cantidad: number) => {
    if (cantidad < 0) return;

    const existingIndex = billetes.findIndex(b => b.denominacion === denominacion);

    if (cantidad === 0) {
      // Remove if cantidad is 0
      setBilletes(billetes.filter(b => b.denominacion !== denominacion));
    } else {
      const newBillete: BilleteDetalle = {
        denominacion,
        cantidad,
        total: denominacion * cantidad
      };

      if (existingIndex >= 0) {
        const updatedBilletes = [...billetes];
        updatedBilletes[existingIndex] = newBillete;
        setBilletes(updatedBilletes);
      } else {
        setBilletes([...billetes, newBillete].sort((a, b) => b.denominacion - a.denominacion));
      }
    }
  };

  const getBilleteCantidad = (denominacion: number): number => {
    return billetes.find(b => b.denominacion === denominacion)?.cantidad || 0;
  };

  const calcularTotal = (): number => {
    return billetes.reduce((sum, b) => sum + b.total, 0) + transferencias.reduce((sum, t) => sum + t.monto, 0);
  };

  const total = calcularTotal();

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={32} className="text-primary" />
            <h2 className="text-foreground">Registrar {formData.tipo}</h2>
          </div>
          <p className="text-muted-foreground">
            Registre un {formData.tipo.toLowerCase()} en la gestión de caja activa
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded elevation-2 p-6">
          <div className="space-y-6">
            {/* Información General */}
            <div>
              <h3 className="text-foreground mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo Selection */}
                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Tipo *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleTipoChange(e.target.value as 'Ingreso' | 'Egreso')}
                      className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                               focus:border-primary rounded-t transition-colors outline-none appearance-none"
                      required
                    >
                      <option value="Ingreso">Ingreso</option>
                      <option value="Egreso">Egreso</option>
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Concepto Contable Selection */}
                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Concepto Contable *
                  </label>
                  {conceptosLoading ? (
                    <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.conceptoId}
                        onChange={(e) => setFormData({ ...formData, conceptoId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        <option value="">Seleccione un concepto</option>
                        {conceptosActuales.map(concepto => (
                          <option key={concepto.id} value={concepto.id}>
                            {concepto.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Gestión de Caja Selection */}
                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Gestión de Caja Activa *
                  </label>
                  {cashManagementLoading ? (
                    <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.gestionId}
                        onChange={(e) => setFormData({ ...formData, gestionId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        <option value="">Seleccione una caja aperturada</option>
                        {cashManagementRecords.map(gestion => (
                          <option key={gestion.id} value={gestion.id}>
                            {gestion.cashRegisterCode} - {gestion.cashRegisterName} - {gestion.responsibleEmployeeName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Moneda Selection */}
                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Moneda *
                  </label>
                  <div className="relative">
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value as 'NIO' | 'USD')}
                      className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                               focus:border-primary rounded-t transition-colors outline-none appearance-none"
                      required
                    >
                      <option value="NIO">NIO (Córdoba)</option>
                      <option value="USD">USD (Dólar)</option>
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <MaterialInput
                  label="Fecha *"
                  type="date"
                  fullWidth
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  disabled
                />
              </div>

              <div className="mt-6">
                <label className="text-sm text-foreground mb-2 block">
                  Descripción *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border
                           focus:border-primary rounded-t transition-colors outline-none resize-none"
                  rows={3}
                  placeholder="Describa brevemente el motivo o contexto del ingreso/egreso"
                  required
                />
              </div>
            </div>

            {/* Desglose de Billetes */}
            <div>
              <h3 className="text-foreground mb-4">
                Desglose de Billetes - {moneda}
              </h3>
              <div className="bg-muted/30 rounded p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {denominacionesActuales.map(denominacion => (
                    <div key={denominacion} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {denominacion}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={getBilleteCantidad(denominacion)}
                          onChange={(e) => updateBilleteCount(denominacion, Number(e.target.value))}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                        />
                      </div>
                      <div className="text-sm text-foreground font-mono pt-5">
                        = {(denominacion * getBilleteCantidad(denominacion)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Total:</span>
                    <span className={`text-2xl font-mono ${
                      formData.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.tipo === 'Ingreso' ? '+' : '-'} {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transferencias Bancarias */}
            <div>
              <h3 className="text-foreground mb-4">
                Transferencias Bancarias - {moneda}
              </h3>
              <div className="bg-muted/30 rounded p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transferencias.map((transferencia, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Número de Referencia
                        </label>
                        <input
                          type="text"
                          value={transferencia.numeroReferencia}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Cuenta Bancaria
                        </label>
                        <input
                          type="text"
                          value={transferencia.cuentaBancariaNombre}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={transferencia.fecha}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Monto
                        </label>
                        <input
                          type="number"
                          value={transferencia.monto}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          readOnly
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Transferencia Form */}
                {showTransferenciaForm && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-sm text-foreground mb-2 block">
                          Número de Referencia *
                        </label>
                        <input
                          type="text"
                          value={transferenciaForm.numeroReferencia}
                          onChange={(e) => setTransferenciaForm({ ...transferenciaForm, numeroReferencia: e.target.value })}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="text-sm text-foreground mb-2 block">
                          Cuenta Bancaria *
                        </label>
                        {bankAccountsLoading ? (
                          <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                        ) : (
                          <>
                            <select
                              value={transferenciaForm.cuentaBancariaId}
                              onChange={(e) => setTransferenciaForm({ ...transferenciaForm, cuentaBancariaId: e.target.value })}
                              className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                                       focus:border-primary rounded-t transition-colors outline-none appearance-none"
                              required
                            >
                              <option value="">Seleccione una cuenta bancaria</option>
                              {bankAccounts.map(cuenta => (
                                <option key={cuenta.id} value={cuenta.id}>
                                  {cuenta.accountNumber} - {cuenta.bank.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </>
                        )}
                      </div>
                      <div className="relative">
                        <label className="text-sm text-foreground mb-2 block">
                          Fecha *
                        </label>
                        <input
                          type="date"
                          value={transferenciaForm.fecha}
                          onChange={(e) => setTransferenciaForm({ ...transferenciaForm, fecha: e.target.value })}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="text-sm text-foreground mb-2 block">
                          Monto *
                        </label>
                        <input
                          type="number"
                          value={transferenciaForm.monto}
                          onChange={(e) => setTransferenciaForm({ ...transferenciaForm, monto: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-input-background border-b border-border
                                   focus:border-primary rounded-t transition-colors outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Save size={18} />}
                        onClick={() => {
                          const cuenta = bankAccounts.find(c => String(c.id) === transferenciaForm.cuentaBancariaId);
                          const nuevaTransferencia: TransferenciaBancaria = {
                            id: Date.now().toString(),
                            numeroReferencia: transferenciaForm.numeroReferencia,
                            cuentaBancariaId: transferenciaForm.cuentaBancariaId,
                            cuentaBancariaNombre: cuenta ? `${cuenta.accountNumber} - ${cuenta.bank.name}` : '',
                            fecha: transferenciaForm.fecha,
                            monto: transferenciaForm.monto
                          };
                          setTransferencias([...transferencias, nuevaTransferencia]);
                          setShowTransferenciaForm(false);
                          setTransferenciaForm({
                            numeroReferencia: '',
                            cuentaBancariaId: '',
                            fecha: new Date().toISOString().split('T')[0],
                            monto: 0
                          });
                        }}
                      >
                        Agregar Transferencia
                      </MaterialButton>
                      <MaterialButton
                        variant="outlined"
                        color="secondary"
                        startIcon={<X size={18} />}
                        onClick={() => setShowTransferenciaForm(false)}
                      >
                        Cancelar
                      </MaterialButton>
                    </div>
                  </div>
                )}

                {/* Add Transferencia Button */}
                {!showTransferenciaForm && (
                  <div className="mt-4">
                    <MaterialButton
                      variant="outlined"
                      color="primary"
                      startIcon={<Plus size={18} />}
                      onClick={() => setShowTransferenciaForm(true)}
                    >
                      Agregar Transferencia Bancaria
                    </MaterialButton>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Save size={18} />}
              onClick={handleSave}
            >
              Registrar {formData.tipo}
            </MaterialButton>
            <MaterialButton
              variant="outlined"
              color="secondary"
              startIcon={<X size={18} />}
              onClick={onClose}
            >
              Cancelar
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>
  );
}
