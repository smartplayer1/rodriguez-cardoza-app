"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";

import ClientSelector, { type ClientSearchItem } from "./client-selector";
import { getCreditInvoices } from "@/app/services/invoice";
import { getCashManagementRecords } from "@/app/services/cash-management";
import { getBankAccounts } from "@/app/services/company/account";
import { getclients } from "@/app/services/clients";
import { createCollection } from "@/app/services/billing/collection";
import type {
  CollectionBankTransfer,
  CollectionCreatePayload,
  InvoiceAllocations,
} from "@/app/type/collection";
import type { BankAccount } from "@/app/type/bank";
import type { CashManagementRecord } from "@/app/type/cash-management";
import type { CreditInvoiceRecord } from "@/app/type/invoice";
import type { ClienteResponse } from "@/app/type/client";

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

const defaultTransfer = (): CollectionBankTransfer => ({
  accountNumber: "",
  companyBankAccountId: 0,
  transferDate: "",
  amount: 0,
});

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
  branchCode: "",
});

export default function CrearCobroModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cashManagementLoading, setCashManagementLoading] = useState(false);
  const [cashManagementOptions, setCashManagementOptions] = useState<
    CashManagementOption[]
  >([]);
  const [selectedCashManagementId, setSelectedCashManagementId] = useState("");
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [bankAccountOptions, setBankAccountOptions] = useState<
    BankAccountOption[]
  >([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<ClientSearchItem[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState("");
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [invoiceAllocations, setInvoiceAllocations] = useState<
    InvoiceAllocations[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    number: "",
    cashManagementId: "",
    currency: "NIO",
    collectionDate: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const [bankTransfers, setBankTransfers] = useState<CollectionBankTransfer[]>(
    [],
  );
  const [cashDifferenceConfirmed, setCashDifferenceConfirmed] = useState(false);

  const loadOpenCashManagementRecords = useCallback(async () => {
    try {
      setCashManagementLoading(true);
      const response = await getCashManagementRecords({
        status: "OPEN",
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });

      const options = (response.records || []).map(
        (record: CashManagementRecord) => ({
          id: String(record.id),
          label: `${record.cashRegisterCode} - ${record.cashRegisterName} - ${record.responsibleEmployeeName}`,
        }),
      );

      setCashManagementOptions(options);
      setSelectedCashManagementId((current) => current || options[0]?.id || "");
    } catch (error) {
      console.error("Error loading open cash management records:", error);
      setCashManagementOptions([]);
      setSelectedCashManagementId("");
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
      console.error("Error loading bank accounts:", error);
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
      const options = (response.records || []).map(
        (client: ClienteResponse) => ({
          code: client.code,
          name: client.name,
        }),
      );
      setClientOptions(options);
    } catch (error) {
      setClientsError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los clientes",
      );
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
      setInvoiceError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las facturas con saldo",
      );
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
        if (
          transfer.companyBankAccountId > 0 &&
          transfer.accountNumber.trim()
        ) {
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
    setFormData((previous) => ({
      ...previous,
      cashManagementId: selectedCashManagementId,
    }));
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
    () =>
      invoices.filter((invoice) =>
        selectedInvoiceIds.includes(String(invoice.invoiceId)),
      ),
    [invoices, selectedInvoiceIds],
  );

  const selectedRemainingBalance = useMemo(
    () =>
      selectedInvoices.reduce(
        (total, invoice) => total + invoice.remainingBalanceNio,
        0,
      ),
    [selectedInvoices],
  );

  const selectedClientName = selectedInvoices[0]?.clientName || "";

  const handleSelectClient = useCallback((clientCode: string) => {
    setSelectedClientCode(clientCode);
    setSelectedInvoiceIds([]);
    setSearchTerm("");
    setInvoiceError(null);
  }, []);

  const resetForm = () => {
    setFormData({
      number: "",
      cashManagementId: "",
      currency: "NIO",
      collectionDate: new Date().toISOString().slice(0, 10),
      description: "",
    });
    setBankTransfers([]);
    setSelectedInvoiceIds([]);
    setSelectedCashManagementId("");
    setCashDifferenceConfirmed(false);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setErrorMessage(null);
  };

  const transferSummary = bankTransfers.reduce(
    (summary, row) => {
      const amount = Number.isFinite(row.amount) ? row.amount : 0;
      return {
        total: summary.total + (amount > 0 ? amount : 0),
      };
    },
    { total: 0 },
  );

  const totalApplied = useMemo(() => {
    return invoiceAllocations.reduce((sum, item) => sum + item.amountNio, 0);
  }, [invoiceAllocations]);

  // El monto del recibo es la suma de lo aplicado a las facturas. Si hay
  // transferencias, el efectivo es la diferencia entre ese total y lo
  // transferido, sin desglose por denominación.
  const receiptAppliedAmount = totalApplied;
  const transferExceedsReceipt = transferSummary.total > receiptAppliedAmount;
  const cashAmountValue = transferExceedsReceipt
    ? 0
    : Math.max(0, receiptAppliedAmount - transferSummary.total);
  const hasCashDifference =
    !transferExceedsReceipt && transferSummary.total > 0 && cashAmountValue > 0;

  useEffect(() => {
    setCashDifferenceConfirmed(false);
  }, [transferSummary.total, receiptAppliedAmount]);

  const buildPayload = (invoice: InvoiceOption): CollectionCreatePayload => {
    return {
      number: formData.number.trim(),
      cashManagementId: Number.parseInt(formData.cashManagementId, 10),
      currency: formData.currency,
      collectionDate: formData.collectionDate,
      description: formData.description.trim()
        ? formData.description.trim()
        : null,
      cashAmount: cashAmountValue,
      bankTransfers: bankTransfers.filter(
        (row) => row.companyBankAccountId > 0 && row.amount > 0,
      ),
      invoiceAllocations: invoiceAllocations.filter(
        (allocation) => allocation.amountNio > 0,
      ),
    };
  };

  const getAppliedAmount = (invoiceId: number) => {
    return (
      invoiceAllocations.find((x) => x.invoiceId === invoiceId)?.amountNio ?? 0
    );
  };

  const updateAppliedAmount = (invoice: InvoiceOption, value: number) => {
    let amount = Number.isFinite(value) ? value : 0;

    // No permitir negativos
    if (amount < 0) amount = 0;

    // No permitir mayor al saldo
    if (amount > invoice.remainingBalanceNio) {
      amount = invoice.remainingBalanceNio;
    }

    setInvoiceAllocations((previous) => {
      const exists = previous.find((x) => x.invoiceId === invoice.invoiceId);

      if (amount === 0) {
        return previous.filter((x) => x.invoiceId !== invoice.invoiceId);
      }

      if (exists) {
        return previous.map((x) =>
          x.invoiceId === invoice.invoiceId
            ? {
                ...x,
                amountNio: amount,
              }
            : x,
        );
      }

      return [
        ...previous,
        {
          invoiceId: invoice.invoiceId,
          amountNio: amount,
        },
      ];
    });
  };
  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!formData.number.trim()) {
      setErrorMessage("El número es obligatorio.");
      return;
    }

    if (
      !Number.isFinite(Number.parseInt(formData.cashManagementId, 10)) ||
      Number.parseInt(formData.cashManagementId, 10) <= 0
    ) {
      setErrorMessage("Debe indicar una gestión de caja válida.");
      return;
    }

    if (selectedInvoices.length === 0) {
      setErrorMessage("Debe seleccionar al menos una factura con saldo.");
      return;
    }

    if (totalApplied <= 0) {
      setErrorMessage("Debe aplicar al menos un monto a una factura.");
      return;
    }

    if (transferExceedsReceipt) {
      setErrorMessage(
        "Las transferencias no pueden ser mayores que el monto del recibo.",
      );
      return;
    }

    if (hasCashDifference && !cashDifferenceConfirmed) {
      setErrorMessage(
        "Debe confirmar la diferencia en efectivo antes de continuar.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const failures: string[] = [];

      for (const invoice of selectedInvoices) {
        try {
          await createCollection(buildPayload(invoice));
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "Error al generar cobro";
          failures.push(`${invoice.document}: ${reason}`);
        }
      }

      if (failures.length > 0) {
        setErrorMessage(
          `No se pudieron procesar ${failures.length} factura(s): ${failures.join(" | ")}`,
        );
        return;
      }

      closeModal();
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo generar el cobro.",
      );
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
                  Seleccione una o varias facturas del mismo cliente y use un
                  solo numero de recibo.
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
                    <span className="text-sm text-muted-foreground">
                      Número
                    </span>
                    <input
                      value={formData.number}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          number: event.target.value,
                        }))
                      }
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Gestión de caja
                    </span>
                    <select
                      value={selectedCashManagementId}
                      onChange={(event) =>
                        setSelectedCashManagementId(event.target.value)
                      }
                      disabled={cashManagementLoading}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {cashManagementLoading
                          ? "Cargando gestiones..."
                          : "Seleccione una gestión"}
                      </option>
                      {cashManagementOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Moneda
                    </span>
                    <select
                      value={formData.currency}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          currency: event.target.value,
                        }))
                      }
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="NIO">NIO</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-muted-foreground">
                      Fecha de cobro
                    </span>
                    <input
                      type="date"
                      value={formData.collectionDate}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          collectionDate: event.target.value,
                        }))
                      }
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>

                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm text-muted-foreground">
                      Descripción
                    </span>
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>

                <section className="rounded-3xl border border-border/60 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-foreground">Facturas con saldo</h4>
                    <label className="block space-y-2 min-w-0">
                      <span className="text-xs text-muted-foreground">
                        Buscar
                      </span>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={searchTerm}
                          onChange={(event) =>
                            setSearchTerm(event.target.value)
                          }
                          className="block w-full rounded-2xl border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                          placeholder="Documento, codigo o nombre del cliente"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-border/60">
                    {loadingInvoices ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground">
                        Cargando facturas con saldo...
                      </p>
                    ) : invoiceError ? (
                      <p className="px-4 py-6 text-sm text-rose-700">
                        {invoiceError}
                      </p>
                    ) : filteredInvoices.length > 0 ? (
                      <table className="w-full min-w-[720px] border-collapse text-sm">
                        <thead className="sticky top-0 bg-muted/70">
                          <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                            <th className="px-3 py-2">Sel.</th>
                            <th className="px-3 py-2">Documento</th>
                            <th className="px-3 py-2">Estado</th>
                            <th className="px-3 py-2 text-right">Monto</th>
                            <th className="px-3 py-2 text-right">
                              Monto Recibo
                            </th>
                            <th className="px-3 py-2 text-right">Saldo</th>
                            <th className="px-3 py-2 text-right">Cobros</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvoices.map((invoice) => {
                            const key = String(invoice.invoiceId);
                            const isSelected = selectedInvoiceIds.includes(key);

                            return (
                              <tr
                                key={invoice.invoiceId}
                                className={`border-b border-border/40 ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}`}
                              >
                                <td className="px-3 py-2 align-top">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        // Deseleccionar
                                        setSelectedInvoiceIds((prev) =>
                                          prev.filter((id) => id !== key),
                                        );

                                        setInvoiceAllocations((prev) =>
                                          prev.filter(
                                            (x) =>
                                              x.invoiceId !== invoice.invoiceId,
                                          ),
                                        );
                                      } else {
                                        // Seleccionar
                                        setSelectedInvoiceIds((prev) => [
                                          ...prev,
                                          key,
                                        ]);

                                        setInvoiceAllocations((prev) => {
                                          if (
                                            prev.some(
                                              (x) =>
                                                x.invoiceId ===
                                                invoice.invoiceId,
                                            )
                                          ) {
                                            return prev;
                                          }

                                          return [
                                            ...prev,
                                            {
                                              invoiceId: invoice.invoiceId,
                                              amountNio: 0,
                                            },
                                          ];
                                        });

                                        setFormData((prev) => ({
                                          ...prev,
                                          number:
                                            prev.number ||
                                            `COB-${invoice.document}`,
                                        }));
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2 align-top text-foreground">
                                  {invoice.document}
                                </td>
                                <td className="px-3 py-2 align-top text-muted-foreground">
                                  {invoice.chargeStatus}
                                  {invoice.isVoided ? " · Anulada" : ""}
                                </td>
                                <td className="px-3 py-2 align-top text-right text-foreground">
                                  {invoice.invoiceAmountNio.toFixed(2)}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    disabled={!isSelected}
                                    value={getAppliedAmount(invoice.invoiceId)}
                                    onChange={(e) =>
                                      updateAppliedAmount(
                                        invoice,
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-28 rounded-xl border border-border px-2 py-1 text-right"
                                  />
                                </td>
                                <td className="px-3 py-2 align-top text-right font-medium text-foreground">
                                  {(
                                    invoice.remainingBalanceNio -
                                    getAppliedAmount(invoice.invoiceId)
                                  ).toFixed(2)}
                                </td>
                                <td className="px-3 py-2 align-top text-right text-muted-foreground">
                                  {invoice.collectionCount}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="px-4 py-6 text-sm text-muted-foreground">
                        {selectedClientCode
                          ? "No hay facturas con saldo para el cliente seleccionado."
                          : "Seleccione un cliente para visualizar sus facturas con saldo."}
                      </p>
                    )}
                  </div>
                </section>

                {selectedInvoices.length > 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    Facturas seleccionadas: {selectedInvoices.length} · Cliente:{" "}
                    {selectedClientName} · Saldo total aplicable:{" "}
                    {selectedRemainingBalance.toFixed(2)}
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                {bankTransfers.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setBankTransfers([defaultTransfer()])}
                    className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Plus className="size-4" />
                    Agregar transferencia
                  </button>
                ) : (
                  <DetailArrayEditor
                    title="Transferencias bancarias"
                    rows={bankTransfers}
                    onRowsChange={setBankTransfers}
                    renderRow={(
                      row,
                      index,
                      rows,
                      updateRow,
                      removeRow,
                      addRow,
                    ) => (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1 min-w-0 sm:col-span-2">
                            <span className="text-xs text-muted-foreground">
                              Cuenta bancaria empresa
                            </span>
                            <select
                              value={
                                row.companyBankAccountId > 0
                                  ? String(row.companyBankAccountId)
                                  : ""
                              }
                              onChange={(event) => {
                                const selectedId = Number(event.target.value);
                                const selectedAccount = bankAccountOptions.find(
                                  (option) => option.id === selectedId,
                                );
                                updateRow(index, {
                                  companyBankAccountId: selectedId,
                                  accountNumber:
                                    selectedAccount?.accountNumber || "",
                                });
                              }}
                              disabled={bankAccountsLoading}
                              className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="">
                                {bankAccountsLoading
                                  ? "Cargando cuentas..."
                                  : "Seleccione una cuenta bancaria"}
                              </option>
                              {bankAccountOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block space-y-1 min-w-0 sm:col-span-2">
                            <span className="text-xs text-muted-foreground">
                              Número de cuenta
                            </span>
                            <input
                              type="text"
                              value={row.accountNumber}
                              className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                              placeholder="Número de cuenta"
                              readOnly
                            />
                          </label>
                          <label className="block space-y-1 min-w-0">
                            <span className="text-xs text-muted-foreground">
                              Fecha de transferencia
                            </span>
                            <input
                              type="date"
                              value={row.transferDate}
                              onChange={(event) =>
                                updateRow(index, {
                                  transferDate: event.target.value,
                                })
                              }
                              className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block space-y-1 min-w-0">
                            <span className="text-xs text-muted-foreground">
                              Monto
                            </span>
                            <input
                              type="number"
                              value={row.amount}
                              onChange={(event) =>
                                updateRow(index, {
                                  amount: Number(event.target.value),
                                })
                              }
                              className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                              placeholder="Monto"
                            />
                          </label>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={addRow}
                            className="rounded-xl border border-border px-3 py-1 text-xs"
                          >
                            Agregar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="rounded-xl border border-border px-3 py-1 text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  />
                )}

                {errorMessage ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Monto a aplicar al recibo</span>
                    <span className="text-foreground">
                      {receiptAppliedAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total transferencias</span>
                    <span className="text-foreground">
                      {transferSummary.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                    <span>Total en efectivo (diferencia)</span>
                    <span className="text-foreground">
                      {cashAmountValue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {transferExceedsReceipt ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Las transferencias ({transferSummary.total.toFixed(2)})
                    superan el monto aplicado a las facturas (
                    {receiptAppliedAmount.toFixed(2)}
                    ).
                  </p>
                ) : hasCashDifference ? (
                  <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <input
                      type="checkbox"
                      checked={cashDifferenceConfirmed}
                      onChange={(event) =>
                        setCashDifferenceConfirmed(event.target.checked)
                      }
                      className="mt-0.5"
                    />
                    <span>
                      Hay una diferencia de {cashAmountValue.toFixed(2)} que se
                      recibirá en efectivo. Confirme para continuar con el
                      cobro.
                    </span>
                  </label>
                ) : null}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar cobro"}
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
    onRowsChange((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  const addRow = () => {
    onRowsChange((previous) => [
      ...previous,
      previous[0] ? { ...previous[0] } : ({} as T),
    ]);
  };

  const removeRow = (index: number) => {
    onRowsChange((previous) =>
      previous.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-background/50 p-4">
      <h4 className="mb-4 text-foreground">{title}</h4>
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-2xl border border-border/60 bg-surface p-4"
          >
            {renderRow(row, index, rows, updateRow, removeRow, addRow)}
          </div>
        ))}
      </div>
    </div>
  );
}
