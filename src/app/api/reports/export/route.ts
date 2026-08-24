import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "all";
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    let month = monthParam ? parseInt(monthParam, 10) : undefined;
    let year = yearParam ? parseInt(yearParam, 10) : undefined;
    const dateParam = searchParams.get("date");

    let dateFilterPayment: Prisma.PaymentWhereInput = {
      status: "APPROVED",
    };
    let dateFilterDonation: Prisma.DonationWhereInput = {};
    let dateFilterExpense: Prisma.ExpenseWhereInput = {};
    let periodLabel = "All Time Records";

    if (period === "this_month") {
      month = now.getMonth() + 1;
      year = now.getFullYear();
      const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleString("en-US", { month: "long" });

      periodLabel = `${monthName} ${year}`;
      dateFilterPayment = {
        status: "APPROVED",
        month,
        year,
      };
      dateFilterDonation = {
        date: { gte: monthStart, lte: monthEnd },
      };
      dateFilterExpense = {
        date: { gte: monthStart, lte: monthEnd },
      };
    } else if (period === "last_month") {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      month = prevDate.getMonth() + 1;
      year = prevDate.getFullYear();
      const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleString("en-US", { month: "long" });

      periodLabel = `${monthName} ${year}`;
      dateFilterPayment = {
        status: "APPROVED",
        month,
        year,
      };
      dateFilterDonation = {
        date: { gte: monthStart, lte: monthEnd },
      };
      dateFilterExpense = {
        date: { gte: monthStart, lte: monthEnd },
      };
    } else if (period === "this_year") {
      year = now.getFullYear();
      const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

      periodLabel = `Year ${year}`;
      dateFilterPayment = {
        status: "APPROVED",
        year,
      };
      dateFilterDonation = {
        date: { gte: yearStart, lte: yearEnd },
      };
      dateFilterExpense = {
        date: { gte: yearStart, lte: yearEnd },
      };
    } else if (period === "last_7_days") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      periodLabel = "Last 7 Days";
      dateFilterPayment = {
        status: "APPROVED",
        submittedAt: { gte: start, lte: end },
      };
      dateFilterDonation = {
        date: { gte: start, lte: end },
      };
      dateFilterExpense = {
        date: { gte: start, lte: end },
      };
    } else if (period === "last_30_days") {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      periodLabel = "Last 30 Days";
      dateFilterPayment = {
        status: "APPROVED",
        submittedAt: { gte: start, lte: end },
      };
      dateFilterDonation = {
        date: { gte: start, lte: end },
      };
      dateFilterExpense = {
        date: { gte: start, lte: end },
      };
    } else if (period === "single_date" && (dateParam || startDateParam)) {
      const targetDate = new Date(dateParam || startDateParam!);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      periodLabel = dayStart.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      dateFilterPayment = {
        status: "APPROVED",
        submittedAt: { gte: dayStart, lte: dayEnd },
      };
      dateFilterDonation = {
        date: { gte: dayStart, lte: dayEnd },
      };
      dateFilterExpense = {
        date: { gte: dayStart, lte: dayEnd },
      };
    } else if (period === "custom_month" && month && year) {
      const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleString("en-US", { month: "long" });

      periodLabel = `${monthName} ${year}`;
      dateFilterPayment = {
        status: "APPROVED",
        month,
        year,
      };
      dateFilterDonation = {
        date: { gte: monthStart, lte: monthEnd },
      };
      dateFilterExpense = {
        date: { gte: monthStart, lte: monthEnd },
      };
    } else if (period === "custom_range" && startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);

      periodLabel = `${startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
      dateFilterPayment = {
        status: "APPROVED",
        submittedAt: { gte: startDate, lte: endDate },
      };
      dateFilterDonation = {
        date: { gte: startDate, lte: endDate },
      };
      dateFilterExpense = {
        date: { gte: startDate, lte: endDate },
      };
    }

    const [payments, donations, expenses, totalMembers] = await Promise.all([
      prisma.payment.findMany({
        where: dateFilterPayment,
        orderBy: [{ year: "desc" }, { month: "desc" }, { submittedAt: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
              membershipNumber: true,
            },
          },
          approvedBy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.donation.findMany({
        where: dateFilterDonation,
        orderBy: { date: "desc" },
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.expense.findMany({
        where: dateFilterExpense,
        orderBy: { date: "desc" },
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    const totalPaymentsAmount = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalDonationsAmount = donations.reduce((acc, d) => acc + Number(d.amount), 0);
    const totalIncomeAmount = totalPaymentsAmount + totalDonationsAmount;
    const totalExpensesAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const netBalanceAmount = totalIncomeAmount - totalExpensesAmount;

    return NextResponse.json({
      success: true,
      periodLabel,
      generatedAt: new Date().toISOString(),
      summary: {
        totalMembers,
        totalPaymentsCount: payments.length,
        totalPaymentsAmount,
        totalDonationsCount: donations.length,
        totalDonationsAmount,
        totalIncomeAmount,
        totalExpensesCount: expenses.length,
        totalExpensesAmount,
        netBalanceAmount,
      },
      data: {
        payments: payments.map((p) => ({
          id: p.id,
          memberName: p.user?.name || "Unknown",
          mobileNumber: p.user?.mobileNumber || "-",
          membershipNumber: p.user?.membershipNumber || "-",
          month: p.month,
          year: p.year,
          amount: Number(p.amount),
          status: p.status,
          transactionId: p.transactionId || "-",
          remarks: p.remarks || "-",
          submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
          approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
          approvedByName: p.approvedBy?.name || "-",
        })),
        donations: donations.map((d) => ({
          id: d.id,
          donorName: d.donorName,
          title: d.title || "-",
          description: d.description || "-",
          amount: Number(d.amount),
          date: d.date ? d.date.toISOString() : new Date().toISOString(),
          createdByName: d.createdBy?.name || "-",
        })),
        expenses: expenses.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description || "-",
          amount: Number(e.amount),
          date: e.date ? e.date.toISOString() : new Date().toISOString(),
          createdByName: e.createdBy?.name || "-",
        })),
      },
    });
  } catch (error) {
    console.error("Error generating report export data:", error);
    return NextResponse.json(
      { error: "Failed to generate report export data" },
      { status: 500 }
    );
  }
}
