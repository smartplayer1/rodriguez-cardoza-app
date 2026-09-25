"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Loader2, Upload, X, XCircle } from "lucide-react";
import { MaterialButton } from "@/components/MaterialButton";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { getPriceCategories, importArticlePricingBatch } from "@/app/services/pricing";
import { ArticlePricingBatchResult, ArticlePricingBatchRow, PriceCategory } from "@/app/type/pricing";

const REQUIRED_COLUMNS = ["CODIGO_ARTICULO", "CATEGORIA", "PRECIO_NETO", "DESCUENTO"];

type ParsedRow = ArticlePricingBatchRow & { fila: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
};

const currentPeriodValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// <input type="month"> entrega "YYYY-MM"; el backend espera year y month
// como números por separado.
const parsePeriod = (value: string): { year: number; month: number } | null => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
};

const formatMoney = (value: number | null) => {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Celda vacía en el Excel (precio neto o descuento) = 0, no un error de
// formato — solo un valor no numérico real (texto, etc.) es inválido.
const parseOptionalNumber = (raw: unknown): number => {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "string" && raw.trim() === "") return 0;
  return Number(raw);
};

type PreviewPrices = {
  netPriceAfterDiscount: number;
  catalogPrice: number;
  advisorPrice: number;
  distributorPrice: number;
  publicPrice: number;
};


const computePreviewPrices = (row: ParsedRow, category: PriceCategory): PreviewPrices => {
  const netPriceAfterDiscount = row.netPrice * (row.discountPercent);
  const priceDiscount = row.netPrice * (row.discountPercent);
  const priceDiscountDistributor = row.netPrice * category.distributorMarkupPercent

  return {
    netPriceAfterDiscount,
    catalogPrice: (row.netPrice - priceDiscount) * (1 + category.catalogMarkupPercent) * (category.distributorMarkupPercent +1),
    advisorPrice: (row.netPrice - priceDiscount) * (1 + category.advisorMarkupPercent) * (category.distributorMarkupPercent +1 ),
    distributorPrice: row.netPrice - priceDiscountDistributor - priceDiscount,
    publicPrice: (row.netPrice - priceDiscount) * (1 + category.publicPriceMarkupPercent) * (category.distributorMarkupPercent +1 ),
  };
};

