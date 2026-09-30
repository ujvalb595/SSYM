import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportDataPayload } from "@/lib/export-excel";

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable: {
    finalY: number;
  };
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(isoStr?: string | null): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function exportToPDF(reportData: ReportDataPayload) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const { periodLabel, summary, data, generatedAt } = reportData;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let currentY = 38;

  // 1. Header Banner
  doc.setFillColor(114, 87, 244); // #7257f4
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 60, 10, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SHIV SAI YUVAK MANDAL", margin + 18, currentY + 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Financial Statement & Comprehensive Audit Report", margin + 18, currentY + 44);

  doc.setFontSize(9);
  doc.text(`Period: ${periodLabel}`, pageWidth - margin - 18, currentY + 26, { align: "right" });
  doc.text(
    `Date: ${new Date(generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    pageWidth - margin - 18,
    currentY + 44,
    { align: "right" }
  );

  currentY += 76;

  // 2. Global Financial Totals Card Box
  doc.setFillColor(248, 246, 252);
  doc.setDrawColor(230, 225, 245);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 70, 8, 8, "FD");

  const colWidth = (pageWidth - margin * 2) / 3;

  // Metric 1: Total Inflow
  doc.setTextColor(120, 113, 108);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL INFLOW (REVENUE)", margin + 16, currentY + 20);
  doc.setTextColor(114, 87, 244);
  doc.setFontSize(14);
  doc.text(`₹ ${summary.totalIncomeAmount.toLocaleString("en-IN")}`, margin + 16, currentY + 42);
  doc.setTextColor(168, 162, 158);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Payments: ₹${summary.totalPaymentsAmount.toLocaleString("en-IN")} + Don.: ₹${summary.totalDonationsAmount.toLocaleString("en-IN")}`,
    margin + 16,
    currentY + 56
  );

  // Metric 2: Total Expenses
  doc.setTextColor(120, 113, 108);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL EXPENDITURES", margin + colWidth + 16, currentY + 20);
  doc.setTextColor(225, 29, 72);
  doc.setFontSize(14);
  doc.text(`₹ ${summary.totalExpensesAmount.toLocaleString("en-IN")}`, margin + colWidth + 16, currentY + 42);
  doc.setTextColor(168, 162, 158);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`${summary.totalExpensesCount} Recorded Expenses`, margin + colWidth + 16, currentY + 56);

  // Metric 3: Net Balance / Surplus
  doc.setTextColor(120, 113, 108);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NET TREASURY BALANCE", margin + colWidth * 2 + 16, currentY + 20);
  doc.setTextColor(summary.netBalanceAmount >= 0 ? 4 : 225, summary.netBalanceAmount >= 0 ? 120 : 29, summary.netBalanceAmount >= 0 ? 87 : 72);
  doc.setFontSize(14);
  doc.text(`₹ ${summary.netBalanceAmount.toLocaleString("en-IN")}`, margin + colWidth * 2 + 16, currentY + 42);
  doc.setTextColor(168, 162, 158);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(summary.netBalanceAmount >= 0 ? "Surplus in treasury" : "Deficit", margin + colWidth * 2 + 16, currentY + 56);

  currentY += 86;

  // 3. Summary Breakdown Table
  doc.setTextColor(36, 32, 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. Executive Summary & Category Totals", margin, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["Financial Category", "Transaction Count", "Total Amount (INR)", "Status / Notes"]],
    body: [
      ["Member Subscription Payments", `${summary.totalPaymentsCount} payments`, `₹ ${summary.totalPaymentsAmount.toLocaleString("en-IN")}`, "Approved member dues"],
      ["Community Donations Received", `${summary.totalDonationsCount} donations`, `₹ ${summary.totalDonationsAmount.toLocaleString("en-IN")}`, "Voluntary contributions"],
      ["Total Gross Inflow", `${summary.totalPaymentsCount + summary.totalDonationsCount} entries`, `₹ ${summary.totalIncomeAmount.toLocaleString("en-IN")}`, "All incoming funds"],
      ["Total Expenditures / Expenses", `${summary.totalExpensesCount} bills`, `₹ ${summary.totalExpensesAmount.toLocaleString("en-IN")}`, "All outgoing expenses"],
      ["Net Treasury Surplus / Balance", "-", `₹ ${summary.netBalanceAmount.toLocaleString("en-IN")}`, summary.netBalanceAmount >= 0 ? "Positive Surplus" : "Deficit"],
    ],
    headStyles: {
      fillColor: [114, 87, 244],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 253],
    },
  });

  currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 22;

  // 4. Payments Section Table
  doc.setTextColor(36, 32, 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`2. Member Payments (${data.payments.length} Records)`, margin, currentY);
  currentY += 8;

  const paymentsBody = data.payments.map((p, idx) => [
    idx + 1,
    p.memberName,
    p.mobileNumber,
    `${MONTH_NAMES[p.month - 1] || p.month} ${p.year}`,
    `₹ ${p.amount.toLocaleString("en-IN")}`,
    p.status,
    formatDate(p.approvedAt || p.submittedAt),
  ]);

  if (paymentsBody.length === 0) {
    paymentsBody.push(["-", "No payment records found for this period", "-", "-", "-", "-", "-"]);
  } else {
    paymentsBody.push([
      "Total",
      `${data.payments.length} Payments`,
      "",
      "",
      `₹ ${summary.totalPaymentsAmount.toLocaleString("en-IN")}`,
      "APPROVED",
      "",
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "striped",
    head: [["#", "Member Name", "Mobile", "Month / Year", "Amount", "Status", "Date"]],
    body: paymentsBody,
    headStyles: {
      fillColor: [36, 32, 58],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
    },
  });

  currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 22;

  // 5. Donations Section Table
  if (currentY > pageHeight - 120) {
    doc.addPage();
    currentY = 40;
  }

  doc.setTextColor(36, 32, 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`3. Community Donations (${data.donations.length} Records)`, margin, currentY);
  currentY += 8;

  const donationsBody = data.donations.map((d, idx) => [
    idx + 1,
    d.donorName,
    d.title,
    d.description,
    `₹ ${d.amount.toLocaleString("en-IN")}`,
    formatDate(d.date),
  ]);

  if (donationsBody.length === 0) {
    donationsBody.push(["-", "No donations recorded for this period", "-", "-", "-", "-"]);
  } else {
    donationsBody.push([
      "Total",
      `${data.donations.length} Donations`,
      "",
      "",
      `₹ ${summary.totalDonationsAmount.toLocaleString("en-IN")}`,
      "",
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "striped",
    head: [["#", "Donor Name", "Title / Purpose", "Description", "Amount", "Date"]],
    body: donationsBody,
    headStyles: {
      fillColor: [189, 89, 236], // #bd59ec
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
    },
  });

  currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 22;

  // 6. Expenses Section Table
  if (currentY > pageHeight - 120) {
    doc.addPage();
    currentY = 40;
  }

  doc.setTextColor(36, 32, 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`4. Expenditures & Expenses (${data.expenses.length} Records)`, margin, currentY);
  currentY += 8;

  const expensesBody = data.expenses.map((e, idx) => [
    idx + 1,
    e.title,
    e.description,
    `₹ ${e.amount.toLocaleString("en-IN")}`,
    formatDate(e.date),
    e.createdByName,
  ]);

  if (expensesBody.length === 0) {
    expensesBody.push(["-", "No expenses recorded for this period", "-", "-", "-", "-"]);
  } else {
    expensesBody.push([
      "Total",
      `${data.expenses.length} Expenses`,
      "",
      `₹ ${summary.totalExpensesAmount.toLocaleString("en-IN")}`,
      "",
      "",
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "striped",
    head: [["#", "Expense Title", "Description / Category", "Amount", "Date", "Recorded By"]],
    body: expensesBody,
    headStyles: {
      fillColor: [225, 29, 72], // Rose red
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
    },
  });

  // 7. Page numbering & footer branding
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Shiv Sai Yuvak Mandal • Unity is our strength • Confidential Report`,
      margin,
      pageHeight - 18
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 18,
      { align: "right" }
    );
  }

  const sanitizedPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `SSYM_Financial_Statement_${sanitizedPeriod}_${dateStr}.pdf`;

  doc.save(fileName);
}
