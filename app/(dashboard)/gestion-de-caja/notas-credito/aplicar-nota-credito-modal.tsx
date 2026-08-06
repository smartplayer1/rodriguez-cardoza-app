"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { applyCreditNote } from "@/app/services/billing/credit-note";
import { getCreditInvoices, getInvoices } from "@/app/services/invoice";
import { getCashManagementRecords } from "@/app/services/cash-management";
import type { CreditNoteApplyPayload, CreditNoteRecord } from "@/app/type/credit-note";
import type { CreditInvoiceRecord } from "@/app/type/invoice";
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

  const [selectedClientCode, setSelectedClientCode] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

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
    setSelectedClientName("");
    setClientError(null);
    setInvoices([]);
    setInvoicesError(null);
    setSearchTerm("");
    setSelectedInvoiceId(null);
    setSelectedCashManagementId("");
    setAmount("");
    setObservation("");
    setErrorMessage(null);
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
    void loadOpenCashManagementRecords();
  }, [isOpen, creditNote?.header.id, resetForm, loadOpenCashManagementRecords]);

  // La nota de credito es saldo a favor de UN cliente especifico (el de la
  // factura de origen). El cliente no es seleccionable: se resuelve aqui y
  // se bloquea, para que solo se puedan ver/aplicar facturas de ese cliente.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const invoiceDocument = creditNote?.header.invoiceDocument;

    if (!invoiceDocument) {
      setClientError(
        "No se pudo determinar el cliente de esta nota de credito: no tiene una factura de origen asociada.",
      );
      return;
    }

    let cancelled = false;
    setClientLoading(true);
    setClientError(null);

    getInvoices({ document: invoiceDocument, perPage: 1 })
      .then((response) => {
        if (cancelled) return;
        const header = response.records?.[0]?.header;

        if (!header?.clientCode) {
          setClientError("No se pudo determinar el cliente de esta nota de credito.");
          return;
        }

        setSelectedClientCode(header.clientCode);
        setSelectedClientName(header.clientName || "");
      })
      .catch(() => {
        if (!cancelled) {
          setClientError("No se pudo determinar el cliente de esta nota de credito.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setClientLoading(false);
        }
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
      setErrorMessage("No se pudo determinar el cliente de esta nota de credito.");
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
      if (parsedAmount > creditNote.header.total) {
        setErrorMessage("El monto a aplicar no puede superar el saldo de la nota de credito.");
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
          <section className="space-y-2">
            <h4 className="text-foreground">Cliente</h4>
            {clientLoading ? (
              <ListSkeleton count={1} itemClassName="h-11 rounded-2xl" />
            ) : clientError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {clientError}
              </p>
            ) : (
              <div className="rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{selectedClientCode}</span>
                {selectedClientName ? (
                  <span className="ml-2 text-muted-foreground">{selectedClientName}</span>
                ) : null}
              </div>
            )}
          </section>

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
                Monto a aplicar
                {selectedInvoice
                  ? ` (saldo factura: ${selectedInvoice.remainingBalanceNio.toFixed(2)}, saldo nota: ${creditNote.header.total.toFixed(2)})`
                  : ""}
              </span>
              <input
                type="number"
                min={0}
                max={selectedInvoice ? Math.min(selectedInvoice.remainingBalanceNio, creditNote.header.total) : undefined}
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
              disabled={isSubmitting || clientLoading || !!clientError || !selectedClientCode}
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
