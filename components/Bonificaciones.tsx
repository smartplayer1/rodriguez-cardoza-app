import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { Award, TrendingUp, User, MapPin, Package, ChevronDown, ChevronUp, Check, Clock, Search, ChevronLeft, ChevronRight, Truck, FileText, CheckCircle } from 'lucide-react';

interface PromotorProgreso {
  id: string;
  promotorId: string;
  promotorNombre: string;
  promotorCedula: string;
  sucursalNombre: string;
  reglaId: string;
  reglaNombre: string;
  tipoIncentivo: 'acumulacion-producto' | 'retencion-nuevo-ingreso';
  productosBonificacion: { // NEW: Products to be delivered
    productoId: string;
    productoNombre: string;
    cantidad: number;
  }[];
  productos: {
    productoId: string;
    productoNombre: string;
    cantidadRequerida: number;
    cantidadVendida: number;
    faltante: number;
  }[];
  completado: boolean;
  porcentajeTotal: number;
  estadoEntrega: 'no-entregado' | 'entregado';
  fechaCompletado?: string;
  fechaEntregado?: string;
  facturaId?: string; // NEW: Invoice ID if delivered via invoice
}

export default function Bonificaciones() {
  const [bonificaciones] = useState<PromotorProgreso[]>([
    {
      id: 'bon-1',
      promotorId: 'prom-1',
      promotorNombre: 'Ana María Hernández García',
      promotorCedula: '001-290692-0005F',
      sucursalNombre: 'Sucursal Central Managua',
      reglaId: '1',
      reglaNombre: 'Bonificación Perfumes Premium Diciembre',
      tipoIncentivo: 'acumulacion-producto',
      productosBonificacion: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidad: 10
        }
      ],
      productos: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidadRequerida: 20,
          cantidadVendida: 15,
          faltante: 5
        }
      ],
      completado: false,
      porcentajeTotal: 75,
      estadoEntrega: 'no-entregado'
    },
    {
      id: 'bon-2',
      promotorId: 'prom-2',
      promotorNombre: 'Roberto Carlos Sánchez Torres',
      promotorCedula: '001-100388-0003M',
      sucursalNombre: 'Sucursal León',
      reglaId: '1',
      reglaNombre: 'Bonificación Perfumes Premium Diciembre',
      tipoIncentivo: 'acumulacion-producto',
      productosBonificacion: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidad: 10
        }
      ],
      productos: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidadRequerida: 20,
          cantidadVendida: 20,
          faltante: 0
        }
      ],
      completado: true,
      porcentajeTotal: 100,
      estadoEntrega: 'no-entregado',
      fechaCompletado: '2024-12-08'
    },
    {
      id: 'bon-3',
      promotorId: 'prom-3',
      promotorNombre: 'Carmen Isabel Rojas Mndez',
      promotorCedula: '001-150990-0007K',
      sucursalNombre: 'Sucursal Granada',
      reglaId: '1',
      reglaNombre: 'Bonificación Perfumes Premium Diciembre',
      tipoIncentivo: 'acumulacion-producto',
      productosBonificacion: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidad: 10
        }
      ],
      productos: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidadRequerida: 20,
          cantidadVendida: 20,
          faltante: 0
        }
      ],
      completado: true,
      porcentajeTotal: 100,
      estadoEntrega: 'entregado',
      fechaCompletado: '2024-12-01',
      fechaEntregado: '2024-12-03'
    },
    {
      id: 'bon-4',
      promotorId: 'prom-4',
      promotorNombre: 'Luis Fernando Ortiz Díaz',
      promotorCedula: '001-050785-0002P',
      sucursalNombre: 'Sucursal Central Managua',
      reglaId: '1',
      reglaNombre: 'Bonificación Perfumes Premium Diciembre',
      tipoIncentivo: 'acumulacion-producto',
      productosBonificacion: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidad: 10
        }
      ],
      productos: [
        {
          productoId: '1',
          productoNombre: 'Chanel No. 5 Eau de Parfum',
          cantidadRequerida: 20,
          cantidadVendida: 8,
          faltante: 12
        }
      ],
      completado: false,
      porcentajeTotal: 40,
      estadoEntrega: 'no-entregado'
    },
    {
      id: 'bon-5',
      promotorId: 'prom-5',
      promotorNombre: 'Sofía Daniela Gutiérrez López',
      promotorCedula: '001-200892-0009T',
      sucursalNombre: 'Sucursal Masaya',
      reglaId: '2',
      reglaNombre: 'Retención Cliente Nuevo VIP',
      tipoIncentivo: 'retencion-nuevo-ingreso',
      productosBonificacion: [
        {
          productoId: '5',
          productoNombre: 'Perfume Dior Sauvage',
          cantidad: 5
        }
      ],
      productos: [
        {
          productoId: '5',
          productoNombre: 'Perfume Dior Sauvage',
          cantidadRequerida: 10,
          cantidadVendida: 10,
          faltante: 0
        }
      ],
      completado: true,
      porcentajeTotal: 100,
      estadoEntrega: 'no-entregado',
      fechaCompletado: '2024-12-20'
    },
    {
      id: 'bon-6',
      promotorId: 'prom-6',
      promotorNombre: 'Diego Alejandro Vargas Cruz',
      promotorCedula: '001-310588-0011B',
      sucursalNombre: 'Sucursal León',
      reglaId: '2',
      reglaNombre: 'Retención Cliente Nuevo VIP',
      tipoIncentivo: 'retencion-nuevo-ingreso',
      productosBonificacion: [
        {
          productoId: '5',
          productoNombre: 'Perfume Dior Sauvage',
          cantidad: 5
        }
      ],
      productos: [
        {
          productoId: '5',
          productoNombre: 'Perfume Dior Sauvage',
          cantidadRequerida: 10,
          cantidadVendida: 6,
          faltante: 4
        }
      ],
      completado: false,
      porcentajeTotal: 60,
      estadoEntrega: 'no-entregado'
    }
  ]);

  // Table state
  const [searchPromotor, setSearchPromotor] = useState('');
  const [searchRegla, setSearchRegla] = useState('');
  const [searchSucursal, setSearchSucursal] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterEntrega, setFilterEntrega] = useState<string>('');
  const [filterTipoIncentivo, setFilterTipoIncentivo] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Deliver modal state
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [selectedBonificacion, setSelectedBonificacion] = useState<PromotorProgreso | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter data
  let filteredData = bonificaciones.filter(bon => {
    const matchPromotor = searchPromotor === '' || 
      bon.promotorNombre.toLowerCase().includes(searchPromotor.toLowerCase()) ||
      bon.promotorCedula.includes(searchPromotor);
    const matchRegla = searchRegla === '' || 
      bon.reglaNombre.toLowerCase().includes(searchRegla.toLowerCase());
    const matchSucursal = searchSucursal === '' || 
      bon.sucursalNombre.toLowerCase().includes(searchSucursal.toLowerCase());
    const matchEstado = filterEstado === '' || 
      (filterEstado === 'completado' && bon.completado) ||
      (filterEstado === 'en-progreso' && !bon.completado);
    const matchEntrega = filterEntrega === '' || bon.estadoEntrega === filterEntrega;
    const matchTipoIncentivo = filterTipoIncentivo === '' || bon.tipoIncentivo === filterTipoIncentivo;

    return matchPromotor && matchRegla && matchSucursal && matchEstado && matchEntrega && matchTipoIncentivo;
  });

  // Sort data
  if (sortField) {
    filteredData = [...filteredData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'promotor':
          aValue = a.promotorNombre;
          bValue = b.promotorNombre;
          break;
        case 'regla':
          aValue = a.reglaNombre;
          bValue = b.reglaNombre;
          break;
        case 'sucursal':
          aValue = a.sucursalNombre;
          bValue = b.sucursalNombre;
          break;
        case 'tipoIncentivo':
          aValue = a.tipoIncentivo;
          bValue = b.tipoIncentivo;
          break;
        case 'progreso':
          aValue = a.porcentajeTotal;
          bValue = b.porcentajeTotal;
          break;
        case 'estado':
          aValue = a.completado ? 1 : 0;
          bValue = b.completado ? 1 : 0;
          break;
        case 'entrega':
          aValue = a.estadoEntrega === 'entregado' ? 1 : 0;
          bValue = b.estadoEntrega === 'entregado' ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  // Handle delivery status change
  const handleMarcarEntregado = (bonificacionId: string) => {
    const bonificacion = bonificaciones.find(b => b.id === bonificacionId);
    if (!bonificacion?.completado) {
      alert('No se puede marcar como entregado. El promotor aún no ha completado todos los requisitos.');
      return;
    }
    alert(`Bonificación marcada como entregada para ${bonificacion.promotorNombre}`);
    // In a real app, this would update the backend
  };

  // Handle Deliver action - Generate invoice
  const handleDeliver = (bonificacionId: string) => {
    const bonificacion = bonificaciones.find(b => b.id === bonificacionId);
    if (!bonificacion?.completado) {
      alert('No se puede entregar. El promotor aún no ha completado todos los requisitos.');
      return;
    }
    setSelectedBonificacion(bonificacion);
    setShowDeliverModal(true);
  };

  const confirmDeliver = () => {
    if (!selectedBonificacion) return;
    
    setGeneratingInvoice(true);
    
    // Simulate invoice generation
    setTimeout(() => {
      const invoiceNumber = `BON-FACT-${Date.now()}`;
      
      // In a real app, this would:
      // 1. Create a new invoice in the Facturacion module
      // 2. Add bonification products as line items with 0 cost
      // 3. Update bonification status to 'entregado'
      // 4. Record the invoice ID
      
      setGeneratingInvoice(false);
      setShowDeliverModal(false);
      setSelectedBonificacion(null);
      
      // Show success message
      alert(`¡Factura generada exitosamente!\n\nNúmero de Factura: ${invoiceNumber}\n\nLa bonificación ha sido entregada a ${selectedBonificacion.promotorNombre}.\nTodos los productos han sido agregados a la factura con costo $0.00.`);
    }, 1500);
  };

  const cancelDeliver = () => {
    setShowDeliverModal(false);
    setSelectedBonificacion(null);
  };

  const getProgressBarColor = (porcentaje: number) => {
    if (porcentaje >= 100) return 'bg-green-500';
    if (porcentaje >= 75) return 'bg-blue-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp size={14} className="text-muted-foreground opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? 
      <ChevronUp size={14} className="text-primary" /> : 
      <ChevronDown size={14} className="text-primary" />;
  };

  return (
    <div className="p-6">
      <div className="max-w-full mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface elevation-2 rounded p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Bonificaciones</p>
            <p className="text-2xl text-foreground">{bonificaciones.length}</p>
          </div>
          <div className="bg-green-50 elevation-2 rounded p-4">
            <p className="text-xs text-green-700 mb-1">Completadas</p>
            <p className="text-2xl text-green-700">
              {bonificaciones.filter(b => b.completado).length}
            </p>
          </div>
          <div className="bg-blue-50 elevation-2 rounded p-4">
            <p className="text-xs text-blue-700 mb-1">Entregadas</p>
            <p className="text-2xl text-blue-700">
              {bonificaciones.filter(b => b.estadoEntrega === 'entregado').length}
            </p>
          </div>
          <div className="bg-yellow-50 elevation-2 rounded p-4">
            <p className="text-xs text-yellow-700 mb-1">En Progreso</p>
            <p className="text-2xl text-yellow-700">
              {bonificaciones.filter(b => !b.completado).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded elevation-2 overflow-hidden">
          {/* Filters Toggle */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-foreground">Lista de Bonificaciones por Promotor</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <Search size={16} />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-muted/30 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Buscar promotor..."
                  value={searchPromotor}
                  onChange={(e) => setSearchPromotor(e.target.value)}
                  className="px-3 py-2 bg-input-background border-b-2 border-border rounded-t text-sm"
                />
                <input
                  type="text"
                  placeholder="Buscar regla..."
                  value={searchRegla}
                  onChange={(e) => setSearchRegla(e.target.value)}
                  className="px-3 py-2 bg-input-background border-b-2 border-border rounded-t text-sm"
                />
                <input
                  type="text"
                  placeholder="Buscar sucursal..."
                  value={searchSucursal}
                  onChange={(e) => setSearchSucursal(e.target.value)}
                  className="px-3 py-2 bg-input-background border-b-2 border-border rounded-t text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filterTipoIncentivo}
                  onChange={(e) => setFilterTipoIncentivo(e.target.value)}
                  className="px-3 py-2 bg-input-background border-b-2 border-border rounded-t text-sm"
                >
                  <option value="">Todos los tipos de incentivo</option>
                  <option value="acumulacion-producto">Incentivo por Acumulación de Producto</option>
                  <option value="retencion-nuevo-ingreso">Incentivo Por Retención de Nuevo Ingreso</option>
                </select>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="px-3 py-2 bg-input-background border-b-2 border-border rounded-t text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="completado">Completado</option>
                  <option value="en-progreso">En Progreso</option>
                </select>
                <select
                  value={filterEntrega}
                  onChange={(e) => setFilterEntrega(e.target.value)}
                  className="px-3 py-2 bg-input-background border-b-2 border-border rounded-t text-sm"
                >
                  <option value="">Todos los estados de entrega</option>
                  <option value="no-entregado">No Entregado</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('promotor')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Promotor
                      <SortIcon field="promotor" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('regla')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Regla
                      <SortIcon field="regla" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('sucursal')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Sucursal
                      <SortIcon field="sucursal" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('tipoIncentivo')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Tipo Incentivo
                      <SortIcon field="tipoIncentivo" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('progreso')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Progreso
                      <SortIcon field="progreso" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('estado')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Estado
                      <SortIcon field="estado" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      onClick={() => handleSort('entrega')}
                      className="flex items-center gap-1 text-sm text-foreground hover:text-primary group"
                    >
                      Entrega
                      <SortIcon field="entrega" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.map((bon) => (
                  <React.Fragment key={bon.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-foreground text-sm">{bon.promotorNombre}</div>
                          <div className="text-xs text-muted-foreground">{bon.promotorCedula}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-foreground">{bon.reglaNombre}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-primary" />
                          <span className="text-sm text-foreground">{bon.sucursalNombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                          bon.tipoIncentivo === 'acumulacion-producto'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {bon.tipoIncentivo === 'acumulacion-producto'
                            ? 'Acumulación de Producto'
                            : 'Retención de Nuevo Ingreso'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground">{bon.porcentajeTotal}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${getProgressBarColor(bon.porcentajeTotal)} transition-all duration-500`}
                              style={{ width: `${bon.porcentajeTotal}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                          bon.completado 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {bon.completado ? 'Completado' : 'En Progreso'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          bon.estadoEntrega === 'entregado'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {bon.estadoEntrega === 'entregado' ? (
                            <><Check size={12} /> Entregado</>
                          ) : (
                            <><Clock size={12} /> No Entregado</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setExpandedRow(expandedRow === bon.id ? null : bon.id)}
                            className="text-primary text-sm hover:underline"
                          >
                            {expandedRow === bon.id ? 'Ocultar' : 'Ver Detalle'}
                          </button>
                          {bon.completado && bon.estadoEntrega === 'no-entregado' && (
                            <MaterialButton
                              variant="contained"
                              color="primary"
                              startIcon={<Truck size={16} />}
                              onClick={() => handleDeliver(bon.id)}
                            >
                              Entregar
                            </MaterialButton>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedRow === bon.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-muted/20">
                          <div className="space-y-4">
                            <h4 className="text-sm text-foreground mb-3">Detalle de Productos:</h4>
                            {bon.productos.map(producto => {
                              const porcentaje = (producto.cantidadVendida / producto.cantidadRequerida) * 100;
                              return (
                                <div key={producto.productoId} className="bg-surface rounded p-4 elevation-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Package size={20} className="text-primary flex-shrink-0" />
                                      <div>
                                        <p className="text-sm text-foreground">{producto.productoNombre}</p>
                                        <p className="text-xs text-primary mt-1">
                                          Progreso: <span className="font-medium">{producto.cantidadVendida}</span> unidades vendidas / {producto.cantidadRequerida} unidades requeridas
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {producto.faltante > 0 ? (
                                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">
                                          Faltan: {producto.faltante} unidades
                                        </div>
                                      ) : (
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                          <Check size={14} />
                                          Completo
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Product Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full ${getProgressBarColor(porcentaje)} transition-all duration-500`}
                                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Completion Info */}
                            {bon.completado && (
                              <div className={`${
                                bon.estadoEntrega === 'entregado' 
                                  ? 'bg-blue-50 border-blue-200' 
                                  : 'bg-green-50 border-green-200'
                              } border rounded p-4 flex items-center gap-3`}>
                                <Award size={24} className={
                                  bon.estadoEntrega === 'entregado' ? 'text-blue-700' : 'text-green-700'
                                } />
                                <div>
                                  <p className={`text-sm ${
                                    bon.estadoEntrega === 'entregado' ? 'text-blue-700' : 'text-green-700'
                                  }`}>
                                    {bon.estadoEntrega === 'entregado' 
                                      ? '¡Bonificación Entregada!' 
                                      : '¡Bonificación Completada!'}
                                  </p>
                                  <p className={`text-xs mt-1 ${
                                    bon.estadoEntrega === 'entregado' ? 'text-blue-600' : 'text-green-600'
                                  }`}>
                                    {bon.estadoEntrega === 'entregado'
                                      ? `Entregada el ${bon.fechaEntregado}`
                                      : `Completada el ${bon.fechaCompletado} - Pendiente de entrega`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filas por página:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-border rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted-foreground ml-4">
                Mostrando {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredData.length)} de {filteredData.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first, last, current, and neighbors
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === page
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2 text-muted-foreground">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deliver Modal */}
      {showDeliverModal && selectedBonificacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded elevation-3 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-foreground mb-2">Entregar Bonificación</h2>
                <p className="text-sm text-muted-foreground">
                  Se generará una factura automática con los productos de la bonificación
                </p>
              </div>
              <FileText size={32} className="text-primary" />
            </div>

            {/* Promoter Info */}
            <div className="bg-blue-50 rounded p-4 mb-6">
              <p className="text-xs text-blue-700 mb-2">Asesor de Ventas</p>
              <div className="flex items-center gap-3">
                <User size={20} className="text-blue-700" />
                <div>
                  <p className="text-sm text-foreground">{selectedBonificacion.promotorNombre}</p>
                  <p className="text-xs text-muted-foreground">{selectedBonificacion.promotorCedula}</p>
                </div>
              </div>
            </div>

            {/* Bonification Rule */}
            <div className="bg-green-50 rounded p-4 mb-6">
              <p className="text-xs text-green-700 mb-2">Regla de Bonificación</p>
              <div className="flex items-center gap-3">
                <Award size={20} className="text-green-700" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{selectedBonificacion.reglaNombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Completada el {selectedBonificacion.fechaCompletado}
                  </p>
                </div>
              </div>
            </div>

            {/* Products to be invoiced */}
            <div className="mb-6">
              <h3 className="text-foreground mb-3 flex items-center gap-2">
                <Package size={20} className="text-primary" />
                Productos a Facturar
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Los siguientes productos se agregarán a la factura con costo $0.00
              </p>
              
              <div className="space-y-3">
                {selectedBonificacion.productosBonificacion.map((producto, index) => (
                  <div key={index} className="bg-muted/30 rounded p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package size={18} className="text-primary" />
                      <div>
                        <p className="text-sm text-foreground">{producto.productoNombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Cantidad: {producto.cantidad} {producto.cantidad === 1 ? 'unidad' : 'unidades'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-700">$0.00</p>
                      <p className="text-xs text-muted-foreground">Bonificación</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground mb-2">
                    Al confirmar, se realizarán las siguientes acciones:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Se creará una factura automática</li>
                    <li>✓ Se agregarán {selectedBonificacion.productosBonificacion.length} {selectedBonificacion.productosBonificacion.length === 1 ? 'producto' : 'productos'} con costo $0.00</li>
                    <li>✓ La bonificación se marcará como "Entregada"</li>
                    <li>✓ Se generará un número de factura único</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={cancelDeliver}
                disabled={generatingInvoice}
              >
                Cancelar
              </MaterialButton>
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={generatingInvoice ? null : <FileText size={18} />}
                onClick={confirmDeliver}
                disabled={generatingInvoice}
              >
                {generatingInvoice ? 'Generando Factura...' : 'Generar Factura y Entregar'}
              </MaterialButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}