/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Ticket, Plus, Edit, Trash2, Save, X, Search, Filter, ChevronDown, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { createRewardCoupon, deleteRewardCoupon, getRewardCoupon, updateRewardCoupon } from '@/app/services/coupon';
import { CouponRecord, CouponResponse } from '@/app/type/reward';

type Coupon = CouponRecord;
type CouponForm = Omit<CouponRecord, 'id'>;

export default function Cupones() {
  const [cupones, setCupones] = useState<Coupon[]>([]);
  const [paging, setPaging] = useState<CouponResponse['paging'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingCupon, setEditingCupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState<CouponForm>({
    name: '',
    amount: 0,
    expirationDate: '',
    isActive: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'activo' | 'vencido'>('all');

  useEffect(() => {
    const loadCupones = async () => {
      setLoading(true);
      setError(null);

      try {
   

        const data: CouponResponse = await getRewardCoupon();
        setCupones(data.records);
        setPaging(data.paging);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los cupones');
      } finally {
        setLoading(false);
      }
    };

    loadCupones();
  }, []);

  const handleCreate = () => {
    setEditingCupon(null);
    setFormData({
      name: '',
      amount: 0,
      expirationDate: '',
      isActive: true,
    });
    setShowCreateEdit(true);
  };

  const handleEdit = async (cupon: Coupon) => {
    setEditingCupon(cupon);
    setFormData({
      name: cupon.name,
      amount: cupon.amount,
      expirationDate: cupon.expirationDate,
      isActive: cupon.isActive,
    });
    setShowCreateEdit(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Por favor ingrese el nombre del cupón');
      return;
    }

    if (formData.amount <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    if (!formData.expirationDate) {
      alert('Por favor ingrese la fecha de vencimiento');
      return;
    }

    try {
      if (editingCupon) {
        const updatedCoupon = await updateRewardCoupon({
          id: editingCupon.id,
          ...formData,
          expirationDate: new Date(formData.expirationDate).toISOString()
        });
        setCupones(cupones.map(c => (c.id === editingCupon.id ? updatedCoupon : c)));
      } else {
        const createdCoupon = await createRewardCoupon({...formData, expirationDate: new Date(formData.expirationDate).toISOString()});
        setCupones([...cupones, createdCoupon]);
      }
      setShowCreateEdit(false);
      setEditingCupon(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar el cupón';
      alert(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este cupón?')) {
      return;
    }

    try {
      await deleteRewardCoupon(id);
      setCupones(cupones.filter(c => c.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar el cupón';
      alert(message);
    }
  };

  const handleToggleActivo = (id: number) => {
    setCupones(cupones.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const isVencido = (expirationDate: string) => {
    const hoy = new Date();
    const vencimiento = new Date(expirationDate);
    return vencimiento < hoy;
  };

  // Filtering
  const filteredCupones = cupones.filter(cupon => {
    const matchesSearch = cupon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const vencido = isVencido(cupon.expirationDate);
    const matchesEstado = filterEstado === 'all' ||
      (filterEstado === 'activo' && cupon.isActive && !vencido) ||
      (filterEstado === 'vencido' && (vencido || !cupon.isActive));
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Cupón Bienvenida $500"
                  />
                </div>

                <MaterialInput
                  label="Monto del Cupón *"
                  type="number"
                  fullWidth
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData,amount: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />

                <MaterialInput
                  label="Fecha de Vencimiento *"
                  type="date"
                  fullWidth
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value})}
                />

                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="activo" className="text-sm text-foreground">
                    Cupón Activo
                  </label>
                </div>
              </div>

              {formData.amount > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded p-4">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <DollarSign size={16} />
                    <span className="text-sm">Valor del Cupón:</span>
                  </div>
                  <p className="text-2xl text-foreground font-mono">
                    ${formData.amount.toFixed(2)}
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
            {loading ? (
              <p className="text-sm text-muted-foreground mt-3">Cargando cupones...</p>
            ) : error ? (
              <p className="text-sm text-destructive mt-3">{error}</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">
                Mostrando {filteredCupones.length} de {paging?.totalRecords ?? cupones.length} cupones · Página {paging?.currentPage ?? 1} de {paging?.totalPages ?? 1}
              </p>
            )}
          </div>

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
              const vencido = isVencido(cupon.expirationDate);
              const estado = !cupon.isActive ? 'inactivo' : vencido ? 'vencido' : 'activo';

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

                  <h3 className="text-foreground mb-3">{cupon.name}</h3>

                  <div className="space-y-3 mb-4">
                    <div className="bg-primary/10 border border-primary/20 rounded p-3">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <DollarSign size={16} />
                        <span className="text-xs">Valor del Cupón</span>
                      </div>
                      <p className="text-xl text-foreground font-mono">
                        ${cupon.amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>Vence: {cupon.expirationDate}</span>
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
                      startIcon={cupon.isActive ? <X size={16} /> : <CheckCircle size={16} />}
                      onClick={() => handleToggleActivo(cupon.id)}
                    >
                      {cupon.isActive ? 'Desactivar' : 'Activar'}
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
export function getCuponesActivos(): Array<{ id: number; name: string; amount: number }> {
  // This would normally fetch from a database or state management
  // For now, we'll return mock data using the API shape.
  return [
    { id: 1, name: 'Cupón Bienvenida $500', amount: 500 },
    { id: 2, name: 'Cupón Descuento $250', amount: 250 },
    { id: 3, name: 'Cupón VIP $1000', amount: 1000 },
  ];
}
