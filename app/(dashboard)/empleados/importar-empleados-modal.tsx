'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';

import { EmployeeCreatePayload } from '@/app/type/employee';

type OptionItem = {
  id: string;
  name: string;
};

type Props = {
  roleOptions: OptionItem[];
  branchOptions: OptionItem[];
};

type ParseError = {
  row: number;
  message: string;
};

const normalize = (value: unknown) => String(value ?? '').trim();

const HEADER_KEYS = {
  code: ['code', 'codigo', 'código'],
  name: ['name', 'nombre'],
  middleName: ['middleName', 'middlename', 'segundoNombre', 'segundonombre'],
  lastName: ['lastName', 'lastname', 'apellido', 'primerApellido', 'primerapellido'],
  secondLastName: ['secondLastName', 'secondlastname', 'segundoApellido', 'segundoapellido'],
  phoneNumber: ['phoneNumber', 'phonenumber', 'telefono', 'teléfono'],
  idNumber: ['idNumber', 'idnumber', 'cedula', 'cédula'],
  jobRoleId: ['jobRoleId', 'jobroleid', 'rolId', 'rolid', 'rol', 'jobRole', 'jobrole'],
  branchId: ['branchId', 'branchid', 'sucursalId', 'sucursalid', 'sucursal', 'branch'],
};

const getRowValue = (row: Record<string, unknown>, acceptedKeys: string[]) => {
  for (const [rawKey, value] of Object.entries(row)) {
    const normalizedKey = rawKey.replace(/\s+/g, '').toLowerCase();
    if (acceptedKeys.some((key) => key.toLowerCase() === normalizedKey)) {
      return normalize(value);
    }
  }

  return '';
};

const findOptionIdByName = (options: OptionItem[], value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  const match = options.find((option) => option.name.trim().toLowerCase() === normalizedValue);
  return match?.id;
};

