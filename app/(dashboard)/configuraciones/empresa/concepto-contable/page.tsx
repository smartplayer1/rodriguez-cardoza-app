'use client';
import React, { useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { FileText, Plus, Edit, Trash2, Save, X, TrendingDown, TrendingUp, ListCheck } from 'lucide-react';
import { deleteAccountingConcept, getAccountingConceptCategories, getAccountingConcepts, postAccountingConcept, updateAccountingConcept } from '@/app/lib/api/company/accounting-concept';

interface Concepto {
  id: number;
  name: string;
  category:{
    id: number;
    name: string;
  }
}

type TabType = 'Egreso' | 'Ingreso';

export default function ConceptosContables() {
  const [activeTab, setActiveTab] = useState<TabType>('Egreso');
  
  const [conceptos, setConceptos] = useState<Concepto[]>([]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState<Concepto | null>(null);
  const [accountingConceptCategory, setAccountingConceptCategory] = useState<[{ id: number; name: string }]>([{ id: 0, name: '' }]);
  const [formData, setFormData] = useState({
    nombre: '',
    categoryId: 0,
  });

  // Filter conceptos by active tab
  const filteredConceptos = conceptos.filter(c => c.category.name === activeTab);

  const handleCreate = () => {
    setEditingConcepto(null);
    setFormData({ nombre: '', categoryId: 0 });
    setShowCreateEdit(true);
  };

  const handleEdit = (concepto: Concepto) => {
    setEditingConcepto(concepto);
    setFormData({
      nombre: concepto.name,
      categoryId: concepto.category.id
    });
    setShowCreateEdit(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      alert('Por favor complete el campo requerido');
      return;
    }

    if (editingConcepto) {
    
    const response =  await updateAccountingConcept({
        id: editingConcepto.id,
        name: formData.nombre,
        categoryId: formData.categoryId
      });

      if (!response.ok) {
        throw new Error('Failed to update accounting concept');
      }

      setConceptos(conceptos.map(c => 
        c.id === editingConcepto.id 
          ? { 
              ...c, 
              name: formData.nombre
            }
          : c
      ));
    } else {

    const response =   await postAccountingConcept({
        name: formData.nombre,
        categoryId: formData.categoryId
      });
      if (!response.ok) {
        throw new Error('Failed to create accounting concept');
      }


      const newConcepto: Concepto = await response.json();

      setConceptos([...conceptos, newConcepto]);
    }

    setShowCreateEdit(false);
    setFormData({ nombre: '', categoryId: 0 });
    setEditingConcepto(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro que desea eliminar este concepto contable?')) {
    const response =  await deleteAccountingConcept(id);
      if (!response.ok) {
        throw new Error('Failed to delete accounting concept');
      }
      setConceptos(conceptos.filter(c => c.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ nombre: '', categoryId: 0 });
    setEditingConcepto(null);
  };

  useEffect(() => {
    // Simulate fetching conceptos contables from an API
    const fetchConceptos = async () => {
      const response = await getAccountingConceptCategories();
      setAccountingConceptCategory(response);

      const conceptosResponse = await getAccountingConcepts();

      setConceptos(conceptosResponse?.records || []); };

    fetchConceptos();
  }, []);

  if (showCreateEdit) {
    const isEgreso = editingConcepto ? editingConcepto.category.name === 'Egreso' : activeTab === 'Egreso';
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
             <div>
                <label className="text-sm text-foreground mb-2 block">
                  Categoría *
                </label>
                <div className="relative">
                  <ListCheck size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none"
                  >
                      <option value="">
                        Seleccione una categoría
                      </option>
                    { accountingConceptCategory.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccione la categoría del concepto contable para clasificarlo correctamente en sus registros financieros.
                </p>
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
  const isEgreso = activeTab === 'Egreso';
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
              onClick={() => setActiveTab('Egreso')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
                activeTab === 'Egreso'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <TrendingDown size={20} />
              <span>Conceptos de Egreso</span>
              <span className={`px-2 py-1 rounded text-xs ${
                activeTab === 'Egreso'
                  ? 'bg-white/20'
                  : 'bg-surface'
              }`}>
                {conceptos.filter(c => c.category.name === 'Egreso').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('Ingreso')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all ${
                activeTab === 'Ingreso'
                  ? 'bg-primary text-white border-b-4 border-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <TrendingUp size={20} />
              <span>Conceptos de Ingreso</span>
              <span className={`px-2 py-1 rounded text-xs ${
                activeTab === 'Ingreso'
                  ? 'bg-white/20'
                  : 'bg-surface'
              }`}>
                {conceptos.filter(c => c.category.name === 'Ingreso').length}
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
            Nuevo Concepto de {activeTab === 'Egreso' ? 'Egreso' : 'Ingreso'}
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
                    const isConceptoEgreso = concepto.category.name === 'Egreso';
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
                            <span className="text-foreground">{concepto.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${conceptoBgClass} ${conceptoColorClass}`}>
                            <ConceptoIcon size={14} />
                           <span className="text-foreground">{concepto.category.name}</span>
                          </span>
                        </td>
                       {/* <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm">
                            {new Date(concepto.createdAt).toLocaleDateString('es-NI', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </td> */}
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
              Comience agregando un nuevo concepto para clasificar sus {activeTab === 'Egreso' ? 'egresos' : 'ingresos'}
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primer Concepto de {activeTab === 'Egreso' ? 'Egreso' : 'Ingreso'}
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
