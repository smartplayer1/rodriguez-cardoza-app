import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AgentNearGoalRecord, AgentsNearGoalsSummary } from '@/app/type/reward-report';

const formatPercentage = (value: number | null) =>
  value === null || value === undefined ? '-' : `${value.toFixed(1)}%`;

const formatNumber = (value: number | null) =>
  value === null || value === undefined ? '-' : value.toLocaleString('es-NI', { maximumFractionDigits: 2 });

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

const buildRows = (records: AgentNearGoalRecord[]) =>
  records.map((record) => ({
    'Código Cliente': record.clientCode,
    Cliente: record.clientName,
    'Tipo Cliente': record.clientType,
    Teléfono: record.phoneNumber ?? '-',
    'Código Promotor': record.promoterCode ?? '-',
    Promotor: record.promoterName ?? '-',
    Regla: record.incentiveRuleName,
    'Tipo de Regla': record.ruleType,
    'Meta Monto': formatNumber(record.amountTarget),
    'Progreso Monto': formatNumber(record.amountProgress),
    '% Monto': formatPercentage(record.amountProgressPercentage),
    'Restante Monto': formatNumber(record.amountRemaining),
    'Meta Producto': formatNumber(record.productVolumeTargetQuantity),
    'Progreso Producto': formatNumber(record.productVolumeProgress),
    '% Producto': formatPercentage(record.productVolumeProgressPercentage),
    'Restante Producto': formatNumber(record.productVolumeRemaining),
    '% Progreso General': formatPercentage(record.overallProgressPercentage),
    Ganados: record.winsCount,
    'Máx. Ganados': record.maxWinsPerClient ?? 'Sin límite',
    'Meta Alcanzada': record.isGoalReached ? 'Sí' : 'No',
    'Máximo Alcanzado': record.isMaxWinsReached ? 'Sí' : 'No',
    'Inicio Regla': formatDate(record.ruleStartDate),
    'Fin Regla': formatDate(record.ruleEndDate),
  }));

export const exportAgentsNearGoalsToExcel = (
  records: AgentNearGoalRecord[],
  summary: AgentsNearGoalsSummary,
) => {
  const rows = buildRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[
      `Participantes: ${summary.participantCount}`,
      `Registros: ${summary.recordCount}`,
      `Progreso promedio: ${summary.averageOverallProgressPercentage.toFixed(1)}%`,
    ]],
    { origin: -1 },
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agentes Cerca de Meta');
  XLSX.writeFile(workbook, `agentes-cerca-de-meta-${Date.now()}.xlsx`);
};

export const exportAgentsNearGoalsToPdf = (
  records: AgentNearGoalRecord[],
  _summary: AgentsNearGoalsSummary,
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 40;
  const marginRight = 40;
  const tableTop = 78;

  const drawHeader = () => {
    doc.setFillColor(198, 224, 244);
    doc.roundedRect(marginLeft, 28, 32, 32, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(45, 85, 130);
    doc.text('R', marginLeft + 9, 45);
    doc.text('C', marginLeft + 17, 55);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.text('Cercas a meta', marginLeft + 44, 49);
  };

  const totalPremio = records.reduce((sum, record) => sum + (record.amountProgress ?? 0), 0);
  const totalMeta = records.reduce((sum, record) => sum + (record.amountTarget ?? 0), 0);
  const totalSaldo = records.reduce((sum, record) => sum + (record.amountRemaining ?? 0), 0);

  autoTable(doc, {
    startY: tableTop,
    margin: { top: tableTop, left: marginLeft, right: marginRight, bottom: 50 },
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [20, 20, 20] },
    headStyles: { fillColor: [222, 235, 247], textColor: [30, 30, 30], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    head: [['Cliente', 'Nombre', 'Tel1', 'Tel2', 'M#', 'Premio', 'Meta', 'Saldo', 'Promotor']],
    body: records.map((record) => [
      record.clientCode,
      record.clientName,
      record.phoneNumber ?? '0',
      '0',
      '',
      formatNumber(record.amountProgress),
      formatNumber(record.amountTarget),
      formatNumber(record.amountRemaining),
      record.promoterCode ?? '-',
    ]),
    foot: [[
      '',
      '',
      '',
      '',
      '',
      formatNumber(totalPremio),
      formatNumber(totalMeta),
      formatNumber(totalSaldo),
      '',
    ]],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: { top: 0.75 },
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
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

  doc.save(`cercas-a-meta-${Date.now()}.pdf`);
};
