'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { MaterialButton } from '@/components/MaterialButton';
import { ClientsWithoutPurchasesResponse } from '@/app/type/client-report';
import { exportClientsWithoutPurchasesToExcel, exportClientsWithoutPurchasesToPdf } from './export';

const MAX_EXPORT_RECORDS = 5000;

export default function ExportButtons({
  filtersQueryString,
  recordCount,
}: {
  filtersQueryString: string;
  recordCount: number;
}) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const fetchAllRecords = async () => {
    const params = new URLSearchParams(filtersQueryString);
    params.set('Page', '1');
    params.set('PerPage', String(Math.min(Math.max(recordCount, 1), MAX_EXPORT_RECORDS)));

    const response = await fetch(`/api/clients/reports/without-purchases?${params.toString()}`);
    if (!response.ok) {
      throw new Error('No se pudo obtener el reporte para exportar');
    }

    return (await response.json()) as ClientsWithoutPurchasesResponse;
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(type);
    try {
      const data = await fetchAllRecords();
      if (type === 'excel') {
        exportClientsWithoutPurchasesToExcel(data.records.records, data.summary);
      } else {
        exportClientsWithoutPurchasesToPdf(data.records.records, data.summary);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('No se pudo exportar el reporte. Intente nuevamente.');
    } finally {
      setExporting(null);
    }
  };

  if (recordCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <MaterialButton
        variant="outlined"
        color="primary"
        startIcon={<FileSpreadsheet size={18} />}
        onClick={() => handleExport('excel')}
        disabled={exporting !== null}
      >
        {exporting === 'excel' ? 'Exportando…' : 'Exportar Excel'}
      </MaterialButton>
      <MaterialButton
        variant="outlined"
        color="primary"
        startIcon={<FileText size={18} />}
        onClick={() => handleExport('pdf')}
        disabled={exporting !== null}
      >
        {exporting === 'pdf' ? 'Exportando…' : 'Exportar PDF'}
      </MaterialButton>
      {recordCount > MAX_EXPORT_RECORDS && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Download size={14} />
          Se exportarán los primeros {MAX_EXPORT_RECORDS.toLocaleString('es-NI')} registros
        </span>
      )}
    </div>
  );
}
