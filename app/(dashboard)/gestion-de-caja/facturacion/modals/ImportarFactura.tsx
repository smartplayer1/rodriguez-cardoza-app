"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Factura, FacturaDetalleExcel } from "../types/factura";
import { mapExcelToFactura } from "../mappers/excel.mapper";
import { createInvoices } from "@/app/services/invoice";
import { getCashManagementRecords } from "@/app/services/cash-management";
import { getUnrelatedBankTransfers } from "@/app/services/billing/bank-transfer";
import { CashManagementRecord } from "@/app/type/cash-management";

import {
  InvoiceBatchPostResponse,
  SALE_TYPE_OPTIONS,
  SaleType,
  ServerInvoicePayload,
} from "@/app/type/invoice";
import { BankTransferRecord } from "@/app/type/bank-transfer";
import { ListSkeleton } from "@/components/ui/loading-skeleton";

const REQUIRED_COLUMNS = ["CLIENTE", "FECHA", "ARTICULO", "CANTIDAD", "PRECIO", "TIPO_VENTA"];

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

type CashManagementOption = {
  id: string;
  label: string;
};

const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

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

export default function ImportarFactura({ open , onClose } : Props) {
  const [data, setData] = useState<FacturaDetalleExcel[]>([]);
  const [errors, setErrors] = useState<{ fila: number; errores: string[] }[]>([]);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadErrors, setUploadErrors] = useState<InvoiceUploadError[]>([]);
  const [cashManagementOptions, setCashManagementOptions] = useState<CashManagementRecord[]>([]);
  const [unrelatedTransfers, setUnrelatedTransfers] = useState<BankTransferRecord[]>([]);
  const [unrelatedTransfersLoading, setUnrelatedTransfersLoading] = useState(false);
  const [selectedTransfersByDocument, setSelectedTransfersByDocument] = useState<
    Record<string, number[]>
  >({});
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedFacturas, setExpandedFacturas] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const loadOpenCashManagementRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCashManagementRecords({
        status: "OPEN",
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });
      setCashManagementOptions(response.records || []);
    } catch (error) {
      console.error("Error loading open cash management records:", error);
      setCashManagementOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

 

  const loadUnrelatedTransfers = useCallback(async () => {
    try {
      setUnrelatedTransfersLoading(true);
      const response = await getUnrelatedBankTransfers({ page: 1, perPage: 500 });
      setUnrelatedTransfers(response.records || []);
    } catch (error) {
      console.error("Error loading unrelated bank transfers:", error);
      setUnrelatedTransfers([]);
    } finally {
      setUnrelatedTransfersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadOpenCashManagementRecords();
    void loadUnrelatedTransfers();
  }, [open, loadOpenCashManagementRecords, loadUnrelatedTransfers]);

  const toggleTransferSelection = useCallback((documento: string, transferId: number) => {
    setSelectedTransfersByDocument((previous) => {
      const current = previous[documento] || [];
      const next = current.includes(transferId)
        ? current.filter((id) => id !== transferId)
        : [...current, transferId];

      return { ...previous, [documento]: next };
    });
  }, []);

  const transferDocumentById = useMemo(() => {
    const map = new Map<number, string>();
    Object.entries(selectedTransfersByDocument).forEach(([documento, ids]) => {
      ids.forEach((id) => map.set(id, documento));
    });
    return map;
  }, [selectedTransfersByDocument]);

  const groupedFacturas = useMemo<Factura[]>(() => {
    const facturasMap = new Map<string, Factura>()

    data.forEach((row) => {
      const documento = row.documento || "SIN_DOCUMENTO"

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
            tipo_venta: row.tipo_venta,
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
        })
      }

      const factura = facturasMap.get(documento)

      if (!factura) {
        return
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
      })

      factura.encabezado.total_bruto += row.precio_venta * row.cantidad
      factura.encabezado.total_descuento_linea += row.desc_linea
      factura.encabezado.total_descuento_general += row.desc_gen
      factura.encabezado.total_impuesto1 += row.impuesto1
      factura.encabezado.total_impuesto2 += row.impuesto2
      factura.encabezado.total_neto += row.precio * row.cantidad
      factura.encabezado.total_items += row.cantidad
    })

    return Array.from(facturasMap.values())
  }, [data])

  const toggleFactura = useCallback((documento: string) => {
    setExpandedFacturas((prev) => ({
      ...prev,
      [documento]: !prev[documento],
    }))
  }, [])

  const formatAmount = useCallback((value: number) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0)
  }, [])

  // Antes de armar el payload, validamos que cada factura tenga una (y solo
  // una) gestión de caja abierta que coincida con el código de caja de su
  // documento. Si falta o es ambigua, no se debe poder enviar NINGUNA
  // factura del lote hasta que se corrija.
  const cashManagementIssues = useMemo(() => {
    return groupedFacturas.reduce<
      { documento: string; cajaCode: string; reason: "not_found" | "ambiguous" }[]
    >((issues, factura) => {
      const cajaCode = factura.encabezado.documento.split("-")[0];
      const matches = cashManagementOptions.filter(
        (option) => option.cashRegisterCode === cajaCode,
      );

      if (matches.length === 0) {
        issues.push({ documento: factura.encabezado.documento, cajaCode, reason: "not_found" });
      } else if (matches.length > 1) {
        issues.push({ documento: factura.encabezado.documento, cajaCode, reason: "ambiguous" });
      }

      return issues;
    }, []);
  }, [groupedFacturas, cashManagementOptions]);

  const serverPayload = useMemo<ServerInvoicePayload[]>(() => {
    if (cashManagementIssues.length > 0) {
      return [];
    }

    return groupedFacturas.map((factura) => {
      const cashManagement = cashManagementOptions.filter((option) => option.cashRegisterCode === factura.encabezado.documento.split("-")[0])
      const selectedCashManagement = cashManagement[0]

      return {
        header: {
        document: factura.encabezado.documento,
        chargeStatus: factura.encabezado.estado_cobro,
        clientCode: String(factura.encabezado.cliente),
        cashManagementId: selectedCashManagement.id,
        warehouse: Number(factura.encabezado.bodega) || 0,
        branchCode: selectedCashManagement.branchCode || "",
        cashier: factura.encabezado.cajero,
        issuedAt: toIssuedAtIso(factura.encabezado.fecha),
        store: factura.encabezado.tienda,
        promoterCode: String(factura.encabezado.promotora),
        priceLevel: factura.encabezado.nivel_precio,
        saleType: factura.encabezado.tipo_venta as SaleType,
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
      collectionBankTransferIds:
        selectedTransfersByDocument[factura.encabezado.documento] || [],
      }
    } )
  }, [groupedFacturas, selectedTransfersByDocument, cashManagementOptions, cashManagementIssues])

  const clearFile = useCallback(() => {
    setFileName(null)
    setData([])
    setErrors([])
    setStructureError(null)
    setUploadProgress(null)
    setUploadErrors([])
    setExpandedFacturas({})
    setSelectedTransfersByDocument({})
    if (inputRef.current) inputRef.current.value = ""
  }, [])

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
  }, [])

  const extractErrorMessage = useCallback((errorPayload: unknown, fallback: string) => {
    if (!errorPayload || typeof errorPayload !== "object") {
      return fallback;
    }

    const payload = errorPayload as { message?: string; title?: string; detail?: string };
    return payload.message || payload.title || payload.detail || fallback;
  }, [])

  const handleSaveData = useCallback(async () => {
    if (cashManagementIssues.length > 0) {
      alert(
        "No se puede enviar el lote: hay facturas sin una gestión de caja abierta que coincida (o con más de una). Corrija los códigos de caja o abra/cierre las gestiones correspondientes antes de reintentar.",
      );
      return;
    }

    if (serverPayload.length === 0) {
      alert("No hay facturas válidas para guardar");
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
      for (const invoice of serverPayload) {
        try {
          const response = await createInvoices([invoice]);
          const rawResponseData = (await response.json().catch(() => ({}))) as Partial<InvoiceBatchPostResponse> & {
            error?: unknown;
            message?: string;
            title?: string;
            detail?: string;
          };
          const failedCount = Number(rawResponseData.failed || 0);
          const isSuccess = response.ok && response.status !== 207 && failedCount === 0;

          if (isSuccess) {
            success += 1;
            const currentDocument = (rawResponseData.results || [])[0]?.invoice?.header?.document
              || (rawResponseData.results || [])[0]?.document
              || invoice.header.document;
            createdDocuments.push(currentDocument);
          } else {
            const errorPayload = rawResponseData.error ?? rawResponseData;
            failedInvoices.push({
              document: invoice.header.document,
              message: extractErrorMessage(errorPayload, "La factura no se pudo procesar"),
              details: extractErrorDetails(errorPayload),
            });
          }
        } catch (error) {
          console.error("Error al guardar factura:", error);
          failedInvoices.push({
            document: invoice.header.document,
            message: "Error inesperado al enviar la factura",
            details: [error instanceof Error ? error.message : "Error desconocido"],
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
        alert(`Carga parcial: ${success} facturas guardadas y ${failed} con error`);
        return;
      }

      const documents = createdDocuments.join(", ");

      alert(
        documents
          ? `Facturas guardadas correctamente: ${documents}`
          : `Facturas guardadas correctamente: ${serverPayload.length}`
      );
      clearFile();
      onClose();
    } catch (error) {
      console.error("Error al guardar facturas:", error);
      alert("Ocurrió un error al enviar las facturas");
    } finally {
      setSaving(false);
    }
  }, [serverPayload, cashManagementIssues, clearFile, onClose, extractErrorDetails, extractErrorMessage])

  const validateStructure = (headers: string[]) => {
    return REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  };

  const validateRow = (row : FacturaDetalleExcel, index: number) => {
    const errs = [];

    if (!row.cliente) errs.push("Cliente requerido");

    if (!row.fecha || isNaN(new Date(row.fecha).getTime())) {
      errs.push("Fecha inválida");
    }

    if (!row.articulo ) errs.push("Artículo requerido");

    if (!row.cantidad || isNaN(row.cantidad) || row.cantidad < 0) {
      errs.push("Cantidad inválida");
    }

   if (
      row.precio === null ||
      row.precio === undefined ||
      isNaN(row.precio) ||
      Number(row.precio) < 0
    ) {
      errs.push("Precio inválido");
    }

    if (!row.tipo_venta || !SALE_TYPE_OPTIONS.includes(row.tipo_venta as SaleType)) {
      errs.push(
        `Tipo de venta inválido (debe ser una de: ${SALE_TYPE_OPTIONS.join(", ")})`,
      );
    }

    return errs.length > 0
      ? { fila: index + 2, errores: errs }
      : null;
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
      const file = e.target.files?.[0]
      if (file) {
        setFileName(file.name)
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) {
        setFileName(file.name)
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])


 if (!open) return null;
  return (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white w-[95%] max-w-6xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="text-lg font-bold">
          Importar Excel
        </h2>

        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="p-6 overflow-auto">
      
        {/* 🔽 SOLO SE MUESTRA SI NO HAY DATA */}
        {!fileName && (
          <div className="max-w-lg mx-auto space-y-6">

            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold">
                Validador de Excel
              </h1>
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

              <p className="font-medium">
                Arrastra tu archivo o haz clic
              </p>
              <p className="text-xs text-gray-500">
                (.xlsx, .xls)
              </p>
            </div>
          </div>
        )}

        {fileName && (
          <div className="mb-4 flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
            <p className="text-sm text-gray-700">Archivo cargado: {fileName}</p>
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
          <p className="text-blue-600 mt-4">
            Procesando archivo...
          </p>
        )}

        {saving && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-semibold">Guardando facturas...</p>
            <p>Enviadas: {uploadProgress?.sent ?? 0} de {uploadProgress?.total ?? 0}</p>
            <p>Con éxito: {uploadProgress?.success ?? 0}</p>
            <p>Restantes: {Math.max((uploadProgress?.total ?? 0) - (uploadProgress?.sent ?? 0), 0)}</p>
          </div>
        )}

        {!saving && uploadErrors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold mb-2">
              Facturas con error ({uploadErrors.length})
            </p>

            <div className="space-y-3 max-h-56 overflow-auto pr-1">
              {uploadErrors.map((error) => (
                <div key={error.document} className="rounded-md border border-red-200 bg-white p-3">
                  <p className="font-medium">
                    Factura: {error.document}
                  </p>
                  <p className="text-red-700">
                    {error.message}
                  </p>

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

        {/* ERROR GESTIÓN DE CAJA */}
        {!saving && cashManagementIssues.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold mb-2">
              No se puede enviar el lote: {cashManagementIssues.length} factura(s) sin gestión de
              caja válida
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {cashManagementIssues.map((issue) => (
                <li key={issue.documento}>
                  Factura {issue.documento} (código de caja &quot;{issue.cajaCode}&quot;):{" "}
                  {issue.reason === "not_found"
                    ? "no hay ninguna gestión de caja abierta con ese código"
                    : "hay más de una gestión de caja abierta con ese código"}
                </li>
              ))}
            </ul>
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
              <div
                key={`${e.fila}-${i}`}
                className="text-sm mb-2"
              >
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
              Datos válidos ({data.length}) - Facturas ({groupedFacturas.length})
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
              {groupedFacturas.map((factura) => {
                const documento = factura.encabezado.documento
                const isExpanded = !!expandedFacturas[documento]

                return (
                  <div key={documento} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleFactura(documento)}
                      className="w-full bg-gray-50 hover:bg-gray-100 transition p-3 text-left"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            Factura: {documento}
                          </p>
                          <p className="text-xs text-gray-600">
                            Cliente: {factura.encabezado.cliente} | Fecha: {factura.encabezado.fecha} | Ítems: {factura.encabezado.total_items} | Tipo de venta: {factura.encabezado.tipo_venta}
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
                      <div className="border-t p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Transferencias bancarias a relacionar con esta factura (opcional)
                        </p>
                        {unrelatedTransfersLoading ? (
                          <ListSkeleton count={2} itemClassName="h-9 rounded" />
                        ) : unrelatedTransfers.length === 0 ? (
                          <p className="text-sm text-gray-500 rounded border border-gray-200 px-3 py-2">
                            No hay transferencias pendientes de relacionar.
                          </p>
                        ) : (
                          <TransferRelationSelector
                            transfers={unrelatedTransfers}
                            selectedIds={selectedTransfersByDocument[documento] || []}
                            claimedByDocument={transferDocumentById}
                            currentDocument={documento}
                            disabled={saving}
                            formatAmount={formatAmount}
                            onToggle={(transferId) =>
                              toggleTransferSelection(documento, transferId)
                            }
                          />
                        )}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white sticky top-0 z-10">
                            <tr>
                              <th className="p-2 border">Artículo</th>
                              <th className="p-2 border">Cantidad</th>
                              <th className="p-2 border">Precio Venta</th>
                              <th className="p-2 border">Descuento Línea</th>
                              <th className="p-2 border">Descuento General</th>
                              <th className="p-2 border">Impuesto1</th>
                              <th className="p-2 border">Impuesto2</th>
                              <th className="p-2 border">Precio Neto</th>
                            </tr>
                          </thead>

                          <tbody>
                            {factura.detalle.map((detalle, index) => (
                              <tr key={`${documento}-${detalle.articulo}-${index}`}>
                                <td className="p-2 border">{detalle.articulo}</td>
                                <td className="p-2 border">{detalle.cantidad}</td>
                                <td className="p-2 border">{formatAmount(detalle.precio_venta)}</td>
                                <td className="p-2 border">{formatAmount(detalle.desc_linea)}</td>
                                <td className="p-2 border">{formatAmount(detalle.desc_gen)}</td>
                                <td className="p-2 border">{formatAmount(detalle.impuesto1)}</td>
                                <td className="p-2 border">{formatAmount(detalle.impuesto2)}</td>
                                <td className="p-2 border">{formatAmount(detalle.precio)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
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
          disabled={data.length === 0 || saving || cashManagementIssues.length > 0}
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

function TransferRelationSelector({
  transfers,
  selectedIds,
  claimedByDocument,
  currentDocument,
  disabled,
  formatAmount,
  onToggle,
}: {
  transfers: BankTransferRecord[];
  selectedIds: number[];
  claimedByDocument: Map<number, string>;
  currentDocument: string;
  disabled: boolean;
  formatAmount: (value: number) => string;
  onToggle: (transferId: number) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transfers;

    return transfers.filter((transfer) => {
      const haystack = `${transfer.bankName} ${transfer.accountNumber} ${transfer.amount}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [transfers, search]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por banco, cuenta o monto..."
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />

      <div className="max-h-48 overflow-auto rounded border border-gray-300 divide-y">
        {filteredTransfers.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-500">Sin resultados.</p>
        ) : (
          filteredTransfers.map((transfer) => {
            const isSelected = selectedIds.includes(transfer.id);
            const claimedDocument = claimedByDocument.get(transfer.id);
            const isClaimedElsewhere = !!claimedDocument && claimedDocument !== currentDocument;

            return (
              <label
                key={transfer.id}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${
                  isClaimedElsewhere
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(transfer.id)}
                    disabled={disabled || isClaimedElsewhere}
                  />
                  <span>
                    {transfer.bankName} · {transfer.accountNumber} ·{" "}
                    {new Date(transfer.transferDate).toLocaleDateString()}
                    {transfer.accountingConceptName ? (
                      <span className="ml-2 text-xs text-gray-500">
                        {transfer.accountingConceptName}
                        {transfer.accountingConceptCategoryName
                          ? ` (${transfer.accountingConceptCategoryName})`
                          : ""}
                      </span>
                    ) : null}
                    {isClaimedElsewhere ? (
                      <span className="ml-2 text-xs text-amber-600">
                        Ya asignada a factura {claimedDocument}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="font-medium text-gray-700">
                  {formatAmount(transfer.amount)}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}