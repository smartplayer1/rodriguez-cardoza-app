'use client';

import { useEffect, useMemo, useState, type JSX } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Building2, Edit, Loader2, MapPinOff, Plus, Save, Trash2, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Branch, RecordsBranch, UpdateBranchPayload } from '@/app/type/branch';
import { LocalityDepartment } from '@/app/type/locality';
import { createBranch, deleteBranch, updateBranch } from '@/app/services/company/branch';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

type Props = {
  initialRecords: RecordsBranch[];
  departments: LocalityDepartment[];
  fetchError: string | null;
  hasAnyFilter: boolean;
};

type FormState = {
  id?: number;
  code: string;
  name: string;
  address: string;
  departmentId: string;
  cityId: string;
};

const initialForm: FormState = {
  code: '',
  name: '',
  address: '',
  departmentId: '',
  cityId: '',
};

export default function BranchManagementClient({ initialRecords, departments, fetchError, hasAnyFilter }: Props) {
  const router = useRouter();
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [records, setRecords] = useState<RecordsBranch[]>(initialRecords);
  const [openForm, setOpenForm] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RecordsBranch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const departmentByCityId = useMemo(() => {
    const map = new Map<number, LocalityDepartment>();
    for (const department of departments) {
      for (const city of department.cities) {
        map.set(city.id, department);
      }
    }
    return map;
  }, [departments]);

  const citiesForSelectedDepartment = useMemo(() => {
    const department = departments.find((d) => String(d.id) === formState.departmentId);
    return department?.cities ?? [];
  }, [departments, formState.departmentId]);

  const openCreate = () => {
    const firstDepartment = departments[0];
    setFormState({
      ...initialForm,
      departmentId: firstDepartment ? String(firstDepartment.id) : '',
      cityId: firstDepartment?.cities[0] ? String(firstDepartment.cities[0].id) : '',
    });
    setOpenForm(true);
  };

  const openEdit = (record: RecordsBranch) => {
    const department = record.city?.id ? departmentByCityId.get(record.city.id) : undefined;

    setFormState({
      id: record.id,
      code: record.code,
      name: record.name,
      address: record.address,
      departmentId: department ? String(department.id) : '',
      cityId: record.city?.id ? String(record.city.id) : '',
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setOpenForm(false);
    setFormState(initialForm);
  };

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments.find((d) => String(d.id) === departmentId);
    setFormState((previous) => ({
      ...previous,
      departmentId,
      cityId: department?.cities[0] ? String(department.cities[0].id) : '',
    }));
  };

  const saveBranch = async () => {
    if (!formState.code.trim() || !formState.name.trim() || !formState.address.trim() || !formState.cityId) {
      alert('Complete todos los campos requeridos.');
      return;
    }

    const cityId = Number.parseInt(formState.cityId, 10);

    if (!Number.isFinite(cityId) || cityId <= 0) {
      alert('Seleccione una ciudad valida.');
      return;
    }

    setIsSaving(true);

    try {
      if (formState.id) {
        const payload: UpdateBranchPayload = {
          code: formState.code.trim(),
          name: formState.name.trim(),
          address: formState.address.trim(),
          cityId,
        };
        await updateBranch(formState.id, payload);
      } else {
        const payload: Branch = {
          code: formState.code.trim(),
          name: formState.name.trim(),
          address: formState.address.trim(),
          cityId,
        };
        await createBranch(payload);
      }

      setOpenForm(false);
      setFormState(initialForm);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo guardar la sucursal');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);

    try {
      await deleteBranch(pendingDelete.id);
      setRecords((previous) => previous.filter((record) => record.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la sucursal');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = mounted && can(PERMISSIONS.BRANCH_EDIT);
  const canDelete = mounted && can(PERMISSIONS.BRANCH_DELETE);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sucursales</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Administra las sucursales de la empresa.</p>
        </div>
        {canEdit && (
          <MaterialButton variant="contained" color="primary" startIcon={<Plus size={16} />} onClick={openCreate}>
            Nueva sucursal
          </MaterialButton>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertTriangle size={32} className="text-destructive" />
            <div>
              <p className="text-foreground">No pudimos cargar las sucursales.</p>
              <p className="text-sm text-muted-foreground">Intenta nuevamente.</p>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MapPinOff size={32} className="text-muted-foreground" />
            <div>
              <p className="text-foreground">Sin sucursales encontradas</p>
              <p className="text-sm text-muted-foreground">
                {hasAnyFilter ? 'Prueba modificando los filtros de búsqueda.' : 'Aún no hay sucursales registradas.'}
              </p>
            </div>
            {hasAnyFilter ? (
              <Link
                href="/configuraciones/empresa/sucursales"
                className="rounded-xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                Limpiar filtros
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">Dirección</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ciudad</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">Departamento</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {records.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-muted/15">
                    <td className="px-4 py-3 font-medium text-foreground">{record.code}</td>
                    <td className="px-4 py-3 text-foreground">{record.name}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{record.address}</td>
                    <td className="px-4 py-3 text-foreground">{record.city?.name || 'N/D'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{record.city?.state?.name || 'N/D'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEdit(record)}
                            title="Editar sucursal"
                            aria-label="Editar sucursal"
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Edit size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(record)}
                            title="Eliminar sucursal"
                            aria-label="Eliminar sucursal"
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openForm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                <h3 className="text-foreground">{formState.id ? 'Editar sucursal' : 'Nueva sucursal'}</h3>
              </div>
              <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Código" required>
                <input
                  value={formState.code}
                  onChange={(event) => setFormState((previous) => ({ ...previous, code: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="SUC001"
                />
              </Field>

              <Field label="Nombre" required>
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="Sucursal central"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Dirección" required>
                  <input
                    value={formState.address}
                    onChange={(event) => setFormState((previous) => ({ ...previous, address: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="Dirección completa"
                  />
                </Field>
              </div>

              <Field label="Departamento" required>
                <select
                  value={formState.departmentId}
                  onChange={(event) => handleDepartmentChange(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Seleccione departamento</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ciudad" required>
                <select
                  value={formState.cityId}
                  onChange={(event) => setFormState((previous) => ({ ...previous, cityId: event.target.value }))}
                  disabled={!formState.departmentId}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">Seleccione ciudad</option>
                  {citiesForSelectedDepartment.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <MaterialButton variant="outlined" color="secondary" startIcon={<X size={16} />} onClick={closeForm} disabled={isSaving}>
                Cancelar
              </MaterialButton>
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                onClick={saveBranch}
                disabled={isSaving}
              >
                {formState.id ? 'Actualizar' : 'Guardar'}
              </MaterialButton>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar sucursal?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  Se eliminará <span className="font-medium text-foreground">{pendingDelete.name}</span> (
                  {pendingDelete.code}). Esta acción debe confirmarse y no se puede deshacer.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <MaterialButton variant="outlined" color="secondary" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              Cancelar
            </MaterialButton>
            <MaterialButton
              variant="contained"
              color="error"
              startIcon={isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              Eliminar sucursal
            </MaterialButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: JSX.Element;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-muted-foreground">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}
