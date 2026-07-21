import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CollectionsReportRecord, CollectionsReportSummary } from '@/app/type/collections-report';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
};

const formatAppliedInvoices = (record: CollectionsReportRecord) =>
  record.appliedInvoices
    .map((invoice) => `${invoice.document} (${invoice.clientCode}): C$${formatCurrency(invoice.amountNio)}`)
    .join('; ');

const buildRows = (records: CollectionsReportRecord[]) =>
  records.map((record) => ({
    Número: record.number,
    Fecha: formatDateTime(record.collectionDate),
    Moneda: record.currency,
    'Código Caja': record.cashRegisterCode,
    Caja: record.cashRegisterName,
    Sucursal: record.branchName ?? record.branchCode,
    Estado: record.status,
    'Efectivo': formatCurrency(record.cashTotal),
    'Transferencia': formatCurrency(record.transferTotal),
    'Total Recibido': formatCurrency(record.totalReceived),
    'Aplicado C$': formatCurrency(record.appliedAmountNio),
    'Facturas Aplicadas': formatAppliedInvoices(record),
  }));

export const exportCollectionsReportToExcel = (
  records: CollectionsReportRecord[],
  summary: CollectionsReportSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[
      `Cobros: ${summary.collectionCount}`,
      `Efectivo: C$${formatCurrency(summary.cashTotal)}`,
      `Transferencia: C$${formatCurrency(summary.transferTotal)}`,
      `Total Recibido: C$${formatCurrency(summary.totalReceived)}`,
      `Aplicado C$: ${formatCurrency(summary.appliedAmountNio)}`,
    ]],
    { origin: -1 },
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cobros');
  XLSX.writeFile(workbook, `cobros-${Date.now()}.xlsx`);
};

export const exportCollectionsReportToPdf = (
  records: CollectionsReportRecord[],
  summary: CollectionsReportSummary,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Reporte de Cobros', 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Cobros: ${summary.collectionCount}    Efectivo: C$${formatCurrency(summary.cashTotal)}    Transferencia: C$${formatCurrency(summary.transferTotal)}    Total: C$${formatCurrency(summary.totalReceived)}    Aplicado C$: ${formatCurrency(summary.appliedAmountNio)}`,
    40,
    58,
  );

  autoTable(doc, {
    startY: 72,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [33, 79, 122] },
    head: [[
      'Número',
      'Fecha',
      'Moneda',
      'Caja',
      'Sucursal',
      'Estado',
      'Efectivo',
      'Transferencia',
      'Total',
      'Aplicado C$',
    ]],
    body: records.map((record) => [
      record.number,
      formatDateTime(record.collectionDate),
      record.currency,
      `${record.cashRegisterCode}\n${record.cashRegisterName}`,
      record.branchName ?? record.branchCode,
      record.status,
      formatCurrency(record.cashTotal),
      formatCurrency(record.transferTotal),
      formatCurrency(record.totalReceived),
      formatCurrency(record.appliedAmountNio),
    ]),
  });

  doc.save(`cobros-${Date.now()}.pdf`);
};
