'use client';

import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Briefcase, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Posicion {
  id: string;
  nombre: string;
  createdAt: string;
}

export default function Cargos() {
  const [cargos, setCargos] = useState<Posicion[]>([
    {
      id: '1',
      nombre: 'Gerente General',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      nombre: 'Contador',
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      nombre: 'Asistente Contable',
      createdAt: '2024-02-10'
    },
    {
      id: '4',
      nombre: 'Cajero',
      createdAt: '2024-02-15'
    },
    {
      id: '5',
      nombre: 'Auxiliar Administrativo',
      createdAt: '2024-03-01'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingPosicion, setEditingPosicion] = useState<Posicion | null>(null);
  const [formData, setFormData] = useState({
    nombre: ''
  });

  const handleCreate = () => {
    setEditingPosicion(null);
    setFormData({ nombre: '' });
    setShowCreateEdit(true);
  };

  const handleEdit = (posicion: Posicion) => {
    setEditingPosicion(posicion);
    setFormData({
      nombre: posicion.nombre
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert('Por favor complete el campo requerido');
      return;
    }

    if (editingPosicion) {
      // Update existing posicion
      setCargos(cargos.map(p => 
        p.id === editingPosicion.id 
          ? { 
              ...p, 
              nombre: formData.nombre
            }
          : p
      ));
    } else {
      // Create new posicion
      const newPosicion: Posicion = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCargos([...cargos, newPosicion]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '' });
    setEditingPosicion(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este cargo?')) {
      setCargos(cargos.filter(p => p.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ nombre: '' });
    setEditingPosicion(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingPosicion ? 'Editar Posición' : 'Nueva Posición'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingPosicion 
                ? 'Modifique la información de la posición' 
                : 'Complete la información para registrar una nueva posición'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Nombre */}
              <MaterialInput
                label="Nombre del Cargo *"
                type="text"
                placeholder="Ej: Gerente General"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                helperText="Nombre descriptivo del cargo"
                required
              />

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Los cargos son utilizadas para clasificar a los empleados
                  en la empresa. Asegúrese de crear los cargos necesarios antes de registrar empleados.
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
                {editingPosicion ? 'Actualizar Cargo' : 'Guardar Cargo'}
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
              <Briefcase size={32} className="text-primary" />
              <h2 className="text-foreground">Cargos</h2>
            </div>
            <p className="text-muted-foreground">
              Administre los cargos de la empresa
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Posición
          </MaterialButton>
        </div>

        {/* Cargos Table */}
        {cargos.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Nombre del Cargo</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha de Registro</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargos.map((posicion) => (
                    <tr key={posicion.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Briefcase size={20} className="text-primary" />
                          </div>
                          <span className="text-foreground">{posicion.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {new Date(posicion.createdAt).toLocaleDateString('es-NI', {
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
                            onClick={() => handleEdit(posicion)}
                          >
                            Editar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(posicion.id)}
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
            <Briefcase size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay cargos registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando una nueva posición para clasificar a sus empleados
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Posición
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
