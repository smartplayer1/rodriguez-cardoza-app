'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';

import ClientSelector, { type ClientSearchItem } from './client-selector';
import { getCreditInvoices } from '@/app/services/invoice';
import { getCashManagementRecords } from '@/app/services/cash-management';
import { getBankAccounts } from '@/app/services/company/account';
import { getclients } from '@/app/services/clients';
import { createCollection } from '@/app/services/billing/collection';
import type { CollectionBankTransfer, CollectionCashDetail, CollectionCreatePayload } from '@/app/type/collection';
import type { BankAccount } from '@/app/type/bank';
import type { CashManagementRecord } from '@/app/type/cash-management';
import type { CreditInvoiceRecord } from '@/app/type/invoice';
import type { ClienteResponse } from '@/app/type/client';

type InvoiceOption = {
  invoiceId: number;
  document: string;
  clientCode: string;
  clientName: string;
  chargeStatus: string;
  isVoided: boolean;
  invoiceAmountNio: number;
  paidAmountNio: number;
  remainingBalanceNio: number;
  collectionCount: number;
  branchCode: string;
};

type CashManagementOption = {
  id: string;
  label: string;
};

type BankAccountOption = {
  id: number;
  accountNumber: string;
  label: string;
};

const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

const defaultCashDetail = (): CollectionCashDetail => ({ denomination: 1, quantity: 1 });
const defaultTransfer = (): CollectionBankTransfer => ({ accountNumber: '', companyBankAccountId: 0, transferDate: '', amount: 1 });

const mapCreditInvoice = (invoice: CreditInvoiceRecord): InvoiceOption => ({
  invoiceId: invoice.invoiceId,
  document: invoice.document,
  clientCode: invoice.clientCode,
  clientName: invoice.clientName,
  chargeStatus: invoice.chargeStatus,
  isVoided: invoice.isVoided,
  invoiceAmountNio: invoice.invoiceAmountNio,
  paidAmountNio: invoice.paidAmountNio,
  remainingBalanceNio: invoice.remainingBalanceNio,
  collectionCount: invoice.collectionCount,
  branchCode: '',
});

