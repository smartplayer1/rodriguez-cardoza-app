import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Receipt, Plus, Trash2, Save, X, ChevronDown, ChevronUp, Search, Filter, Eye, Award, Package, Gift, CreditCard } from 'lucide-react';
import Cobros from './Cobros';

// Interfaces
interface FacturaDetalle {
  id: string;
  articuloId: string;
  articuloNombre: string;
  precioVendido: number;
  cantidad: number;
  subtotal: number;
  esBonificacion?: boolean; // NEW: Flag to identify bonification items
}

interface Factura {
  id: string;
  numeroFactura: string;
  cajaId: string;
  cajaNombre: string;
  asesorId: string;
  asesorNombre: string;
  asesorTipo: 'promotor' | 'empleado';
  fecha: string;
  usuarioGenero: string;
  moneda: string;
  tipoPago: 'Contado' | 'Crédito';
  detalles: FacturaDetalle[];
  subtotal: number;
  iva: number;
  total: number;
  createdAt: string;
  bonificacionesAplicadas?: string[]; // NEW: IDs of bonifications applied
}

// NEW: Bonification interface
interface Bonificacion {
  id: string;
  promotorId: string;
  reglaNombre: string;
  productos: {
    productoId: string;
    productoNombre: string;
    cantidad: number;
  }[];
  estado: 'disponible' | 'redimida';
  fechaCompletado: string;
}

// Mock data - Gestiones abiertas (only open cajas)
const gestionesAbiertas = [
  { id: '1', cajaId: '1', cajaNombre: 'Caja Principal - Sucursal Central' },
  { id: '2', cajaId: '3', cajaNombre: 'Caja Principal - Sucursal León' }
];

// Mock data - Promotores disponibles
const promotoresDisponibles = [
  { id: 'P1', nombre: 'Laura Martínez Hernández', codigo: 'PROM-001', tipo: 'promotor' as const },
  { id: 'P2', nombre: 'Roberto García Sánchez', codigo: 'PROM-002', tipo: 'promotor' as const },
  { id: 'P3', nombre: 'Patricia López Rodríguez', codigo: 'PROM-003', tipo: 'promotor' as const }
];

// Mock data - Empleados disponibles
const empleadosDisponibles = [
  { id: 'E1', nombre: 'Carlos Alberto Rodríguez Cardoza', codigo: 'E001', tipo: 'empleado' as const },
  { id: 'E2', nombre: 'María José López García', codigo: 'E002', tipo: 'empleado' as const },
  { id: 'E3', nombre: 'Ana Patricia Torres Morales', codigo: 'E003', tipo: 'empleado' as const }
];

// Mock data - Artículos disponibles (from Artículos module)
const articulosDisponibles = [
  { id: 'ART001', nombre: 'Perfume Chanel N°5 - 100ml', precioSugerido: 2500, categoria: 'Perfume' },
  { id: 'ART002', nombre: 'Labial MAC Ruby Woo', precioSugerido: 450, categoria: 'Maquillaje' },
  { id: 'ART003', nombre: 'Crema Facial La Roche-Posay', precioSugerido: 850, categoria: 'Cuidado de la Piel' },
  { id: 'ART004', nombre: 'Base de Maquillaje Estée Lauder', precioSugerido: 1200, categoria: 'Maquillaje' },
  { id: 'ART005', nombre: 'Perfume Dior Sauvage - 60ml', precioSugerido: 1800, categoria: 'Perfume' },
  { id: 'ART006', nombre: 'Sérum Vitamina C The Ordinary', precioSugerido: 320, categoria: 'Cuidado de la Piel' },
  { id: 'ART007', nombre: 'Brocha Set Professional', precioSugerido: 560, categoria: 'Accesorios de Belleza' },
  { id: 'ART008', nombre: 'Máscara de Pestañas Maybelline', precioSugerido: 280, categoria: 'Maquillaje' }
];

// Mock data - Monedas disponibles
const monedasDisponibles = ['NIO (Córdoba)', 'USD (Dólar)'];

