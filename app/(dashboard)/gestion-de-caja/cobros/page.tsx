import { headers } from "next/headers";
import {
  CalendarDays,
  ChevronDown,
  Hash,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";

import CrearCobroModal from "./crear-cobro-modal";
import ClientFilterField from "./client-filter-field";
import CobrosTable from "./cobros-table";
import type { ClientSearchItem } from "./client-selector";
import { getCollections } from "@/app/services/billing/collection";
import { getclients } from "@/app/services/clients";
import { getBranches } from "@/app/services/company/branch";
import { getCashRegisters } from "@/app/services/cash-management";
import type { ClienteResponse } from "@/app/type/client";
import type { BranchResponse } from "@/app/type/branch";
import type { CashRegisterRecord } from "@/app/type/cash-management";

type SearchParams = {
  number?: string | string[];
  invoiceDocument?: string | string[];
  cashRegisterId?: string | string[];
  currency?: string | string[];
  status?: string | string[];
  collectionDate?: string | string[];
  clientCode?: string | string[];
  branchId?: string | string[];
  Page?: string | string[];
  PerPage?: string | string[];
};

type SelectOption = {
  id: string;
  label: string;
};

const STATUS_OPTIONS: SelectOption[] = [
  { id: "Activo", label: "Activo" },
  { id: "Inactivo", label: "Inactivo" },
];

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? "";
};

const toPositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPageHref = (
  pageNumber: number,
  perPage: number,
  searchParams: URLSearchParams,
) => {
  const params = new URLSearchParams(searchParams);

  if (pageNumber > 1) {
    params.set("Page", String(pageNumber));
  } else {
    params.delete("Page");
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set("PerPage", String(perPage));
  } else {
    params.delete("PerPage");
  }

  const query = params.toString();
  return query ? `?${query}` : "?";
};

