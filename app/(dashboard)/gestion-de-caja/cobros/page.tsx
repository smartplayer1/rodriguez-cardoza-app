'use client';

import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Plus, Save, X, ChevronDown, ChevronUp, Search, Receipt, CreditCard, Trash2, Building2 } from 'lucide-react';

interface BilleteDetalle {
  denominacion: number;
  cantidad: number;
  total: number;
}

interface TransferenciaBancaria {
  id: string;
  numeroReferencia: string;
  cuentaBancariaId: string;
  cuentaBancariaNombre: string;
  fecha: string;
  monto: number;
}

interface Cobro {
  id: string;
  facturaId: string;
  numeroFactura: string;
  clienteAsesor: string;
  cajaId: string;
  cajaNombre: string;
  gestionId: string;
  fecha: string;
  montoEfectivo: number;
  montoTransferencias: number;
  montoTotal: number;
  saldoAnterior: number;
  saldoNuevo: number;
  billetes: BilleteDetalle[];
  transferencias: TransferenciaBancaria[];
  descripcion: string;
  moneda: string;
  usuarioRegistro: string;
  createdAt: string;
}

interface CobrosProps {
  preSelectedFacturaId?: string;
  onNavigateBack?: () => void;
}

// Mock data - Facturas de Crédito disponibles
const facturasCredito = [
  {
    id: 'F1',
    numeroFactura: 'FACT-002',
    clienteAsesor: 'María José López García',
    fechaFactura: '2024-12-09',
    totalFactura: 1380,
    saldoPendiente: 1380,
    moneda: 'USD (Dólar)'
  },
  {
    id: 'F2',
    numeroFactura: 'FACT-005',
    clienteAsesor: 'Roberto García Sánchez',
    fechaFactura: '2024-12-08',
    totalFactura: 2500,
    saldoPendiente: 1500,
    moneda: 'NIO (Córdoba)'
  },
  {
    id: 'F3',
    numeroFactura: 'FACT-007',
    clienteAsesor: 'Patricia López Rodríguez',
    fechaFactura: '2024-12-07',
    totalFactura: 3200,
    saldoPendiente: 3200,
    moneda: 'NIO (Córdoba)'
  },
  {
    id: '2',
    numeroFactura: 'FACT-002',
    clienteAsesor: 'María José López García',
    fechaFactura: '2024-12-09',
    totalFactura: 1380,
    saldoPendiente: 1380,
    moneda: 'USD (Dólar)'
  }
];

// Mock data - Gestiones Activas
const gestionesActivas = [
  { id: 'G1', cajaId: 'C1', cajaNombre: 'Caja Principal - Sucursal Central', moneda: 'NIO (Córdoba)' },
  { id: 'G2', cajaId: 'C3', cajaNombre: 'Caja Principal - Sucursal León', moneda: 'USD (Dólar)' }
];

// Mock data - Cuentas Bancarias de la Empresa
const cuentasBancariasEmpresa = [
  { id: 'CB1', nombre: 'BAC - Cuenta Corriente Principal - 12345678', banco: 'BAC', moneda: 'NIO' },
  { id: 'CB2', nombre: 'Banpro - Cuenta Dólares - 87654321', banco: 'Banpro', moneda: 'USD' },
  { id: 'CB3', nombre: 'Lafise - Cuenta Ahorro Córdobas - 11223344', banco: 'Lafise', moneda: 'NIO' },
  { id: 'CB4', nombre: 'BAC - Cuenta Dólares - 99887766', banco: 'BAC', moneda: 'USD' }
];

// Mock data - Denominaciones disponibles
const denominacionesNIO = [500, 200, 100, 50, 20, 10, 5, 1];
const denominacionesUSD = [100, 50, 20, 10, 5, 1];

