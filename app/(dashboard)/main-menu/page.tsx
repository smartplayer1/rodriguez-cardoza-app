import { headers } from 'next/headers';
import Link from 'next/link';
import {
  Award,
  Banknote,
  ClipboardCheck,
  CreditCard,
  FileText,
  GiftIcon,
  Receipt,
  RefreshCcw,
  Ticket,
  TrendingUp,
  UserCircle,
  Wallet,
} from 'lucide-react';

import { getAccountsReceivableClientPromotersReport, getCashManagementReport, getCollectionsReport } from '@/app/services/billing/reports';
import { getCreditNotes } from '@/app/services/billing/credit-note';
import { getCreditInvoices } from '@/app/services/invoice';
import { getRewardIncentiveProgress } from '@/app/services/reward/progress';
import { getAgentsNearGoalsReport } from '@/app/services/reward/reports';
import { AccountsReceivableSummary } from '@/app/type/accounts-receivable-report';
import { CashManagementReportSummary } from '@/app/type/cash-management-report';
import { CollectionsReportSummary } from '@/app/type/collections-report';
import { CreditNoteRecord } from '@/app/type/credit-note';
import { CreditInvoiceRecord } from '@/app/type/invoice';
import { IncentiveProgressRecord } from '@/app/type/incentive';
import { AgentNearGoalRecord } from '@/app/type/reward-report';

const pad = (value: number) => String(value).padStart(2, '0');

const getFirstDayOfCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
};

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatCurrency = (value: number) =>
  (Number.isFinite(value) ? value : 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

const formatPercentage = (value: number) => `${Math.min(Math.max(value, 0), 100).toFixed(0)}%`;

const getIncentiveProgressPercentage = (record: IncentiveProgressRecord) => {
  if (record.ruleType === 'ProductVolume') {
    if (!record.productVolumeTargetQuantity) return 0;
    return (record.productVolumeProgressTotal / record.productVolumeTargetQuantity) * 100;
  }

  if (record.ruleType === 'AmountPurchased') {
    if (!record.amountCondition) return 0;
    return (record.amountProgressTotal / record.amountCondition) * 100;
  }

  const amountPct = record.amountCondition ? (record.amountProgressTotal / record.amountCondition) * 100 : 0;
  const volumePct = record.productVolumeTargetQuantity
    ? (record.productVolumeProgressTotal / record.productVolumeTargetQuantity) * 100
    : 0;

  return Math.max(amountPct, volumePct);
};

export default async function MainMenuPage() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  const context = { baseUrl, cookieHeader };

  const dateFrom = getFirstDayOfCurrentMonth();
  const dateTo = getToday();

  const [
    accountsReceivableResult,
    creditInvoicesResult,
    creditNotesResult,
    incentiveProgressResult,
    cashManagementReportResult,
    collectionsReportResult,
    agentsNearGoalsResult,
  ] = await Promise.allSettled([
    // Sin dateFrom/dateTo: el saldo pendiente es un corte del estado actual de la cartera,
    // no debe acotarse al período. El summary siempre es exacto sobre todo el resultado
    // filtrado (no se trunca por perPage); se pide un lote de registros aparte para poder
    // calcular la cantidad de clientes distintos con saldo.
    getAccountsReceivableClientPromotersReport({ page: 1, perPage: 300, ...context }),
    getCreditInvoices({ page: 1, perPage: 300, ...context }),
    getCreditNotes({ status: 'emitida', page: 1, perPage: 6, ...context }),
    getRewardIncentiveProgress({ isActive: true, ...context }),
    getCashManagementReport({ dateFrom, dateTo, page: 1, perPage: 1, ...context }),
    getCollectionsReport({ dateFrom, dateTo, page: 1, perPage: 1, ...context }),
    getAgentsNearGoalsReport({ page: 1, perPage: 50, ...context }),
  ]);

  const accountsReceivable: AccountsReceivableSummary | null =
    accountsReceivableResult.status === 'fulfilled' ? accountsReceivableResult.value.summary : null;
  const clientsWithBalanceCount =
    accountsReceivableResult.status === 'fulfilled'
      ? new Set(accountsReceivableResult.value.records.records.map((record) => record.clientCode)).size
      : 0;

  const creditInvoices: CreditInvoiceRecord[] =
    creditInvoicesResult.status === 'fulfilled' ? creditInvoicesResult.value.records : [];
  // Lista de muestra (limitada por perPage) para mostrar las facturas de mayor saldo.
  // El conteo y monto totales de la cartera se toman del summary de cuentas por cobrar,
  // que sí es exacto sobre el total de registros y no se trunca por paginación.
  const creditInvoicesWithBalance = creditInvoices
    .filter((record) => record.isCredit && !record.isVoided && record.remainingBalanceNio > 0)
    .sort((a, b) => b.remainingBalanceNio - a.remainingBalanceNio);

  const creditNotes: CreditNoteRecord[] = creditNotesResult.status === 'fulfilled' ? creditNotesResult.value.records : [];
  const creditNotesTotalRecords = creditNotesResult.status === 'fulfilled' ? creditNotesResult.value.paging.totalRecords : 0;

  const incentiveProgress: IncentiveProgressRecord[] =
    incentiveProgressResult.status === 'fulfilled' ? incentiveProgressResult.value.records : [];
  const activeIncentivesCount = incentiveProgress.length;

  const cashManagementSummary: CashManagementReportSummary | null =
    cashManagementReportResult.status === 'fulfilled' ? cashManagementReportResult.value.summary : null;

  const collectionsSummary: CollectionsReportSummary | null =
    collectionsReportResult.status === 'fulfilled' ? collectionsReportResult.value.summary : null;

  const agentsNearGoals: AgentNearGoalRecord[] =
    agentsNearGoalsResult.status === 'fulfilled' ? agentsNearGoalsResult.value.records.records : [];
  const agentsStillProgressing = agentsNearGoals
    .filter((record) => !record.isGoalReached)
    .sort((a, b) => b.overallProgressPercentage - a.overallProgressPercentage)
    .slice(0, 5);
  const agentsParticipantCount =
    agentsNearGoalsResult.status === 'fulfilled' ? agentsNearGoalsResult.value.summary.participantCount : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-1">
            <h2 className="text-foreground">Panel de Gestión</h2>
            <p className="text-muted-foreground">
              Facturas, notas de crédito e incentivos reflejan el saldo actual de la cartera. Cobros y caja corresponden al período {formatDate(dateFrom)} - {formatDate(dateTo)}.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <StatCard
              label="Facturas con saldo"
              value={accountsReceivable?.invoiceCount ?? 0}
              detail={`C$ ${formatCurrency(accountsReceivable?.pendingBalanceTotalNio ?? 0)}`}
              icon={<Receipt className="size-4" />}
              ok={accountsReceivableResult.status === 'fulfilled'}
            />
            <StatCard
              label="Notas de crédito emitidas"
              value={creditNotesTotalRecords}
              detail="Pendientes de aplicar"
              icon={<FileText className="size-4" />}
              ok={creditNotesResult.status === 'fulfilled'}
            />
            <StatCard
              label="Incentivos activos"
              value={activeIncentivesCount}
              detail={`${incentiveProgress.reduce((s, r) => s + r.clientCount, 0)} clientes participando`}
              icon={<GiftIcon className="size-4" />}
              ok={incentiveProgressResult.status === 'fulfilled'}
            />
            <StatCard
              label="Clientes con saldo"
              value={clientsWithBalanceCount}
              detail={`C$ ${formatCurrency(accountsReceivable?.pendingBalanceTotalNio ?? 0)} en cartera`}
              icon={<Banknote className="size-4" />}
              ok={accountsReceivableResult.status === 'fulfilled'}
            />
            <StatCard
              label="Cobros del período"
              value={`C$ ${formatCurrency(collectionsSummary?.totalReceived ?? 0)}`}
              detail={`${collectionsSummary?.collectionCount ?? 0} cobros`}
              icon={<TrendingUp className="size-4" />}
              ok={collectionsReportResult.status === 'fulfilled'}
            />
            <StatCard
              label="Cajas abiertas"
              value={cashManagementSummary?.openCount ?? 0}
              detail={`${cashManagementSummary?.closedCount ?? 0} cerradas en el período`}
              icon={<Wallet className="size-4" />}
              ok={cashManagementReportResult.status === 'fulfilled'}
            />
            <StatCard
              label="Agentes cerca de meta"
              value={agentsParticipantCount}
              detail={`${agentsStillProgressing.length} en seguimiento`}
              icon={<Award className="size-4" />}
              ok={agentsNearGoalsResult.status === 'fulfilled'}
            />
          </div>
        </header>

        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-foreground">Accesos rápidos</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <QuickLink href="/gestion-de-caja/facturacion" label="Facturación" icon={<Receipt className="size-4" />} />
            <QuickLink href="/gestion-de-caja/cobros" label="Cobros" icon={<CreditCard className="size-4" />} />
            <QuickLink href="/gestion-de-caja/notas-credito" label="Notas de Crédito" icon={<FileText className="size-4" />} />
            <QuickLink href="/gestion-de-caja/gestiones" label="Gestión de Caja" icon={<Wallet className="size-4" />} />
            <QuickLink href="/credito" label="Cartera de Crédito" icon={<Banknote className="size-4" />} />
            <QuickLink href="/premios/incentivos-retencion" label="Incentivos" icon={<GiftIcon className="size-4" />} />
            <QuickLink href="/premios/cupones" label="Cupones" icon={<Ticket className="size-4" />} />
            <QuickLink href="/clientes" label="Clientes" icon={<UserCircle className="size-4" />} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Facturas de crédito con saldo"
            icon={<Receipt className="size-5 text-primary" />}
            href="/credito"
            linkLabel="Ver cartera completa"
            failed={creditInvoicesResult.status === 'rejected'}
          >
            {creditInvoicesWithBalance.length === 0 ? (
              <EmptyState message="No hay facturas de crédito con saldo pendiente." />
            ) : (
              <Table
                headers={['Cliente', 'Factura', 'Saldo C$', 'Cobros']}
                rows={creditInvoicesWithBalance.slice(0, 8).map((record) => [
                  <div key="client">
                    <div className="text-foreground">{record.clientName}</div>
                    <div className="text-xs text-muted-foreground">{record.clientCode}</div>
                  </div>,
                  <span key="doc" className="font-mono text-foreground">{record.document}</span>,
                  <span key="balance" className="font-mono text-foreground">{formatCurrency(record.remainingBalanceNio)}</span>,
                  <span key="collections" className="text-muted-foreground">{record.collectionCount}</span>,
                ])}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Notas de crédito pendientes de aplicar"
            icon={<FileText className="size-5 text-primary" />}
            href="/gestion-de-caja/notas-credito"
            linkLabel="Ver todas las notas"
            failed={creditNotesResult.status === 'rejected'}
          >
            {creditNotes.length === 0 ? (
              <EmptyState message="No hay notas de crédito emitidas pendientes de aplicar." />
            ) : (
              <Table
                headers={['Número', 'Factura', 'Fecha', 'Total C$']}
                rows={creditNotes.slice(0, 6).map((record) => [
                  <span key="number" className="font-mono text-foreground">{record.header.number}</span>,
                  <span key="invoice" className="text-foreground">{record.header.invoiceDocument ?? '-'}</span>,
                  <span key="date" className="text-xs text-muted-foreground">{formatDate(record.header.startDate)}</span>,
                  <span key="total" className="font-mono text-foreground">{formatCurrency(record.header.total)}</span>,
                ])}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Incentivos activos"
            icon={<GiftIcon className="size-5 text-primary" />}
            href="/premios/incentivos-retencion"
            linkLabel="Ver incentivos"
            failed={incentiveProgressResult.status === 'rejected'}
          >
            {incentiveProgress.length === 0 ? (
              <EmptyState message="No hay incentivos activos en este momento." />
            ) : (
              <div className="space-y-4">
                {incentiveProgress.slice(0, 6).map((record) => {
                  const percentage = getIncentiveProgressPercentage(record);
                  return (
                    <div key={record.incentiveRuleId} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground">{record.incentiveRuleName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.startDate)} - {formatDate(record.endDate)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: formatPercentage(percentage) }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{record.clientCount} clientes · {record.winsCountTotal} premios ganados</span>
                        <span>{formatPercentage(percentage)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Agentes cerca de su meta"
            icon={<Award className="size-5 text-primary" />}
            href="/reportes/agentes-cerca-de-meta"
            linkLabel="Ver reporte completo"
            failed={agentsNearGoalsResult.status === 'rejected'}
          >
            {agentsStillProgressing.length === 0 ? (
              <EmptyState message="No hay agentes en seguimiento cerca de alcanzar su meta." />
            ) : (
              <Table
                headers={['Cliente', 'Incentivo', 'Progreso']}
                rows={agentsStillProgressing.map((record) => [
                  <div key="client">
                    <div className="text-foreground">{record.clientName}</div>
                    <div className="text-xs text-muted-foreground">{record.promoterName ?? record.clientCode}</div>
                  </div>,
                  <span key="rule" className="text-foreground">{record.incentiveRuleName}</span>,
                  <span key="progress" className="font-mono text-foreground">
                    {formatPercentage(record.overallProgressPercentage)}
                  </span>,
                ])}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Gestión de caja del período"
            icon={<Wallet className="size-5 text-primary" />}
            href="/gestion-de-caja/gestiones"
            linkLabel="Ir a gestiones de caja"
            failed={cashManagementReportResult.status === 'rejected'}
          >
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Abiertas" value={String(cashManagementSummary?.openCount ?? 0)} />
              <MiniStat label="Cerradas" value={String(cashManagementSummary?.closedCount ?? 0)} />
              <MiniStat label="Esperado C$" value={formatCurrency(cashManagementSummary?.expectedNio ?? 0)} />
              <MiniStat label="Diferencia C$" value={formatCurrency(cashManagementSummary?.differenceNio ?? 0)} />
            </div>
            <Link
              href="/reportes/gestion-de-caja"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ClipboardCheck size={14} /> Ver reporte de arqueo
            </Link>
          </SectionCard>

          <SectionCard
            title="Cobros del período"
            icon={<CreditCard className="size-5 text-primary" />}
            href="/reportes/cobros"
            linkLabel="Ver reporte de cobros"
            failed={collectionsReportResult.status === 'rejected'}
          >
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Efectivo C$" value={formatCurrency(collectionsSummary?.cashTotal ?? 0)} />
              <MiniStat label="Transferencia C$" value={formatCurrency(collectionsSummary?.transferTotal ?? 0)} />
              <MiniStat label="Aplicado a facturas C$" value={formatCurrency(collectionsSummary?.appliedAmountNio ?? 0)} />
              <MiniStat label="Total recibido C$" value={formatCurrency(collectionsSummary?.totalReceived ?? 0)} />
            </div>
            <Link
              href="/gestion-de-caja/conversiones"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <RefreshCcw size={14} /> Ver conversiones de moneda
            </Link>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  ok,
}: {
  label: string;
  value: number | string;
  detail?: string;
  icon: React.ReactNode;
  ok: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{ok ? value : '-'}</p>
      {detail ? (
        <p className="text-xs text-muted-foreground">{ok ? detail : 'Sin acceso o sin datos'}</p>
      ) : null}
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-2xl border border-border px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent"
    >
      <span className="text-primary">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SectionCard({
  title,
  icon,
  href,
  linkLabel,
  failed,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  linkLabel: string;
  failed: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-foreground">{title}</h3>
        </div>
        <Link href={href} className="text-sm text-primary hover:underline">
          {linkLabel}
        </Link>
      </div>

      {failed ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          No se pudo cargar esta sección. Verifique su conexión o permisos.
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-foreground">{value}</p>
    </div>
  );
}

function Table({ headers: columnHeaders, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border/60 text-sm">
        <thead>
          <tr>
            {columnHeaders.map((column, index) => (
              <th
                key={column}
                className={`px-3 py-2 font-medium text-muted-foreground ${index === 0 ? 'text-left' : 'text-right'}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top transition-colors hover:bg-muted/15">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-3 py-3 ${cellIndex === 0 ? 'text-left' : 'text-right'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
