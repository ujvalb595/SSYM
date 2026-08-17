import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { InstagramFeed } from "@/components/instagram-feed";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user.isActive) redirect("/login");
  return (
    <DashboardShell section="Management" title="Member Directory">
      <main className="mx-auto max-w-7xl p-5 md:p-9">
        <section className="overflow-hidden rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          
          <InstagramFeed />

        </section>

        
      </main>
    </DashboardShell>
  );
}
