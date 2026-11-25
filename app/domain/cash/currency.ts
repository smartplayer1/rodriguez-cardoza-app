import type { CashCurrency } from '@/app/type/cash-management';

// Denominaciones que acepta el backend para el desglose de efectivo.
export const CASH_DENOMINATIONS: Record<CashCurrency, number[]> = {
  NIO: [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01],
  USD: [100, 50, 20, 10, 5, 2, 1],
};

export const CASH_CURRENCIES: { value: CashCurrency; label: string }[] = [
  { value: 'NIO', label: 'NIO (Córdoba)' },
  { value: 'USD', label: 'USD (Dólar)' },
];

export const CURRENCY_SYMBOL: Record<CashCurrency, string> = {
  NIO: 'C$',
  USD: 'US$',
};

export const toCashCurrency = (value: string | null | undefined): CashCurrency =>
  String(value ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'NIO';

const amountFormatter = new Intl.NumberFormat('es-NI', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Monto con el símbolo de su moneda: C$ 1,234.50 / US$ 120.00 */
export const formatCashAmount = (value: number | null | undefined, currency: string | null | undefined) => {
  const symbol = CURRENCY_SYMBOL[toCashCurrency(currency)];
  const amount = Number(value) || 0;
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol} ${amountFormatter.format(Math.abs(amount))}`;
};

/** Etiqueta de una denominación: 1000, 0.50, 0.25… */
export const formatDenomination = (value: number) =>
  value >= 1 ? new Intl.NumberFormat('es-NI').format(value) : value.toFixed(2);

/** Redondeo a centavos para comparar montos sin errores de punto flotante. */
export const roundCents = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
