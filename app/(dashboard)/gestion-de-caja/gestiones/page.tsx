import { headers } from "next/headers";
import {
  ArrowUpDown,
  Banknote,
  ChevronDown,
  CircleDollarSign,
  Filter,
  Wallet,
} from "lucide-react";

import {
  getCashManagementRecords,
  getCashRegisters,
} from "@/app/services/cash-management";
import { getEmployees } from "@/app/services/employee";
import AperturaCajaForm from "./apertura-caja-form";
import CerrarCajaPorRegistradora from "./cerrar-caja-por-registradora";
import GestionesHeaderTable from "./GestionesHeaderTable";

type SearchParams = {
  cashRegisterId?: string | string[];
  responsibleEmployeeId?: string | string[];
  status?: string | string[];
  openedFrom?: string | string[];
  openedTo?: string | string[];
  Page?: string | string[];
  page?: string | string[];
  perPage?: string | string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const GESTIONES_PATH = "/gestion-de-caja/gestiones";

const toPositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOptionalString = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = rawValue?.trim();

  return trimmedValue ? trimmedValue : undefined;
};

type ActiveFilters = {
  cashRegisterId?: string;
  responsibleEmployeeId?: string;
  status?: string;
  openedFrom?: string;
  openedTo?: string;
};

type SelectOption = {
  id: string;
  label: string;
};

const buildPageHref = (
  pageNumber: number,
  perPage: number,
  filters: ActiveFilters,
) => {
  const params = new URLSearchParams();

  if (filters.cashRegisterId) {
    params.set("cashRegisterId", filters.cashRegisterId);
  }

  if (filters.responsibleEmployeeId) {
    params.set("responsibleEmployeeId", filters.responsibleEmployeeId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.openedFrom) {
    params.set("openedFrom", filters.openedFrom);
  }

  if (filters.openedTo) {
    params.set("openedTo", filters.openedTo);
  }

  if (pageNumber > 1) {
    params.set("page", String(pageNumber));
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set("perPage", String(perPage));
  }

  const query = params.toString();
  return query ? `?${query}` : "?";
};

const formatCurrency = (value: number, currency: "NIO" | "USD") => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-NI", {
    dateStyle: "medium",
  }).format(date);
};

