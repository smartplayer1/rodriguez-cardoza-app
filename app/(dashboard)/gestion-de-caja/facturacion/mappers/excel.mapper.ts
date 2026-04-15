/* eslint-disable @typescript-eslint/no-explicit-any */
import { FacturaDetalleExcel } from '../types/factura'

export const mapExcelToFactura = (row: any): FacturaDetalleExcel => ({
  documento: row?.DOCUMENTO,
  estado_cobro: row?.ESTADO_COBRO,
  cliente: row?.CLIENTE,
  bodega: Number(row?.BODEGA),
  sucursal: row?.SUCURSAL,
  cajero: row?.CAJERO,
  fecha: row?.FECHA,

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