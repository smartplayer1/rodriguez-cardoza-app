"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import ClientSelector, { type ClientSearchItem } from "../cobros/client-selector";
import { applyCreditNote } from "@/app/services/billing/credit-note";
import { getCreditInvoices, getInvoices } from "@/app/services/invoice";
import { getCashManagementRecords } from "@/app/services/cash-management";
import { getclients } from "@/app/services/clients";
import type { CreditNoteApplyPayload, CreditNoteRecord } from "@/app/type/credit-note";
import type { CreditInvoiceRecord } from "@/app/type/invoice";
import type { ClienteResponse } from "@/app/type/client";
import { ListSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton";

type CashManagementOption = {
  id: string;
  label: string;
};

type AplicarNotaCreditoModalProps = {
  creditNote: CreditNoteRecord | null;
  onClose: () => void;
  onApplied: () => void;
};

const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

export default function AplicarNotaCreditoModal({
  creditNote,
  onClose,
  onApplied,
}: AplicarNotaCreditoModalProps) {
  const isOpen = !!creditNote;

  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<ClientSearchItem[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState("");

  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<CreditInvoiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const [cashManagementLoading, setCashManagementLoading] = useState(false);
  const [cashManagementOptions, setCashManagementOptions] = useState<CashManagementOption[]>([]);
  const [selectedCashManagementId, setSelectedCashManagementId] = useState("");

  const [amount, setAmount] = useState("");
  const [observation, setObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setSelectedClientCode("");
    setInvoices([]);
    setInvoicesError(null);
    setSearchTerm("");
    setSelectedInvoiceId(null);
    setSelectedCashManagementId("");
    setAmount("");
    setObservation("");
    setErrorMessage(null);
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
      setClientsError(
        error instanceof Error ? error.message : "No se pudieron cargar los clientes",
      );
      setClientOptions([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const loadOpenCashManagementRecords = useCallback(async () => {
    try {
      setCashManagementLoading(true);
      const response = await getCashManagementRecords({
        status: "OPEN",
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });

      const options = (response.records || []).map((record) => ({
        id: String(record.id),
        label: `${record.cashRegisterCode} - ${record.cashRegisterName} - ${record.responsibleEmployeeName}`,
      }));

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();
    void loadClients();
    void loadOpenCashManagementRecords();
  }, [isOpen, creditNote?.header.id, resetForm, loadClients, loadOpenCashManagementRecords]);

  useEffect(() => {
    if (!isOpen || !creditNote?.header.invoiceDocument) {
      return;
    }

    let cancelled = false;

    getInvoices({ document: creditNote.header.invoiceDocument, perPage: 1 })
      .then((response) => {
        if (cancelled) return;
        const clientCode = response.records?.[0]?.header.clientCode;
        if (clientCode) {
          setSelectedClientCode(clientCode);
        }
      })
      .catch(() => {
        // No es critico: el usuario puede elegir el cliente manualmente.
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, creditNote?.header.invoiceDocument]);

  const loadClientInvoices = useCallback(async () => {
    if (!selectedClientCode) {
      setInvoices([]);
      return;
    }

    try {
      setInvoicesLoading(true);
      setInvoicesError(null);

      const response = await getCreditInvoices({
        clientCode: selectedClientCode,
        page: 1,
        perPage: 200,
      });

      const withBalance = (response.records || []).filter(
        (invoice) => !invoice.isVoided && invoice.remainingBalanceNio > 0,
      );

      setInvoices(withBalance);
    } catch (error) {
      setInvoicesError(
        error instanceof Error ? error.message : "No se pudieron cargar las facturas con saldo",
      );
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, [selectedClientCode]);

  useEffect(() => {
    setSelectedInvoiceId(null);
    if (isOpen) {
      void loadClientInvoices();
    }
  }, [isOpen, loadClientInvoices]);

  const handleSelectClient = useCallback((clientCode: string) => {
    setSelectedClientCode(clientCode);
    setSearchTerm("");
  }, []);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return invoices;

    return invoices.filter(
      (invoice) =>
        invoice.document.toLowerCase().includes(term) ||
        invoice.clientCode.toLowerCase().includes(term) ||
        invoice.clientName.toLowerCase().includes(term),
    );
  }, [invoices, searchTerm]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.invoiceId === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId],
  );

  const closeModal = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!creditNote) return;

    setErrorMessage(null);

    if (!selectedClientCode) {
      setErrorMessage("Debe seleccionar un cliente.");
      return;
    }

    if (!selectedInvoice) {
      setErrorMessage("Debe seleccionar una factura con saldo.");
      return;
    }

    const cashManagementId = Number.parseInt(selectedCashManagementId, 10);
    if (!Number.isFinite(cashManagementId) || cashManagementId <= 0) {
      setErrorMessage("Debe indicar una gestion de caja valida.");
      return;
    }

    let amountNio: number | null = null;
    if (amount.trim()) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage("El monto a aplicar debe ser mayor a cero.");
        return;
      }
      if (parsedAmount > selectedInvoice.remainingBalanceNio) {
        setErrorMessage("El monto a aplicar no puede superar el saldo de la factura.");
        return;
      }
      amountNio = parsedAmount;
    }

    const payload: CreditNoteApplyPayload = {
      targetInvoiceId: selectedInvoice.invoiceId,
      cashManagementId,
      amountNio,
      observation: observation.trim() ? observation.trim() : null,
    };

    setIsSubmitting(true);

    try {
      await applyCreditNote(creditNote.header.id, payload);
      onApplied();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo aplicar la nota de credito.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !creditNote) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="text-foreground">Aplicar nota de credito {creditNote.header.number}</h3>
            <p className="text-sm text-muted-foreground">
              Total de la nota: C${Number(creditNote.header.total).toFixed(2)}
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

        <div className="max-h-[calc(92vh-80px)] space-y-4 overflow-y-auto p-5">
          <ClientSelector
            clients={clientOptions}
            loading={clientsLoading}
            error={clientsError}
            selectedClientCode={selectedClientCode}
            onSelectClient={handleSelectClient}
          />

          <section className="rounded-3xl border border-border/60 bg-background/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-foreground">Facturas con saldo</h4>
              <label className="block min-w-0 space-y-2">
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

            <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-border/60">
              {invoicesLoading ? (
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-muted/70">
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">Sel.</th>
                      <th className="px-3 py-2">Documento</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableSkeleton columns={5} />
                  </tbody>
                </table>
              ) : invoicesError ? (
                <p className="px-4 py-6 text-sm text-rose-700">{invoicesError}</p>
              ) : filteredInvoices.length > 0 ? (
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-muted/70">
                    <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">Sel.</th>
                      <th className="px-3 py-2">Documento</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const isSelected = invoice.invoiceId === selectedInvoiceId;
                      return (
                        <tr
                          key={invoice.invoiceId}
                          className={`border-b border-border/40 ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}`}
                        >
                          <td className="px-3 py-2 align-top">
                            <input
                              type="radio"
                              name="target-invoice"
                              checked={isSelected}
                              onChange={() => setSelectedInvoiceId(invoice.invoiceId)}
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-foreground">{invoice.document}</td>
                          <td className="px-3 py-2 align-top text-muted-foreground">
                            {invoice.chargeStatus}
                          </td>
                          <td className="px-3 py-2 align-top text-right text-foreground">
                            {invoice.invoiceAmountNio.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 align-top text-right font-medium text-foreground">
                            {invoice.remainingBalanceNio.toFixed(2)}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">Gestion de caja</span>
              {cashManagementLoading ? (
                <ListSkeleton count={1} itemClassName="h-10 rounded-2xl" />
              ) : (
                <select
                  value={selectedCashManagementId}
                  onChange={(event) => setSelectedCashManagementId(event.target.value)}
                  className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Seleccione una gestion</option>
                  {cashManagementOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">
                Monto a aplicar {selectedInvoice ? `(saldo: ${selectedInvoice.remainingBalanceNio.toFixed(2)})` : ""}
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Vacio = aplicar el maximo posible"
                className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm text-muted-foreground">Observacion</span>
              <textarea
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                rows={2}
                className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Aplicando..." : "Aplicar nota de credito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
