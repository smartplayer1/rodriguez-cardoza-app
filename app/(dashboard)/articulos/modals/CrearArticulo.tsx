import { useState } from 'react';
import { MaterialInput } from '../../../../components/MaterialInput';
import { MaterialButton } from '../../../../components/MaterialButton';
import { Package, Save, X, Sparkles, ChevronDown } from 'lucide-react';

interface Articulo {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  categoria: string;
  marcaId: string;
  marcaNombre: string;
  clasificacionId: string;
  clasificacionNombre: string;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const categorias = [
  { value: 'perfume', label: 'Perfume' },
  { value: 'maquillaje', label: 'Maquillaje' },
  { value: 'cuidado-piel', label: 'Cuidado de la Piel' },
  { value: 'accesorios', label: 'Accesorios de Belleza' }
];

const marcasDisponibles = [
  { id: '1', nombre: 'Chanel' },
  { id: '2', nombre: 'Dior' },
  { id: '3', nombre: 'MAC Cosmetics' },
  { id: '4', nombre: 'La Roche-Posay' }
];

const clasificacionesDisponibles = [
  { id: '1', nombre: 'Premium' },
  { id: '2', nombre: 'Estándar' },
  { id: '3', nombre: 'Económico' },
  { id: '4', nombre: 'Profesional' }
];

export function CrearArticulo({ isOpen, onClose }: Props) {
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);
  const [showClasificacionDropdown, setShowClasificacionDropdown] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigo: '',
    categoria: '',
    marcaId: '',
    marcaNombre: '',
    clasificacionId: '',
    clasificacionNombre: ''
  });

  const getCategoryLabel = (value: string) =>
    categorias.find(c => c.value === value)?.label || value;

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      codigo: '',
      categoria: '',
      marcaId: '',
      marcaNombre: '',
      clasificacionId: '',
      clasificacionNombre: ''
    });
    setEditingArticulo(null);
    setShowCategoryDropdown(false);
    setShowMarcaDropdown(false);
    setShowClasificacionDropdown(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) return alert('Ingrese nombre');
    if (!formData.codigo.trim()) return alert('Ingrese código');
    if (!formData.descripcion.trim()) return alert('Ingrese descripción');
    if (!formData.categoria.trim()) return alert('Seleccione categoría');
    if (!formData.marcaId.trim()) return alert('Seleccione marca');
    if (!formData.clasificacionId.trim()) return alert('Seleccione clasificación');

    // 👉 Aquí conectas tu API / backend

    console.log('Artículo guardado:', formData);

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="bg-surface rounded elevation-3 p-6">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Package size={32} className="text-primary" />
              <h2 className="text-foreground text-xl font-semibold">
                {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              Complete la información del artículo
            </p>
          </div>

          {/* Formulario */}
          <div className="space-y-6">

            {/* Nombre */}
            <MaterialInput
              label="Nombre del Artículo *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />

            {/* Código + Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <MaterialInput
                label="Código del Artículo *"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />

              {/* Categoría */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border flex justify-between items-center"
                >
                  <span>
                    {formData.categoria
                      ? getCategoryLabel(formData.categoria)
                      : 'Seleccione categoría'}
                  </span>
                  <ChevronDown size={20} />
                </button>

                {showCategoryDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    <div className="absolute z-20 w-full bg-surface elevation-3 rounded mt-1">
                      {categorias.map(c => (
                        <button
                          key={c.value}
                          onClick={() => {
                            setFormData({ ...formData, categoria: c.value });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                        >
                          <Sparkles size={14} />
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Descripción */}
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-3 border-b-2 border-border rounded-t bg-input-background"
              placeholder="Descripción del artículo..."
            />

            {/* Marca + Clasificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Marca */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMarcaDropdown(!showMarcaDropdown)}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border flex justify-between"
                >
                  {formData.marcaId ? formData.marcaNombre : 'Seleccione marca'}
                  <ChevronDown size={20} />
                </button>

                {showMarcaDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMarcaDropdown(false)} />
                    <div className="absolute z-20 w-full bg-surface elevation-3 rounded mt-1">
                      {marcasDisponibles.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              marcaId: m.id,
                              marcaNombre: m.nombre
                            });
                            setShowMarcaDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted"
                        >
                          {m.nombre}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Clasificación */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClasificacionDropdown(!showClasificacionDropdown)}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border flex justify-between"
                >
                  {formData.clasificacionId
                    ? formData.clasificacionNombre
                    : 'Seleccione clasificación'}
                  <ChevronDown size={20} />
                </button>

                {showClasificacionDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowClasificacionDropdown(false)} />
                    <div className="absolute z-20 w-full bg-surface elevation-3 rounded mt-1">
                      {clasificacionesDisponibles.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              clasificacionId: c.id,
                              clasificacionNombre: c.nombre
                            });
                            setShowClasificacionDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted"
                        >
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <MaterialButton
                onClick={handleSave}
                startIcon={<Save size={18} />}
              >
                Guardar
              </MaterialButton>

              <MaterialButton
                variant="outlined"
                onClick={handleCancel}
                startIcon={<X size={18} />}
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