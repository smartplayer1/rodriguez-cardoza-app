import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesInvoiceRecord, SalesInvoicesSummary } from '@/app/type/sales-report';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
};

const buildRows = (records: SalesInvoiceRecord[]) =>
  records.map((record) => ({
    Documento: record.document,
    Fecha: formatDateTime(record.issuedAt),
    'Código Cliente': record.clientCode,
    Cliente: record.clientName ?? '-',
    'Código Promotor': record.promoterCode,
    Promotor: record.promoterName ?? '-',
    Sucursal: record.branchName ?? record.branchCode,
    Cajero: record.cashier,
    'Tipo de Pago': record.chargeStatus,
    'Total Bruto': formatCurrency(record.grossTotal),
    Descuento: formatCurrency(record.discountTotal),
    Impuesto: formatCurrency(record.taxTotal),
    'Total Neto': formatCurrency(record.netTotal),
    Anulada: record.isVoided ? 'Sí' : 'No',
  }));

export const exportSalesInvoicesToExcel = (
  records: SalesInvoiceRecord[],
  summary: SalesInvoicesSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[
      `Facturas: ${summary.invoiceCount}`,
      `Bruto: ${formatCurrency(summary.grossTotal)}`,
      `Neto: ${formatCurrency(summary.netTotal)}`,
      `Anuladas: ${summary.voidedCount}`,
    ]],
    { origin: -1 },
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
  XLSX.writeFile(workbook, `facturas-${Date.now()}.xlsx`);
};

export const exportSalesInvoicesToPdf = (
  records: SalesInvoiceRecord[],
  summary: SalesInvoicesSummary,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Reporte de Facturas de Venta', 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Facturas: ${summary.invoiceCount}    Bruto: ${formatCurrency(summary.grossTotal)}    Descuentos: ${formatCurrency(summary.lineDiscountTotal + summary.generalDiscountTotal)}    Impuestos: ${formatCurrency(summary.tax1Total + summary.tax2Total)}    Neto: ${formatCurrency(summary.netTotal)}    Anuladas: ${summary.voidedCount}`,
    40,
    58,
  );

  autoTable(doc, {
    startY: 72,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [33, 79, 122] },
    head: [[
      'Documento',
      'Fecha',
      'Cliente',
      'Promotor',
      'Sucursal',
      'Cajero',
      'Pago',
      'Bruto',
      'Descuento',
      'Impuesto',
      'Neto',
      'Anulada',
    ]],
    body: records.map((record) => [
      record.document,
      formatDateTime(record.issuedAt),
      record.clientName ?? record.clientCode,
      record.promoterName ?? record.promoterCode,
      record.branchName ?? record.branchCode,
      record.cashier,
      record.chargeStatus,
      formatCurrency(record.grossTotal),
      formatCurrency(record.discountTotal),
      formatCurrency(record.taxTotal),
      formatCurrency(record.netTotal),
      record.isVoided ? 'Sí' : 'No',
    ]),
  });

  doc.save(`facturas-${Date.now()}.pdf`);
};
