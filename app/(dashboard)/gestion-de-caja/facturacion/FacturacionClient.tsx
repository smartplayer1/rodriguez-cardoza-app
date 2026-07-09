"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialButton } from "@/components/MaterialButton";
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Eye,
  CreditCard,
  Edit,
  Upload,
} from "lucide-react";
import VerDetalle from "./modals/VerDetalle";
import ImportarFactura from "./modals/ImportarFactura";
import EditarFactura from "./modals/EditarFactura";
import { getInvoices, updateInvoice } from "@/app/services/invoice";
import {
  InvoicePaging,
  ServerInvoiceResponse,
  ServerInvoiceUpdatePayload,
} from "@/app/type/invoice";
import ClientSelector, {
  type ClientSearchItem,
} from "../cobros/client-selector";

interface FacturaDetalle {
  id: string;
  articuloId: string;
  articuloNombre: string;
  precioVendido: number;
  cantidad: number;
  subtotal: number;
  esBonificacion?: boolean;
}

interface Factura {
  id: string;
  numeroFactura: string;
  cajaId: string;
  cajaNombre: string;
  asesorId: string;
  asesorNombre: string;
  clientName: string;
  asesorTipo: "promotor" | "empleado";
  fecha: string;
  usuarioGenero: string;
  moneda: string;
  tipoPago: "Contado" | "Crédito";
  detalles: FacturaDetalle[];
  subtotal: number;
  iva: number;
  total: number;
  createdAt: string;
  bonificacionesAplicadas?: string[];
}

type InitialFilters = {
  document: string;
  chargeStatus: string;
  clientCode: string;
  branchCode: string;
  issuedAt: string;
  page: number;
  perPage: number;
};

type BranchOption = {
  code: string;
  label: string;
};

type Props = {
  initialRecords: ServerInvoiceResponse[];
  initialPaging: InvoicePaging;
  initialFilters: InitialFilters;
  initialError?: string | null;
  clientOptions: ClientSearchItem[];
  branchOptions: BranchOption[];
};

const mapChargeStatusToTipoPago = (
  chargeStatus: string,
): "Contado" | "Crédito" => {
  const normalized = (chargeStatus || "").toLowerCase();
  return normalized.includes("credit") || normalized.includes("cr")
    ? "Crédito"
    : "Contado";
};

const formatDate = (isoDate: string) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return date.toISOString().slice(0, 10);
};

