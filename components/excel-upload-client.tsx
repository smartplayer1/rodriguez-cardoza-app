/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ClienteExcel } from '@/app/type/client';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';



interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (clientes: ClienteExcel[]) => void;
}

export function ImportarClientesModal({
  isOpen,
  onClose,
  onImport
}: Props) {
  const [clientes, setClientes] = useState<ClienteExcel[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateRow = (
    row: any,
    index: number
  ): string[] => {
    const rowErrors: string[] = [];

    if (!row['Cliente']) {
      rowErrors.push(
        `Fila ${index}: Código cliente requerido`
      );
    }

    if (!row['Nombre']) {
      rowErrors.push(
        `Fila ${index}: Nombre requerido`
      );
    }

    return rowErrors;
  };

  const formatDate = (excelDate: any) => {
    try {
      if (!excelDate) return null;

      if (excelDate instanceof Date) {
        return excelDate.toISOString();
      }

      return new Date(excelDate).toISOString();
    } catch {
      return null;
    }
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

      const jsonData: any[] = XLSX.utils.sheet_to_json(
        worksheet
      );

      const validationErrors: string[] = [];

      const clientesParseados: ClienteExcel[] =
        jsonData.map((row, index) => {
          const rowErrors = validateRow(
            row,
            index + 2
          );

          validationErrors.push(...rowErrors);

          return {
            code: String(
              row['Cliente']
            ).trim(),

            name: String(
              row['Nombre'] || ''
            ).trim(),
            branchName: 'CHINANDEGA',
            phoneNumber:
              String(
                row['Tel1'] ||
                  row['Tel2'] ||
                  row['Tel3'] ||
                  row['Tel4'] ||
                  ''
              ).trim() || null,

            idNumber:
              row['Cedula']
                ? String(row['Cedula']).trim()
                : null,

            address:
              row['Dirección'] || null,

            province:
              row['Provincia'] || null,

            canton:
              row['Cantón'] || null,

            district:
              row['Distrito'] || null,

            clientType:
              row['Tipo'],

            zoneCode:
              row['Zona'] || null,

            dateOfEntry: formatDate(
              row['Ingreso']
            ) || new Date().toISOString(),

            promoterCode:
              row['Prom']
          };
        });

      setClientes(clientesParseados);
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

  const handleImport = () => {
    if (errors.length > 0) return;
    onImport(clientes);
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
                Importar Clientes
              </h2>

              <p className="text-sm text-gray-500">
                Cargue un archivo Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="
              p-2
              rounded-lg
              hover:bg-gray-100
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
            />
          </label>

          {/* Loading */}
          {loading && (
            <div className="py-10 text-center">
              Procesando archivo...
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div
              className="
                mt-6
                bg-red-50
                border
                border-red-200
                rounded-xl
                p-4
              "
            >
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

          {/* Success */}
          {clientes.length > 0 &&
            errors.length === 0 && (
              <div
                className="
                  mt-6
                  bg-green-50
                  border
                  border-green-200
                  rounded-xl
                  p-4
                "
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />

                  <h4 className="font-medium text-green-700">
                    {clientes.length} clientes cargados
                    correctamente
                  </h4>
                </div>
              </div>
            )}

          {/* Preview */}
          {clientes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-4">
                Vista previa
              </h3>

              <div
                className="
                  border
                  rounded-xl
                  overflow-hidden
                "
              >
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
                          Cédula
                        </th>

                        <th className="px-4 py-3 text-left text-sm">
                          Teléfono
                        </th>

                        <th className="px-4 py-3 text-left text-sm">
                          Zona
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {clientes
                        .map((cliente, index) => (
                          <tr
                            key={index}
                            className="border-t"
                          >
                            <td className="px-4 py-3 text-sm">
                              {cliente.code}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {cliente.name}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {cliente.idNumber}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {cliente.phoneNumber}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {cliente.zoneCode}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="
            px-6
            py-4
            border-t
            flex
            justify-end
            gap-3
          "
        >
          <button
            onClick={onClose}
            className="
              px-5
              py-2.5
              rounded-lg
              border
              hover:bg-gray-50
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleImport}
            disabled={
              clientes.length === 0 ||
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
            Importar Clientes
          </button>
        </div>
      </div>
    </div>
  );
}