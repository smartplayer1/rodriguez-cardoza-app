import type { CashManagementReportRecord } from "@/app/type/cash-management-report";
import type { CashManagementClosingSummary } from "@/app/type/cash-management";

export type ArqueoCajaRegisterRow = {
  label: string;
  cashRegisterCode: string;
  cashRegisterName: string;
  series: string;
  from: number | null;
  to: number | null;
  total: number;
};

export type ArqueoCajaData = {
  branchName: string;
  dateLabel: string;
  responsibleName: string;
  registers: ArqueoCajaRegisterRow[];
  salesTotal: number;
  recoveryTotal: number;
  grossIncomeTotal: number;
  creditInvoicesCount: number;
  creditInvoicesTotal: number;
  cashVouchersTotal: number;
  paymentOrdersTotal: number;
  letterheadInvoicesTotal: number;
  depositsTotal: number;
  outflowsWithDepositsTotal: number;
  nonCashTotal: number;
  balanceAccordingToArqueo: number;
  cashBalanceNio: number;
  cashBalanceUsd: number;
  exchangeRate: number;
  totalCashBalance: number;
  surplus: number;
};

const parseDocumentNumber = (document: string) => {
  const lastDashIndex = document.lastIndexOf("-");

  if (lastDashIndex === -1) {
    return { series: document, number: null as number | null };
  }

  const series = document.slice(0, lastDashIndex);
  const numericPart = document.slice(lastDashIndex + 1);
  const parsed = Number.parseInt(numericPart, 10);

  return { series, number: Number.isFinite(parsed) ? parsed : null };
};

export const buildArqueoCajaData = (
  branchName: string,
  dateLabel: string,
  sessions: CashManagementReportRecord[],
  closingSummaries: CashManagementClosingSummary[],
): ArqueoCajaData => {
  const summaryBySessionId = new Map(
    closingSummaries.map((summary) => [summary.cashManagement.id, summary]),
  );

  type RegisterAccumulator = {
    cashRegisterCode: string;
    cashRegisterName: string;
    series: string;
    min: number | null;
    max: number | null;
    total: number;
  };

  const registerAccumulators = new Map<number, RegisterAccumulator>();

  let creditInvoicesCount = 0;
  let creditInvoicesTotal = 0;

  for (const session of sessions) {
    const closingSummary = summaryBySessionId.get(session.cashManagementId);

    if (!closingSummary) {
      continue;
    }

    for (const invoice of closingSummary.invoices) {
      if (invoice.isVoided) {
        continue;
      }

      if (invoice.chargeStatus.toUpperCase() === "CONTADO") {
        const { series, number } = parseDocumentNumber(invoice.document);
        const accumulator = registerAccumulators.get(session.cashRegisterId) ?? {
          cashRegisterCode: session.cashRegisterCode,
          cashRegisterName: session.cashRegisterName,
          series,
          min: null,
          max: null,
          total: 0,
        };

        if (number !== null) {
          accumulator.min = accumulator.min === null ? number : Math.min(accumulator.min, number);
          accumulator.max = accumulator.max === null ? number : Math.max(accumulator.max, number);
        }

        accumulator.total += invoice.invoiceAmountNio;
        registerAccumulators.set(session.cashRegisterId, accumulator);
      } else {
        creditInvoicesCount += 1;
        creditInvoicesTotal += invoice.invoiceAmountNio;
      }
    }
  }

  const registers: ArqueoCajaRegisterRow[] = Array.from(registerAccumulators.entries())
    .sort((a, b) => a[1].cashRegisterCode.localeCompare(b[1].cashRegisterCode))
    .map(([, accumulator], index) => ({
      label: `Caja ${index + 1}`,
      cashRegisterCode: accumulator.cashRegisterCode,
      cashRegisterName: accumulator.cashRegisterName,
      series: accumulator.series,
      from: accumulator.min,
      to: accumulator.max,
      total: accumulator.total,
    }));

  const salesTotal = registers.reduce((sum, row) => sum + row.total, 0);
  const recoveryTotal = 0;
  const grossIncomeTotal = salesTotal + recoveryTotal;

  const cashVouchersTotal = 0;
  const paymentOrdersTotal = 0;
  const letterheadInvoicesTotal = 0;
  const depositsTotal = 0;
  const outflowsWithDepositsTotal = 0;

  const nonCashTotal =
    creditInvoicesTotal +
    cashVouchersTotal +
    paymentOrdersTotal +
    letterheadInvoicesTotal +
    depositsTotal;

  const balanceAccordingToArqueo = grossIncomeTotal - nonCashTotal;

  const cashBalanceNio = sessions.reduce((sum, session) => sum + session.actualNio, 0);
  const cashBalanceUsd = sessions.reduce((sum, session) => sum + session.actualUsd, 0);

  const sortedByClosedAt = [...sessions].sort((a, b) => {
    const timeA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
    const timeB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
    return timeB - timeA;
  });

  const exchangeRate = sortedByClosedAt[0]?.exchangeRateNioPerUsd ?? 0;
  const responsibleName = sortedByClosedAt[0]?.responsibleEmployeeName ?? "-";

  const totalCashBalance = cashBalanceNio + cashBalanceUsd * exchangeRate;
  const surplus = totalCashBalance - balanceAccordingToArqueo;

  return {
    branchName,
    dateLabel,
    responsibleName,
    registers,
    salesTotal,
    recoveryTotal,
    grossIncomeTotal,
    creditInvoicesCount,
    creditInvoicesTotal,
    cashVouchersTotal,
    paymentOrdersTotal,
    letterheadInvoicesTotal,
    depositsTotal,
    outflowsWithDepositsTotal,
    nonCashTotal,
    balanceAccordingToArqueo,
    cashBalanceNio,
    cashBalanceUsd,
    exchangeRate,
    totalCashBalance,
    surplus,
  };
};
