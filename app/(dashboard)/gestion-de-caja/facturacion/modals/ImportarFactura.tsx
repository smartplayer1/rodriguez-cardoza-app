"use client";

import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { FacturaDetalleExcel } from "../types/factura";
import { mapExcelToFactura } from "../mappers/excel.mapper";

const REQUIRED_COLUMNS = ["CLIENTE", "FECHA", "ARTICULO", "CANTIDAD", "PRECIO"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportarFactura({ open , onClose } : Props) {
  const [data, setData] = useState<FacturaDetalleExcel[]>([]);
  const [errors, setErrors] = useState<{ fila: number; errores: string[] }[]>([]);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
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
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
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

  const clearFile = useCallback(() => {
    setFileName(null)
    setData([])
    setErrors([])
    if (inputRef.current) inputRef.current.value = ""
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

        {/* LOADING */}
        {loading && (
          <p className="text-blue-600 mt-4">
            Procesando archivo...
          </p>
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
              Datos válidos ({data.length})
            </h3>

            {/* 🔥 ALTURA FIJA */}
            <div className="border rounded overflow-auto max-h-[300px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    {Object.keys(data[0]).map((key) => (
                      <th key={key} className="p-2 border">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="p-2 border">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t p-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded"
        >
          Cerrar
        </button>

        <button
          disabled={data.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Guardar Datos
        </button>
      </div>
    </div>
  </div>
);
}