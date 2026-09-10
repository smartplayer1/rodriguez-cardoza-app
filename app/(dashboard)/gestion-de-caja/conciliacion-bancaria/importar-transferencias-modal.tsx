'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { importBankTransfers } from '@/app/services/billing/bank-transfer';
import { BankTransferImportRow, ImportBankTransferResponse } from '@/app/type/bank-transfer';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
};

type ParsedRow = {
  fila: number;
  transferDate: string;
  transferDateDisplay: string;
  document: string;
  description: string;
  amount: number;
  errors: string[];
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const parseExcelDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86400000);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const parseExcelAmount = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const parseRow = (row: Record<string, unknown>, fila: number): ParsedRow => {
  const errors: string[] = [];

  const date = parseExcelDate(row['Fecha']);
  if (!date) errors.push('Fecha inválida o vacía');

  const document = String(row['Documento'] ?? '').trim();
  if (!document) errors.push('Documento requerido');

  const description = String(row['Descripción'] ?? row['Descripcion'] ?? '').trim();

  const amount = parseExcelAmount(row['Monto']);
  if (amount === null || amount <= 0) errors.push('Monto inválido');

  return {
    fila,
    transferDate: date ? date.toISOString() : '',
    transferDateDisplay: date ? date.toLocaleDateString('es-NI') : '—',
    document,
    description,
    amount: amount ?? 0,
    errors,
  };
};

type Step = 'select' | 'preview';

export default function ImportarTransferenciasModal({ isOpen, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => row.errors.length > 0), [rows]);
  const totalAmount = useMemo(
    () => validRows.reduce((sum, row) => sum + row.amount, 0),
    [validRows],
  );

  if (!isOpen) return null;

  const resetState = () => {
    setStep('select');
    setFileName('');
    setRows([]);
    setParseError(null);
    setImportError(null);
  };

  const handleClose = () => {
    if (importing) return;
    resetState();
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setParseError('El archivo no tiene filas para importar');
        return;
      }

      const parsedRows = jsonData.map((row, index) => parseRow(row, index + 2));
      setRows(parsedRows);
      setStep('preview');
    } catch (error) {
      console.error(error);
      setParseError('No se pudo leer el archivo Excel. Verifique el formato.');
    }
  };

  const handleRemoveInvalidRow = (fila: number) => {
    setRows((prev) => prev.filter((row) => row.fila !== fila));
  };

  const handleConfirmImport = async () => {
    if (invalidRows.length > 0) return;
    if (validRows.length === 0) return;

    const confirmed = confirm(
      `¿Desea importar ${validRows.length} transferencia${validRows.length === 1 ? '' : 's'}?`,
    );
    if (!confirmed) return;

    const payload: BankTransferImportRow[] = validRows.map((row) => ({
      transferDate: row.transferDate,
      document: row.document,
      description: row.description,
      amount: row.amount,
    }));

    try {
      setImporting(true);
      setImportError(null);
      const result: ImportBankTransferResponse = await importBankTransfers(payload);

      const duplicated = result.rows.filter((row) => !row.imported).length;
      const message =
        duplicated > 0
          ? `Importación completada: ${result.imported} de ${result.totalReceived} transferencias importadas. ${duplicated} ya existían y no se volvieron a importar.`
          : `Importación completada: ${result.imported} transferencias importadas correctamente.`;

      alert(message);
      onImported();
      resetState();
      onClose();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'No se pudo importar el archivo del banco',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-surface elevation-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-primary" />
            <h3 className="text-foreground">Importar transferencias del banco</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step === 'select' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Seleccione el archivo Excel del estado de cuenta del banco. Columnas esperadas:{' '}
                <span className="text-foreground">Fecha, Documento, Descripción, Monto</span>.
              </p>

              <label className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <Upload size={36} className="text-primary mb-3" />
                <span className="text-sm font-medium text-foreground">
                  {fileName || 'Seleccionar archivo Excel'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">Formato .xlsx o .xls</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
              </label>

              {parseError && (
                <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {parseError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryTile label="Registros encontrados" value={rows.length} />
                <SummaryTile label="Registros válidos" value={validRows.length} tone="success" />
                <SummaryTile label="Con errores" value={invalidRows.length} tone={invalidRows.length > 0 ? 'error' : 'default'} />
                <SummaryTile label="Total montos" value={formatAmount(totalAmount)} />
              </div>

              {invalidRows.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-2 text-red-700">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">
                      Hay {invalidRows.length} fila{invalidRows.length === 1 ? '' : 's'} con errores.
                      Corríjalas en el Excel y vuelva a cargarlo, o elimínelas de la lista para poder
                      continuar.
                    </span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Documento</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.fila} className={row.errors.length > 0 ? 'bg-red-50/50' : undefined}>
                        <td className="px-3 py-2 whitespace-nowrap">{row.transferDateDisplay}</td>
                        <td className="px-3 py-2 font-mono">{row.document || '—'}</td>
                        <td className="px-3 py-2 max-w-xs truncate" title={row.description}>
                          {row.description || '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatAmount(row.amount)}</td>
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <span className="text-red-600 text-xs">{row.errors.join(', ')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle2 size={14} /> Válido
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.errors.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInvalidRow(row.fila)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Quitar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importError && (
                <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4 shrink-0">
          {step === 'preview' && (
            <MaterialButton variant="outlined" color="secondary" onClick={resetState} disabled={importing}>
              Elegir otro archivo
            </MaterialButton>
          )}
          <MaterialButton variant="outlined" color="secondary" onClick={handleClose} disabled={importing}>
            Cancelar
          </MaterialButton>
          {step === 'preview' && (
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Upload size={18} />}
              onClick={handleConfirmImport}
              disabled={importing || invalidRows.length > 0 || validRows.length === 0}
            >
              {importing ? 'Importando...' : `Importar ${validRows.length} transferencia${validRows.length === 1 ? '' : 's'}`}
            </MaterialButton>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'success' | 'error';
}) {
  const toneClass =
    tone === 'success' ? 'text-green-600' : tone === 'error' ? 'text-red-600' : 'text-foreground';

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
