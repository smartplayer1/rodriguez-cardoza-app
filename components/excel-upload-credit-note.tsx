"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Factura,
  FacturaDetalleExcel,
} from "@/app/(dashboard)/gestion-de-caja/facturacion/types/factura";
import { mapExcelToFactura } from "@/app/(dashboard)/gestion-de-caja/facturacion/mappers/excel.mapper";
import { getInvoices } from "@/app/services/invoice";
import { createCreditNote } from "@/app/services/billing/credit-note";
import { getCashManagementRecords } from "@/app/services/cash-management";
import { CreditNoteCreatePayload } from "@/app/type/credit-note";
import { CashManagementRecord } from "@/app/type/cash-management";
import { ServerInvoicePayload } from "@/app/type/invoice";
const REQUIRED_COLUMNS = ["CLIENTE", "FECHA", "ARTICULO", "CANTIDAD", "PRECIO"];
const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

type CashManagementOption = {
  id: string;
  label: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

interface UploadProgress {
  total: number;
  sent: number;
  success: number;
}

interface InvoiceUploadError {
  document: string;
  message: string;
  details: string[];
}

const toIssuedAtIso = (dateValue: string) => {
  const normalized = (dateValue || "").trim();
  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}T00:00:00.000Z`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
  ).toISOString();
};

export default function ImportarNotaCreditoModal({ open, onClose }: Props) {
  const [data, setData] = useState<FacturaDetalleExcel[]>([]);
  const [errors, setErrors] = useState<{ fila: number; errores: string[] }[]>(
    [],
  );
  const [structureError, setStructureError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [cashManagementOptions, setCashManagementOptions] = useState<CashManagementOption[]>([]);
  const [cashManagementLoading, setCashManagementLoading] = useState(false);
  const [selectedCashManagementId, setSelectedCashManagementId] = useState("");
  const [uploadErrors, setUploadErrors] = useState<InvoiceUploadError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedFacturas, setExpandedFacturas] = useState<
    Record<string, boolean>
  >({});
  const inputRef = useRef<HTMLInputElement>(null);


  const loadOpenCashManagementRecords = useCallback(async () => {
    try {
      setCashManagementLoading(true);
      const response = await getCashManagementRecords({
        status: 'OPEN',
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });

      const options = (response.records || []).map((record: CashManagementRecord) => ({
        id: String(record.id),
        label: `${record.cashRegisterCode} - ${record.cashRegisterName} - ${record.responsibleEmployeeName}`,
      }));

      setCashManagementOptions(options);
      setSelectedCashManagementId((current) => current || options[0]?.id || "");
    } catch (error) {
      console.error('Error loading open cash management records:', error);
      setCashManagementOptions([]);
      setSelectedCashManagementId("");
    } finally {
      setCashManagementLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadOpenCashManagementRecords();
  }, [open, loadOpenCashManagementRecords]);

  const groupedFacturas = useMemo<Factura[]>(() => {
    const facturasMap = new Map<string, Factura>();

    data.forEach((row) => {
      const documento = row.documento || "SIN_DOCUMENTO";

      if (!facturasMap.has(documento)) {
        facturasMap.set(documento, {
          encabezado: {
            documento,
            estado_cobro: row.estado_cobro,
            cliente: row.cliente,
            bodega: row.bodega,
            sucursal: row.sucursal,
            cajero: row.cajero,
            fecha: row.fecha,
            tienda: row.tienda,
            promotora: row.promotora,
            nivel_precio: row.nivel_precio,
            cupon: row.cupon,
            total_bruto: 0,
            total_descuento_linea: 0,
            total_descuento_general: 0,
            total_impuesto1: 0,
            total_impuesto2: 0,
            total_neto: 0,
            total_items: 0,
          },
          detalle: [],
        });
      }

      const factura = facturasMap.get(documento);

      if (!factura) {
        return;
      }

      factura.detalle.push({
        articulo: row.articulo,
        cantidad: row.cantidad,
        precio_venta: row.precio_venta,
        precio: row.precio,
        impuesto1: row.impuesto1,
        impuesto2: row.impuesto2,
        desc_linea: row.desc_linea,
        desc_gen: row.desc_gen,
        exento: row.exento,
      });

      factura.encabezado.total_bruto += row.precio_venta * row.cantidad;
      factura.encabezado.total_descuento_linea += row.desc_linea;
      factura.encabezado.total_descuento_general += row.desc_gen;
      factura.encabezado.total_impuesto1 += row.impuesto1;
      factura.encabezado.total_impuesto2 += row.impuesto2;
      factura.encabezado.total_neto += row.precio * row.cantidad;
      factura.encabezado.total_items += row.cantidad;
    });

    return Array.from(facturasMap.values());
  }, [data]);

  const toggleFactura = useCallback((documento: string) => {
    setExpandedFacturas((prev) => ({
      ...prev,
      [documento]: !prev[documento],
    }));
  }, []);

  const formatAmount = useCallback((value: number) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }, []);

  const serverPayload = useMemo<ServerInvoicePayload[]>(() => {
    return groupedFacturas.map((factura) => ({
      header: {
        document: factura.encabezado.documento,
        chargeStatus: factura.encabezado.estado_cobro,
        clientCode: String(factura.encabezado.cliente),
        warehouse: Number(factura.encabezado.bodega) || 0,
        cashManagementId: selectedCashManagementId ? Number(selectedCashManagementId) : 0,
        branchCode: "SC002", //factura.encabezado.sucursal,
        cashier: factura.encabezado.cajero,
        issuedAt: toIssuedAtIso(factura.encabezado.fecha),
        store: factura.encabezado.tienda,
        promoterCode: String(factura.encabezado.promotora),
        priceLevel: factura.encabezado.nivel_precio,
        coupon: Number(factura.encabezado.cupon) || 0,
      },
      details: factura.detalle.map((detalle) => ({
        article: String(detalle.articulo),
        quantity: Number(detalle.cantidad) || 0,
        salePrice: Number(detalle.precio_venta) || 0,
        price: Number(detalle.precio) || 0,
        tax1: Number(detalle.impuesto1) || 0,
        tax2: Number(detalle.impuesto2) || 0,
        lineDiscount: Number(detalle.desc_linea) || 0,
        generalDiscount: Number(detalle.desc_gen) || 0,
        isExempt: detalle.exento,
      })),
    }));
  }, [groupedFacturas]);

  const clearFile = useCallback(() => {
    setFileName(null);
    setData([]);
    setErrors([]);
    setStructureError(null);
    setUploadProgress(null);
    setUploadErrors([]);
    setExpandedFacturas({});
    setSelectedCashManagementId("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const extractErrorDetails = useCallback((errorPayload: unknown) => {
    if (!errorPayload || typeof errorPayload !== "object") {
      return [];
    }

    const payload = errorPayload as {
      title?: string;
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
    };

    const details: string[] = [];

    if (payload.title) details.push(payload.title);
    if (payload.detail) details.push(payload.detail);
    if (payload.message) details.push(payload.message);

    if (payload.errors && typeof payload.errors === "object") {
      for (const [field, messages] of Object.entries(payload.errors)) {
        messages.forEach((message) => {
          details.push(`${field}: ${message}`);
        });
      }
    }

    return details;
  }, []);

  const extractErrorMessage = useCallback(
    (errorPayload: unknown, fallback: string) => {
      if (!errorPayload || typeof errorPayload !== "object") {
        return fallback;
      }

      const payload = errorPayload as {
        message?: string;
        title?: string;
        detail?: string;
      };
      return payload.message || payload.title || payload.detail || fallback;
    },
    [],
  );

  const handleSaveData = useCallback(async () => {
    if (serverPayload.length === 0) {
      alert("No hay notas de crédito válidas para guardar");
      return;
    }

    if (!selectedCashManagementId) {
      alert("Seleccione una gestión de caja abierta para continuar");
      return;
    }

    setSaving(true);
    setUploadProgress({ total: serverPayload.length, sent: 0, success: 0 });
    setUploadErrors([]);

    let sent = 0;
    let success = 0;
    const createdDocuments: string[] = [];
    const failedInvoices: InvoiceUploadError[] = [];
    try {
      for (const creditNote of serverPayload) {
        try {
          const invoiceResponse = await getInvoices({
            document: creditNote.header.document || undefined,
            page: 1,
            perPage: 1,
          });

          const sourceInvoice = (invoiceResponse.records || []).find(
            (record) => record.header.document === creditNote.header.document,
          );

          if (!sourceInvoice) {
            throw new Error(
              `No se encontró la factura ${creditNote.header.document}`,
            );
          }

          const payload: CreditNoteCreatePayload = {
            number: creditNote.header.document,
            invoiceId: sourceInvoice.header.id,
            cashManagementId: Number(selectedCashManagementId) || 0,
            invoiceDocument: null, //sourceInvoice.header.document,
            startDate: sourceInvoice.header.issuedAt,
            details: creditNote.details.map((detail) => {
              const matchedDetail = sourceInvoice.details.find(
                (invoiceDetail) => {
                  const sameArticle =
                    String(invoiceDetail.article).trim() ===
                    String(detail.article).trim();
                  const samePrice =
                    Math.abs(
                      Number(invoiceDetail.price || 0) -
                        Number(detail.price || 0),
                    ) < 0.01;

                  return sameArticle && samePrice;
                },
              );
              if (!matchedDetail) {
                throw new Error(
                  `No se encontró el detalle ${detail.article} con precio ${detail.price} en la factura ${sourceInvoice.header.document}`,
                );
              }

              return {
                invoiceLineId: matchedDetail.id,
                quantity: Math.abs(Number(matchedDetail.quantity) || 0),
              };
            }),
          };
              console.log('payload', payload);
          const createdNote = await createCreditNote(payload);

          success += 1;
          createdDocuments.push(createdNote.header.number || payload.number);
        } catch (error) {
          console.error("Error al guardar nota de crédito:", error);
          failedInvoices.push({
            document: creditNote.header.document,
            message: extractErrorMessage(
              error,
              "Error inesperado al enviar la nota de crédito",
            ),
            details:
              extractErrorDetails(error).length > 0
                ? extractErrorDetails(error)
                : [
                    error instanceof Error
                      ? error.message
                      : "Error desconocido",
                  ],
          });
        } finally {
          sent += 1;
          setUploadProgress({
            total: serverPayload.length,
            sent,
            success,
          });
        }
      }

      setUploadErrors(failedInvoices);

      const failed = serverPayload.length - success;

      if (failed > 0) {
        alert(
          `Carga parcial: ${success} Notas de crédito guardadas y ${failed} con error`,
        );
        return;
      }

      const documents = createdDocuments.join(", ");

      alert(
        documents
          ? `Notas de crédito guardadas correctamente: ${documents}`
          : `Notas de crédito guardadas correctamente: ${serverPayload.length}`,
      );
      clearFile();
      onClose();
    } catch (error) {
      console.error("Error al guardar notas de crédito:", error);
      alert(
        "Ocurrió un error al enviar las notas de crédito. Por favor, inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    serverPayload,
    selectedCashManagementId,
    clearFile,
    onClose,
    extractErrorDetails,
    extractErrorMessage,
  ]);

  const validateStructure = (headers: string[]) => {
    return REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  };

  const validateRow = (row: FacturaDetalleExcel, index: number) => {
    const errs = [];

    if (!row.cliente) errs.push("Cliente requerido");

    if (!row.fecha || isNaN(new Date(row.fecha).getTime())) {
      errs.push("Fecha inválida");
    }

    if (!row.articulo) errs.push("Artículo requerido");

    if (
      !row.cantidad ||
      isNaN(row.cantidad) ||
      Number(Math.abs(row.cantidad)) < 0
    ) {
      errs.push("Cantidad inválida");
    }

    if (
      row.precio === null ||
      row.precio === undefined ||
      isNaN(row.precio) ||
      Number(Math.abs(row.precio)) < 0
    ) {
      errs.push("Precio inválido");
    }

    return errs.length > 0 ? { fila: index + 2, errores: errs } : null;
  };

  const processFile = useCallback((file: File) => {
    setLoading(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        if (!evt.target || !evt.target.result) {
          setStructureError("No se pudo leer el archivo");
          setLoading(false);
          return;
        }

        const result = evt.target.result;
        if (!(result instanceof ArrayBuffer)) {
          setStructureError("El archivo no es válido");
          setLoading(false);
          return;
        }

        const buffer = new Uint8Array(result);
        const workbook = XLSX.read(buffer, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (json.length === 0) {
          setStructureError("El archivo está vacío");
          setLoading(false);
          return;
        }

        // ✅ VALIDAR COLUMNAS
        const headers = Object.keys(json[0] as object);
        const missing = validateStructure(headers);

        if (missing.length > 0) {
          setStructureError(`Faltan columnas: ${missing.join(", ")}`);
          setData([]);
          setErrors([]);
          setLoading(false);
          return;
        }

        const errs: { fila: number; errores: string[] }[] = [];
        const valid: FacturaDetalleExcel[] = [];

        json.forEach((row, i) => {
          const mapped = mapExcelToFactura(row);
          const error = validateRow(mapped, i);

          if (error) {
            errs.push(error);
          } else {
            // 🔥 AQUI SE APLICA EL MAPEO

            valid.push(mapped);
          }
        });

        setStructureError(null);
        setErrors(errs);
        setData(valid); // ← ya viene limpio y tipado
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setStructureError("Error leyendo el archivo");
      }

      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        processFile(file);
      }
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        setFileName(file.name);
        processFile(file);
      }
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[95%] max-w-6xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-bold">Importar Excel</h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-muted-foreground">
            Gestión de caja abierta
          </label>
          <select
            value={selectedCashManagementId}
            onChange={(event) =>
              setSelectedCashManagementId(event.target.value)
            }
            className="w-full px-3 py-3 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
          >
            <option value="">Seleccione una gestión de caja</option>
            {cashManagementOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} 
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {cashManagementLoading
              ? "Cargando gestiones abiertas..."
              : `${cashManagementOptions.length} gestión(es) disponible(s)`}
          </p>
        </div>
        {/* CONTENIDO */}
        <div className="p-6 overflow-auto">
          {/* 🔽 SOLO SE MUESTRA SI NO HAY DATA */}
          {!fileName && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">Validador de Excel</h1>
                <p className="text-sm text-gray-500">
                  Sube tu archivo para validar los datos
                </p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <p className="font-medium">Arrastra tu archivo o haz clic</p>
                <p className="text-xs text-gray-500">(.xlsx, .xls)</p>
              </div>
            </div>
          )}

          {fileName && (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
              <p className="text-sm text-gray-700">
                Archivo cargado: {fileName}
              </p>
              <button
                type="button"
                onClick={clearFile}
                disabled={saving}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <p className="text-blue-600 mt-4">Procesando archivo...</p>
          )}

          {saving && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold">Guardando Notas de Crédito...</p>
              <p>
                Enviadas: {uploadProgress?.sent ?? 0} de{" "}
                {uploadProgress?.total ?? 0}
              </p>
              <p>Con éxito: {uploadProgress?.success ?? 0}</p>
              <p>
                Restantes:{" "}
                {Math.max(
                  (uploadProgress?.total ?? 0) - (uploadProgress?.sent ?? 0),
                  0,
                )}
              </p>
            </div>
          )}

          {!saving && uploadErrors.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold mb-2">
                Notas de Crédito con error ({uploadErrors.length})
              </p>

              <div className="space-y-3 max-h-56 overflow-auto pr-1">
                {uploadErrors.map((error) => (
                  <div
                    key={error.document}
                    className="rounded-md border border-red-200 bg-white p-3"
                  >
                    <p className="font-medium">
                      Nota de Crédito: {error.document}
                    </p>
                    <p className="text-red-700">{error.message}</p>

                    {error.details.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-red-600">
                        {error.details.map((detail, index) => (
                          <li key={`${error.document}-${index}`}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERROR ESTRUCTURA */}
          {structureError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mt-4">
              {structureError}
            </div>
          )}

          {/* ERRORES */}
          {Array.isArray(errors) && errors.length > 0 && (
            <div className="mt-4 max-h-40 overflow-auto border rounded p-2">
              <p className="text-red-600 font-semibold mb-2">
                Errores ({errors.length})
              </p>

              {errors.map((e, i) => (
                <div key={`${e.fila}-${i}`} className="text-sm mb-2">
                  <span className="font-semibold text-red-700">
                    Fila {e?.fila}:
                  </span>

                  <ul className="ml-5 list-disc text-red-600">
                    {e.errores?.map((err, j) => (
                      <li key={j}>{err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* TABLA */}
          {data.length > 0 && (
            <div className="mt-6">
              <h3 className="text-green-600 font-semibold mb-2">
                Datos válidos ({data.length}) - Notas de Crédito (
                {groupedFacturas.length})
              </h3>

              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                {groupedFacturas.map((factura) => {
                  const documento = factura.encabezado.documento;
                  const isExpanded = !!expandedFacturas[documento];

                  return (
                    <div
                      key={documento}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFactura(documento)}
                        className="w-full bg-gray-50 hover:bg-gray-100 transition p-3 text-left"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <p className="font-semibold text-gray-800">
                              Nota de Crédito: {documento}
                            </p>
                            <p className="text-xs text-gray-600">
                              Cliente: {factura.encabezado.cliente} | Fecha:{" "}
                              {factura.encabezado.fecha} | Ítems:{" "}
                              {factura.encabezado.total_items}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-green-700">
                              {formatAmount(factura.encabezado.total_neto)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {isExpanded ? "Contraer" : "Expandir"}
                            </p>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t overflow-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-white sticky top-0 z-10">
                              <tr>
                                <th className="p-2 border">Artículo</th>
                                <th className="p-2 border">Cantidad</th>
                                <th className="p-2 border">Precio Venta</th>
                                <th className="p-2 border">Descuento Línea</th>
                                <th className="p-2 border">
                                  Descuento General
                                </th>
                                <th className="p-2 border">Impuesto1</th>
                                <th className="p-2 border">Impuesto2</th>
                                <th className="p-2 border">Precio Neto</th>
                              </tr>
                            </thead>

                            <tbody>
                              {factura.detalle.map((detalle, index) => (
                                <tr
                                  key={`${documento}-${detalle.articulo}-${index}`}
                                >
                                  <td className="p-2 border">
                                    {detalle.articulo}
                                  </td>
                                  <td className="p-2 border">
                                    {detalle.cantidad}
                                  </td>
                                  <td className="p-2 border">
                                    {formatAmount(detalle.precio_venta)}
                                  </td>
                                  <td className="p-2 border">
                                    {formatAmount(detalle.desc_linea)}
                                  </td>
                                  <td className="p-2 border">
                                    {formatAmount(detalle.desc_gen)}
                                  </td>
                                  <td className="p-2 border">
                                    {formatAmount(detalle.impuesto1)}
                                  </td>
                                  <td className="p-2 border">
                                    {formatAmount(detalle.impuesto2)}
                                  </td>
                                  <td className="p-2 border">
                                    {formatAmount(detalle.precio)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Cerrar
          </button>

          <button
            disabled={data.length === 0 || saving}
            onClick={handleSaveData}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Datos"}
          </button>
        </div>
      </div>
    </div>
  );
}
