'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Edit, Loader2, Plus, Save, Trash2, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { JobRoleRecord } from '@/app/type/job-role';

type Props = {
  initialRecords: JobRoleRecord[];
};

type FormState = {
  id?: number;
  name: string;
  description: string;
};

const initialForm: FormState = {
  name: '',
  description: '',
};

export default function CargosManagementClient({ initialRecords }: Props) {
  const router = useRouter();

  const [records, setRecords] = useState<JobRoleRecord[]>(initialRecords);
  const [openForm, setOpenForm] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const openCreate = () => {
    setFormState(initialForm);
    setOpenForm(true);
  };

  const openEdit = (record: JobRoleRecord) => {
    setFormState({
      id: record.id,
      name: record.name,
      description: record.description || '',
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setOpenForm(false);
    setFormState(initialForm);
  };

  const saveJobRole = async () => {
    if (!formState.name.trim()) {
      alert('El nombre del cargo es obligatorio.');
      return;
    }

    const payload = {
      id: formState.id,
      name: formState.name.trim(),
      description: formState.description.trim(),
    };

    const method = formState.id ? 'PUT' : 'POST';

    setIsSaving(true);

    try {
      const response = await fetch('/api/company/job-role', {
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
          'No se pudo guardar el cargo';

        throw new Error(message);
      }

      setOpenForm(false);
      setFormState(initialForm);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo guardar el cargo');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteJobRole = async (id: number) => {
    if (!confirm('¿Desea eliminar este cargo?')) {
      return;
    }

    setIsDeleting(id);

    try {
      const response = await fetch('/api/company/job-role', {
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
          'No se pudo eliminar el cargo';

        throw new Error(message);
      }

      setRecords((previous) => previous.filter((record) => record.id !== id));
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el cargo');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/60 bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <h3 className="text-foreground">Gestión de cargos</h3>
        <MaterialButton variant="contained" color="primary" startIcon={<Plus size={16} />} onClick={openCreate}>
          Nuevo cargo
        </MaterialButton>
      </div>

      {openForm ? (
        <div className="border-b border-border/60 bg-background/30 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required>
              <input
                value={formState.name}
                onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Ej: Gerente General"
              />
            </Field>

            <Field label="Descripción">
              <input
                value={formState.description}
                onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Descripción del cargo"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              onClick={saveJobRole}
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
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-muted/15">
                  <td className="px-4 py-4 text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Briefcase size={16} className="text-primary" />
                      {record.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{record.description || 'Sin descripción'}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(record)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteJobRole(record.id)}
                        disabled={isDeleting === record.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                      >
                        {isDeleting === record.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  No hay cargos registrados.
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
  children: ReactNode;
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
