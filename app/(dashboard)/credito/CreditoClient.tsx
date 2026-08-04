'use client';

import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { CreditCard, Receipt, DollarSign, Search, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import type { ServerInvoiceResponse } from '@/app/type/invoice';
import VerDetalle from '../gestion-de-caja/facturacion/modals/VerDetalle';

// Interfaces
interface FacturaCredito {
  id: string;
  numeroFactura: string;
  asesorId: string;
  asesorNombre: string;
  fecha: string;
  cajaId: string;
  cajaNombre: string;
  tipoPago: 'Crédito';
  subtotal: number;
  iva: number;
  total: number;
  saldoPendiente: number;
  moneda: string;
}

interface Abono {
  id: string;
  facturaId: string;
  numeroFactura: string;
  asesorId: string;
  asesorNombre: string;
  fecha: string;
  montoAbono: number;
  cajaId: string;
  cajaNombre: string;
  usuarioRegistro: string;
  descripcion: string;
  saldoAnterior: number;
  saldoNuevo: number;
  moneda: string;
}

// Mock data - Facturas de Crédito (respaldan las referencias de Abonos, mientras Abonos siga simulado)
const facturasData: FacturaCredito[] = [
  {
    id: 'F1',
    numeroFactura: 'FACT-001',
    asesorId: 'A1',
    asesorNombre: 'María José López García',
    fecha: '2024-12-09',
    cajaId: 'C1',
    cajaNombre: 'Caja Principal - Sucursal Central',
    tipoPago: 'Crédito',
    subtotal: 1200,
    iva: 180,
    total: 1380,
    saldoPendiente: 1380,
    moneda: 'USD (Dólar)'
  },
  {
    id: 'F2',
    numeroFactura: 'FACT-002',
    asesorId: 'A2',
    asesorNombre: 'Roberto García Sánchez',
    fecha: '2024-12-08',
    cajaId: 'C2',
    cajaNombre: 'Caja Principal - Sucursal León',
    tipoPago: 'Crédito',
    subtotal: 2200,
    iva: 330,
    total: 2530,
    saldoPendiente: 1530,
    moneda: 'NIO (Córdoba)'
  },
  {
    id: 'F3',
    numeroFactura: 'FACT-003',
    asesorId: 'A1',
    asesorNombre: 'María José López García',
    fecha: '2024-12-07',
    cajaId: 'C1',
    cajaNombre: 'Caja Principal - Sucursal Central',
    tipoPago: 'Crédito',
    subtotal: 3000,
    iva: 450,
    total: 3450,
    saldoPendiente: 0,
    moneda: 'USD (Dólar)'
  },
  {
    id: 'F4',
    numeroFactura: 'FACT-004',
    asesorId: 'A3',
    asesorNombre: 'Patricia López Rodríguez',
    fecha: '2024-12-06',
    cajaId: 'C1',
    cajaNombre: 'Caja Principal - Sucursal Central',
    tipoPago: 'Crédito',
    subtotal: 1800,
    iva: 270,
    total: 2070,
    saldoPendiente: 2070,
    moneda: 'NIO (Córdoba)'
  }
];

// Mock data - Abonos
const abonosData: Abono[] = [
  {
    id: 'AB1',
    facturaId: 'F2',
    numeroFactura: 'FACT-002',
    asesorId: 'A2',
    asesorNombre: 'Roberto García Sánchez',
    fecha: '2024-12-09',
    montoAbono: 1000,
    cajaId: 'C2',
    cajaNombre: 'Caja Principal - Sucursal León',
    usuarioRegistro: 'Admin',
    descripcion: 'Pago parcial del cliente',
    saldoAnterior: 2530,
    saldoNuevo: 1530,
    moneda: 'NIO (Córdoba)'
  },
  {
    id: 'AB2',
    facturaId: 'F3',
    numeroFactura: 'FACT-003',
    asesorId: 'A1',
    asesorNombre: 'María José López García',
    fecha: '2024-12-08',
    montoAbono: 3450,
    cajaId: 'C1',
    cajaNombre: 'Caja Principal - Sucursal Central',
    usuarioRegistro: 'Admin',
    descripcion: 'Pago total de la factura',
    saldoAnterior: 3450,
    saldoNuevo: 0,
    moneda: 'USD (Dólar)'
  },
  {
    id: 'AB3',
    facturaId: 'F2',
    numeroFactura: 'FACT-002',
    asesorId: 'A2',
    asesorNombre: 'Roberto García Sánchez',
    fecha: '2024-12-07',
    montoAbono: 500,
    cajaId: 'C2',
    cajaNombre: 'Caja Principal - Sucursal León',
    usuarioRegistro: 'Admin',
    descripcion: 'Primer abono',
    saldoAnterior: 3030,
    saldoNuevo: 2530,
    moneda: 'NIO (Córdoba)'
  }
];

// Facturas de crédito (datos reales desde /api/invoice, chargeStatus=CREDITO)
interface CreditInvoiceDetalle {
  id: string;
  articuloId: string;
  articuloNombre: string;
  precioVendido: number;
  cantidad: number;
  subtotal: number;
}

interface CreditInvoiceItem {
  id: string;
  numeroFactura: string;
  cajaId: string;
  cajaNombre: string;
  asesorId: string;
  asesorNombre: string;
  asesorTipo: 'promotor' | 'empleado';
  clientName: string;
  fecha: string;
  usuarioGenero: string;
  moneda: string;
  tipoPago: 'Contado' | 'Crédito';
  detalles: CreditInvoiceDetalle[];
  subtotal: number;
  iva: number;
  total: number;
  createdAt: string;
}

const EMPTY_CREDIT_INVOICE: CreditInvoiceItem = {
  id: '',
  numeroFactura: '',
  cajaId: '',
  cajaNombre: '',
  asesorId: '',
  asesorNombre: '',
  asesorTipo: 'promotor',
  clientName: '',
  fecha: '',
  usuarioGenero: '',
  moneda: '',
  tipoPago: 'Crédito',
  detalles: [],
  subtotal: 0,
  iva: 0,
  total: 0,
  createdAt: '',
};

const formatCreditInvoiceDate = (isoDate: string) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toISOString().slice(0, 10);
};

