"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  DollarSign,
  Filter,
  Gift,
  Package,
  Search,
  Users,
} from "lucide-react";
import {
  IncentiveProgressRecord,
  IncentiveProgressResponse,
} from "@/app/type/incentive";
import { getRewardIncentiveProgress } from "@/app/services/reward/progress";

export default function IncentivosGeneradosPage() {
  const [records, setRecords] = useState<IncentiveProgressRecord[]>([]);
  const [paging, setPaging] = useState<IncentiveProgressResponse["paging"] | null>(
    null,
  );

  const [clientCode, setClientCode] = useState("");
  const [incentiveRuleId, setIncentiveRuleId] = useState("");
  const [incentiveRuleName, setIncentiveRuleName] = useState("");
  const [ruleType, setRuleType] = useState("");
  const [participantClientType, setParticipantClientType] = useState("");
  const [isActive, setIsActive] = useState<"all" | "true" | "false">("all");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [endDateFrom, setEndDateFrom] = useState("");
  const [endDateTo, setEndDateTo] = useState("");
  const [withdrawalStartDateFrom, setWithdrawalStartDateFrom] = useState("");
  const [withdrawalStartDateTo, setWithdrawalStartDateTo] = useState("");
  const [withdrawalDeadlineFrom, setWithdrawalDeadlineFrom] = useState("");
  const [withdrawalDeadlineTo, setWithdrawalDeadlineTo] = useState("");
  const [contributionDateFrom, setContributionDateFrom] = useState("");
  const [contributionDateTo, setContributionDateTo] = useState("");

  const fetchProgress = useCallback(async () => {
    try {
      const data = await getRewardIncentiveProgress({
        clientCode: clientCode || undefined,
        incentiveRuleId: incentiveRuleId ? Number(incentiveRuleId) : undefined,
        incentiveRuleName: incentiveRuleName || undefined,
        ruleType: ruleType || undefined,
        participantClientType: participantClientType || undefined,
        isActive: isActive === "all" ? undefined : isActive === "true",
        startDateFrom: startDateFrom
          ? new Date(startDateFrom).toISOString()
          : undefined,
        startDateTo: startDateTo ? new Date(startDateTo).toISOString() : undefined,
        endDateFrom: endDateFrom ? new Date(endDateFrom).toISOString() : undefined,
        endDateTo: endDateTo ? new Date(endDateTo).toISOString() : undefined,
        withdrawalStartDateFrom: withdrawalStartDateFrom
          ? new Date(withdrawalStartDateFrom).toISOString()
          : undefined,
        withdrawalStartDateTo: withdrawalStartDateTo
          ? new Date(withdrawalStartDateTo).toISOString()
          : undefined,
        withdrawalDeadlineFrom: withdrawalDeadlineFrom
          ? new Date(withdrawalDeadlineFrom).toISOString()
          : undefined,
        withdrawalDeadlineTo: withdrawalDeadlineTo
          ? new Date(withdrawalDeadlineTo).toISOString()
          : undefined,
        contributionDateFrom: contributionDateFrom
          ? new Date(contributionDateFrom).toISOString()
          : undefined,
        contributionDateTo: contributionDateTo
          ? new Date(contributionDateTo).toISOString()
          : undefined,
      });

      setRecords(data.records);
      setPaging(data.paging);
    } catch (error) {
      console.error("Error fetching incentive progress:", error);
    }
  }, [
    clientCode,
    incentiveRuleId,
    incentiveRuleName,
    ruleType,
    participantClientType,
    isActive,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    withdrawalStartDateFrom,
    withdrawalStartDateTo,
    withdrawalDeadlineFrom,
    withdrawalDeadlineTo,
    contributionDateFrom,
    contributionDateTo,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProgress();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchProgress]);

  const hasAnyFilter =
    !!clientCode ||
    !!incentiveRuleId ||
    !!incentiveRuleName ||
    !!ruleType ||
    !!participantClientType ||
    isActive !== "all" ||
    !!startDateFrom ||
    !!startDateTo ||
    !!endDateFrom ||
    !!endDateTo ||
    !!withdrawalStartDateFrom ||
    !!withdrawalStartDateTo ||
    !!withdrawalDeadlineFrom ||
    !!withdrawalDeadlineTo ||
    !!contributionDateFrom ||
    !!contributionDateTo;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Codigo cliente</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              placeholder="Ej: CLI001"
              className="w-full pl-9 pr-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">ID regla</label>
          <input
            type="number"
            min={1}
            value={incentiveRuleId}
            onChange={(e) => setIncentiveRuleId(e.target.value)}
            placeholder="Ej: 1"
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Nombre regla</label>
          <input
            type="text"
            value={incentiveRuleName}
            onChange={(e) => setIncentiveRuleName(e.target.value)}
            placeholder="Nombre de incentivo"
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Tipo regla</label>
          <input
            type="text"
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value)}
            placeholder="AmountPurchased"
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Tipo cliente participante</label>
          <input
            type="text"
            value={participantClientType}
            onChange={(e) => setParticipantClientType(e.target.value)}
            placeholder="Promotor / Asesor"
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Estado</label>
          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value as "all" | "true" | "false")}
              className="w-full pl-9 pr-9 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
            >
              <option value="all">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Inicio vigencia desde</label>
          <input
            type="date"
            value={startDateFrom}
            onChange={(e) => setStartDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Inicio vigencia hasta</label>
          <input
            type="date"
            value={startDateTo}
            onChange={(e) => setStartDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fin vigencia desde</label>
          <input
            type="date"
            value={endDateFrom}
            onChange={(e) => setEndDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fin vigencia hasta</label>
          <input
            type="date"
            value={endDateTo}
            onChange={(e) => setEndDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Inicio retiro desde</label>
          <input
            type="date"
            value={withdrawalStartDateFrom}
            onChange={(e) => setWithdrawalStartDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Inicio retiro hasta</label>
          <input
            type="date"
            value={withdrawalStartDateTo}
            onChange={(e) => setWithdrawalStartDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fin retiro desde</label>
          <input
            type="date"
            value={withdrawalDeadlineFrom}
            onChange={(e) => setWithdrawalDeadlineFrom(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fin retiro hasta</label>
          <input
            type="date"
            value={withdrawalDeadlineTo}
            onChange={(e) => setWithdrawalDeadlineTo(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Contribucion desde</label>
          <input
            type="date"
            value={contributionDateFrom}
            onChange={(e) => setContributionDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Contribucion hasta</label>
          <input
            type="date"
            value={contributionDateTo}
            onChange={(e) => setContributionDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          />
        </div>
      </div>

      {paging && (
        <div className="text-sm text-muted-foreground">
          Mostrando {records.length} de {paging.totalRecords} registros
        </div>
      )}

      {records.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {records.map((item) => (
            <div
              key={`${item.incentiveRuleId}-${item.ruleType}`}
              className="bg-surface rounded elevation-2 p-6 hover:elevation-4 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-foreground">{item.incentiveRuleName}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground mb-3">
                    ID regla: {item.incentiveRuleId} | Tipo: {item.ruleType}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                    <div className="bg-muted/20 rounded p-3">
                      <div className="text-muted-foreground">Clientes participantes</div>
                      <div className="text-foreground font-semibold flex items-center gap-2 mt-1">
                        <Users size={16} /> {item.clientCount}
                      </div>
                    </div>
                    <div className="bg-muted/20 rounded p-3">
                      <div className="text-muted-foreground">Contribuciones</div>
                      <div className="text-foreground font-semibold mt-1">
                        {item.contributionCount}
                      </div>
                    </div>
                    <div className="bg-muted/20 rounded p-3">
                      <div className="text-muted-foreground">Cumplimientos</div>
                      <div className="text-foreground font-semibold mt-1">
                        {item.winsCountTotal}
                      </div>
                    </div>
                    <div className="bg-muted/20 rounded p-3">
                      <div className="text-muted-foreground">Monto acumulado</div>
                      <div className="text-foreground font-semibold flex items-center gap-2 mt-1">
                        <DollarSign size={16} /> {item.amountProgressTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      <span>Progreso productos: {item.productVolumeProgressTotal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        Ultima contribucion:{" "}
                        {item.lastContributionDate
                          ? new Date(item.lastContributionDate).toLocaleDateString()
                          : "Sin contribuciones"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        Vigencia: {new Date(item.startDate).toLocaleDateString()} -{" "}
                        {new Date(item.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gift size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-foreground mb-2">No hay incentivos generados</h3>
          <p className="text-muted-foreground">
            {hasAnyFilter
              ? "No se encontraron registros con los filtros aplicados"
              : "Aun no hay progreso generado para las reglas de incentivos"}
          </p>
        </div>
      )}
    </div>
  );
}
