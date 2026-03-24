import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Gift, Plus, Edit, Trash2, Save, X, Eye, Settings, Award, Package, TrendingUp, DollarSign, ChevronDown, Search, Filter, CheckCircle, Clock, AlertCircle, Calendar, Ticket } from 'lucide-react';

// ==================== INTERFACES ====================
interface ProductoCondicion {
  productoId: string;
  productoNombre: string;
  cantidadMinima: number;
}

interface ProductoIncentivo {
  productoId: string;
  productoNombre: string;
  cantidad: number;
}

interface CuponIncentivo {
  cuponId: string;
  cuponNombre: string;
  monto: number;
}

interface ReglaIncentivo {
  id: string;
  nombre: string;
  descripcion: string;
  tipoRegla: 'productos' | 'monto';
  activa: boolean;
  fechaInicio: string;
  fechaFin: string;
  // Condiciones por productos
  productosCondicion?: ProductoCondicion[];
  // Condiciones por monto
  montoMinimo?: number;
  moneda?: string;
  // Premios del incentivo (puede incluir ambos)
  productosIncentivo: ProductoIncentivo[];
  cuponesIncentivo: CuponIncentivo[];
  createdAt: string;
}

interface IncentivoGenerado {
  id: string;
  reglaId: string;
  reglaNombre: string;
  asesorId: string;
  asesorNombre: string;
  fechaGeneracion: string;
  fechaEntrega?: string;
  estado: 'generado' | 'pendiente' | 'entregado';
  productosIncentivo: ProductoIncentivo[];
  cuponesIncentivo: CuponIncentivo[];
  // Datos de cumplimiento
  tipoCumplimiento: 'productos' | 'monto';
  montoComprado?: number;
  productosComprados?: ProductoCondicion[];
}

// ==================== MOCK DATA ====================
const articulosDisponibles = [
  { id: '1', nombre: 'Chanel No. 5 Eau de Parfum', codigo: 'PERF-001' },
  { id: '2', nombre: 'Set de Brochas Profesional', codigo: 'ACC-002' },
  { id: '3', nombre: 'Serum Vitamina C Anti-Edad', codigo: 'SKIN-003' },
  { id: '4', nombre: 'Paleta de Sombras Nude', codigo: 'MAQ-004' },
  { id: '5', nombre: 'Perfume Dior Sauvage', codigo: 'PERF-005' },
  { id: '6', nombre: 'Crema Hidratante La Mer', codigo: 'SKIN-006' },
  { id: '7', nombre: 'Labial Mate Ruby Woo', codigo: 'MAQ-007' },
  { id: '8', nombre: 'Perfume Versace Eros', codigo: 'PERF-008' }
];

const cuponesDisponibles = [
  { id: '1', nombre: 'Cupón Bienvenida $500', monto: 500 },
  { id: '2', nombre: 'Cupón Descuento $250', monto: 250 },
  { id: '3', nombre: 'Cupón VIP $1000', monto: 1000 }
];

const asesoresDisponibles = [
  { id: '1', nombre: 'Carlos Hernández', tipo: 'Promotor' },
  { id: '2', nombre: 'María García', tipo: 'Promotor' },
  { id: '3', nombre: 'Luis Rodríguez', tipo: 'Asesor' },
  { id: '4', nombre: 'Ana Martínez', tipo: 'Promotor' },
  { id: '5', nombre: 'Roberto Sánchez', tipo: 'Asesor' }
];

export default function IncentivoRetencionNuevosIngresos() {
  const [activeView, setActiveView] = useState<'reglas' | 'incentivos-generados'>('reglas');

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={32} className="text-primary" />
            <h2 className="text-foreground">Incentivo Por Retención de Nuevo Ingreso</h2>
          </div>
          <p className="text-muted-foreground">
            Configure reglas automáticas de incentivos y gestione incentivos generados
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-surface rounded elevation-2 mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveView('reglas')}
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                activeView === 'reglas'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings size={20} />
              <span>Reglas de Incentivos</span>
              {activeView === 'reglas' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveView('incentivos-generados')}
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                activeView === 'incentivos-generados'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award size={20} />
              <span>Incentivos Generados</span>
              {activeView === 'incentivos-generados' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeView === 'reglas' ? <ReglasIncentivos /> : <IncentivosGenerados />}
      </div>
    </div>
  );
}

