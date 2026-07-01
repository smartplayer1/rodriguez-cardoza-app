'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';

import { getInvoices } from '@/app/services/invoice';
import { createCollection } from '@/app/services/billing/collection';
import type { CollectionBankTransfer, CollectionCashDetail, CollectionCreatePayload } from '@/app/type/collection';
import type { ServerInvoiceResponse } from '@/app/type/invoice';

type InvoiceOption = {
  id: number;
  document: string;
  promoterCode: string;
  promoterName: string;
  clientName: string;
  chargeStatus: string;
  branchCode: string;
  issuedAt: string;
  netTotal: number;
};

const defaultCashDetail = (): CollectionCashDetail => ({ denomination: 1, quantity: 1 });
const defaultTransfer = (): CollectionBankTransfer => ({ accountNumber: '', companyBankAccountId: 1, transferDate: '', amount: 1 });

const mapInvoice = (invoice: ServerInvoiceResponse): InvoiceOption => ({
  id: invoice.header.id,
  document: invoice.header.document,
  promoterCode: invoice.header.promoterCode,
  promoterName: invoice.header.promoterName,
  clientName: invoice.header.clientName,
  chargeStatus: invoice.header.chargeStatus,
  branchCode: invoice.header.branchCode,
  issuedAt: invoice.header.issuedAt,
  netTotal: invoice.header.netTotal,
});

