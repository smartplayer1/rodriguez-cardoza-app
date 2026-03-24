import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Layers, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Clasificacion {
  id: string;
  nombre: string;
  descripcion: string;
  createdAt: string;
}

export default function Clasificaciones() {
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([
    {
      id: '1',
      nombre: 'Premium',
      descripcion: 'Productos de alta gama y lujo',
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      nombre: 'Estándar',
      descripcion: 'Productos de calidad media para uso general',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      nombre: 'Económico',
      descripcion: 'Productos de entrada accesibles',
      createdAt: '2024-02-01'
    },
    {
      id: '4',
      nombre: 'Profesional',
      descripcion: 'Productos para uso profesional en salones y clínicas',
      createdAt: '2024-02-10'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingClasificacion, setEditingClasificacion] = useState<Clasificacion | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const handleCreate = () => {
    setEditingClasificacion(null);
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setShowCreateEdit(true);
  };

  const handleEdit = (clasificacion: Clasificacion) => {
    setEditingClasificacion(clasificacion);
    setFormData({
      nombre: clasificacion.nombre,
      descripcion: clasificacion.descripcion
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre de la clasificación');
      return;
    }

    if (editingClasificacion) {
      setClasificaciones(clasificaciones.map(c => 
        c.id === editingClasificacion.id 
          ? { ...c, nombre: formData.nombre, descripcion: formData.descripcion }
          : c
      ));
    } else {
      const newClasificacion: Clasificacion = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setClasificaciones([...clasificaciones, newClasificacion]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingClasificacion(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta clasificación?')) {
      setClasificaciones(clasificaciones.filter(c => c.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingClasificacion(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Layers size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingClasificacion ? 'Editar Clasificación' : 'Nueva Clasificación'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingClasificacion 
                ? 'Modifique la información de la clasificación' 
                : 'Complete la información para registrar una nueva clasificación'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              <MaterialInput
                label="Nombre de la Clasificación *"
                type="text"
                placeholder="Ej: Premium"
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
                  placeholder="Descripción de la clasificación..."
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
                {editingClasificacion ? 'Actualizar Clasificación' : 'Guardar Clasificación'}
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
              <Layers size={32} className="text-primary" />
              <h2 className="text-foreground">Clasificaciones</h2>
            </div>
            <p className="text-muted-foreground">
              Administre las clasificaciones de productos
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Clasificación
          </MaterialButton>
        </div>

        {/* Clasificaciones Table */}
        {clasificaciones.length > 0 ? (
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
                  {clasificaciones.map((clasificacion) => (
                    <tr key={clasificacion.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Layers size={20} className="text-primary" />
                          </div>
                          <span className="text-foreground">{clasificacion.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {clasificacion.descripcion || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {new Date(clasificacion.createdAt).toLocaleDateString('es-NI')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Edit size={16} />}
                            onClick={() => handleEdit(clasificacion)}
                          >
                            Editar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(clasificacion.id)}
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
            <Layers size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay clasificaciones registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando una nueva clasificación de productos
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Clasificación
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
