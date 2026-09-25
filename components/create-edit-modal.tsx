import React, { useEffect, useState } from "react";
import { MaterialButton } from "./MaterialButton";
import { MaterialInput } from "./MaterialInput";
import {
  ChevronDown,
  DollarSign,
  Gift,
  Package,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  CreatePromotionRequest,
  ProductVolumeCondition,
  Promotion,
  RewardProduct,
} from "@/app/type/incentive";
import { getAllArticles } from "@/app/services/article";
import { ArticleRecord } from "@/app/type/article";
import { MultiProductPicker } from "@/components/MultiProductPicker";

let idSeq = 0;
const generateUniqueId = () => {
  idSeq += 1;
  return Date.now() * 1000 + idSeq;
};

const toDateInputValue = (value?: string) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
};

type RuleType = "ProductVolume" | "AmountPurchased" | "Mixed";
type ClientType = "Ambos" | "Promotor" | "Asesor";

interface FormData {
  name: string;
  startDate: string;
  endDate: string;
  withdrawalStartDate: string;
  withdrawalDeadline: string;
  ruleType: RuleType;
  description: string;
  isActive: boolean;
  amountCondition: number;
  productVolumeTargetQuantity: number;
  maxWinsPerClient: number | null;
  participantClientType: ClientType;
  productVolumeConditions: ProductVolumeCondition[];
  rewardProducts: RewardProduct[];
}

interface CreateEditModalProps {
  initialRule: Promotion | null;
  type: RuleType;
  onClose: () => void;
  onSave: (rule: CreatePromotionRequest) => void;
}