export default async function GestionCaja({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = toPositiveInt(
    resolvedSearchParams.page ?? resolvedSearchParams.Page,
    DEFAULT_PAGE,
  );
  const perPage = toPositiveInt(resolvedSearchParams.perPage, DEFAULT_PER_PAGE);
  const activeFilters: ActiveFilters = {
    cashRegisterId: toOptionalString(resolvedSearchParams.cashRegisterId),
    responsibleEmployeeId: toOptionalString(
      resolvedSearchParams.responsibleEmployeeId,
    ),
    status: toOptionalString(resolvedSearchParams.status),
    openedFrom: toOptionalString(resolvedSearchParams.openedFrom),
    openedTo: toOptionalString(resolvedSearchParams.openedTo),
  };

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_URL_LOCAL;

  let fetchError: string | null = null;
  let response;
  let cashRegisterOptions: SelectOption[] = [];
  let employeeOptions: SelectOption[] = [];

  const [cashRegistersResult, employeesResult] = await Promise.allSettled([
    getCashRegisters({
      page: 1,
      perPage: 100,
      baseUrl,
      cookieHeader,
    }),
    getEmployees({
      page: 1,
      perPage: 100,
      baseUrl,
      cookieHeader,
    }),
  ]);

  if (cashRegistersResult.status === "fulfilled") {
    cashRegisterOptions = cashRegistersResult.value.records.map((record) => ({
      id: String(record.id),
      label: `${record.code} - ${record.name}`,
    }));
  }

  if (employeesResult.status === "fulfilled") {
    employeeOptions = employeesResult.value.records.map((record) => ({
      id: String(record.id),
      label:
        `${record.code} - ${record.firstname} ${record.middleName} ${record.lastName} ${record.secondLastName}`
          .replace(/\s+/g, " ")
          .trim(),
    }));
  }

  const selectedCashRegisterLabel = cashRegisterOptions.find(
    (option) => option.id === activeFilters.cashRegisterId,
  )?.label;
  const selectedEmployeeLabel = employeeOptions.find(
    (option) => option.id === activeFilters.responsibleEmployeeId,
  )?.label;

  try {
    response = await getCashManagementRecords({
      ...activeFilters,
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError =
      error instanceof Error
        ? error.message
        : "No se pudo consultar la gestion de caja";
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

  const totalNio = response.records.reduce(
    (sum, record) => sum + record.balance.nio,
    0,
  );
  const totalUsd = response.records.reduce(
    (sum, record) => sum + record.balance.usd,
    0,
  );
  const openRecords = response.records.filter(
    (record) => record.status.toLowerCase() === "abierta",
  ).length;
  const selectedFilterChips = [
    activeFilters.cashRegisterId
      ? `Caja: ${selectedCashRegisterLabel || activeFilters.cashRegisterId}`
      : null,
    activeFilters.responsibleEmployeeId
      ? `Responsable: ${selectedEmployeeLabel || activeFilters.responsibleEmployeeId}`
      : null,
    activeFilters.status ? `Estado: ${activeFilters.status}` : null,
    activeFilters.openedFrom
      ? `Desde: ${formatDateLabel(activeFilters.openedFrom)}`
      : null,
    activeFilters.openedTo
      ? `Hasta: ${formatDateLabel(activeFilters.openedTo)}`
      : null,
  ].filter((value): value is string => Boolean(value));
  const shouldOpenFilters = selectedFilterChips.length === 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Wallet size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Gestión de Caja</h2>
                  <p className="text-muted-foreground">
                    Vista server-side render con aperturas, cierres y balances
                    por caja.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard
                label="Registros"
                value={response.paging.totalRecords}
                icon={<ArrowUpDown className="size-4" />}
              />
              <StatCard
                label="Cajas abiertas"
                value={openRecords}
                icon={<Banknote className="size-4" />}
              />
              <StatCard
                label="Balance NIO"
                value={formatCurrency(totalNio, "NIO")}
                icon={<CircleDollarSign className="size-4" />}
              />
              <StatCard
                label="Balance USD"
                value={formatCurrency(totalUsd, "USD")}
                icon={<CircleDollarSign className="size-4" />}
              />
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <AperturaCajaForm
            cashRegisterOptions={cashRegisterOptions}
            employeeOptions={employeeOptions}
          />
          <CerrarCajaPorRegistradora
            cashRegisterOptions={cashRegisterOptions}
          />
        </div>

        <details
          className="group overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm"
          open={shouldOpenFilters}
        >
          <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Filter className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Filtros</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFilterChips.length > 0
                    ? "Filtros aplicados actualmente"
                    : "Expanda para filtrar por caja, responsable, estado y fechas"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedFilterChips.length > 0 ? (
                selectedFilterChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-foreground"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sin filtros aplicados
                </span>
              )}

              <span className="rounded-full border border-border/60 p-2 text-muted-foreground transition-transform group-open:rotate-180">
                <ChevronDown className="size-4" />
              </span>
            </div>
          </summary>

          <div className="border-t border-border/60 px-5 py-5">
            <form action={GESTIONES_PATH} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Caja</span>
                  <select
                    name="cashRegisterId"
                    defaultValue={activeFilters.cashRegisterId}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Todas las cajas</option>
                    {cashRegisterOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    Responsable
                  </span>
                  <select
                    name="responsibleEmployeeId"
                    defaultValue={activeFilters.responsibleEmployeeId}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Todos los responsables</option>
                    {employeeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <select
                    name="status"
                    defaultValue={activeFilters.status ?? ""}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Todos</option>
                    <option value="Abierta">Abierta</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    Abierta desde
                  </span>
                  <input
                    type="date"
                    name="openedFrom"
                    defaultValue={activeFilters.openedFrom}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    Abierta hasta
                  </span>
                  <input
                    type="date"
                    name="openedTo"
                    defaultValue={activeFilters.openedTo}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Por página
                  </span>
                  <select
                    name="perPage"
                    defaultValue={String(perPage)}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={GESTIONES_PATH}
                    className="inline-flex items-center rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Limpiar
                  </a>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </form>
          </div>
        </details>

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No se pudo cargar la informacion desde el endpoint: {fetchError}
          </section>
        ) : null}

        <GestionesHeaderTable records={response.records} />

        {response.paging.totalPages > 1 ? (
          <nav
            aria-label="Paginación gestión de caja"
            className="rounded-2xl border border-border/60 bg-surface px-4 py-3"
          >
            <ul className="flex items-center justify-between gap-2 sm:justify-center">
              <li>
                {response.paging.currentPage > 1 ? (
                  <a
                    href={buildPageHref(
                      response.paging.currentPage - 1,
                      response.paging.perPage,
                      activeFilters,
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
                      activeFilters,
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
