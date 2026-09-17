"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialButton } from "@/components/MaterialButton";
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  CreditCard,
  Edit,
  Upload,
  Link2,
} from "lucide-react";
import VerDetalle from "./modals/VerDetalle";
import ImportarFactura from "./modals/ImportarFactura";
import EditarFactura from "./modals/EditarFactura";
import RelacionarTransferenciaModal from "./modals/RelacionarTransferencia";
import { getInvoices, updateInvoice } from "@/app/services/invoice";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import {
  InvoicePaging,
  ServerInvoiceResponse,
  ServerInvoiceUpdatePayload,
} from "@/app/type/invoice";
import ClientSelector, {
  type ClientSearchItem,
} from "../cobros/client-selector";
import { useUserStore } from "@/app/store/useUserStore";
import { PERMISSIONS } from "@/app/domain/auth/permissions";

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
  tipoVenta: string;
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

// Ventana de números de página alrededor de la página actual, con el
// primero/último siempre visibles y "…" para los huecos — mismo criterio
// usado en la paginación de Sucursales.
const getPageWindow = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  });

  return result;
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
    tipoVenta: invoice.header.saleType || "N/A",
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
  const { can } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
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
  const [linkingInvoice, setLinkingInvoice] = useState<{
    id: number;
    document: string;
  } | null>(null);

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

  const hasAnyFilter =
    !!documentFilter || !!clientCodeFilter || !!branchCodeFilter || !!issuedAtFilter || filterTipoPago !== "todos";

  const clearFilters = () => {
    setDocumentFilter("");
    setFilterTipoPago("todos");
    setClientCodeFilter("");
    setBranchCodeFilter("");
    setIssuedAtFilter("");
    setCurrentPage(1);
  };

  const inputClassName =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Facturación</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Gestiona las facturas de venta.</p>
          </div>
          {mounted && can(PERMISSIONS.INVOICE_IMPORT_HISTORICAL) && (
            <MaterialButton
              variant="contained"
              color="secondary"
              startIcon={<Upload size={16} />}
              onClick={() => setShowImportModal(true)}
            >
              Importar Excel
            </MaterialButton>
          )}
        </div>

        {/* Barra de filtros */}
        <div className="rounded-2xl border border-border/60 bg-surface px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Buscar por documento</span>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="N° de documento..."
                  value={documentFilter}
                  onChange={(e) => {
                    setDocumentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`${inputClassName} pl-9`}
                />
              </div>
            </label>

            <div className="lg:w-72">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Cliente</span>
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
            </div>

            <label className="w-full space-y-1 lg:w-36">
              <span className="text-xs font-medium text-muted-foreground">Por página</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={inputClassName}
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </label>

            {hasAnyFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>

          <details className="group mt-3">
            <summary className="inline-flex cursor-pointer list-none items-center text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              Más filtros
              <ChevronDown size={14} className="ml-1 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Tipo de pago</span>
                <select
                  value={filterTipoPago}
                  onChange={(e) => {
                    setFilterTipoPago(e.target.value as "todos" | "Contado" | "Crédito");
                    setCurrentPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="Contado">Contado</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Sucursal</span>
                <select
                  value={branchCodeFilter}
                  onChange={(e) => {
                    setBranchCodeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="">Todas las sucursales</option>
                  {branchOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Fecha</span>
                <input
                  type="date"
                  value={issuedAtFilter}
                  onChange={(e) => {
                    setIssuedAtFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={inputClassName}
                />
              </label>
            </div>
          </details>
        </div>

        {/* Línea de resultados */}
        {!fetchError && !loadingInvoices && (
          <p className="text-sm text-muted-foreground">
            {paging.totalRecords === 0
              ? "0 facturas encontradas"
              : `Mostrando ${(paging.currentPage - 1) * paging.perPage + 1}–${Math.min(
                  paging.currentPage * paging.perPage,
                  paging.totalRecords,
                )} de ${paging.totalRecords} facturas`}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
          {fetchError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Receipt size={32} className="text-destructive" />
              <div>
                <p className="text-foreground">No pudimos cargar las facturas.</p>
                <p className="text-sm text-muted-foreground">{fetchError}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadFacturas()}
                className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              >
                Reintentar
              </button>
            </div>
          ) : loadingInvoices ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    {["N° Factura", "Caja", "Fecha", "Asesor", "Tipo de Pago", "Tipo de Venta", "Subtotal", "IVA", "Total", "Usuario", "Acciones"].map(
                      (label) => (
                        <th key={label} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <TableSkeleton columns={11} />
                </tbody>
              </table>
            </div>
          ) : sortedFacturas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <SortableHeader label="N° Factura" column="numeroFactura" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Caja</th>
                    <SortableHeader label="Fecha" column="fecha" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">Asesor</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo de Pago</th>
                    <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground xl:table-cell">Tipo de Venta</th>
                    <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">Subtotal</th>
                    <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">IVA</th>
                    <SortableHeader label="Total" column="total" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right" />
                    <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground xl:table-cell">Usuario</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sortedFacturas.map((factura) => (
                    <tr key={factura.id} className="transition-colors hover:bg-muted/15">
                      <td className="px-4 py-3 font-medium text-foreground">{factura.numeroFactura}</td>
                      <td className="px-4 py-3 text-muted-foreground">{factura.cajaNombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{factura.fecha}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <div className="text-foreground">{factura.asesorNombre}</div>
                        <div className="text-xs capitalize text-muted-foreground">({factura.asesorTipo})</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                            factura.tipoPago === "Contado" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {factura.tipoPago}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">{factura.tipoVenta}</td>
                      <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground md:table-cell">
                        {factura.subtotal.toFixed(2)}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground md:table-cell">{factura.iva.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-primary">{factura.total.toFixed(2)}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">{factura.usuarioGenero}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {mounted && can(PERMISSIONS.INVOICE_EDIT) && (
                            <RowActionButton title="Editar factura" onClick={() => handleEdit(factura)}>
                              <Edit size={15} />
                            </RowActionButton>
                          )}
                          <RowActionButton title="Ver detalle" onClick={() => handleViewDetail(factura)}>
                            <Eye size={15} />
                          </RowActionButton>
                          {factura.tipoPago === "Crédito" && mounted && can(PERMISSIONS.COLLECTION_CREATE) && (
                            <RowActionButton title="Generar cobro" onClick={() => handleGenerarCobro(factura.id)}>
                              <CreditCard size={15} />
                            </RowActionButton>
                          )}
                          {mounted && can(PERMISSIONS.BANK_TRANSFER_CREATE) && (
                            <RowActionButton
                              title="Relacionar transferencia"
                              onClick={() =>
                                setLinkingInvoice({ id: Number(factura.id), document: factura.numeroFactura })
                              }
                            >
                              <Link2 size={15} />
                            </RowActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Receipt size={32} className="text-muted-foreground" />
              <div>
                <p className="text-foreground">Sin facturas encontradas</p>
                <p className="text-sm text-muted-foreground">
                  {hasAnyFilter ? "Prueba modificando los filtros de búsqueda." : "Aún no hay facturas registradas."}
                </p>
              </div>
              {hasAnyFilter ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  Limpiar filtros
                </button>
              ) : (
                mounted &&
                can(PERMISSIONS.INVOICE_IMPORT_HISTORICAL) && (
                  <MaterialButton
                    variant="contained"
                    color="secondary"
                    startIcon={<Upload size={16} />}
                    onClick={() => setShowImportModal(true)}
                  >
                    Importar Excel
                  </MaterialButton>
                )
              )}
            </div>
          )}
        </div>

        {!fetchError && !loadingInvoices && sortedFacturas.length > 0 && totalPages > 1 ? (
          <nav aria-label="Paginación facturas" className="flex items-center justify-center gap-1">
            <MaterialButton
              variant="outlined"
              color="secondary"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ‹ Anterior
            </MaterialButton>

            {getPageWindow(currentPage, totalPages).map((entry, index) =>
              entry === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setCurrentPage(entry)}
                  aria-current={entry === currentPage ? "page" : undefined}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition-colors ${
                    entry === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  {entry}
                </button>
              ),
            )}

            <MaterialButton
              variant="outlined"
              color="secondary"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente ›
            </MaterialButton>
          </nav>
        ) : null}

        <VerDetalle editingFactura={editingFactura!} isOpen={showDetail} onClose={handleCancel} />
        <ImportarFactura open={showImportModal} onClose={() => void handleCloseImportModal()} />
        <EditarFactura
          isOpen={showEditModal}
          invoice={editingInvoiceServer}
          onClose={() => {
            setShowEditModal(false);
            setEditingInvoiceServer(null);
          }}
          onSave={handleSaveEdit}
        />
        <RelacionarTransferenciaModal
          isOpen={!!linkingInvoice}
          invoiceId={linkingInvoice?.id ?? 0}
          invoiceDocument={linkingInvoice?.document ?? ""}
          onClose={() => setLinkingInvoice(null)}
          onLinked={() => {
            alert("Transferencia relacionada correctamente");
          }}
        />
      </div>
    </div>
  );
}

function RowActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function SortableHeader({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string;
  column: "numeroFactura" | "fecha" | "total";
  sortColumn: "numeroFactura" | "fecha" | "total";
  sortDirection: "asc" | "desc";
  onSort: (column: "numeroFactura" | "fecha" | "total") => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`cursor-pointer select-none px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        {sortColumn === column &&
          (sortDirection === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </div>
    </th>
  );
}