export default function CrearCobroModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cashManagementLoading, setCashManagementLoading] = useState(false);
  const [cashManagementOptions, setCashManagementOptions] = useState<CashManagementOption[]>([]);
  const [selectedCashManagementId, setSelectedCashManagementId] = useState('');
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [bankAccountOptions, setBankAccountOptions] = useState<BankAccountOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<ClientSearchItem[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
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

  const loadOpenCashManagementRecords = useCallback(async () => {
    try {
      setCashManagementLoading(true);
      const response = await getCashManagementRecords({
        status: 'OPEN',
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });

      const options = (response.records || []).map((record: CashManagementRecord) => ({
        id: String(record.id),
        label: `${record.cashRegisterCode} - ${record.cashRegisterName} - ${record.responsibleEmployeeName}`,
      }));

      setCashManagementOptions(options);
      setSelectedCashManagementId((current) => current || options[0]?.id || '');
    } catch (error) {
      console.error('Error loading open cash management records:', error);
      setCashManagementOptions([]);
      setSelectedCashManagementId('');
    } finally {
      setCashManagementLoading(false);
    }
  }, []);

  const loadBankAccounts = useCallback(async () => {
    try {
      setBankAccountsLoading(true);
      const response = await getBankAccounts();
      const options = (response.records || []).map((account: BankAccount) => ({
        id: account.id,
        accountNumber: account.accountNumber,
        label: `${account.accountNumber} - ${account.bank.name}`,
      }));

      setBankAccountOptions(options);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      setBankAccountOptions([]);
    } finally {
      setBankAccountsLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      const response = await getclients();
      const options = (response.records || []).map((client: ClienteResponse) => ({
        code: client.code,
        name: client.name,
      }));
      setClientOptions(options);
    } catch (error) {
      setClientsError(error instanceof Error ? error.message : 'No se pudieron cargar los clientes');
      setClientOptions([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const loadCreditInvoiceBalance = useCallback(async () => {
    if (!selectedClientCode) {
      setInvoices([]);
      return;
    }

    try {
      setLoadingInvoices(true);
      setInvoiceError(null);

      const response = await getCreditInvoices({
        clientCode: selectedClientCode,
        page: 1,
        perPage: 200,
      });

      setInvoices((response.records || []).map(mapCreditInvoice));
    } catch (error) {
      setInvoiceError(error instanceof Error ? error.message : 'No se pudieron cargar las facturas con saldo');
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, [selectedClientCode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadCreditInvoiceBalance();
  }, [isOpen, loadCreditInvoiceBalance]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadOpenCashManagementRecords();
    void loadBankAccounts();
    void loadClients();
  }, [isOpen, loadOpenCashManagementRecords, loadBankAccounts, loadClients]);

  useEffect(() => {
    if (bankAccountOptions.length === 0) {
      return;
    }

    setBankTransfers((previous) =>
      previous.map((transfer) => {
        if (transfer.companyBankAccountId > 0 && transfer.accountNumber.trim()) {
          return transfer;
        }

        const firstAccount = bankAccountOptions[0];
        return {
          ...transfer,
          companyBankAccountId: firstAccount.id,
          accountNumber: firstAccount.accountNumber,
        };
      }),
    );
  }, [bankAccountOptions]);

  useEffect(() => {
    setFormData((previous) => ({ ...previous, cashManagementId: selectedCashManagementId }));
  }, [selectedCashManagementId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [invoices, searchTerm]);

  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selectedInvoiceIds.includes(String(invoice.invoiceId))),
    [invoices, selectedInvoiceIds],
  );

  const selectedRemainingBalance = useMemo(
    () => selectedInvoices.reduce((total, invoice) => total + invoice.remainingBalanceNio, 0),
    [selectedInvoices],
  );

  const selectedClientName = selectedInvoices[0]?.clientName || '';

  const handleSelectClient = useCallback((clientCode: string) => {
    setSelectedClientCode(clientCode);
    setSelectedInvoiceIds([]);
    setSearchTerm('');
    setInvoiceError(null);
  }, []);

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
    setSelectedInvoiceIds([]);
    setSelectedCashManagementId('');
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

  const transferSummary = bankTransfers.reduce(
    (summary, row) => {
      const amount = Number.isFinite(row.amount) ? row.amount : 0;
      return {
        total: summary.total + (amount > 0 ? amount : 0),
      };
    },
    { total: 0 },
  );

  const exchangeRateValue = Number.parseFloat(formData.exchangeRate || '0');
  const foreignCurrencyTotal = changeSummary.total;
  const foreignCurrencyTotalNio = foreignCurrencyTotal * (Number.isFinite(exchangeRateValue) ? exchangeRateValue : 0);
  const receiptAppliedAmount = cashSummary.total + transferSummary.total + foreignCurrencyTotalNio;

  const buildPayload = (invoice: InvoiceOption): CollectionCreatePayload => {
    return {
      number: formData.number.trim(),
      invoiceId: invoice.invoiceId,
      invoiceDocument: invoice.document,
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

    if (selectedInvoices.length === 0) {
      setErrorMessage('Debe seleccionar al menos una factura con saldo.');
      return;
    }

    if (foreignCurrencyTotal > 0 && (!Number.isFinite(exchangeRateValue) || exchangeRateValue <= 0)) {
      setErrorMessage('Debe indicar una tasa de cambio válida para aplicar moneda extranjera.');
      return;
    }

    const firstPayload = buildPayload(selectedInvoices[0]);

    if (firstPayload.cashDetails.length === 0 && firstPayload.bankTransfers.length === 0 && firstPayload.changeDetails.length === 0) {
      setErrorMessage('Debe ingresar al menos un detalle de efectivo, transferencia o moneda extranjera.');
      return;
    }

    setIsSubmitting(true);

    try {
      const failures: string[] = [];

      for (const invoice of selectedInvoices) {
        try {
          await createCollection(buildPayload(invoice));
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Error al generar cobro';
          failures.push(`${invoice.document}: ${reason}`);
        }
      }

      if (failures.length > 0) {
        setErrorMessage(`No se pudieron procesar ${failures.length} factura(s): ${failures.join(' | ')}`);
        return;
      }

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
          <div className="max-h-[92vh] w-full max-w-[1600px] overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Generar cobro</h3>
                <p className="text-sm text-muted-foreground">
                  Seleccione una o varias facturas del mismo cliente y use un solo numero de recibo.
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
                <ClientSelector
                  clients={clientOptions}
                  loading={clientsLoading}
                  error={clientsError}
                  selectedClientCode={selectedClientCode}
                  onSelectClient={handleSelectClient}
                />

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
                    <span className="text-sm text-muted-foreground">Gestión de caja</span>
                    <select
                      value={selectedCashManagementId}
                      onChange={(event) => setSelectedCashManagementId(event.target.value)}
                      disabled={cashManagementLoading}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{cashManagementLoading ? 'Cargando gestiones...' : 'Seleccione una gestión'}</option>
                      {cashManagementOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                    <span className="text-xs text-muted-foreground">Requerida si aplica moneda extranjera.</span>
                  </label>

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
                    <label className="block space-y-2 min-w-0">
                      <span className="text-xs text-muted-foreground">Buscar</span>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          className="block w-full rounded-2xl border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                          placeholder="Documento, codigo o nombre del cliente"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-border/60">
                    {loadingInvoices ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground">Cargando facturas con saldo...</p>
                    ) : invoiceError ? (
                      <p className="px-4 py-6 text-sm text-rose-700">{invoiceError}</p>
                    ) : filteredInvoices.length > 0 ? (
                      <table className="w-full min-w-[720px] border-collapse text-sm">
                        <thead className="sticky top-0 bg-muted/70">
                          <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                            <th className="px-3 py-2">Sel.</th>
                            <th className="px-3 py-2">Documento</th>
                            <th className="px-3 py-2">Cliente</th>
                            <th className="px-3 py-2">Estado</th>
                            <th className="px-3 py-2 text-right">Monto</th>
                            <th className="px-3 py-2 text-right">Pagado</th>
                            <th className="px-3 py-2 text-right">Saldo</th>
                            <th className="px-3 py-2 text-right">Cobros</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvoices.map((invoice) => {
                            const key = String(invoice.invoiceId);
                            const isSelected = selectedInvoiceIds.includes(key);

                            return (
                              <tr key={invoice.invoiceId} className={`border-b border-border/40 ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                                <td className="px-3 py-2 align-top">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedInvoiceIds((previous) => {
                                        if (previous.includes(key)) {
                                          return previous.filter((id) => id !== key);
                                        }

                                        return [...previous, key];
                                      });
                                      setFormData((previous) => ({ ...previous, number: previous.number || `COB-${invoice.document}` }));
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2 align-top text-foreground">{invoice.document}</td>
                                <td className="px-3 py-2 align-top text-muted-foreground">{invoice.clientName}</td>
                                <td className="px-3 py-2 align-top text-muted-foreground">
                                  {invoice.chargeStatus}
                                  {invoice.isVoided ? ' · Anulada' : ''}
                                </td>
                                <td className="px-3 py-2 align-top text-right text-foreground">{invoice.invoiceAmountNio.toFixed(2)}</td>
                                <td className="px-3 py-2 align-top text-right text-foreground">{invoice.paidAmountNio.toFixed(2)}</td>
                                <td className="px-3 py-2 align-top text-right font-medium text-foreground">{invoice.remainingBalanceNio.toFixed(2)}</td>
                                <td className="px-3 py-2 align-top text-right text-muted-foreground">{invoice.collectionCount}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="px-4 py-6 text-sm text-muted-foreground">
                        {selectedClientCode
                          ? 'No hay facturas con saldo para el cliente seleccionado.'
                          : 'Seleccione un cliente para visualizar sus facturas con saldo.'}
                      </p>
                    )}
                  </div>
                </section>

                {selectedInvoices.length > 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    Facturas seleccionadas: {selectedInvoices.length} · Cliente: {selectedClientName} · Saldo total aplicable: {selectedRemainingBalance.toFixed(2)}
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
                          <span className="text-xs text-muted-foreground">Cuenta bancaria empresa</span>
                          <select
                            value={row.companyBankAccountId > 0 ? String(row.companyBankAccountId) : ''}
                            onChange={(event) => {
                              const selectedId = Number(event.target.value);
                              const selectedAccount = bankAccountOptions.find((option) => option.id === selectedId);
                              updateRow(index, {
                                companyBankAccountId: selectedId,
                                accountNumber: selectedAccount?.accountNumber || '',
                              });
                            }}
                            disabled={bankAccountsLoading}
                            className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">{bankAccountsLoading ? 'Cargando cuentas...' : 'Seleccione una cuenta bancaria'}</option>
                            {bankAccountOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block space-y-1 min-w-0 sm:col-span-2">
                          <span className="text-xs text-muted-foreground">Número de cuenta</span>
                          <input type="text" value={row.accountNumber} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Número de cuenta" readOnly />
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
                  title="Moneda extranjera (USD)"
                  rows={changeDetails}
                  onRowsChange={setChangeDetails}
                  renderRow={(row, index, rows, updateRow, removeRow, addRow) => (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Denominación USD</span>
                          <input type="number" value={row.denomination} onChange={(event) => updateRow(index, { denomination: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Denominación en USD" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Cantidad</span>
                          <input type="number" value={row.quantity} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm" placeholder="Cantidad" />
                        </label>
                        <label className="block space-y-1 min-w-0">
                          <span className="text-xs text-muted-foreground">Total USD</span>
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
                    <span>Total transferencias</span>
                    <span className="text-foreground">{transferSummary.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total moneda extranjera (USD)</span>
                    <span className="text-foreground">{foreignCurrencyTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Tasa de cambio</span>
                    <span className="text-foreground">{Number.isFinite(exchangeRateValue) ? exchangeRateValue.toFixed(4) : '0.0000'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total moneda extranjera en NIO (tasa x denominación)</span>
                    <span className="text-foreground">{foreignCurrencyTotalNio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                    <span>Monto a aplicar al recibo</span>
                    <span className="text-foreground">{receiptAppliedAmount.toFixed(2)}</span>
                  </div>
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