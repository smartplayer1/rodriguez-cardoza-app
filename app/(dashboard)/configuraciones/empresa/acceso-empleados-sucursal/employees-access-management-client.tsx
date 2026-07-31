'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, ShieldCheck, ShieldOff } from 'lucide-react';

import { BranchEmployeeAccessRecord, BranchEmployeesAccess } from '@/app/type/branch-employee-access';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

type Props = {
  initialData: BranchEmployeesAccess[];
};

export default function EmployeesAccessManagementClient({ initialData }: Props) {
  const router = useRouter();
  const { can } = useUserStore();
  const canEdit = true; //can(PERMISSIONS.BRANCH_EMPLOYEE_ACCESS_EDIT);

  const [data, setData] = useState<BranchEmployeesAccess[]>(initialData);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(initialData[0]?.branchId ?? null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setData(initialData);
    setSelectedBranchId((previous) => {
      if (previous && initialData.some((group) => group.branchId === previous)) {
        return previous;
      }
      return initialData[0]?.branchId ?? null;
    });
  }, [initialData]);

  const userBranchIds = useMemo(() => {
    const map = new Map<number, Set<number>>();

    for (const group of data) {
      for (const employee of group.employees) {
        if (employee.userId == null) continue;

        if (!map.has(employee.userId)) {
          map.set(employee.userId, new Set());
        }

        if (employee.hasAccess) {
          map.get(employee.userId)!.add(group.branchId);
        }
      }
    }

    return map;
  }, [data]);

  const selectedGroup = data.find((group) => group.branchId === selectedBranchId) ?? null;

  const filteredEmployees = useMemo(() => {
    if (!selectedGroup) return [];

    const term = searchTerm.trim().toLowerCase();
    if (!term) return selectedGroup.employees;

    return selectedGroup.employees.filter((employee) => {
      return [employee.employeeCode, employee.employeeName, employee.userName, employee.roleName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [selectedGroup, searchTerm]);

  const toggleAccess = async (record: BranchEmployeeAccessRecord, branchId: number) => {
    console.log('Toggling access for record:', record, 'branchId:', branchId);
    if (record.userId == null) return;

    const userId = record.userId;
    const key = `${userId}-${branchId}`;
    const existingBranchIds = userBranchIds.get(userId) ?? new Set<number>();
    const newBranchIds = new Set(existingBranchIds);
    const turningOn = !record.hasAccess;

    if (turningOn) {
      newBranchIds.add(branchId);
    } else {
      newBranchIds.delete(branchId);
    }

    setSavingKey(key);

    try {
      const response = await fetch(`/api/identity/user/${userId}/branches`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchIds: Array.from(newBranchIds) }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          (body as { error?: string; message?: string; detail?: string } | null)?.error ||
          (body as { error?: string; message?: string; detail?: string } | null)?.message ||
          (body as { error?: string; message?: string; detail?: string } | null)?.detail ||
          'No se pudo actualizar el acceso del empleado';

        throw new Error(message);
      }

      setData((previous) =>
        previous.map((group) => ({
          ...group,
          employees: group.employees.map((employee) =>
            employee.userId === userId ? { ...employee, hasAccess: newBranchIds.has(group.branchId) } : employee,
          ),
        })),
      );
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo actualizar el acceso del empleado');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/60 bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-foreground">Acceso por sucursal</h3>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sucursal</span>
            <select
              value={selectedBranchId ?? ''}
              onChange={(event) => setSelectedBranchId(Number(event.target.value))}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {data.map((group) => (
                <option key={group.branchId} value={group.branchId}>
                  {group.branchCode} - {group.branchName}
                </option>
              ))}
            </select>
          </label>

          <label className="relative flex items-center text-sm">
            <Search size={16} className="pointer-events-none absolute left-3 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por código, nombre, usuario o rol"
              className="w-full min-w-[240px] rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empleado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal de origen</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acceso</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {selectedGroup && filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => {
                const key = `${employee.userId}-${selectedGroup.branchId}`;
                const isSaving = savingKey === key;
                const hasUser = employee.userId != null;

                return (
                  <tr key={employee.employeeId} className="transition-colors hover:bg-muted/15">
                    <td className="px-4 py-4 text-foreground">{employee.employeeCode}</td>
                    <td className="px-4 py-4 text-foreground">{employee.employeeName}</td>
                    <td className="px-4 py-4 text-muted-foreground">{employee.employeeBranchName}</td>
                    <td className="px-4 py-4 text-muted-foreground">{employee.userName || 'Sin usuario'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{employee.roleName || 'N/D'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        {canEdit ? (
                          isSaving ? (
                            <Loader2 size={16} className="animate-spin text-muted-foreground" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={employee.hasAccess}
                              onChange={() => toggleAccess(employee, selectedGroup.branchId)}
                              className="size-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                              aria-label={`Acceso de ${employee.employeeName} a ${selectedGroup.branchName}`}
                            />
                          )
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs ${
                              employee.hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                            title={!hasUser ? 'El empleado no tiene una cuenta de usuario' : undefined}
                          >
                            {employee.hasAccess ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                            {employee.hasAccess ? 'Con acceso' : 'Sin acceso'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {searchTerm.trim()
                    ? 'No hay empleados que coincidan con la búsqueda.'
                    : 'No hay empleados para esta sucursal.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