// Mock data - Bonificaciones disponibles por promotor
const bonificacionesDisponibles: Bonificacion[] = [
  {
    id: 'bon-1',
    promotorId: 'P1',
    reglaNombre: 'Bonificación Perfumes Premium Diciembre',
    productos: [
      { productoId: 'ART007', productoNombre: 'Brocha Set Professional', cantidad: 1 },
      { productoId: 'ART006', productoNombre: 'Sérum Vitamina C The Ordinary', cantidad: 2 }
    ],
    estado: 'disponible',
    fechaCompletado: '2024-12-08'
  },
  {
    id: 'bon-2',
    promotorId: 'P2',
    reglaNombre: 'Bonificación por Ventas $10,000',
    productos: [
      { productoId: 'ART003', productoNombre: 'Crema Facial La Roche-Posay', cantidad: 1 }
    ],
    estado: 'disponible',
    fechaCompletado: '2024-12-05'
  },
  {
    id: 'bon-3',
    promotorId: 'P1',
    reglaNombre: 'Bonificación Navideña Especial',
    productos: [
      { productoId: 'ART002', productoNombre: 'Labial MAC Ruby Woo', cantidad: 3 }
    ],
    estado: 'redimida',
    fechaCompletado: '2024-11-28'
  }
];

// IVA Configuration
const IVA_RATE = 0.15; // 15%

