import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CouponMovementReportRecord,
  CouponMovementsSummary,
  CouponMovementType,
} from '@/app/type/reward-report';

const MOVEMENT_TYPE_LABELS: Record<CouponMovementType, string> = {
  MonthlyAccrualCredit: 'Bono mensual (crédito)',
  MonthlyAccrualDebit: 'Consumo bono mensual (débito)',
};

const formatAmount = (value: number | null) =>
  value === null || value === undefined
    ? '-'
    : value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI');
};

const buildRows = (records: CouponMovementReportRecord[]) =>
  records.map((record) => ({
    Fecha: formatDateTime(record.movementDate),
    'Código Cliente': record.clientCode,
    Cliente: record.clientName,
    'Tipo Cliente': record.clientType,
    Sucursal: record.branchName,
    Tipo: MOVEMENT_TYPE_LABELS[record.movementType],
    Factura: record.invoiceDocument ?? '-',
    Monto: formatAmount(record.amount),
    'Saldo Disponible': formatAmount(record.remainingAmount),
  }));

export const exportCouponMovementsToExcel = (
  records: CouponMovementReportRecord[],
  summary: CouponMovementsSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[
      `Registros: ${summary.recordCount}`,
      `Total acreditado: ${formatAmount(summary.totalCreditedAmount)}`,
      `Total debitado: ${formatAmount(summary.totalDebitedAmount)}`,
      `Neto: ${formatAmount(summary.netAmount)}`,
    ]],
    { origin: -1 },
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos de Cupón');
  XLSX.writeFile(workbook, `movimientos-de-cupon-${Date.now()}.xlsx`);
};

export const exportCouponMovementsToPdf = (
  records: CouponMovementReportRecord[],
  summary: CouponMovementsSummary,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 40;
  const marginRight = 40;
  const tableTop = 70;

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('Movimientos de Cupón', marginLeft, 45);
  };

  autoTable(doc, {
    startY: tableTop,
    margin: { top: tableTop, left: marginLeft, right: marginRight, bottom: 50 },
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [20, 20, 20] },
    headStyles: { fillColor: [222, 235, 247], textColor: [30, 30, 30], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    head: [['Fecha', 'Cliente', 'Sucursal', 'Tipo', 'Factura', 'Monto', 'Saldo']],
    body: records.map((record) => [
      formatDateTime(record.movementDate),
      `${record.clientCode} - ${record.clientName}`,
      record.branchName,
      MOVEMENT_TYPE_LABELS[record.movementType],
      record.invoiceDocument ?? '-',
      formatAmount(record.amount),
      formatAmount(record.remainingAmount),
    ]),
    foot: [[
      '', '', '', '', 'Acreditado / Debitado / Neto',
      `${formatAmount(summary.totalCreditedAmount)} / ${formatAmount(summary.totalDebitedAmount)}`,
      formatAmount(summary.netAmount),
    ]],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: { top: 0.75 },
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    didDrawPage: drawHeader,
  });

  const pageCount = doc.getNumberOfPages();
  const todayLabel = (() => {
    const formatted = new Intl.DateTimeFormat('es-NI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  })();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(todayLabel, marginLeft, pageHeight - 24);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - marginRight, pageHeight - 24, { align: 'right' });
  }

  doc.save(`movimientos-de-cupon-${Date.now()}.pdf`);
};
