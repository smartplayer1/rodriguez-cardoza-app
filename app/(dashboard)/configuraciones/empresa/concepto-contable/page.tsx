'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { FileText, Plus, Edit, Trash2, Save, X, TrendingDown, TrendingUp } from 'lucide-react';

interface Concepto {
  id: string;
  nombre: string;
  tipo: 'egreso' | 'ingreso';
  createdAt: string;
}

type TabType = 'egreso' | 'ingreso';

export default function ConceptosContables() {
  const [activeTab, setActiveTab] = useState<TabType>('egreso');
  
  const [conceptos, setConceptos] = useState<Concepto[]>([
    // Conceptos de Egreso
    {
      id: '1',
      nombre: 'Pago de Salarios',
      tipo: 'egreso',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      nombre: 'Compra de Suministros',
      tipo: 'egreso',
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      nombre: 'Pago de Servicios Públicos',
      tipo: 'egreso',
      createdAt: '2024-02-10'
    },
    {
      id: '4',
      nombre: 'Alquiler de Local',
      tipo: 'egreso',
      createdAt: '2024-02-15'
    },
    // Conceptos de Ingreso
    {
      id: '5',
      nombre: 'Venta de Productos',
      tipo: 'ingreso',
      createdAt: '2024-01-15'
    },
    {
      id: '6',
      nombre: 'Venta de Servicios',
      tipo: 'ingreso',
      createdAt: '2024-01-22'
    },
    {
      id: '7',
      nombre: 'Intereses Bancarios',
      tipo: 'ingreso',
      createdAt: '2024-02-05'
    },
    {
      id: '8',
      nombre: 'Comisiones',
      tipo: 'ingreso',
      createdAt: '2024-03-01'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState<Concepto | null>(null);
  const [formData, setFormData] = useState({
    nombre: ''
  });

  // Filter conceptos by active tab
  const filteredConceptos = conceptos.filter(c => c.tipo === activeTab);

  const handleCreate = () => {
    setEditingConcepto(null);
    setFormData({ nombre: '' });
    setShowCreateEdit(true);
  };

  const handleEdit = (concepto: Concepto) => {
    setEditingConcepto(concepto);
    setFormData({
      nombre: concepto.nombre
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      alert('Por favor complete el campo requerido');
      return;
    }

    if (editingConcepto) {
      // Update existing concepto
      setConceptos(conceptos.map(c => 
        c.id === editingConcepto.id 
          ? { 
              ...c, 
              nombre: formData.nombre
            }
          : c
      ));
    } else {
      // Create new concepto
      const newConcepto: Concepto = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        tipo: activeTab,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setConceptos([...conceptos, newConcepto]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '' });
    setEditingConcepto(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este concepto contable?')) {
      setConceptos(conceptos.filter(c => c.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ nombre: '' });
    setEditingConcepto(null);
  };

  if (showCreateEdit) {
    const isEgreso = editingConcepto ? editingConcepto.tipo === 'egreso' : activeTab === 'egreso';
    const Icon = isEgreso ? TrendingDown : TrendingUp;
    const colorClass = isEgreso ? 'text-red-600' : 'text-green-600';
    const categoryName = isEgreso ? 'Egreso' : 'Ingreso';

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingConcepto ? 'Editar Concepto Contable' : 'Nuevo Concepto Contable'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingConcepto 
                ? 'Modifique la información del concepto contable' 
                : `Complete la información para registrar un nuevo concepto de ${categoryName.toLowerCase()}`}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Category Badge */}
              <div className={`${isEgreso ? 'bg-red-50' : 'bg-green-50'} border ${isEgreso ? 'border-red-200' : 'border-green-200'} rounded p-4 flex items-center gap-3`}>
                <Icon size={20} className={colorClass} />
                <div>
                  <p className={`text-xs ${colorClass} mb-1`}>Categoría</p>
                  <p className="text-foreground">Concepto de {categoryName}</p>
                </div>
              </div>

              {/* Nombre */}
              <MaterialInput
                label="Nombre del Concepto *"
                type="text"
                placeholder={`Ej: ${isEgreso ? 'Pago de Salarios' : 'Venta de Productos'}`}
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                helperText="Nombre descriptivo del concepto contable"
                required
              />

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Los conceptos contables son categorías que le permiten clasificar sus {isEgreso ? 'egresos' : 'ingresos'} 
                  {' '}de manera organizada para un mejor control financiero.
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
                {editingConcepto ? 'Actualizar Concepto' : 'Guardar Concepto'}
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
  const isEgreso = activeTab === 'egreso';
  const Icon = isEgreso ? TrendingDown : TrendingUp;
  const colorClass = isEgreso ? 'text-red-600' : 'text-green-600';
  const bgColorClass = isEgreso ? 'bg-red-600' : 'bg-green-600';

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={32} className="text-primary" />
              <h2 className="text-foreground">Conceptos Contables</h2>
            </div>
            <p className="text-muted-foreground">
              Administre los conceptos de egreso e ingreso para clasificar transacciones
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface rounded elevation-2 mb-6 overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('egreso')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
                activeTab === 'egreso'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <TrendingDown size={20} />
              <span>Conceptos de Egreso</span>
              <span className={`px-2 py-1 rounded text-xs ${
                activeTab === 'egreso'
                  ? 'bg-white/20'
                  : 'bg-surface'
              }`}>
                {conceptos.filter(c => c.tipo === 'egreso').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ingreso')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
                activeTab === 'ingreso'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <TrendingUp size={20} />
              <span>Conceptos de Ingreso</span>
              <span className={`px-2 py-1 rounded text-xs ${
                activeTab === 'ingreso'
                  ? 'bg-white/20'
                  : 'bg-surface'
              }`}>
                {conceptos.filter(c => c.tipo === 'ingreso').length}
              </span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6 flex justify-end">
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nuevo Concepto de {activeTab === 'egreso' ? 'Egreso' : 'Ingreso'}
          </MaterialButton>
        </div>

        {/* Conceptos Table */}
        {filteredConceptos.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Nombre del Concepto</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Categoría</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha de Registro</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredConceptos.map((concepto) => {
                    const isConceptoEgreso = concepto.tipo === 'egreso';
                    const ConceptoIcon = isConceptoEgreso ? TrendingDown : TrendingUp;
                    const conceptoColorClass = isConceptoEgreso ? 'text-red-600' : 'text-green-600';
                    const conceptoBgClass = isConceptoEgreso ? 'bg-red-50' : 'bg-green-50';

                    return (
                      <tr key={concepto.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${conceptoBgClass} flex items-center justify-center flex-shrink-0`}>
                              <ConceptoIcon size={20} className={conceptoColorClass} />
                            </div>
                            <span className="text-foreground">{concepto.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${conceptoBgClass} ${conceptoColorClass}`}>
                            <ConceptoIcon size={14} />
                            {isConceptoEgreso ? 'Egreso' : 'Ingreso'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm">
                            {new Date(concepto.createdAt).toLocaleDateString('es-NI', {
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
                              onClick={() => handleEdit(concepto)}
                            >
                              Editar
                            </MaterialButton>
                            <MaterialButton
                              variant="text"
                              color="secondary"
                              startIcon={<Trash2 size={16} />}
                              onClick={() => handleDelete(concepto.id)}
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
            <div className={`w-16 h-16 rounded-full ${isEgreso ? 'bg-red-50' : 'bg-green-50'} flex items-center justify-center mx-auto mb-4`}>
              <Icon size={32} className={colorClass} />
            </div>
            <h3 className="text-foreground mb-2">
              No hay conceptos de {activeTab} registrados
            </h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando un nuevo concepto para clasificar sus {activeTab === 'egreso' ? 'egresos' : 'ingresos'}
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primer Concepto de {activeTab === 'egreso' ? 'Egreso' : 'Ingreso'}
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
