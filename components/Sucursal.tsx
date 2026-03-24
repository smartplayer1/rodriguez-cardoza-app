import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { MapPin, Plus, Edit, Trash2, Save, X, CreditCard, ChevronDown } from 'lucide-react';
import Cajas from './Cajas';

interface Sucursal {
  id: string;
  codigo: string;
  nombre: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  createdAt: string;
}

// Nicaragua's departments and cities
const departamentosYCiudades: Record<string, string[]> = {
  'Managua': ['Managua', 'Ciudad Sandino', 'Tipitapa', 'San Rafael del Sur', 'Villa El Carmen'],
  'León': ['León', 'La Paz Centro', 'Nagarote', 'Telica', 'El Sauce'],
  'Chinandega': ['Chinandega', 'Corinto', 'El Viejo', 'Chichigalpa', 'Somotillo'],
  'Masaya': ['Masaya', 'Nindirí', 'Catarina', 'San Juan de Oriente', 'Masatepe'],
  'Granada': ['Granada', 'Nandaime', 'Diriomo', 'Diriá'],
  'Carazo': ['Jinotepe', 'Diriamba', 'San Marcos', 'Dolores', 'Santa Teresa'],
  'Rivas': ['Rivas', 'San Juan del Sur', 'Tola', 'Moyogalpa', 'Altagracia'],
  'Estelí': ['Estelí', 'Condega', 'La Trinidad', 'Pueblo Nuevo'],
  'Madriz': ['Somoto', 'San Lucas', 'Las Sabanas', 'Totogalpa'],
  'Nueva Segovia': ['Ocotal', 'Jalapa', 'Dipilto', 'Mozonte'],
  'Jinotega': ['Jinotega', 'San Rafael del Norte', 'La Concordia'],
  'Matagalpa': ['Matagalpa', 'Sébaco', 'Ciudad Darío', 'San Ramón'],
  'Boaco': ['Boaco', 'Camoapa', 'San Lorenzo', 'Santa Lucía'],
  'Chontales': ['Juigalpa', 'Santo Tomás', 'La Libertad', 'San Pedro de Lóvago'],
  'RACCS': ['Bluefields', 'El Rama', 'Laguna de Perlas', 'Kukra Hill'],
  'RACCN': ['Bilwi (Puerto Cabezas)', 'Waspán', 'Siuna', 'Rosita', 'Bonanza'],
  'Río San Juan': ['San Carlos', 'San Miguelito', 'El Castillo']
};

