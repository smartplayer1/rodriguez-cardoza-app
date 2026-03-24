import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { TrendingUp, TrendingDown, Plus, Save, X, ChevronDown, ChevronUp, Search, Filter, Wallet, Trash2, Building2 } from 'lucide-react';

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

interface IngresoEgreso {
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

// Mock data - Conceptos Contables (filtered by tipo)
const conceptosIngreso = [
  { id: 'CI1', nombre: 'Venta de Productos', codigo: 'ING-001', tipo: 'ingreso' },
  { id: 'CI2', nombre: 'Devolución de Proveedor', codigo: 'ING-002', tipo: 'ingreso' },
  { id: 'CI3', nombre: 'Ingreso por Servicios', codigo: 'ING-003', tipo: 'ingreso' }
];

const conceptosEgreso = [
  { id: 'CE1', nombre: 'Compra de Inventario', codigo: 'EGR-001', tipo: 'egreso' },
  { id: 'CE2', nombre: 'Pago a Proveedores', codigo: 'EGR-002', tipo: 'egreso' },
  { id: 'CE3', nombre: 'Gastos Operativos', codigo: 'EGR-003', tipo: 'egreso' },
  { id: 'CE4', nombre: 'Pago de Servicios', codigo: 'EGR-004', tipo: 'egreso' }
];

// Mock data - Gestiones Activas
const gestionesActivas = [
  { id: 'G1', cajaId: 'C1', cajaNombre: 'Caja Principal - Sucursal Central', moneda: 'NIO (Córdoba)' },
  { id: 'G2', cajaId: 'C3', cajaNombre: 'Caja Principal - Sucursal León', moneda: 'USD (Dólar)' }
];

// Mock data - Denominaciones disponibles
const denominacionesNIO = [500, 200, 100, 50, 20, 10, 5, 1];
const denominacionesUSD = [100, 50, 20, 10, 5, 1];

// Mock data - Cuentas Bancarias de la Empresa
const cuentasBancariasEmpresa = [
  { id: 'CB1', nombre: 'BAC - Cuenta Corriente Principal - 12345678', banco: 'BAC', moneda: 'NIO' },
  { id: 'CB2', nombre: 'Banpro - Cuenta Dólares - 87654321', banco: 'Banpro', moneda: 'USD' },
  { id: 'CB3', nombre: 'Lafise - Cuenta Ahorro Córdobas - 11223344', banco: 'Lafise', moneda: 'NIO' },
  { id: 'CB4', nombre: 'BAC - Cuenta Dólares - 99887766', banco: 'BAC', moneda: 'USD' }
];

export default function IngresosEgresos() {
  const [registros, setRegistros] = useState<IngresoEgreso[]>([
    {
      id: '1',
      tipo: 'Ingreso',
      conceptoId: 'CI1',
      conceptoNombre: 'Venta de Productos',
      cajaId: 'C1',
      cajaNombre: 'Caja Principal - Sucursal Central',
      gestionId: 'G1',
      fecha: '2024-12-09',
      descripcion: 'Venta al contado de productos de belleza',
      billetes: [
        { denominacion: 500, cantidad: 2, total: 1000 },
        { denominacion: 100, cantidad: 5, total: 500 }
      ],
      transferencias: [],
      montoEfectivo: 1500,
      montoTransferencias: 0,
      montoTotal: 1500,
      moneda: 'NIO (Córdoba)',
      usuarioRegistro: 'Admin',
      createdAt: '2024-12-09'
    },
    {
      id: '2',
      tipo: 'Egreso',
      conceptoId: 'CE3',
      conceptoNombre: 'Gastos Operativos',
      cajaId: 'C1',
      cajaNombre: 'Caja Principal - Sucursal Central',
      gestionId: 'G1',
      fecha: '2024-12-09',
      descripcion: 'Compra de materiales de limpieza',
      billetes: [
        { denominacion: 200, cantidad: 1, total: 200 },
        { denominacion: 50, cantidad: 2, total: 100 }
      ],
      transferencias: [],
      montoEfectivo: 300,
      montoTransferencias: 0,
      montoTotal: 300,
      moneda: 'NIO (Córdoba)',
      usuarioRegistro: 'Admin',
      createdAt: '2024-12-09'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'Ingreso' | 'Egreso'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'fecha' | 'tipo' | 'montoTotal'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    tipo: 'Ingreso' as 'Ingreso' | 'Egreso',
    conceptoId: conceptosIngreso[0]?.id || '',
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

  const gestionActual = gestionesActivas.find(g => g.id === formData.gestionId);
  const denominacionesActuales = gestionActual?.moneda.includes('USD') ? denominacionesUSD : denominacionesNIO;
  const conceptosActuales = formData.tipo === 'Ingreso' ? conceptosIngreso : conceptosEgreso;

  const handleCreate = () => {
    if (gestionesActivas.length === 0) {
      alert('No hay gestiones de caja activas. Por favor abra una caja primero.');
      return;
    }

    setFormData({
      tipo: 'Ingreso',
      conceptoId: conceptosIngreso[0]?.id || '',
      gestionId: gestionesActivas[0]?.id || '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      usuarioRegistro: 'Admin'
    });
    setBilletes([]);
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    // Validation
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

    const gestion = gestionesActivas.find(g => g.id === formData.gestionId);
    const concepto = conceptosActuales.find(c => c.id === formData.conceptoId);
    const montoTotal = billetes.reduce((sum, b) => sum + b.total, 0) + transferencias.reduce((sum, t) => sum + t.monto, 0);

    const nuevoRegistro: IngresoEgreso = {
      id: Date.now().toString(),
      tipo: formData.tipo,
      conceptoId: formData.conceptoId,
      conceptoNombre: concepto?.nombre || '',
      cajaId: gestion?.cajaId || '',
      cajaNombre: gestion?.cajaNombre || '',
      gestionId: formData.gestionId,
      fecha: formData.fecha,
      descripcion: formData.descripcion,
      billetes: [...billetes],
      transferencias: [...transferencias],
      montoEfectivo: billetes.reduce((sum, b) => sum + b.total, 0),
      montoTransferencias: transferencias.reduce((sum, t) => sum + t.monto, 0),
      montoTotal,
      moneda: gestion?.moneda || '',
      usuarioRegistro: formData.usuarioRegistro,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRegistros([...registros, nuevoRegistro]);
    setShowCreateEdit(false);
    setBilletes([]);
    setTransferencias([]);
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setBilletes([]);
    setTransferencias([]);
  };

  const handleTipoChange = (tipo: 'Ingreso' | 'Egreso') => {
    const nuevosConceptos = tipo === 'Ingreso' ? conceptosIngreso : conceptosEgreso;
    setFormData({
      ...formData,
      tipo,
      conceptoId: nuevosConceptos[0]?.id || ''
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

  // Filtering and sorting
  const filteredRegistros = registros.filter(registro => {
    const matchesSearch = registro.conceptoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          registro.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          registro.cajaNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || registro.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const sortedRegistros = [...filteredRegistros].sort((a, b) => {
    let compareA: any = a[sortColumn];
    let compareB: any = b[sortColumn];

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedRegistros.length / rowsPerPage);
  const paginatedRegistros = sortedRegistros.slice(
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
                    <div className="relative">
                      <select
                        value={formData.conceptoId}
                        onChange={(e) => setFormData({ ...formData, conceptoId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {conceptosActuales.map(concepto => (
                          <option key={concepto.id} value={concepto.id}>
                            {concepto.nombre} ({concepto.codigo})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

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
                  Desglose de Billetes - {gestionActual?.moneda}
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
                  Transferencias Bancarias - {gestionActual?.moneda}
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
                          <select
                            value={transferenciaForm.cuentaBancariaId}
                            onChange={(e) => setTransferenciaForm({ ...transferenciaForm, cuentaBancariaId: e.target.value })}
                            className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                     focus:border-primary rounded-t transition-colors outline-none appearance-none"
                            required
                          >
                            {cuentasBancariasEmpresa.map(cuenta => (
                              <option key={cuenta.id} value={cuenta.id}>
                                {cuenta.nombre} ({cuenta.moneda})
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                            const nuevaTransferencia: TransferenciaBancaria = {
                              id: Date.now().toString(),
                              numeroReferencia: transferenciaForm.numeroReferencia,
                              cuentaBancariaId: transferenciaForm.cuentaBancariaId,
                              cuentaBancariaNombre: cuentasBancariasEmpresa.find(c => c.id === transferenciaForm.cuentaBancariaId)?.nombre || '',
                              fecha: transferenciaForm.fecha,
                              monto: transferenciaForm.monto
                            };
                            setTransferencias([...transferencias, nuevaTransferencia]);
                            setShowTransferenciaForm(false);
                            setTransferenciaForm({
                              numeroReferencia: '',
                              cuentaBancariaId: cuentasBancariasEmpresa[0]?.id || '',
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
              <Wallet size={32} className="text-primary" />
              <h2 className="text-foreground">Ingresos y Egresos</h2>
            </div>
            <p className="text-muted-foreground">
              Gestione los ingresos y egresos de caja
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nuevo Registro
          </MaterialButton>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface rounded elevation-2 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por concepto, descripción o caja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            {/* Tipo Filter */}
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterTipo}
                onChange={(e) => {
                  setFilterTipo(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todos">Todos los tipos</option>
                <option value="Ingreso">Ingresos</option>
                <option value="Egreso">Egresos</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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

        {/* Registros Table */}
        {paginatedRegistros.length > 0 ? (
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
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('tipo')}
                      >
                        <div className="flex items-center gap-2">
                          Tipo
                          {sortColumn === 'tipo' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Concepto</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                      <th 
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('montoTotal')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Monto
                          {sortColumn === 'montoTotal' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedRegistros.map((registro) => (
                      <tr key={registro.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground">{registro.fecha}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {registro.tipo === 'Ingreso' ? (
                              <TrendingUp size={18} className="text-green-600" />
                            ) : (
                              <TrendingDown size={18} className="text-red-600" />
                            )}
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              registro.tipo === 'Ingreso' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {registro.tipo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{registro.conceptoNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{registro.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {registro.descripcion}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-mono ${
                            registro.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {registro.tipo === 'Ingreso' ? '+' : '-'} {registro.montoTotal.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{registro.usuarioRegistro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedRegistros.length)} de {sortedRegistros.length} registros
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
            <Wallet size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay registros de ingresos/egresos</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterTipo !== 'todos'
                ? 'No se encontraron registros con los filtros aplicados'
                : 'Comience registrando un nuevo ingreso o egreso'}
            </p>
            {!searchTerm && filterTipo === 'todos' && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Crear Primer Registro
              </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}