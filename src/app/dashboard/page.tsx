import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardContent, type DashboardData } from "@/features/dashboard/components/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");

  let dashboardData: DashboardData = {
    totalMembersCount: 0,
    monthlyCollectionSum: 0,
    pendingPaymentsCount: 0,
    totalExpensesCount: 0,
    targetCollection: 50000,
    recentPayments: [],
    upcomingEvents: [],
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
      const monthlyCollectionSum = Number(collectionAgg._sum.amount ?? 0);

      // 3. Pending Payments count
      const pendingPaymentsCount = await prisma.payment.count({
        where: { status: "PENDING" },
      });

      // 4. Total Expenses / Audit log count
      const totalExpensesCount = await prisma.auditLog.count().catch(() => 0);

      // 5. Recent Payments (latest 5)
      const rawPayments = await prisma.payment.findMany({
        take: 5,
        orderBy: { submittedAt: "desc" },
        include: { user: true },
      });

      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

      const recentPayments = rawPayments.map((p) => ({
        id: p.id,
        memberName: p.user?.name || "Member",
        monthYear: `${monthNames[p.month - 1] || "AUG"} ${p.year}`,
        amount: Number(p.amount),
        status: p.status === "APPROVED" ? "Approved" : p.status === "PENDING" ? "Pending" : "Rejected",
      }));

      // 6. Upcoming Events (latest 4)
      const rawEvents = await prisma.event.findMany({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { date: "asc" },
        take: 4,
      });

      const upcomingEvents = rawEvents.map((e) => {
        const d = new Date(e.date);
        return {
          id: e.id,
          title: e.name,
          dateDay: String(d.getDate()).padStart(2, "0"),
          dateMonth: monthNames[d.getMonth()],
          timeVenue: `${e.time} · ${e.venue}`,
        };
      });

      // 7. Monthly Chart collections for past 6 months
      const chartData: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const agg = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "APPROVED", month: m, year: y },
        });

        chartData.push({
          month: monthNames[m - 1],
          amount: Number(agg._sum.amount ?? 0),
        });
      }

      dashboardData = {
        totalMembersCount,
        monthlyCollectionSum,
        pendingPaymentsCount,
        totalExpensesCount,
        targetCollection: 50000,
        recentPayments,
        upcomingEvents,
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
