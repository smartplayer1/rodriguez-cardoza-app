import jsPDF from "jspdf";

import type { ArqueoCajaData } from "./arqueo-caja-data";

const COMPANY_NAME = "Rodríguez Cardoza Cía. Ltda.";
const COMPANY_RUC = "J0510000143039";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const exportArqueoCajaConsolidadoToPdf = (data: ArqueoCajaData) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 42;
  const marginRight = 42;
  const contentRight = pageWidth - marginRight;
  const valueX = contentRight;
  const lineHeight = 13.5;

  let y = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(COMPANY_NAME, pageWidth / 2, y, { align: "center" });
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(COMPANY_RUC, pageWidth / 2, y, { align: "center" });

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Arqueo de Caja", pageWidth / 2, y, { align: "center" });
  y += 14;
  doc.text(data.branchName, pageWidth / 2, y, { align: "center" });

  y += 22;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.dateLabel, marginLeft + 32, y);

  doc.setFont("helvetica", "bold");
  doc.text("Responsable de Facturación", marginLeft + 260, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.responsibleName, marginLeft + 260, y + 12);

  y += 26;

  const drawSectionTitle = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(title, marginLeft, y);
    y += lineHeight;
  };

  const drawRow = (
    number: string,
    label: string,
    value: string,
    options?: { bold?: boolean; indent?: number; suffix?: string },
  ) => {
    const indent = options?.indent ?? 0;
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.text(number, marginLeft + indent, y);
    doc.text(label, marginLeft + indent + 16, y);

    const prefix = options?.suffix ?? "C$";
    doc.text(prefix, valueX - 90, y);
    doc.text(value, valueX, y, { align: "right" });

    const dotsStart = marginLeft + indent + 16 + doc.getTextWidth(label) + 6;
    const dotsEnd = valueX - 96;
    if (dotsEnd > dotsStart) {
      doc.setLineDashPattern([1, 2], 0);
      doc.line(dotsStart, y - 2, dotsEnd, y - 2);
      doc.setLineDashPattern([], 0);
    }

    y += lineHeight;
  };

  drawSectionTitle("I. Ingresos en Efectivo");
  drawRow("1", "Ingresos por ventas  (Suma de subrenglones 1.1 a 1.4)", formatCurrency(data.salesTotal), {
    bold: true,
  });

  if (data.registers.length > 0) {
    data.registers.forEach((row, index) => {
      const rangeText =
        row.from !== null && row.to !== null ? `${row.from} al ${row.to}` : "Sin documentos";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`1.${index + 1}`, marginLeft + 14, y);
      doc.text(row.label, marginLeft + 40, y);
      doc.text(row.series, marginLeft + 90, y);
      doc.text(rangeText, marginLeft + 130, y);
      doc.text(formatCurrency(row.total), valueX, y, { align: "right" });
      y += lineHeight;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Sin cajas cerradas en el período seleccionado.", marginLeft + 40, y);
    y += lineHeight;
  }

  drawRow("2", "Recuperaciones Económicas  (Detalle Adjunto)", formatCurrency(data.recoveryTotal));
  drawRow("3", "Total Ingresos Brutos  (Renglón 1 más 2)", formatCurrency(data.grossIncomeTotal), {
    bold: true,
  });

  y += 6;
  drawSectionTitle("II. Documentos no efectivos, egresos, Depósitos y Transferencias");
  drawRow(
    "4",
    `Documentos no Efectivos (Facturas de Crédito)  ${data.creditInvoicesCount}`,
    formatCurrency(data.creditInvoicesTotal),
  );
  drawRow("5", "Vales de Caja  (Detalle Adjunto)  0", formatCurrency(data.cashVouchersTotal));
  drawRow("6", "Ordenes de Pago  (Detalle Adjunto)  0", formatCurrency(data.paymentOrdersTotal));
  drawRow("7", "Facturas membretadas  0", formatCurrency(data.letterheadInvoicesTotal));
  drawRow("8", "Depósitos y/o transferencias  0", formatCurrency(data.depositsTotal));
  drawRow("9", "Egresos con depósitos  0", formatCurrency(data.outflowsWithDepositsTotal));
  drawRow(
    "10",
    "Total documentos no efectivos, egresos, depósitos  (Suma de Renglones 4 al 8)",
    formatCurrency(data.nonCashTotal),
    { bold: true },
  );

  y += 6;
  drawSectionTitle("III. Resultados  (Determinación de sobrantes o faltante de caja)");
  drawRow(
    "11",
    "Saldo de Caja según arqueo  (Renglón 3 menos (-) renglón 10)",
    formatCurrency(data.balanceAccordingToArqueo),
    { bold: true },
  );
  drawRow(
    "12",
    "Saldo de Caja en efectivo en Córdobas  (Detalle Adjunto)",
    formatCurrency(data.cashBalanceNio),
  );
  drawRow(
    "13",
    `Saldo de Caja en efectivo en Dólares  TC ${data.exchangeRate}  (Detalle Adjunto)`,
    formatCurrency(data.cashBalanceUsd),
    { suffix: "U$" },
  );
  drawRow("14", "Total Saldo de Caja en efectivo", formatCurrency(data.totalCashBalance), {
    bold: true,
  });

  const isSurplus = data.surplus >= 0;
  const surplusLabel = isSurplus ? "Sobrante de Caja" : "Faltante de Caja";

  doc.setFillColor(190, 220, 245);
  doc.rect(marginLeft, y - 9, contentRight - marginLeft, 13, "F");
  drawRow("15", surplusLabel, formatCurrency(Math.abs(data.surplus)), { bold: true });

  y += 14;
  doc.setDrawColor(0);
  doc.setLineWidth(0.75);
  doc.line(marginLeft, y, contentRight, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Transferencia Interna de Efectivo  (Monto para depósito)", marginLeft, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("De", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.responsibleName, marginLeft + 22, y);

  doc.setFont("helvetica", "bold");
  doc.text("Responsable de Facturación de", marginLeft + 260, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.branchName, marginLeft + 260, y + 12);

  y += 24;
  doc.setFont("helvetica", "bold");
  doc.text("Para", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text("Administración", marginLeft + 28, y);
  doc.setFont("helvetica", "bold");
  doc.text("Cantidad C$", marginLeft + 260, y);
  doc.line(marginLeft + 330, y, contentRight, y);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Concepto", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total Facturación ${formatCurrency(data.salesTotal)}  mas ${surplusLabel} C$ ${formatCurrency(
      Math.abs(data.surplus),
    )}`,
    marginLeft + 56,
    y,
  );

  y += 30;
  const boxWidth = (contentRight - marginLeft - 20) / 3;
  const boxHeight = 46;
  const boxLabels: Array<[string, string]> = [
    ["Revisado por", "Dep. Contabilidad"],
    ["Recibido por (Documentos y efectivo)", "Admón. o coordinadora de centro"],
    ["Elaborado y entregado por", "Responsable de Facturación"],
  ];

  boxLabels.forEach(([title, subtitle], index) => {
    const boxX = marginLeft + index * (boxWidth + 10);
    doc.setDrawColor(0);
    doc.setLineWidth(0.75);
    doc.rect(boxX, y, boxWidth, boxHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(title, boxX + boxWidth / 2, y + boxHeight - 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, boxX + boxWidth / 2, y + boxHeight - 6, { align: "center" });
  });

  doc.save(`arqueo-de-caja-${data.branchName.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
};
