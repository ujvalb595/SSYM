import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

const members = [
  ["Aarav Patel"],
  ["Diya Sharma"],
  ["Rohan Mehta"],
  ["Kavya Desai"],
] as const;

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");
  return (
    <DashboardShell section="Management" title="Member Directory">
      <main className="mx-auto max-w-7xl p-5 md:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Events</h2>
            <p className="mt-1 text-sm text-stone-500">
              View and manage your events.
            </p>
          </div>
        </div>
        <section className="member-card">
          
        </section>
      </main>
    </DashboardShell>
  );
}
