import { headers } from 'next/headers';
import { BriefcaseBusiness, Building2, Filter, Hash, Phone, Search, Users } from 'lucide-react';

import { getEmployees } from '@/app/services/employee';
import ImportarEmpleadosModal from './importar-empleados-modal';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';
import { EmployeeListResponse, EmployeeRecord } from '@/app/type/employee';
import { getRoles } from '@/app/services/roles';
import { getBranches } from '@/app/services/company/branch';

type SearchParams = {
  code?: string | string[];
  name?: string | string[];
  middleName?: string | string[];
  LastName?: string | string[];
  SecondLastName?: string | string[];
  phoneNumber?: string | string[];
  jobRoleId?: string | string[];
  branchId?: string | string[];
  Page?: string | string[];
  PerPage?: string | string[];
};

type OptionItem = {
  id: string;
  name: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? '';
};

const toPositiveInt = (value: string | string[] | undefined, fallback: number) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPageHref = (pageNumber: number, perPage: number, searchParams: URLSearchParams) => {
  const params = new URLSearchParams(searchParams);

  if (pageNumber > 1) {
    params.set('Page', String(pageNumber));
  } else {
    params.delete('Page');
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set('PerPage', String(perPage));
  } else {
    params.delete('PerPage');
  }

  const query = params.toString();
  return query ? `?${query}` : '?';
};

const normalizeRoleOptions = (payload: unknown): OptionItem[] => {
  const source = (payload as { records?: unknown[] } | null)?.records;
  const records = Array.isArray(source) ? source : Array.isArray(payload) ? payload : [];

  return records
    .map((record) => {
      const roleRecord = record as { id?: string | number; name?: string };
      if (roleRecord?.id == null || !roleRecord?.name) {
        return null;
      }

      return {
        id: String(roleRecord.id),
        name: roleRecord.name,
      };
    })
    .filter((item): item is OptionItem => Boolean(item));
};

const normalizeBranchOptions = (payload: unknown): OptionItem[] => {
  const records = (payload as BranchResponse | null)?.records;

  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((branch) => ({
    id: String((branch as RecordsBranch).id),
    name: (branch as RecordsBranch).name,
  }));
};

async function fetchSelectOptions(context?: { baseUrl?: string; cookieHeader?: string }) {
  const [rolesResult, branchesResult] = await Promise.allSettled([
    getRoles(context),
    getBranches(context)
  ]);

  let roles: OptionItem[] = [];
  let branches: OptionItem[] = [];

  if (rolesResult.status === 'fulfilled' && rolesResult.value.ok) {
    const rolesBody = await rolesResult.value.json().catch(() => null);
    roles = normalizeRoleOptions(rolesBody);
  }

  if (branchesResult.status === 'fulfilled' && branchesResult.value.ok) {
    const branchesBody = await branchesResult.value.json().catch(() => null);
    branches = normalizeBranchOptions(branchesBody);
  }

  return { roles, branches };
}

export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = toPositiveInt(resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.PerPage, DEFAULT_PER_PAGE);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  const filterParams = new URLSearchParams();
  const filterFields = [
    ['code', resolvedSearchParams.code],
    ['name', resolvedSearchParams.name],
    ['middleName', resolvedSearchParams.middleName],
    ['LastName', resolvedSearchParams.LastName],
    ['SecondLastName', resolvedSearchParams.SecondLastName],
    ['phoneNumber', resolvedSearchParams.phoneNumber],
    ['jobRoleId', resolvedSearchParams.jobRoleId],
    ['branchId', resolvedSearchParams.branchId],
  ] as const;

  for (const [key, value] of filterFields) {
    const normalized = toStringValue(value);
    if (normalized) {
      filterParams.set(key, normalized);
    }
  }

  let response: EmployeeListResponse;
  let fetchError: string | null = null;

  const { roles, branches } = await fetchSelectOptions({
    baseUrl,
    cookieHeader,
  });

