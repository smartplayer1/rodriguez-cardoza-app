import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Tag, Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

interface CategoriaArticulo {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
}

export default function CategoriasArticulo() {
  const [categorias, setCategorias] = useState<CategoriaArticulo[]>([
    {
      id: '1',
      nombre: 'Perfume',
      descripcion: 'Fragancias y perfumes para hombre y mujer',
      activo: true,
      createdAt: '2024-12-01'
    },
    {
      id: '2',
      nombre: 'Maquillaje',
      descripcion: 'Productos de maquillaje facial, labial y de ojos',
      activo: true,
      createdAt: '2024-12-01'
    },
    {
      id: '3',
      nombre: 'Cuidado de la Piel',
      descripcion: 'Productos para el cuidado y tratamiento de la piel',
      activo: true,
      createdAt: '2024-12-01'
    },
    {
      id: '4',
      nombre: 'Accesorios de Belleza',
      descripcion: 'Brochas, esponjas y herramientas de belleza',
      activo: true,
      createdAt: '2024-12-02'
    },
    {
      id: '5',
      nombre: 'Cuidado del Cabello',
      descripcion: 'Shampoos, acondicionadores y tratamientos capilares',
      activo: true,
      createdAt: '2024-12-02'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaArticulo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'nombre' | 'activo'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });

  const handleCreate = () => {
    setEditingCategoria(null);
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true
    });
    setShowCreateEdit(true);
  };

  const handleEdit = (categoria: CategoriaArticulo) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      activo: categoria.activo
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.nombre.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    if (editingCategoria) {
      // Edit existing
      setCategorias(categorias.map(cat =>
        cat.id === editingCategoria.id
          ? { ...cat, ...formData }
          : cat
      ));
    } else {
      // Create new
      const newCategoria: CategoriaArticulo = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        activo: formData.activo,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCategorias([...categorias, newCategoria]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '', activo: true });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta categoría?')) {
      setCategorias(categorias.filter(cat => cat.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setEditingCategoria(null);
    setFormData({ nombre: '', descripcion: '', activo: true });
  };

  const toggleActivo = (id: string) => {
    setCategorias(categorias.map(cat =>
      cat.id === id ? { ...cat, activo: !cat.activo } : cat
    ));
  };

  // Filtering and sorting
  const filteredCategorias = categorias.filter(categoria => {
    const matchesSearch = categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActivo = filterActivo === 'todos' || 
                          (filterActivo === 'activos' && categoria.activo) ||
                          (filterActivo === 'inactivos' && !categoria.activo);
    return matchesSearch && matchesActivo;
  });

  const sortedCategorias = [...filteredCategorias].sort((a, b) => {
    let compareA: any = a[sortColumn];
    let compareB: any = b[sortColumn];

    if (sortColumn === 'activo') {
      compareA = a.activo ? 1 : 0;
      compareB = b.activo ? 1 : 0;
    }

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCategorias.length / rowsPerPage);
  const paginatedCategorias = sortedCategorias.slice(
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

  // Create/Edit Form
  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Tag size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingCategoria 
                ? 'Modifique la información de la categoría' 
                : 'Registre una nueva categoría de artículo'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              <MaterialInput
                label="Nombre de la Categoría *"
                type="text"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />

              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none resize-none"
                  rows={4}
                  placeholder="Ingrese una descripción opcional"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="activo" className="text-sm text-foreground cursor-pointer">
                  Categoría Activa
                </label>
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
                {editingCategoria ? 'Guardar Cambios' : 'Crear Categoría'}
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
              <Tag size={32} className="text-primary" />
              <h2 className="text-foreground">Categorías de Artículo</h2>
            </div>
            <p className="text-muted-foreground">
              Gestione las categorías de productos
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Categoría
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
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            {/* Estado Filter */}
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterActivo}
                onChange={(e) => setFilterActivo(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todos">Todas las categorías</option>
                <option value="activos">Activas</option>
                <option value="inactivos">Inactivas</option>
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

        {/* Categorias Table */}
        {paginatedCategorias.length > 0 ? (
          <>
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('nombre')}
                      >
                        <div className="flex items-center gap-2">
                          Nombre
                          {sortColumn === 'nombre' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('activo')}
                      >
                        <div className="flex items-center gap-2">
                          Estado
                          {sortColumn === 'activo' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedCategorias.map((categoria) => (
                      <tr key={categoria.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Tag size={20} className="text-primary" />
                            </div>
                            <span className="text-foreground">{categoria.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {categoria.descripcion || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActivo(categoria.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                              categoria.activo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {categoria.activo ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<Edit size={16} />}
                              onClick={() => handleEdit(categoria)}
                            >
                              Editar
                            </MaterialButton>
                            <MaterialButton
                              variant="text"
                              color="secondary"
                              startIcon={<Trash2 size={16} />}
                              onClick={() => handleDelete(categoria.id)}
                            >
                              Eliminar
                            </MaterialButton>
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
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedCategorias.length)} de {sortedCategorias.length} categorías
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
            <Tag size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay categorías registradas</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterActivo !== 'todos'
                ? 'No se encontraron categorías con los filtros aplicados'
                : 'Comience creando una nueva categoría de artículo'}
            </p>
            {!searchTerm && filterActivo === 'todos' && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Crear Primera Categoría
              </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