// ==================== REGLAS DE INCENTIVOS ====================
function ReglasIncentivos() {
  const [reglas, setReglas] = useState<ReglaIncentivo[]>([
    {
      id: '1',
      nombre: 'Compra de Perfumes Premium',
      descripcion: 'Comprar 5 unidades de perfumes premium',
      tipoRegla: 'productos',
      activa: true,
      fechaInicio: '2024-12-01',
      fechaFin: '2024-12-31',
      productosCondicion: [
        { productoId: '1', productoNombre: 'Chanel No. 5 Eau de Parfum', cantidadMinima: 3 },
        { productoId: '5', productoNombre: 'Perfume Dior Sauvage', cantidadMinima: 2 }
      ],
      productosIncentivo: [
        { productoId: '2', productoNombre: 'Set de Brochas Profesional', cantidad: 1 }
      ],
      createdAt: '2024-12-01'
    },
    {
      id: '2',
      nombre: 'Meta de Ventas $5,000',
      descripcion: 'Alcanzar ventas de $5,000 en el mes',
      tipoRegla: 'monto',
      activa: true,
      fechaInicio: '2024-12-01',
      fechaFin: '2025-01-31',
      montoMinimo: 5000,
      moneda: 'USD',
      productosIncentivo: [
        { productoId: '1', productoNombre: 'Chanel No. 5 Eau de Parfum', cantidad: 1 },
        { productoId: '7', productoNombre: 'Labial Mate Ruby Woo', cantidad: 2 }
      ],
      createdAt: '2024-12-05'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaIncentivo | null>(null);
  const [viewingRegla, setViewingRegla] = useState<ReglaIncentivo | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoRegla: 'productos' as 'productos' | 'monto',
    activa: true,
    fechaInicio: '',
    fechaFin: '',
    montoMinimo: 0,
    moneda: 'USD'
  });

  const [productosCondicion, setProductosCondicion] = useState<ProductoCondicion[]>([]);
  const [productosIncentivo, setProductosIncentivo] = useState<ProductoIncentivo[]>([]);

  // Form states for adding products
  const [showAddCondicion, setShowAddCondicion] = useState(false);
  const [showAddIncentivo, setShowAddIncentivo] = useState(false);
  const [selectedProductoCondicion, setSelectedProductoCondicion] = useState('');
  const [cantidadCondicion, setCantidadCondicion] = useState(1);
  const [selectedProductoIncentivo, setSelectedProductoIncentivo] = useState('');
  const [cantidadIncentivo, setCantidadIncentivo] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'activa' | 'inactiva'>('all');

  const handleCreate = () => {
    setEditingRegla(null);
    setFormData({
      nombre: '',
      descripcion: '',
      tipoRegla: 'productos',
      activa: true,
      fechaInicio: '',
      fechaFin: '',
      montoMinimo: 0,
      moneda: 'USD'
    });
    setProductosCondicion([]);
    setProductosIncentivo([]);
    setShowCreateEdit(true);
  };

  const handleEdit = (regla: ReglaIncentivo) => {
    setEditingRegla(regla);
    setFormData({
      nombre: regla.nombre,
      descripcion: regla.descripcion,
      tipoRegla: regla.tipoRegla,
      activa: regla.activa,
      fechaInicio: regla.fechaInicio,
      fechaFin: regla.fechaFin,
      montoMinimo: regla.montoMinimo || 0,
      moneda: regla.moneda || 'USD'
    });
    setProductosCondicion(regla.productosCondicion || []);
    setProductosIncentivo(regla.productosIncentivo);
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre de la regla');
      return;
    }

    if (!formData.fechaInicio) {
      alert('Por favor ingrese la fecha de inicio');
      return;
    }

    if (!formData.fechaFin) {
      alert('Por favor ingrese la fecha de fin');
      return;
    }

    if (formData.fechaFin < formData.fechaInicio) {
      alert('La fecha de fin debe ser mayor o igual a la fecha de inicio');
      return;
    }

    if (formData.tipoRegla === 'productos' && productosCondicion.length === 0) {
      alert('Por favor agregue al menos un producto con condición');
      return;
    }

    if (formData.tipoRegla === 'monto' && formData.montoMinimo <= 0) {
      alert('Por favor ingrese un monto mínimo válido');
      return;
    }

    if (productosIncentivo.length === 0) {
      alert('Por favor agregue al menos un producto como incentivo');
      return;
    }

    const nuevaRegla: ReglaIncentivo = {
      id: editingRegla?.id || Date.now().toString(),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipoRegla: formData.tipoRegla,
      activa: formData.activa,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      productosCondicion: formData.tipoRegla === 'productos' ? productosCondicion : undefined,
      montoMinimo: formData.tipoRegla === 'monto' ? formData.montoMinimo : undefined,
      moneda: formData.tipoRegla === 'monto' ? formData.moneda : undefined,
      productosIncentivo,
      createdAt: editingRegla?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (editingRegla) {
      setReglas(reglas.map(r => r.id === editingRegla.id ? nuevaRegla : r));
    } else {
      setReglas([...reglas, nuevaRegla]);
    }

    setShowCreateEdit(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta regla de incentivo?')) {
      setReglas(reglas.filter(r => r.id !== id));
    }
  };

  const handleToggleActiva = (id: string) => {
    setReglas(reglas.map(r => r.id === id ? { ...r, activa: !r.activa } : r));
  };

  const addProductoCondicion = () => {
    if (!selectedProductoCondicion || cantidadCondicion <= 0) {
      alert('Seleccione un producto y cantidad válida');
      return;
    }

    const producto = articulosDisponibles.find(a => a.id === selectedProductoCondicion);
    if (!producto) return;

    const exists = productosCondicion.find(p => p.productoId === selectedProductoCondicion);
    if (exists) {
      alert('Este producto ya está agregado');
      return;
    }

    setProductosCondicion([
      ...productosCondicion,
      {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidadMinima: cantidadCondicion
      }
    ]);

    setSelectedProductoCondicion('');
    setCantidadCondicion(1);
    setShowAddCondicion(false);
  };

  const removeProductoCondicion = (productoId: string) => {
    setProductosCondicion(productosCondicion.filter(p => p.productoId !== productoId));
  };

  const addProductoIncentivo = () => {
    if (!selectedProductoIncentivo || cantidadIncentivo <= 0) {
      alert('Seleccione un producto y cantidad válida');
      return;
    }

    const producto = articulosDisponibles.find(a => a.id === selectedProductoIncentivo);
    if (!producto) return;

    const exists = productosIncentivo.find(p => p.productoId === selectedProductoIncentivo);
    if (exists) {
      alert('Este producto ya está agregado');
      return;
    }

    setProductosIncentivo([
      ...productosIncentivo,
      {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: cantidadIncentivo
      }
    ]);

    setSelectedProductoIncentivo('');
    setCantidadIncentivo(1);
    setShowAddIncentivo(false);
  };

  const removeProductoIncentivo = (productoId: string) => {
    setProductosIncentivo(productosIncentivo.filter(p => p.productoId !== productoId));
  };

  // Filtering
  const filteredReglas = reglas.filter(regla => {
    const matchesSearch = regla.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          regla.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || 
                          (filterEstado === 'activa' && regla.activa) ||
                          (filterEstado === 'inactiva' && !regla.activa);
    return matchesSearch && matchesEstado;
  });

  // View Detail Modal
  if (viewingRegla) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg elevation-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-primary" />
                <h3 className="text-foreground">Detalle de Regla de Incentivo</h3>
              </div>
              <button
                onClick={() => setViewingRegla(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Información Básica</h4>
                <div className="bg-muted/30 rounded p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nombre:</span>
                    <span className="text-foreground">{viewingRegla.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Descripción:</span>
                    <span className="text-foreground">{viewingRegla.descripcion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo de Regla:</span>
                    <div className="flex items-center gap-2">
                      {viewingRegla.tipoRegla === 'productos' ? (
                        <Package size={16} className="text-primary" />
                      ) : (
                        <DollarSign size={16} className="text-green-600" />
                      )}
                      <span className="text-foreground">
                        {viewingRegla.tipoRegla === 'productos' ? 'Por Productos' : 'Por Monto'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Periodo de Vigencia:</span>
                    <span className="text-foreground">
                      {viewingRegla.fechaInicio} al {viewingRegla.fechaFin}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      viewingRegla.activa
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingRegla.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condiciones */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Condiciones de Cumplimiento</h4>
                <div className="bg-muted/30 rounded p-4">
                  {viewingRegla.tipoRegla === 'productos' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground mb-3">Productos Requeridos:</p>
                      {viewingRegla.productosCondicion?.map((producto, index) => (
                        <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            <span className="text-sm text-foreground">{producto.productoNombre}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Cantidad mínima: <span className="text-foreground font-mono">{producto.cantidadMinima}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Monto Mínimo de Compra:</span>
                      <span className="text-lg text-green-600 font-mono">
                        {viewingRegla.moneda} {viewingRegla.montoMinimo?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos del Incentivo */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Productos del Incentivo</h4>
                <div className="bg-muted/30 rounded p-4 space-y-2">
                  {viewingRegla.productosIncentivo.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-primary" />
                        <span className="text-sm text-foreground">{producto.productoNombre}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Cantidad: <span className="text-foreground font-mono">{producto.cantidad}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={() => setViewingRegla(null)}
              >
                Cerrar
              </MaterialButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Form
  if (showCreateEdit) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-foreground">
            {editingRegla ? 'Editar Regla de Incentivo' : 'Nueva Regla de Incentivo'}
          </h3>
          <MaterialButton
            variant="text"
            color="secondary"
            startIcon={<X size={18} />}
            onClick={() => setShowCreateEdit(false)}
          >
            Cancelar
          </MaterialButton>
        </div>

        <div className="bg-surface rounded elevation-2 p-6">
          <div className="space-y-6">
            {/* Información Básica */}
            <div>
              <h4 className="text-foreground mb-4">Información Básica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MaterialInput
                  label="Nombre de la Regla *"
                  fullWidth
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Compra de Perfumes Premium"
                />

                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Tipo de Regla *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tipoRegla}
                      onChange={(e) => setFormData({ ...formData, tipoRegla: e.target.value as 'productos' | 'monto' })}
                      className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                               focus:border-primary rounded-t transition-colors outline-none appearance-none"
                    >
                      <option value="productos">Por Volumen de Productos</option>
                      <option value="monto">Por Monto Total Comprado</option>
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <MaterialInput
                  label="Fecha de Inicio *"
                  type="date"
                  fullWidth
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                />

                <MaterialInput
                  label="Fecha de Fin *"
                  type="date"
                  fullWidth
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  min={formData.fechaInicio}
                />

                <div className="md:col-span-2">
                  <label className="text-sm text-foreground mb-2 block">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none resize-none"
                    rows={3}
                    placeholder="Describa brevemente la regla de incentivo"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="activa" className="text-sm text-foreground">
                    Regla Activa
                  </label>
                </div>
              </div>
            </div>

            {/* Condiciones de Cumplimiento */}
            <div>
              <h4 className="text-foreground mb-4">Condiciones de Cumplimiento</h4>
              <div className="bg-muted/30 rounded p-4">
                {formData.tipoRegla === 'productos' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Package size={16} />
                      <span>El cliente debe adquirir los siguientes productos con las cantidades mínimas:</span>
                    </div>

                    {/* Lista de productos condición */}
                    {productosCondicion.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {productosCondicion.map((producto) => (
                          <div key={producto.productoId} className="flex items-center justify-between bg-surface p-3 rounded">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-primary" />
                              <span className="text-sm text-foreground">{producto.productoNombre}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                Cantidad mínima: <span className="text-foreground font-mono">{producto.cantidadMinima}</span>
                              </span>
                              <button
                                onClick={() => removeProductoCondicion(producto.productoId)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario agregar producto */}
                    {showAddCondicion ? (
                      <div className="bg-surface p-4 rounded border border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm text-foreground mb-2 block">
                              Producto *
                            </label>
                            <div className="relative">
                              <select
                                value={selectedProductoCondicion}
                                onChange={(e) => setSelectedProductoCondicion(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
                              >
                                <option value="">Seleccione un producto</option>
                                {articulosDisponibles
                                  .filter(a => !productosCondicion.find(p => p.productoId === a.id))
                                  .map(articulo => (
                                    <option key={articulo.id} value={articulo.id}>
                                      {articulo.nombre} ({articulo.codigo})
                                    </option>
                                  ))}
                              </select>
                              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>

                          <MaterialInput
                            label="Cantidad Mínima *"
                            type="number"
                            fullWidth
                            value={cantidadCondicion}
                            onChange={(e) => setCantidadCondicion(Number(e.target.value))}
                            min={1}
                          />
                        </div>

                        <div className="flex gap-3">
                          <MaterialButton
                            variant="contained"
                            color="primary"
                            startIcon={<Plus size={18} />}
                            onClick={addProductoCondicion}
                          >
                            Agregar Producto
                          </MaterialButton>
                          <MaterialButton
                            variant="outlined"
                            color="secondary"
                            startIcon={<X size={18} />}
                            onClick={() => {
                              setShowAddCondicion(false);
                              setSelectedProductoCondicion('');
                              setCantidadCondicion(1);
                            }}
                          >
                            Cancelar
                          </MaterialButton>
                        </div>
                      </div>
                    ) : (
                      <MaterialButton
                        variant="outlined"
                        color="primary"
                        startIcon={<Plus size={18} />}
                        onClick={() => setShowAddCondicion(true)}
                      >
                        Agregar Producto Condición
                      </MaterialButton>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <DollarSign size={16} />
                      <span>El cliente debe alcanzar el siguiente monto mínimo de compra:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MaterialInput
                        label="Monto Mínimo *"
                        type="number"
                        fullWidth
                        value={formData.montoMinimo}
                        onChange={(e) => setFormData({ ...formData, montoMinimo: Number(e.target.value) })}
                        min={0}
                        step={0.01}
                      />

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
                          >
                            <option value="USD">USD (Dólar)</option>
                            <option value="NIO">NIO (Córdoba)</option>
                          </select>
                          <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {formData.montoMinimo > 0 && (
                      <div className="bg-primary/10 border border-primary/20 rounded p-4">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <TrendingUp size={16} />
                          <span className="text-sm">Meta de Compra:</span>
                        </div>
                        <p className="text-2xl text-foreground font-mono">
                          {formData.moneda} {formData.montoMinimo.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Productos del Incentivo */}
            <div>
              <h4 className="text-foreground mb-4">Productos del Incentivo</h4>
              <div className="bg-muted/30 rounded p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Gift size={16} />
                  <span>Productos que se entregarán al cumplir la condición:</span>
                </div>

                {/* Lista de productos incentivo */}
                {productosIncentivo.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {productosIncentivo.map((producto) => (
                      <div key={producto.productoId} className="flex items-center justify-between bg-surface p-3 rounded">
                        <div className="flex items-center gap-2">
                          <Gift size={16} className="text-primary" />
                          <span className="text-sm text-foreground">{producto.productoNombre}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            Cantidad: <span className="text-foreground font-mono">{producto.cantidad}</span>
                          </span>
                          <button
                            onClick={() => removeProductoIncentivo(producto.productoId)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario agregar producto */}
                {showAddIncentivo ? (
                  <div className="bg-surface p-4 rounded border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-foreground mb-2 block">
                          Producto *
                        </label>
                        <div className="relative">
                          <select
                            value={selectedProductoIncentivo}
                            onChange={(e) => setSelectedProductoIncentivo(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                     focus:border-primary rounded-t transition-colors outline-none appearance-none"
                          >
                            <option value="">Seleccione un producto</option>
                            {articulosDisponibles
                              .filter(a => !productosIncentivo.find(p => p.productoId === a.id))
                              .map(articulo => (
                                <option key={articulo.id} value={articulo.id}>
                                  {articulo.nombre} ({articulo.codigo})
                                </option>
                              ))}
                          </select>
                          <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <MaterialInput
                        label="Cantidad *"
                        type="number"
                        fullWidth
                        value={cantidadIncentivo}
                        onChange={(e) => setCantidadIncentivo(Number(e.target.value))}
                        min={1}
                      />
                    </div>

                    <div className="flex gap-3">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={18} />}
                        onClick={addProductoIncentivo}
                      >
                        Agregar Producto
                      </MaterialButton>
                      <MaterialButton
                        variant="outlined"
                        color="secondary"
                        startIcon={<X size={18} />}
                        onClick={() => {
                          setShowAddIncentivo(false);
                          setSelectedProductoIncentivo('');
                          setCantidadIncentivo(1);
                        }}
                      >
                        Cancelar
                      </MaterialButton>
                    </div>
                  </div>
                ) : (
                  <MaterialButton
                    variant="outlined"
                    color="primary"
                    startIcon={<Plus size={18} />}
                    onClick={() => setShowAddIncentivo(true)}
                  >
                    Agregar Producto Incentivo
                  </MaterialButton>
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
              {editingRegla ? 'Actualizar Regla' : 'Crear Regla'}
            </MaterialButton>
            <MaterialButton
              variant="outlined"
              color="secondary"
              startIcon={<X size={18} />}
              onClick={() => setShowCreateEdit(false)}
            >
              Cancelar
            </MaterialButton>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="pl-10 pr-10 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none appearance-none"
            >
              <option value="all">Todas las reglas</option>
              <option value="activa">Activas</option>
              <option value="inactiva">Inactivas</option>
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Regla
          </MaterialButton>
        </div>
      </div>

      {/* Reglas List */}
      {filteredReglas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredReglas.map((regla) => (
            <div key={regla.id} className="bg-surface rounded elevation-2 p-6 hover:elevation-4 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-foreground">{regla.nombre}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      regla.activa
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {regla.activa ? 'Activa' : 'Inactiva'}
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                      {regla.tipoRegla === 'productos' ? (
                        <>
                          <Package size={14} />
                          <span>Por Productos</span>
                        </>
                      ) : (
                        <>
                          <DollarSign size={14} />
                          <span>Por Monto</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{regla.descripcion}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar size={14} />
                    <span>Vigencia: {regla.fechaInicio} al {regla.fechaFin}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Condiciones */}
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-2">Condiciones:</p>
                      {regla.tipoRegla === 'productos' ? (
                        <div className="space-y-1">
                          {regla.productosCondicion?.map((p, i) => (
                            <div key={i} className="text-xs text-foreground">
                              • {p.productoNombre} (mín: {p.cantidadMinima})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-foreground font-mono">
                          {regla.moneda} {regla.montoMinimo?.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Incentivos */}
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-2">Productos del Incentivo:</p>
                      <div className="space-y-1">
                        {regla.productosIncentivo.map((p, i) => (
                          <div key={i} className="text-xs text-foreground">
                            • {p.productoNombre} (x{p.cantidad})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <MaterialButton
                    variant="text"
                    color="primary"
                    startIcon={<Eye size={16} />}
                    onClick={() => setViewingRegla(regla)}
                  >
                    Ver
                  </MaterialButton>
                  <MaterialButton
                    variant="text"
                    color="primary"
                    startIcon={<Edit size={16} />}
                    onClick={() => handleEdit(regla)}
                  >
                    Editar
                  </MaterialButton>
                  <MaterialButton
                    variant="text"
                    color="secondary"
                    startIcon={regla.activa ? <X size={16} /> : <CheckCircle size={16} />}
                    onClick={() => handleToggleActiva(regla.id)}
                  >
                    {regla.activa ? 'Desactivar' : 'Activar'}
                  </MaterialButton>
                  <button
                    onClick={() => handleDelete(regla.id)}
                    className="text-red-600 hover:text-red-700 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded elevation-2 py-16 text-center">
          <Settings size={64} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-foreground mb-2">No hay reglas de incentivos</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterEstado !== 'all'
              ? 'No se encontraron reglas con los filtros aplicados'
              : 'Comience creando una nueva regla de incentivo'}
          </p>
          {!searchTerm && filterEstado === 'all' && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Regla
            </MaterialButton>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== INCENTIVOS GENERADOS ====================
function IncentivosGenerados() {
  const [incentivos, setIncentivos] = useState<IncentivoGenerado[]>([
    {
      id: '1',
      reglaId: '1',
      reglaNombre: 'Compra de Perfumes Premium',
      asesorId: '1',
      asesorNombre: 'Carlos Hernández',
      fechaGeneracion: '2024-12-15',
      estado: 'pendiente',
      productosIncentivo: [
        { productoId: '2', productoNombre: 'Set de Brochas Profesional', cantidad: 1 }
      ],
      tipoCumplimiento: 'productos',
      productosComprados: [
        { productoId: '1', productoNombre: 'Chanel No. 5 Eau de Parfum', cantidadMinima: 3 },
        { productoId: '5', productoNombre: 'Perfume Dior Sauvage', cantidadMinima: 2 }
      ]
    },
    {
      id: '2',
      reglaId: '2',
      reglaNombre: 'Meta de Ventas $5,000',
      asesorId: '2',
      asesorNombre: 'María García',
      fechaGeneracion: '2024-12-10',
      fechaEntrega: '2024-12-12',
      estado: 'entregado',
      productosIncentivo: [
        { productoId: '1', productoNombre: 'Chanel No. 5 Eau de Parfum', cantidad: 1 },
        { productoId: '7', productoNombre: 'Labial Mate Ruby Woo', cantidad: 2 }
      ],
      tipoCumplimiento: 'monto',
      montoComprado: 5250.00
    },
    {
      id: '3',
      reglaId: '1',
      reglaNombre: 'Compra de Perfumes Premium',
      asesorId: '4',
      asesorNombre: 'Ana Martínez',
      fechaGeneracion: '2024-12-18',
      estado: 'generado',
      productosIncentivo: [
        { productoId: '2', productoNombre: 'Set de Brochas Profesional', cantidad: 1 }
      ],
      tipoCumplimiento: 'productos',
      productosComprados: [
        { productoId: '1', productoNombre: 'Chanel No. 5 Eau de Parfum', cantidadMinima: 3 },
        { productoId: '5', productoNombre: 'Perfume Dior Sauvage', cantidadMinima: 2 }
      ]
    }
  ]);

  const [viewingIncentivo, setViewingIncentivo] = useState<IncentivoGenerado | null>(null);
  const [deliveringIncentivo, setDeliveringIncentivo] = useState<IncentivoGenerado | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'generado' | 'pendiente' | 'entregado'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleMarcarEntregado = (id: string, fechaEntrega: string) => {
    setIncentivos(incentivos.map(inc => 
      inc.id === id 
        ? { ...inc, estado: 'entregado' as const, fechaEntrega }
        : inc
    ));
    setDeliveringIncentivo(null);
  };

  // Filtering
  const filteredIncentivos = incentivos.filter(incentivo => {
    const matchesSearch = incentivo.asesorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          incentivo.reglaNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || incentivo.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const totalPages = Math.ceil(filteredIncentivos.length / rowsPerPage);
  const paginatedIncentivos = filteredIncentivos.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // View Detail Modal
  if (viewingIncentivo) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg elevation-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-primary" />
                <h3 className="text-foreground">Detalle de Incentivo Generado</h3>
              </div>
              <button
                onClick={() => setViewingIncentivo(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información del Asesor */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Información del Asesor</h4>
                <div className="bg-muted/30 rounded p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Asesor:</span>
                    <span className="text-foreground">{viewingIncentivo.asesorNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Regla Aplicada:</span>
                    <span className="text-foreground">{viewingIncentivo.reglaNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      viewingIncentivo.estado === 'entregado'
                        ? 'bg-green-100 text-green-700'
                        : viewingIncentivo.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {viewingIncentivo.estado === 'entregado' ? 'Entregado' :
                       viewingIncentivo.estado === 'pendiente' ? 'Pendiente de Entrega' : 'Generado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fecha de Generación:</span>
                    <span className="text-foreground">{viewingIncentivo.fechaGeneracion}</span>
                  </div>
                  {viewingIncentivo.fechaEntrega && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fecha de Entrega:</span>
                      <span className="text-foreground">{viewingIncentivo.fechaEntrega}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cumplimiento */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Cumplimiento de Condición</h4>
                <div className="bg-muted/30 rounded p-4">
                  {viewingIncentivo.tipoCumplimiento === 'productos' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-foreground mb-3">
                        <Package size={16} className="text-primary" />
                        <span>Productos Comprados:</span>
                      </div>
                      {viewingIncentivo.productosComprados?.map((producto, index) => (
                        <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                          <span className="text-sm text-foreground">{producto.productoNombre}</span>
                          <span className="text-sm text-muted-foreground">
                            Cantidad: <span className="text-foreground font-mono">{producto.cantidadMinima}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="text-sm text-foreground">Monto Total Comprado:</span>
                      </div>
                      <span className="text-lg text-green-600 font-mono">
                        ${viewingIncentivo.montoComprado?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos del Incentivo */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Productos del Incentivo</h4>
                <div className="bg-muted/30 rounded p-4 space-y-2">
                  {viewingIncentivo.productosIncentivo.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-primary" />
                        <span className="text-sm text-foreground">{producto.productoNombre}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Cantidad: <span className="text-foreground font-mono">{producto.cantidad}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {viewingIncentivo.estado !== 'entregado' && (
                <MaterialButton
                  variant="contained"
                  color="primary"
                  startIcon={<CheckCircle size={18} />}
                  onClick={() => {
                    setDeliveringIncentivo(viewingIncentivo);
                    setViewingIncentivo(null);
                  }}
                >
                  Marcar como Entregado
                </MaterialButton>
              )}
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={() => setViewingIncentivo(null)}
              >
                Cerrar
              </MaterialButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Delivering Modal
  if (deliveringIncentivo) {
    const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().split('T')[0]);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg elevation-4 max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={24} className="text-primary" />
              <h3 className="text-foreground">Marcar como Entregado</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Confirma que el incentivo ha sido entregado a <span className="text-foreground">{deliveringIncentivo.asesorNombre}</span>?
              </p>

              <MaterialInput
                label="Fecha de Entrega"
                type="date"
                fullWidth
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />

              <div className="bg-muted/30 rounded p-4">
                <p className="text-xs text-muted-foreground mb-2">Productos a entregar:</p>
                {deliveringIncentivo.productosIncentivo.map((p, i) => (
                  <div key={i} className="text-sm text-foreground">
                    • {p.productoNombre} (x{p.cantidad})
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<CheckCircle size={18} />}
                onClick={() => handleMarcarEntregado(deliveringIncentivo.id, fechaEntrega)}
              >
                Confirmar Entrega
              </MaterialButton>
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={() => setDeliveringIncentivo(null)}
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface rounded elevation-2 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por asesor o regla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none"
            />
          </div>

          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-10 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="generado">Generado</option>
              <option value="pendiente">Pendiente de Entrega</option>
              <option value="entregado">Entregado</option>
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

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
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Incentivos Table */}
      {paginatedIncentivos.length > 0 ? (
        <>
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Asesor</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Regla Aplicada</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Estado</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha Generación</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha Entrega</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Productos</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedIncentivos.map((incentivo) => (
                    <tr key={incentivo.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground">{incentivo.asesorNombre}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{incentivo.reglaNombre}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          incentivo.estado === 'entregado'
                            ? 'bg-green-100 text-green-700'
                            : incentivo.estado === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {incentivo.estado === 'entregado' && <CheckCircle size={12} />}
                          {incentivo.estado === 'pendiente' && <Clock size={12} />}
                          {incentivo.estado === 'generado' && <AlertCircle size={12} />}
                          {incentivo.estado === 'entregado' ? 'Entregado' :
                           incentivo.estado === 'pendiente' ? 'Pendiente' : 'Generado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{incentivo.fechaGeneracion}</td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {incentivo.fechaEntrega || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {incentivo.productosIncentivo.length} producto(s)
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Eye size={16} />}
                            onClick={() => setViewingIncentivo(incentivo)}
                          >
                            Ver Detalle
                          </MaterialButton>
                          {incentivo.estado !== 'entregado' && (
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<CheckCircle size={16} />}
                              onClick={() => setDeliveringIncentivo(incentivo)}
                            >
                              Entregar
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
              Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredIncentivos.length)} de {filteredIncentivos.length} incentivos
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
        <div className="bg-surface rounded elevation-2 py-16 text-center">
          <Award size={64} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-foreground mb-2">No hay incentivos generados</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterEstado !== 'all'
              ? 'No se encontraron incentivos con los filtros aplicados'
              : 'Los incentivos se generarán automáticamente cuando los asesores cumplan las reglas configuradas'}
          </p>
        </div>
      )}
    </div>
  );
}
