/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { MaterialButton } from './MaterialButton';
import { CreditNoteCreatePayload } from '@/app/type/credit-note';

interface ParseError {
  row: number;
  message: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (creditNotes: CreditNoteCreatePayload[]) => Promise<void>;
  loadingImport?: boolean;
}

interface ParsedGroup {
  number: string;
  invoiceId: number | null;
  invoiceDocument: string | null;
  startDate: string;
  details: {
    invoiceLineId: number;
    quantity: number;
  }[];
}

const normalizeValue = (value: unknown) => {
  if (value == null) return '';
  return String(value).trim();
};

export function ImportarNotaCreditoModal({
  isOpen,
  onClose,
  onImport,
  loadingImport = false,
}: Props) {
  const [groups, setGroups] = useState<ParsedGroup[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [loading, setLoading] = useState(false);

  const totalDetails = useMemo(
    () => groups.reduce((sum, group) => sum + group.details.length, 0),
    [groups],
  );

  if (!isOpen) return null;

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      setErrors([]);
      setGroups([]);

      const file = event.target.files?.[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      const grouped = new Map<string, ParsedGroup>();
      const parseErrors: ParseError[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const number = normalizeValue(row['Number'] ?? row['number']);
        const invoiceIdRaw = normalizeValue(row['InvoiceId'] ?? row['invoiceId']);
        const invoiceDocument = normalizeValue(row['InvoiceDocument'] ?? row['invoiceDocument']) || null;
        const startDate = normalizeValue(row['StartDate'] ?? row['startDate']);
        const invoiceLineIdRaw = normalizeValue(row['InvoiceLineId'] ?? row['invoiceLineId']);
        const quantityRaw = normalizeValue(row['Quantity'] ?? row['quantity']);

        if (!number) {
          parseErrors.push({ row: rowNumber, message: 'Number es obligatorio' });
          return;
        }

        if (!startDate) {
          parseErrors.push({ row: rowNumber, message: 'StartDate es obligatorio' });
          return;
        }

        if (!invoiceLineIdRaw || Number.isNaN(Number(invoiceLineIdRaw))) {
          parseErrors.push({ row: rowNumber, message: 'InvoiceLineId debe ser numerico' });
          return;
        }

        if (!quantityRaw || Number.isNaN(Number(quantityRaw)) || Number(quantityRaw) <= 0) {
          parseErrors.push({ row: rowNumber, message: 'Quantity debe ser numerico y mayor a 0' });
          return;
        }

        if (invoiceIdRaw && Number.isNaN(Number(invoiceIdRaw))) {
          parseErrors.push({ row: rowNumber, message: 'InvoiceId debe ser numerico' });
          return;
        }

        const existing = grouped.get(number) ?? {
          number,
          invoiceId: invoiceIdRaw ? Number(invoiceIdRaw) : null,
          invoiceDocument,
          startDate,
          details: [],
        };

        const normalizedInvoiceId = invoiceIdRaw ? Number(invoiceIdRaw) : null;
        if (existing.invoiceId !== null && normalizedInvoiceId !== null && existing.invoiceId !== normalizedInvoiceId) {
          parseErrors.push({ row: rowNumber, message: `InvoiceId no coincide con la nota ${number}` });
          return;
        }

        if (existing.invoiceDocument && invoiceDocument && existing.invoiceDocument !== invoiceDocument) {
          parseErrors.push({ row: rowNumber, message: `InvoiceDocument no coincide con la nota ${number}` });
          return;
        }

        grouped.set(number, {
          ...existing,
          invoiceId: existing.invoiceId ?? normalizedInvoiceId,
          invoiceDocument: existing.invoiceDocument ?? invoiceDocument,
          startDate: existing.startDate || startDate,
          details: [
            ...existing.details,
            {
              invoiceLineId: Number(invoiceLineIdRaw),
              quantity: Number(quantityRaw),
            },
          ],
        });
      });

      setErrors(parseErrors);
      setGroups(Array.from(grouped.values()));
    } catch (error) {
      console.error(error);
      setErrors([{ row: 0, message: 'Error procesando el archivo Excel' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (groups.length === 0 || errors.length > 0 || loadingImport) {
      return;
    }

    await onImport(
      groups.map((group) => ({
        number: group.number,
        invoiceId: group.invoiceId,
        invoiceDocument: group.invoiceDocument,
        startDate: group.startDate,
        details: group.details,
      })),
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileSpreadsheet size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Importar Notas de Credito</h2>
              <p className="text-sm text-muted-foreground">Sube un Excel con columnas Number, InvoiceId, InvoiceDocument, StartDate, InvoiceLineId y Quantity.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loadingImport} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <label className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background/40">
            <Upload size={40} className="text-primary mb-4" />
            <h3 className="font-medium mb-2">Seleccionar archivo Excel</h3>
            <p className="text-sm text-muted-foreground">Formato .xlsx o .xls</p>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={loadingImport} />
          </label>

          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-700 font-medium">
                <AlertCircle size={18} />
                Se encontraron errores
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={`${error.row}-${index}`}>Fila {error.row}: {error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {groups.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted px-4 py-3 text-sm text-muted-foreground flex items-center justify-between">
                <span>{groups.length} notas detectadas</span>
                <span>{totalDetails} detalles</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
                {groups.map((group) => (
                  <div key={group.number} className="p-4 flex flex-col gap-1 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-foreground">{group.number}</span>
                      <span className="text-muted-foreground">{group.details.length} detalle(s)</span>
                    </div>
                    <div className="text-muted-foreground">Factura: {group.invoiceDocument || 'N/D'} | StartDate: {group.startDate}</div>
                    <div className="text-muted-foreground">InvoiceId: {group.invoiceId ?? 'N/D'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <MaterialButton variant="outlined" color="secondary" onClick={onClose} disabled={loadingImport}>
            Cancelar
          </MaterialButton>
          <MaterialButton
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={groups.length === 0 || errors.length > 0 || loading || loadingImport}
            startIcon={<CheckCircle2 size={18} />}
          >
            {loadingImport ? 'Importando...' : 'Importar notas'}
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