export default function Facturacion() {
  const [facturas, setFacturas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FACT-001',
      cajaId: '1',
      cajaNombre: 'Caja Principal - Sucursal Central',
      asesorId: 'P1',
      asesorNombre: 'Laura Martínez Hernández',
      asesorTipo: 'promotor',
      fecha: '2024-12-09',
      usuarioGenero: 'Admin',
      moneda: 'NIO (Córdoba)',
      tipoPago: 'Contado',
      detalles: [
        { id: '1', articuloId: 'ART001', articuloNombre: 'Perfume Chanel N°5 - 100ml', precioVendido: 2500, cantidad: 1, subtotal: 2500 },
        { id: '2', articuloId: 'ART002', articuloNombre: 'Labial MAC Ruby Woo', precioVendido: 450, cantidad: 2, subtotal: 900 }
      ],
      subtotal: 3400,
      iva: 510,
      total: 3910,
      createdAt: '2024-12-09'
    },
    {
      id: '2',
      numeroFactura: 'FACT-002',
      cajaId: '3',
      cajaNombre: 'Caja Principal - Sucursal León',
      asesorId: 'E2',
      asesorNombre: 'María José López García',
      asesorTipo: 'empleado',
      fecha: '2024-12-09',
      usuarioGenero: 'Admin',
      moneda: 'USD (Dólar)',
      tipoPago: 'Crédito',
      detalles: [
        { id: '1', articuloId: 'ART004', articuloNombre: 'Base de Maquillaje Estée Lauder', precioVendido: 1200, cantidad: 1, subtotal: 1200 }
      ],
      subtotal: 1200,
      iva: 180,
      total: 1380,
      createdAt: '2024-12-09'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [showGenerarCobro, setShowGenerarCobro] = useState(false);
  const [facturaParaCobro, setFacturaParaCobro] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipoPago, setFilterTipoPago] = useState<'todos' | 'Contado' | 'Crédito'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'numeroFactura' | 'fecha' | 'total'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    cajaId: gestionesAbiertas.length > 0 ? gestionesAbiertas[0].cajaId : '',
    asesorId: promotoresDisponibles.length > 0 ? promotoresDisponibles[0].id : '',
    asesorTipo: 'promotor' as 'promotor' | 'empleado',
    fecha: new Date().toISOString().split('T')[0],
    usuarioGenero: 'Admin',
    moneda: 'NIO (Córdoba)',
    tipoPago: 'Contado' as 'Contado' | 'Crédito',
    detalles: [] as FacturaDetalle[]
  });

  const [newDetalle, setNewDetalle] = useState({
    articuloId: articulosDisponibles.length > 0 ? articulosDisponibles[0].id : '',
    precioVendido: articulosDisponibles.length > 0 ? articulosDisponibles[0].precioSugerido : 0,
    cantidad: 1
  });

  const asesoresDisponibles = formData.asesorTipo === 'promotor' ? promotoresDisponibles : empleadosDisponibles;

  const handleCreate = () => {
    if (gestionesAbiertas.length === 0) {
      alert('No hay cajas abiertas disponibles. Por favor abra una caja primero.');
      return;
    }

    setEditingFactura(null);
    setFormData({
      cajaId: gestionesAbiertas.length > 0 ? gestionesAbiertas[0].cajaId : '',
      asesorId: promotoresDisponibles.length > 0 ? promotoresDisponibles[0].id : '',
      asesorTipo: 'promotor',
      fecha: new Date().toISOString().split('T')[0],
      usuarioGenero: 'Admin',
      moneda: 'NIO (Córdoba)',
      tipoPago: 'Contado',
      detalles: []
    });
    setNewDetalle({
      articuloId: articulosDisponibles[0].id,
      precioVendido: articulosDisponibles[0].precioSugerido,
      cantidad: 1
    });
    setShowCreateEdit(true);
  };

  const handleViewDetail = (factura: Factura) => {
    setEditingFactura(factura);
    setShowDetail(true);
  };

  const addDetalle = () => {
    if (newDetalle.precioVendido <= 0 || newDetalle.cantidad <= 0) {
      alert('El precio y la cantidad deben ser mayores a 0');
      return;
    }

    const articulo = articulosDisponibles.find(a => a.id === newDetalle.articuloId);
    if (!articulo) return;

    const nuevoDetalle: FacturaDetalle = {
      id: Date.now().toString(),
      articuloId: newDetalle.articuloId,
      articuloNombre: articulo.nombre,
      precioVendido: newDetalle.precioVendido,
      cantidad: newDetalle.cantidad,
      subtotal: newDetalle.precioVendido * newDetalle.cantidad
    };

    setFormData({
      ...formData,
      detalles: [...formData.detalles, nuevoDetalle]
    });

    // Reset detalle form
    setNewDetalle({
      articuloId: articulosDisponibles[0].id,
      precioVendido: articulosDisponibles[0].precioSugerido,
      cantidad: 1
    });
  };

  const removeDetalle = (id: string) => {
    setFormData({
      ...formData,
      detalles: formData.detalles.filter(d => d.id !== id)
    });
  };

  const calculateSubtotal = (detalles: FacturaDetalle[]): number => {
    return detalles.reduce((sum, det) => sum + det.subtotal, 0);
  };

  const calculateIVA = (subtotal: number): number => {
    return subtotal * IVA_RATE;
  };

  const calculateTotal = (subtotal: number, iva: number): number => {
    return subtotal + iva;
  };

  const handleSave = () => {
    // Validation
    if (!formData.cajaId) {
      alert('Por favor seleccione una caja');
      return;
    }

    if (!formData.asesorId) {
      alert('Por favor seleccione un asesor');
      return;
    }

    if (formData.detalles.length === 0) {
      alert('Debe agregar al menos un detalle a la factura');
      return;
    }

    const caja = gestionesAbiertas.find(g => g.cajaId === formData.cajaId);
    const asesor = asesoresDisponibles.find(a => a.id === formData.asesorId);
    
    const subtotal = calculateSubtotal(formData.detalles);
    const iva = calculateIVA(subtotal);
    const total = calculateTotal(subtotal, iva);

    const newFactura: Factura = {
      id: Date.now().toString(),
      numeroFactura: `FACT-${(facturas.length + 1).toString().padStart(3, '0')}`,
      cajaId: formData.cajaId,
      cajaNombre: caja?.cajaNombre || '',
      asesorId: formData.asesorId,
      asesorNombre: asesor?.nombre || '',
      asesorTipo: formData.asesorTipo,
      fecha: formData.fecha,
      usuarioGenero: formData.usuarioGenero,
      moneda: formData.moneda,
      tipoPago: formData.tipoPago,
      detalles: formData.detalles,
      subtotal,
      iva,
      total,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setFacturas([...facturas, newFactura]);
    setShowCreateEdit(false);
    setFormData({
      cajaId: gestionesAbiertas.length > 0 ? gestionesAbiertas[0].cajaId : '',
      asesorId: promotoresDisponibles.length > 0 ? promotoresDisponibles[0].id : '',
      asesorTipo: 'promotor',
      fecha: new Date().toISOString().split('T')[0],
      usuarioGenero: 'Admin',
      moneda: 'NIO (Córdoba)',
      tipoPago: 'Contado',
      detalles: []
    });
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setShowDetail(false);
    setEditingFactura(null);
    setShowGenerarCobro(false);
    setFacturaParaCobro(null);
  };

  const handleGenerarCobro = (facturaId: string) => {
    setFacturaParaCobro(facturaId);
    setShowGenerarCobro(true);
  };

  const handleAsesorTipoChange = (tipo: 'promotor' | 'empleado') => {
    const nuevosAsesores = tipo === 'promotor' ? promotoresDisponibles : empleadosDisponibles;
    setFormData({
      ...formData,
      asesorTipo: tipo,
      asesorId: nuevosAsesores.length > 0 ? nuevosAsesores[0].id : ''
    });
  };

  const handleArticuloChange = (articuloId: string) => {
    const articulo = articulosDisponibles.find(a => a.id === articuloId);
    if (articulo) {
      setNewDetalle({
        ...newDetalle,
        articuloId,
        precioVendido: articulo.precioSugerido
      });
    }
  };

  // Filtering and sorting
  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = factura.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          factura.cajaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          factura.asesorNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipoPago = filterTipoPago === 'todos' || factura.tipoPago === filterTipoPago;
    return matchesSearch && matchesTipoPago;
  });

  const sortedFacturas = [...filteredFacturas].sort((a, b) => {
    let compareA: any = a[sortColumn];
    let compareB: any = b[sortColumn];

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedFacturas.length / rowsPerPage);
  const paginatedFacturas = sortedFacturas.slice(
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

  // Generar Cobro View
  if (showGenerarCobro && facturaParaCobro) {
    return (
      <Cobros 
        preSelectedFacturaId={facturaParaCobro}
        onNavigateBack={handleCancel}
      />
    );
  }

  // Create/Edit Form
  if (showCreateEdit) {
    const subtotal = calculateSubtotal(formData.detalles);
    const iva = calculateIVA(subtotal);
    const total = calculateTotal(subtotal, iva);

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Receipt size={32} className="text-primary" />
              <h2 className="text-foreground">Nueva Factura</h2>
            </div>
            <p className="text-muted-foreground">
              Registre una nueva factura de venta
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-foreground mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Caja Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Caja * (solo cajas abiertas)
                    </label>
                    <div className="relative">
                      <select
                        value={formData.cajaId}
                        onChange={(e) => setFormData({ ...formData, cajaId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {gestionesAbiertas.map(gestion => (
                          <option key={gestion.cajaId} value={gestion.cajaId}>
                            {gestion.cajaNombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Promotor Selection - UPDATED: No type selector, only promoters */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Promotor *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.asesorId}
                        onChange={(e) => setFormData({ ...formData, asesorId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {promotoresDisponibles.map(promotor => (
                          <option key={promotor.id} value={promotor.id}>
                            {promotor.nombre} ({promotor.codigo})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Moneda Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Moneda *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.moneda}
                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {monedasDisponibles.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Tipo de Pago Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Tipo de Pago *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.tipoPago}
                        onChange={(e) => setFormData({ ...formData, tipoPago: e.target.value as 'Contado' | 'Crédito' })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        <option value="Contado">Contado</option>
                        <option value="Crédito">Crédito</option>
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

                  <MaterialInput
                    label="Usuario que genera *"
                    type="text"
                    fullWidth
                    value={formData.usuarioGenero}
                    onChange={(e) => setFormData({ ...formData, usuarioGenero: e.target.value })}
                    disabled
                  />
                </div>
              </div>

              {/* Detalles de Factura */}
              <div>
                <h3 className="text-foreground mb-4">Detalles de Factura</h3>
                
                {/* Add detalle controls */}
                <div className="bg-muted/30 rounded p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-foreground mb-2 block">Artículo</label>
                      <select
                        value={newDetalle.articuloId}
                        onChange={(e) => handleArticuloChange(e.target.value)}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        {articulosDisponibles.map(art => (
                          <option key={art.id} value={art.id}>{art.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Precio Vendido</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newDetalle.precioVendido}
                        onChange={(e) => setNewDetalle({ ...newDetalle, precioVendido: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={newDetalle.cantidad}
                        onChange={(e) => setNewDetalle({ ...newDetalle, cantidad: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={16} />}
                        onClick={addDetalle}
                        fullWidth
                      >
                        Agregar
                      </MaterialButton>
                    </div>
                  </div>
                </div>

                {/* Detalles table */}
                {formData.detalles.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Artículo</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Precio</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Cantidad</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Subtotal</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {formData.detalles.map((det) => (
                          <tr key={det.id}>
                            <td className="px-4 py-3 text-sm text-foreground">{det.articuloNombre}</td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                              {det.precioVendido.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground text-right">
                              {det.cantidad}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                              {det.subtotal.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeDetalle(det.id)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totales */}
              {formData.detalles.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded p-6">
                  <h3 className="text-foreground mb-4">Resumen de Totales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <p className="text-2xl text-foreground font-mono">{subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">IVA (15%)</span>
                      <p className="text-2xl text-foreground font-mono">{iva.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total</span>
                      <p className="text-2xl text-primary font-mono">
                        <strong>{total.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Save size={18} />}
                onClick={handleSave}
              >
                Guardar Factura
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

  // Detail View
  if (showDetail && editingFactura) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Receipt size={32} className="text-primary" />
              <h2 className="text-foreground">Detalle de Factura</h2>
            </div>
            <p className="text-muted-foreground">
              {editingFactura.numeroFactura}
            </p>
          </div>

          {/* Detail View */}
          <div className="bg-surface rounded elevation-2 p-6">
            {/* Información General */}
            <div className="bg-muted/30 rounded p-4 mb-6">
              <h3 className="text-foreground mb-4">Información General</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Caja:</span>
                  <p className="text-foreground">{editingFactura.cajaNombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Asesor:</span>
                  <p className="text-foreground">{editingFactura.asesorNombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <p className="text-foreground">{editingFactura.fecha}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Usuario:</span>
                  <p className="text-foreground">{editingFactura.usuarioGenero}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Moneda:</span>
                  <p className="text-foreground">{editingFactura.moneda}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo Asesor:</span>
                  <p className="text-foreground capitalize">{editingFactura.asesorTipo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de Pago:</span>
                  <p className="text-foreground">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      editingFactura.tipoPago === 'Contado' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {editingFactura.tipoPago}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Detalles */}
            <div className="mb-6">
              <h3 className="text-foreground mb-4">Detalles</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm text-foreground">Artículo</th>
                      <th className="px-4 py-3 text-right text-sm text-foreground">Precio Vendido</th>
                      <th className="px-4 py-3 text-right text-sm text-foreground">Cantidad</th>
                      <th className="px-4 py-3 text-right text-sm text-foreground">Total Línea</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {editingFactura.detalles.map((det) => (
                      <tr key={det.id}>
                        <td className="px-4 py-3 text-sm text-foreground">{det.articuloNombre}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                          {det.precioVendido.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {det.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                          {det.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="bg-primary/5 border border-primary/20 rounded p-6">
              <h3 className="text-foreground mb-4">Totales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <p className="text-2xl text-foreground font-mono">{editingFactura.subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">IVA (15%)</span>
                  <p className="text-2xl text-foreground font-mono">{editingFactura.iva.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total</span>
                  <p className="text-2xl text-primary font-mono">
                    <strong>{editingFactura.total.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <MaterialButton
                variant="outlined"
                color="secondary"
                startIcon={<X size={18} />}
                onClick={handleCancel}
              >
                Cerrar
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
              <Receipt size={32} className="text-primary" />
              <h2 className="text-foreground">Facturación</h2>
            </div>
            <p className="text-muted-foreground">
              Gestione las facturas de venta
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Factura
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
                placeholder="Buscar por número, caja o asesor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            {/* Tipo de Pago Filter */}
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterTipoPago}
                onChange={(e) => {
                  setFilterTipoPago(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todos">Todos los tipos</option>
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
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

        {/* Facturas Table */}
        {paginatedFacturas.length > 0 ? (
          <>
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('numeroFactura')}
                      >
                        <div className="flex items-center gap-2">
                          N° Factura
                          {sortColumn === 'numeroFactura' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
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
                      <th className="px-6 py-4 text-left text-sm text-foreground">Asesor</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Tipo de Pago</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Subtotal</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">IVA</th>
                      <th 
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total
                          {sortColumn === 'total' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Usuario</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedFacturas.map((factura) => (
                      <tr key={factura.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Receipt size={20} className="text-primary" />
                            </div>
                            <span className="text-foreground">{factura.numeroFactura}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.fecha}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-foreground">{factura.asesorNombre}</div>
                            <div className="text-xs text-muted-foreground capitalize">({factura.asesorTipo})</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            factura.tipoPago === 'Contado' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {factura.tipoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {factura.subtotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {factura.iva.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary text-right font-mono">
                          <strong>{factura.total.toFixed(2)}</strong>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.usuarioGenero}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<Eye size={16} />}
                              onClick={() => handleViewDetail(factura)}
                            >
                              Ver Detalle
                            </MaterialButton>
                            {factura.tipoPago === 'Crédito' && (
                              <MaterialButton
                                variant="text"
                                color="primary"
                                startIcon={<CreditCard size={16} />}
                                onClick={() => handleGenerarCobro(factura.id)}
                              >
                                Generar Cobro
                              </MaterialButton>
                            )}
                          </div>
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
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedFacturas.length)} de {sortedFacturas.length} facturas
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
            <Receipt size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay facturas registradas</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'No se encontraron facturas con los filtros aplicados'
                : 'Comience creando una nueva factura'}
            </p>
            {!searchTerm && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Crear Primera Factura
              </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}