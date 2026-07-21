'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';

import { getBranches } from '@/app/services/company/branch';
import { createCashRegister } from '@/app/services/cash-management';
import { CashRegisterCreatePayload } from '@/app/type/cash-management';
import type { BranchResponse, RecordsBranch } from '@/app/type/branch';
import { ListSkeleton } from '@/components/ui/loading-skeleton';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

export default function NuevoCajaRegistradoraModal() {
  const router = useRouter();
  const { can } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<RecordsBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    branchId: '',
  });

  useEffect(() => {
    if (!isOpen || branches.length > 0 || loadingBranches) {
      return;
    }

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
  }, [isOpen, branches.length, loadingBranches]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => String(branch.id) === formData.branchId),
    [branches, formData.branchId],
  );

  const resetForm = () => {
    setFormData({ name: '', description: '', code: '', branchId: '' });
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setErrorMessage(null);
    setBranchError(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('El nombre es obligatorio.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('La descripción es obligatoria.');
      return;
    }

    if (!formData.code.trim()) {
      setErrorMessage('El código es obligatorio.');
      return;
    }

    const parsedBranchId = Number.parseInt(formData.branchId, 10);

    if (!Number.isFinite(parsedBranchId) || parsedBranchId <= 0) {
      setErrorMessage('Debe seleccionar una sucursal válida.');
      return;
    }

    const payload: CashRegisterCreatePayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      code: formData.code.trim(),
      branchId: parsedBranchId,
    };

    setIsSubmitting(true);

    try {
      await createCashRegister(payload);
      setSuccessMessage('Caja registradora creada correctamente.');
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear la caja registradora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!can(PERMISSIONS.CASH_REGISTER_CREATE)) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Nueva caja registradora
        </button>
      </div>

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-foreground">Nueva caja registradora</h3>
                <p className="text-sm text-muted-foreground">
                  Registra una caja asociada a una sucursal.
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

            <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-5">
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

                {selectedBranch ? (
                  <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    {selectedBranch.name} - {selectedBranch.city.state.name}
                  </div>
                ) : null}
              </div>

              {branchError ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{branchError}</p>
              ) : null}

              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  disabled={isSubmitting}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar caja registradora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}