import { redirect } from "next/navigation";
import { Ellipsis, Eye, Search, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AddMemberDialog } from "@/features/members/components/add-member-dialog";

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

interface MemberRow {
  id: string;
  name: string;
  mobile: string;
  birthDate: string;
  bloodGroup: string;
  initials: string;
}

const seedMembers: MemberRow[] = [
  { id: "m1", name: "Aarav Patel", mobile: "98765 43210", birthDate: "14 Feb 1996", bloodGroup: "B+", initials: "AP" },
  { id: "m2", name: "Diya Sharma", mobile: "98250 12546", birthDate: "28 Jul 1999", bloodGroup: "O+", initials: "DS" },
  { id: "m3", name: "Rohan Mehta", mobile: "99881 22045", birthDate: "06 Nov 1994", bloodGroup: "A+", initials: "RM" },
  { id: "m4", name: "Kavya Desai", mobile: "99138 54720", birthDate: "19 Mar 2000", bloodGroup: "AB+", initials: "KD" },
  { id: "m5", name: "Ishaan Joshi", mobile: "90990 15236", birthDate: "02 Jan 1997", bloodGroup: "O-", initials: "IJ" },
  { id: "m6", name: "Anaya Shah", mobile: "97255 88041", birthDate: "11 Sep 1998", bloodGroup: "B+", initials: "AS" },
];

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");

  let members: MemberRow[] = [];
  let totalCount = 0;

  if (process.env.PRISMA_DATABASE_URL) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });

      totalCount = users.length;

      members = users.map((u) => {
        const initials = u.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase() || "MB";

        const birthDate = u.birthDate
          ? new Date(u.birthDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "N/A";

        const blood = u.bloodGroup ? bloodGroupLabel[u.bloodGroup] || u.bloodGroup : "O+";

        return {
          id: u.id,
          name: u.name,
          mobile: u.mobileNumber || "N/A",
          birthDate,
          bloodGroup: blood,
          initials,
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
      <main className="mx-auto max-w-7xl p-5 md:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">Members</h2>
            <p className="mt-1 text-sm text-stone-500">
              View and manage your mandal member directory.
            </p>
          </div>
          <AddMemberDialog />
        </div>

        <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
                <UsersRound size={20} />
              </span>
              <div>
                <h3 className="font-bold text-[#24203a]">All Members</h3>
                <p className="text-sm text-stone-500">{totalCount} registered members</p>
              </div>
            </div>
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={17}
              />
              <input
                className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 sm:w-64"
                placeholder="Search members"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member</th>
                  <th className="px-6 py-4 font-semibold">Mobile No.</th>
                  <th className="px-6 py-4 font-semibold">Birth Date</th>
                  <th className="px-6 py-4 font-semibold">Blood Group</th>
                  <th className="px-6 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-[#7657f6]">
                          {m.initials}
                        </span>
                        <span className="font-semibold text-[#302a49]">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{m.mobile}</td>
                    <td className="px-6 py-4 text-stone-600">{m.birthDate}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {m.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`View ${m.name}`}
                          className="rounded-lg p-2 text-[#7257f4] hover:bg-violet-100"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          aria-label={`More actions for ${m.name}`}
                          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
                        >
                          <Ellipsis size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4 text-sm text-stone-500">
            <span>Showing 1–{members.length} of {totalCount} members</span>
            <div className="flex gap-2">
              <button className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">
                Previous
              </button>
              <button className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-[#7257f4]">
                1
              </button>
              <button className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}
