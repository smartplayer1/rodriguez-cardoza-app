import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccountsReceivableSummary, ClientPromoterReceivableRecord } from '@/app/type/accounts-receivable-report';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

const buildRows = (records: ClientPromoterReceivableRecord[]) =>
  records.map((record) => ({
    'Código Cliente': record.clientCode,
    Cliente: record.clientName,
    'Tipo Cliente': record.clientType,
    'Código Promotor': record.promoterCode,
    Promotor: record.promoterName ?? '-',
    Factura: record.invoiceNumber,
    'Fecha Factura': formatDate(record.invoiceDate),
    'Fecha Vencimiento': formatDate(record.dueDate),
    'Total C$': formatCurrency(record.invoiceTotalNio),
    'Pagado C$': formatCurrency(record.paidAmountNio),
    'Saldo Pendiente C$': formatCurrency(record.pendingBalanceNio),
    Sucursal: record.branchName ?? record.branchCode,
    Cantón: record.branchCanton ?? '-',
  }));

export const exportAccountsReceivableToExcel = (
  records: ClientPromoterReceivableRecord[],
  summary: AccountsReceivableSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[
      `Facturas: ${summary.invoiceCount}`,
      `Total: C$${formatCurrency(summary.invoiceTotalNio)}`,
      `Pagado: C$${formatCurrency(summary.paidTotalNio)}`,
      `Pendiente: C$${formatCurrency(summary.pendingBalanceTotalNio)}`,
    ]],
    { origin: -1 },
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuentas por Cobrar');
  XLSX.writeFile(workbook, `cuentas-por-cobrar-${Date.now()}.xlsx`);
};

export const exportAccountsReceivableToPdf = (
  records: ClientPromoterReceivableRecord[],
  summary: AccountsReceivableSummary,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Reporte de Cuentas por Cobrar - Cliente / Promotor', 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Facturas: ${summary.invoiceCount}    Total: C$${formatCurrency(summary.invoiceTotalNio)}    Pagado: C$${formatCurrency(summary.paidTotalNio)}    Pendiente: C$${formatCurrency(summary.pendingBalanceTotalNio)}`,
    40,
    58,
  );

  autoTable(doc, {
    startY: 72,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [33, 79, 122] },
    head: [[
      'Cliente',
      'Promotor',
      'Factura',
      'Fecha',
      'Vencimiento',
      'Total C$',
      'Pagado C$',
      'Saldo C$',
      'Sucursal',
    ]],
    body: records.map((record) => [
      `${record.clientCode}\n${record.clientName}`,
      record.promoterName ?? record.promoterCode,
      record.invoiceNumber,
      formatDate(record.invoiceDate),
      formatDate(record.dueDate),
      formatCurrency(record.invoiceTotalNio),
      formatCurrency(record.paidAmountNio),
      formatCurrency(record.pendingBalanceNio),
      record.branchName ?? record.branchCode,
    ]),
  });

  doc.save(`cuentas-por-cobrar-${Date.now()}.pdf`);
};