const mapInvoiceToCreditItem = (invoice: ServerInvoiceResponse): CreditInvoiceItem => {
  const subtotal = Number(invoice.header.grossTotal || 0);
  const iva = Number((invoice.header.tax1Total || 0) + (invoice.header.tax2Total || 0));
  const total = Number(invoice.header.netTotal || 0);

  return {
    id: String(invoice.header.id),
    numeroFactura: invoice.header.document,
    cajaId: String(invoice.header.warehouse),
    cajaNombre: invoice.header.branchCode || 'Sin sucursal',
    asesorId: invoice.header.promoterCode || 'N/A',
    asesorNombre: invoice.header.promoterName || 'Sin asesor',
    asesorTipo: 'promotor',
    clientName: invoice.header.clientName || 'Sin cliente',
    fecha: formatCreditInvoiceDate(invoice.header.issuedAt),
    usuarioGenero: invoice.header.cashier || 'N/A',
    moneda: 'NIO (Córdoba)',
    tipoPago: 'Crédito',
    detalles: invoice.details.map((detail) => ({
      id: String(detail.id),
      articuloId: detail.article,
      articuloNombre: detail.article,
      precioVendido: Number(detail.salePrice || 0),
      cantidad: Number(detail.quantity || 0),
      subtotal: Number(detail.price || 0) * Number(detail.quantity || 0),
    })),
    subtotal,
    iva,
    total,
    createdAt: invoice.header.issuedAt,
  };
};

type Props = {
  initialRecords: ServerInvoiceResponse[];
  initialError: string | null;
};