const resolveNumericId = (rawValue: string, options: OptionItem[]) => {
  if (!rawValue) {
    return null;
  }

  const asNumber = Number.parseInt(rawValue, 10);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }

  const matchedId = findOptionIdByName(options, rawValue);
  if (!matchedId) {
    return null;
  }

  const parsed = Number.parseInt(matchedId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export default function ImportarEmpleadosModal({ roleOptions, branchOptions }: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<EmployeeCreatePayload[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [loadingFile, setLoadingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  const pendingCount = useMemo(() => Math.max(rows.length - processed, 0), [rows.length, processed]);

  const resetState = () => {
    setRows([]);
    setErrors([]);
    setApiErrors([]);
    setProcessed(0);
    setSuccessCount(0);
    setLoadingFile(false);
    setIsImporting(false);
  };

  const closeModal = () => {
    if (isImporting) return;
    setIsOpen(false);
    resetState();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoadingFile(true);
      setRows([]);
      setErrors([]);
      setApiErrors([]);
      setProcessed(0);
      setSuccessCount(0);

      const file = event.target.files?.[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      const parseErrors: ParseError[] = [];
      const employees: EmployeeCreatePayload[] = [];

      parsedRows.forEach((row, index) => {
        const rowNumber = index + 2;

        const code = getRowValue(row, HEADER_KEYS.code);
        const name = getRowValue(row, HEADER_KEYS.name);
        const middleName = getRowValue(row, HEADER_KEYS.middleName);
        const lastName = getRowValue(row, HEADER_KEYS.lastName);
        const secondLastName = getRowValue(row, HEADER_KEYS.secondLastName);
        const phoneNumber = getRowValue(row, HEADER_KEYS.phoneNumber);
        const idNumber = getRowValue(row, HEADER_KEYS.idNumber);
        const jobRoleRaw = getRowValue(row, HEADER_KEYS.jobRoleId);
        const branchRaw = getRowValue(row, HEADER_KEYS.branchId);

        if (!code) parseErrors.push({ row: rowNumber, message: 'code es obligatorio' });
        if (!name) parseErrors.push({ row: rowNumber, message: 'name es obligatorio' });
        if (!lastName) parseErrors.push({ row: rowNumber, message: 'lastName es obligatorio' });
        if (!idNumber) parseErrors.push({ row: rowNumber, message: 'idNumber es obligatorio' });

        const jobRoleId = resolveNumericId(jobRoleRaw, roleOptions);
        if (!jobRoleId) {
          parseErrors.push({ row: rowNumber, message: `jobRoleId invalido: ${jobRoleRaw || 'vacío'}` });
        }

        const branchId = resolveNumericId(branchRaw, branchOptions);
        if (!branchId) {
          parseErrors.push({ row: rowNumber, message: `branchId invalido: ${branchRaw || 'vacío'}` });
        }

        if (parseErrors.some((error) => error.row === rowNumber)) {
          return;
        }

        employees.push({
          code,
          name,
          middleName,
          lastName,
          secondLastName,
          phoneNumber,
          idNumber,
          jobRoleId,
          branchId,
        });
      });

      setErrors(parseErrors);
      setRows(employees);
    } catch (error) {
      setErrors([
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Error procesando el archivo Excel',
        },
      ]);
    } finally {
      setLoadingFile(false);
      event.target.value = '';
    }
  };

  const handleImport = async () => {
    if (isImporting || rows.length === 0 || errors.length > 0) return;

    setIsImporting(true);
    setApiErrors([]);
    setProcessed(0);
    setSuccessCount(0);

    const importErrors: string[] = [];
    let success = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const employee = rows[index];

      try {
        const response = await fetch('/api/employee', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employee),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            (body as { message?: string; detail?: string } | null)?.message ||
            (body as { message?: string; detail?: string } | null)?.detail ||
            `Error al crear empleado en fila ${index + 2}`;

          importErrors.push(`Fila ${index + 2}: ${message}`);
        } else {
          success += 1;
          setSuccessCount(success);
        }
      } catch (error) {
        importErrors.push(
          `Fila ${index + 2}: ${error instanceof Error ? error.message : 'Error de red al importar'}`,
        );
      } finally {
        setProcessed(index + 1);
      }
    }

    setApiErrors(importErrors);
    setIsImporting(false);

    if (importErrors.length === 0) {
      closeModal();
      router.refresh();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
      >
        Importar Excel
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Importar Empleados</h2>
                  <p className="text-sm text-muted-foreground">
                    Columnas esperadas: code, name, middleName, lastName, secondLastName, phoneNumber, idNumber, jobRoleId, branchId.
                  </p>
                </div>
              </div>
              <button onClick={closeModal} disabled={isImporting} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <label className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background/40">
                <Upload size={40} className="text-primary mb-4" />
                <h3 className="font-medium mb-2">Seleccionar archivo Excel</h3>
                <p className="text-sm text-muted-foreground">Formato .xlsx o .xls</p>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={isImporting} />
              </label>

              {loadingFile ? <div className="text-sm text-muted-foreground">Procesando archivo...</div> : null}

              {errors.length > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-medium">
                    <AlertCircle size={18} />
                    Se encontraron errores de validación
                  </div>
                  <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-auto">
                    {errors.map((error, index) => (
                      <li key={`${error.row}-${index}`}>
                        {error.row > 0 ? `Fila ${error.row}: ` : ''}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {rows.length > 0 ? (
                <div className="rounded-xl border border-border p-4 bg-background/60 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 size={16} />
                    {rows.length} empleado(s) listo(s) para importar
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Puedes usar ID numérico o nombre exacto para jobRoleId y branchId.
                  </p>
                </div>
              ) : null}

              {isImporting ? (
                <div className="mt-2 border rounded-xl p-4 bg-blue-50">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">Importando empleados...</span>
                    <span>{processed} / {rows.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${rows.length > 0 ? (processed / rows.length) * 100 : 0}%` }}
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
                      <div>{pendingCount}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {apiErrors.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 font-medium">
                    <AlertCircle size={18} />
                    Se completó con errores ({successCount}/{rows.length} exitosos)
                  </div>
                  <ul className="text-sm text-amber-800 space-y-1 max-h-48 overflow-auto">
                    {apiErrors.map((error, index) => (
                      <li key={`${error}-${index}`}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isImporting}
                className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={rows.length === 0 || errors.length > 0 || loadingFile || isImporting}
                className="rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isImporting ? 'Importando...' : 'Importar empleados'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}