export default function ImportarPrecios({ isOpen, onClose, onImported }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<{ fila: number; errores: string[] }[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [priceCategories, setPriceCategories] = useState<PriceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState("");
  const [results, setResults] = useState<Map<string, ArticlePricingBatchResult> | null>(null);
  const [submittedRows, setSubmittedRows] = useState<ParsedRow[]>([]);
  const [periodValue, setPeriodValue] = useState(currentPeriodValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const period = useMemo(() => parsePeriod(periodValue), [periodValue]);

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await getPriceCategories();
      setPriceCategories(response.records || []);
    } catch (error) {
      console.error("Error loading price categories:", error);
      setPriceCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadCategories();
  }, [isOpen, loadCategories]);

  const categoryNames = useMemo(() => new Set(priceCategories.map((c) => c.category)), [priceCategories]);

  const categoryByName = useMemo(() => {
    const map = new Map<string, PriceCategory>();
    priceCategories.forEach((c) => map.set(c.category, c));
    return map;
  }, [priceCategories]);

  // No bloquea el envío: el backend procesa cada fila con mejor esfuerzo, así
  // que una categoría sin configurar solo hace fallar SU fila, no el lote.
  // Esto es solo para avisar antes de enviar.
  const unknownCategories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (row.category && !categoryNames.has(row.category)) set.add(row.category);
    });
    return Array.from(set);
  }, [rows, categoryNames]);

  const clearFile = useCallback(() => {
    setFileName(null);
    setStructureError(null);
    setRowErrors([]);
    setRows([]);
    setResults(null);
    setSubmittedRows([]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const validateStructure = (headers: string[]) => REQUIRED_COLUMNS.filter((col) => !headers.includes(col));

  const validateRow = (row: ParsedRow): string[] => {
    const errs: string[] = [];
    if (!row.articleCode) errs.push("Código de artículo requerido");
    if (!row.category) errs.push("Categoría requerida");
    if (!Number.isFinite(row.netPrice) || row.netPrice < 0) {
      errs.push("Precio neto inválido (debe ser un número mayor o igual a 0)");
    }
    if (!Number.isFinite(row.discountPercent) || row.discountPercent < 0 || row.discountPercent > 1) {
      errs.push("Descuento inválido (debe ser una fracción entre 0 y 1, ej. 0.10 para 10%)");
    }
    return errs;
  };

  const processFile = useCallback((file: File) => {
    setParsing(true);
    setResults(null);
    setSubmittedRows([]);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        if (!evt.target?.result || !(evt.target.result instanceof ArrayBuffer)) {
          setStructureError("No se pudo leer el archivo");
          setParsing(false);
          return;
        }

        const buffer = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];

        if (json.length === 0) {
          setStructureError("El archivo está vacío");
          setParsing(false);
          return;
        }

        const headers = Object.keys(json[0]);
        const missing = validateStructure(headers);

        if (missing.length > 0) {
          setStructureError(`Faltan columnas: ${missing.join(", ")}`);
          setRows([]);
          setRowErrors([]);
          setParsing(false);
          return;
        }

        const errs: { fila: number; errores: string[] }[] = [];
        const valid: ParsedRow[] = [];

        json.forEach((raw, index) => {
          const parsedRow: ParsedRow = {
            fila: index + 2,
            articleCode: String(raw["CODIGO_ARTICULO"] ?? "").trim(),
            category: String(raw["CATEGORIA"] ?? "").trim().toUpperCase(),
            netPrice: parseOptionalNumber(raw["PRECIO_NETO"]),
            discountPercent: parseOptionalNumber(raw["DESCUENTO"]),
          };

          const rowErrs = validateRow(parsedRow);

          if (rowErrs.length > 0) {
            errs.push({ fila: parsedRow.fila, errores: rowErrs });
          } else {
            valid.push(parsedRow);
          }
        });

        setStructureError(null);
        setRowErrors(errs);
        setRows(valid);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setStructureError("Error leyendo el archivo");
      } finally {
        setParsing(false);
      }
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

  const submitRows = useCallback(
    async (rowsToSend: ParsedRow[], label: string) => {
      if (rowsToSend.length === 0 || !period) return;

      setSaving(true);
      setSavingLabel(label);

      try {
        const payload: ArticlePricingBatchRow[] = rowsToSend.map((row) => ({
          articleCode: row.articleCode,
          category: row.category,
          netPrice: row.netPrice,
          discountPercent: row.discountPercent,
        }));
        const response = await importArticlePricingBatch(period, payload);

        setResults((previous) => {
          const next = new Map(previous ?? []);
          response.forEach((result) => next.set(result.articleCode, result));
          return next;
        });

        setSubmittedRows((previous) => {
          const existingCodes = new Set(previous.map((r) => r.articleCode));
          const merged = [...previous];
          rowsToSend.forEach((row) => {
            if (!existingCodes.has(row.articleCode)) merged.push(row);
          });
          return merged;
        });

        onImported?.();
      } catch (error) {
        alert(error instanceof Error ? error.message : "No se pudo importar el lote de precios");
      } finally {
        setSaving(false);
        setSavingLabel("");
      }
    },
    [onImported, period],
  );

  const handleImport = () => {
    if (rows.length === 0) return;
    void submitRows(rows, `Importando ${rows.length} precio${rows.length === 1 ? "" : "s"}...`);
  };

  const failedRows = useMemo(() => {
    if (!results) return [];
    return submittedRows.filter((row) => {
      const result = results.get(row.articleCode);
      return result && !result.success;
    });
  }, [submittedRows, results]);

  const handleRetryFailed = () => {
    if (failedRows.length === 0) return;
    void submitRows(failedRows, `Reintentando ${failedRows.length} fila${failedRows.length === 1 ? "" : "s"}...`);
  };

  const handleClose = () => {
    if (saving) return;
    clearFile();
    onClose();
  };

  if (!isOpen) return null;

  const successCount = submittedRows.filter((row) => results?.get(row.articleCode)?.success).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {saving && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-semibold text-gray-800">{savingLabel}</p>
            <p className="text-sm text-gray-500">Esperá a que el servidor termine. No cierres esta ventana.</p>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Importar precios desde Excel</h2>
            <p className="text-sm text-gray-500">Actualiza precio neto y descuento de artículos existentes</p>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-gray-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-auto p-6">
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 px-4 py-3">
            <label className="space-y-1">
              <span className="block text-xs font-medium text-gray-600">Periodo de los precios (mes y año) *</span>
              <input
                type="month"
                value={periodValue}
                onChange={(e) => setPeriodValue(e.target.value)}
                disabled={saving || !!results}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
            </label>
            <p className="pb-2 text-xs text-gray-500">
              {results
                ? "El periodo queda fijo mientras reintentás filas; cerrá y volvé a abrir para cambiarlo."
                : "Los precios importados se registran para este mes."}
            </p>
          </div>

          {!fileName && (
            <div className="mx-auto max-w-lg space-y-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto mb-3 text-primary" />
                <p className="font-medium">Arrastra tu archivo o hacé clic</p>
                <p className="mt-1 text-xs text-gray-500">
                  Columnas requeridas: CODIGO_ARTICULO, CATEGORIA, PRECIO_NETO, DESCUENTO
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

          {parsing && <p className="mt-4 text-blue-600">Procesando archivo...</p>}

          {structureError && (
            <div className="mt-4 rounded bg-red-100 p-3 text-red-700">{structureError}</div>
          )}

          {rowErrors.length > 0 && (
            <div className="mt-4 max-h-40 overflow-auto rounded border p-3">
              <p className="mb-2 font-semibold text-red-600">
                Filas con error de formato ({rowErrors.length}) — no se van a enviar
              </p>
              {rowErrors.map((e, i) => (
                <div key={`${e.fila}-${i}`} className="mb-1 text-sm">
                  <span className="font-semibold text-red-700">Fila {e.fila}:</span>
                  <ul className="ml-5 list-disc text-red-600">
                    {e.errores.map((err, j) => (
                      <li key={j}>{err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {loadingCategories ? (
            <div className="mt-4">
              <ListSkeleton count={1} itemClassName="h-9 rounded" />
            </div>
          ) : unknownCategories.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle size={16} />
                <p className="font-semibold">Categorías sin configurar</p>
              </div>
              <p>
                Estas categorías del Excel no existen en el sistema: <strong>{unknownCategories.join(", ")}</strong>.
                Las filas que las usan van a fallar al importar — configuralas primero en Categorías de precio y
                volvé a intentar esas filas.
              </p>
            </div>
          ) : null}

          {rows.length > 0 && !results && (
            <div className="mt-6">
              <h3 className="mb-1 font-medium text-green-700">
                {rows.length} fila{rows.length === 1 ? "" : "s"} lista{rows.length === 1 ? "" : "s"} para importar
              </h3>
              <p className="mb-2 text-xs text-gray-500">
                Catálogo/Asesora/Distribuidor/Público son un estimado calculado en el navegador con el margen de cada
                categoría — el precio final lo calcula y confirma el servidor al importar.
              </p>
              <div className="max-h-72 overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Categoría</th>
                      <th className="px-3 py-2 text-right">Precio neto</th>
                      <th className="px-3 py-2 text-right">Descuento</th>
                      <th className="px-3 py-2 text-right">Catálogo (est.)</th>
                      <th className="px-3 py-2 text-right">Asesora (est.)</th>
                      <th className="px-3 py-2 text-right">Distribuidor (est.)</th>
                      <th className="px-3 py-2 text-right">Público (est.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const categoryConfig = categoryByName.get(row.category);
                      const preview = categoryConfig ? computePreviewPrices(row, categoryConfig) : null;

                      return (
                        <tr key={`${row.fila}-${row.articleCode}`} className="border-t">
                          <td className="px-3 py-2">{row.articleCode}</td>
                          <td className="px-3 py-2">
                            {row.category}
                            {unknownCategories.includes(row.category) && (
                              <span className="ml-2 text-xs text-amber-600">(sin configurar)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{row.netPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-mono">{(row.discountPercent * 100).toFixed(0)}%</td>
                          <td className="px-3 py-2 text-right font-mono">{formatMoney(preview?.catalogPrice ?? null)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatMoney(preview?.advisorPrice ?? null)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatMoney(preview?.distributorPrice ?? null)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatMoney(preview?.publicPrice ?? null)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results && submittedRows.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-medium">
                  Resultado: <span className="text-green-700">{successCount} importadas</span>
                  {failedRows.length > 0 && (
                    <>
                      {" "}
                      · <span className="text-red-700">{failedRows.length} con error</span>
                    </>
                  )}
                </h3>
                {failedRows.length > 0 && (
                  <MaterialButton variant="outlined" color="secondary" onClick={handleRetryFailed} disabled={saving}>
                    Reintentar {failedRows.length} fila{failedRows.length === 1 ? "" : "s"} con error
                  </MaterialButton>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {submittedRows.map((row) => {
                  const result = results.get(row.articleCode);
                  const success = result?.success ?? false;

                  return (
                    <div
                      key={row.articleCode}
                      className={`rounded-lg border p-3 text-sm ${
                        success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {success ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <XCircle size={16} className="text-red-600" />
                        )}
                        {row.articleCode}
                      </div>

                      {success && result ? (
                        <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-700">
                          <dt>Neto</dt>
                          <dd className="text-right font-mono">{formatMoney(result.netPrice)}</dd>
                          <dt>Catálogo</dt>
                          <dd className="text-right font-mono">{formatMoney(result.catalogPrice)}</dd>
                          <dt>Asesora</dt>
                          <dd className="text-right font-mono">{formatMoney(result.advisorPrice)}</dd>
                          <dt>Distribuidor</dt>
                          <dd className="text-right font-mono">{formatMoney(result.distributorPrice)}</dd>
                          <dt>Público</dt>
                          <dd className="text-right font-mono">{formatMoney(result.publicPrice)}</dd>
                        </dl>
                      ) : (
                        <ul className="mt-1 list-disc pl-5 text-xs text-red-700">
                          {(result?.errors?.length ? result.errors : ["No se recibió respuesta para esta fila"]).map(
                            (err, i) => (
                              <li key={i}>{err}</li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <MaterialButton variant="outlined" color="secondary" onClick={handleClose} disabled={saving}>
            {results ? "Cerrar" : "Cancelar"}
          </MaterialButton>
          {!results && (
            <MaterialButton
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={rows.length === 0 || saving || !period}
            >
              Importar {rows.length > 0 ? `(${rows.length})` : ""}
            </MaterialButton>
          )}
        </div>
      </div>
    </div>
  );
}
