'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { TrendingUp, TrendingDown, Plus, ChevronDown, ChevronUp, Search, Filter, Wallet } from 'lucide-react';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import CrearIngresoEgresoModal, { type IngresoEgreso } from './crear-ingreso-egreso-modal';

export default function IngresosEgresos() {
  const { can } = useUserStore();
  const canCreate = can(PERMISSIONS.CASH_OUTFLOW_CREATE) || can(PERMISSIONS.COLLECTION_CREATE);
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

  const handleCreateSave = (registro: IngresoEgreso) => {
    setRegistros((previous) => [...previous, registro]);
    setShowCreateEdit(false);
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
    const compareA: string | number = a[sortColumn];
    const compareB: string | number = b[sortColumn];

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

  if (showCreateEdit) {
    return (
      <CrearIngresoEgresoModal
        onClose={() => setShowCreateEdit(false)}
        onSave={handleCreateSave}
      />
    );
  }

  // List View
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
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
          {canCreate && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={() => setShowCreateEdit(true)}
            >
              Nuevo Registro
            </MaterialButton>
          )}
        </div>

        {/* Filters and Search */}
        <details className="group bg-surface rounded elevation-2 p-4 mb-6" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
            <span>Filtros de búsqueda</span>
            <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                  setFilterTipo(e.target.value as 'todos' | 'Ingreso' | 'Egreso');
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
        </details>

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
            {!searchTerm && filterTipo === 'todos' && canCreate && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={() => setShowCreateEdit(true)}
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
