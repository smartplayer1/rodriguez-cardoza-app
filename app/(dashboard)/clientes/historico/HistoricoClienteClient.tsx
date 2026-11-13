'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Search } from 'lucide-react';

import { ClientHistoryError, getClientHistory } from '@/app/services/client';
import { getInvoices } from '@/app/services/invoice';
import {
  ClientHistoryArticle,
  ClientHistoryCreditNote,
  ClientHistoryInvoice,
  ClientHistoryPayment,
  ClientHistoryResponse,
  ClientHistoryTransfer,
} from '@/app/type/client-history';
import { ServerInvoiceResponse } from '@/app/type/invoice';
import { Skeleton } from '@/components/ui/skeleton';
import HistoryGrid, { GridColumn } from './history-grid';

type Props = {
  initialCode: string;
  /** false dentro del modal: no cambia la URL de la página que lo abrió. */
  syncUrl?: boolean;
};

type TabId = 'invoices' | 'creditNotes' | 'payments' | 'transfers' | 'articles';

type InvoiceDetailLine = ServerInvoiceResponse['details'][number];

type InvoiceMovement = {
  key: string;
  type: 'Recibo' | 'Nota de crédito';
  number: string;
  date: string | null;
  amount: number;
  status: string;
  cashRegister: string;
};

type InvoiceRow = ClientHistoryInvoice & {
  lastPaymentAt: string | null;
  daysLate: number | null;
};

const currencyFormatter = new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' });
const numberFormatter = new Intl.NumberFormat('es-NI', { maximumFractionDigits: 2 });

const money = (value: number | null | undefined) => currencyFormatter.format(Number(value) || 0);
const qty = (value: number | null | undefined) => numberFormatter.format(Number(value) || 0);

// Las fechas se muestran en UTC: muchas vienen como medianoche UTC
// (ej. 2026-01-15T00:00:00Z) y en hora local se verían un día antes.
const date = (value: string | null | undefined) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('es-NI', { timeZone: 'UTC' });
};

const toDay = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const monthGroup = (value: string | null | undefined) => {
  if (!value) return { key: 'sin-fecha', label: 'Sin fecha' };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { key: 'sin-fecha', label: 'Sin fecha' };
  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth();
  return {
    key: `${year}-${month}`,
    label: `Mes: ${year} - ${String(month + 1).padStart(2, '0')} - ${MONTHS[month]}`,
  };
};

const CREDIT_NOTE_STATUS: Record<string, string> = {
  draft: 'Borrador',
  borrador: 'Borrador',
  issued: 'Emitida',
  emitida: 'Emitida',
  voided: 'Anulada',
  anulada: 'Anulada',
};

const PAYMENT_STATUS: Record<string, string> = {
  active: 'Activo',
  activo: 'Activo',
  voided: 'Anulado',
  anulado: 'Anulado',
};

const statusLabel = (map: Record<string, string>, value: string | null | undefined) =>
  (value && map[value.trim().toLowerCase()]) || value || '—';

const isActivePayment = (payment: ClientHistoryPayment) =>
  statusLabel(PAYMENT_STATUS, payment.status) === 'Activo';

const Badge = ({ tone, children }: { tone: 'red' | 'amber' | 'green' | 'gray' | 'blue'; children: ReactNode }) => {
  const tones = {
    red: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-emerald-100 text-emerald-700',
    gray: 'bg-muted text-muted-foreground',
    blue: 'bg-blue-100 text-blue-700',
  };
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
};

const statusTone = (status: string) => {
  if (status === 'Emitida' || status === 'Activo') return 'green';
  if (status === 'Anulada' || status === 'Anulado') return 'red';
  return 'gray';
};

