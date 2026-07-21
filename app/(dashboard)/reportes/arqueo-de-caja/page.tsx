import { headers } from "next/headers";
import { ClipboardCheck } from "lucide-react";

import { getCashManagementReport } from "@/app/services/billing/reports";
import { getCashManagementClosingSummary } from "@/app/services/cash-management";
import { getBranches } from "@/app/services/company/branch";
import { BranchResponse, RecordsBranch } from "@/app/type/branch";
import { buildArqueoCajaData } from "./arqueo-caja-data";
import PrintButton from "./print-button";

type SearchParams = {
  branchCode?: string | string[];
  date?: string | string[];
};

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? "";
};

const pad = (value: number) => String(value).padStart(2, "0");

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatLongDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatted = new Intl.DateTimeFormat("es-NI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatCurrency = (value: number, currency: "NIO" | "USD") =>
  new Intl.NumberFormat("es-NI", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);

const normalizeBranchOptions = (payload: unknown) => {
  const records = (payload as BranchResponse | null)?.records;

  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((branch) => ({
    code: (branch as RecordsBranch).code,
    name: (branch as RecordsBranch).name,
  }));
};

export default async function ArqueoDeCajaPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;
  const context = { baseUrl, cookieHeader };

  const date = toStringValue(resolvedSearchParams.date) || getToday();
  const branchCode = toStringValue(resolvedSearchParams.branchCode);

  const branchesResult = await getBranches(context).catch(() => null);
  const branches = normalizeBranchOptions(branchesResult);
  const selectedBranch = branches.find((branch) => branch.code === branchCode);

  let fetchError: string | null = null;
  let data: Awaited<ReturnType<typeof buildArqueoCajaData>> | null = null;
  let sessionCount = 0;

  if (branchCode) {
    try {
      const report = await getCashManagementReport({
        dateFrom: date,
        dateTo: date,
        branchCode,
        status: "CLOSED",
        perPage: 200,
        ...context,
      });

      const sessions = report.records.records;
      sessionCount = sessions.length;

      const closingSummaries = await Promise.all(
        sessions.map((session) =>
          getCashManagementClosingSummary(session.cashManagementId, cookieHeader),
        ),
      );

      data = buildArqueoCajaData(
        selectedBranch?.name ?? branchCode,
        formatLongDate(date),
        sessions,
        closingSummaries,
      );
    } catch (error) {
      fetchError = error instanceof Error ? error.message : "No se pudo generar el arqueo de caja";
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-surface/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <ClipboardCheck size={32} className="text-primary" />
            <div>
              <h2 className="text-foreground">Arqueo de Caja</h2>
              <p className="text-muted-foreground">
                Consolidado de ingresos y saldo de caja por sucursal y fecha.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
          <form method="get" className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">Sucursal</span>
              <select
                name="branchCode"
                defaultValue={branchCode}
                required
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="">Seleccione una sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.code} value={branch.code}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-muted-foreground">Fecha</span>
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              >
                Generar
              </button>
            </div>
          </form>
        </section>

        {!branchCode ? (
          <section className="rounded-2xl border border-border/60 bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
            Seleccione una sucursal y una fecha para generar el arqueo de caja.
          </section>
        ) : fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fetchError}
          </section>
        ) : sessionCount === 0 ? (
          <section className="rounded-2xl border border-border/60 bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
            No hay gestiones de caja cerradas para {selectedBranch?.name ?? branchCode} el {formatLongDate(date)}.
          </section>
        ) : data ? (
          <>
            <div className="flex items-center justify-end">
              <PrintButton data={data} />
            </div>

            <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <h3 className="text-foreground">
                  {data.branchName} · {data.dateLabel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Responsable de Facturación: {data.responsibleName} · {sessionCount} caja(s) cerrada(s)
                </p>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard label="Ingresos por ventas" value={formatCurrency(data.salesTotal, "NIO")} />
                <SummaryCard
                  label="Facturas de crédito"
                  value={`${formatCurrency(data.creditInvoicesTotal, "NIO")} (${data.creditInvoicesCount})`}
                />
                <SummaryCard
                  label="Saldo según arqueo"
                  value={formatCurrency(data.balanceAccordingToArqueo, "NIO")}
                />
                <SummaryCard
                  label="Total saldo en efectivo"
                  value={formatCurrency(data.totalCashBalance, "NIO")}
                />
                <SummaryCard label="Saldo en Córdobas" value={formatCurrency(data.cashBalanceNio, "NIO")} />
                <SummaryCard
                  label="Saldo en Dólares"
                  value={`${formatCurrency(data.cashBalanceUsd, "USD")} (TC ${data.exchangeRate})`}
                />
                <SummaryCard
                  label={data.surplus >= 0 ? "Sobrante de caja" : "Faltante de caja"}
                  value={formatCurrency(Math.abs(data.surplus), "NIO")}
                />
              </div>

              <div className="overflow-x-auto border-t border-border/60">
                <table className="min-w-full divide-y divide-border/60 text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caja</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serie</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rango</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.registers.map((row) => (
                      <tr key={row.cashRegisterCode}>
                        <td className="px-4 py-3 text-foreground">
                          {row.label} · {row.cashRegisterName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.series}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.from !== null && row.to !== null ? `${row.from} al ${row.to}` : "Sin documentos"}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(row.total, "NIO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
