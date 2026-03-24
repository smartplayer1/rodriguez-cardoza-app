import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Package, Plus, Edit, Trash2, Save, X, Sparkles, ChevronDown } from 'lucide-react';

interface Articulo {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  categoria: string;
  marcaId: string;
  marcaNombre: string;
  clasificacionId: string;
  clasificacionNombre: string;
  createdAt: string;
}

// Product categories for cosmetics and fragrances
const categorias = [
  { value: 'perfume', label: 'Perfume' },
  { value: 'maquillaje', label: 'Maquillaje' },
  { value: 'cuidado-piel', label: 'Cuidado de la Piel' },
  { value: 'accesorios', label: 'Accesorios de Belleza' }
];

// Mock marcas data - in a real app, this would be fetched from the Marcas module
const marcasDisponibles = [
  { id: '1', nombre: 'Chanel' },
  { id: '2', nombre: 'Dior' },
  { id: '3', nombre: 'MAC Cosmetics' },
  { id: '4', nombre: 'La Roche-Posay' }
];

// Mock clasificaciones data - in a real app, this would be fetched from the Clasificaciones module
const clasificacionesDisponibles = [
  { id: '1', nombre: 'Premium' },
  { id: '2', nombre: 'Estándar' },
  { id: '3', nombre: 'Económico' },
  { id: '4', nombre: 'Profesional' }
];

const getCategoryLabel = (value: string) => {
  return categorias.find(c => c.value === value)?.label || value;
};

const getCategoryColor = (value: string) => {
  const colors: Record<string, string> = {
    'perfume': 'bg-purple-100 text-purple-700',
    'maquillaje': 'bg-pink-100 text-pink-700',
    'cuidado-piel': 'bg-blue-100 text-blue-700',
    'accesorios': 'bg-green-100 text-green-700'
  };
  return colors[value] || 'bg-gray-100 text-gray-700';
};

