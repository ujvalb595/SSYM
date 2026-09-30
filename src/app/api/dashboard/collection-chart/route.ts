import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const FINANCIAL_YEAR_MONTHS = [
  { month: 10, label: "OCT" },
  { month: 11, label: "NOV" },
  { month: 12, label: "DEC" },
  { month: 1, label: "JAN" },
  { month: 2, label: "FEB" },
  { month: 3, label: "MAR" },
  { month: 4, label: "APR" },
  { month: 5, label: "MAY" },
  { month: 6, label: "JUN" },
  { month: 7, label: "JUL" },
  { month: 8, label: "AUG" },
  { month: 9, label: "SEP" },
];

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const financialYearParam = Number(
    request.nextUrl.searchParams.get("financialYear")
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const defaultFinancialYearStart =
    currentMonth >= 10 ? currentYear : currentYear - 1;

  const financialYearStart =
    Number.isInteger(financialYearParam) &&
    financialYearParam >= 2000 &&
    financialYearParam <= 2100
      ? financialYearParam
      : defaultFinancialYearStart;

  const totalMembersCount = await prisma.user.count({
    where: { isActive: true },
  });
  const monthlyMemberTarget = totalMembersCount * 500;

  const groupedPayments = await prisma.payment.groupBy({
    by: ["month", "year"],
    where: {
      status: "APPROVED",
      OR: [
        { year: financialYearStart, month: { gte: 10 } },
        { year: financialYearStart + 1, month: { lte: 9 } },
      ],
    },
    _sum: {
      amount: true,
    },
  });

  const collectionLookup = new Map<string, number>();
  for (const row of groupedPayments) {
    collectionLookup.set(
      `${row.year}-${row.month}`,
      Number(row._sum.amount ?? 0)
    );
  }

  const chartData = FINANCIAL_YEAR_MONTHS.map((item) => {
    const year = item.month >= 10 ? financialYearStart : financialYearStart + 1;
    const collected = collectionLookup.get(`${year}-${item.month}`) || 0;

    return {
      month: item.label,
      collected,
      pending: Math.max(monthlyMemberTarget - collected, 0),
    };
  });

  return NextResponse.json({
    financialYear: `FY ${financialYearStart}-${String(
      financialYearStart + 1
    ).slice(-2)}`,
    chartData,
  });
}
