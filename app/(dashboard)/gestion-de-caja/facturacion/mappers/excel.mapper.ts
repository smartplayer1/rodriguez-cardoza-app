/* eslint-disable @typescript-eslint/no-explicit-any */
import { FacturaDetalleExcel } from '../types/factura'

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateParts = (year: number, month: number, day: number) => {
  return `${year}-${pad(month)}-${pad(day)}`;
};

const parseExcelDate = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const serial = Math.floor(value);
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + serial * 86400000);

    if (!Number.isNaN(date.getTime())) {
      return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return "";
    }

    const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) {
      return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
    }

    const latinDate = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (latinDate) {
      const day = Number(latinDate[1]);
      const month = Number(latinDate[2]);
      const year = Number(latinDate[3]);
      return formatDateParts(year, month, day);
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }
  }

  return "";
};

export const mapExcelToFactura = (row: any): FacturaDetalleExcel => ({
  documento: row?.DOCUMENTO,
  estado_cobro: row?.ESTADO_COBRO,
  cliente: row?.CLIENTE,
  bodega: Number(row?.BODEGA),
  sucursal: row?.SUCURSAL,
  cajero: row?.CAJERO,
  fecha: parseExcelDate(row?.FECHA),

  articulo: row?.ARTICULO,
  precio_venta: toDecimal(row?.PRECIO_VENTA),
  cantidad: Number(row?.CANTIDAD),

  desc_linea: toDecimal(row?.DESC_LINEA),
  desc_gen: toDecimal(row?.DESC_GEN),

  impuesto1: toDecimal(row?.IMPUESTO1),
  impuesto2: toDecimal(row?.IMPUESTO2),

  cupon: row?.CUPON,
  tienda: row?.TIENDA,
  promotora: row?.PROMOTORA,
  nivel_precio: row?.NIVEL_PRECIO,
  exento: row?.EXENTO,

  mpremio: toDecimal(row?.Mpremio),
  desc_porcentaje: Number(row?.["DESC%"]),
  precio: toDecimal(row.PRECIO),
});

const toDecimal = (value: any) => {
  const num = Number(value || 0);
  return Math.round(num * 100) / 100;
};