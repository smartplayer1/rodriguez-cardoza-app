'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

import { getBranches } from '@/app/services/company/branch';
import { updateCashRegister } from '@/app/services/cash-management';
import type { BranchResponse, RecordsBranch } from '@/app/type/branch';
import type { CashRegisterRecord, CashRegisterUpdatePayload } from '@/app/type/cash-management';
import { ListSkeleton } from '@/components/ui/loading-skeleton';

type EditCashRegisterFormProps = {
  cashRegister: CashRegisterRecord;
};

export default function EditCashRegisterForm({ cashRegister }: EditCashRegisterFormProps) {
  const router = useRouter();
  const [branches, setBranches] = useState<RecordsBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: cashRegister.name,
    description: cashRegister.description,
    code: cashRegister.code,
    branchId: String(cashRegister.branchId),
  });

  useEffect(() => {
    const loadBranches = async () => {
      setLoadingBranches(true);
      setBranchError(null);

      try {
        const response = (await getBranches()) as BranchResponse;
        setBranches(response.records ?? []);
      } catch (error) {
        setBranchError(error instanceof Error ? error.message : 'No se pudieron cargar las sucursales');
      } finally {
        setLoadingBranches(false);
      }
    };

    void loadBranches();
  }, []);

  const selectedBranch = useMemo(
    () => branches.find((branch) => String(branch.id) === formData.branchId),
    [branches, formData.branchId],
  );

  const buildUpdatePayload = (): CashRegisterUpdatePayload => {
    const trimmedName = formData.name.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedCode = formData.code.trim();
    const parsedBranchId = Number.parseInt(formData.branchId, 10);

    return {
      name: trimmedName === cashRegister.name.trim() ? null : trimmedName,
      description: trimmedDescription === cashRegister.description.trim() ? null : trimmedDescription,
      code: trimmedCode === cashRegister.code.trim() ? null : trimmedCode,
      branchId: Number.isFinite(parsedBranchId) && parsedBranchId === cashRegister.branchId ? null : parsedBranchId,
    };
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const payload = buildUpdatePayload();

    if (payload.name === null && payload.description === null && payload.code === null && payload.branchId === null) {
      setErrorMessage('No hay cambios para guardar.');
      return;
    }

    if (payload.name !== null && !payload.name.trim()) {
      setErrorMessage('El nombre no puede quedar vacío.');
      return;
    }

    if (payload.description !== null && !payload.description.trim()) {
      setErrorMessage('La descripción no puede quedar vacía.');
      return;
    }

    if (payload.code !== null && !payload.code.trim()) {
      setErrorMessage('El código no puede quedar vacío.');
      return;
    }

    if (payload.branchId !== null && (!Number.isFinite(payload.branchId) || payload.branchId <= 0)) {
      setErrorMessage('Debe seleccionar una sucursal válida.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCashRegister(cashRegister.id, payload);
      router.push('/gestion-de-caja/cajas-registradoras');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar la caja registradora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/gestion-de-caja/cajas-registradoras"
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>

        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <h2 className="text-foreground">Editar caja registradora</h2>
          <p className="mt-2 text-muted-foreground">
            Los campos que no cambies se enviarán como `null` al backend.
          </p>
        </header>

        <section className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-muted-foreground">Descripción</span>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">Código</span>
              <input
                type="text"
                value={formData.code}
                onChange={(event) => setFormData((previous) => ({ ...previous, code: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">Sucursal</span>
              {loadingBranches ? (
                <ListSkeleton count={1} itemClassName="h-10 rounded-2xl" />
              ) : (
                <select
                  value={formData.branchId}
                  onChange={(event) => setFormData((previous) => ({ ...previous, branchId: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Seleccione una sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              )}
            </label>

            <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              {selectedBranch ? `${selectedBranch.name} - ${selectedBranch.city.state.name}` : `Sucursal actual: ${cashRegister.branchName}`}
            </div>
          </div>

          {branchError ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {branchError}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <Link
              href="/gestion-de-caja/cajas-registradoras"
              className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="size-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}