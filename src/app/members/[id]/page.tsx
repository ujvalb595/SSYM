import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Phone, Shield } from "lucide-react";
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

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "MB";

  const rawBirthDate = user.birthDate
    ? new Date(user.birthDate).toISOString().split("T")[0]
    : undefined;

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });


  const roleText =
    user.role === "SUPER_ADMIN"
      ? "Super Administrator"
      : user.role === "ADMIN"
      ? "Administrator"
      : "Mandal Member";

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

        {/* User Banner & Avatar Card */}
        <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="relative flex items-center gap-5 bg-gradient-to-r from-[#654dde] via-[#8657ef] to-[#bd5ce8] px-6 py-8 text-white">
            <span className="flex size-20 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/20 text-3xl font-extrabold text-white shadow-lg backdrop-blur-sm">
              {initials}
            </span>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">{user.name}</h2>
            </div>
          </div>
          <div className="p-6">
            {/* Overview Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
                <span className="text-[#7657f6]">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-xs font-medium text-stone-500">Mobile Number</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#24203a]">{user.mobileNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
                <span className="text-[#7657f6]">
                  <Calendar size={18} />
                </span>
                <div>
                  <p className="text-xs font-medium text-stone-500">Joined Mandal</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#24203a]">{joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-[#faf9ff] p-4">
                <span className="text-[#7657f6]">
                  <Shield size={18} />
                </span>
                <div>
                  <p className="text-xs font-medium text-stone-500">Role</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#24203a]">{roleText}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Member Profile Form / Edit Card */}
        <MemberProfileForm
          user={{
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            role: user.role,
            isActive: user.isActive,
            rawBirthDate,
            bloodGroup: user.bloodGroup,
          }}
          currentUserRole={session.user.role}
          currentUserId={session.user.id}
        />
      </main>
    </DashboardShell>
  );
}