export default function CreditoClient({ initialRecords, initialError }: Props) {
  const [activeTab, setActiveTab] = useState<'facturas' | 'abonos'>('facturas');

  // Factura detail view
  const [viewingFactura, setViewingFactura] = useState<FacturaCredito | null>(null);
  const [viewingFacturaAbonos, setViewingFacturaAbonos] = useState(false);

  // Facturas de crédito (datos reales, ya resueltos en el servidor)
  const [creditInvoices] = useState<CreditInvoiceItem[]>(() =>
    initialRecords.map(mapInvoiceToCreditItem),
  );
  const [creditInvoicesError] = useState<string | null>(initialError);
  const [viewingCreditInvoice, setViewingCreditInvoice] = useState<CreditInvoiceItem | null>(null);

  // Facturas state
  const [facturasSearch, setFacturasSearch] = useState('');
  const [facturasCurrentPage, setFacturasCurrentPage] = useState(1);
  const [facturasRowsPerPage, setFacturasRowsPerPage] = useState(10);
  const [facturasSortColumn, setFacturasSortColumn] = useState<'fecha' | 'total'>('fecha');
  const [facturasSortDirection, setFacturasSortDirection] = useState<'asc' | 'desc'>('desc');

  // Abonos state
  const [abonosSearch, setAbonosSearch] = useState('');
  const [abonosCurrentPage, setAbonosCurrentPage] = useState(1);
  const [abonosRowsPerPage, setAbonosRowsPerPage] = useState(10);
  const [abonosSortColumn, setAbonosSortColumn] = useState<'fecha' | 'montoAbono'>('fecha');
  const [abonosSortDirection, setAbonosSortDirection] = useState<'asc' | 'desc'>('desc');

  // Facturas filtering and sorting
  const filteredFacturas = creditInvoices.filter(factura => {
    const matchesSearch = factura.numeroFactura.toLowerCase().includes(facturasSearch.toLowerCase()) ||
                          factura.asesorNombre.toLowerCase().includes(facturasSearch.toLowerCase()) ||
                          factura.clientName.toLowerCase().includes(facturasSearch.toLowerCase()) ||
                          factura.cajaNombre.toLowerCase().includes(facturasSearch.toLowerCase());
    return matchesSearch;
  });

  const sortedFacturas = [...filteredFacturas].sort((a, b) => {
    const compareA: string | number = a[facturasSortColumn];
    const compareB: string | number = b[facturasSortColumn];
    if (compareA < compareB) return facturasSortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return facturasSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const facturasTotalPages = Math.ceil(sortedFacturas.length / facturasRowsPerPage);
  const paginatedFacturas = sortedFacturas.slice(
    (facturasCurrentPage - 1) * facturasRowsPerPage,
    facturasCurrentPage * facturasRowsPerPage
  );

  // Abonos filtering and sorting
  const filteredAbonos = abonosData.filter(abono => {
    const matchesSearch = abono.numeroFactura.toLowerCase().includes(abonosSearch.toLowerCase()) ||
                          abono.asesorNombre.toLowerCase().includes(abonosSearch.toLowerCase()) ||
                          abono.cajaNombre.toLowerCase().includes(abonosSearch.toLowerCase()) ||
                          abono.descripcion.toLowerCase().includes(abonosSearch.toLowerCase());
    return matchesSearch;
  });

  const sortedAbonos = [...filteredAbonos].sort((a, b) => {
    const compareA: string | number = a[abonosSortColumn];
    const compareB: string | number = b[abonosSortColumn];
    if (compareA < compareB) return abonosSortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return abonosSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const abonosTotalPages = Math.ceil(sortedAbonos.length / abonosRowsPerPage);
  const paginatedAbonos = sortedAbonos.slice(
    (abonosCurrentPage - 1) * abonosRowsPerPage,
    abonosCurrentPage * abonosRowsPerPage
  );

  const handleFacturasSort = (column: typeof facturasSortColumn) => {
    if (facturasSortColumn === column) {
      setFacturasSortDirection(facturasSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFacturasSortColumn(column);
      setFacturasSortDirection('asc');
    }
  };

  const handleAbonosSort = (column: typeof abonosSortColumn) => {
    if (abonosSortColumn === column) {
      setAbonosSortDirection(abonosSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAbonosSortColumn(column);
      setAbonosSortDirection('asc');
    }
  };

  const getAbonosByFactura = (facturaId: string) => {
    return abonosData.filter(a => a.facturaId === facturaId);
  };

  // Factura Detail with Abonos View
  if (viewingFactura && viewingFacturaAbonos) {
    const facturasAbonos = getAbonosByFactura(viewingFactura.id);

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Receipt size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Factura {viewingFactura.numeroFactura}</h2>
                  <p className="text-muted-foreground">Abonos realizados</p>
                </div>
              </div>
              <MaterialButton
                variant="outlined"
                color="secondary"
                startIcon={<X size={18} />}
                onClick={() => {
                  setViewingFactura(null);
                  setViewingFacturaAbonos(false);
                }}
              >
                Cerrar
              </MaterialButton>
            </div>
          </div>

          {/* Factura Info */}
          <div className="bg-surface rounded elevation-2 p-6 mb-6">
            <h3 className="text-foreground mb-4">Información de la Factura</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Asesor:</span>
                <p className="text-foreground">{viewingFactura.asesorNombre}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>
                <p className="text-foreground">{viewingFactura.fecha}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Caja:</span>
                <p className="text-foreground">{viewingFactura.cajaNombre}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Moneda:</span>
                <p className="text-foreground">{viewingFactura.moneda}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Subtotal:</span>
                <p className="text-foreground font-mono">{viewingFactura.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">IVA:</span>
                <p className="text-foreground font-mono">{viewingFactura.iva.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="text-foreground font-mono">{viewingFactura.total.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Saldo Pendiente:</span>
                <p className={`font-mono ${
                  viewingFactura.saldoPendiente === 0 ? 'text-green-600' : 'text-primary'
                }`}>
                  {viewingFactura.saldoPendiente.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Abonos List */}
          <div className="bg-surface rounded elevation-2 p-6">
            <h3 className="text-foreground mb-4">Abonos Registrados ({facturasAbonos.length})</h3>
            {facturasAbonos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Fecha</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Saldo Anterior</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Monto Abonado</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Saldo Nuevo</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Usuario</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {facturasAbonos.map(abono => (
                      <tr key={abono.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 text-sm text-foreground">{abono.fecha}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {abono.saldoAnterior.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 text-right font-mono">
                          -{abono.montoAbono.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-mono ${
                            abono.saldoNuevo === 0 ? 'text-green-600' : 'text-primary'
                          }`}>
                            {abono.saldoNuevo.toFixed(2)}
                            {abono.saldoNuevo === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Pagado
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.usuarioRegistro}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{abono.descripcion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No hay abonos registrados para esta factura</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main View with Tabs
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={32} className="text-primary" />
            <h2 className="text-foreground">Gestión de Crédito</h2>
          </div>
          <p className="text-muted-foreground">
            Panel central para facturas de crédito y abonos
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-surface rounded elevation-2 mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('facturas')}
              className={`px-6 py-4 text-sm transition-colors ${
                activeTab === 'facturas'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt size={18} />
                <span>Facturas de Crédito</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('abonos')}
              className={`px-6 py-4 text-sm transition-colors ${
                activeTab === 'abonos'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={18} />
                <span>Abonos</span>
              </div>
            </button>
          </div>
        </div>

        {/* Facturas Tab */}
        {activeTab === 'facturas' && (
          <>
            {/* Filters */}
            <details className="group bg-surface rounded elevation-2 p-4 mb-6" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
                <span>Filtros de búsqueda</span>
                <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por número, asesor o caja..."
                    value={facturasSearch}
                    onChange={(e) => setFacturasSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border
                             focus:border-primary rounded-t transition-colors outline-none"
                  />
                </div>

                <div className="relative">
                  <select
                    value={facturasRowsPerPage}
                    onChange={(e) => {
                      setFacturasRowsPerPage(Number(e.target.value));
                      setFacturasCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-input-background border-b-2 border-border
                             focus:border-primary rounded-t transition-colors outline-none appearance-none"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </details>

            {/* Facturas Table */}
            {creditInvoicesError ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-sm text-red-700">
                No se pudieron cargar las facturas de crédito: {creditInvoicesError}
              </div>
            ) : null}

            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Número</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Cliente</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Asesor</th>
                      <th
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleFacturasSort('fecha')}
                      >
                        <div className="flex items-center gap-2">
                          Fecha
                          {facturasSortColumn === 'fecha' && (
                            facturasSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Sucursal</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Subtotal</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">IVA</th>
                      <th
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleFacturasSort('total')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total
                          {facturasSortColumn === 'total' && (
                            facturasSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedFacturas.length > 0 ? (
                      paginatedFacturas.map(factura => (
                        <tr key={factura.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-foreground font-mono">{factura.numeroFactura}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{factura.clientName}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{factura.asesorNombre}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{factura.fecha}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{factura.cajaNombre}</td>
                          <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.subtotal.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.iva.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.total.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<Eye size={16} />}
                              onClick={() => setViewingCreditInvoice(factura)}
                            >
                              Ver Detalle
                            </MaterialButton>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-sm text-muted-foreground">
                          No hay facturas de crédito para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(facturasCurrentPage - 1) * facturasRowsPerPage + 1} a {Math.min(facturasCurrentPage * facturasRowsPerPage, sortedFacturas.length)} de {sortedFacturas.length} facturas
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setFacturasCurrentPage(Math.max(1, facturasCurrentPage - 1))}
                  disabled={facturasCurrentPage === 1}
                >
                  Anterior
                </MaterialButton>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-foreground">
                    Página {facturasCurrentPage} de {facturasTotalPages}
                  </span>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setFacturasCurrentPage(Math.min(facturasTotalPages, facturasCurrentPage + 1))}
                  disabled={facturasCurrentPage === facturasTotalPages}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>
          </>
        )}

        {/* Abonos Tab */}
        {activeTab === 'abonos' && (
          <>
            {/* Filters */}
            <details className="group bg-surface rounded elevation-2 p-4 mb-6" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-foreground [&::-webkit-details-marker]:hidden">
                <span>Filtros de búsqueda</span>
                <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por factura, asesor, caja o descripción..."
                    value={abonosSearch}
                    onChange={(e) => setAbonosSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border
                             focus:border-primary rounded-t transition-colors outline-none"
                  />
                </div>

                <div className="relative">
                  <select
                    value={abonosRowsPerPage}
                    onChange={(e) => {
                      setAbonosRowsPerPage(Number(e.target.value));
                      setAbonosCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-input-background border-b-2 border-border
                             focus:border-primary rounded-t transition-colors outline-none appearance-none"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </details>

            {/* Abonos Table */}
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Factura</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Asesor</th>
                      <th
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleAbonosSort('fecha')}
                      >
                        <div className="flex items-center gap-2">
                          Fecha
                          {abonosSortColumn === 'fecha' && (
                            abonosSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleAbonosSort('montoAbono')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Monto Abonado
                          {abonosSortColumn === 'montoAbono' && (
                            abonosSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Usuario</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                      <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedAbonos.map(abono => (
                      <tr key={abono.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground font-mono">{abono.numeroFactura}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.asesorNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.fecha}</td>
                        <td className="px-6 py-4 text-sm text-green-600 text-right font-mono">
                          -{abono.montoAbono.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.usuarioRegistro}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {abono.descripcion || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Eye size={16} />}
                            onClick={() => {
                              const factura = facturasData.find(f => f.id === abono.facturaId);
                              if (factura) {
                                setViewingFactura(factura);
                                setViewingFacturaAbonos(true);
                              }
                            }}
                          >
                            Ver Factura
                          </MaterialButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(abonosCurrentPage - 1) * abonosRowsPerPage + 1} a {Math.min(abonosCurrentPage * abonosRowsPerPage, sortedAbonos.length)} de {sortedAbonos.length} abonos
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setAbonosCurrentPage(Math.max(1, abonosCurrentPage - 1))}
                  disabled={abonosCurrentPage === 1}
                >
                  Anterior
                </MaterialButton>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-foreground">
                    Página {abonosCurrentPage} de {abonosTotalPages}
                  </span>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setAbonosCurrentPage(Math.min(abonosTotalPages, abonosCurrentPage + 1))}
                  disabled={abonosCurrentPage === abonosTotalPages}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>
          </>
        )}
      </div>

      <VerDetalle
        editingFactura={viewingCreditInvoice ?? EMPTY_CREDIT_INVOICE}
        isOpen={viewingCreditInvoice !== null}
        onClose={() => setViewingCreditInvoice(null)}
      />
    </div>
  );
}
