import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashManagementReportRecord, CashManagementReportSummary } from '@/app/type/cash-management-report';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
};

const buildRows = (records: CashManagementReportRecord[]) =>
  records.map((record) => ({
    Caja: `${record.cashRegisterCode} - ${record.cashRegisterName}`,
    Sucursal: record.branchName ?? record.branchCode,
    Responsable: record.responsibleEmployeeName,
    'Abierta por': record.openedByUserName,
    'Cerrada por': record.closedByUserName ?? '-',
    'Abierta el': formatDateTime(record.openedAt),
    'Cerrada el': formatDateTime(record.closedAt),
    Estado: record.status,
    'Tipo Cambio': record.exchangeRateNioPerUsd,
    'Esperado C$': formatCurrency(record.expectedNio),
    'Real C$': formatCurrency(record.actualNio),
    'Diferencia C$': formatCurrency(record.differenceNio),
    'Esperado US$': formatCurrency(record.expectedUsd),
    'Real US$': formatCurrency(record.actualUsd),
    'Diferencia US$': formatCurrency(record.differenceUsd),
  }));

export const exportCashManagementReportToExcel = (
  records: CashManagementReportRecord[],
  summary: CashManagementReportSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[
      `Gestiones: ${summary.managementCount}`,
      `Abiertas: ${summary.openCount}`,
      `Cerradas: ${summary.closedCount}`,
      `Diferencia C$: ${formatCurrency(summary.differenceNio)}`,
      `Diferencia US$: ${formatCurrency(summary.differenceUsd)}`,
    ]],
    { origin: -1 },
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gestión de Caja');
  XLSX.writeFile(workbook, `gestion-de-caja-${Date.now()}.xlsx`);
};

export const exportCashManagementReportToPdf = (
  records: CashManagementReportRecord[],
  summary: CashManagementReportSummary,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Reporte de Gestión de Caja', 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Gestiones: ${summary.managementCount}    Abiertas: ${summary.openCount}    Cerradas: ${summary.closedCount}    Diferencia C$: ${formatCurrency(summary.differenceNio)}    Diferencia US$: ${formatCurrency(summary.differenceUsd)}`,
    40,
    58,
  );

  autoTable(doc, {
    startY: 72,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [33, 79, 122] },
    head: [[
      'Caja',
      'Sucursal',
      'Responsable',
      'Abierta',
      'Cerrada',
      'Estado',
      'Esperado C$',
      'Real C$',
      'Dif. C$',
      'Esperado US$',
      'Real US$',
      'Dif. US$',
    ]],
    body: records.map((record) => [
      `${record.cashRegisterCode}\n${record.cashRegisterName}`,
      record.branchName ?? record.branchCode,
      record.responsibleEmployeeName,
      formatDateTime(record.openedAt),
      formatDateTime(record.closedAt),
      record.status,
      formatCurrency(record.expectedNio),
      formatCurrency(record.actualNio),
      formatCurrency(record.differenceNio),
      formatCurrency(record.expectedUsd),
      formatCurrency(record.actualUsd),
      formatCurrency(record.differenceUsd),
    ]),
  });

  doc.save(`gestion-de-caja-${Date.now()}.pdf`);
};
