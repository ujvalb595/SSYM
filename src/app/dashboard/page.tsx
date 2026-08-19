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

      // 1. Total Members count
      const totalMembersCount = await prisma.user.count();

      // 2. Approved Monthly Collection sum for current month
      const collectionAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "APPROVED",
          month: currentMonth,
          year: currentYear,
        },
      });

      const monthlyCollectionSum = Number(
        collectionAgg._sum.amount ?? 0
      );

      // 3. Total approved payments received
      const totalPaymentsAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "APPROVED",
        },
      });

      const totalPaymentsReceived = Number(
        totalPaymentsAgg._sum.amount ?? 0
      );

      // 4. Total donations received
      const totalDonationsAgg = await prisma.donation.aggregate({
        _sum: { amount: true },
      });

      const totalDonationsReceived = Number(
        totalDonationsAgg._sum.amount ?? 0
      );

      // 5. Pending Payments count
      const pendingPaymentsCount = await prisma.payment.count({
        where: {
          status: "PENDING",
        },
      });

      // 6. Total Expenses
      const totalExpensesAgg = await prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
      });

      const totalExpenses = Number(
        totalExpensesAgg._sum.amount ?? 0
      );

      // 7. Recent Payments (latest 5)
      const rawPayments = await prisma.payment.findMany({
        take: 5,
        orderBy: {
          submittedAt: "desc",
        },
        include: {
          user: true,
        },
      });

      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
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

      // 8. Upcoming Birthdays
      const rawMembers = await prisma.user.findMany({
        where: {
          birthDate: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          birthDate: true,
        },
      });

      const upcomingBirthdays = rawMembers
        .map((member) => {
          if (!member.birthDate) return null;

          const birthDate = new Date(member.birthDate);

          // Create this year's birthday
          let nextBirthday = new Date(
            currentYear,
            birthDate.getMonth(),
            birthDate.getDate()
          );

          // If birthday has already passed, use next year
          if (nextBirthday < now) {
            nextBirthday = new Date(
              currentYear + 1,
              birthDate.getMonth(),
              birthDate.getDate()
            );
          }

          // Calculate age at next birthday
          const age =
            nextBirthday.getFullYear() - birthDate.getFullYear();

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
          (
            birthday
          ): birthday is {
            id: string;
            memberName: string;
            dateDay: string;
            dateMonth: string;
            age: number;
            sortDate: number;
          } => birthday !== null
        )
        .sort((a, b) => a.sortDate - b.sortDate)
        .slice(0, 5)
        .map(({ sortDate, ...birthday }) => birthday);

      
      // 9. Monthly Collection Chart - Financial Year (Oct to Sep)
      // Monthly target = total members × ₹500
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

      // Determine the financial year containing the current date.
      // Oct-Dec belong to currentYear, Jan-Sep belong to previous year's FY.
      const financialYearStart =
        currentMonth >= 10 ? currentYear : currentYear - 1;

      const chartData: {
        month: string;
        collected: number;
        pending: number;
      }[] = [];

      for (const item of financialYearMonths) {
        const year =
          item.month >= 10
            ? financialYearStart
            : financialYearStart + 1;

        const agg = await prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: "APPROVED",
            month: item.month,
            year,
          },
        });

        const collected = Number(agg._sum.amount ?? 0);

        // Pending can never be negative.
        const pending = Math.max(monthlyMemberTarget - collected, 0);

        chartData.push({
          month: item.label,
          collected,
          pending,
        });
      }

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

  const userName = session.user.name || "Super Admin";

  return (
    <DashboardShell title={`Good morning, ${userName}`}>
      <DashboardContent data={dashboardData} />
    </DashboardShell>
  );
}