"use client";

import { FormEvent, useState } from "react";
import { Lock, X } from "lucide-react";

import { getActiveCashManagementByCashRegister } from "@/app/services/cash-management";
import { CashManagementRecord } from "@/app/type/cash-management";
import CerrarCajaModal from "./cerrar-caja-modal";
import { useUserStore } from "@/app/store/useUserStore";
import { PERMISSIONS } from "@/app/domain/auth/permissions";

type SelectOption = {
  id: string;
  label: string;
};

export default function CerrarCajaPorRegistradora({
  cashRegisterOptions,
}: {
  cashRegisterOptions: SelectOption[];
}) {
  const { can } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRecord, setActiveRecord] = useState<CashManagementRecord | null>(
    null,
  );

  const resetState = () => {
    setCashRegisterId("");
    setIsSearching(false);
    setErrorMessage(null);
    setActiveRecord(null);
  };

  const openModal = () => {
    resetState();
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetState();
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);

    const parsedCashRegisterId = Number.parseInt(cashRegisterId, 10);

    if (!Number.isFinite(parsedCashRegisterId) || parsedCashRegisterId <= 0) {
      setErrorMessage("Debes seleccionar una caja.");
      return;
    }

    setIsSearching(true);

    try {
      const record =
        await getActiveCashManagementByCashRegister(parsedCashRegisterId);
      setActiveRecord(record);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No hay una gestion de caja abierta para esta caja registradora.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  if (!can(PERMISSIONS.CASH_MANAGEMENT_CLOSE)) {
    return null;
  }

  if (activeRecord) {
    return <CerrarCajaModal record={activeRecord} onClose={closeModal} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
      >
        <Lock className="size-4" />
        Cerrar caja
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Cierre de caja</h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona la caja que deseas cerrar.
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

            <form onSubmit={handleSearch} className="space-y-4 p-5">
              <label className="block space-y-2">
                <span className="text-sm text-muted-foreground">Caja</span>
                <select
                  value={cashRegisterId}
                  onChange={(event) => setCashRegisterId(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Selecciona una caja</option>
                  {cashRegisterOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {errorMessage ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  disabled={isSearching}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSearching}
                >
                  {isSearching ? "Buscando..." : "Buscar caja abierta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