export default async function CobrosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = toPositiveInt(resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.PerPage, DEFAULT_PER_PAGE);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_URL_LOCAL;

  const filterParams = new URLSearchParams();

  const filterFields = [
    ["number", resolvedSearchParams.number],
    ["invoiceDocument", resolvedSearchParams.invoiceDocument],
    ["cashRegisterId", resolvedSearchParams.cashRegisterId],
    ["currency", resolvedSearchParams.currency],
    ["status", resolvedSearchParams.status],
    ["collectionDate", resolvedSearchParams.collectionDate],
    ["clientCode", resolvedSearchParams.clientCode],
    ["branchId", resolvedSearchParams.branchId],
  ] as const;

  for (const [key, value] of filterFields) {
    const normalized = toStringValue(value);

    if (normalized) {
      filterParams.set(key, normalized);
    }
  }

  let fetchError: string | null = null;
  let response;
  let clientOptions: ClientSearchItem[] = [];
  let branchOptions: SelectOption[] = [];
  let cashRegisterOptions: SelectOption[] = [];

  const [clientsResult, branchesResult, cashRegistersResult] =
    await Promise.allSettled([
      getclients({ baseUrl, cookieHeader }),
      getBranches({ baseUrl, cookieHeader }),
      getCashRegisters({ page: 1, perPage: 100, baseUrl, cookieHeader }),
    ]);

  if (clientsResult.status === "fulfilled") {
    clientOptions = (
      (clientsResult.value.records || []) as ClienteResponse[]
    ).map((client) => ({
      code: client.code,
      name: client.name,
    }));
  }

  if (branchesResult.status === "fulfilled") {
    branchOptions = (
      (branchesResult.value as BranchResponse).records || []
    ).map((branch) => ({
      id: String(branch.id),
      label: `${branch.code} - ${branch.name}`,
    }));
  }

  if (cashRegistersResult.status === "fulfilled") {
    cashRegisterOptions = (
      (cashRegistersResult.value.records || []) as CashRegisterRecord[]
    ).map((cashRegister) => ({
      id: String(cashRegister.id),
      label: `${cashRegister.code} - ${cashRegister.name}`,
    }));
  }

  try {
    response = await getCollections({
      number: toStringValue(resolvedSearchParams.number),
      invoiceDocument: toStringValue(resolvedSearchParams.invoiceDocument),
      cashRegisterId: toStringValue(resolvedSearchParams.cashRegisterId),
      currency: toStringValue(resolvedSearchParams.currency),
      status: toStringValue(resolvedSearchParams.status),
      collectionDate: toStringValue(resolvedSearchParams.collectionDate),
      clientCode: toStringValue(resolvedSearchParams.clientCode),
      branchId: toStringValue(resolvedSearchParams.branchId),
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError =
      error instanceof Error
        ? error.message
        : "No se pudieron consultar los cobros";
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
                <Wallet size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Cobros</h2>
                  <p className="text-muted-foreground">
                    Consulta de collections con filtros por factura, caja y
                    estado.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard
                label="Registros"
                value={response.paging.totalRecords}
                icon={<Hash className="size-4" />}
              />
              <StatCard
                label="Filtros"
                value={activeFiltersCount}
                icon={<Search className="size-4" />}
              />
              <StatCard
                label="Página"
                value={response.paging.currentPage}
                icon={<CalendarDays className="size-4" />}
              />
              <StatCard
                label="Por página"
                value={response.paging.perPage}
                icon={<ReceiptText className="size-4" />}
              />
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Los filtros se pueden expandir o contraer según lo necesites.
          </p>
          <CrearCobroModal />
        </div>

        <details
          className="group rounded-3xl border border-border/60 bg-surface p-5 shadow-sm"
          open
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-foreground [&::-webkit-details-marker]:hidden">
            <span>Filtros de búsqueda</span>
            <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="mt-5">
            <form
              method="get"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <ClientFilterField
                clients={clientOptions}
                defaultClientCode={toStringValue(
                  resolvedSearchParams.clientCode,
                )}
              />
              <FilterSelect
                label="Sucursal"
                name="branchId"
                defaultValue={toStringValue(resolvedSearchParams.branchId)}
                options={branchOptions}
                placeholder="Todas las sucursales"
              />
              <FilterSelect
                label="Caja registradora"
                name="cashRegisterId"
                defaultValue={toStringValue(
                  resolvedSearchParams.cashRegisterId,
                )}
                options={cashRegisterOptions}
                placeholder="Todas las cajas"
              />
              <FilterInput
                label="Moneda"
                name="currency"
                defaultValue={toStringValue(resolvedSearchParams.currency)}
                placeholder="USD o NIO"
              />
              <FilterSelect
                label="Estado"
                name="status"
                defaultValue={toStringValue(resolvedSearchParams.status)}
                options={STATUS_OPTIONS}
                placeholder="Todos los estados"
              />
              <FilterInput
                label="Número"
                name="number"
                defaultValue={toStringValue(resolvedSearchParams.number)}
                placeholder="Número de cobro"
              />
              <FilterInput
                label="Documento factura"
                name="invoiceDocument"
                defaultValue={toStringValue(
                  resolvedSearchParams.invoiceDocument,
                )}
                placeholder="Documento"
              />
              <FilterInput
                label="Fecha de cobro"
                name="collectionDate"
                defaultValue={toStringValue(
                  resolvedSearchParams.collectionDate,
                )}
                placeholder="YYYY-MM-DD"
              />

              <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-end justify-between gap-3 pt-2">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Buscar
                  </button>
                  <a
                    href="/gestion-de-caja/cobros"
                    className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Limpiar
                  </a>
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Por página</span>
                  <select
                    name="PerPage"
                    defaultValue={String(perPage)}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
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

        <CobrosTable records={response.records} />

        {response.paging.totalPages > 1 ? (
          <nav
            aria-label="Paginación cobros"
            className="rounded-2xl border border-border/60 bg-surface px-4 py-3"
          >
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {response.paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(
                      response.paging.currentPage - 1,
                      response.paging.perPage,
                      filterParams,
                    )}
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
                Página {response.paging.currentPage} de{" "}
                {response.paging.totalPages}
              </li>
              <li>
                {response.paging.currentPage < response.paging.totalPages ? (
                  <a
                    href={buildPageHref(
                      response.paging.currentPage + 1,
                      response.paging.perPage,
                      filterParams,
                    )}
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

function FilterSelect({
  label,
  name,
  defaultValue,
  placeholder,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
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
