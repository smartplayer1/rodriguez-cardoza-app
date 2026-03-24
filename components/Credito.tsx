import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { CreditCard, Users, Receipt, DollarSign, Search, Filter, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';

// Interfaces
interface Asesor {
  id: string;
  codigo: string;
  nombreCompleto: string;
  tipo: 'promotor' | 'empleado';
  sucursal: string;
  telefono?: string;
  email: string;
}

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

// Mock data - Asesores
const asesoresData: Asesor[] = [
  {
    id: 'A1',
    codigo: 'PROM-001',
    nombreCompleto: 'María José López García',
    tipo: 'promotor',
    sucursal: 'Sucursal Central',
    telefono: '+505 8888-9999',
    email: 'maria.lopez@rc.com'
  },
  {
    id: 'A2',
    codigo: 'EMP-001',
    nombreCompleto: 'Roberto García Sánchez',
    tipo: 'empleado',
    sucursal: 'Sucursal León',
    telefono: '+505 7777-6666',
    email: 'roberto.garcia@rc.com'
  },
  {
    id: 'A3',
    codigo: 'PROM-002',
    nombreCompleto: 'Patricia López Rodríguez',
    tipo: 'promotor',
    sucursal: 'Sucursal Central',
    telefono: '+505 9999-8888',
    email: 'patricia.lopez@rc.com'
  },
  {
    id: 'A4',
    codigo: 'EMP-002',
    nombreCompleto: 'Carlos Méndez Torres',
    tipo: 'empleado',
    sucursal: 'Sucursal Granada',
    email: 'carlos.mendez@rc.com'
  }
];

// Mock data - Facturas de Crédito
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

export default function Credito() {
  const [activeTab, setActiveTab] = useState<'asesores' | 'facturas' | 'abonos'>('asesores');
  
  // Asesor detail view
  const [viewingAsesor, setViewingAsesor] = useState<Asesor | null>(null);
  
  // Factura detail view
  const [viewingFactura, setViewingFactura] = useState<FacturaCredito | null>(null);
  const [viewingFacturaAbonos, setViewingFacturaAbonos] = useState(false);

  // Asesores state
  const [asesoresSearch, setAsesoresSearch] = useState('');
  const [asesoresCurrentPage, setAsesoresCurrentPage] = useState(1);
  const [asesoresRowsPerPage, setAsesoresRowsPerPage] = useState(10);
  const [asesoresSortColumn, setAsesoresSortColumn] = useState<'nombreCompleto' | 'codigo' | 'sucursal'>('nombreCompleto');
  const [asesoresSortDirection, setAsesoresSortDirection] = useState<'asc' | 'desc'>('asc');
  const [asesoresFilterTipo, setAsesoresFilterTipo] = useState<'todos' | 'promotor' | 'empleado'>('todos');

  // Facturas state
  const [facturasSearch, setFacturasSearch] = useState('');
  const [facturasCurrentPage, setFacturasCurrentPage] = useState(1);
  const [facturasRowsPerPage, setFacturasRowsPerPage] = useState(10);
  const [facturasSortColumn, setFacturasSortColumn] = useState<'fecha' | 'total' | 'saldoPendiente'>('fecha');
  const [facturasSortDirection, setFacturasSortDirection] = useState<'asc' | 'desc'>('desc');

  // Abonos state
  const [abonosSearch, setAbonosSearch] = useState('');
  const [abonosCurrentPage, setAbonosCurrentPage] = useState(1);
  const [abonosRowsPerPage, setAbonosRowsPerPage] = useState(10);
  const [abonosSortColumn, setAbonosSortColumn] = useState<'fecha' | 'montoAbono'>('fecha');
  const [abonosSortDirection, setAbonosSortDirection] = useState<'asc' | 'desc'>('desc');

  // Asesores filtering and sorting
  const filteredAsesores = asesoresData.filter(asesor => {
    const matchesSearch = asesor.nombreCompleto.toLowerCase().includes(asesoresSearch.toLowerCase()) ||
                          asesor.codigo.toLowerCase().includes(asesoresSearch.toLowerCase()) ||
                          asesor.sucursal.toLowerCase().includes(asesoresSearch.toLowerCase()) ||
                          (asesor.telefono || '').toLowerCase().includes(asesoresSearch.toLowerCase());
    const matchesTipo = asesoresFilterTipo === 'todos' || asesor.tipo === asesoresFilterTipo;
    return matchesSearch && matchesTipo;
  });

  const sortedAsesores = [...filteredAsesores].sort((a, b) => {
    let compareA: any = a[asesoresSortColumn];
    let compareB: any = b[asesoresSortColumn];
    if (compareA < compareB) return asesoresSortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return asesoresSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const asesoresTotalPages = Math.ceil(sortedAsesores.length / asesoresRowsPerPage);
  const paginatedAsesores = sortedAsesores.slice(
    (asesoresCurrentPage - 1) * asesoresRowsPerPage,
    asesoresCurrentPage * asesoresRowsPerPage
  );

  // Facturas filtering and sorting
  const filteredFacturas = facturasData.filter(factura => {
    const matchesSearch = factura.numeroFactura.toLowerCase().includes(facturasSearch.toLowerCase()) ||
                          factura.asesorNombre.toLowerCase().includes(facturasSearch.toLowerCase()) ||
                          factura.cajaNombre.toLowerCase().includes(facturasSearch.toLowerCase());
    return matchesSearch;
  });

  const sortedFacturas = [...filteredFacturas].sort((a, b) => {
    let compareA: any = a[facturasSortColumn];
    let compareB: any = b[facturasSortColumn];
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
    let compareA: any = a[abonosSortColumn];
    let compareB: any = b[abonosSortColumn];
    if (compareA < compareB) return abonosSortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return abonosSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const abonosTotalPages = Math.ceil(sortedAbonos.length / abonosRowsPerPage);
  const paginatedAbonos = sortedAbonos.slice(
    (abonosCurrentPage - 1) * abonosRowsPerPage,
    abonosCurrentPage * abonosRowsPerPage
  );

  const handleAsesoresSort = (column: typeof asesoresSortColumn) => {
    if (asesoresSortColumn === column) {
      setAsesoresSortDirection(asesoresSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAsesoresSortColumn(column);
      setAsesoresSortDirection('asc');
    }
  };

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

  const getFacturasByAsesor = (asesorId: string) => {
    return facturasData.filter(f => f.asesorId === asesorId);
  };

  const getAbonosByAsesor = (asesorId: string) => {
    const facturas = getFacturasByAsesor(asesorId);
    const facturaIds = facturas.map(f => f.id);
    return abonosData.filter(a => facturaIds.includes(a.facturaId));
  };

  const getAbonosByFactura = (facturaId: string) => {
    return abonosData.filter(a => a.facturaId === facturaId);
  };

  // Asesor Detail View
  if (viewingAsesor) {
    const facturasAsesor = getFacturasByAsesor(viewingAsesor.id);
    const abonosAsesor = getAbonosByAsesor(viewingAsesor.id);

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users size={32} className="text-primary" />
                <div>
                  <h2 className="text-foreground">Detalle del Asesor</h2>
                  <p className="text-muted-foreground">{viewingAsesor.nombreCompleto}</p>
                </div>
              </div>
              <MaterialButton
                variant="outlined"
                color="secondary"
                startIcon={<X size={18} />}
                onClick={() => setViewingAsesor(null)}
              >
                Cerrar
              </MaterialButton>
            </div>
          </div>

          {/* Asesor Info */}
          <div className="bg-surface rounded elevation-2 p-6 mb-6">
            <h3 className="text-foreground mb-4">Información del Asesor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Código:</span>
                <p className="text-foreground">{viewingAsesor.codigo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="text-foreground capitalize">{viewingAsesor.tipo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sucursal:</span>
                <p className="text-foreground">{viewingAsesor.sucursal}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>
                <p className="text-foreground">{viewingAsesor.telefono || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="text-foreground">{viewingAsesor.email}</p>
              </div>
            </div>
          </div>

          {/* Facturas de Crédito */}
          <div className="bg-surface rounded elevation-2 p-6 mb-6">
            <h3 className="text-foreground mb-4">Facturas de Crédito ({facturasAsesor.length})</h3>
            {facturasAsesor.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Número</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Fecha</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Total</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Saldo Pendiente</th>
                      <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {facturasAsesor.map(factura => (
                      <tr key={factura.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 text-sm text-foreground">{factura.numeroFactura}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.fecha}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-mono ${
                            factura.saldoPendiente === 0 ? 'text-green-600' : 'text-primary'
                          }`}>
                            {factura.saldoPendiente.toFixed(2)}
                            {factura.saldoPendiente === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Pagado
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Eye size={16} />}
                            onClick={() => {
                              setViewingFactura(factura);
                              setViewingFacturaAbonos(true);
                            }}
                          >
                            Ver Abonos
                          </MaterialButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No hay facturas de crédito para este asesor</p>
            )}
          </div>

          {/* Abonos */}
          <div className="bg-surface rounded elevation-2 p-6">
            <h3 className="text-foreground mb-4">Todos los Abonos ({abonosAsesor.length})</h3>
            {abonosAsesor.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Factura</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Fecha</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Monto Abonado</th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {abonosAsesor.map(abono => (
                      <tr key={abono.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 text-sm text-foreground">{abono.numeroFactura}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.fecha}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-green-600 text-right font-mono">
                          -{abono.montoAbono.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{abono.usuarioRegistro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No hay abonos registrados para este asesor</p>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            Panel central para asesores, facturas de crédito y abonos
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-surface rounded elevation-2 mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('asesores')}
              className={`px-6 py-4 text-sm transition-colors ${
                activeTab === 'asesores'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span>Asesores</span>
              </div>
            </button>
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

        {/* Asesores Tab */}
        {activeTab === 'asesores' && (
          <>
            {/* Filters */}
            <div className="bg-surface rounded elevation-2 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, código, sucursal..."
                    value={asesoresSearch}
                    onChange={(e) => setAsesoresSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none"
                  />
                </div>

                <div className="relative">
                  <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={asesoresFilterTipo}
                    onChange={(e) => {
                      setAsesoresFilterTipo(e.target.value as any);
                      setAsesoresCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none appearance-none"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="promotor">Promotores</option>
                    <option value="empleado">Empleados</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={asesoresRowsPerPage}
                    onChange={(e) => {
                      setAsesoresRowsPerPage(Number(e.target.value));
                      setAsesoresCurrentPage(1);
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
            </div>

            {/* Asesores Table */}
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleAsesoresSort('nombreCompleto')}
                      >
                        <div className="flex items-center gap-2">
                          Nombre Completo
                          {asesoresSortColumn === 'nombreCompleto' && (
                            asesoresSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleAsesoresSort('codigo')}
                      >
                        <div className="flex items-center gap-2">
                          Código
                          {asesoresSortColumn === 'codigo' && (
                            asesoresSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Tipo</th>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleAsesoresSort('sucursal')}
                      >
                        <div className="flex items-center gap-2">
                          Sucursal
                          {asesoresSortColumn === 'sucursal' && (
                            asesoresSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Teléfono</th>
                      <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedAsesores.map(asesor => (
                      <tr key={asesor.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground">{asesor.nombreCompleto}</td>
                        <td className="px-6 py-4 text-sm text-foreground font-mono">{asesor.codigo}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            asesor.tipo === 'promotor' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {asesor.tipo === 'promotor' ? 'Promotor' : 'Empleado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{asesor.sucursal}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{asesor.telefono || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Eye size={16} />}
                            onClick={() => setViewingAsesor(asesor)}
                          >
                            Ver Detalle
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
                Mostrando {(asesoresCurrentPage - 1) * asesoresRowsPerPage + 1} a {Math.min(asesoresCurrentPage * asesoresRowsPerPage, sortedAsesores.length)} de {sortedAsesores.length} asesores
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setAsesoresCurrentPage(Math.max(1, asesoresCurrentPage - 1))}
                  disabled={asesoresCurrentPage === 1}
                >
                  Anterior
                </MaterialButton>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-foreground">
                    Página {asesoresCurrentPage} de {asesoresTotalPages}
                  </span>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setAsesoresCurrentPage(Math.min(asesoresTotalPages, asesoresCurrentPage + 1))}
                  disabled={asesoresCurrentPage === asesoresTotalPages}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>
          </>
        )}

        {/* Facturas Tab */}
        {activeTab === 'facturas' && (
          <>
            {/* Filters */}
            <div className="bg-surface rounded elevation-2 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Facturas Table */}
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Número</th>
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
                      <th className="px-6 py-4 text-left text-sm text-foreground">Caja</th>
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
                      <th 
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleFacturasSort('saldoPendiente')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Saldo Pendiente
                          {facturasSortColumn === 'saldoPendiente' && (
                            facturasSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedFacturas.map(factura => (
                      <tr key={factura.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground font-mono">{factura.numeroFactura}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.asesorNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.fecha}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{factura.cajaNombre}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.subtotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.iva.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">{factura.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-mono ${
                            factura.saldoPendiente === 0 ? 'text-green-600' : 'text-primary'
                          }`}>
                            {factura.saldoPendiente.toFixed(2)}
                            {factura.saldoPendiente === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Pagado
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Eye size={16} />}
                            onClick={() => {
                              setViewingFactura(factura);
                              setViewingFacturaAbonos(true);
                            }}
                          >
                            Ver Abonos
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
            <div className="bg-surface rounded elevation-2 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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
    </div>
  );
}