console.log('branches', branches);
  try {
    response = await getEmployees({
      code: toStringValue(resolvedSearchParams.code),
      name: toStringValue(resolvedSearchParams.name),
      middleName: toStringValue(resolvedSearchParams.middleName),
      LastName: toStringValue(resolvedSearchParams.LastName),
      SecondLastName: toStringValue(resolvedSearchParams.SecondLastName),
      phoneNumber: toStringValue(resolvedSearchParams.phoneNumber),
      jobRoleId: toStringValue(resolvedSearchParams.jobRoleId),
      branchId: toStringValue(resolvedSearchParams.branchId),
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar los empleados';
    response = {
      records: [],
      paging: {
        perPage,
        currentPage: page,
        totalRecords: 0,
        totalPages: 1,
      },
    };
  }

  const activeFiltersCount = Array.from(filterParams.values()).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Users size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Empleados</h2>
                  <p className="text-muted-foreground">Listado SSR de empleados con filtros por nombre, rol y sucursal.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<Hash className="size-4" />} />
              <StatCard label="Filtros" value={activeFiltersCount} icon={<Filter className="size-4" />} />
              <StatCard label="Página" value={response.paging.currentPage} icon={<Search className="size-4" />} />
              <StatCard label="Por página" value={response.paging.perPage} icon={<Users className="size-4" />} />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-end">
          <ImportarEmpleadosModal roleOptions={roles} branchOptions={branches} />
        </div>

        <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm" open>
          <summary className="cursor-pointer list-none text-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Filtros de búsqueda</span>
              <span className="text-sm text-muted-foreground">Contraer / expandir</span>
            </div>
          </summary>

          <div className="mt-5">
            <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FilterInput label="Código" name="code" defaultValue={toStringValue(resolvedSearchParams.code)} placeholder="Código de empleado" />
              <FilterInput label="Primer nombre" name="name" defaultValue={toStringValue(resolvedSearchParams.name)} placeholder="Primer nombre" />
              <FilterInput label="Segundo nombre" name="middleName" defaultValue={toStringValue(resolvedSearchParams.middleName)} placeholder="Segundo nombre" />
              <FilterInput label="Primer apellido" name="LastName" defaultValue={toStringValue(resolvedSearchParams.LastName)} placeholder="Primer apellido" />
              <FilterInput label="Segundo apellido" name="SecondLastName" defaultValue={toStringValue(resolvedSearchParams.SecondLastName)} placeholder="Segundo apellido" />
              <FilterInput label="Teléfono" name="phoneNumber" defaultValue={toStringValue(resolvedSearchParams.phoneNumber)} placeholder="####-####" />

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Rol de trabajador</span>
                <select
                  name="jobRoleId"
                  defaultValue={toStringValue(resolvedSearchParams.jobRoleId)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todos los roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-muted-foreground">Sucursal</span>
                <select
                  name="branchId"
                  defaultValue={toStringValue(resolvedSearchParams.branchId)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-end justify-between gap-3 pt-2">
                <div className="flex gap-3">
                  <button type="submit" className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90">
                    Buscar
                  </button>
                  <a href="/empleados" className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                    Limpiar
                  </a>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Por página</span>
                  <select name="PerPage" defaultValue={String(perPage)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary">
                    {[10, 20, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </form>
          </div>
        </details>

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la informacion desde el endpoint: {fetchError}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre completo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cédula</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sucursal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40">
                {response.records.length > 0 ? (
                  response.records.map((employee) => (
                    <tr key={employee.id} className="align-top transition-colors hover:bg-muted/15">
                      <td className="px-4 py-4 text-foreground">{employee.code}</td>
                      <td className="px-4 py-4 text-foreground">{buildEmployeeFullName(employee)}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-4" />
                          {employee.phoneNumber || 'N/D'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{employee.idNumber}</td>
                      <td className="px-4 py-4 text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <BriefcaseBusiness className="size-4" />
                          {employee.jobRole?.name || 'Sin rol'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-4" />
                          {employee.branch?.name || 'Sin sucursal'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No hay empleados para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {response.paging.totalPages > 1 ? (
          <nav aria-label="Paginación empleados" className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {response.paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(response.paging.currentPage - 1, response.paging.perPage, filterParams)}
                    className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    Anterior
                  </a>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center rounded-md border border-border px-3 py-2 text-sm opacity-50">
                    Anterior
                  </span>
                )}
              </li>
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Página {response.paging.currentPage} de {response.paging.totalPages}
              </li>
              <li>
                {response.paging.currentPage < response.paging.totalPages ? (
                  <a
                    href={buildPageHref(response.paging.currentPage + 1, response.paging.perPage, filterParams)}
                    className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    Siguiente
                  </a>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center rounded-md border border-border px-3 py-2 text-sm opacity-50">
                    Siguiente
                  </span>
                )}
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function buildEmployeeFullName(employee: EmployeeRecord) {
  return [employee.firstname, employee.middleName, employee.lastName, employee.secondLastName]
    .filter(Boolean)
    .join(' ');
}

function FilterInput({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}