'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Clock3, GitMerge, HelpCircle, Inbox, Upload, XCircle } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import { getBankTransferImports } from '@/app/services/billing/bank-transfer';
import ImportarTransferenciasModal from './importar-transferencias-modal';

type Counts = {
  total: number;
  pending: number;
  reconciled: number;
  noMatch: number;
  ambiguous: number;
};

const EMPTY_COUNTS: Counts = { total: 0, pending: 0, reconciled: 0, noMatch: 0, ambiguous: 0 };

export default function ConciliacionBancariaPage() {
  const router = useRouter();
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      setCountsLoading(true);
      setCountsError(null);
      const [totalResponse, pendingResponse, reconciledResponse, noMatchResponse, ambiguousResponse] =
        await Promise.all([
          getBankTransferImports({ page: 1, perPage: 1 }),
          getBankTransferImports({ status: 'Pending', page: 1, perPage: 1 }),
          getBankTransferImports({ status: 'Reconciled', page: 1, perPage: 1 }),
          getBankTransferImports({ status: 'NoMatch', page: 1, perPage: 1 }),
          getBankTransferImports({ status: 'Ambiguous', page: 1, perPage: 1 }),
        ]);

      setCounts({
        total: totalResponse.paging?.totalRecords ?? 0,
        pending: pendingResponse.paging?.totalRecords ?? 0,
        reconciled: reconciledResponse.paging?.totalRecords ?? 0,
        noMatch: noMatchResponse.paging?.totalRecords ?? 0,
        ambiguous: ambiguousResponse.paging?.totalRecords ?? 0,
      });
    } catch (error) {
      setCountsError(
        error instanceof Error ? error.message : 'No se pudieron cargar los indicadores',
      );
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const canManage = mounted && can(PERMISSIONS.BANK_TRANSFER_CREATE);
  const canView = mounted && can(PERMISSIONS.BANK_TRANSFER_VIEW);

  const goToConciliar = (status?: string) =>
    router.push(
      status
        ? `/gestion-de-caja/conciliacion-bancaria/conciliar?status=${status}`
        : '/gestion-de-caja/conciliacion-bancaria/conciliar',
    );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <GitMerge size={28} className="text-primary" />
          <h2 className="text-foreground">Conciliación Bancaria</h2>
        </div>
        <p className="text-muted-foreground">
          Importe el estado de cuenta del banco y luego ejecute la conciliación contra las
          transferencias registradas internamente. Son dos pasos independientes.
        </p>
      </div>

      {countsError && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {countsError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={<Upload size={18} />} label="Importadas" value={counts.total} loading={countsLoading} />
        <StatCard
          icon={<Clock3 size={18} />}
          label="Pendientes"
          value={counts.pending}
          loading={countsLoading}
          onClick={canView ? () => goToConciliar('Pending') : undefined}
        />
        <StatCard
          icon={<CheckCheck size={18} />}
          label="Conciliadas"
          value={counts.reconciled}
          loading={countsLoading}
          tone="success"
          onClick={canView ? () => goToConciliar('Reconciled') : undefined}
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Sin coincidencia"
          value={counts.noMatch}
          loading={countsLoading}
          tone="warning"
          onClick={canView ? () => goToConciliar('NoMatch') : undefined}
        />
        <StatCard
          icon={<HelpCircle size={18} />}
          label="Ambiguas"
          value={counts.ambiguous}
          loading={countsLoading}
          tone="warning"
          onClick={canView ? () => goToConciliar('Ambiguous') : undefined}
        />
      </div>

      <div className="bg-surface rounded elevation-2 p-6">
        <h3 className="text-foreground mb-1">Acciones</h3>
        <p className="text-sm text-muted-foreground mb-4">
          La importación y la conciliación son procesos independientes: importar no ejecuta la
          conciliación automáticamente.
        </p>

        <div className="flex flex-wrap gap-3">
          {canManage && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Upload size={18} />}
              onClick={() => setImportModalOpen(true)}
            >
              Importar transferencias
            </MaterialButton>
          )}

          {canManage && (
            <MaterialButton
              variant="contained"
              color="secondary"
              startIcon={<GitMerge size={18} />}
              onClick={() => goToConciliar()}
            >
              Conciliar transferencias
            </MaterialButton>
          )}

          {canView && (
            <MaterialButton
              variant="outlined"
              color="secondary"
              startIcon={<Inbox size={18} />}
              onClick={() => goToConciliar('Reconciled')}
            >
              Ver conciliadas
            </MaterialButton>
          )}
        </div>
      </div>

      <ImportarTransferenciasModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => void loadCounts()}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading = false,
  tone = 'default',
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading?: boolean;
  tone?: 'default' | 'success' | 'warning';
  onClick?: () => void;
}) {
  const toneClass =
    tone === 'success' ? 'text-green-600' : tone === 'warning' ? 'text-amber-600' : 'text-foreground';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-2xl border border-border/60 bg-surface px-4 py-4 text-left elevation-1 ${
        onClick ? 'cursor-pointer transition-colors hover:bg-muted/30' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{loading ? '…' : value}</p>
    </Wrapper>
  );
}