export default function Cobros({ preSelectedFacturaId, onNavigateBack }: CobrosProps) {
  const [cobros, setCobros] = useState<Cobro[]>([
    {
      id: '1',
      facturaId: 'F2',
      numeroFactura: 'FACT-005',
      clienteAsesor: 'Roberto García Sánchez',
      cajaId: 'C1',
      cajaNombre: 'Caja Principal - Sucursal Central',
      gestionId: 'G1',
      fecha: '2024-12-09',
      montoEfectivo: 500,
      montoTransferencias: 500,
      montoTotal: 1000,
      saldoAnterior: 2500,
      saldoNuevo: 1500,
      billetes: [
        { denominacion: 500, cantidad: 1, total: 500 }
      ],
      transferencias: [
        {
          id: 'T1',
          numeroReferencia: 'TRF-20241209-001',
          cuentaBancariaId: 'CB1',
          cuentaBancariaNombre: 'BAC - Cuenta Corriente Principal - 12345678',
          fecha: '2024-12-09',
          monto: 500
        }
      ],
      descripcion: 'Pago parcial - efectivo + transferencia',
      moneda: 'NIO (Córdoba)',
      usuarioRegistro: 'Admin',
      createdAt: '2024-12-09'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(!!preSelectedFacturaId);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'fecha' | 'montoTotal'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    facturaId: preSelectedFacturaId || facturasCredito[0]?.id || '',
    gestionId: gestionesActivas[0]?.id || '',
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
    cuentaBancariaId: cuentasBancariasEmpresa[0]?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    monto: 0
  });

  const facturaSeleccionada = facturasCredito.find(f => f.id === formData.facturaId);
  const gestionActual = gestionesActivas.find(g => g.id === formData.gestionId);
  const denominacionesActuales = gestionActual?.moneda.includes('USD') ? denominacionesUSD : denominacionesNIO;

  const handleCreate = () => {
    if (gestionesActivas.length === 0) {
      alert('No hay gestiones de caja activas. Por favor abra una caja primero.');
      return;
    }

    if (facturasCredito.length === 0) {
      alert('No hay facturas de crédito con saldo pendiente.');
      return;
    }

    setFormData({
      facturaId: preSelectedFacturaId || facturasCredito[0]?.id || '',
      gestionId: gestionesActivas[0]?.id || '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      usuarioRegistro: 'Admin'
    });
    setBilletes([]);
    setTransferencias([]);
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.facturaId) {
      alert('Por favor seleccione una factura');
      return;
    }

    const montoEfectivo = calcularTotalEfectivo();
    const montoTransferencias = calcularTotalTransferencias();
    const montoTotal = montoEfectivo + montoTransferencias;

    if (montoTotal <= 0) {
      alert('Debe ingresar al menos un pago (efectivo o transferencia)');
      return;
    }

    const factura = facturasCredito.find(f => f.id === formData.facturaId);
    if (!factura) return;

    if (montoTotal > factura.saldoPendiente) {
      alert(`El monto total del cobro (${montoTotal.toFixed(2)}) no puede exceder el saldo pendiente (${factura.saldoPendiente.toFixed(2)})`);
      return;
    }

    const gestion = gestionesActivas.find(g => g.id === formData.gestionId);

    // Helper to generate a unique ID (could use uuid or similar in real apps)
    const generateId = () => Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

    const nuevoCobro: Cobro = {
      id: generateId(),
      facturaId: formData.facturaId,
      numeroFactura: factura.numeroFactura,
      clienteAsesor: factura.clienteAsesor,
      cajaId: gestion?.cajaId || '',
      cajaNombre: gestion?.cajaNombre || '',
      gestionId: formData.gestionId,
      fecha: formData.fecha,
      montoEfectivo,
      montoTransferencias,
      montoTotal,
      saldoAnterior: factura.saldoPendiente,
      saldoNuevo: factura.saldoPendiente - montoTotal,
      billetes: [...billetes],
      transferencias: [...transferencias],
      descripcion: formData.descripcion,
      moneda: gestion?.moneda || '',
      usuarioRegistro: formData.usuarioRegistro,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCobros([...cobros, nuevoCobro]);
    
    // Update factura saldo (in real implementation, this would be done server-side)
    factura.saldoPendiente -= montoTotal;
    
    setShowCreateEdit(false);
    setBilletes([]);
    setTransferencias([]);
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setBilletes([]);
    setTransferencias([]);
    setShowTransferenciaForm(false);
    if (onNavigateBack) {
      onNavigateBack();
    }
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

  const calcularTotalEfectivo = (): number => {
    return billetes.reduce((sum, b) => sum + b.total, 0);
  };

  const calcularTotalTransferencias = (): number => {
    return transferencias.reduce((sum, t) => sum + t.monto, 0);
  };

  const handleAgregarTransferencia = () => {
    if (!transferenciaForm.numeroReferencia.trim()) {
      alert('Por favor ingrese el número de referencia');
      return;
    }

    if (transferenciaForm.monto <= 0) {
      alert('El monto de la transferencia debe ser mayor a 0');
      return;
    }

    const cuentaSeleccionada = cuentasBancariasEmpresa.find(c => c.id === transferenciaForm.cuentaBancariaId);
    
    const nuevaTransferencia: TransferenciaBancaria = {
      id: Date.now().toString(),
      numeroReferencia: transferenciaForm.numeroReferencia,
      cuentaBancariaId: transferenciaForm.cuentaBancariaId,
      cuentaBancariaNombre: cuentaSeleccionada?.nombre || '',
      fecha: transferenciaForm.fecha,
      monto: transferenciaForm.monto
    };

    setTransferencias([...transferencias, nuevaTransferencia]);
    
    // Reset form
    setTransferenciaForm({
      numeroReferencia: '',
      cuentaBancariaId: cuentasBancariasEmpresa[0]?.id || '',
      fecha: new Date().toISOString().split('T')[0],
      monto: 0
    });
    setShowTransferenciaForm(false);
  };

  const handleEliminarTransferencia = (id: string) => {
    setTransferencias(transferencias.filter(t => t.id !== id));
  };

  // Filtering and sorting
  const filteredCobros = cobros.filter(cobro => {
    const matchesSearch = cobro.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cobro.clienteAsesor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cobro.cajaNombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedCobros = [...filteredCobros].sort((a, b) => {
    const compareA: string | number = a[sortColumn];
    const compareB: string | number = b[sortColumn];

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCobros.length / rowsPerPage);
  const paginatedCobros = sortedCobros.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create Form
  if (showCreateEdit) {
    const totalEfectivo = calcularTotalEfectivo();
    const totalTransferencias = calcularTotalTransferencias();
    const totalCobro = totalEfectivo + totalTransferencias;
    const excedeSaldo = facturaSeleccionada && totalCobro > facturaSeleccionada.saldoPendiente;

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={32} className="text-primary" />
              <h2 className="text-foreground">Registrar Cobro</h2>
            </div>
            <p className="text-muted-foreground">
              Registre un cobro a una factura de crédito (efectivo y/o transferencias)
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Información de Factura */}
              <div>
                <h3 className="text-foreground mb-4">Seleccionar Factura</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Factura Selection */}
                  <div className="md:col-span-2">
                    <label className="text-sm text-foreground mb-2 block">
                      Factura de Crédito *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.facturaId}
                        onChange={(e) => setFormData({ ...formData, facturaId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {facturasCredito.map(factura => (
                          <option key={factura.id} value={factura.id}>
                            {factura.numeroFactura} - {factura.clienteAsesor} - Saldo: {factura.saldoPendiente.toFixed(2)} ({factura.moneda})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Factura Details Display */}
                  {facturaSeleccionada && (
                    <div className="md:col-span-2 bg-primary/5 border border-primary/20 rounded p-4">
                      <h4 className="text-foreground mb-3">Detalles de la Factura</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cliente/Asesor:</span>
                          <p className="text-foreground">{facturaSeleccionada.clienteAsesor}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fecha Factura:</span>
                          <p className="text-foreground">{facturaSeleccionada.fechaFactura}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Factura:</span>
                          <p className="text-foreground font-mono">{facturaSeleccionada.totalFactura.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saldo Pendiente:</span>
                          <p className="text-primary font-mono">
                            <strong>{facturaSeleccionada.saldoPendiente.toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Pago */}
              <div>
                <h3 className="text-foreground mb-4">Información del Cobro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gestión de Caja Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Gestión de Caja Activa *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.gestionId}
                        onChange={(e) => setFormData({ ...formData, gestionId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {gestionesActivas.map(gestion => (
                          <option key={gestion.id} value={gestion.id}>
                            {gestion.cajaNombre} - {gestion.moneda}
                          </option>
                        ))}
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
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none resize-none"
                    rows={2}
                    placeholder="Nota breve sobre el pago (opcional)"
                  />
                </div>
              </div>

              {/* Desglose de Billetes (Efectivo) */}
              <div>
                <h3 className="text-foreground mb-4">
                  Pago en Efectivo - {gestionActual?.moneda}
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

                  {/* Total Efectivo */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Total Efectivo:</span>
                      <span className="text-xl font-mono text-green-600">
                        {totalEfectivo.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transferencias Bancarias */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground">Transferencias Bancarias</h3>
                  {!showTransferenciaForm && (
                    <MaterialButton
                      variant="outlined"
                      color="primary"
                      startIcon={<Plus size={16} />}
                      onClick={() => setShowTransferenciaForm(true)}
                    >
                      Agregar Transferencia
                    </MaterialButton>
                  )}
                </div>

                {/* Transfer Form */}
                {showTransferenciaForm && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <h4 className="text-foreground mb-4 text-sm">Nueva Transferencia</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MaterialInput
                        label="Número de Referencia *"
                        type="text"
                        fullWidth
                        value={transferenciaForm.numeroReferencia}
                        onChange={(e) => setTransferenciaForm({ ...transferenciaForm, numeroReferencia: e.target.value })}
                        placeholder="Ej: TRF-20241209-001"
                      />

                      <div>
                        <label className="text-sm text-foreground mb-2 block">
                          Cuenta Bancaria de la Empresa *
                        </label>
                        <div className="relative">
                          <select
                            value={transferenciaForm.cuentaBancariaId}
                            onChange={(e) => setTransferenciaForm({ ...transferenciaForm, cuentaBancariaId: e.target.value })}
                            className="w-full pl-4 pr-10 py-3 bg-white border-b-2 border-border 
                                     focus:border-primary rounded-t transition-colors outline-none appearance-none"
                          >
                            {cuentasBancariasEmpresa.map(cuenta => (
                              <option key={cuenta.id} value={cuenta.id}>
                                {cuenta.nombre}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <MaterialInput
                        label="Fecha de Transferencia *"
                        type="date"
                        fullWidth
                        value={transferenciaForm.fecha}
                        onChange={(e) => setTransferenciaForm({ ...transferenciaForm, fecha: e.target.value })}
                      />

                      <MaterialInput
                        label="Monto *"
                        type="number"
                        fullWidth
                        value={transferenciaForm.monto || ''}
                        onChange={(e) => setTransferenciaForm({ ...transferenciaForm, monto: Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex gap-3 mt-4">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={16} />}
                        onClick={handleAgregarTransferencia}
                      >
                        Agregar
                      </MaterialButton>
                      <MaterialButton
                        variant="text"
                        color="secondary"
                        onClick={() => {
                          setShowTransferenciaForm(false);
                          setTransferenciaForm({
                            numeroReferencia: '',
                            cuentaBancariaId: cuentasBancariasEmpresa[0]?.id || '',
                            fecha: new Date().toISOString().split('T')[0],
                            monto: 0
                          });
                        }}
                      >
                        Cancelar
                      </MaterialButton>
                    </div>
                  </div>
                )}

                {/* Transferencias List */}
                {transferencias.length > 0 ? (
                  <div className="bg-muted/30 rounded overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-foreground">Referencia</th>
                          <th className="px-4 py-3 text-left text-xs text-foreground">Cuenta Bancaria</th>
                          <th className="px-4 py-3 text-left text-xs text-foreground">Fecha</th>
                          <th className="px-4 py-3 text-right text-xs text-foreground">Monto</th>
                          <th className="px-4 py-3 text-right text-xs text-foreground">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transferencias.map((transferencia) => (
                          <tr key={transferencia.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm text-foreground font-mono">{transferencia.numeroReferencia}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{transferencia.cuentaBancariaNombre}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{transferencia.fecha}</td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">{transferencia.monto.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              <MaterialButton
                                variant="text"
                                color="secondary"
                                startIcon={<Trash2 size={14} />}
                                onClick={() => handleEliminarTransferencia(transferencia.id)}
                              >
                                Eliminar
                              </MaterialButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Total Transferencias */}
                    <div className="px-4 py-3 bg-muted border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Total Transferencias:</span>
                        <span className="text-xl font-mono text-blue-600">
                          {totalTransferencias.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded p-6 text-center">
                    <Building2 size={32} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay transferencias agregadas
                    </p>
                  </div>
                )}
              </div>

              {/* Resumen Total */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <h4 className="text-foreground mb-3">Resumen del Cobro</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Efectivo:</span>
                    <span className="text-foreground font-mono">{totalEfectivo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Transferencias:</span>
                    <span className="text-foreground font-mono">{totalTransferencias.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Total del Cobro:</span>
                      <span className={`text-2xl font-mono ${
                        excedeSaldo ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {totalCobro.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {excedeSaldo && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                    ⚠️ El monto total del cobro ({totalCobro.toFixed(2)}) excede el saldo pendiente ({facturaSeleccionada?.saldoPendiente.toFixed(2)})
                  </div>
                )}
                {facturaSeleccionada && totalCobro > 0 && !excedeSaldo && (
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded text-sm text-blue-700">
                    Saldo restante después del cobro: {(facturaSeleccionada.saldoPendiente - totalCobro).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Save size={18} />}
                onClick={handleSave}
                disabled={excedeSaldo || totalCobro === 0}
              >
                Registrar Cobro
              </MaterialButton>
              <MaterialButton
                variant="outlined"
                color="secondary"
                startIcon={<X size={18} />}
                onClick={handleCancel}
              >
                Cancelar
              </MaterialButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={32} className="text-primary" />
              <h2 className="text-foreground">Cobros</h2>
            </div>
            <p className="text-muted-foreground">
              Gestione los cobros a facturas de crédito
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nuevo Cobro
          </MaterialButton>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface rounded elevation-2 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por factura, cliente o caja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            {/* Rows per page */}
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Cobros Table */}
        {paginatedCobros.length > 0 ? (
          <>
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('fecha')}
                      >
                        <div className="flex items-center gap-2">
                          Fecha
                          {sortColumn === 'fecha' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Factura</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Cliente/Asesor</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Efectivo</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Transferencias</th>
                      <th 
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('montoTotal')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total Cobrado
                          {sortColumn === 'montoTotal' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Saldo Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedCobros.map((cobro) => (
                      <tr key={cobro.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground">{cobro.fecha}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Receipt size={20} className="text-primary" />
                            </div>
                            <span className="text-foreground">{cobro.numeroFactura}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{cobro.clienteAsesor}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{cobro.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {cobro.montoEfectivo.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {cobro.montoTransferencias.toFixed(2)}
                          {cobro.transferencias.length > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({cobro.transferencias.length})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-green-600 font-mono">
                            {cobro.montoTotal.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-mono ${
                            cobro.saldoNuevo === 0 ? 'text-green-600' : 'text-primary'
                          }`}>
                            {cobro.saldoNuevo.toFixed(2)}
                            {cobro.saldoNuevo === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Pagado
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedCobros.length)} de {sortedCobros.length} cobros
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>
          </>
        ) : (
          // Empty State
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <CreditCard size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay cobros registrados</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'No se encontraron cobros con los filtros aplicados'
                : 'Comience registrando un nuevo cobro'}
            </p>
            {!searchTerm && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Crear Primer Cobro
              </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}