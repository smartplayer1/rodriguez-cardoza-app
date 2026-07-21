"use client";
import React, { useCallback, useEffect, useState } from "react";
import { MaterialButton } from "@/components/MaterialButton";
import CreateEditModal from "@/components/create-edit-modal";
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  Settings,
  Award,
  Package,
  DollarSign,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  Ticket,
} from "lucide-react";
import { CreatePromotionRequest, Promotion } from "@/app/type/incentive";
import {
  createRewardIncentiveRule,
  updateRewardIncentiveRule,
  deleteRewardIncentiveRule,
  getRewardIncentiveRules,
} from "@/app/services/reward/incentive";
import { CardsSkeleton } from "@/components/ui/loading-skeleton";
import { useUserStore } from "@/app/store/useUserStore";
import { PERMISSIONS } from "@/app/domain/auth/permissions";

export default function IncentivosRetencion() {
  const [activeView, setActiveView] = useState<
    "reglas" | "incentivos-generados"
  >("reglas");

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={32} className="text-primary" />
            <h2 className="text-foreground">
              Incentivo por Acumulación de Producto
            </h2>
          </div>
          <p className="text-muted-foreground">
            Configure reglas automáticas de incentivos y gestione incentivos
            generados
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-surface rounded elevation-2 mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveView("reglas")}
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                activeView === "reglas"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings size={20} />
              <span>Reglas de Incentivos</span>
              {activeView === "reglas" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveView("incentivos-generados")}
              className={`flex items-center gap-2 px-6 py-4 transition-colors relative ${
                activeView === "incentivos-generados"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award size={20} />
              <span>Incentivos Generados</span>
              {activeView === "incentivos-generados" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeView === "reglas" ? <ReglasIncentivos /> : <ReglasIncentivos />}
      </div>
    </div>
  );
}

function ReglasIncentivos() {
  const { can } = useUserStore();
  const [reglas, setReglas] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingRegla, setEditingRegla] = useState<Promotion | null>(null);
  const [viewingRegla, setViewingRegla] = useState<Promotion | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<
    "all" | "activa" | "inactiva"
  >("all");
  const [filterRuleType, setFilterRuleType] = useState<
    "all" | "ProductVolume" | "AmountPurchased" | "Mixed"
  >("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterWithdrawalStartDate, setFilterWithdrawalStartDate] =
    useState("");
  const [filterWithdrawalDeadline, setFilterWithdrawalDeadline] = useState("");

  const handleCreate = () => {
    setEditingRegla(null);
    setShowCreateEdit(true);
  };

  const fetchReglas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRewardIncentiveRules({
        name: searchTerm || undefined,
        ruleType: 'ProductVolume', // filterRuleType === "all" ? undefined : filterRuleType,
        isActive:
          filterEstado === "all" ? undefined : filterEstado === "activa",
        startDate: filterStartDate
          ? new Date(filterStartDate).toISOString()
          : undefined,
        endDate: filterEndDate
          ? new Date(filterEndDate).toISOString()
          : undefined,
        withdrawalStartDate: filterWithdrawalStartDate
          ? new Date(filterWithdrawalStartDate).toISOString()
          : undefined,
        withdrawalDeadline: filterWithdrawalDeadline
          ? new Date(filterWithdrawalDeadline).toISOString()
          : undefined,
      });
      setReglas(data.records);
    } catch (error) {
      console.error("Error fetching reglas:", error);
    } finally {
      setLoading(false);
    }
  }, [
    searchTerm,
    filterEstado,
    filterRuleType,
    filterStartDate,
    filterEndDate,
    filterWithdrawalStartDate,
    filterWithdrawalDeadline,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReglas();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchReglas]);

  const handleSave = async (regla: CreatePromotionRequest) => {
    try {
      if (editingRegla) {
        const result = await updateRewardIncentiveRule({
          ...regla,
          id: editingRegla.id,
        } as CreatePromotionRequest & { id: number });
        setReglas((prev) => prev.map((r) => (r.id === result.id ? result : r)));
      } else {
        const result = await createRewardIncentiveRule(regla);
        setReglas((prev) => [...prev, result]);
      }
      setShowCreateEdit(false);
      setEditingRegla(null);
      await fetchReglas();
    } catch (error) {
      console.error("Error saving regla:", error);
    }
  };

  const handleEdit = (regla: Promotion) => {
    setEditingRegla(regla);
    setShowCreateEdit(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de eliminar esta regla de incentivo?")) {
      try {
        await deleteRewardIncentiveRule(id);
        setReglas(reglas.filter((r) => r.id !== id));
        await fetchReglas();
      } catch (error) {
        console.error("Error deleting regla:", error);
      }
    }
  };

  const hasAnyFilter =
    !!searchTerm ||
    filterEstado !== "all" ||
    filterRuleType !== "all" ||
    !!filterStartDate ||
    !!filterEndDate ||
    !!filterWithdrawalStartDate ||
    !!filterWithdrawalDeadline;

  // View Detail Modal
  if (viewingRegla) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg elevation-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-primary" />
                <h3 className="text-foreground">
                  Detalle de Regla de Incentivo
                </h3>
              </div>
              <button
                onClick={() => setViewingRegla(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">
                  Información Básica
                </h4>
                <div className="bg-muted/30 rounded p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Nombre:
                    </span>
                    <span className="text-foreground">{viewingRegla.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Descripción:
                    </span>
                    <span className="text-foreground">
                      {viewingRegla.description}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tipo de Regla:
                    </span>
                    <div className="flex items-center gap-2">
                      {viewingRegla.ruleType === "ProductVolume" ? (
                        <Package size={16} className="text-primary" />
                      ) : (
                        <DollarSign size={16} className="text-green-600" />
                      )}
                      <span className="text-foreground">
                        {viewingRegla.ruleType === "ProductVolume"
                          ? "Por Productos"
                          : "Por Monto"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Periodo de Vigencia:
                    </span>
                    <span className="text-foreground">
                      {new Date(viewingRegla.startDate).toLocaleDateString()} al{" "}
                      {new Date(viewingRegla.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Estado:
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        viewingRegla.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {viewingRegla.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              </div>

              {viewingRegla.ruleType === "ProductVolume" &&
                viewingRegla.productVolumeConditions.length > 0 && (
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">
                      Productos Requeridos
                    </h4>
                    <div className="bg-muted/30 rounded p-4 space-y-2">
                      {viewingRegla.productVolumeConditions.map(
                        (product, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-surface p-3 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-primary" />
                              <span className="text-sm text-foreground">
                                Código: {product.articleCode}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                      <div className="flex justify-between bg-surface p-3 rounded mt-2">
                        <span className="text-sm text-muted-foreground">
                          Cantidad Requerida:
                        </span>
                        <span className="text-foreground font-semibold">
                          {viewingRegla.productVolumeTargetQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {viewingRegla.ruleType === "AmountPurchased" &&
                viewingRegla.amountCondition > 0 && (
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">
                      Condición de Monto
                    </h4>
                    <div className="bg-muted/30 rounded p-4">
                      <div className="flex justify-between bg-surface p-3 rounded">
                        <span className="text-sm text-muted-foreground">
                          Monto Mínimo Requerido:
                        </span>
                        <span className="text-foreground font-semibold">
                          {viewingRegla.currency || "$"}{" "}
                          {viewingRegla.amountCondition.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {viewingRegla.rewardProducts.length > 0 && (
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">
                    Productos del Incentivo
                  </h4>
                  <div className="bg-muted/30 rounded p-4 space-y-2">
                    {viewingRegla.rewardProducts.map((producto, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-surface p-3 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Ticket size={16} className="text-primary" />
                          <span className="text-sm text-foreground">
                            {producto.articleCode}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Cantidad:{" "}
                          <span className="text-foreground font-mono">
                            {producto.quantity}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingRegla.rewardCoupons.length > 0 && (
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">
                    Cupones del Incentivo
                  </h4>
                  <div className="bg-muted/30 rounded p-4 space-y-2">
                    {viewingRegla.rewardCoupons.map((cupon, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-surface p-3 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Ticket size={16} className="text-primary" />
                          <span className="text-sm text-foreground">
                            {cupon.coupon.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Monto:{" "}
                          <span className="text-foreground font-mono">
                            ${cupon.coupon.amount.toFixed(2)}
                          </span>
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
        type= {editingRegla?.ruleType || "ProductVolume"}
        onClose={() => {
          setShowCreateEdit(false);
          setEditingRegla(null);
        }}
        onSave={handleSave}
      />
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
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
            <Filter
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <select
              value={filterEstado}
              onChange={(e) =>
                setFilterEstado(e.target.value as "all" | "activa" | "inactiva")
              }
              className="pl-10 pr-10 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none appearance-none"
            >
              <option value="all">Todas las reglas</option>
              <option value="activa">Activas</option>
              <option value="inactiva">Inactivas</option>
            </select>
            <ChevronDown
              size={20}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          {/*
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterRuleType}
              onChange={(e) => setFilterRuleType(e.target.value as 'all' | 'ProductVolume' | 'AmountPurchased' | 'Mixed')}
              className="pl-10 pr-10 py-2 bg-input-background border-b-2 border-border 
                       focus:border-primary rounded-t transition-colors outline-none appearance-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="ProductVolume">Por Productos</option>
              <option value="AmountPurchased">Por Monto</option>
              <option value="Mixed">Mixto</option>
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          */}
          {can(PERMISSIONS.INCENTIVE_RULE_CREATE) && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Nueva Regla
            </MaterialButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">
            Inicio vigencia
          </label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fin vigencia</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Inicio retiro</label>
          <input
            type="date"
            value={filterWithdrawalStartDate}
            onChange={(e) => setFilterWithdrawalStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fin retiro</label>
          <input
            type="date"
            value={filterWithdrawalDeadline}
            onChange={(e) => setFilterWithdrawalDeadline(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
      </div>

      {/* Reglas List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          <CardsSkeleton count={4} />
        </div>
      ) : reglas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {reglas.map((regla) => (
            <div
              key={regla.id}
              className="bg-surface rounded elevation-2 p-6 hover:elevation-4 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-foreground">{regla.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        regla.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {regla.isActive ? "Activa" : "Inactiva"}
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                      {regla.ruleType === "ProductVolume" ? (
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
                  <p className="text-sm text-muted-foreground mb-4">
                    {regla.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        Vigencia: {regla.startDate} - {regla.endDate}
                      </span>
                    </div>
                    {regla.rewardCoupons.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Ticket size={14} />
                        <span>{regla.rewardCoupons.length} cupón(es)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setViewingRegla(regla)}
                    className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Ver detalle"
                  >
                    <Eye size={18} />
                  </button>
                  {can(PERMISSIONS.INCENTIVE_RULE_EDIT) && (
                    <button
                      onClick={() => handleEdit(regla)}
                      className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {can(PERMISSIONS.INCENTIVE_RULE_DELETE) && (
                    <button
                      onClick={() => handleDelete(regla.id)}
                      className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gift size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-foreground mb-2">No hay reglas de incentivos</h3>
          <p className="text-muted-foreground mb-6">
            {hasAnyFilter
              ? "No se encontraron reglas con los filtros aplicados"
              : "Cree su primera regla de incentivo para comenzar"}
          </p>
          {!hasAnyFilter && can(PERMISSIONS.INCENTIVE_RULE_CREATE) && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Nueva Regla
            </MaterialButton>
          )}
        </div>
      )}
    </div>
  );
}
