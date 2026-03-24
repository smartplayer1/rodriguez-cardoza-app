import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { CreditCard, Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react';

interface Caja {
  id: string;
  nombre: string;
  descripcion: string;
  sucursalId: string;
  createdAt: string;
}

interface CajasProps {
  sucursalId: string;
  sucursalNombre: string;
  onBack: () => void;
}

export default function Cajas({ sucursalId, sucursalNombre, onBack }: CajasProps) {
  // Mock data - in real app, this would be filtered by sucursalId from a database
  const [cajas, setCajas] = useState<Caja[]>([
    {
      id: '1',
      nombre: 'Caja Principal',
      descripcion: 'Caja principal para atención al cliente',
      sucursalId: sucursalId,
      createdAt: '2024-01-20'
    },
    {
      id: '2',
      nombre: 'Caja Rápida',
      descripcion: 'Caja express para pagos rápidos',
      sucursalId: sucursalId,
      createdAt: '2024-02-15'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const handleCreate = () => {
    setEditingCaja(null);
    setFormData({ nombre: '', descripcion: '' });
    setShowCreateEdit(true);
  };

  const handleEdit = (caja: Caja) => {
    setEditingCaja(caja);
    setFormData({
      nombre: caja.nombre,
      descripcion: caja.descripcion
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (editingCaja) {
      // Update existing caja
      setCajas(cajas.map(c => 
        c.id === editingCaja.id 
          ? { 
              ...c, 
              nombre: formData.nombre,
              descripcion: formData.descripcion
            }
          : c
      ));
    } else {
      // Create new caja
      const newCaja: Caja = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        sucursalId: sucursalId,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCajas([...cajas, newCaja]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingCaja(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta caja?')) {
      setCajas(cajas.filter(c => c.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingCaja(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <MaterialButton
              variant="text"
              color="primary"
              startIcon={<ArrowLeft size={18} />}
              onClick={handleCancel}
              className="mb-4"
            >
              Volver a la Lista
            </MaterialButton>
            
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingCaja ? 'Editar Caja' : 'Nueva Caja'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingCaja 
                ? 'Modifique la información de la caja' 
                : `Complete la información para registrar una nueva caja en ${sucursalNombre}`}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Sucursal Info Badge */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4 flex items-center gap-3">
                <CreditCard size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-primary mb-1">Sucursal</p>
                  <p className="text-foreground">{sucursalNombre}</p>
                </div>
              </div>

              {/* Nombre */}
              <MaterialInput
                label="Nombre de la Caja *"
                type="text"
                placeholder="Ej: Caja Principal"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                helperText="Nombre identificativo de la caja"
                required
              />

              {/* Descripción */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Descripción *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: Caja principal para atención al cliente"
                  rows={4}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Descripción o propósito de la caja
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Todos los campos son obligatorios. Las cajas sirven para identificar 
                  los diferentes puntos de cobro en esta sucursal.
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
                {editingCaja ? 'Actualizar Caja' : 'Guardar Caja'}
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
        {/* Header with Back Button */}
        <div className="mb-6">
          <MaterialButton
            variant="text"
            color="primary"
            startIcon={<ArrowLeft size={18} />}
            onClick={onBack}
          >
            Volver a Sucursales
          </MaterialButton>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard size={32} className="text-primary" />
              <h2 className="text-foreground">Cajas</h2>
            </div>
            <p className="text-muted-foreground">
              Administre las cajas de <span className="text-primary">{sucursalNombre}</span>
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Caja
          </MaterialButton>
        </div>

        {/* Cajas Table */}
        {cajas.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha de Registro</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cajas.map((caja) => (
                    <tr key={caja.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CreditCard size={20} className="text-primary" />
                          </div>
                          <span className="text-foreground">{caja.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{caja.descripcion}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {new Date(caja.createdAt).toLocaleDateString('es-NI', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Edit size={16} />}
                            onClick={() => handleEdit(caja)}
                          >
                            Editar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(caja.id)}
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
            <CreditCard size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay cajas registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando una nueva caja para {sucursalNombre}
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Caja
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