export default function CreateEditModal({
  initialRule,
  onClose,
  onSave,
  type,
}: CreateEditModalProps) {
  const [showAddCondicion, setShowAddCondicion] = useState(false);
  const [showAddIncentivo, setShowAddIncentivo] = useState(false);

  const editingRegla = initialRule;
  const [productosCondicion, setProductosCondicion] = useState<
    ProductVolumeCondition[]
  >(initialRule?.productVolumeConditions || []);
  const [productosIncentivo, setProductosIncentivo] = useState<RewardProduct[]>(
    initialRule?.rewardProducts || [],
  );

  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isMaxWinsUnlimited, setIsMaxWinsUnlimited] = useState(
    initialRule?.maxWinsPerClient == null,
  );
  const [formData, setFormData] = useState<FormData>({
    name: initialRule?.name || "",
    startDate: initialRule?.startDate || "",
    endDate: initialRule?.endDate || "",
    withdrawalStartDate: initialRule?.withdrawalStartDate || "",
    withdrawalDeadline: initialRule?.withdrawalDeadline || "",
    ruleType: type,
    description: initialRule?.description || "",
    isActive: initialRule?.isActive ?? true,
    amountCondition: initialRule?.amountCondition || 0,
    productVolumeTargetQuantity: initialRule?.productVolumeTargetQuantity || 0,
    maxWinsPerClient: initialRule?.maxWinsPerClient ?? null,
    participantClientType: initialRule?.participantClientType || "Ambos",
    productVolumeConditions: initialRule?.productVolumeConditions || [],
    rewardProducts: initialRule?.rewardProducts || [],
  });


  useEffect(() => {
    let mounted = true;

    const fetchResources = async () => {
      setIsLoadingResources(true);
      try {
        // GET /v1/article ahora pagina (10 por defecto): para llenar el
        // selector de productos hay que recorrer todas las páginas.
        const allArticles = await getAllArticles();
        if (!mounted) return;
        setArticles(allArticles);
      } catch (error) {
        if (!mounted) return;
        console.error("Error loading resources", error);
      } finally {
        if (mounted) setIsLoadingResources(false);
      }
    };

    fetchResources();

    return () => {
      mounted = false;
    };
  }, []);

  const getArticuloNombre = (articleCode: string) => {
    return (
      articles.find((articulo) => articulo.code === articleCode)?.name ||
      articleCode
    );
  };

  const removeProductoCondicion = (articleCode: string) => {
    setProductosCondicion(
      productosCondicion.filter((p) => p.articleCode !== articleCode),
    );
  };

  const addProductosIncentivoBatch = (
    selected: ArticleRecord[],
    quantity: number,
  ) => {
    const existingCodes = new Set(productosIncentivo.map((p) => p.articleCode));
    const nuevos = selected
      .filter((a) => !existingCodes.has(a.code))
      .map((a) => ({
        id: generateUniqueId(),
        articleCode: a.code,
        quantity,
      }));

    if (nuevos.length > 0) {
      setProductosIncentivo((prev) => [...prev, ...nuevos]);
    }
  };

  const removeProductoIncentivo = (articleCode: string) => {
    setProductosIncentivo(
      productosIncentivo.filter((p) => p.articleCode !== articleCode),
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Por favor ingrese el nombre de la regla");
      return;
    }

    if (!formData.startDate) {
      alert("Por favor ingrese la fecha de inicio");
      return;
    }

    if (!formData.endDate) {
      alert("Por favor ingrese la fecha de fin");
      return;
    }

    if (formData.endDate < formData.startDate) {
      alert("La fecha de fin debe ser mayor o igual a la fecha de inicio");
      return;
    }

    if (formData.ruleType === "ProductVolume" && productosCondicion.length === 0) {
      alert("Por favor agregue al menos un producto con condición");
      return;
    }

    if (formData.ruleType === "AmountPurchased" && formData.amountCondition <= 0) {
      alert("Por favor ingrese un monto mínimo válido");
      return;
    }

    if (!isMaxWinsUnlimited && (!formData.maxWinsPerClient || formData.maxWinsPerClient <= 0)) {
      alert("Por favor ingrese una cantidad válida de victorias máximas por cliente");
      return;
    }

    if (productosIncentivo.length === 0) {
      alert("Por favor agregue al menos un producto como incentivo");
      return;
    }

    const nuevaRegla: CreatePromotionRequest = {
      name: formData.name,
      description: formData.description,
      ruleType: formData.ruleType,
      isActive: formData.isActive,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      withdrawalStartDate: new Date(formData.withdrawalStartDate).toISOString(),
      withdrawalDeadline: new Date(formData.withdrawalDeadline).toISOString(),
      amountCondition:
      formData.ruleType === "AmountPurchased" ? formData.amountCondition : 0,
      productVolumeTargetQuantity: formData.ruleType === "ProductVolume" ? formData.productVolumeTargetQuantity : 0,
      maxWinsPerClient: isMaxWinsUnlimited ? null : formData.maxWinsPerClient,
      participantClientType: formData.participantClientType,
      productVolumeConditions:
        formData.ruleType === "ProductVolume" ? productosCondicion : [],
      rewardProducts: productosIncentivo.map((p) => ({
        articleCode: p.articleCode,
        quantity: p.quantity,
      })),
    };

   await onSave(nuevaRegla);
  };

  const addProductosCondicionBatch = (selected: ArticleRecord[]) => {
    const existingCodes = new Set(productosCondicion.map((p) => p.articleCode));
    const nuevos = selected
      .filter((a) => !existingCodes.has(a.code))
      .map((a) => ({
        id: generateUniqueId(),
        articleCode: a.code,
      }));

    if (nuevos.length > 0) {
      setProductosCondicion((prev) => [...prev, ...nuevos]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground">
          {editingRegla
            ? "Editar Regla de Incentivo"
            : "Nueva Regla de Incentivo"}
        </h3>
        <MaterialButton
          variant="text"
          color="secondary"
          startIcon={<X size={18} />}
          onClick={onClose}
        >
          Cancelar
        </MaterialButton>
      </div>

      <div className="bg-surface rounded elevation-2 p-6">
        <div className="space-y-6">
          {/* Información Básica */}
          <div>
            <h4 className="text-foreground mb-4">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <MaterialInput
                  label="Nombre de la Regla *"
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Compra de Perfumes Premium"
                />
              </div>
             {/* <div>
                <label className="text-sm text-foreground mb-2 block">
                  Tipo de Regla *
                </label>
                <div className="relative">
                  <select
                    value={formData.ruleType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ruleType: e.target.value as "ProductVolume" | "AmountPurchased",
                      })
                    }
                    className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                               focus:border-primary rounded-t transition-colors outline-none appearance-none"
                  >
                    <option value="ProductVolume">Por Volumen de Productos</option>
                    <option value="AmountPurchased">Por Monto Total Comprado</option>
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                </div>
              </div>
             */}
              { formData.ruleType === "ProductVolume" ?
              <MaterialInput
                label="Cantidad Acumular *"
                type="number"
                fullWidth
                value={formData.productVolumeTargetQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productVolumeTargetQuantity: Number.parseInt(
                      e.target.value,
                    ),
                  })
                }
                min={1}
              /> :
              <MaterialInput
                label="Monto Acumular *"
                type="number"
                fullWidth
                value={formData.amountCondition}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amountCondition: Number.parseFloat(
                      e.target.value,
                    ),
                  })
                }
                min={1}
              /> 
              }
              <div className="space-y-2">
                <MaterialInput
                label="Victorias máximas por cliente"
                type="number"
                fullWidth
                value={formData.maxWinsPerClient ?? ""}
                disabled={isMaxWinsUnlimited}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxWinsPerClient: e.target.value
                      ? Number.parseInt(e.target.value, 10)
                      : null,
                  })
                }
                min={1}
              />
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="maxWinsUnlimited"
                    checked={isMaxWinsUnlimited}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsMaxWinsUnlimited(checked);
                      setFormData({
                        ...formData,
                        maxWinsPerClient: checked
                          ? null
                          : (formData.maxWinsPerClient ?? 1),
                      });
                    }}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="maxWinsUnlimited" className="text-sm text-foreground">
                    Ilimitado
                  </label>
                </div>
              </div>
              <MaterialInput
                label="Fecha de Inicio *"
                type="date"
                fullWidth
                value={toDateInputValue(formData.startDate)}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
              <MaterialInput
                label="Fecha de Fin *"
                type="date"
                fullWidth
                value={toDateInputValue(formData.endDate)}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={toDateInputValue(formData.startDate)}
              />
              <MaterialInput
                label="Fecha de  Inicio de Entrega *"
                type="date"
                fullWidth
                value={toDateInputValue(formData.withdrawalStartDate)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    withdrawalStartDate: e.target.value,
                  })
                }
                min={toDateInputValue(formData.endDate)}
              />
              <MaterialInput
                label="Fecha de Fin de Entrega *"
                type="date"
                fullWidth
                value={toDateInputValue(formData.withdrawalDeadline)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    withdrawalDeadline: e.target.value,
                  })
                }
                min={toDateInputValue(formData.withdrawalStartDate)}
              />
              <div className="md:col-span-2">
                <label className="text-sm text-foreground mb-2 block">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none resize-none"
                  rows={3}
                  placeholder="Describa brevemente la regla de incentivo"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                />
                <label htmlFor="activa" className="text-sm text-foreground">
                  Regla Activa
                </label>
              </div>
            </div>
          </div>

          {/* Condiciones de Cumplimiento */}
          <div>
            <h4 className="text-foreground mb-4">
              Condiciones de Cumplimiento
            </h4>
            <div className="bg-muted/30 rounded p-4">
              {formData.ruleType === "ProductVolume" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Package size={16} />
                    <span>
                      El cliente debe adquirir los siguientes productos con las
                      cantidades mínimas:
                    </span>
                  </div>

                  {/* Lista de productos condición */}
                  {productosCondicion.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {productosCondicion.map((producto) => (
                        <div
                          key={producto.articleCode}
                          className="flex items-center justify-between bg-surface p-3 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            <span className="text-sm text-foreground">
                              {getArticuloNombre(producto.articleCode)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() =>
                                removeProductoCondicion(producto.articleCode)
                              }
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selector múltiple de productos */}
                  <MaterialButton
                    variant="outlined"
                    color="primary"
                    startIcon={<Plus size={18} />}
                    disabled={isLoadingResources}
                    onClick={() => setShowAddCondicion(true)}
                  >
                    Agregar Productos Condición
                  </MaterialButton>

                  <MultiProductPicker
                    isOpen={showAddCondicion}
                    onClose={() => setShowAddCondicion(false)}
                    title="Seleccionar productos condición"
                    articles={articles}
                    excludeCodes={productosCondicion.map((p) => p.articleCode)}
                    onConfirm={(selected) => addProductosCondicionBatch(selected)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <DollarSign size={16} />
                    <span>
                      El cliente debe alcanzar el siguiente monto mínimo de
                      compra:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MaterialInput
                      label="Monto Mínimo *"
                      type="number"
                      fullWidth
                      value={formData.amountCondition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amountCondition: Number(e.target.value),
                        })
                      }
                      min={0}
                      step={0.01}
                    />

                    <div>
                      <label className="text-sm text-foreground mb-2 block">
                        Dirigido a *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.participantClientType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              participantClientType: e.target.value as ClientType,
                            })
                          }
                          className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                     focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        >
                          <option value="Ambos">Ambos</option>
                          <option value="Promotor">Promotor</option>
                          <option value="Asesor">Asesor</option>
                        </select>
                        <ChevronDown
                          size={20}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.amountCondition > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded p-4">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <TrendingUp size={16} />
                        <span className="text-sm">Meta de Compra:</span>
                      </div>
                      <p className="text-2xl text-foreground font-mono">
                        {formData.amountCondition.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Productos del Incentivo */}
          <div>
            <h4 className="text-foreground mb-4">Productos del Incentivo</h4>
            <div className="bg-muted/30 rounded p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Gift size={16} />
                <span>
                  Productos que se entregarán al cumplir la condición:
                </span>
              </div>

              {/* Lista de productos incentivo */}
              {productosIncentivo.length > 0 && (
                <div className="space-y-2 mb-4">
                  {productosIncentivo.map((producto) => (
                    <div
                      key={producto.articleCode}
                      className="flex items-center justify-between bg-surface p-3 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-primary" />
                        <span className="text-sm text-foreground">
                          {getArticuloNombre(producto.articleCode)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Cantidad:{" "}
                          <span className="text-foreground font-mono">
                            {producto.quantity}
                          </span>
                        </span>
                        <button
                          onClick={() =>
                            removeProductoIncentivo(producto.articleCode)
                          }
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selector múltiple de productos */}
              <MaterialButton
                variant="outlined"
                color="primary"
                startIcon={<Plus size={18} />}
                disabled={isLoadingResources}
                onClick={() => setShowAddIncentivo(true)}
              >
                Agregar Productos Incentivo
              </MaterialButton>

              <MultiProductPicker
                isOpen={showAddIncentivo}
                onClose={() => setShowAddIncentivo(false)}
                title="Seleccionar productos incentivo"
                articles={articles}
                excludeCodes={productosIncentivo.map((p) => p.articleCode)}
                showQuantity
                onConfirm={(selected, quantity) =>
                  addProductosIncentivoBatch(selected, quantity)
                }
              />
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
            {editingRegla ? "Actualizar Regla" : "Crear Regla"}
          </MaterialButton>
          <MaterialButton
            variant="outlined"
            color="secondary"
            startIcon={<X size={18} />}
            onClick={onClose}
          >
            Cancelar
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