export default function CrearCobroModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [advisorFilter, setAdvisorFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    cashManagementId: '',
    currency: 'NIO',
    exchangeRate: '0',
    collectionDate: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const [cashDetails, setCashDetails] = useState<CollectionCashDetail[]>([defaultCashDetail()]);
  const [changeDetails, setChangeDetails] = useState<CollectionCashDetail[]>([defaultCashDetail()]);
  const [bankTransfers, setBankTransfers] = useState<CollectionBankTransfer[]>([defaultTransfer()]);

  useEffect(() => {
    if (!isOpen || invoicesLoaded || loadingInvoices) {
      return;
    }

    const loadInvoices = async () => {
      setLoadingInvoices(true);
      setInvoiceError(null);

      try {
        const response = await getInvoices();
        const mapped = (response.records || [])
          .map(mapInvoice)
          .filter((item) => item.chargeStatus.toLowerCase().includes('credit') || item.chargeStatus.toLowerCase().includes('cr'));
        setInvoices(mapped);
        setInvoicesLoaded(true);
      } catch (error) {
        setInvoiceError(error instanceof Error ? error.message : 'No se pudieron cargar las facturas con saldo');
      } finally {
        setLoadingInvoices(false);
      }
    };

    void loadInvoices();
  }, [isOpen, invoicesLoaded, loadingInvoices]);

  const advisorOptions = useMemo(() => {
    const seen = new Map<string, string>();

    for (const invoice of invoices) {
      const key = invoice.promoterCode || invoice.promoterName;
      if (!seen.has(key)) {
        seen.set(key, `${invoice.promoterName}${invoice.promoterCode ? ` (${invoice.promoterCode})` : ''}`);
      }
    }

    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesAdvisor = !advisorFilter || invoice.promoterCode === advisorFilter || invoice.promoterName === advisorFilter;
      const matchesSearch =
        invoice.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.promoterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.branchCode.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesAdvisor && matchesSearch;
    });
  }, [advisorFilter, invoices, searchTerm]);

  const selectedInvoice = useMemo(
    () => filteredInvoices.find((invoice) => String(invoice.id) === selectedInvoiceId) || invoices.find((invoice) => String(invoice.id) === selectedInvoiceId),
    [filteredInvoices, invoices, selectedInvoiceId],
  );

  const resetForm = () => {
    setFormData({
      number: '',
      cashManagementId: '',
      currency: 'NIO',
      exchangeRate: '0',
      collectionDate: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setCashDetails([defaultCashDetail()]);
    setChangeDetails([defaultCashDetail()]);
    setBankTransfers([defaultTransfer()]);
    setSelectedInvoiceId('');
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setErrorMessage(null);
  };

  const cashSummary = cashDetails.reduce(
    (summary, row) => {
      const total = row.denomination * row.quantity;
      return {
        quantity: summary.quantity + row.quantity,
        total: summary.total + total,
      };
    },
    { quantity: 0, total: 0 },
  );

  const changeSummary = changeDetails.reduce(
    (summary, row) => {
      const total = row.denomination * row.quantity;
      return {
        quantity: summary.quantity + row.quantity,
        total: summary.total + total,
      };
    },
    { quantity: 0, total: 0 },
  );

  const buildPayload = (): CollectionCreatePayload => {
    const invoiceId = selectedInvoice ? selectedInvoice.id : null;
    const invoiceDocument = selectedInvoice ? selectedInvoice.document : null;

    return {
      number: formData.number.trim(),
      invoiceId,
      invoiceDocument,
      cashManagementId: Number.parseInt(formData.cashManagementId, 10),
      currency: formData.currency,
      collectionDate: formData.collectionDate,
      description: formData.description.trim() ? formData.description.trim() : null,
      cashDetails: cashDetails.filter((row) => row.denomination > 0 && row.quantity > 0),
      bankTransfers: bankTransfers.filter((row) => row.companyBankAccountId > 0 && row.amount > 0),
      changeDetails: changeDetails.filter((row) => row.denomination > 0 && row.quantity > 0),
    };
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!formData.number.trim()) {
      setErrorMessage('El número es obligatorio.');
      return;
    }

    if (!Number.isFinite(Number.parseInt(formData.cashManagementId, 10)) || Number.parseInt(formData.cashManagementId, 10) <= 0) {
      setErrorMessage('Debe indicar una gestión de caja válida.');
      return;
    }

    if (!selectedInvoice) {
      setErrorMessage('Debe seleccionar una factura con saldo.');
      return;
    }

    if (formData.currency === 'USD' && Number.parseFloat(formData.exchangeRate) <= 0) {
      setErrorMessage('Debe indicar una tasa de cambio válida para USD.');
      return;
    }

    const payload = buildPayload();

    if (payload.cashDetails.length === 0 && payload.bankTransfers.length === 0) {
      setErrorMessage('Debe ingresar al menos un detalle de efectivo o transferencia.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCollection(payload);
      closeModal();
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar el cobro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Generar cobro
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Generar cobro</h3>
                <p className="text-sm text-muted-foreground">
                  Seleccione una factura con saldo filtrando por asesor.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-80px)] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.3fr_1fr]">
              <section className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">Número</span>
                    <input
                      value={formData.number}
                      onChange={(event) => setFormData((previous) => ({ ...previous, number: event.target.value }))}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">Gestión de caja ID</span>
                    <input
                      type="number"
                      value={formData.cashManagementId}
                      onChange={(event) => setFormData((previous) => ({ ...previous, cashManagementId: event.target.value }))}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">Moneda</span>
                    <select
                      value={formData.currency}
                      onChange={(event) => setFormData((previous) => ({ ...previous, currency: event.target.value }))}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="NIO">NIO</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>

                  {formData.currency === 'USD' ? (
                    <label className="block space-y-2">
                      <span className="text-sm text-muted-foreground">Tasa de cambio</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.exchangeRate}
                        onChange={(event) => setFormData((previous) => ({ ...previous, exchangeRate: event.target.value }))}
                        className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                        placeholder="Ej: 36.50"
                      />
                    </label>
                  ) : null}

                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">Fecha de cobro</span>
                    <input
                      type="date"
                      value={formData.collectionDate}
                      onChange={(event) => setFormData((previous) => ({ ...previous, collectionDate: event.target.value }))}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm text-muted-foreground">Descripción</span>
                    <textarea
                      value={formData.description}
                      onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                      rows={3}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>

                <section className="rounded-3xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-foreground">Facturas con saldo</h4>
                    <div className="flex gap-3">
                      <label className="block space-y-2 min-w-0">
                        <span className="text-xs text-muted-foreground">Asesor</span>
                        <select
                          value={advisorFilter}
                          onChange={(event) => {
                            setAdvisorFilter(event.target.value);
                            setSelectedInvoiceId('');
                          }}
                          className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                        >
                          <option value="">Todos</option>
                          {advisorOptions.map((advisor) => (
                            <option key={advisor.value} value={advisor.value}>
                              {advisor.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block space-y-2 min-w-0">
                        <span className="text-xs text-muted-foreground">Buscar</span>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="block w-full rounded-2xl border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                            placeholder="Documento, cliente o asesor"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-border/60">
                    {loadingInvoices ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground">Cargando facturas con saldo...</p>
                    ) : invoiceError ? (
                      <p className="px-4 py-6 text-sm text-rose-700">{invoiceError}</p>
                    ) : filteredInvoices.length > 0 ? (
                      <div className="divide-y divide-border/40">
                        {filteredInvoices.map((invoice) => (
                          <label key={invoice.id} className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20 ${String(invoice.id) === selectedInvoiceId ? 'bg-primary/5' : ''}`}>
                            <input
                              type="radio"
                              name="invoice"
                              checked={String(invoice.id) === selectedInvoiceId}
                              onChange={() => {
                                setSelectedInvoiceId(String(invoice.id));
                                setFormData((previous) => ({ ...previous, number: previous.number || `COB-${invoice.document}` }));
                              }}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">{invoice.document}</span>
                                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">{invoice.promoterName}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Cliente: {invoice.clientName} · Caja: {invoice.branchCode}</p>
                              <p className="text-sm text-muted-foreground">Saldo en factura · Total {invoice.netTotal.toFixed(2)}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-6 text-sm text-muted-foreground">No hay facturas con saldo para el filtro seleccionado.</p>
                    )}
                  </div>
                </section>

                {selectedInvoice ? (
                  <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    Factura seleccionada: {selectedInvoice.document} · {selectedInvoice.promoterName}
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <DetailArrayEditor
                  title="Efectivo"
                  rows={cashDetails}
                  onRowsChange={setCashDetails}
                  renderRow={(row, index, rows, updateRow, removeRow, addRow) => (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Denominación</span>
                          <input type="number" value={row.denomination} onChange={(event) => updateRow(index, { denomination: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Denominación" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Cantidad</span>
                          <input type="number" value={row.quantity} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Cantidad" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Total</span>
                          <div className="w-full rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
                            {(row.denomination * row.quantity).toFixed(2)}
                          </div>
                        </label>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={addRow} className="rounded-xl border border-border px-3 py-1 text-xs">Agregar</button>
                        {rows.length > 1 ? <button type="button" onClick={() => removeRow(index)} className="rounded-xl border border-border px-3 py-1 text-xs">Eliminar</button> : null}
                      </div>
                    </>
                  )}
                />

                <DetailArrayEditor
                  title="Transferencias bancarias"
                  rows={bankTransfers}
                  onRowsChange={setBankTransfers}
                  renderRow={(row, index, rows, updateRow, removeRow, addRow) => (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1 min-w-0 sm:col-span-2">
                          <span className="text-xs text-muted-foreground">Número de cuenta</span>
                          <input type="text" value={row.accountNumber} onChange={(event) => updateRow(index, { accountNumber: event.target.value })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Número de cuenta" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">ID cuenta empresa</span>
                          <input type="number" value={row.companyBankAccountId} onChange={(event) => updateRow(index, { companyBankAccountId: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="ID cuenta empresa" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Fecha de transferencia</span>
                          <input type="date" value={row.transferDate} onChange={(event) => updateRow(index, { transferDate: event.target.value })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Monto</span>
                          <input type="number" value={row.amount} onChange={(event) => updateRow(index, { amount: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Monto" />
                        </label>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={addRow} className="rounded-xl border border-border px-3 py-1 text-xs">Agregar</button>
                        {rows.length > 1 ? <button type="button" onClick={() => removeRow(index)} className="rounded-xl border border-border px-3 py-1 text-xs">Eliminar</button> : null}
                      </div>
                    </>
                  )}
                />

                <DetailArrayEditor
                  title="Cambio"
                  rows={changeDetails}
                  onRowsChange={setChangeDetails}
                  renderRow={(row, index, rows, updateRow, removeRow, addRow) => (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Denominación</span>
                          <input type="number" value={row.denomination} onChange={(event) => updateRow(index, { denomination: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Denominación" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Cantidad</span>
                          <input type="number" value={row.quantity} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Cantidad" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Total</span>
                          <div className="w-full rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
                            {(row.denomination * row.quantity).toFixed(2)}
                          </div>
                        </label>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={addRow} className="rounded-xl border border-border px-3 py-1 text-xs">Agregar</button>
                        {rows.length > 1 ? <button type="button" onClick={() => removeRow(index)} className="rounded-xl border border-border px-3 py-1 text-xs">Eliminar</button> : null}
                      </div>
                    </>
                  )}
                />

                {errorMessage ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
                ) : null}

                <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Total efectivo</span>
                    <span className="text-foreground">{cashSummary.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total cambio</span>
                    <span className="text-foreground">{changeSummary.total.toFixed(2)}</span>
                  </div>
                  {formData.currency === 'USD' ? (
                    <div className="flex items-center justify-between gap-3">
                      <span>Tasa de cambio</span>
                      <span className="text-foreground">{Number.parseFloat(formData.exchangeRate || '0').toFixed(4)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? 'Guardando...' : 'Guardar cobro'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DetailArrayEditor<T extends { [key: string]: unknown }>({
  title,
  rows,
  onRowsChange,
  renderRow,
}: {
  title: string;
  rows: T[];
  onRowsChange: React.Dispatch<React.SetStateAction<T[]>>;
  renderRow: (
    row: T,
    index: number,
    rows: T[],
    updateRow: (index: number, patch: Partial<T>) => void,
    removeRow: (index: number) => void,
    addRow: () => void,
  ) => React.ReactNode;
}) {
  const updateRow = (index: number, patch: Partial<T>) => {
    onRowsChange((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onRowsChange((previous) => [...previous, previous[0] ? { ...previous[0] } : ({} as T)]);
  };

  const removeRow = (index: number) => {
    onRowsChange((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-background/50 p-4">
      <h4 className="mb-4 text-foreground">{title}</h4>
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl border border-border/60 bg-surface p-4">
            {renderRow(row, index, rows, updateRow, removeRow, addRow)}
          </div>
        ))}
      </div>
    </div>
  );
}