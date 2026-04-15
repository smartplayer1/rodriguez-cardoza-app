'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Building2, Plus, Edit, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  abbreviation: string;
  imageUrl: string;
}

export default function Bancos() {
  const [banks, setBanks] = useState<Bank[]>([
    {
      id: '1',
      name: 'Banco de América Central',
      abbreviation: 'BAC',
      imageUrl: 'https://via.placeholder.com/80x80?text=BAC'
    },
    {
      id: '2',
      name: 'Banco de Finanzas',
      abbreviation: 'BDF',
      imageUrl: 'https://via.placeholder.com/80x80?text=BDF'
    },
    {
      id: '3',
      name: 'Banco Atlántida',
      abbreviation: 'BANATLÁN',
      imageUrl: 'https://via.placeholder.com/80x80?text=ATL'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    imageUrl: ''
  });

  const handleCreate = () => {
    setEditingBank(null);
    setFormData({ name: '', abbreviation: '', imageUrl: '' });
    setShowCreateEdit(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      abbreviation: bank.abbreviation,
      imageUrl: bank.imageUrl
    });
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (editingBank) {
      // Update existing bank
      setBanks(banks.map(b => 
        b.id === editingBank.id 
          ? { ...b, ...formData }
          : b
      ));
    } else {
      // Create new bank
      const newBank: Bank = {
        id: Date.now().toString(),
        ...formData,
        imageUrl: formData.imageUrl || 'https://via.placeholder.com/80x80?text=BANK'
      };
      setBanks([...banks, newBank]);
    }

    setShowCreateEdit(false);
    setFormData({ name: '', abbreviation: '', imageUrl: '' });
    setEditingBank(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este banco?')) {
      setBanks(banks.filter(b => b.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ name: '', abbreviation: '', imageUrl: '' });
    setEditingBank(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Building2 size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingBank ? 'Editar Banco' : 'Crear Banco'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingBank 
                ? 'Modifique la información del banco' 
                : 'Complete la información para registrar un nuevo banco'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Image Preview */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Imagen del Banco
                </label>
                <div className="border-2 border-dashed border-border rounded p-6 flex flex-col items-center justify-center gap-4 mb-4 bg-muted/30">
                  {formData.imageUrl ? (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128x128?text=ERROR';
                      }}
                    />
                  ) : (
                    <ImageIcon size={64} className="text-muted-foreground" />
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Ingrese la URL de la imagen del banco
                  </p>
                </div>

                <MaterialInput
                  label="URL de Imagen"
                  type="text"
                  placeholder="https://ejemplo.com/logo.png"
                  fullWidth
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  helperText="URL completa de la imagen del banco (opcional)"
                />
              </div>

              {/* Right Column - Bank Details */}
              <div className="flex flex-col gap-6">
                <MaterialInput
                  label="Nombre del Banco *"
                  type="text"
                  placeholder="Ej: Banco de América Central"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  helperText="Nombre completo de la institución bancaria"
                  required
                />

                <MaterialInput
                  label="Abreviatura *"
                  type="text"
                  placeholder="Ej: BAC"
                  fullWidth
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  helperText="Abreviatura o código del banco"
                  required
                />

                <div className="bg-primary/5 border border-primary/20 rounded p-4">
                  <p className="text-xs text-primary mb-2">Información</p>
                  <p className="text-sm text-foreground">
                    Los campos marcados con * son obligatorios. La imagen es opcional 
                    y se mostrará en la lista de bancos.
                  </p>
                </div>
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
                {editingBank ? 'Actualizar Banco' : 'Guardar Banco'}
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
              <Building2 size={32} className="text-primary" />
              <h2 className="text-foreground">Bancos</h2>
            </div>
            <p className="text-muted-foreground">
              Gestione las instituciones bancarias del sistema
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nuevo Banco
          </MaterialButton>
        </div>

        {/* Banks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <div 
              key={bank.id} 
              className="bg-surface rounded elevation-2 overflow-hidden hover:elevation-3 transition-shadow"
            >
              {/* Bank Image */}
              <div className="bg-muted/30 p-6 flex items-center justify-center border-b border-border">
                <img 
                  src={bank.imageUrl} 
                  alt={bank.name}
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=BANK';
                  }}
                />
              </div>

              {/* Bank Info */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-foreground mb-2">{bank.name}</h3>
                  <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded">
                    <span className="text-sm">{bank.abbreviation}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <MaterialButton
                    variant="outlined"
                    color="primary"
                    startIcon={<Edit size={16} />}
                    onClick={() => handleEdit(bank)}
                    className="flex-1"
                  >
                    Editar
                  </MaterialButton>
                  <MaterialButton
                    variant="outlined"
                    color="secondary"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => handleDelete(bank.id)}
                  >
                    Eliminar
                  </MaterialButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {banks.length === 0 && (
          <div className="text-center py-16">
            <Building2 size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay bancos registrados</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando un nuevo banco al sistema
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primer Banco
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
