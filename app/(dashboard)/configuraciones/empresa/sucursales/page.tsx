import { headers } from 'next/headers';
import { Building2, MapPin } from 'lucide-react';

import BranchManagementClient from './branch-management-client';
import { getBranches } from '@/app/services/company/branch';
import { BranchResponse, RecordsBranch } from '@/app/type/branch';

export type CityOption = {
  id: number;
  name: string;
  stateName: string;
};

const buildCityOptions = (records: RecordsBranch[]): CityOption[] => {
  const cityMap = new Map<number, CityOption>();

  for (const record of records) {
    const stateName = record.city?.state?.name ?? 'Sin departamento';

    if (record.city?.id && record.city?.name) {
      cityMap.set(record.city.id, {
        id: record.city.id,
        name: record.city.name,
        stateName,
      });
    }

    const stateCities = Array.isArray(record.city?.state?.cities)
      ? record.city.state.cities
      : [];

    for (const city of stateCities) {
      if (!city?.id || !city?.name) {
        continue;
      }

      if (!cityMap.has(city.id)) {
        cityMap.set(city.id, {
          id: city.id,
          name: city.name,
          stateName,
        });
      }
    }
  }

  return Array.from(cityMap.values()).sort((a, b) => {
    const stateCompare = a.stateName.localeCompare(b.stateName, 'es');
    if (stateCompare !== 0) {
      return stateCompare;
    }

    return a.name.localeCompare(b.name, 'es');
  });
};

export default async function SucursalesPage() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  let response: BranchResponse = {
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
    response = await getBranches({ baseUrl, cookieHeader });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'No se pudieron consultar las sucursales';
  }

  const cityOptions = buildCityOptions(response.records ?? []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <MapPin size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Sucursales</h2>
                  <p className="text-muted-foreground">Listado SSR con mantenimiento de sucursales.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Registros" value={response.paging.totalRecords} icon={<Building2 className="size-4" />} />
              <StatCard label="Pagina" value={response.paging.currentPage} icon={<MapPin className="size-4" />} />
            </div>
          </div>
        </header>

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la informacion de sucursales: {fetchError}
          </section>
        ) : null}

        <BranchManagementClient initialRecords={response.records ?? []} cityOptions={cityOptions} />
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
  icon: JSX.Element;
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
