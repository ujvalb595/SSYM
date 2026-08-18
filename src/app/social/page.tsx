import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { InstagramFeed } from "@/components/instagram-feed";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user?.isActive) redirect("/login");

  return (
    <DashboardShell section="Overview" title="Social">
      <main className="mx-auto max-w-7xl p-2 sm:p-4 md:p-8">
        <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#ebe7f6] bg-white p-2.5 sm:p-5 md:p-8 shadow-[0_10px_25px_rgb(77_55_135_/_0.04)]">
          <InstagramFeed userRole={session?.user?.role} />
        </section>
      </main>
    </DashboardShell>
  );
}
