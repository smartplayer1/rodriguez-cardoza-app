import { useState, useEffect } from 'react';
import { Package, Save, X, ChevronDown } from 'lucide-react';
import { Article, ArticleRecord } from '@/app/type/article';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  article?: ArticleRecord | null;
  onSave: (article: ArticleRecord) => Promise<void>;
}

const categorias = [
  { value: 'Perfume', label: 'Perfume' },
  { value: 'Maquillaje', label: 'Maquillaje' },
  { value: 'Cuidado Piel', label: 'Cuidado de la Piel' },
  { value: 'Accesorios', label: 'Accesorios de Belleza' },
  {value: 'ZERMAT', label: 'ZERMAT'},
  {value: 'MATERIAL', label: 'MATERIAL'},
  {value: 'REVER', label: 'REVER'},
];

export function CrearArticulo({ isOpen, onClose, article, onSave }: Props) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ArticleRecord>({
    id: 0,
    name: '',
    description: '',
    category: '',
    code: ''
  });

  // Cargar datos cuando se abre el modal o cuando cambia el artículo
  useEffect(() => {
    if (isOpen) {
      if (article) {
        setFormData(article);
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, article]);

  const getCategoryLabel = (value: string) =>
    categorias.find(c => c.value === value)?.label || value;

  const resetForm = () => {
    setFormData({
      id:0,
      name: '',
      description: '',
      category: '',
      code: ''
    });
    setErrors({});
    setShowCategoryDropdown(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Debe seleccionar una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // El padre maneja la lógica de guardado/actualización
      onSave(formData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!article;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg shadow-2xl">
        <div className="bg-white">
          {/* Header con gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {isEditing ? 'Actualiza la información del artículo' : 'Completa los datos del nuevo artículo'}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">
            <div className="space-y-5">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Artículo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all focus:outline-none ${
                    errors.name
                      ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholder="Ej: Perfume Floral"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Código + Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Código */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código del Artículo *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all focus:outline-none ${
                      errors.code
                        ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                    placeholder="Ej: PER-001"
                  />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className={`w-full px-4 py-2.5 border-2 rounded-lg flex justify-between items-center transition-all focus:outline-none ${
                        errors.category
                          ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      } bg-white`}
                    >
                      <span className={formData.category ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.category
                          ? getCategoryLabel(formData.category)
                          : 'Seleccione categoría'}
                      </span>
                      <ChevronDown size={20} className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showCategoryDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowCategoryDropdown(false)}
                        />
                        <div className="absolute z-20 w-full bg-white border-2 border-gray-200 rounded-lg mt-2 shadow-lg overflow-hidden">
                          {categorias.map(c => (
                            <button
                              key={c.value}
                              onClick={() => {
                                setFormData({ ...formData, category: c.value });
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-700 font-medium"
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all focus:outline-none resize-none ${
                    errors.description
                      ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholder="Describe las características del artículo..."
                  rows={4}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="bg-gray-50 px-8 py-4 flex gap-3 justify-end border-t">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
