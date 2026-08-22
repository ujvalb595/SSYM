import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import {
  DashboardContent,
  type DashboardData,
} from "@/features/dashboard/components/dashboard-content";

export interface ChartItem {
  month: string;
  collected: number;
  pending: number;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.isActive === false) {
    redirect("/login");
  }

  let dashboardData: DashboardData = {
    totalMembersCount: 0,
    monthlyCollectionSum: 0,
    totalPaymentsReceived: 0,
    totalDonationsReceived: 0,
    totalExpenses: 0,
    targetCollection: 50000,
    recentPayments: [],
    upcomingBirthdays: [],
    chartData: [],
  };

  if (process.env.PRISMA_DATABASE_URL) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Determine the financial year containing the current date (Oct to Sep).
      const financialYearStart = currentMonth >= 10 ? currentYear : currentYear - 1;

      // Parallelize ALL database queries simultaneously in 1 network flight
      const [
        totalMembersCount,
        collectionAgg,
        totalPaymentsAgg,
        totalDonationsAgg,
        totalExpensesAgg,
        rawPayments,
        rawMembers,
        fyGroupedPayments,
      ] = await Promise.all([
        // 1. Total Members count
        prisma.user.count(),

        // 2. Approved Monthly Collection sum for current month
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: "APPROVED",
            month: currentMonth,
            year: currentYear,
          },
        }),

        // 3. Total approved payments received
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: "APPROVED",
          },
        }),

        // 4. Total donations received
        prisma.donation.aggregate({
          _sum: { amount: true },
        }),

        // 5. Total Expenses
        prisma.expense.aggregate({
          _sum: { amount: true },
        }),

        // 6. Recent Payments (latest 5)
        prisma.payment.findMany({
          take: 5,
          orderBy: {
            submittedAt: "desc",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        }),

        // 7. Active Members with Birthdays
        prisma.user.findMany({
          where: {
            birthDate: { not: null },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            birthDate: true,
          },
        }),

        // 8. Financial Year Collections in a single fast groupBy aggregation
        prisma.payment.groupBy({
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
        }),
      ]);

      const monthlyCollectionSum = Number(collectionAgg._sum.amount ?? 0);
      const totalPaymentsReceived = Number(totalPaymentsAgg._sum.amount ?? 0);
      const totalDonationsReceived = Number(totalDonationsAgg._sum.amount ?? 0);
      const totalExpenses = Number(totalExpensesAgg._sum.amount ?? 0);

      const monthNames = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
      ];

      const recentPayments = rawPayments.map((p) => ({
        id: p.id,
        memberName: p.user?.name || "Member",
        monthYear: `${monthNames[p.month - 1] || "AUG"} ${p.year}`,
        amount: Number(p.amount),
        status:
          p.status === "APPROVED"
            ? "Approved"
            : p.status === "PENDING"
            ? "Pending"
            : "Rejected",
      }));

      // Calculate upcoming birthdays
      const upcomingBirthdays = rawMembers
        .map((member) => {
          if (!member.birthDate) return null;
          const birthDate = new Date(member.birthDate);

          let nextBirthday = new Date(
            currentYear,
            birthDate.getMonth(),
            birthDate.getDate()
          );

          if (nextBirthday < now) {
            nextBirthday = new Date(
              currentYear + 1,
              birthDate.getMonth(),
              birthDate.getDate()
            );
          }

          const age = nextBirthday.getFullYear() - birthDate.getFullYear();

          return {
            id: member.id,
            memberName: member.name || "Member",
            dateDay: String(nextBirthday.getDate()).padStart(2, "0"),
            dateMonth: monthNames[nextBirthday.getMonth()],
            age,
            sortDate: nextBirthday.getTime(),
          };
        })
        .filter(
          (b): b is { id: string; memberName: string; dateDay: string; dateMonth: string; age: number; sortDate: number } => b !== null
        )
        .sort((a, b) => a.sortDate - b.sortDate)
        .slice(0, 5)
        .map(({ sortDate: _, ...birthday }) => birthday);

      // Financial year target & map
      const monthlyMemberTarget = totalMembersCount * 500;

      const financialYearMonths = [
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

      // Build collection lookup map in O(1) time from the single groupBy
      const collectionLookup = new Map<string, number>();
      for (const row of fyGroupedPayments) {
        collectionLookup.set(`${row.year}-${row.month}`, Number(row._sum.amount ?? 0));
      }

      const chartData = financialYearMonths.map((item) => {
        const year = item.month >= 10 ? financialYearStart : financialYearStart + 1;
        const collected = collectionLookup.get(`${year}-${item.month}`) || 0;
        const pending = Math.max(monthlyMemberTarget - collected, 0);

        return {
          month: item.label,
          collected,
          pending,
        };
      });

      dashboardData = {
        totalMembersCount,
        monthlyCollectionSum,
        totalPaymentsReceived,
        totalDonationsReceived,
        totalExpenses,
        targetCollection: monthlyMemberTarget,
        recentPayments,
        upcomingBirthdays,
        chartData,
      };
    } catch (e) {
      console.error("Dashboard DB Query Error:", e);
    }
  }

  const userName = session.user.name || "Admin";

  return (
    <DashboardShell title={`Good morning, ${userName}`}>
      <DashboardContent data={dashboardData} />
    </DashboardShell>
  );
}