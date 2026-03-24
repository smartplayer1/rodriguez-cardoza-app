import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Tag, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Marca {
  id: string;
  nombre: string;
  descripcion: string;
  createdAt: string;
}

export default function Marcas() {
  const [marcas, setMarcas] = useState<Marca[]>([
    {
      id: '1',
      nombre: 'Chanel',
      descripcion: 'Marca de lujo francesa especializada en perfumes y cosméticos de alta gama',
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      nombre: 'Dior',
      descripcion: 'Casa de moda francesa conocida por sus fragancias exclusivas y maquillaje premium',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      nombre: 'MAC Cosmetics',
      descripcion: 'Marca profesional de maquillaje reconocida mundialmente',
      createdAt: '2024-02-01'
    },
    {
      id: '4',
      nombre: 'La Roche-Posay',
      descripcion: 'Marca dermocosmética francesa especializada en cuidado de la piel',
      createdAt: '2024-02-10'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const handleCreate = () => {
    setEditingMarca(null);
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setShowCreateEdit(true);
  };

  const handleEdit = (marca: Marca) => {
    setEditingMarca(marca);
    setFormData({
      nombre: marca.nombre,
      descripcion: marca.descripcion
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre de la marca');
      return;
    }

    if (editingMarca) {
      setMarcas(marcas.map(m => 
        m.id === editingMarca.id 
          ? { ...m, nombre: formData.nombre, descripcion: formData.descripcion }
          : m
      ));
    } else {
      const newMarca: Marca = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setMarcas([...marcas, newMarca]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingMarca(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta marca?')) {
      setMarcas(marcas.filter(m => m.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingMarca(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Tag size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingMarca 
                ? 'Modifique la información de la marca' 
                : 'Complete la información para registrar una nueva marca'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              <MaterialInput
                label="Nombre de la Marca *"
                type="text"
                placeholder="Ej: Chanel"
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
                  placeholder="Descripción de la marca..."
                  rows={4}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded 
                           focus:border-primary focus:ring-2 focus:ring-primary/20 
                           outline-none transition-all text-foreground resize-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Los campos marcados con * son obligatorios.
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
                {editingMarca ? 'Actualizar Marca' : 'Guardar Marca'}
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
              <h2 className="text-foreground">Marcas</h2>
            </div>
            <p className="text-muted-foreground">
              Administre las marcas de productos
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Marca
          </MaterialButton>
        </div>

        {/* Marcas Table */}
        {marcas.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha de Creación</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {marcas.map((marca) => (
                    <tr key={marca.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Tag size={20} className="text-primary" />
                          </div>
                          <span className="text-foreground">{marca.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {marca.descripcion || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {new Date(marca.createdAt).toLocaleDateString('es-NI')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Edit size={16} />}
                            onClick={() => handleEdit(marca)}
                          >
                            Editar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(marca.id)}
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
        ) : (
          // Empty State
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Tag size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay marcas registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando una nueva marca de productos
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Marca
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
