import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { FileText, Search, Filter, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X, Eye, CheckSquare, Square } from 'lucide-react';

interface NotaCreditoItem {
  id: string;
  codigoProducto: string;
  nombreProducto: string;
  cantidadFacturada: number;
  cantidadNotaCredito: number;
  precioUnitario: number;
  subtotal: number;
}

interface NotaCredito {
  id: string;
  numeroNota: string;
  asesorId: string;
  asesorNombre: string;
  facturaId: string;
  numeroFactura: string;
  fechaFactura: string;
  fechaNota: string;
  concepto: string;
  sucursalId: string;
  sucursalNombre: string;
  cajaId: string;
  cajaNombre: string;
  comentarios: string;
  items: NotaCreditoItem[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'borrador' | 'emitida' | 'anulada';
}

// Mock data - Asesores (Sales Advisors)
const asesoresData = [
  { id: 'A1', codigo: 'PROM-001', nombre: 'María José López García' },
  { id: 'A2', codigo: 'EMP-001', nombre: 'Roberto García Sánchez' },
  { id: 'A3', codigo: 'PROM-002', nombre: 'Patricia López Rodríguez' },
  { id: 'A4', codigo: 'EMP-002', nombre: 'Carlos Méndez Torres' }
];

// Mock data - Facturas
const facturasData = [
  {
    id: 'F1',
    numeroFactura: 'FACT-001',
    asesorId: 'A1',
    asesorNombre: 'María José López García',
    fecha: '2024-12-08',
    sucursalId: 'S1',
    sucursalNombre: 'Sucursal Central',
    cajaId: 'C1',
    cajaNombre: 'Caja Principal',
    items: [
      { id: 'I1', codigo: 'PERF-001', nombre: 'Perfume Chanel No. 5 100ml', cantidad: 2, precio: 120.00, subtotal: 240.00 },
      { id: 'I2', codigo: 'MAQ-001', nombre: 'Base de Maquillaje L\'Oréal', cantidad: 5, precio: 25.00, subtotal: 125.00 },
      { id: 'I3', codigo: 'PIEL-001', nombre: 'Crema Hidratante Neutrogena', cantidad: 3, precio: 18.50, subtotal: 55.50 }
    ]
  },
  {
    id: 'F2',
    numeroFactura: 'FACT-002',
    asesorId: 'A2',
    asesorNombre: 'Roberto García Sánchez',
    fecha: '2024-12-07',
    sucursalId: 'S2',
    sucursalNombre: 'Sucursal León',
    cajaId: 'C2',
    cajaNombre: 'Caja Secundaria',
    items: [
      { id: 'I4', codigo: 'PERF-002', nombre: 'Perfume Dior Sauvage 60ml', cantidad: 1, precio: 95.00, subtotal: 95.00 },
      { id: 'I5', codigo: 'MAQ-002', nombre: 'Labial MAC Ruby Woo', cantidad: 4, precio: 35.00, subtotal: 140.00 }
    ]
  }
];

// Mock data - Sucursales
const sucursalesData = [
  { id: 'S1', nombre: 'Sucursal Central' },
  { id: 'S2', nombre: 'Sucursal León' },
  { id: 'S3', nombre: 'Sucursal Granada' }
];

// Mock data - Cajas
const cajasData = [
  { id: 'C1', nombre: 'Caja Principal', sucursalId: 'S1' },
  { id: 'C2', nombre: 'Caja Secundaria', sucursalId: 'S1' },
  { id: 'C3', nombre: 'Caja Principal', sucursalId: 'S2' }
];

// Mock data - Notas de Crédito
const notasCreditoData: NotaCredito[] = [
  {
    id: 'NC1',
    numeroNota: 'NC-001',
    asesorId: 'A1',
    asesorNombre: 'María José López García',
    facturaId: 'F1',
    numeroFactura: 'FACT-001',
    fechaFactura: '2024-12-08',
    fechaNota: '2024-12-09',
    concepto: 'Devolución por producto defectuoso',
    sucursalId: 'S1',
    sucursalNombre: 'Sucursal Central',
    cajaId: 'C1',
    cajaNombre: 'Caja Principal',
    comentarios: 'Cliente reportó defecto en envase del perfume',
    items: [
      {
        id: 'NCI1',
        codigoProducto: 'PERF-001',
        nombreProducto: 'Perfume Chanel No. 5 100ml',
        cantidadFacturada: 2,
        cantidadNotaCredito: 1,
        precioUnitario: 120.00,
        subtotal: 120.00
      }
    ],
    subtotal: 120.00,
    iva: 18.00,
    total: 138.00,
    estado: 'emitida'
  },
  {
    id: 'NC2',
    numeroNota: 'NC-002',
    asesorId: 'A2',
    asesorNombre: 'Roberto García Sánchez',
    facturaId: 'F2',
    numeroFactura: 'FACT-002',
    fechaFactura: '2024-12-07',
    fechaNota: '2024-12-08',
    concepto: 'Ajuste por error en cantidad',
    sucursalId: 'S2',
    sucursalNombre: 'Sucursal León',
    cajaId: 'C2',
    cajaNombre: 'Caja Secundaria',
    comentarios: 'Se facturó 1 unidad de más',
    items: [
      {
        id: 'NCI2',
        codigoProducto: 'MAQ-002',
        nombreProducto: 'Labial MAC Ruby Woo',
        cantidadFacturada: 4,
        cantidadNotaCredito: 1,
        precioUnitario: 35.00,
        subtotal: 35.00
      }
    ],
    subtotal: 35.00,
    iva: 5.25,
    total: 40.25,
    estado: 'emitida'
  }
];

export default function NotasCredito() {
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>(notasCreditoData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaCredito | null>(null);
  const [viewingNota, setViewingNota] = useState<NotaCredito | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<NotaCredito>>({
    numeroNota: '',
    asesorId: '',
    facturaId: '',
    fechaNota: new Date().toISOString().split('T')[0],
    concepto: '',
    sucursalId: '',
    cajaId: '',
    comentarios: '',
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0,
    estado: 'borrador'
  });

  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'borrador' | 'emitida' | 'anulada'>('todos');
  const [filterAsesor, setFilterAsesor] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'fechaNota' | 'total'>('fechaNota');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort
  const filteredNotas = notasCredito.filter(nota => {
    const matchesSearch = nota.numeroNota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.asesorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todos' || nota.estado === filterEstado;
    const matchesAsesor = filterAsesor === 'todos' || nota.asesorId === filterAsesor;
    return matchesSearch && matchesEstado && matchesAsesor;
  });

  const sortedNotas = [...filteredNotas].sort((a, b) => {
    let compareA: any = a[sortColumn];
    let compareB: any = b[sortColumn];
    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedNotas.length / rowsPerPage);
  const paginatedNotas = sortedNotas.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleOpenForm = (nota?: NotaCredito) => {
    if (nota) {
      setEditingNota(nota);
      setFormData(nota);
      const factura = facturasData.find(f => f.id === nota.facturaId);
      setSelectedFactura(factura);
      
      // Set selected items and quantities
      const itemIds = new Set(nota.items.map(i => {
        const facturaItem = factura?.items.find(fi => fi.codigo === i.codigoProducto);
        return facturaItem?.id || '';
      }).filter(Boolean));
      setSelectedItems(itemIds);
      
      const quantities: Record<string, number> = {};
      nota.items.forEach(item => {
        const facturaItem = factura?.items.find(fi => fi.codigo === item.codigoProducto);
        if (facturaItem) {
          quantities[facturaItem.id] = item.cantidadNotaCredito;
        }
      });
      setItemQuantities(quantities);
    } else {
      setEditingNota(null);
      setFormData({
        numeroNota: `NC-${String(notasCredito.length + 1).padStart(3, '0')}`,
        asesorId: '',
        facturaId: '',
        fechaNota: new Date().toISOString().split('T')[0],
        concepto: '',
        sucursalId: '',
        cajaId: '',
        comentarios: '',
        items: [],
        subtotal: 0,
        iva: 0,
        total: 0,
        estado: 'borrador'
      });
      setSelectedFactura(null);
      setSelectedItems(new Set());
      setItemQuantities({});
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingNota(null);
    setSelectedFactura(null);
    setSelectedItems(new Set());
    setItemQuantities({});
  };

  const handleFacturaSelect = (facturaId: string) => {
    const factura = facturasData.find(f => f.id === facturaId);
    setSelectedFactura(factura);
    setFormData({
      ...formData,
      facturaId,
      numeroFactura: factura?.numeroFactura || '',
      fechaFactura: factura?.fecha || '',
      asesorId: factura?.asesorId || '',
      asesorNombre: factura?.asesorNombre || '',
      sucursalId: factura?.sucursalId || '',
      sucursalNombre: factura?.sucursalNombre || '',
      cajaId: factura?.cajaId || '',
      cajaNombre: factura?.cajaNombre || ''
    });
    setSelectedItems(new Set());
    setItemQuantities({});
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      const newQuantities = { ...itemQuantities };
      delete newQuantities[itemId];
      setItemQuantities(newQuantities);
    } else {
      newSelected.add(itemId);
      const item = selectedFactura?.items.find((i: any) => i.id === itemId);
      if (item) {
        setItemQuantities({
          ...itemQuantities,
          [itemId]: item.cantidad
        });
      }
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, cantidad: number) => {
    setItemQuantities({
      ...itemQuantities,
      [itemId]: cantidad
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    
    selectedItems.forEach(itemId => {
      const item = selectedFactura?.items.find((i: any) => i.id === itemId);
      if (item) {
        const cantidad = itemQuantities[itemId] || 0;
        subtotal += item.precio * cantidad;
      }
    });

    const iva = subtotal * 0.15; // 15% IVA
    const total = subtotal + iva;

    return { subtotal, iva, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.facturaId || selectedItems.size === 0) {
      alert('Seleccione una factura y al menos un artículo');
      return;
    }

    const { subtotal, iva, total } = calculateTotals();

    const items: NotaCreditoItem[] = Array.from(selectedItems).map(itemId => {
      const facturaItem = selectedFactura?.items.find((i: any) => i.id === itemId);
      return {
        id: `NCI${Math.random().toString(36).substr(2, 9)}`,
        codigoProducto: facturaItem?.codigo || '',
        nombreProducto: facturaItem?.nombre || '',
        cantidadFacturada: facturaItem?.cantidad || 0,
        cantidadNotaCredito: itemQuantities[itemId] || 0,
        precioUnitario: facturaItem?.precio || 0,
        subtotal: (facturaItem?.precio || 0) * (itemQuantities[itemId] || 0)
      };
    });

    if (editingNota) {
      // Update existing
      setNotasCredito(notasCredito.map(n => 
        n.id === editingNota.id 
          ? { 
              ...n, 
              ...formData,
              items,
              subtotal,
              iva,
              total
            } as NotaCredito
          : n
      ));
    } else {
      // Create new
      const newNota: NotaCredito = {
        id: `NC${notasCredito.length + 1}`,
        numeroNota: formData.numeroNota || '',
        asesorId: formData.asesorId || '',
        asesorNombre: formData.asesorNombre || '',
        facturaId: formData.facturaId || '',
        numeroFactura: formData.numeroFactura || '',
        fechaFactura: formData.fechaFactura || '',
        fechaNota: formData.fechaNota || '',
        concepto: formData.concepto || '',
        sucursalId: formData.sucursalId || '',
        sucursalNombre: formData.sucursalNombre || '',
        cajaId: formData.cajaId || '',
        cajaNombre: formData.cajaNombre || '',
        comentarios: formData.comentarios || '',
        items,
        subtotal,
        iva,
        total,
        estado: formData.estado || 'borrador'
      };
      setNotasCredito([...notasCredito, newNota]);
    }
    
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta nota de crédito?')) {
      setNotasCredito(notasCredito.filter(n => n.id !== id));
    }
  };

  const handleInputChange = (field: keyof NotaCredito, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'emitida': return 'bg-green-100 text-green-700';
      case 'borrador': return 'bg-yellow-100 text-yellow-700';
      case 'anulada': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'emitida': return 'Emitida';
      case 'borrador': return 'Borrador';
      case 'anulada': return 'Anulada';
      default: return estado;
    }
  };

  // Detail View
  if (viewingNota) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Nota de Crédito {viewingNota.numeroNota}</h2>
                  <p className="text-muted-foreground">{viewingNota.asesorNombre}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="primary"
                  startIcon={<Edit2 size={18} />}
                  onClick={() => {
                    setViewingNota(null);
                    handleOpenForm(viewingNota);
                  }}
                  disabled={viewingNota.estado === 'emitida' || viewingNota.estado === 'anulada'}
                >
                  Editar
                </MaterialButton>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  startIcon={<X size={18} />}
                  onClick={() => setViewingNota(null)}
                >
                  Cerrar
                </MaterialButton>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* General Info */}
            <div className="bg-surface rounded elevation-2 p-6">
              <h3 className="text-foreground mb-4">Información General</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Estado</label>
                  <p>
                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm ${getEstadoBadgeColor(viewingNota.estado)}`}>
                      {getEstadoLabel(viewingNota.estado)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Número de Nota</label>
                  <p className="text-foreground font-mono">{viewingNota.numeroNota}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Fecha de Emisión</label>
                  <p className="text-foreground">{viewingNota.fechaNota}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Concepto</label>
                  <p className="text-foreground">{viewingNota.concepto}</p>
                </div>
              </div>
            </div>

            {/* Invoice & Location Info */}
            <div className="bg-surface rounded elevation-2 p-6">
              <h3 className="text-foreground mb-4">Factura y Ubicación</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Factura Asociada</label>
                  <p className="text-foreground font-mono">{viewingNota.numeroFactura}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Fecha de Factura</label>
                  <p className="text-foreground">{viewingNota.fechaFactura}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Sucursal</label>
                  <p className="text-foreground">{viewingNota.sucursalNombre}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Caja</label>
                  <p className="text-foreground">{viewingNota.cajaNombre}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          {viewingNota.comentarios && (
            <div className="bg-surface rounded elevation-2 p-6 mb-6">
              <h3 className="text-foreground mb-4">Comentarios</h3>
              <p className="text-foreground">{viewingNota.comentarios}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="bg-surface rounded elevation-2 p-6 mb-6">
            <h3 className="text-foreground mb-4">Artículos</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-foreground">Código</th>
                    <th className="px-6 py-3 text-left text-sm text-foreground">Producto</th>
                    <th className="px-6 py-3 text-right text-sm text-foreground">Cant. Facturada</th>
                    <th className="px-6 py-3 text-right text-sm text-foreground">Cant. NC</th>
                    <th className="px-6 py-3 text-right text-sm text-foreground">Precio Unit.</th>
                    <th className="px-6 py-3 text-right text-sm text-foreground">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {viewingNota.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-sm text-foreground font-mono">{item.codigoProducto}</td>
                      <td className="px-6 py-3 text-sm text-foreground">{item.nombreProducto}</td>
                      <td className="px-6 py-3 text-sm text-foreground text-right">{item.cantidadFacturada}</td>
                      <td className="px-6 py-3 text-sm text-primary text-right">{item.cantidadNotaCredito}</td>
                      <td className="px-6 py-3 text-sm text-foreground text-right font-mono">${item.precioUnitario.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-foreground text-right font-mono">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="max-w-md ml-auto">
              <div className="flex justify-between mb-2 pb-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground font-mono">${viewingNota.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 pb-2">
                <span className="text-muted-foreground">IVA (15%):</span>
                <span className="text-foreground font-mono">${viewingNota.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-foreground">Total:</span>
                <span className="text-foreground font-mono">${viewingNota.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form Modal
  if (isFormOpen) {
    const { subtotal, iva, total } = calculateTotals();

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">
                    {editingNota ? 'Editar Nota de Crédito' : 'Nueva Nota de Crédito'}
                  </h2>
                  <p className="text-muted-foreground">
                    {editingNota ? 'Modificar nota de crédito existente' : 'Emitir nueva nota de crédito a asesor de ventas'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* General Info */}
            <div className="bg-surface rounded elevation-2 p-6 mb-6">
              <h3 className="text-foreground mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MaterialInput
                  label="Número de Nota *"
                  value={formData.numeroNota || ''}
                  onChange={(e) => handleInputChange('numeroNota', e.target.value)}
                  required
                  disabled={!!editingNota}
                />

                <MaterialInput
                  label="Fecha de Emisión *"
                  type="date"
                  value={formData.fechaNota || ''}
                  onChange={(e) => handleInputChange('fechaNota', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value as any)}
                    className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none"
                    required
                  >
                    <option value="borrador">Borrador</option>
                    <option value="emitida">Emitida</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <MaterialInput
                    label="Concepto / Motivo *"
                    value={formData.concepto || ''}
                    onChange={(e) => handleInputChange('concepto', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Invoice Selection */}
            <div className="bg-surface rounded elevation-2 p-6 mb-6">
              <h3 className="text-foreground mb-4">Seleccionar Factura</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Factura *
                  </label>
                  <select
                    value={formData.facturaId}
                    onChange={(e) => handleFacturaSelect(e.target.value)}
                    className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none"
                    required
                  >
                    <option value="">Seleccionar factura</option>
                    {facturasData.map(factura => (
                      <option key={factura.id} value={factura.id}>
                        {factura.numeroFactura} - {factura.asesorNombre} ({factura.fecha})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFactura && (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Fecha de Factura
                    </label>
                    <input
                      type="text"
                      value={selectedFactura.fecha}
                      disabled
                      className="w-full px-4 py-2 bg-muted border-b-2 border-border rounded-t"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Items Selection */}
            {selectedFactura && (
              <div className="bg-surface rounded elevation-2 p-6 mb-6">
                <h3 className="text-foreground mb-4">Seleccionar Artículos de la Factura</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-center text-sm text-foreground">Seleccionar</th>
                        <th className="px-6 py-3 text-left text-sm text-foreground">Código</th>
                        <th className="px-6 py-3 text-left text-sm text-foreground">Producto</th>
                        <th className="px-6 py-3 text-right text-sm text-foreground">Cant. Facturada</th>
                        <th className="px-6 py-3 text-right text-sm text-foreground">Precio Unit.</th>
                        <th className="px-6 py-3 text-center text-sm text-foreground">Cant. NC</th>
                        <th className="px-6 py-3 text-right text-sm text-foreground">Subtotal NC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedFactura.items.map((item: any) => (
                        <tr key={item.id} className={selectedItems.has(item.id) ? 'bg-primary/5' : ''}>
                          <td className="px-6 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleItem(item.id)}
                              className="p-2 hover:bg-muted rounded transition-colors"
                            >
                              {selectedItems.has(item.id) ? (
                                <CheckSquare size={20} className="text-primary" />
                              ) : (
                                <Square size={20} className="text-muted-foreground" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-sm text-foreground font-mono">{item.codigo}</td>
                          <td className="px-6 py-3 text-sm text-foreground">{item.nombre}</td>
                          <td className="px-6 py-3 text-sm text-foreground text-right">{item.cantidad}</td>
                          <td className="px-6 py-3 text-sm text-foreground text-right font-mono">${item.precio.toFixed(2)}</td>
                          <td className="px-6 py-3 text-center">
                            {selectedItems.has(item.id) && (
                              <input
                                type="number"
                                min="1"
                                max={item.cantidad}
                                value={itemQuantities[item.id] || item.cantidad}
                                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                                className="w-20 px-2 py-1 text-center bg-input-background border-b-2 border-border 
                                         focus:border-primary rounded-t transition-colors outline-none"
                              />
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-foreground text-right font-mono">
                            {selectedItems.has(item.id) 
                              ? `$${(item.precio * (itemQuantities[item.id] || 0)).toFixed(2)}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Location & Comments */}
            <div className="bg-surface rounded elevation-2 p-6 mb-6">
              <h3 className="text-foreground mb-4">Ubicación y Comentarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Sucursal
                  </label>
                  <input
                    type="text"
                    value={formData.sucursalNombre || ''}
                    disabled
                    className="w-full px-4 py-2 bg-muted border-b-2 border-border rounded-t"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Caja
                  </label>
                  <input
                    type="text"
                    value={formData.cajaNombre || ''}
                    disabled
                    className="w-full px-4 py-2 bg-muted border-b-2 border-border rounded-t"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-muted-foreground mb-2">
                    Comentarios / Notas
                  </label>
                  <textarea
                    value={formData.comentarios || ''}
                    onChange={(e) => handleInputChange('comentarios', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            {selectedItems.size > 0 && (
              <div className="bg-surface rounded elevation-2 p-6 mb-6">
                <h3 className="text-foreground mb-4">Totales</h3>
                <div className="max-w-md ml-auto">
                  <div className="flex justify-between mb-2 pb-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-foreground font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2 pb-2">
                    <span className="text-muted-foreground">IVA (15%):</span>
                    <span className="text-foreground font-mono">${iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-foreground">Total:</span>
                    <span className="text-foreground font-mono">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <MaterialButton
                type="button"
                variant="outlined"
                color="secondary"
                onClick={handleCloseForm}
              >
                Cancelar
              </MaterialButton>
              <MaterialButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={selectedItems.size === 0}
              >
                {editingNota ? 'Actualizar' : 'Guardar'}
              </MaterialButton>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText size={32} className="text-primary" />
              <div>
                <h2 className="text-foreground">Notas de Crédito</h2>
                <p className="text-muted-foreground">Gestión de notas de crédito emitidas a asesores de ventas</p>
              </div>
            </div>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={20} />}
              onClick={() => handleOpenForm()}
            >
              Nueva Nota de Crédito
            </MaterialButton>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded elevation-2 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por número, asesor o factura..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
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
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todos">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="emitida">Emitida</option>
                <option value="anulada">Anulada</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterAsesor}
                onChange={(e) => {
                  setFilterAsesor(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todos">Todos los asesores</option>
                {asesoresData.map(asesor => (
                  <option key={asesor.id} value={asesor.id}>{asesor.nombre}</option>
                ))}
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
                <option value={100}>100 por página</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-foreground">Número NC</th>
                  <th className="px-6 py-4 text-left text-sm text-foreground">Asesor</th>
                  <th className="px-6 py-4 text-left text-sm text-foreground">Factura</th>
                  <th 
                    className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('fechaNota')}
                  >
                    <div className="flex items-center gap-2">
                      Fecha
                      {sortColumn === 'fechaNota' && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
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
                  <th className="px-6 py-4 text-left text-sm text-foreground">Estado</th>
                  <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedNotas.map(nota => (
                  <tr key={nota.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-mono">{nota.numeroNota}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{nota.asesorNombre}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-mono">{nota.numeroFactura}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{nota.fechaNota}</td>
                    <td className="px-6 py-4 text-sm text-foreground text-right font-mono">${nota.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${getEstadoBadgeColor(nota.estado)}`}>
                        {getEstadoLabel(nota.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingNota(nota)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenForm(nota)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Editar"
                          disabled={nota.estado === 'emitida' || nota.estado === 'anulada'}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(nota.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Eliminar"
                          disabled={nota.estado === 'emitida'}
                        >
                          <Trash2 size={18} />
                        </button>
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
            Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedNotas.length)} de {sortedNotas.length} notas
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
      </div>
    </div>
  );
}
