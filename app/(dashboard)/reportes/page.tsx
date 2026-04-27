/* eslint-disable prefer-const */
'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { BarChart3, Search, Filter, ChevronDown, ChevronUp, Download, Eye, X, FileSpreadsheet, Calendar } from 'lucide-react';

interface ReporteDetalle {
  fecha: string;
  serie: string;
  numeroInicial: number;
  numeroFinal: number;
  montoVentas: number;
  cajero: string;
  cajeroNombre: string;
  sucursal: string;
  caja: string;
  totalFacturas: number;
}

// Mock data - Sucursales
const sucursalesData = [
  { id: 'S1', nombre: 'Sucursal Central' },
  { id: 'S2', nombre: 'Sucursal León' },
  { id: 'S3', nombre: 'Sucursal Granada' }
];

// Mock data - Cajas
const cajasData = [
  { id: 'C1', nombre: 'Caja Principal', serie: '45FAC', sucursalId: 'S1' },
  { id: 'C2', nombre: 'Caja Secundaria', serie: '46FAC', sucursalId: 'S1' },
  { id: 'C3', nombre: 'Caja Principal', serie: '47FAC', sucursalId: 'S2' },
  { id: 'C4', nombre: 'Caja Express', serie: '48FAC', sucursalId: 'S2' },
  { id: 'C5', nombre: 'Caja Principal', serie: '49FAC', sucursalId: 'S3' }
];

// Mock data - Cajeros
const cajerosData = [
  { id: 'U1', codigo: 'ABALDELOMA', nombre: 'Ana Baldellomar' },
  { id: 'U2', codigo: 'NMENDOZA', nombre: 'Norma Mendoza' },
  { id: 'U3', codigo: 'KBLANCO', nombre: 'Karen Blanco' },
  { id: 'U4', codigo: 'RMOYA', nombre: 'Roberto Moya' },
  { id: 'U5', codigo: 'JPEREZ', nombre: 'Juan Pérez' }
];

// Mock report data
const reporteDataMock: ReporteDetalle[] = [
  {
    fecha: '2024-12-09',
    serie: '45FAC',
    numeroInicial: 81160,
    numeroFinal: 81168,
    montoVentas: 14908.46,
    cajero: 'ABALDELOMA',
    cajeroNombre: 'Ana Baldellomar',
    sucursal: 'Sucursal Central',
    caja: 'Caja Principal',
    totalFacturas: 9
  },
  {
    fecha: '2024-12-09',
    serie: '46FAC',
    numeroInicial: 149099,
    numeroFinal: 149157,
    montoVentas: 98306.76,
    cajero: 'NMENDOZA',
    cajeroNombre: 'Norma Mendoza',
    sucursal: 'Sucursal Central',
    caja: 'Caja Secundaria',
    totalFacturas: 59
  },
  {
    fecha: '2024-12-09',
    serie: '47FAC',
    numeroInicial: 171280,
    numeroFinal: 171337,
    montoVentas: 56805.00,
    cajero: 'KBLANCO',
    cajeroNombre: 'Karen Blanco',
    sucursal: 'Sucursal León',
    caja: 'Caja Principal',
    totalFacturas: 58
  },
  {
    fecha: '2024-12-09',
    serie: '48FAC',
    numeroInicial: 0,
    numeroFinal: 0,
    montoVentas: 0.00,
    cajero: 'RMOYA',
    cajeroNombre: 'Roberto Moya',
    sucursal: 'Sucursal León',
    caja: 'Caja Express',
    totalFacturas: 0
  },
  {
    fecha: '2024-12-08',
    serie: '45FAC',
    numeroInicial: 81145,
    numeroFinal: 81159,
    montoVentas: 12560.30,
    cajero: 'ABALDELOMA',
    cajeroNombre: 'Ana Baldellomar',
    sucursal: 'Sucursal Central',
    caja: 'Caja Principal',
    totalFacturas: 15
  },
  {
    fecha: '2024-12-08',
    serie: '46FAC',
    numeroInicial: 149045,
    numeroFinal: 149098,
    montoVentas: 87420.50,
    cajero: 'NMENDOZA',
    cajeroNombre: 'Norma Mendoza',
    sucursal: 'Sucursal Central',
    caja: 'Caja Secundaria',
    totalFacturas: 54
  },
  {
    fecha: '2024-12-08',
    serie: '47FAC',
    numeroInicial: 171230,
    numeroFinal: 171279,
    montoVentas: 45300.00,
    cajero: 'KBLANCO',
    cajeroNombre: 'Karen Blanco',
    sucursal: 'Sucursal León',
    caja: 'Caja Principal',
    totalFacturas: 50
  },
  {
    fecha: '2024-12-07',
    serie: '45FAC',
    numeroInicial: 81130,
    numeroFinal: 81144,
    montoVentas: 18945.80,
    cajero: 'JPEREZ',
    cajeroNombre: 'Juan Pérez',
    sucursal: 'Sucursal Central',
    caja: 'Caja Principal',
    totalFacturas: 15
  },
  {
    fecha: '2024-12-07',
    serie: '49FAC',
    numeroInicial: 200100,
    numeroFinal: 200135,
    montoVentas: 32100.00,
    cajero: 'RMOYA',
    cajeroNombre: 'Roberto Moya',
    sucursal: 'Sucursal Granada',
    caja: 'Caja Principal',
    totalFacturas: 36
  }
];

