import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { CalendarView } from "@/features/events/components/calendar-view";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user.isActive) redirect("/login");
  
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  return (
    <DashboardShell section="Events" title="Calendar">
      <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <CalendarView isAdmin={isAdmin} />
      </main>
    </DashboardShell>
  );
}
