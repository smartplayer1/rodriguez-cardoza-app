/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { ArticleExcel } from '@/app/type/article';

export interface ErrorResponse {
  name: string;
  category: string;
  code: string;
  description: string;
  message: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (articles: ArticleExcel[]) => Promise<void>;

  loadingImport?: boolean;
  processed?: number;
  total?: number;
  successCount?: number;
  errorsImport?: ErrorResponse[];
}

export function ImportarArticuloModal({
  isOpen,
  onClose,
  onImport,
  loadingImport = false,
  processed = 0,
  total = 0,
  successCount = 0,
  errorsImport = []
}: Props) {
  const [articles, setArticles] = useState<ArticleExcel[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateRow = (
    row: any,
    index: number
  ): string[] => {
    const rowErrors: string[] = [];

    if (!row['Codigo']) {
      rowErrors.push(
        `Fila ${index}: Código articulo requerido`
      );
    }

    if (!row['Nombre']) {
      rowErrors.push(
        `Fila ${index}: Nombre requerido`
      );
    }

    return rowErrors;
  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setLoading(true);
      setErrors([]);

      const file = e.target.files?.[0];

      if (!file) return;

      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data);

      const sheetName = workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const jsonData: any[] =
        XLSX.utils.sheet_to_json(worksheet);

      const validationErrors: string[] = [];

      const articuloParseados: ArticleExcel[] =
        jsonData.map((row, index) => {
          const rowErrors = validateRow(
            row,
            index + 2
          );

          validationErrors.push(...rowErrors);

          return {
            Codigo: String(
              row['Codigo'] || ''
            ).trim(),

            Nombre: String(
              row['Nombre'] || ''
            ).trim(),

            Categoria: String(
              row['Categoria'] || ''
            ).trim()
          };
        });

      setArticles(articuloParseados);
      setErrors(validationErrors);
    } catch (error) {
      console.error(error);

      setErrors([
        'Error procesando el archivo Excel'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (
      articles.length === 0 ||
      errors.length > 0 ||
      loadingImport
    ) {
      return;
    }

    await onImport(articles);
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/50
        flex
        items-center
        justify-center
        p-4
      "
    >
      <div
        className="
          bg-white
          w-full
          max-w-5xl
          rounded-2xl
          shadow-2xl
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div
          className="
            flex
            items-center
            justify-between
            px-6
            py-5
            border-b
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                w-12
                h-12
                rounded-xl
                bg-green-100
                flex
                items-center
                justify-center
              "
            >
              <FileSpreadsheet
                size={24}
                className="text-green-600"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Importar Artículos
              </h2>

              <p className="text-sm text-gray-500">
                Cargue un archivo Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loadingImport}
            className="
              p-2
              rounded-lg
              hover:bg-gray-100
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {/* Upload */}
          <label
            className="
              border-2
              border-dashed
              rounded-2xl
              p-10
              flex
              flex-col
              items-center
              justify-center
              cursor-pointer
              hover:border-primary
              transition-colors
            "
          >
            <Upload
              size={40}
              className="text-primary mb-4"
            />

            <h3 className="font-medium mb-2">
              Seleccionar archivo Excel
            </h3>

            <p className="text-sm text-gray-500">
              Formato .xlsx
            </p>

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
              disabled={loadingImport}
            />
          </label>

          {/* Procesando archivo */}
          {loading && (
            <div className="py-10 text-center">
              Procesando archivo...
            </div>
          )}

          {/* Errores Excel */}
          {errors.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle
                  size={18}
                  className="text-red-600"
                />

                <h4 className="font-medium text-red-700">
                  Errores encontrados
                </h4>
              </div>

              <div className="max-h-40 overflow-auto">
                {errors.map((error, index) => (
                  <p
                    key={index}
                    className="text-sm text-red-600 mb-1"
                  >
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview correcta */}
          {articles.length > 0 &&
            errors.length === 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />

                  <h4 className="font-medium text-green-700">
                    {articles.length} artículos cargados
                    correctamente
                  </h4>
                </div>
              </div>
            )}

          {/* Progreso de importación */}
          {loadingImport && (
            <div className="mt-6 border rounded-xl p-4 bg-blue-50">
              <div className="flex justify-between mb-2">
                <span className="font-medium">
                  Importando artículos...
                </span>

                <span>
                  {processed} / {total}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      total > 0
                        ? (processed / total) * 100
                        : 0
                    }%`
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <strong>Procesados</strong>
                  <div>{processed}</div>
                </div>

                <div>
                  <strong>Exitosos</strong>
                  <div>{successCount}</div>
                </div>

                <div>
                  <strong>Pendientes</strong>
                  <div>{total - processed}</div>
                </div>
              </div>
            </div>
          )}

          {/* Errores API */}
          {errorsImport.length > 0 && (
            <div className="mt-6 border border-red-200 bg-red-50 rounded-xl p-4">
              <h4 className="font-medium text-red-700 mb-3">
                Errores de importación (
                {errorsImport.length})
              </h4>

              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">
                        Código
                      </th>
                      <th className="text-left p-2">
                        Nombre
                      </th>
                      <th className="text-left p-2">
                        Error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {errorsImport.map(
                      (item, index) => (
                        <tr
                          key={index}
                          className="border-t"
                        >
                          <td className="p-2">
                            {item.code}
                          </td>

                          <td className="p-2">
                            {item.name}
                          </td>

                          <td className="p-2 text-red-600">
                            {item.message}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview */}
          {articles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-4">
                Vista previa
              </h3>

              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-80">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm">
                          Código
                        </th>

                        <th className="px-4 py-3 text-left text-sm">
                          Nombre
                        </th>

                        <th className="px-4 py-3 text-left text-sm">
                          Categoría
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {articles.map(
                        (article, index) => (
                          <tr
                            key={index}
                            className="border-t"
                          >
                            <td className="px-4 py-3 text-sm">
                              {article.Codigo}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {article.Nombre}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {article.Categoria}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loadingImport}
            className="
              px-5
              py-2.5
              rounded-lg
              border
              hover:bg-gray-50
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleImport}
            disabled={
              loadingImport ||
              articles.length === 0 ||
              errors.length > 0
            }
            className="
              px-5
              py-2.5
              rounded-lg
              bg-primary
              text-white
              disabled:opacity-50
            "
          >
            {loadingImport
              ? `Importando ${processed}/${total}`
              : 'Importar Artículos'}
          </button>
        </div>
      </div>
    </div>
  );
}