'use client';

import React, { useState } from 'react';
import { MaterialButton } from '../../../components/MaterialButton';
import { Package, Plus, Edit, Trash2, Sparkles} from 'lucide-react';
import { CrearArticulo } from './modals/CrearArticulo';
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
  const [open, setOpen] = useState(false);
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

 
  const handleCreate = () => { setOpen(true) };

  const handleEdit = (articulo: Articulo) => {
  /*  setEditingArticulo(articulo);
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
    setShowCreateEdit(true);*/
  };
 
  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este artículo?')) {
      setArticulos(articulos.filter(a => a.id !== id));
    }
  };

  // List View
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
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
       <CrearArticulo
          isOpen={open}
          onClose={() => setOpen(false)}
        />
    </div>
  );
}