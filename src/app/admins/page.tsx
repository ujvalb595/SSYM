import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AdminDirectory } from "@/features/admins/components/admin-directory";
import type { AdminUser } from "@/features/admins/components/admin-card";

// Fallback seed admin profiles to guarantee a rich demonstration view
const seedAdmins: AdminUser[] = [
  {
    id: "admin-super",
    name: "Super Admin",
    mobile: "98765 43210",
    role: "SUPER_ADMIN",
    title: "Head of Operations & Management",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
    joinedAt: "August 2026",
    isActive: true,
  },
  {
    id: "admin-1",
    name: "Aarav Patel",
    mobile: "98250 12345",
    role: "SUPER_ADMIN",
    title: "Executive Committee Lead",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    joinedAt: "January 2025",
    isActive: true,
  },
  {
    id: "admin-2",
    name: "Kavya Desai",
    mobile: "99138 54720",
    role: "ADMIN",
    title: "Event & Finance Administrator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    joinedAt: "March 2025",
    isActive: true,
  },
  {
    id: "admin-3",
    name: "Rohan Mehta",
    mobile: "99881 22045",
    role: "ADMIN",
    title: "Member Relations Admin",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    joinedAt: "November 2024",
    isActive: true,
  },
  {
    id: "admin-4",
    name: "Diya Sharma",
    mobile: "97255 88041",
    role: "ADMIN",
    title: "Communications & Tech Admin",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
    joinedAt: "July 2025",
    isActive: true,
  },
];

export default async function AdminsPage() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");

  let dbAdmins: AdminUser[] = [];
  if (process.env.PRISMA_DATABASE_URL) {
    try {
      const users = await prisma.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
        orderBy: { createdAt: "desc" },
      });

      dbAdmins = users.map((u) => ({
        id: u.id,
        name: u.name,
        mobile: u.mobileNumber || "",
        role: u.role,
        title: u.role === "SUPER_ADMIN" ? "Super Administrator" : "Mandal Administrator",
        avatar: "",
        joinedAt: new Date(u.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        isActive: u.isActive,
      }));
    } catch {
      dbAdmins = [];
    }
  }

  // Combine DB admins with seed admins (deduplicating by ID)
  const allAdminsMap = new Map<string, AdminUser>();
  seedAdmins.forEach((a) => allAdminsMap.set(a.id, a));
  dbAdmins.forEach((a) => allAdminsMap.set(a.id, a));

  const initialAdmins = Array.from(allAdminsMap.values());

  return (
    <DashboardShell section="Management" title="Administrator Directory">
      <main className="mx-auto max-w-7xl p-5 md:p-9">
        {/* Page Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">Administrators</h2>
            <p className="mt-1 text-sm text-stone-500">
              View, filter, and manage your mandal administrators and super administrators.
            </p>
          </div>
        </div>

        {/* Directory Grid & Controls */}
        <AdminDirectory initialAdmins={initialAdmins} />
      </main>
    </DashboardShell>
  );
}
