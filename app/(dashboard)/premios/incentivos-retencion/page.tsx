'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import CreateEditModal from '@/components/create-edit-modal';
import { Gift, Plus, Edit, Trash2, X, Eye, Settings, Award, Package, DollarSign, ChevronDown, Search, Filter, CheckCircle, Calendar, Ticket } from 'lucide-react';
import { Promotion } from '@/app/type/incentive';

export default function IncentivosRetencion() {
  const [activeView, setActiveView] = useState<'reglas' | 'incentivos-generados'>('reglas');
 
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={32} className="text-primary" />
            <h2 className="text-foreground">Incentivo por Acumulación de Producto</h2>
          </div>
          <p className="text-muted-foreground">
            Configure reglas automáticas de incentivos y gestione incentivos generados
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-surface rounded elevation-2 mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveView('reglas')}
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                activeView === 'reglas'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings size={20} />
              <span>Reglas de Incentivos</span>
              {activeView === 'reglas' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveView('incentivos-generados')}
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                activeView === 'incentivos-generados'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award size={20} />
              <span>Incentivos Generados</span>
              {activeView === 'incentivos-generados' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeView === 'reglas' ? <ReglasIncentivos /> : <ReglasIncentivos />}
      </div>
    </div>
  );
}

function ReglasIncentivos() {
  const [reglas, setReglas] = useState<Promotion[]>([]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingRegla, setEditingRegla] = useState<Promotion | null>(null);
  const [viewingRegla, setViewingRegla] = useState<Promotion | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'activa' | 'inactiva'>('all');

  const handleCreate = () => {
    setEditingRegla(null);
    setShowCreateEdit(true);
  };

  const handleSave = (regla: Promotion) => {

    setReglas(prev => {
      const exists = prev.some(r => r.id === regla.id);
      if (exists) {
        return prev.map(r => r.id === regla.id ? regla : r);
      }
      return [...prev, regla];
    });
  };

    const handleEdit = (regla: Promotion) => {
      setEditingRegla(regla);
      setShowCreateEdit(true);
    };

  
  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar esta regla de incentivo?')) {
      setReglas(reglas.filter(r => r.id !== id));
    }
  };

  const handleToggleActiva = (id: number) => {
    setReglas(reglas.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };


  

  // Filtering
  const filteredReglas = reglas.filter(regla => {
    const matchesSearch = regla.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          regla.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || 
                          (filterEstado === 'activa' && regla.isActive) ||
                          (filterEstado === 'inactiva' && !regla.isActive);
    return matchesSearch && matchesEstado;
  });

  // View Detail Modal
  if (viewingRegla) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg elevation-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-primary" />
                <h3 className="text-foreground">Detalle de Regla de Incentivo</h3>
              </div>
              <button
                onClick={() => setViewingRegla(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Información Básica</h4>
                <div className="bg-muted/30 rounded p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nombre:</span>
                    <span className="text-foreground">{viewingRegla.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Descripción:</span>
                    <span className="text-foreground">{viewingRegla.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo de Regla:</span>
                    <div className="flex items-center gap-2">
                      {viewingRegla.ruleType === 'productos' ? (
                        <Package size={16} className="text-primary" />
                      ) : (
                        <DollarSign size={16} className="text-green-600" />
                      )}
                      <span className="text-foreground">
                        {viewingRegla.ruleType === 'productos' ? 'Por Productos' : 'Por Monto'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Periodo de Vigencia:</span>
                    <span className="text-foreground">
                      {viewingRegla.startDate} al {viewingRegla.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      viewingRegla.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingRegla.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condiciones 
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Condiciones de Cumplimiento</h4>
                <div className="bg-muted/30 rounded p-4">
                  {viewingRegla.ruleType === 'productos' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground mb-3">Productos Requeridos:</p>
                      {viewingRegla.productVolumeConditions.map((producto, index) => (
                        <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            <span className="text-sm text-foreground">{getArticuloNombre(producto.articleCode)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Monto Mínimo de Compra:</span>
                      <span className="text-lg text-green-600 font-mono">
                        {viewingRegla.currency} {viewingRegla.amountCondition.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos del Incentivo 
              {viewingRegla.rewardProducts.length > 0 && (
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">Productos del Incentivo</h4>
                  <div className="bg-muted/30 rounded p-4 space-y-2">
                    {viewingRegla.rewardProducts.map((producto, index) => (
                      <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                        <div className="flex items-center gap-2">
                          <Gift size={16} className="text-primary" />
                          <span className="text-sm text-foreground">{getArticuloNombre(producto.articleCode)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Cantidad: <span className="text-foreground font-mono">{producto.quantity}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              */}
              {/* Cupones del Incentivo */}
              {viewingRegla.rewardCoupons.length > 0 && (
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">Cupones del Incentivo</h4>
                  <div className="bg-muted/30 rounded p-4 space-y-2">
                    {viewingRegla.rewardCoupons.map((cupon, index) => (
                      <div key={index} className="flex items-center justify-between bg-surface p-3 rounded">
                        <div className="flex items-center gap-2">
                          <Ticket size={16} className="text-primary" />
                          <span className="text-sm text-foreground">{cupon.coupon.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Monto: <span className="text-foreground font-mono">${cupon.coupon.amount.toFixed(2)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <MaterialButton
                variant="outlined"
                color="secondary"
                onClick={() => setViewingRegla(null)}
              >
                Cerrar
              </MaterialButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateEdit) {
    return (
      <CreateEditModal
        initialRule={editingRegla}
        onClose={() => setShowCreateEdit(false)}
        onSave={handleSave}
      />
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
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
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as 'all' | 'activa' | 'inactiva')}
              className="pl-10 pr-10 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none appearance-none"
            >
              <option value="all">Todas las reglas</option>
              <option value="activa">Activas</option>
              <option value="inactiva">Inactivas</option>
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Regla
          </MaterialButton>
        </div>
      </div>

      {/* Reglas List */}
      {filteredReglas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredReglas.map((regla) => (
            <div key={regla.id} className="bg-surface rounded elevation-2 p-6 hover:elevation-4 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-foreground">{regla.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      regla.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {regla.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                      {regla.ruleType === 'productos' ? (
                        <>
                          <Package size={14} />
                          <span>Por Productos</span>
                        </>
                      ) : (
                        <>
                          <DollarSign size={14} />
                          <span>Por Monto</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{regla.description}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar size={14} />
                    <span>Vigencia: {regla.startDate} al {regla.endDate}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Condiciones */}
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-2">Condiciones:</p>
                      {regla.ruleType === 'productos' ? (
                        <div className="flex flex-col space-y-1 ">
                          {regla.productVolumeConditions.map(item =>   <span key={item.id} className="text-xs text-foreground"> {item.articleCode} </span>)}
                       
                        </div>
                      ) : (
                        <div className="text-sm text-foreground font-mono">
                          {regla.currency} {regla.amountCondition.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Incentivos 
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-2">Premios:</p>
                      <div className="space-y-1">
                        {regla.rewardProducts.map((p, i) => (
                          <div key={i} className="text-xs text-foreground">
                            • {getArticuloNombre(p.articleCode)} (x{p.quantity})
                          </div>
                        ))}
                        {regla.rewardCoupons.map((c, i) => (
                          <div key={`cupon-${i}`} className="text-xs text-foreground">
                            • {c.coupon.name} (${c.coupon.amount})
                          </div>
                        ))}
                      </div>
                    </div>
                    */}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <MaterialButton
                    variant="text"
                    color="primary"
                    startIcon={<Eye size={16} />}
                    onClick={() => setViewingRegla(regla)}
                  >
                    Ver
                  </MaterialButton>
                  <MaterialButton
                    variant="text"
                    color="primary"
                    startIcon={<Edit size={16} />}
                    onClick={() => handleEdit(regla)}
                  >
                    Editar
                  </MaterialButton>
                  <MaterialButton
                    variant="text"
                    color="secondary"
                    startIcon={regla.isActive ? <X size={16} /> : <CheckCircle size={16} />}
                    onClick={() => handleToggleActiva(regla.id)}
                  >
                    {regla.isActive ? 'Desactivar' : 'Activar'}
                  </MaterialButton>
                  <button
                    onClick={() => handleDelete(regla.id)}
                    className="text-red-600 hover:text-red-700 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded elevation-2 py-16 text-center">
          <Settings size={64} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-foreground mb-2">No hay reglas de incentivos</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterEstado !== 'all'
              ? 'No se encontraron reglas con los filtros aplicados'
              : 'Comience creando una nueva regla de incentivo'}
          </p>
          {!searchTerm && filterEstado === 'all' && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Regla
            </MaterialButton>
          )}
        </div>
      )}
    </div>
  );
}

