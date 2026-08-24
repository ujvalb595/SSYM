import * as XLSX from "xlsx";

export interface ReportDataPayload {
  periodLabel: string;
  generatedAt: string;
  summary: {
    totalMembers: number;
    totalPaymentsCount: number;
    totalPaymentsAmount: number;
    totalDonationsCount: number;
    totalDonationsAmount: number;
    totalIncomeAmount: number;
    totalExpensesCount: number;
    totalExpensesAmount: number;
    netBalanceAmount: number;
  };
  data: {
    payments: {
      id: string;
      memberName: string;
      mobileNumber: string;
      membershipNumber: string;
      month: number;
      year: number;
      amount: number;
      status: string;
      transactionId: string;
      remarks: string;
      submittedAt: string | null;
      approvedAt: string | null;
      approvedByName: string;
    }[];
    donations: {
      id: string;
      donorName: string;
      title: string;
      description: string;
      amount: number;
      date: string;
      createdByName: string;
    }[];
    expenses: {
      id: string;
      title: string;
      description: string;
      amount: number;
      date: string;
      createdByName: string;
    }[];
  };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDateStr(isoStr?: string | null): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function exportToExcel(reportData: ReportDataPayload) {
  const wb = XLSX.utils.book_new();
  const { periodLabel, summary, data, generatedAt } = reportData;

  // ==========================================
  // 1. TAB: Summary & Global Totals
  // ==========================================
  const summaryRows: (string | number)[][] = [
    ["SHIV SAI YUVAK MANDAL"],
    ["COMPREHENSIVE FINANCIAL AUDIT & STATEMENT"],
    [],
    ["Report Period:", periodLabel],
    ["Report Generated At:", formatDateStr(generatedAt)],
    ["Total Registered Active Members:", summary.totalMembers],
    [],
    ["============================================================"],
    ["GLOBAL FINANCIAL SUMMARY & TREASURY BALANCE"],
    ["============================================================"],
    ["Category", "Transaction Count", "Total Amount (₹ INR)", "Notes"],
    [
      "Member Subscription Payments",
      summary.totalPaymentsCount,
      summary.totalPaymentsAmount,
      "Approved monthly subscriptions"
    ],
    [
      "Community Donations",
      summary.totalDonationsCount,
      summary.totalDonationsAmount,
      "Direct voluntary contributions"
    ],
    [
      "TOTAL INFLOW / GROSS REVENUE",
      summary.totalPaymentsCount + summary.totalDonationsCount,
      summary.totalIncomeAmount,
      "Sum of all Payments & Donations"
    ],
    [
      "TOTAL EXPENDITURES / EXPENSES",
      summary.totalExpensesCount,
      summary.totalExpensesAmount,
      "All recorded mandal expenses"
    ],
    [
      "NET TREASURY BALANCE / SURPLUS",
      "-",
      summary.netBalanceAmount,
      summary.netBalanceAmount >= 0 ? "Positive Net Surplus" : "Deficit"
    ],
    [],
    ["============================================================"],
    ["SHEET NAVIGATION"],
    ["• Tab 1: Summary & Global Totals (This Sheet)"],
    ["• Tab 2: Payments - Detailed record of all member subscription payments"],
    ["• Tab 3: Donations - Detailed record of all community donations"],
    ["• Tab 4: Expenses - Detailed record of all expenditures & bills"],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [
    { wch: 38 },
    { wch: 22 },
    { wch: 26 },
    { wch: 38 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary & Global Totals");

  // ==========================================
  // 2. TAB: Payments
  // ==========================================
  const paymentRows: (string | number)[][] = [
    ["SHIV SAI YUVAK MANDAL - MEMBER PAYMENTS REGISTER"],
    [`Period: ${periodLabel} | Total Payments: ${data.payments.length} | Total Collected: ₹ ${summary.totalPaymentsAmount.toLocaleString("en-IN")}`],
    [],
    [
      "S.No",
      "Member Name",
      "Mobile Number",
      "Membership ID",
      "Paid Month",
      "Paid Year",
      "Amount (₹)",
      "Status",
      "Transaction ID",
      "Submission Date",
      "Approval Date",
      "Approved By",
      "Remarks",
    ],
  ];

  data.payments.forEach((p, idx) => {
    paymentRows.push([
      idx + 1,
      p.memberName,
      p.mobileNumber,
      p.membershipNumber,
      MONTH_NAMES[p.month - 1] || `Month ${p.month}`,
      p.year,
      p.amount,
      p.status,
      p.transactionId,
      formatDateStr(p.submittedAt),
      formatDateStr(p.approvedAt),
      p.approvedByName,
      p.remarks,
    ]);
  });

  // Payments Total Row
  paymentRows.push([]);
  paymentRows.push([
    "TOTAL",
    `${data.payments.length} Record(s)`,
    "",
    "",
    "",
    "",
    summary.totalPaymentsAmount,
    "APPROVED ONLY",
    "",
    "",
    "",
    "",
    "",
  ]);

  const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
  wsPayments["!cols"] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPayments, "Payments");

  // ==========================================
  // 3. TAB: Donations
  // ==========================================
  const donationRows: (string | number)[][] = [
    ["SHIV SAI YUVAK MANDAL - COMMUNITY DONATIONS REGISTER"],
    [`Period: ${periodLabel} | Total Donations: ${data.donations.length} | Total Received: ₹ ${summary.totalDonationsAmount.toLocaleString("en-IN")}`],
    [],
    [
      "S.No",
      "Donor Name",
      "Title / Purpose",
      "Description",
      "Amount (₹)",
      "Donation Date",
      "Recorded By",
    ],
  ];

  data.donations.forEach((d, idx) => {
    donationRows.push([
      idx + 1,
      d.donorName,
      d.title,
      d.description,
      d.amount,
      formatDateStr(d.date),
      d.createdByName,
    ]);
  });

  // Donations Total Row
  donationRows.push([]);
  donationRows.push([
    "TOTAL",
    `${data.donations.length} Record(s)`,
    "",
    "",
    summary.totalDonationsAmount,
    "",
    "",
  ]);

  const wsDonations = XLSX.utils.aoa_to_sheet(donationRows);
  wsDonations["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 26 },
    { wch: 34 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDonations, "Donations");

  // ==========================================
  // 4. TAB: Expenses
  // ==========================================
  const expenseRows: (string | number)[][] = [
    ["SHIV SAI YUVAK MANDAL - EXPENSES & EXPENDITURES REGISTER"],
    [`Period: ${periodLabel} | Total Expenses: ${data.expenses.length} | Total Spent: ₹ ${summary.totalExpensesAmount.toLocaleString("en-IN")}`],
    [],
    [
      "S.No",
      "Expense Title",
      "Description / Category",
      "Amount (₹)",
      "Expense Date",
      "Recorded By",
    ],
  ];

  data.expenses.forEach((e, idx) => {
    expenseRows.push([
      idx + 1,
      e.title,
      e.description,
      e.amount,
      formatDateStr(e.date),
      e.createdByName,
    ]);
  });

  // Expenses Total Row
  expenseRows.push([]);
  expenseRows.push([
    "TOTAL",
    `${data.expenses.length} Record(s)`,
    "",
    summary.totalExpensesAmount,
    "",
    "",
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
  wsExpenses["!cols"] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 36 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

  // Format file name
  const sanitizedPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `SSYM_Financial_Report_${sanitizedPeriod}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
