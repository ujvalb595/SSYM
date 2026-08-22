import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AdminCardItem } from "@/features/admins/components/admin-cards-grid";
import { NonAdminUser } from "@/features/admins/components/promote-member-dialog";
import { AdminsDirectoryView } from "@/features/admins/components/admins-directory-view";

const bloodGroupLabel: Record<string, string> = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
};

const seedAdmins: AdminCardItem[] = [
  {
    id: "admin-1",
    name: "Aarav Patel",
    mobile: "9876543210",
    role: Role.SUPER_ADMIN,
    joinedDate: "14 Feb 2024",
    bloodGroup: "B+",
    isActive: true,
    initials: "AP",
  },
  {
    id: "admin-2",
    name: "Diya Sharma",
    mobile: "9825012546",
    role: Role.ADMIN,
    joinedDate: "28 Jul 2024",
    bloodGroup: "O+",
    isActive: true,
    initials: "DS",
  },
];

interface UserQueryResult {
  id: string;
  name: string;
  mobileNumber?: string | null;
  role: Role;
  joinedAt?: string | Date | null;
  bloodGroup?: string | null;
  isActive?: boolean;
}

export default async function AdminsPage() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");

  const currentRole = session.user.role;
  const isSuperAdmin = currentRole === Role.SUPER_ADMIN;
  const isAdminOrSuperAdmin = isSuperAdmin || currentRole === Role.ADMIN;

  // Protect Admin page access - only Admins and Super Admins can access
  if (!isAdminOrSuperAdmin) redirect("/dashboard");

  let adminItems: AdminCardItem[] = [];
  let nonAdminMembers: NonAdminUser[] = [];
  let superAdminCount = 0;
  let adminCount = 0;

  if (process.env.PRISMA_DATABASE_URL) {
    try {
      const [dbAdmins, dbNonAdmins] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: { in: [Role.SUPER_ADMIN, Role.ADMIN] },
          },
          orderBy: [{ role: "asc" }, { createdAt: "desc" }],
        }) as Promise<UserQueryResult[]>,

        isSuperAdmin
          ? (prisma.user.findMany({
              where: {
                role: Role.USER,
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                mobileNumber: true,
                role: true,
              },
              orderBy: { name: "asc" },
            }) as Promise<UserQueryResult[]>)
          : Promise.resolve([] as UserQueryResult[]),
      ]);

      adminItems = dbAdmins.map((u) => {
        const initials =
          (u.name || "")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase() || "AD";

        const joinedDate = u.joinedAt
          ? new Date(u.joinedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A";

        if (u.role === Role.SUPER_ADMIN) superAdminCount++;
        if (u.role === Role.ADMIN) adminCount++;

        return {
          id: u.id,
          name: u.name,
          mobile: u.mobileNumber || "N/A",
          role: u.role,
          joinedDate,
          bloodGroup: u.bloodGroup ? bloodGroupLabel[u.bloodGroup] || u.bloodGroup : "O+",
          isActive: u.isActive ?? true,
          initials,
        };
      });

      if (isSuperAdmin && dbNonAdmins.length > 0) {
        nonAdminMembers = dbNonAdmins.map((m) => ({
          id: m.id,
          name: m.name,
          mobile: m.mobileNumber || "N/A",
          role: m.role,
        }));
      }
    } catch (error) {
      console.error("Admins DB Fetch Error:", error);
      adminItems = [];
      nonAdminMembers = [];
    }
  }

  if (adminItems.length === 0) {
    adminItems = seedAdmins;
    superAdminCount = 1;
    adminCount = 1;
  }

  return (
    <DashboardShell section="Management" title="Admins">
      <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <AdminsDirectoryView
          adminItems={adminItems}
          nonAdminMembers={nonAdminMembers}
          superAdminCount={superAdminCount}
          adminCount={adminCount}
          currentUserId={session.user.id}
          currentUserRole={currentRole}
          isSuperAdmin={isSuperAdmin}
        />
      </main>
    </DashboardShell>
  );
}