function Panel({ title, actions, children }: { title: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {actions}
      </header>
      <div className="p-2">{children}</div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'danger' }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        tone === 'danger' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-border/60 bg-surface'
      }`}
    >
      <p className={`text-[11px] ${tone === 'danger' ? 'text-rose-700' : 'text-muted-foreground'}`}>{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function HistoricoClienteClient({ initialCode, syncUrl = true }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [data, setData] = useState<ClientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('invoices');
  const [showVoided, setShowVoided] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [detailsByDocument, setDetailsByDocument] = useState<Record<string, InvoiceDetailLine[]>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const search = useCallback(
    async (searchCode: string) => {
      const trimmed = searchCode.trim();
      if (!trimmed) {
        setError('Ingrese el código del cliente');
        return;
      }

      if (syncUrl) {
        router.replace(`/clientes/historico?code=${encodeURIComponent(trimmed)}`, { scroll: false });
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      setSelectedInvoiceId(null);
      setDetailsByDocument({});
      setDetailsError(null);

      try {
        const response = await getClientHistory(trimmed);
        if (requestId !== requestIdRef.current) return;
        setData(response);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setData(null);
        // 404 / 403 / 400: se muestra el `detail` del backend.
        setError(
          err instanceof ClientHistoryError || err instanceof Error
            ? err.message
            : 'No se pudo consultar el histórico del cliente',
        );
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [router, syncUrl],
  );

  // Abrir con ?code= busca automáticamente una vez.
  useEffect(() => {
    if (initialCode) void search(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void search(code);
  };

  const payments = useMemo(() => data?.payments ?? [], [data]);
  const creditNotes = useMemo(() => data?.creditNotes ?? [], [data]);
  const transfers = data?.transfers ?? [];
  const articles = data?.articles ?? [];

  // Último pago (cobros activos) y días de atraso por factura.
  const invoiceRows = useMemo<InvoiceRow[]>(() => {
    const lastPaymentByInvoice = new Map<number, string>();
    payments.filter(isActivePayment).forEach((payment) => {
      (payment.invoices ?? []).forEach((item) => {
        const current = lastPaymentByInvoice.get(item.invoiceId);
        if (!current || (toDay(payment.collectionDate) ?? 0) > (toDay(current) ?? 0)) {
          lastPaymentByInvoice.set(item.invoiceId, payment.collectionDate);
        }
      });
    });

    const today = toDay(new Date().toISOString());
    return (data?.invoices ?? []).map((invoice) => {
      const lastPaymentAt = lastPaymentByInvoice.get(invoice.invoiceId) ?? null;
      const due = toDay(invoice.dueDate);
      // Pagada: días entre vencimiento y último pago. Con saldo: días vencidos a hoy.
      const reference = invoice.remainingBalanceNio > 0 ? today : toDay(lastPaymentAt);
      const daysLate =
        due !== null && reference !== null ? Math.max(0, Math.round((reference - due) / 86400000)) : null;
      return { ...invoice, lastPaymentAt, daysLate };
    });
  }, [data, payments]);

  const visibleInvoices = useMemo(
    () => (showVoided ? invoiceRows : invoiceRows.filter((invoice) => !invoice.isVoided)),
    [invoiceRows, showVoided],
  );

  const voidedCount = invoiceRows.length - invoiceRows.filter((invoice) => !invoice.isVoided).length;

  // Seleccionar la primera factura al cargar.
  useEffect(() => {
    if (selectedInvoiceId === null && visibleInvoices.length > 0) {
      setSelectedInvoiceId(visibleInvoices[0].invoiceId);
    }
  }, [visibleInvoices, selectedInvoiceId]);

  const selectedInvoice = invoiceRows.find((invoice) => invoice.invoiceId === selectedInvoiceId) ?? null;
  const selectedDocument = selectedInvoice?.document ?? null;

  // Detalle de productos de la factura seleccionada (con caché por documento).
  useEffect(() => {
    if (!selectedDocument || detailsByDocument[selectedDocument]) return;
    let cancelled = false;
    setDetailsLoading(true);
    setDetailsError(null);

    getInvoices({ document: selectedDocument, page: 1, perPage: 10 })
      .then((response) => {
        if (cancelled) return;
        const match = (response.records ?? []).find((record) => record.header.document === selectedDocument);
        setDetailsByDocument((prev) => ({ ...prev, [selectedDocument]: match?.details ?? [] }));
      })
      .catch(() => {
        if (!cancelled) setDetailsError('No se pudo cargar el detalle de la factura');
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDocument, detailsByDocument]);

  // Pagos (recibos) y devoluciones (notas de crédito) de la factura seleccionada.
  const selectedMovements = useMemo<InvoiceMovement[]>(() => {
    if (!selectedInvoice) return [];
    const receipts: InvoiceMovement[] = payments.flatMap((payment) =>
      (payment.invoices ?? [])
        .filter((item) => item.invoiceId === selectedInvoice.invoiceId)
        .map((item) => ({
          key: `cob-${payment.collectionId}-${item.invoiceId}`,
          type: 'Recibo' as const,
          number: payment.number,
          date: payment.collectionDate,
          amount: item.amountNio,
          status: statusLabel(PAYMENT_STATUS, payment.status),
          cashRegister: payment.cashRegisterCode || '—',
        })),
    );
    const notes: InvoiceMovement[] = creditNotes
      .filter((note) => note.invoiceId === selectedInvoice.invoiceId)
      .map((note) => ({
        key: `nc-${note.creditNoteId}`,
        type: 'Nota de crédito' as const,
        number: note.number,
        date: note.startDate,
        amount: note.appliedAmountNio || note.total,
        status: statusLabel(CREDIT_NOTE_STATUS, note.status),
        cashRegister: '—',
      }));
    return [...receipts, ...notes];
  }, [selectedInvoice, payments, creditNotes]);

  const client = data?.client;
  const summary = data?.summary;
  const showResults = loading || data !== null;
  const selectedDetails = selectedDocument ? detailsByDocument[selectedDocument] : undefined;

  // ---- Columnas ----

  const invoiceColumns: GridColumn<InvoiceRow>[] = [
    {
      key: 'document',
      header: 'Factura',
      filterText: (r) => r.document,
      cell: (r) => (
        <span className="inline-flex items-center gap-1">
          <span className={`font-mono ${r.isVoided ? 'line-through' : ''}`}>{r.document}</span>
          {r.isVoided && <Badge tone="red">Anulada</Badge>}
        </span>
      ),
    },
    { key: 'saleType', header: 'Condición', filterText: (r) => r.saleType ?? '', cell: (r) => r.saleType || '—' },
    { key: 'promoter', header: 'Vendedor', filterText: (r) => r.promoterCode ?? '', cell: (r) => r.promoterCode || '—' },
    { key: 'issuedAt', header: 'Facturada', filterText: (r) => date(r.issuedAt), cell: (r) => date(r.issuedAt) },
    { key: 'dueDate', header: 'Vencimiento', filterText: (r) => date(r.dueDate), cell: (r) => date(r.dueDate) },
    { key: 'lastPayment', header: 'Último pago', filterText: (r) => date(r.lastPaymentAt), cell: (r) => date(r.lastPaymentAt) },
    {
      key: 'days',
      header: 'Días',
      headerTitle: 'Días de atraso: del vencimiento al último pago (o a hoy si tiene saldo)',
      align: 'right',
      cell: (r) => (r.daysLate === null ? '—' : r.daysLate),
      cellClassName: (r) => (r.daysLate && r.remainingBalanceNio > 0 ? 'text-rose-600 font-medium' : ''),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (r) => money(r.netTotal),
      sum: (r) => (r.isVoided ? 0 : r.netTotal),
      formatSum: money,
    },
    {
      key: 'balance',
      header: 'Saldo',
      align: 'right',
      cell: (r) => money(r.remainingBalanceNio),
      cellClassName: (r) => (!r.isVoided && r.remainingBalanceNio > 0 ? 'text-rose-600 font-semibold' : ''),
      sum: (r) => (r.isVoided ? 0 : r.remainingBalanceNio),
      formatSum: money,
    },
    {
      key: 'status',
      header: 'Estado',
      filterText: (r) => (r.isVoided ? 'Anulada' : r.chargeStatus ?? ''),
      cell: (r) => (r.isVoided ? 'ANULADA' : (r.chargeStatus || '—').toUpperCase()),
    },
  ];

  const detailColumns: GridColumn<InvoiceDetailLine>[] = [
    { key: 'article', header: 'Artículo', filterText: (r) => r.article, cell: (r) => <span className="font-mono">{r.article}</span> },
    { key: 'quantity', header: 'Cantidad', align: 'right', cell: (r) => qty(r.quantity), sum: (r) => r.quantity, formatSum: qty },
    { key: 'salePrice', header: 'Precio venta', align: 'right', cell: (r) => money(r.salePrice) },
    {
      key: 'discount',
      header: 'Descuento',
      align: 'right',
      cell: (r) => money((Number(r.lineDiscount) || 0) + (Number(r.generalDiscount) || 0)),
    },
    { key: 'price', header: 'Precio unitario', align: 'right', cell: (r) => money(r.price) },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (r) => money((Number(r.price) || 0) * (Number(r.quantity) || 0)),
      sum: (r) => (Number(r.price) || 0) * (Number(r.quantity) || 0),
      formatSum: money,
    },
  ];

  const movementColumns: GridColumn<InvoiceMovement>[] = [
    { key: 'number', header: 'No. documento', filterText: (r) => r.number, cell: (r) => <span className="font-mono">{r.number}</span> },
    { key: 'date', header: 'Fecha', cell: (r) => date(r.date) },
    { key: 'cash', header: 'Caja', cell: (r) => r.cashRegister },
    { key: 'status', header: 'Estado', cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'amount',
      header: 'Monto',
      align: 'right',
      cell: (r) => money(r.amount),
      sum: (r) => (r.status === 'Anulado' || r.status === 'Anulada' || r.status === 'Borrador' ? 0 : r.amount),
      formatSum: money,
    },
  ];

  const creditNoteColumns: GridColumn<ClientHistoryCreditNote>[] = [
    { key: 'number', header: 'Número', filterText: (r) => r.number, cell: (r) => <span className="font-mono">{r.number}</span> },
    { key: 'date', header: 'Fecha', filterText: (r) => date(r.startDate), cell: (r) => date(r.startDate) },
    {
      key: 'status',
      header: 'Estado',
      filterText: (r) => statusLabel(CREDIT_NOTE_STATUS, r.status),
      cell: (r) => {
        const status = statusLabel(CREDIT_NOTE_STATUS, r.status);
        return <Badge tone={statusTone(status)}>{status}</Badge>;
      },
    },
    { key: 'total', header: 'Total', align: 'right', cell: (r) => money(r.total) },
    { key: 'applied', header: 'Aplicado', align: 'right', cell: (r) => money(r.appliedAmountNio) },
    {
      key: 'available',
      header: 'Disponible',
      align: 'right',
      cell: (r) => money((Number(r.total) || 0) - (Number(r.appliedAmountNio) || 0)),
    },
    {
      key: 'invoice',
      header: 'Factura',
      filterText: (r) => r.invoiceDocument ?? 'Sin factura relacionada',
      cell: (r) =>
        r.invoiceId === null ? (
          <Badge tone="amber">Sin factura relacionada</Badge>
        ) : (
          <span className="font-mono">{r.invoiceDocument || '—'}</span>
        ),
    },
  ];

  const paymentColumns: GridColumn<ClientHistoryPayment>[] = [
    { key: 'number', header: 'Número', filterText: (r) => r.number, cell: (r) => <span className="font-mono">{r.number}</span> },
    { key: 'date', header: 'Fecha', filterText: (r) => date(r.collectionDate), cell: (r) => date(r.collectionDate) },
    { key: 'currency', header: 'Moneda', filterText: (r) => r.currency ?? '', cell: (r) => r.currency || '—' },
    { key: 'cash', header: 'Efectivo', align: 'right', cell: (r) => money(r.cashTotal) },
    { key: 'transfer', header: 'Transferencia', align: 'right', cell: (r) => money(r.transferTotal) },
    { key: 'total', header: 'Total', align: 'right', cell: (r) => money(r.total) },
    {
      key: 'applied',
      header: 'Aplicado a este cliente*',
      headerTitle:
        'Un cobro puede incluir facturas de otros clientes; por eso el total puede ser mayor que lo aplicado a este cliente.',
      align: 'right',
      cell: (r) => <span className="font-medium">{money(r.appliedToClientNio)}</span>,
      sum: (r) => (isActivePayment(r) ? r.appliedToClientNio : 0),
      formatSum: money,
    },
    {
      key: 'status',
      header: 'Estado',
      filterText: (r) => statusLabel(PAYMENT_STATUS, r.status),
      cell: (r) => {
        const status = statusLabel(PAYMENT_STATUS, r.status);
        return <Badge tone={statusTone(status)}>{status}</Badge>;
      },
    },
    { key: 'cashRegister', header: 'Caja', filterText: (r) => r.cashRegisterCode ?? '', cell: (r) => r.cashRegisterCode || '—' },
  ];

  const transferColumns: GridColumn<ClientHistoryTransfer>[] = [
    { key: 'date', header: 'Fecha', filterText: (r) => date(r.transferDate), cell: (r) => date(r.transferDate) },
    { key: 'amount', header: 'Monto', align: 'right', cell: (r) => money(r.amount), sum: (r) => r.amount, formatSum: money },
    { key: 'bank', header: 'Banco', filterText: (r) => r.bankName ?? '', cell: (r) => r.bankName || '—' },
    { key: 'account', header: 'Cuenta', filterText: (r) => r.accountNumber ?? '', cell: (r) => <span className="font-mono">{r.accountNumber || '—'}</span> },
    { key: 'concept', header: 'Concepto contable', filterText: (r) => r.accountingConcept ?? '', cell: (r) => r.accountingConcept || '—' },
    { key: 'collection', header: 'Cobro', filterText: (r) => r.collectionNumber ?? '', cell: (r) => <span className="font-mono">{r.collectionNumber || '—'}</span> },
    {
      key: 'invoices',
      header: 'Facturas',
      filterText: (r) => (Array.isArray(r.invoiceDocuments) ? r.invoiceDocuments.join(', ') : r.invoiceDocuments ?? ''),
      cell: (r) => {
        const docs = Array.isArray(r.invoiceDocuments) ? r.invoiceDocuments.join(', ') : r.invoiceDocuments;
        return <span className="font-mono">{docs || '—'}</span>;
      },
    },
  ];

  const articleColumns: GridColumn<ClientHistoryArticle>[] = [
    { key: 'article', header: 'Artículo', filterText: (r) => r.article, cell: (r) => <span className="font-mono">{r.article}</span> },
    { key: 'purchasedQty', header: 'Cant. comprada', align: 'right', cell: (r) => qty(r.purchasedQuantity), sum: (r) => r.purchasedQuantity, formatSum: qty },
    { key: 'purchasedTotal', header: 'Total comprado', align: 'right', cell: (r) => money(r.purchasedTotal), sum: (r) => r.purchasedTotal, formatSum: money },
    { key: 'invoiceCount', header: 'Facturas', align: 'right', cell: (r) => r.invoiceCount },
    { key: 'lastPurchase', header: 'Última compra', filterText: (r) => date(r.lastPurchaseAt), cell: (r) => date(r.lastPurchaseAt) },
    { key: 'creditedQty', header: 'Cant. devuelta', align: 'right', cell: (r) => qty(r.creditedQuantity), sum: (r) => r.creditedQuantity, formatSum: qty },
    { key: 'creditedTotal', header: 'Total devuelto', align: 'right', cell: (r) => money(r.creditedTotal), sum: (r) => r.creditedTotal, formatSum: money },
    {
      key: 'netQty',
      header: 'Cant. neta',
      align: 'right',
      cell: (r) => <span className="font-medium">{qty((Number(r.purchasedQuantity) || 0) - (Number(r.creditedQuantity) || 0))}</span>,
      sum: (r) => (Number(r.purchasedQuantity) || 0) - (Number(r.creditedQuantity) || 0),
      formatSum: qty,
    },
  ];

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'invoices', label: 'Facturas', count: visibleInvoices.length },
    { id: 'creditNotes', label: 'Notas de crédito', count: creditNotes.length },
    { id: 'payments', label: 'Pagos', count: payments.length },
    { id: 'transfers', label: 'Transferencias', count: transfers.length },
    { id: 'articles', label: 'Productos', count: articles.length },
  ];

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 sm:max-w-sm">
          <span className="text-xs text-muted-foreground">Código del cliente (completo)</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. CLI001"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Search size={16} />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      {showResults && (
        <>
          {/* Cabecera del cliente */}
          <div className="rounded-lg border border-border bg-surface p-4">
            {loading || !client ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold uppercase tracking-wide text-foreground">{client.name}</h3>
                  <Badge tone="gray">
                    <span className="font-mono">{client.code}</span>
                  </Badge>
                  {client.clientType && <Badge tone="blue">{client.clientType}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tel: {client.phoneNumber || '—'} · Ingreso: {date(client.dateOfEntry)} · Sucursal:{' '}
                  {client.branchCode || client.branchName ? `${client.branchCode ?? '—'} - ${client.branchName ?? '—'}` : '—'}{' '}
                  · Promotor:{' '}
                  {client.promoterCode || client.promoterName
                    ? `${client.promoterCode ?? '—'} - ${client.promoterName ?? '—'}`
                    : '—'}
                </p>
                {client.name?.trim().toUpperCase() === client.code?.trim().toUpperCase() && (
                  <div className="mt-2 flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                    <AlertTriangle size={14} />
                    Cliente creado automáticamente al importar; complete sus datos
                  </div>
                )}
              </>
            )}
          </div>

          {/* Resumen (ya calculado por el backend) */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {loading || !summary ? (
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-border/60 bg-surface px-3 py-2">
                  <Skeleton className="mb-1 h-3 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))
            ) : (
              <>
                <Stat label="Saldo pendiente" value={money(summary.pendingBalance)} tone="danger" />
                <Stat label="Total facturado" value={money(summary.invoicedTotal)} />
                <Stat label="Pagado" value={money(summary.paidTotal)} />
                <Stat label="Acreditado por notas" value={money(summary.creditedTotal)} />
                <Stat
                  label="Facturas"
                  value={`${summary.invoiceCount}${summary.voidedInvoiceCount ? ` (${summary.voidedInvoiceCount} anul.)` : ''}`}
                />
                <Stat label="Notas / Cobros / Transf." value={`${summary.creditNoteCount} / ${summary.paymentCount} / ${summary.transferCount}`} />
                <Stat label="Primera compra" value={date(summary.firstPurchaseAt)} />
                <Stat label="Última compra" value={date(summary.lastPurchaseAt)} />
              </>
            )}
          </div>

          {/* Pestañas verticales + contenido */}
          <div className="flex flex-col gap-2 md:flex-row">
            <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`whitespace-nowrap rounded border px-3 py-2 text-xs transition-colors md:rotate-180 md:px-2 md:py-3 md:[writing-mode:vertical-rl] ${
                    tab === item.id
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {!loading ? ` (${item.count ?? 0})` : ''}
                </button>
              ))}
            </nav>

            <div className="min-w-0 flex-1">
              {tab === 'invoices' && (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <Panel
                    title="Lista de facturas"
                    actions={
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={showVoided}
                          onChange={(e) => setShowVoided(e.target.checked)}
                        />
                        Ver anuladas{voidedCount ? ` (${voidedCount})` : ''}
                      </label>
                    }
                  >
                    <HistoryGrid
                      rows={visibleInvoices}
                      columns={invoiceColumns}
                      rowKey={(r) => r.invoiceId}
                      loading={loading}
                      groupBy={(r) => monthGroup(r.issuedAt)}
                      selectedKey={selectedInvoiceId}
                      onSelect={(r) => setSelectedInvoiceId(r.invoiceId)}
                      rowClassName={(r) => (r.isVoided ? 'text-muted-foreground' : '')}
                      showTotals
                      maxHeightClass="max-h-[640px]"
                    />
                  </Panel>

                  <div className="flex min-w-0 flex-col gap-3">
                    <Panel
                      title={
                        <>
                          Detalle de productos
                          {selectedDocument && (
                            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                              {selectedDocument}
                            </span>
                          )}
                        </>
                      }
                    >
                      {detailsError ? (
                        <p className="px-2 py-6 text-center text-sm text-rose-600">{detailsError}</p>
                      ) : !selectedDocument && !loading ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                          Seleccione una factura para ver sus productos
                        </p>
                      ) : (
                        <HistoryGrid
                          rows={selectedDetails ?? []}
                          columns={detailColumns}
                          rowKey={(r) => r.id}
                          loading={loading || detailsLoading || (Boolean(selectedDocument) && !selectedDetails)}
                          emptyText="Sin productos"
                          showTotals
                          maxHeightClass="max-h-[300px]"
                        />
                      )}
                    </Panel>

                    <Panel title="Pagos de la factura">
                      {!selectedInvoice && !loading ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                          Seleccione una factura para ver sus pagos
                        </p>
                      ) : (
                        <HistoryGrid
                          rows={selectedMovements}
                          columns={movementColumns}
                          rowKey={(r) => r.key}
                          loading={loading}
                          groupBy={(r) => ({ key: r.type, label: `Tipo: ${r.type}` })}
                          emptyText="Sin pagos ni devoluciones"
                          showTotals
                          maxHeightClass="max-h-[300px]"
                        />
                      )}
                    </Panel>
                  </div>
                </div>
              )}

              {tab === 'creditNotes' && (
                <Panel title="Notas de crédito">
                  <HistoryGrid
                    rows={creditNotes}
                    columns={creditNoteColumns}
                    rowKey={(r) => r.creditNoteId}
                    loading={loading}
                    groupBy={(r) => monthGroup(r.startDate)}
                    maxHeightClass="max-h-[640px]"
                  />
                </Panel>
              )}

              {tab === 'payments' && (
                <Panel title="Pagos (cobros)">
                  <HistoryGrid
                    rows={payments}
                    columns={paymentColumns}
                    rowKey={(r) => r.collectionId}
                    loading={loading}
                    groupBy={(r) => monthGroup(r.collectionDate)}
                    rowClassName={(r) => (isActivePayment(r) ? '' : 'text-muted-foreground line-through')}
                    renderExpanded={(r) =>
                      (r.invoices ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin facturas en este cobro</p>
                      ) : (
                        <table className="w-full max-w-sm text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="py-1 text-left font-medium">Factura</th>
                              <th className="py-1 text-right font-medium">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.invoices.map((item) => (
                              <tr key={`${r.collectionId}-${item.invoiceId}`}>
                                <td className="py-0.5 font-mono">{item.document}</td>
                                <td className="py-0.5 text-right tabular-nums">{money(item.amountNio)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }
                    showTotals
                    maxHeightClass="max-h-[640px]"
                  />
                  {!loading && payments.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      * Un cobro puede incluir facturas de otros clientes; por eso el total puede ser mayor que lo
                      aplicado a este cliente. Haga clic en una fila para ver sus facturas.
                    </p>
                  )}
                </Panel>
              )}

              {tab === 'transfers' && (
                <Panel title="Transferencias">
                  <HistoryGrid
                    rows={transfers}
                    columns={transferColumns}
                    rowKey={(r) => r.transferId}
                    loading={loading}
                    groupBy={(r) => monthGroup(r.transferDate)}
                    showTotals
                    maxHeightClass="max-h-[640px]"
                  />
                </Panel>
              )}

              {tab === 'articles' && (
                <Panel title="Productos comprados">
                  <HistoryGrid
                    rows={articles}
                    columns={articleColumns}
                    rowKey={(r) => r.article}
                    loading={loading}
                    showTotals
                    maxHeightClass="max-h-[640px]"
                  />
                </Panel>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
