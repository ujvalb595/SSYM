import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MembersDirectoryView, MemberRowData } from "@/features/members/components/members-directory-view";

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

const seedMembers: MemberRowData[] = [
  {
    id: "m1",
    name: "Aarav Patel",
    mobile: "9876543210",
    birthDate: "14 Feb 1996",
    bloodGroup: "B+",
    initials: "AP",
  },
  {
    id: "m2",
    name: "Diya Sharma",
    mobile: "9825012546",
    birthDate: "28 Jul 1999",
    bloodGroup: "O+",
    initials: "DS",
  },
  {
    id: "m3",
    name: "Rohan Mehta",
    mobile: "9988122045",
    birthDate: "06 Nov 1994",
    bloodGroup: "A+",
    initials: "RM",
  },
];

export default async function MembersPage() {
  const session = await auth();

  if (!session?.user || session.user.isActive === false) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const canManageMembers = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  let members: MemberRowData[] = [];
  let totalCount = 0;

  if (process.env.PRISMA_DATABASE_URL) {
    try {
      const [users, auditLogs] = await Promise.all([
        prisma.user.findMany({
          orderBy: { updatedAt: "desc" },
          include: {
            createdBy: {
              select: {
                name: true,
                role: true,
              },
            },
            updatedBy: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        }),
        prisma.auditLog.findMany({
          where: {
            entity: "User",
            action: { in: ["CREATE", "UPDATE"] },
          },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        }),
      ]);

      totalCount = users.length;

      members = users.map((u) => {
        const initials =
          u.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase() || "MB";

        const birthDate = u.birthDate
          ? new Date(u.birthDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A";

        const rawBirthDate = u.birthDate
          ? new Date(u.birthDate).toISOString().split("T")[0]
          : undefined;

        const blood = u.bloodGroup
          ? bloodGroupLabel[u.bloodGroup] || u.bloodGroup
          : "O+";

        let addedUpdatedBy = u.updatedBy?.name || u.createdBy?.name;
        let addedUpdatedByRole = u.updatedBy?.role || u.createdBy?.role;

        if (!addedUpdatedBy) {
          const log = auditLogs.find((l) => l.entityId === u.id);
          if (log?.user) {
            addedUpdatedBy = log.user.name;
            addedUpdatedByRole = log.user.role;
          }
        }

        return {
          id: u.id,
          name: u.name,
          mobile: u.mobileNumber || "N/A",
          image: u.image,
          birthDate,
          rawBirthDate,
          bloodGroup: blood,
          rawBloodGroup: u.bloodGroup || undefined,
          initials,
          addedUpdatedBy: addedUpdatedBy || undefined,
          addedUpdatedByRole: addedUpdatedByRole || undefined,
        };
      });
    } catch {
      members = [];
    }
  }

  if (members.length === 0) {
    members = seedMembers;
    totalCount = seedMembers.length;
  }

  return (
    <DashboardShell section="Management" title="Member Directory">
      <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <MembersDirectoryView
          members={members}
          totalCount={totalCount}
          canManageMembers={canManageMembers}
          isSuperAdmin={isSuperAdmin}
        />
      </main>
    </DashboardShell>
  );
}