export default function ReporteGestionCaja() {
  const [reporteData, setReporteData] = useState<ReporteDetalle[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [viewingDetalle, setViewingDetalle] = useState<ReporteDetalle | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter state
  const [fechaDesde, setFechaDesde] = useState('2024-12-07');
  const [fechaHasta, setFechaHasta] = useState('2024-12-09');
  const [sucursalFiltro, setSucursalFiltro] = useState('todos');
  const [cajaFiltro, setCajaFiltro] = useState('todos');
  const [cajeroFiltro, setCajeroFiltro] = useState('todos');

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'fecha' | 'montoVentas'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleGenerateReport = () => {
    // Filter mock data based on filters
    const filteredData = reporteDataMock.filter(item => {
      const itemDate = new Date(item.fecha);
      const fromDate = new Date(fechaDesde);
      const toDate = new Date(fechaHasta);

      const matchesDate = itemDate >= fromDate && itemDate <= toDate;
      const matchesSucursal = sucursalFiltro === 'todos' || item.sucursal === sucursalesData.find(s => s.id === sucursalFiltro)?.nombre;
      const matchesCaja = cajaFiltro === 'todos' || item.serie === cajasData.find(c => c.id === cajaFiltro)?.serie;
      const matchesCajero = cajeroFiltro === 'todos' || item.cajero === cajerosData.find(c => c.id === cajeroFiltro)?.codigo;

      return matchesDate && matchesSucursal && matchesCaja && matchesCajero;
    });

    setReporteData(filteredData);
    setReportGenerated(true);
    setCurrentPage(1);
  };

  const handleExport = () => {
    setShowExportModal(true);
    // Simulate export
    setTimeout(() => {
      setShowExportModal(false);
      alert('Reporte exportado exitosamente a Excel');
    }, 1500);
  };

  // Filter and sort
  const sortedData = [...reporteData].sort((a, b) => {
    let compareA: string | number | undefined = a[sortColumn];
    let compareB: string | number | undefined = b[sortColumn];


    // Default undefined values to '' for strings or 0 for numbers
    if (typeof compareA === 'undefined') compareA = typeof compareB === 'number' ? 0 : '';
    if (typeof compareB === 'undefined') compareB = typeof compareA === 'number' ? 0 : '';

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Calculate totals
  const totalVentas = reporteData.reduce((sum, item) => sum + item.montoVentas, 0);
  const totalFacturas = reporteData.reduce((sum, item) => sum + item.totalFacturas, 0);

  // Get filtered cajas based on selected sucursal
  const cajasFiltradasPorSucursal = sucursalFiltro === 'todos' 
    ? cajasData 
    : cajasData.filter(c => c.sucursalId === sucursalFiltro);

  // Detail View
  if (viewingDetalle) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BarChart3 size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Detalle de Operaciones</h2>
                  <p className="text-muted-foreground">{viewingDetalle.fecha} - {viewingDetalle.caja}</p>
                </div>
              </div>
              <MaterialButton
                variant="outlined"
                color="secondary"
                startIcon={<X size={18} />}
                onClick={() => setViewingDetalle(null)}
              >
                Cerrar
              </MaterialButton>
            </div>
          </div>

          {/* Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* General Info */}
            <div className="bg-surface rounded elevation-2 p-6">
              <h3 className="text-foreground mb-4">Información General</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Fecha</label>
                  <p className="text-foreground">{viewingDetalle.fecha}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Sucursal</label>
                  <p className="text-foreground">{viewingDetalle.sucursal}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Caja</label>
                  <p className="text-foreground">{viewingDetalle.caja}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Serie</label>
                  <p className="text-foreground font-mono">{viewingDetalle.serie}</p>
                </div>
              </div>
            </div>

            {/* Cashier & Numbers */}
            <div className="bg-surface rounded elevation-2 p-6">
              <h3 className="text-foreground mb-4">Cajero y Facturación</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Cajero</label>
                  <p className="text-foreground">{viewingDetalle.cajeroNombre}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Código Cajero</label>
                  <p className="text-foreground font-mono">{viewingDetalle.cajero}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Primera Factura</label>
                  <p className="text-foreground font-mono">{viewingDetalle.numeroInicial || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Última Factura</label>
                  <p className="text-foreground font-mono">{viewingDetalle.numeroFinal || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface rounded elevation-2 p-6">
            <h3 className="text-foreground mb-4">Resumen de Operaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-2">Total de Facturas</p>
                <p className="text-2xl text-foreground font-mono">{viewingDetalle.totalFacturas}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-2">Rango de Facturas</p>
                <p className="text-lg text-foreground font-mono">
                  {viewingDetalle.numeroInicial > 0 
                    ? `${viewingDetalle.numeroInicial} - ${viewingDetalle.numeroFinal}`
                    : 'Sin facturas'}
                </p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded">
                <p className="text-sm text-muted-foreground mb-2">Monto Total de Ventas</p>
                <p className="text-2xl text-primary font-mono">${viewingDetalle.montoVentas.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={32} className="text-primary" />
            <div>
              <h2 className="text-foreground">Reportes de Gestión de Caja</h2>
              <p className="text-muted-foreground">Resumen de operaciones diarias por sucursal y caja</p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-surface rounded elevation-2 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-primary" />
            <h3 className="text-foreground">Filtros de Búsqueda</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                <Calendar size={16} className="inline mr-2" />
                Fecha Desde *
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                <Calendar size={16} className="inline mr-2" />
                Fecha Hasta *
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Sucursal
              </label>
              <select
                value={sucursalFiltro}
                onChange={(e) => {
                  setSucursalFiltro(e.target.value);
                  setCajaFiltro('todos'); // Reset caja filter
                }}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              >
                <option value="todos">Todas las sucursales</option>
                {sucursalesData.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            </div>

            {/* Cash Register */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Caja
              </label>
              <select
                value={cajaFiltro}
                onChange={(e) => setCajaFiltro(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              >
                <option value="todos">Todas las cajas</option>
                {cajasFiltradasPorSucursal.map(caja => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre} ({caja.serie})
                  </option>
                ))}
              </select>
            </div>

            {/* Cashier */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Cajero (Opcional)
              </label>
              <select
                value={cajeroFiltro}
                onChange={(e) => setCajeroFiltro(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              >
                <option value="todos">Todos los cajeros</option>
                {cajerosData.map(cajero => (
                  <option key={cajero.id} value={cajero.id}>
                    {cajero.nombre} ({cajero.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Search size={20} />}
                onClick={handleGenerateReport}
                className="w-full"
              >
                Generar Reporte
              </MaterialButton>
            </div>
          </div>
        </div>

        {/* Results */}
        {reportGenerated && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-surface rounded elevation-2 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total de Registros</p>
                    <p className="text-2xl text-foreground">{reporteData.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 size={24} className="text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded elevation-2 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total de Facturas</p>
                    <p className="text-2xl text-foreground">{totalFacturas}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet size={24} className="text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded elevation-2 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Ventas</p>
                    <p className="text-2xl text-primary font-mono">
                      ${totalVentas.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Download size={24} className="text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end mb-4">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Download size={20} />}
                onClick={handleExport}
              >
                Exportar a Excel
              </MaterialButton>
            </div>

            {/* Table */}
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
                      <th className="px-6 py-4 text-left text-sm text-foreground">Serie</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Primera Factura</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Última Factura</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Total Facturas</th>
                      <th 
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('montoVentas')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Monto Ventas
                          {sortColumn === 'montoVentas' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Cajero</th>
                      <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedData.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground">{item.fecha}</td>
                        <td className="px-6 py-4 text-sm text-foreground font-mono">{item.serie}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {item.numeroInicial > 0 ? item.numeroInicial.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {item.numeroFinal > 0 ? item.numeroFinal.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right">{item.totalFacturas}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          ${item.montoVentas.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{item.cajero}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setViewingDetalle(item)}
                              className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Ver detalle"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-primary/5 border-t-2 border-primary">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-foreground">
                        <strong>TOTALES</strong>
                      </td>
                      <td className="px-6 py-4 text-foreground text-right">
                        <strong>{totalFacturas}</strong>
                      </td>
                      <td className="px-6 py-4 text-primary text-right font-mono">
                        <strong>${totalVentas.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedData.length)} de {sortedData.length} registros
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
                    Página {currentPage} de {totalPages || 1}
                  </span>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!reportGenerated && (
          <div className="bg-surface rounded elevation-2 p-12 text-center">
            <BarChart3 size={64} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-foreground mb-2">Generar Reporte</h3>
            <p className="text-muted-foreground">
              Seleccione los filtros deseados y haga clic en &quot;Generar Reporte&quot; para visualizar los resultados
            </p>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded elevation-4 p-8 max-w-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download size={32} className="text-primary animate-bounce" />
                </div>
                <h3 className="text-foreground mb-2">Exportando a Excel...</h3>
                <p className="text-muted-foreground">
                  Por favor espere mientras se genera el archivo
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
