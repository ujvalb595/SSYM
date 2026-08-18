import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MemberProfileForm } from "@/features/members/components/member-profile-form";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");

  const { id } = await params;
  if (!id) redirect("/members");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      mobileNumber: true,
      image: true,
      role: true,
      isActive: true,
      birthDate: true,
      bloodGroup: true,
      membershipNumber: true,
      createdAt: true,
    },
  });

  if (!user) {
    return (
      <DashboardShell section="Management" title="Member Profile">
        <main className="mx-auto max-w-5xl p-5 md:p-9">
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <h3 className="text-xl font-bold text-[#24203a]">Member Not Found</h3>
            <p className="mt-2 text-sm text-stone-500">
              The requested member record does not exist or has been removed.
            </p>
            <Link
              href="/members"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7257f4] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#6044ea]"
            >
              <ArrowLeft size={18} /> Back to Member Directory
            </Link>
          </div>
        </main>
      </DashboardShell>
    );
  }

  // Payment status card visibility: Super Admin, Admin, or User viewing their OWN profile
  const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;
  const isAdmin = session.user.role === Role.ADMIN;
  const isSelf = session.user.id === user.id;

  const canViewPaymentStatus = isSuperAdmin || isAdmin || isSelf;

  const userPayments = canViewPaymentStatus
    ? await prisma.payment.findMany({
        where: { userId: user.id },
        select: {
          month: true,
          year: true,
          amount: true,
          status: true,
        },
      })
    : [];

  const formattedPayments = userPayments.map((p) => ({
    month: p.month,
    year: p.year,
    amount: Number(p.amount),
    status: p.status,
  }));

  const rawBirthDate = user.birthDate
    ? new Date(user.birthDate).toISOString().split("T")[0]
    : undefined;

  const birthDateText = user.birthDate
    ? new Date(user.birthDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not provided";

  const roleText =
    user.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user.role === "ADMIN"
      ? "Admin"
      : "Mandal Member";

  const bloodGroupText =
    user.bloodGroup
      ?.replace("_POSITIVE", "+")
      .replace("_NEGATIVE", "-") || "Not provided";

  return (
    <DashboardShell section="Management" title={`Member Profile - ${user.name}`}>
      <main className="mx-auto max-w-5xl p-5 md:p-9 space-y-6">
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7257f4] hover:underline"
          >
            <ArrowLeft size={18} /> Back to Members Directory
          </Link>
        </div>

        {/* Member Profile Form with Interactive Top Banner, Overview & Payment Cards */}
        <MemberProfileForm
          user={{
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            image: user.image,
            role: user.role,
            isActive: user.isActive,
            rawBirthDate,
            bloodGroup: user.bloodGroup,
          }}
          currentUserRole={session.user.role}
          currentUserId={session.user.id}
          birthDateText={birthDateText}
          bloodGroupText={bloodGroupText}
          roleText={roleText}
          canViewPaymentStatus={canViewPaymentStatus}
          formattedPayments={formattedPayments}
        />
      </main>
    </DashboardShell>
  );
}
