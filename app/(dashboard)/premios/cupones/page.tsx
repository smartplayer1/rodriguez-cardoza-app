/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Ticket, Plus, Edit, Trash2, Save, X, Search, Filter, ChevronDown, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface Cupon {
  id: string;
  nombre: string;
  monto: number;
  fechaVencimiento: string;
  activo: boolean;
  createdAt: string;
}

export default function Cupones() {
  const [cupones, setCupones] = useState<Cupon[]>([
    {
      id: '1',
      nombre: 'Cupón Bienvenida $500',
      monto: 500,
      fechaVencimiento: '2025-12-31',
      activo: true,
      createdAt: '2024-12-01'
    },
    {
      id: '2',
      nombre: 'Cupón Descuento $250',
      monto: 250,
      fechaVencimiento: '2024-11-30',
      activo: true,
      createdAt: '2024-11-01'
    },
    {
      id: '3',
      nombre: 'Cupón VIP $1000',
      monto: 1000,
      fechaVencimiento: '2025-06-30',
      activo: true,
      createdAt: '2024-12-10'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    monto: 0,
    fechaVencimiento: '',
    activo: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'activo' | 'vencido'>('all');

  const handleCreate = () => {
    setEditingCupon(null);
    setFormData({
      nombre: '',
      monto: 0,
      fechaVencimiento: '',
      activo: true
    });
    setShowCreateEdit(true);
  };

  const handleEdit = (cupon: Cupon) => {
    setEditingCupon(cupon);
    setFormData({
      nombre: cupon.nombre,
      monto: cupon.monto,
      fechaVencimiento: cupon.fechaVencimiento,
      activo: cupon.activo
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre del cupón');
      return;
    }

    if (formData.monto <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    if (!formData.fechaVencimiento) {
      alert('Por favor ingrese la fecha de vencimiento');
      return;
    }

    const nuevoCupon: Cupon = {
      id: editingCupon?.id || Date.now().toString(),
      nombre: formData.nombre,
      monto: formData.monto,
      fechaVencimiento: formData.fechaVencimiento,
      activo: formData.activo,
      createdAt: editingCupon?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (editingCupon) {
      setCupones(cupones.map(c => c.id === editingCupon.id ? nuevoCupon : c));
    } else {
      setCupones([...cupones, nuevoCupon]);
    }

    setShowCreateEdit(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este cupón?')) {
      setCupones(cupones.filter(c => c.id !== id));
    }
  };

  const handleToggleActivo = (id: string) => {
    setCupones(cupones.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  const isVencido = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return vencimiento < hoy;
  };

  // Filtering
  const filteredCupones = cupones.filter(cupon => {
    const matchesSearch = cupon.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const vencido = isVencido(cupon.fechaVencimiento);
    const matchesEstado = filterEstado === 'all' || 
                          (filterEstado === 'activo' && cupon.activo && !vencido) ||
                          (filterEstado === 'vencido' && (vencido || !cupon.activo));
    return matchesSearch && matchesEstado;
  });

  // Create/Edit Form
  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-foreground mb-2">
                {editingCupon ? 'Editar Cupón' : 'Nuevo Cupón'}
              </h2>
              <p className="text-muted-foreground">
                {editingCupon ? 'Modifique los datos del cupón' : 'Complete los datos para crear un nuevo cupón'}
              </p>
            </div>
            <MaterialButton
              variant="text"
              color="secondary"
              startIcon={<X size={18} />}
              onClick={() => setShowCreateEdit(false)}
            >
              Cancelar
            </MaterialButton>
          </div>

          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <MaterialInput
                    label="Nombre del Cupón *"
                    fullWidth
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Cupón Bienvenida $500"
                  />
                </div>

                <MaterialInput
                  label="Monto del Cupón *"
                  type="number"
                  fullWidth
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />

                <MaterialInput
                  label="Fecha de Vencimiento *"
                  type="date"
                  fullWidth
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                />

                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="activo" className="text-sm text-foreground">
                    Cupón Activo
                  </label>
                </div>
              </div>

              {formData.monto > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded p-4">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <DollarSign size={16} />
                    <span className="text-sm">Valor del Cupón:</span>
                  </div>
                  <p className="text-2xl text-foreground font-mono">
                    ${formData.monto.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-border">
                <MaterialButton
                  variant="contained"
                  color="primary"
                  startIcon={<Save size={18} />}
                  onClick={handleSave}
                >
                  {editingCupon ? 'Actualizar Cupón' : 'Crear Cupón'}
                </MaterialButton>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  startIcon={<X size={18} />}
                  onClick={() => setShowCreateEdit(false)}
                >
                  Cancelar
                </MaterialButton>
              </div>
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Ticket size={32} className="text-primary" />
            <h2 className="text-foreground">Cupones</h2>
          </div>
          <p className="text-muted-foreground">
            Gestione los cupones disponibles para usar como premios en los incentivos
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                className="pl-10 pr-10 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="all">Todos los cupones</option>
                <option value="activo">Activos</option>
                <option value="vencido">Vencidos/Inactivos</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Nuevo Cupón
            </MaterialButton>
          </div>
        </div>

        {/* Cupones List */}
        {filteredCupones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCupones.map((cupon) => {
              const vencido = isVencido(cupon.fechaVencimiento);
              const estado = !cupon.activo ? 'inactivo' : vencido ? 'vencido' : 'activo';

              return (
                <div key={cupon.id} className="bg-surface rounded elevation-2 p-6 hover:elevation-4 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Ticket size={24} className="text-primary" />
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        estado === 'activo'
                          ? 'bg-green-100 text-green-700'
                          : estado === 'vencido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {estado === 'activo' && <CheckCircle size={12} />}
                        {estado === 'vencido' && <AlertCircle size={12} />}
                        {estado === 'activo' ? 'Activo' : estado === 'vencido' ? 'Vencido' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-foreground mb-3">{cupon.nombre}</h3>

                  <div className="space-y-3 mb-4">
                    <div className="bg-primary/10 border border-primary/20 rounded p-3">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <DollarSign size={16} />
                        <span className="text-xs">Valor del Cupón</span>
                      </div>
                      <p className="text-xl text-foreground font-mono">
                        ${cupon.monto.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>Vence: {cupon.fechaVencimiento}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <MaterialButton
                      variant="text"
                      color="primary"
                      startIcon={<Edit size={16} />}
                      onClick={() => handleEdit(cupon)}
                    >
                      Editar
                    </MaterialButton>
                    <MaterialButton
                      variant="text"
                      color="secondary"
                      startIcon={cupon.activo ? <X size={16} /> : <CheckCircle size={16} />}
                      onClick={() => handleToggleActivo(cupon.id)}
                    >
                      {cupon.activo ? 'Desactivar' : 'Activar'}
                    </MaterialButton>
                    <button
                      onClick={() => handleDelete(cupon.id)}
                      className="text-red-600 hover:text-red-700 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Ticket size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay cupones</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterEstado !== 'all'
                ? 'No se encontraron cupones con los filtros aplicados'
                : 'Comience creando un nuevo cupón'}
            </p>
            {!searchTerm && filterEstado === 'all' && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Crear Primer Cupón
              </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export function to get cupones for use in other components
export function getCuponesActivos(): Array<{id: string, nombre: string, monto: number}> {
  // This would normally fetch from a database or state management
  // For now, we'll return mock data
  return [
    { id: '1', nombre: 'Cupón Bienvenida $500', monto: 500 },
    { id: '2', nombre: 'Cupón Descuento $250', monto: 250 },
    { id: '3', nombre: 'Cupón VIP $1000', monto: 1000 }
  ];
}
