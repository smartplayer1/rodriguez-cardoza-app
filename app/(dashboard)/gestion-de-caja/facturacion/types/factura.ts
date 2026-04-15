
export interface FacturaDetalleExcel {
  documento: string;
  estado_cobro: string;
  cliente: string;
  bodega: number;
  sucursal: string;
  cajero: string;
  fecha: string;

  articulo: string;
  precio_venta: number;
  cantidad: number;

  desc_linea: number;
  desc_gen: number;

  impuesto1: number;
  impuesto2: number;

  cupon: string;
  tienda: string;
  promotora: string;
  nivel_precio: string;
  exento: string;

  mpremio: number;
  desc_porcentaje: number;
  precio: number;
}

export interface Factura {
  encabezado: FacturaEncabezado;
  detalle: FacturaDetalle[];
}

export interface FacturaEncabezado {
  documento: string;
  estado_cobro: string;
  cliente: string;
  bodega: number;
  sucursal: string;
  cajero: string;
  fecha: string;

  tienda: string;
  promotora: string;
  nivel_precio: string;
  cupon: string;

  total_bruto: number;
  total_descuento_linea: number;
  total_descuento_general: number;
  total_impuesto1: number;
  total_impuesto2: number;
  total_neto: number;
  total_items: number;
}

export interface FacturaDetalle {
  articulo: string;
  cantidad: number;
  precio_venta: number;
  precio: number;
  impuesto1: number;
  impuesto2: number;
  desc_linea: number;
  desc_gen: number;
  exento: string;
}