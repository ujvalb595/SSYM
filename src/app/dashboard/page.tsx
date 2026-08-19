import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import {
  DashboardContent,
  type DashboardData,
} from "@/features/dashboard/components/dashboard-content";

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
    pendingPaymentsCount: 0,
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

      // 9. Monthly Chart collections for past 6 months
      const chartData: { month: string; amount: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1
        );

        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const agg = await prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: "APPROVED",
            month: m,
            year: y,
          },
        });

        chartData.push({
          month: monthNames[m - 1],
          amount: Number(agg._sum.amount ?? 0),
        });
      }

      dashboardData = {
        totalMembersCount,
        monthlyCollectionSum,
        totalPaymentsReceived,
        totalDonationsReceived,
        pendingPaymentsCount,
        totalExpenses,
        targetCollection: 50000,
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