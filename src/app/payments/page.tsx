import { redirect } from "next/navigation";
import { CircleCheck, CircleX, CopyCheck, CopyX, Search, UsersRound, X } from "lucide-react";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

const members = [
  ["Aarav Patel", "98765 43210", "14 Feb 1996", "B+", "AP"],
  ["Diya Sharma", "98250 12546", "28 Jul 1999", "O+", "DS"],
  ["Rohan Mehta", "99881 22045", "06 Nov 1994", "A+", "RM"],
  ["Kavya Desai", "99138 54720", "19 Mar 2000", "AB+", "KD"],
] as const;

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) redirect("/login");
  return (
    <DashboardShell section="Management" title="Member Directory">
      <main className="mx-auto max-w-7xl p-5 md:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
            <p className="mt-1 text-sm text-stone-500">
              View and manage your mandal payment requests.
            </p>
          </div>
        </div>
        <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
                <UsersRound size={20} />
              </span>
              <div>
                <h3 className="font-bold">All Payments Request</h3>
                <p className="text-sm text-stone-500">18 Payments Request Pending</p>
              </div>
            </div>
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={17}
              />
              <input
                className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 sm:w-64"
                placeholder="Search payments"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member</th>
                  <th className="px-6 py-4 font-semibold">Month Requsted</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(([name, mobile, birthday, blood, initials]) => (
                  <tr
                    key={mobile}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-[#7657f6]">
                          {initials}
                        </span>
                        <span className="font-semibold text-[#302a49]">
                          {name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">January</td>
                    <td className="px-6 py-4 text-stone-600">14 Jan 2026</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#654dde] to-[#ac58ee] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105"
                        >
                          <CircleCheck size={17} /> Approve
                        </button>
                        <button
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 hover:brightness-105"
                        >
                          <CircleX size={17} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4 text-sm text-stone-500">
            <span>Showing 1–8 of 248 members</span>
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

        <section className="overflow-hidden mt-8 rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
                <UsersRound size={20} />
              </span>
              <div>
                <h3 className="font-bold">All Payments History</h3>
                <p className="text-sm text-stone-500">View all payment history</p>
              </div>
            </div>
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={17}
              />
              <input
                className="w-full rounded-xl border border-[#e8e3f2] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 sm:w-64"
                placeholder="Search payments"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member</th>
                  <th className="px-6 py-4 font-semibold">Month</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Approve By</th>
                </tr>
              </thead>
              <tbody>
                {members.map(([name, mobile, birthday, blood, initials]) => (
                  <tr
                    key={mobile}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xs font-bold text-[#7657f6]">
                          {initials}
                        </span>
                        <span className="font-semibold text-[#302a49]">
                          {name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">January</td>
                    <td className="px-6 py-4 text-stone-600">14 Jan 2026</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      Suhash Kudalkar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4 text-sm text-stone-500">
            <span>Showing 1–8 of 248 members</span>
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
