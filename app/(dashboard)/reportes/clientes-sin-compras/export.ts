import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClientWithoutPurchaseRecord, ClientsWithoutPurchasesSummary } from '@/app/type/client-report';

const buildRows = (records: ClientWithoutPurchaseRecord[]) =>
  records.map((record) => ({
    'Código Cliente': record.clientCode,
    Cliente: record.clientName,
    Teléfono: record.phoneNumber ?? '-',
    Cantón: record.canton ?? '-',
    'Tipo Cliente': record.clientType,
    'Código Sucursal': record.branchCode,
    Sucursal: record.branchName ?? '-',
    'Código Promotor': record.promoterCode ?? '-',
    Promotor: record.promoterName ?? '-',
  }));

export const exportClientsWithoutPurchasesToExcel = (
  records: ClientWithoutPurchaseRecord[],
  summary: ClientsWithoutPurchasesSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(worksheet, [[`Clientes sin compras: ${summary.clientCount}`]], { origin: -1 });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes Sin Compras');
  XLSX.writeFile(workbook, `clientes-sin-compras-${Date.now()}.xlsx`);
};

export const exportClientsWithoutPurchasesToPdf = (
  records: ClientWithoutPurchaseRecord[],
  summary: ClientsWithoutPurchasesSummary,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Reporte de Clientes Sin Compras', 40, 40);
  doc.setFontSize(10);
  doc.text(`Clientes sin compras: ${summary.clientCount}`, 40, 58);

  autoTable(doc, {
    startY: 72,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [33, 79, 122] },
    head: [[
      'Código',
      'Cliente',
      'Teléfono',
      'Cantón',
      'Tipo',
      'Sucursal',
      'Promotor',
    ]],
    body: records.map((record) => [
      record.clientCode,
      record.clientName,
      record.phoneNumber ?? '-',
      record.canton ?? '-',
      record.clientType,
      record.branchName ?? record.branchCode,
      record.promoterName ?? record.promoterCode ?? '-',
    ]),
  });

  doc.save(`clientes-sin-compras-${Date.now()}.pdf`);
};
