'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Gift, Play, RefreshCw, Save } from 'lucide-react';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import {
  getMonthlyAccrualSetting,
  runMonthlyAccrual,
  updateMonthlyAccrualSetting,
} from '@/app/services/reward/monthly-accrual';
import { recalculateRewards } from '@/app/services/reward/recalculate';
import {
  MonthlyAccrualSetting,
  RecalculateRewardsResult,
  RunMonthlyAccrualResult,
} from '@/app/type/reward';
import { BlockSkeleton } from '@/components/ui/loading-skeleton';

const toMonthStart = (monthValue: string) => {
  if (!monthValue) return undefined;
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return undefined;
  return new Date(Date.UTC(year, month - 1, 1)).toISOString();
};

export default function BonificacionMensualPage() {
  const { can } = useUserStore();
  const canEdit = can(PERMISSIONS.MONTHLY_COUPON_ACCRUAL_EDIT);
  const canRun = can(PERMISSIONS.MONTHLY_COUPON_ACCRUAL_RUN);
  const canRecalculate = can(PERMISSIONS.LEDGER_RECALCULATE);

  const [setting, setSetting] = useState<MonthlyAccrualSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purchaseAmountThreshold, setPurchaseAmountThreshold] = useState('0');
  const [couponBonusAmount, setCouponBonusAmount] = useState('0');
  const [expirationDays, setExpirationDays] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [runPeriod, setRunPeriod] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunMonthlyAccrualResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [recalculateMonth, setRecalculateMonth] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState<RecalculateRewardsResult | null>(null);
  const [recalculateError, setRecalculateError] = useState<string | null>(null);

  const loadSetting = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMonthlyAccrualSetting();
      setSetting(data);
      setPurchaseAmountThreshold(String(data.purchaseAmountThreshold));
      setCouponBonusAmount(String(data.couponBonusAmount));
      setExpirationDays(String(data.expirationDays));
      setIsActive(data.isActive);
    } catch (err) {
      console.error('Error loading monthly accrual setting:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la configuración de bonificación mensual',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSetting();
  }, [loadSetting]);

  const handleSave = async () => {
    const threshold = Number(purchaseAmountThreshold);
    const bonus = Number(couponBonusAmount);
    const days = Number(expirationDays);

    if (!Number.isFinite(threshold) || threshold <= 0) {
      alert('Ingrese un monto mínimo de compra válido');
      return;
    }

    if (!Number.isFinite(bonus) || bonus <= 0) {
      alert('Ingrese un monto de bonificación válido');
      return;
    }

    if (!Number.isFinite(days) || days <= 0) {
      alert('Ingrese una cantidad de días de expiración válida');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateMonthlyAccrualSetting({
        purchaseAmountThreshold: threshold,
        couponBonusAmount: bonus,
        expirationDays: days,
        isActive,
      });
      setSetting(updated);
      alert('Configuración actualizada correctamente');
    } catch (err) {
      console.error('Error updating monthly accrual setting:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar la configuración',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      setRunError(null);
      setRunResult(null);
      const period = toMonthStart(runPeriod);
      const result = await runMonthlyAccrual(period ? { period } : undefined);
      setRunResult(result);
    } catch (err) {
      console.error('Error running monthly accrual:', err);
      setRunError(
        err instanceof Error ? err.message : 'No se pudo ejecutar la bonificación mensual',
      );
    } finally {
      setRunning(false);
    }
  };

  const handleRecalculate = async () => {
    const month = toMonthStart(recalculateMonth);

    if (!month) {
      alert('Seleccione el mes a recalcular');
      return;
    }

    if (
      !confirm(
        'Esto recalculará el historial COMPLETO de recompensas de todos los clientes con facturas ese mes (no solo ese mes). ¿Desea continuar?',
      )
    ) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalculateError(null);
      setRecalculateResult(null);
      const result = await recalculateRewards({ month });
      setRecalculateResult(result);
    } catch (err) {
      console.error('Error recalculating rewards:', err);
      setRecalculateError(
        err instanceof Error ? err.message : 'No se pudieron recalcular las recompensas',
      );
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Gift size={28} className="text-primary" />
          <h2 className="text-foreground">Bonificación Mensual</h2>
        </div>
        <p className="text-muted-foreground">
          Configure la acreditación automática de cupón por compras mensuales de los clientes
        </p>
      </div>

      {loading ? (
        <BlockSkeleton className="h-64" />
      ) : error ? (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded elevation-2 p-6">
            <h3 className="text-foreground mb-4">Configuración</h3>
            <div className="flex flex-col gap-4">
              <MaterialInput
                label="Monto mínimo de compra"
                type="number"
                min={0}
                step="0.01"
                fullWidth
                value={purchaseAmountThreshold}
                onChange={(e) => setPurchaseAmountThreshold(e.target.value)}
                disabled={!canEdit}
                helperText="Ej: cada C$1000 de compra neta acredita el monto de bonificación"
              />
              <MaterialInput
                label="Monto de bonificación"
                type="number"
                min={0}
                step="0.01"
                fullWidth
                value={couponBonusAmount}
                onChange={(e) => setCouponBonusAmount(e.target.value)}
                disabled={!canEdit}
              />
              <MaterialInput
                label="Días de expiración del cupón"
                type="number"
                min={0}
                fullWidth
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                disabled={!canEdit}
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!canEdit}
                  className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-foreground">
                  Bonificación activa
                </label>
              </div>

              {canEdit && (
                <MaterialButton
                  variant="contained"
                  color="primary"
                  startIcon={<Save size={18} />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </MaterialButton>
              )}

              {setting && (
                <p className="text-xs text-muted-foreground">
                  Configuración #{setting.id}
                </p>
              )}
            </div>
          </div>

          <div className="bg-surface rounded elevation-2 p-6">
            <h3 className="text-foreground mb-4">Ejecutar ahora</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Normalmente corre automático el último día de cada mes. Use esto para forzar o
              re-ejecutar el cálculo de un mes específico (no duplica lo ya acreditado).
            </p>

            <div className="flex flex-col gap-4">
              <MaterialInput
                label="Mes a procesar (opcional)"
                type="month"
                fullWidth
                value={runPeriod}
                onChange={(e) => setRunPeriod(e.target.value)}
                disabled={!canRun}
                helperText="Si lo deja vacío, procesa el mes calendario anterior"
              />

              {canRun && (
                <MaterialButton
                  variant="contained"
                  color="secondary"
                  startIcon={<Play size={18} />}
                  onClick={handleRun}
                  disabled={running}
                >
                  {running ? 'Ejecutando...' : 'Ejecutar ahora'}
                </MaterialButton>
              )}

              {runError && (
                <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {runError}
                </div>
              )}

              {runResult && (
                <div className="bg-primary/5 border border-primary/20 rounded p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Periodo: {new Date(runResult.periodStart).toLocaleDateString()}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Clientes acreditados
                      </span>
                      <p className="text-2xl text-foreground font-mono">
                        {runResult.clientsCredited}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Monto total</span>
                      <p className="text-2xl text-primary font-mono">
                        {runResult.totalAmountCredited.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && canRecalculate && (
        <div className="bg-surface rounded elevation-2 p-6 mt-6">
          <h3 className="text-foreground mb-4">Recalcular Recompensas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Acción administrativa (ej. después de corregir un bug de reglas). Recalcula el
            historial COMPLETO de premios y progreso de cada cliente (comprador o promotor)
            que tuvo al menos una factura en el mes seleccionado — no solo ese mes, ya que el
            motor de recompensas no permite recálculos parciales.
          </p>

          <div className="flex flex-col gap-4 max-w-sm">
            <MaterialInput
              label="Mes a recalcular"
              type="month"
              fullWidth
              value={recalculateMonth}
              onChange={(e) => setRecalculateMonth(e.target.value)}
              disabled={recalculating}
            />

            <MaterialButton
              variant="contained"
              color="secondary"
              startIcon={<RefreshCw size={18} />}
              onClick={handleRecalculate}
              disabled={recalculating}
            >
              {recalculating ? 'Recalculando...' : 'Recalcular'}
            </MaterialButton>

            {recalculateError && (
              <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {recalculateError}
              </div>
            )}

            {recalculateResult && (
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Periodo: {new Date(recalculateResult.periodStart).toLocaleDateString()}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Clientes procesados</span>
                    <p className="text-2xl text-foreground font-mono">
                      {recalculateResult.clientsProcessed}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Clientes fallidos</span>
                    <p className="text-2xl text-primary font-mono">
                      {recalculateResult.clientsFailed}
                    </p>
                  </div>
                </div>
                {recalculateResult.failedClientCodes.length > 0 && (
                  <p className="mt-3 text-xs text-red-700">
                    Códigos con error: {recalculateResult.failedClientCodes.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
