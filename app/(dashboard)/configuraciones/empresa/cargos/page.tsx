import { headers } from 'next/headers';
import { Briefcase, Hash } from 'lucide-react';
import { type ReactNode } from 'react';

import CargosManagementClient from './cargos-management-client';
import { getJobRoles } from '@/app/services/company/job-role';
import { JobRoleResponse } from '@/app/type/job-role';

export default async function CargosPage() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  let response: JobRoleResponse = {
    records: [],
    paging: {
      perPage: 10,
      currentPage: 1,
      totalRecords: 0,
      totalPages: 1,
    },
  };
  let fetchError: string | null = null;

  try {
    response = await getJobRoles({ baseUrl, cookieHeader });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar los cargos';
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Briefcase size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Cargos</h2>
                  <p className="text-muted-foreground">Listado SSR con mantenimiento de cargos.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<Hash className="size-4" />} />
              <StatCard label="Página" value={response.paging.currentPage} icon={<Briefcase className="size-4" />} />
            </div>
          </div>
        </header>

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la informacion de cargos: {fetchError}
          </section>
        ) : null}

        <CargosManagementClient initialRecords={response.records ?? []} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
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
