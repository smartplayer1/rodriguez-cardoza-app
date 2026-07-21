import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { CashManagementClosingSummary } from "@/app/type/cash-management";

const COMPANY_NAME = "Rodríguez Cardoza Cía. Ltda.";
const COMPANY_RUC = "J0510000143039";

const COLOR_ROC: [number, number, number] = [51, 122, 183];
const COLOR_CREDITO: [number, number, number] = [176, 42, 42];
const COLOR_EGRESOS: [number, number, number] = [82, 110, 62];

const formatCurrency = (value: number) =>
  value.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatLongDate = (value: string | null) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const formatted = new Intl.DateTimeFormat("es-NI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatShortDate = (value: string | null) => {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

type RocRow = {
  receiptNumber: string;
  clientName: string;
  total: number;
};

type CreditRow = {
  document: string;
  clientCode: string;
  clientName: string;
  total: number;
};

type OutflowRow = {
  number: string;
  concept: string;
  total: number;
};

const buildRocRows = (summary: CashManagementClosingSummary): RocRow[] =>
  summary.collections
    .filter((collection) => !collection.header.voidedAt)
    .map((collection) => {
      const relatedInvoice = summary.invoices.find(
        (invoice) =>
          collection.invoiceAllocations.some((allocation) => allocation.invoiceId === invoice.id) ||
          invoice.document === collection.header.invoiceDocument,
      );

      return {
        receiptNumber: collection.header.number,
        clientName: relatedInvoice?.clientName ?? "-",
        total: collection.summary.total,
      };
    });

const buildCreditRows = (summary: CashManagementClosingSummary): CreditRow[] =>
  summary.invoices
    .filter((invoice) => !invoice.isVoided && invoice.chargeStatus.toUpperCase() !== "CONTADO")
    .map((invoice) => ({
      document: invoice.document,
      clientCode: invoice.clientCode,
      clientName: invoice.clientName,
      total: invoice.invoiceAmountNio,
    }));

const buildOutflowRows = (summary: CashManagementClosingSummary): OutflowRow[] =>
  summary.outflows
    .filter((outflow) => !outflow.voidedAt)
    .map((outflow) => ({
      number: outflow.number,
      concept: outflow.concept,
      total: outflow.total,
    }));

export const exportArqueoDeCajaToPdf = (summary: CashManagementClosingSummary) => {
  const { cashManagement } = summary;

  const rocRows = buildRocRows(summary);
  const creditRows = buildCreditRows(summary);
  const outflowRows = buildOutflowRows(summary);

  const rocTotal = rocRows.reduce((sum, row) => sum + row.total, 0);
  const creditTotal = creditRows.reduce((sum, row) => sum + row.total, 0);
  const outflowTotal = outflowRows.reduce((sum, row) => sum + row.total, 0);

  const cashDenominations = cashManagement.closingDenominations.filter(
    (denomination) => denomination.currency === "NIO",
  );
  const totalEfectivo = cashDenominations.reduce((sum, item) => sum + item.total, 0);

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 40;
  const marginRight = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, pageWidth / 2, 40, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_RUC, pageWidth / 2, 53, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha", marginLeft, 74);
  doc.setFont("helvetica", "normal");
  doc.text(formatLongDate(cashManagement.closedAt), marginLeft + 34, 74);

  doc.setFont("helvetica", "bold");
  doc.text(`A ${cashManagement.id}`, pageWidth - marginRight - 100, 74, { align: "left" });
  doc.text(cashManagement.cashRegisterName, pageWidth - marginRight, 74, { align: "right" });

  const columnGap = 14;
  const leftWidth = (contentWidth - columnGap) * 0.42;
  const rightWidth = contentWidth - columnGap - leftWidth;
  const rightX = marginLeft + leftWidth + columnGap;
  const tablesStartY = 90;

  autoTable(doc, {
    startY: tablesStartY,
    margin: { left: marginLeft, right: pageWidth - marginLeft - leftWidth },
    tableWidth: leftWidth,
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: COLOR_ROC, textColor: 255, halign: "left" },
    footStyles: { fillColor: COLOR_ROC, textColor: 255, fontStyle: "bold" },
    head: [["Rbo No.", "Nombre y apellidos", "Total"]],
    body:
      rocRows.length > 0
        ? rocRows.map((row) => [row.receiptNumber, row.clientName, formatCurrency(row.total)])
        : [["-", "Sin recibos registrados", ""]],
    foot: [[String(rocRows.length), "Totales ROC", formatCurrency(rocTotal)]],
    columnStyles: { 2: { halign: "right" } },
  });
  const rocFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: tablesStartY,
    margin: { left: rightX, right: marginRight },
    tableWidth: rightWidth,
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: COLOR_CREDITO, textColor: 255, halign: "left" },
    footStyles: { fillColor: COLOR_CREDITO, textColor: 255, fontStyle: "bold" },
    head: [["Factura", "Codigo", "Nombre", "Total"]],
    body:
      creditRows.length > 0
        ? creditRows.map((row) => [row.document, row.clientCode, row.clientName, formatCurrency(row.total)])
        : [["-", "-", "Sin facturas de crédito", ""]],
    foot: [[String(creditRows.length), "Totales Creditos", "", formatCurrency(creditTotal)]],
    columnStyles: { 3: { halign: "right" } },
  });
  const creditFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: rocFinalY + 12,
    margin: { left: marginLeft, right: pageWidth - marginLeft - leftWidth },
    tableWidth: leftWidth,
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: COLOR_EGRESOS, textColor: 255, halign: "left" },
    footStyles: { fillColor: COLOR_EGRESOS, textColor: 255, fontStyle: "bold" },
    head: [["Factura", "Nombre y apellidos", "Total"]],
    body:
      outflowRows.length > 0
        ? outflowRows.map((row) => [row.number, row.concept, formatCurrency(row.total)])
        : [["-", "Sin egresos registrados", ""]],
    foot: [[String(outflowRows.length), "Totales Egresos", formatCurrency(outflowTotal)]],
    columnStyles: { 2: { halign: "right" } },
  });
  const outflowsFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const detailStartY = Math.max(outflowsFinalY, creditFinalY) + 24;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de Efectivo", marginLeft, detailStartY - 6);

  autoTable(doc, {
    startY: detailStartY,
    margin: { left: marginLeft, right: pageWidth - marginLeft - leftWidth },
    tableWidth: leftWidth,
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: [90, 90, 90], textColor: 255 },
    footStyles: { fillColor: [90, 90, 90], textColor: 255, fontStyle: "bold" },
    head: [["Cant.", "Denominación", "Total"]],
    body:
      cashDenominations.length > 0
        ? cashDenominations.map((item) => [
            String(item.quantity),
            formatCurrency(item.denomination),
            formatCurrency(item.total),
          ])
        : [["-", "Sin denominaciones registradas", ""]],
    foot: [["", "Total Efectivo", formatCurrency(totalEfectivo)]],
    columnStyles: { 0: { halign: "right" }, 2: { halign: "right" } },
  });
  const denominationsFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const stampBoxY = detailStartY;
  const stampBoxHeight = 90;
  doc.setDrawColor(51, 122, 183);
  doc.setLineWidth(1);
  doc.rect(rightX, stampBoxY, rightWidth, stampBoxHeight);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(cashManagement.cashRegisterName.toUpperCase(), rightX + rightWidth / 2, stampBoxY + 30, {
    align: "center",
  });
  doc.text(`ARQUEO No. ${cashManagement.id}`, rightX + rightWidth / 2, stampBoxY + 50, {
    align: "center",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(formatShortDate(cashManagement.closedAt), rightX + rightWidth / 2, stampBoxY + 68, {
    align: "center",
  });

  const summaryStartY = Math.max(denominationsFinalY, stampBoxY + stampBoxHeight) + 20;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Depósito: ${formatCurrency(totalEfectivo)}`, marginLeft, summaryStartY);

  doc.save(`arqueo-de-caja-${cashManagement.id}-${Date.now()}.pdf`);
};