const mapInvoiceToFactura = (invoice: ServerInvoiceResponse): Factura => {
  const subtotal = Number(invoice.header.grossTotal || 0);
  const iva = Number(
    (invoice.header.tax1Total || 0) + (invoice.header.tax2Total || 0),
  );
  const total = Number(invoice.header.netTotal || 0);

  return {
    id: String(invoice.header.id),
    numeroFactura: invoice.header.document,
    cajaId: String(invoice.header.warehouse),
    cajaNombre: invoice.header.branchCode || "Sin sucursal",
    asesorId: invoice.header.promoterCode || "N/A",
    asesorNombre: invoice.header.promoterName || "Sin asesor",
    asesorTipo: "promotor",
    clientName: invoice.header.clientName || "Sin cliente",
    fecha: formatDate(invoice.header.issuedAt),
    usuarioGenero: invoice.header.cashier || "N/A",
    moneda: "NIO (Córdoba)",
    tipoPago: mapChargeStatusToTipoPago(invoice.header.chargeStatus),
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

export default function FacturacionClient({
  initialRecords,
  initialPaging,
  initialFilters,
  initialError = null,
  clientOptions,
  branchOptions,
}: Props) {
  const [facturas, setFacturas] = useState<Factura[]>(() =>
    initialRecords.map(mapInvoiceToFactura),
  );
  const [serverInvoices, setServerInvoices] =
    useState<ServerInvoiceResponse[]>(initialRecords);
  const [paging, setPaging] = useState<InvoicePaging>(initialPaging);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(initialError);

  const [showDetail, setShowDetail] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoiceServer, setEditingInvoiceServer] =
    useState<ServerInvoiceResponse | null>(null);

  const [documentFilter, setDocumentFilter] = useState(initialFilters.document);
  const [filterTipoPago, setFilterTipoPago] = useState<
    "todos" | "Contado" | "Crédito"
  >(() => {
    if (initialFilters.chargeStatus === "Contado") return "Contado";
    if (initialFilters.chargeStatus === "Crédito") return "Crédito";
    return "todos";
  });
  const [clientCodeFilter, setClientCodeFilter] = useState(
    initialFilters.clientCode,
  );
  const [branchCodeFilter, setBranchCodeFilter] = useState(
    initialFilters.branchCode,
  );
  const [issuedAtFilter, setIssuedAtFilter] = useState(initialFilters.issuedAt);
  const [currentPage, setCurrentPage] = useState(initialFilters.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialFilters.perPage);

  const [sortColumn, setSortColumn] = useState<
    "numeroFactura" | "fecha" | "total"
  >("fecha");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [showImportModal, setShowImportModal] = useState(false);

  const loadFacturas = useCallback(async () => {
    setLoadingInvoices(true);
    setFetchError(null);

    try {
      const response = await getInvoices({
        document: documentFilter.trim() || undefined,
        chargeStatus: filterTipoPago === "todos" ? undefined : filterTipoPago,
        clientCode: clientCodeFilter.trim() || undefined,
        branchCode: branchCodeFilter.trim() || undefined,
        issuedAt: issuedAtFilter.trim() || undefined,
        page: currentPage,
        perPage: rowsPerPage,
      });

      const records = response.records || [];
      setServerInvoices(records);
      setFacturas(records.map(mapInvoiceToFactura));
      setPaging(
        response.paging || {
          perPage: rowsPerPage,
          currentPage,
          totalRecords: records.length,
          totalPages: 1,
        },
      );
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      setFetchError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las facturas",
      );
      setServerInvoices([]);
      setFacturas([]);
      setPaging({
        perPage: rowsPerPage,
        currentPage,
        totalRecords: 0,
        totalPages: 1,
      });
    } finally {
      setLoadingInvoices(false);
    }
  }, [
    branchCodeFilter,
    clientCodeFilter,
    currentPage,
    documentFilter,
    filterTipoPago,
    issuedAtFilter,
    rowsPerPage,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFacturas();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadFacturas]);

  const handleViewDetail = (factura: Factura) => {
    setEditingFactura(factura);
    setShowDetail(true);
  };

  const handleCancel = () => {
    setShowDetail(false);
    setEditingFactura(null);
  };

  const handleEdit = (factura: Factura) => {
    const sourceInvoice = serverInvoices.find(
      (item) => String(item.header.id) === factura.id,
    );

    if (!sourceInvoice) {
      alert("No se pudo encontrar la factura original para editar.");
      return;
    }

    setEditingInvoiceServer(sourceInvoice);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (payload: ServerInvoiceUpdatePayload) => {
    await updateInvoice(payload);
    await loadFacturas();
  };

  const handleGenerarCobro = (facturaId: string) => {
    console.log("Generar cobro para factura:", facturaId);
  };

  const handleCloseImportModal = useCallback(async () => {
    setShowImportModal(false);
    await loadFacturas();
  }, [loadFacturas]);

  const sortedFacturas = useMemo(() => {
    const list = [...facturas];

    return list.sort((a, b) => {
      const compareA = a[sortColumn];
      const compareB = b[sortColumn];

      if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
      if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [facturas, sortColumn, sortDirection]);

  const totalPages = Math.max(1, paging.totalPages || 1);

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Receipt size={32} className="text-primary" />
              <h2 className="text-foreground">Facturación</h2>
            </div>
            <p className="text-muted-foreground">
              Gestione las facturas de venta
            </p>
          </div>
          <div className="flex flex-row">
            <MaterialButton
              variant="contained"
              color="secondary"
              className="gap-2 ml-0.5 mr-0.5"
              onClick={() => {
                setShowImportModal(true);
              }}
            >
              <Upload className="size-4" />
              Importar Excel
            </MaterialButton>
          </div>
        </div>

        <div className="bg-surface rounded elevation-2 p-4 mb-6 space-y-4">
          <ClientSelector
            clients={clientOptions}
            loading={false}
            error={null}
            selectedClientCode={clientCodeFilter}
            onSelectClient={(code) => {
              setClientCodeFilter(code);
              setCurrentPage(1);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Filtrar por documento..."
                value={documentFilter}
                onChange={(e) => {
                  setDocumentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            <div className="relative">
              <Filter
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                value={filterTipoPago}
                onChange={(e) => {
                  setFilterTipoPago(
                    e.target.value as "todos" | "Contado" | "Crédito",
                  );
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todos">Todos los tipos</option>
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
              <ChevronDown
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
              <ChevronDown
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={branchCodeFilter}
                onChange={(e) => {
                  setBranchCodeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="">Todas las sucursales</option>
                {branchOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            <input
              type="date"
              value={issuedAtFilter}
              onChange={(e) => {
                setIssuedAtFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
            />
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {loadingInvoices ? (
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <h3 className="text-foreground mb-2">Cargando facturas...</h3>
            <p className="text-muted-foreground">Espere un momento</p>
          </div>
        ) : sortedFacturas.length > 0 ? (
          <>
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort("numeroFactura")}
                      >
                        <div className="flex items-center gap-2">
                          N° Factura
                          {sortColumn === "numeroFactura" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">
                        Caja
                      </th>
                      <th
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort("fecha")}
                      >
                        <div className="flex items-center gap-2">
                          Fecha
                          {sortColumn === "fecha" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">
                        Asesor
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">
                        Tipo de Pago
                      </th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">
                        Subtotal
                      </th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">
                        IVA
                      </th>
                      <th
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort("total")}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total
                          {sortColumn === "total" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedFacturas.map((factura) => (
                      <tr
                        key={factura.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Receipt size={20} className="text-primary" />
                            </div>
                            <span className="text-foreground">
                              {factura.numeroFactura}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {factura.cajaNombre}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {factura.fecha}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-foreground">
                              {factura.asesorNombre}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              ({factura.asesorTipo})
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs ${factura.tipoPago === "Contado" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {factura.tipoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {factura.subtotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                          {factura.iva.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary text-right font-mono">
                          <strong>{factura.total.toFixed(2)}</strong>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {factura.usuarioGenero}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <MaterialButton
                              variant="text"
                              color="secondary"
                              startIcon={<Edit size={16} />}
                              onClick={() => handleEdit(factura)}
                            >
                              Editar
                            </MaterialButton>
                            <MaterialButton
                              variant="text"
                              color="primary"
                              startIcon={<Eye size={16} />}
                              onClick={() => handleViewDetail(factura)}
                            >
                              Ver Detalle
                            </MaterialButton>
                            {factura.tipoPago === "Crédito" && (
                              <MaterialButton
                                variant="text"
                                color="primary"
                                startIcon={<CreditCard size={16} />}
                                onClick={() => handleGenerarCobro(factura.id)}
                              >
                                Generar Cobro
                              </MaterialButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(paging.currentPage - 1) * paging.perPage + 1} a{" "}
                {Math.min(
                  paging.currentPage * paging.perPage,
                  paging.totalRecords,
                )}{" "}
                de {paging.totalRecords} facturas
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </MaterialButton>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>

            <VerDetalle
              editingFactura={editingFactura!}
              isOpen={showDetail}
              onClose={handleCancel}
            />
            <ImportarFactura
              open={showImportModal}
              onClose={() => void handleCloseImportModal()}
            />
            <EditarFactura
              isOpen={showEditModal}
              invoice={editingInvoiceServer}
              onClose={() => {
                setShowEditModal(false);
                setEditingInvoiceServer(null);
              }}
              onSave={handleSaveEdit}
            />
          </>
        ) : (
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Receipt size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">
              No hay facturas registradas
            </h3>
            <p className="text-muted-foreground mb-6">
              Comience creando una nueva factura
            </p>
            <MaterialButton
              variant="contained"
              color="secondary"
              className="gap-2 ml-0.5 mr-0.5"
              onClick={() => {
                setShowImportModal(true);
              }}
            >
              <Upload className="size-4" />
              Importar Excel
            </MaterialButton>
            <ImportarFactura
              open={showImportModal}
              onClose={() => void handleCloseImportModal()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
