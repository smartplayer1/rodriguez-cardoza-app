"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { reopenCashManagement } from "@/app/services/cash-management";
import {
  CashManagementReopenPayload,
  CashManagementRecord,
} from "@/app/type/cash-management";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Pendiente";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
};

export default function ReabrirCajaModal({
  record,
  onClose,
}: {
  record: CashManagementRecord;
  onClose: () => void;
}) {
  const router = useRouter();
  const [observation, setObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);

    const payload: CashManagementReopenPayload = {
      observation: observation.trim() ? observation.trim() : null,
    };

    setIsSubmitting(true);

    try {
      await reopenCashManagement(record.id, payload);
      router.refresh();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo abrir la gestion de caja.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="text-foreground">Abrir caja</h3>
            <p className="text-sm text-muted-foreground">
              {record.cashRegisterName} · Responsable:{" "}
              {record.responsibleEmployeeName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Cerrada desde</span>
                <span className="text-foreground">
                  {formatDateTime(record.closedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Cerrada por</span>
                <span className="text-foreground">
                  {record.closedByUserName ?? "N/D"}
                </span>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">Observacion</span>
              <input
                type="text"
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                placeholder="Opcional"
              />
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Abriendo..." : "Abrir caja"}
              </button>
            </div>

            {errorMessage ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