export default function Articulos() {
  const [articulos, setArticulos] = useState<Articulo[]>([
    {
      id: '1',
      nombre: 'Chanel No. 5 Eau de Parfum',
      descripcion: 'Perfume clásico y elegante con notas florales. Frasco de 100ml. Fragancia icónica para mujer.',
      codigo: 'PERF-001-2024',
      categoria: 'perfume',
      marcaId: '1',
      marcaNombre: 'Chanel',
      clasificacionId: '1',
      clasificacionNombre: 'Premium',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      nombre: 'Set de Brochas Profesional',
      descripcion: 'Kit completo de 12 brochas para maquillaje profesional con estuche incluido',
      codigo: 'ACC-002-2024',
      categoria: 'accesorios',
      marcaId: '3',
      marcaNombre: 'MAC Cosmetics',
      clasificacionId: '4',
      clasificacionNombre: 'Profesional',
      createdAt: '2024-02-20'
    },
    {
      id: '3',
      nombre: 'Serum Vitamina C Anti-Edad',
      descripcion: 'Serum facial con vitamina C, ácido hialurónico y antioxidantes. 30ml',
      codigo: 'SKIN-003-2024',
      categoria: 'cuidado-piel',
      marcaId: '4',
      marcaNombre: 'La Roche-Posay',
      clasificacionId: '2',
      clasificacionNombre: 'Estándar',
      createdAt: '2024-03-10'
    },
    {
      id: '4',
      nombre: 'Paleta de Sombras Nude',
      descripcion: 'Paleta con 12 tonos nude mate y satinados, alta pigmentación',
      codigo: 'MAQ-004-2024',
      categoria: 'maquillaje',
      marcaId: '2',
      marcaNombre: 'Dior',
      clasificacionId: '3',
      clasificacionNombre: 'Económico',
      createdAt: '2024-04-05'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);
  const [showClasificacionDropdown, setShowClasificacionDropdown] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigo: '',
    categoria: '',
    marcaId: '',
    marcaNombre: '',
    clasificacionId: '',
    clasificacionNombre: ''
  });

  const handleCreate = () => {
    setEditingArticulo(null);
    setFormData({
      nombre: '',
      descripcion: '',
      codigo: '',
      categoria: '',
      marcaId: '',
      marcaNombre: '',
      clasificacionId: '',
      clasificacionNombre: ''
    });
    setShowCreateEdit(true);
  };

  const handleEdit = (articulo: Articulo) => {
    setEditingArticulo(articulo);
    setFormData({
      nombre: articulo.nombre,
      descripcion: articulo.descripcion,
      codigo: articulo.codigo,
      categoria: articulo.categoria,
      marcaId: articulo.marcaId,
      marcaNombre: articulo.marcaNombre,
      clasificacionId: articulo.clasificacionId,
      clasificacionNombre: articulo.clasificacionNombre
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre del artículo');
      return;
    }

    if (!formData.codigo.trim()) {
      alert('Por favor ingrese el código del artículo');
      return;
    }

    if (!formData.descripcion.trim()) {
      alert('Por favor ingrese la descripción del artículo');
      return;
    }

    if (!formData.categoria.trim()) {
      alert('Por favor seleccione la categoría del artículo');
      return;
    }

    if (!formData.marcaId.trim()) {
      alert('Por favor seleccione la marca del artículo');
      return;
    }

    if (!formData.clasificacionId.trim()) {
      alert('Por favor seleccione la clasificación del artículo');
      return;
    }

    if (editingArticulo) {
      // Update existing articulo
      setArticulos(articulos.map(a => 
        a.id === editingArticulo.id 
          ? { 
              ...a, 
              nombre: formData.nombre,
              descripcion: formData.descripcion,
              codigo: formData.codigo,
              categoria: formData.categoria,
              marcaId: formData.marcaId,
              marcaNombre: formData.marcaNombre,
              clasificacionId: formData.clasificacionId,
              clasificacionNombre: formData.clasificacionNombre
            }
          : a
      ));
    } else {
      // Create new articulo
      const newArticulo: Articulo = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        codigo: formData.codigo,
        categoria: formData.categoria,
        marcaId: formData.marcaId,
        marcaNombre: formData.marcaNombre,
        clasificacionId: formData.clasificacionId,
        clasificacionNombre: formData.clasificacionNombre,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setArticulos([...articulos, newArticulo]);
    }

    setShowCreateEdit(false);
    setFormData({
      nombre: '',
      descripcion: '',
      codigo: '',
      categoria: '',
      marcaId: '',
      marcaNombre: '',
      clasificacionId: '',
      clasificacionNombre: ''
    });
    setEditingArticulo(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este artículo?')) {
      setArticulos(articulos.filter(a => a.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({
      nombre: '',
      descripcion: '',
      codigo: '',
      categoria: '',
      marcaId: '',
      marcaNombre: '',
      clasificacionId: '',
      clasificacionNombre: ''
    });
    setEditingArticulo(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Package size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingArticulo 
                ? 'Modifique la información del artículo' 
                : 'Complete la información para registrar un nuevo artículo'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-foreground mb-4">Información del Artículo</h3>
                <div className="grid grid-cols-1 gap-6">
                  {/* Nombre */}
                  <MaterialInput
                    label="Nombre del Artículo *"
                    type="text"
                    placeholder="Ej: Laptop Dell Inspiron 15"
                    fullWidth
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    helperText="Nombre descriptivo del artículo"
                    required
                  />

                  {/* Código and Categoría side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MaterialInput
                      label="Código del Artículo *"
                      type="text"
                      placeholder="Ej: PERF-001-2024"
                      fullWidth
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      helperText="Código único de identificación"
                      required
                    />

                    {/* Categoría Dropdown */}
                    <div>
                      <label className="text-sm text-foreground mb-2 block">
                        Categoría del Producto *
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                                   focus:border-primary rounded-t transition-colors outline-none
                                   flex items-center justify-between text-left"
                        >
                          <span className={formData.categoria ? 'text-foreground' : 'text-muted-foreground'}>
                            {formData.categoria ? getCategoryLabel(formData.categoria) : 'Seleccione una categoría'}
                          </span>
                          <ChevronDown size={20} className="text-muted-foreground" />
                        </button>
                        
                        {showCategoryDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setShowCategoryDropdown(false)}
                            />
                            <div className="absolute z-20 mt-1 w-full bg-surface elevation-3 rounded overflow-hidden">
                              {categorias.map(categoria => (
                                <button
                                  key={categoria.value}
                                  type="button"
                                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors text-foreground flex items-center gap-3"
                                  onClick={() => {
                                    setFormData({ ...formData, categoria: categoria.value });
                                    setShowCategoryDropdown(false);
                                  }}
                                >
                                  <Sparkles size={16} className="text-primary" />
                                  {categoria.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Tipo de producto cosmético o de belleza
                      </p>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Ingrese una descripción detallada del artículo..."
                      rows={4}
                      className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                               focus:border-primary rounded-t transition-colors outline-none resize-none"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Descripción completa del artículo incluyendo características y especificaciones
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand and Classification Section */}
              <div>
                <h3 className="text-foreground mb-4">Marca y Clasificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand Dropdown */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Marca *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMarcaDropdown(!showMarcaDropdown)}
                        className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none
                                 flex items-center justify-between text-left"
                      >
                        <span className={formData.marcaId ? 'text-foreground' : 'text-muted-foreground'}>
                          {formData.marcaId ? formData.marcaNombre : 'Seleccione una marca'}
                        </span>
                        <ChevronDown size={20} className="text-muted-foreground" />
                      </button>
                      
                      {showMarcaDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMarcaDropdown(false)}
                          />
                          <div className="absolute z-20 mt-1 w-full bg-surface elevation-3 rounded overflow-hidden">
                            {marcasDisponibles.map(marca => (
                              <button
                                key={marca.id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors text-foreground flex items-center gap-3"
                                onClick={() => {
                                  setFormData({ ...formData, marcaId: marca.id, marcaNombre: marca.nombre });
                                  setShowMarcaDropdown(false);
                                }}
                              >
                                <Sparkles size={16} className="text-primary" />
                                {marca.nombre}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Marca del producto
                    </p>
                  </div>

                  {/* Classification Dropdown */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Clasificación *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowClasificacionDropdown(!showClasificacionDropdown)}
                        className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none
                                 flex items-center justify-between text-left"
                      >
                        <span className={formData.clasificacionId ? 'text-foreground' : 'text-muted-foreground'}>
                          {formData.clasificacionId ? formData.clasificacionNombre : 'Seleccione una clasificación'}
                        </span>
                        <ChevronDown size={20} className="text-muted-foreground" />
                      </button>
                      
                      {showClasificacionDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowClasificacionDropdown(false)}
                          />
                          <div className="absolute z-20 mt-1 w-full bg-surface elevation-3 rounded overflow-hidden">
                            {clasificacionesDisponibles.map(clasificacion => (
                              <button
                                key={clasificacion.id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors text-foreground flex items-center gap-3"
                                onClick={() => {
                                  setFormData({ ...formData, clasificacionId: clasificacion.id, clasificacionNombre: clasificacion.nombre });
                                  setShowClasificacionDropdown(false);
                                }}
                              >
                                <Sparkles size={16} className="text-primary" />
                                {clasificacion.nombre}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Clasificación del producto
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Todos los campos son obligatorios. El código del artículo debe ser único 
                  para facilitar su identificación en el sistema.
                </p>
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
                {editingArticulo ? 'Actualizar Artículo' : 'Guardar Artículo'}
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
              <Package size={32} className="text-primary" />
              <h2 className="text-foreground">Artículos</h2>
            </div>
            <p className="text-muted-foreground">
              Administre el catálogo de artículos de la empresa
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nuevo Artículo
          </MaterialButton>
        </div>

        {/* Artículos Table */}
        {articulos.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Código</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Marca</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Clasificación</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Categoría</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {articulos.map((articulo) => {
                    return (
                      <tr key={articulo.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Sparkles size={20} className="text-primary" />
                            </div>
                            <span className="text-foreground font-mono text-sm">{articulo.codigo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-foreground">{articulo.nombre}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
                            {articulo.marcaNombre}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700 border border-orange-200">
                            {articulo.clasificacionNombre}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs ${getCategoryColor(articulo.categoria)}`}>
                            {getCategoryLabel(articulo.categoria)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm line-clamp-2">
                            {articulo.descripcion}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<Edit size={16} />}
                              onClick={() => handleEdit(articulo)}
                            >
                              Editar
                            </MaterialButton>
                            <MaterialButton
                              variant="text"
                              color="secondary"
                              startIcon={<Trash2 size={16} />}
                              onClick={() => handleDelete(articulo.id)}
                            >
                              Eliminar
                            </MaterialButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Package size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay artículos registrados</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando un nuevo artículo al catálogo
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primer Artículo
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}