export default function Sucursal() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([
    {
      id: '1',
      codigo: 'SUC001',
      nombre: 'Sucursal Central',
      departamento: 'Managua',
      ciudad: 'Managua',
      direccion: 'Centro Comercial Metrocentro, Local 45',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      codigo: 'SUC002',
      nombre: 'Sucursal Norte',
      departamento: 'Estelí',
      ciudad: 'Estelí',
      direccion: 'Avenida Central, frente al parque',
      createdAt: '2024-03-10'
    },
    {
      id: '3',
      codigo: 'SUC003',
      nombre: 'Sucursal Pacífico',
      departamento: 'León',
      ciudad: 'León',
      direccion: 'Calle Rubén Darío, 2 cuadras al sur',
      createdAt: '2024-05-20'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [viewingCajas, setViewingCajas] = useState<{ id: string; nombre: string } | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    departamento: 'Managua',
    ciudad: 'Managua',
    direccion: ''
  });
  const [availableCiudades, setAvailableCiudades] = useState<string[]>(departamentosYCiudades['Managua']);

  const handleCreate = () => {
    setEditingSucursal(null);
    setFormData({ codigo: '', nombre: '', departamento: 'Managua', ciudad: 'Managua', direccion: '' });
    setAvailableCiudades(departamentosYCiudades['Managua']);
    setShowCreateEdit(true);
  };

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      codigo: sucursal.codigo,
      nombre: sucursal.nombre,
      departamento: sucursal.departamento,
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion
    });
    setAvailableCiudades(departamentosYCiudades[sucursal.departamento] || departamentosYCiudades['Managua']);
    setShowCreateEdit(true);
  };

  const handleSave = () => {
    if (!formData.codigo.trim()) {
      alert('Por favor ingrese el código de sucursal');
      return;
    }

    if (!formData.nombre.trim() || !formData.departamento.trim() || !formData.ciudad.trim() || !formData.direccion.trim()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (editingSucursal) {
      // Update existing sucursal
      setSucursales(sucursales.map(s => 
        s.id === editingSucursal.id 
          ? { 
              ...s,
              codigo: formData.codigo,
              nombre: formData.nombre,
              departamento: formData.departamento,
              ciudad: formData.ciudad,
              direccion: formData.direccion
            }
          : s
      ));
    } else {
      // Create new sucursal
      const newSucursal: Sucursal = {
        id: Date.now().toString(),
        codigo: formData.codigo,
        nombre: formData.nombre,
        departamento: formData.departamento,
        ciudad: formData.ciudad,
        direccion: formData.direccion,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSucursales([...sucursales, newSucursal]);
    }

    setShowCreateEdit(false);
    setFormData({ codigo: '', nombre: '', departamento: 'Managua', ciudad: 'Managua', direccion: '' });
    setEditingSucursal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta sucursal?')) {
      setSucursales(sucursales.filter(s => s.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ codigo: '', nombre: '', departamento: 'Managua', ciudad: 'Managua', direccion: '' });
    setEditingSucursal(null);
  };

  const handleViewCajas = (sucursal: Sucursal) => {
    setViewingCajas({ id: sucursal.id, nombre: sucursal.nombre });
  };

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const departamento = e.target.value;
    const ciudades = departamentosYCiudades[departamento] || [];
    setAvailableCiudades(ciudades);
    setFormData({ 
      ...formData, 
      departamento, 
      ciudad: ciudades.length > 0 ? ciudades[0] : '' 
    });
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingSucursal 
                ? 'Modifique la información de la sucursal' 
                : 'Complete la información para registrar una nueva sucursal de la empresa'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Código */}
              <MaterialInput
                label="Código *"
                type="text"
                placeholder="Ej: SUC001"
                fullWidth
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                helperText="Código único de la sucursal"
                required
              />

              {/* Branch Name */}
              <MaterialInput
                label="Nombre de la Sucursal *"
                type="text"
                placeholder="Ej: Sucursal Central"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                helperText="Nombre identificativo de la sucursal"
                required
              />

              {/* Department */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Departamento *
                </label>
                <div className="relative">
                  <select
                    value={formData.departamento}
                    onChange={handleDepartamentoChange}
                    className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none appearance-none"
                    required
                  >
                    {Object.keys(departamentosYCiudades).map(departamento => (
                      <option key={departamento} value={departamento}>
                        {departamento}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccione el departamento donde se ubica la sucursal
                </p>
              </div>

              {/* City */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Ciudad *
                </label>
                <div className="relative">
                  <select
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none appearance-none"
                    required
                  >
                    {availableCiudades.map(ciudad => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccione la ciudad donde se encuentra la sucursal
                </p>
              </div>

              {/* Address */}
              <MaterialInput
                label="Dirección *"
                type="text"
                placeholder="Ej: Centro Comercial Metrocentro, Local 45"
                fullWidth
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                helperText="Dirección completa de la sucursal"
                required
              />

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Todos los campos son obligatorios. Asegúrese de ingresar correctamente la 
                  información de ubicación de la sucursal para mantener un registro preciso.
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
                {editingSucursal ? 'Actualizar Sucursal' : 'Guardar Sucursal'}
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

  if (viewingCajas) {
    return (
      <Cajas 
        sucursalId={viewingCajas.id} 
        sucursalNombre={viewingCajas.nombre}
        onBack={() => setViewingCajas(null)}
      />
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
              <MapPin size={32} className="text-primary" />
              <h2 className="text-foreground">Sucursales</h2>
            </div>
            <p className="text-muted-foreground">
              Administre las sucursales de la empresa
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Sucursal
          </MaterialButton>
        </div>

        {/* Sucursales Table */}
        {sucursales.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Código</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Departamento</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Ciudad</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Fecha de Registro</th>
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sucursales.map((sucursal) => (
                    <tr key={sucursal.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-foreground font-mono">{sucursal.codigo}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin size={20} className="text-primary" />
                          </div>
                          <span className="text-foreground">{sucursal.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{sucursal.departamento}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{sucursal.ciudad}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {new Date(sucursal.createdAt).toLocaleDateString('es-NI', {
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
                            onClick={() => handleEdit(sucursal)}
                          >
                            Editar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(sucursal.id)}
                          >
                            Eliminar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<CreditCard size={16} />}
                            onClick={() => handleViewCajas(sucursal)}
                          >
                            Cajas
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
            <MapPin size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay sucursales registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando una nueva sucursal de la empresa
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Sucursal
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}