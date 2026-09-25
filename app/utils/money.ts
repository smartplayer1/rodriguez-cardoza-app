const moneyFormatter = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Los precios pueden llegar con muchos decimales (1593.900000); se muestran
// siempre con 2. null/undefined = sin dato, nunca se convierte a 0.
export const formatMoney = (value: number | null | undefined, empty = "—") =>
  value === null || value === undefined ? empty : moneyFormatter.format(value);

// Fracción (0.10) → "10%".
export const formatPercent = (fraction: number | null | undefined, empty = "—") =>
  fraction === null || fraction === undefined
    ? empty
    : `${Number((fraction * 100).toFixed(2))}%`;

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const formatPeriod = (year: number, month: number) =>
  `${MONTH_NAMES[month - 1] ?? month} ${year}`;

export const MONTH_LABELS = MONTH_NAMES;
