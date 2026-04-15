'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { Receipt, ChevronDown, ChevronUp, Search, Filter, Eye, CreditCard } from 'lucide-react';
// import Cobros from '@/components/Cobros';
import { Upload } from 'lucide-react';
import VerDetalle from './modals/VerDetalle';
import ImportarFactura from './modals/ImportarFactura';

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

  //state importmodal
  const [showImportModal, setShowImportModal] = useState(false)
    const [importFileName, setImportFileName] = useState<string | null>(null)


  const handleViewDetail = (factura: Factura) => {
    setEditingFactura(factura);
    setShowDetail(true);
  };


  const handleCancel = () => {
    setShowDetail(false);
    setEditingFactura(null);
    setShowGenerarCobro(false);
    setFacturaParaCobro(null);
  };

  const handleGenerarCobro = (facturaId: string) => {
    setFacturaParaCobro(facturaId);
    setShowGenerarCobro(true);
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
    const compareA = a[sortColumn];
    const compareB = b[sortColumn];

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
 /* if (showGenerarCobro && facturaParaCobro) {
    return (
      <Cobros 
        preSelectedFacturaId={facturaParaCobro}
        onNavigateBack={handleCancel}
      />
    );
  }*/


  // List View
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
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
          <div className='flex flex-row'>
          <MaterialButton
              variant='contained'
              color='secondary'
              className="gap-2 ml-0.5 mr-0.5"
              onClick={() => {
              setImportFileName(null)
               setShowImportModal(true)
               
              }}
            >
              <Upload className="size-4" />
              Importar Excel
            </MaterialButton>

        {/*  <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Factura
          </MaterialButton>*/}
          </div>
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
                  setFilterTipoPago(e.target.value as 'todos' | 'Contado' | 'Crédito');
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
            <VerDetalle 
              editingFactura={editingFactura!}
              isOpen={showDetail}
              onClose={handleCancel}
            />
            <ImportarFactura open={showImportModal} onClose={() => setShowImportModal(false)} />
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
              variant='contained'
              color='secondary'
              className="gap-2 ml-0.5 mr-0.5"
              onClick={() => {
              setImportFileName(null)
               setShowImportModal(true)
              }}
            >
              <Upload className="size-4" />
              Importar Excel
            </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}