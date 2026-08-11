import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AddDonationDialog } from "@/features/donations/components/add-donation-dialog";
import {
  DonationsList,
  DonationItemData,
} from "@/features/donations/components/donations-list";

export default async function DonationsPage() {
  const session = await auth();

  if (!session?.user || session.user.isActive === false) {
    redirect("/login");
  }

  let donationItems: DonationItemData[] = [];

  try {
    if (prisma.donation) {
      const dbDonations = await prisma.donation.findMany({
        include: {
          createdBy: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      donationItems = dbDonations.map((d) => {
        const formattedDate = d.date
          ? new Date(d.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A";

        return {
          id: d.id,
          donorName: d.donorName,
          title: d.title,
          description: d.description,
          amount: Number(d.amount),
          date: formattedDate,
          createdById: d.createdById,
          createdByName: d.createdBy?.name || "Unknown User",
          createdByRole: d.createdBy?.role || Role.USER,
        };
      });
    }
  } catch (error) {
    console.error("Error fetching donations from database:", error);
    donationItems = [];
  }

  const canManageDonations =
    session.user.role === Role.ADMIN ||
    session.user.role === Role.SUPER_ADMIN;

  return (
    <DashboardShell section="Management" title="Donations">
      <main className="mx-auto max-w-7xl space-y-7 p-5 md:p-9">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">
              Donations
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              View and manage mandal donations and contribution records.
            </p>
          </div>

          {canManageDonations && <AddDonationDialog />}
        </div>

        {/* Donations Table */}
        <DonationsList
          donations={donationItems}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
          canManageDonations={canManageDonations}
        />
      </main>
    </DashboardShell>
  );
}
