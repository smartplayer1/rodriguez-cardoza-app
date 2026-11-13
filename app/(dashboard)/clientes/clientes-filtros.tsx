'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

import { BranchResponse } from '@/app/type/branch';
import PromotorSearch, { PromotorOption } from './promotor-search';

// Valores tal como viajan en la URL de /clientes (mismos nombres que la API).
export type ClientesFiltrosValues = {
  Code: string;
  Name: string;
  IDNumber: string;
  PhoneNumber: string;
  ClientType: string;
  ZoneCode: string;
  Address: string;
  Province: string;
  District: string;
  Canton: string;
  Id: string;
  BranchId: string;
  PromoterId: string;
  DateOfEntry: string;
  PerPage: string;
};

export const EMPTY_FILTERS: ClientesFiltrosValues = {
  Code: '',
  Name: '',
  IDNumber: '',
  PhoneNumber: '',
  ClientType: '',
  ZoneCode: '',
  Address: '',
  Province: '',
  District: '',
  Canton: '',
  Id: '',
  BranchId: '',
  PromoterId: '',
  DateOfEntry: '',
  PerPage: '10',
};

const PER_PAGE_OPTIONS = [10, 20, 50, 100];
const LOCATION_KEYS: Array<keyof ClientesFiltrosValues> = [
  'Address',
  'Province',
  'District',
  'Canton',
  'ZoneCode',
  'PhoneNumber',
  'Id',
];

type Props = {
  initialValues: ClientesFiltrosValues;
  initialPromoter: PromotorOption | null;
  branches: BranchResponse['records'];
};

const inputClass =
  'w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary';

export default function ClientesFiltros({ initialValues, initialPromoter, branches }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ClientesFiltrosValues>(initialValues);
  const [promoter, setPromoter] = useState<PromotorOption | null>(initialPromoter);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(() =>
    LOCATION_KEYS.some((key) => initialValues[key] !== ''),
  );

  const set = (key: keyof ClientesFiltrosValues) => (value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  // Aplica los filtros siempre desde la página 1 (no se envía Page).
  const apply = (next: ClientesFiltrosValues, nextPromoter: PromotorOption | null) => {
    const perPage = Number(next.PerPage);
    if (!Number.isInteger(perPage) || perPage < 1) {
      setError('Registros por página debe ser un número mayor o igual a 1');
      return;
    }
    if (next.Id && (!Number.isInteger(Number(next.Id)) || Number(next.Id) < 1)) {
      setError('El Id debe ser un número entero mayor o igual a 1');
      return;
    }
    setError(null);

    const params = new URLSearchParams();
    (Object.keys(next) as Array<keyof ClientesFiltrosValues>).forEach((key) => {
      if (key === 'PromoterId' || key === 'PerPage') return;
      const value = next[key].trim();
      if (value) params.set(key, value);
    });
    if (nextPromoter) params.set('PromoterId', String(nextPromoter.id));
    if (perPage !== Number(EMPTY_FILTERS.PerPage)) params.set('PerPage', String(perPage));

    const query = params.toString();
    router.push(query ? `/clientes?${query}` : '/clientes');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    apply(values, promoter);
  };

  const handleClear = () => {
    setValues(EMPTY_FILTERS);
    setPromoter(null);
    setError(null);
    router.push('/clientes');
  };

  const hasFilters =
    promoter !== null ||
    (Object.keys(values) as Array<keyof ClientesFiltrosValues>).some(
      (key) => key !== 'PerPage' && key !== 'PromoterId' && values[key].trim() !== '',
    );

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-border/60 bg-surface p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Filter size={16} className="text-primary" />
        Filtros
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Código</span>
          <input className={inputClass} value={values.Code} onChange={(e) => set('Code')(e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Nombre</span>
          <input className={inputClass} value={values.Name} onChange={(e) => set('Name')(e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Cédula</span>
          <input className={inputClass} value={values.IDNumber} onChange={(e) => set('IDNumber')(e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Tipo de cliente</span>
          <select className={inputClass} value={values.ClientType} onChange={(e) => set('ClientType')(e.target.value)}>
            <option value="">Todos</option>
            <option value="ASESOR">ASESOR</option>
            <option value="PROMOTOR">PROMOTOR</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Sucursal</span>
          <select className={inputClass} value={values.BranchId} onChange={(e) => set('BranchId')(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={String(branch.id)}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Promotor</span>
          <PromotorSearch value={promoter} onChange={setPromoter} />
        </div>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Fecha de ingreso</span>
          <input
            type="date"
            className={inputClass}
            value={values.DateOfEntry}
            onChange={(e) => set('DateOfEntry')(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Por página</span>
          <select className={inputClass} value={values.PerPage} onChange={(e) => set('PerPage')(e.target.value)}>
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={String(option)}>
                {option} por página
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((previous) => !previous)}
        className="flex items-center gap-1 text-sm text-primary hover:underline"
      >
        {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showMore ? 'Menos filtros' : 'Más filtros (dirección, zona, teléfono, Id)'}
      </button>

      {showMore && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Teléfono</span>
            <input className={inputClass} value={values.PhoneNumber} onChange={(e) => set('PhoneNumber')(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Código de zona</span>
            <input className={inputClass} value={values.ZoneCode} onChange={(e) => set('ZoneCode')(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Id del cliente</span>
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={values.Id}
              onChange={(e) => set('Id')(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Dirección</span>
            <input className={inputClass} value={values.Address} onChange={(e) => set('Address')(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Departamento / Provincia</span>
            <input className={inputClass} value={values.Province} onChange={(e) => set('Province')(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Distrito</span>
            <input className={inputClass} value={values.District} onChange={(e) => set('District')(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Cantón</span>
            <input className={inputClass} value={values.Canton} onChange={(e) => set('Canton')(e.target.value)} />
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            Limpiar
          </button>
        )}
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
