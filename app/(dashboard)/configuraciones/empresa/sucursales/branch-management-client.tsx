'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Loader2, Plus, Save, Trash2, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { RecordsBranch } from '@/app/type/branch';
import { Branch } from '@/app/type/branch';
import type { CityOption } from './page';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

type Props = {
  initialRecords: RecordsBranch[];
  cityOptions: CityOption[];
};

type FormState = {
  id?: number;
  code: string;
  name: string;
  address: string;
  cityId: string;
};

const initialForm: FormState = {
  code: '',
  name: '',
  address: '',
  cityId: '',
};

export default function BranchManagementClient({ initialRecords, cityOptions }: Props) {
  const router = useRouter();
  const { can } = useUserStore();

  const [records, setRecords] = useState<RecordsBranch[]>(initialRecords);
  const [openForm, setOpenForm] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const cityMap = useMemo(() => {
    const map = new Map<number, CityOption>();

    for (const city of cityOptions) {
      map.set(city.id, city);
    }

    return map;
  }, [cityOptions]);

  const openCreate = () => {
    setFormState({
      ...initialForm,
      cityId: cityOptions[0] ? String(cityOptions[0].id) : '',
    });
    setOpenForm(true);
  };

  const openEdit = (record: RecordsBranch) => {
    setFormState({
      id: record.id,
      code: record.code,
      name: record.name,
      address: record.address,
      cityId: record.city?.id ? String(record.city.id) : '',
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setOpenForm(false);
    setFormState(initialForm);
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

    const payload: Branch = {
      id: formState.id,
      code: formState.code.trim(),
      name: formState.name.trim(),
      address: formState.address.trim(),
      cityId,
    };

    const method = formState.id ? 'PUT' : 'POST';

    setIsSaving(true);

    try {
      const response = await fetch('/api/company/branch', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          (body as { error?: string; message?: string; detail?: string } | null)?.error ||
          (body as { error?: string; message?: string; detail?: string } | null)?.message ||
          (body as { error?: string; message?: string; detail?: string } | null)?.detail ||
          'No se pudo guardar la sucursal';

        throw new Error(message);
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

  const deleteBranch = async (id: number) => {
    if (!confirm('¿Desea eliminar esta sucursal?')) {
      return;
    }

    setIsDeleting(id);

    try {
      const response = await fetch('/api/company/branch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          (body as { error?: string; message?: string; detail?: string } | null)?.error ||
          (body as { error?: string; message?: string; detail?: string } | null)?.message ||
          (body as { error?: string; message?: string; detail?: string } | null)?.detail ||
          'No se pudo eliminar la sucursal';

        throw new Error(message);
      }

      setRecords((previous) => previous.filter((record) => record.id !== id));
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la sucursal');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/60 bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <h3 className="text-foreground">Gestión de sucursales</h3>
        {can(PERMISSIONS.BRANCH_CREATE) && (
          <MaterialButton variant="contained" color="primary" startIcon={<Plus size={16} />} onClick={openCreate}>
            Nueva sucursal
          </MaterialButton>
        )}
      </div>

      {openForm ? (
        <div className="border-b border-border/60 bg-background/30 p-5">
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

            <Field label="Dirección" required>
              <input
                value={formState.address}
                onChange={(event) => setFormState((previous) => ({ ...previous, address: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Dirección completa"
              />
            </Field>

            <Field label="Ciudad" required>
              <select
                value={formState.cityId}
                onChange={(event) => setFormState((previous) => ({ ...previous, cityId: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Seleccione ciudad</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.stateName} - {city.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              onClick={saveBranch}
              disabled={isSaving}
            >
              {formState.id ? 'Actualizar' : 'Guardar'}
            </MaterialButton>
            <MaterialButton variant="outlined" color="secondary" startIcon={<X size={16} />} onClick={closeForm} disabled={isSaving}>
              Cancelar
            </MaterialButton>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dirección</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ciudad</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Departamento</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-muted/15">
                  <td className="px-4 py-4 text-foreground">{record.code}</td>
                  <td className="px-4 py-4 text-foreground">{record.name}</td>
                  <td className="px-4 py-4 text-muted-foreground">{record.address}</td>
                  <td className="px-4 py-4 text-foreground">{record.city?.name || 'N/D'}</td>
                  <td className="px-4 py-4 text-muted-foreground">{record.city?.state?.name || cityMap.get(record.city?.id)?.stateName || 'N/D'}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {can(PERMISSIONS.BRANCH_EDIT) && (
                        <button
                          type="button"
                          onClick={() => openEdit(record)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          <Edit size={14} /> Editar
                        </button>
                      )}
                      {can(PERMISSIONS.BRANCH_DELETE) && (
                        <button
                          type="button"
                          onClick={() => deleteBranch(record.id)}
                          disabled={isDeleting === record.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                        >
                          {isDeleting === record.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No hay sucursales registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
