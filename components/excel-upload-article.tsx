/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { ArticleExcel } from '@/app/type/article';
import {
  DEFAULT_ARTICLE_DESCRIPTION,
  normalizeArticleCode,
  parseArticleEstado,
  readCell,
} from '@/app/domain/article/import';

/** Fila que no se pudo importar: rechazada en el frontend o con error del backend. */
export interface ErrorResponse {
  fila?: number;
  name: string;
  category: string;
  code: string;
  description: string;
  message: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** `rejected`: filas inválidas que no se envían al backend (van a la lista de errores). */
  onImport: (articles: ArticleExcel[], rejected: ErrorResponse[]) => Promise<void>;

  loadingImport?: boolean;
  processed?: number;
  total?: number;
  createdCount?: number;
  updatedCount?: number;
  errorsImport?: ErrorResponse[];
}

const cellText = (value: unknown) => String(value ?? '').trim();

export function ImportarArticuloModal({
  isOpen,
  onClose,
  onImport,
  loadingImport = false,
  processed = 0,
  total = 0,
  createdCount = 0,
  updatedCount = 0,
  errorsImport = [],
}: Props) {
  const [articles, setArticles] = useState<ArticleExcel[]>([]);
  const [rejected, setRejected] = useState<ErrorResponse[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      setFileError(null);
      setArticles([]);
      setRejected([]);
      setWarnings([]);

      const file = e.target.files?.[0];
      if (!file) return;

      const workbook = XLSX.read(await file.arrayBuffer());
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        setFileError('El archivo está vacío');
        return;
      }

      const invalidRows: ErrorResponse[] = [];
      // Por código: si se repite en el Excel, gana la última fila.
      const byCode = new Map<string, ArticleExcel>();
      const rowsByCode = new Map<string, number[]>();

      jsonData.forEach((row, index) => {
        const fila = index + 2; // fila 1 = encabezados
        const item: ArticleExcel = {
          fila,
          Codigo: normalizeArticleCode(readCell(row, 'Codigo')),
          Nombre: cellText(readCell(row, 'Nombre')),
          Categoria: cellText(readCell(row, 'Categoria')),
          Descripcion: cellText(readCell(row, 'Descripcion')),
          Clase: cellText(readCell(row, 'Clase')),
          Estado: cellText(readCell(row, 'Estado')),
        };

        // Filas totalmente vacías al final del Excel: se ignoran.
        if (!item.Codigo && !item.Nombre && !item.Categoria && !item.Descripcion && !item.Clase && !item.Estado) {
          return;
        }

        const problems: string[] = [];
        if (!item.Codigo) problems.push('Código requerido');
        if (!item.Nombre) problems.push('Nombre requerido');
        if (!item.Categoria) problems.push('Categoría requerida');
        if (parseArticleEstado(item.Estado) === 'invalid') {
          problems.push(`Estado "${item.Estado}" no válido (use Activo/Inactivo, A/I, Sí/No, 1/0 o true/false)`);
        }

        if (problems.length > 0) {
          invalidRows.push({
            fila,
            code: item.Codigo,
            name: item.Nombre,
            category: item.Categoria,
            description: item.Descripcion || DEFAULT_ARTICLE_DESCRIPTION,
            message: problems.join('. '),
          });
          return;
        }

        byCode.set(item.Codigo, item);
        rowsByCode.set(item.Codigo, [...(rowsByCode.get(item.Codigo) ?? []), fila]);
      });

      const duplicateWarnings = Array.from(rowsByCode.entries())
        .filter(([, filas]) => filas.length > 1)
        .map(
          ([code, filas]) =>
            `Código ${code} repetido en las filas ${filas.join(', ')}: se usará la fila ${filas[filas.length - 1]}.`,
        );

      setArticles(Array.from(byCode.values()));
      setRejected(invalidRows);
      setWarnings(duplicateWarnings);
    } catch (error) {
      console.error(error);
      setFileError('Error procesando el archivo Excel');
    } finally {
      setLoading(false);
      // Permite volver a elegir el mismo archivo después de corregirlo.
      e.target.value = '';
    }
  };

  const handleImport = async () => {
    if (articles.length === 0 || loadingImport) return;
    await onImport(articles, rejected);
  };

  // Durante/después de importar, la lista de errores la arma la página
  // (rechazadas + errores del backend); antes, se muestran las rechazadas.
  const errorRows = errorsImport.length > 0 || loadingImport ? errorsImport : rejected;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <FileSpreadsheet size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Importar Artículos</h2>
              <p className="text-sm text-gray-500">
                Crea los artículos nuevos y actualiza los que ya existen (por código)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loadingImport}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-auto">
          <label className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <Upload size={40} className="text-primary mb-4" />
            <h3 className="font-medium mb-2">Seleccionar archivo Excel</h3>
            <p className="text-sm text-gray-500 text-center">
              Columnas: <strong>Codigo</strong>, <strong>Nombre</strong>, <strong>Categoria</strong> (obligatorias) ·
              Descripcion, Clase, Estado (opcionales)
            </p>
            <p className="mt-1 text-xs text-gray-500 text-center">
              Clase o Estado vacíos no modifican el artículo existente. Descripción vacía = &quot;
              {DEFAULT_ARTICLE_DESCRIPTION}&quot;.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
              disabled={loadingImport}
            />
          </label>

          {loading && <div className="py-10 text-center">Procesando archivo...</div>}

          {fileError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{fileError}</div>
          )}

          {articles.length > 0 && !loadingImport && errorsImport.length === 0 && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <h4 className="font-medium text-green-700">
                  {articles.length} artículo{articles.length === 1 ? '' : 's'} listo{articles.length === 1 ? '' : 's'} para
                  importar
                  {rejected.length > 0 ? ` · ${rejected.length} fila(s) con errores no se enviarán` : ''}
                </h4>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h4 className="font-medium text-amber-800">Advertencias ({warnings.length})</h4>
              </div>
              <div className="max-h-32 overflow-auto space-y-1">
                {warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-amber-800">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Progreso de importación */}
          {loadingImport && (
            <div className="mt-6 border rounded-xl p-4 bg-blue-50">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Importando artículos...</span>
                <span>
                  {processed} / {total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${total > 0 ? (processed / total) * 100 : 0}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <strong>Creados</strong>
                  <div>{createdCount}</div>
                </div>
                <div>
                  <strong>Actualizados / sin cambios</strong>
                  <div>{updatedCount}</div>
                </div>
                <div>
                  <strong>Errores</strong>
                  <div>{errorsImport.length}</div>
                </div>
                <div>
                  <strong>Pendientes</strong>
                  <div>{total - processed}</div>
                </div>
              </div>
            </div>
          )}

          {/* Errores: filas rechazadas y errores del backend */}
          {errorRows.length > 0 && (
            <div className="mt-6 border border-red-200 bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-red-600" />
                <h4 className="font-medium text-red-700">
                  {errorsImport.length > 0 ? 'Errores de importación' : 'Filas con errores (no se enviarán)'} (
                  {errorRows.length})
                </h4>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Fila</th>
                      <th className="text-left p-2">Código</th>
                      <th className="text-left p-2">Nombre</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorRows.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 text-gray-500">{item.fila ?? '—'}</td>
                        <td className="p-2">{item.code || '—'}</td>
                        <td className="p-2">{item.name || '—'}</td>
                        <td className="p-2 text-red-600">{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vista previa */}
          {articles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-4">Vista previa</h3>
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-80">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm">Código</th>
                        <th className="px-4 py-3 text-left text-sm">Nombre</th>
                        <th className="px-4 py-3 text-left text-sm">Categoría</th>
                        <th className="px-4 py-3 text-left text-sm">Descripción</th>
                        <th className="px-4 py-3 text-left text-sm">Clase</th>
                        <th className="px-4 py-3 text-left text-sm">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((article) => {
                        const estado = parseArticleEstado(article.Estado);
                        return (
                          <tr key={article.Codigo} className="border-t">
                            <td className="px-4 py-3 text-sm font-mono">{article.Codigo}</td>
                            <td className="px-4 py-3 text-sm">{article.Nombre}</td>
                            <td className="px-4 py-3 text-sm">{article.Categoria}</td>
                            <td className="px-4 py-3 text-sm">
                              {article.Descripcion || (
                                <span className="text-gray-400">{DEFAULT_ARTICLE_DESCRIPTION}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {article.Clase || <span className="text-gray-400">Sin cambio</span>}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {estado === null ? (
                                <span className="text-gray-400">Sin cambio</span>
                              ) : estado ? (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Activo</span>
                              ) : (
                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Inactivo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
            className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            onClick={handleImport}
            disabled={loadingImport || articles.length === 0}
            className="px-5 py-2.5 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {loadingImport ? `Importando ${processed}/${total}` : `Importar ${articles.length || ''} Artículos`}
          </button>
        </div>
      </div>
    </div>
  );
}
