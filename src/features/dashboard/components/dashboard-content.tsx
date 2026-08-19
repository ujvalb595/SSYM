"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ChartItem } from "@/features/dashboard/components/collection-chart";

const CollectionChart = dynamic(
  () => import("@/features/dashboard/components/collection-chart").then((m) => m.CollectionChart),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full rounded-xl bg-violet-50/50 animate-pulse" />,
  }
);

export interface DashboardData {
  totalMembersCount: number;
  monthlyCollectionSum: number;
  totalPaymentsReceived: number;
  totalDonationsReceived: number;
  totalExpenses: number;
  targetCollection: number;
  recentPayments: {
    id: string;
    memberName: string;
    monthYear: string;
    amount: number;
    status: string;
  }[];
  upcomingBirthdays: {
    id: string;
    memberName: string;
    dateDay: string;
    dateMonth: string;
    age: number;
  }[];
  chartData: ChartItem[];
}

export function DashboardContent({ data }: { data?: DashboardData }) {
  const totalPaymentsReceived = data?.totalPaymentsReceived ?? 0;
  const totalDonationsReceived = data?.totalDonationsReceived ?? 0;

  const totalIncome = totalPaymentsReceived + totalDonationsReceived;

  const monthlyCollection = data?.monthlyCollectionSum ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const targetCollection = data?.targetCollection || 50000;

  const collectionPercent =
    targetCollection > 0
      ? Math.min(Math.round((monthlyCollection / targetCollection) * 100), 100)
      : 0;

  const remainingTarget = Math.max(targetCollection - monthlyCollection, 0);

  const metrics = [
    [
      "Total Income",
      `₹ ${totalIncome.toLocaleString("en-IN")}`,
      `Payments + Donations`,
      IndianRupee,
      "bg-violet-100 text-violet-600",
    ],
    [
      "Total Expenses",
      `₹ ${totalExpenses.toLocaleString("en-IN")}`,
      "Recorded activity",
      CheckCircle2,
      "bg-emerald-100 text-emerald-700",
    ],
    [
      "Total Donations",
      `₹ ${totalDonationsReceived.toLocaleString("en-IN")}`,
      "All donations received",
      IndianRupee,
      "bg-fuchsia-100 text-fuchsia-600",
    ],
    
  ] as const;

  const currentMonthYearName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mx-auto max-w-7xl p-5 md:p-9">
      {/* Top Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">Dashboard</h2>
          <p className="mt-1 text-sm text-stone-500">Here&apos;s real-time mandal management progress today.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7257f4] to-[#a858ef] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105">
          <CalendarDays size={17} /> {currentMonthYearName}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value, trend, Icon, tone], index) => (
          <article
            key={label}
            className="rounded-2xl border border-white bg-white/90 p-5 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]"
          >
            <div className="flex items-start justify-between">
              <span className={`rounded-2xl p-3 ${tone}`}>
                <Icon size={21} />
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <ArrowUpRight size={15} />
              </span>
            </div>
            <p className="mt-5 text-sm font-medium text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#24203a]">{value}</p>
            <p className="mt-2 text-xs text-stone-400">{trend}</p>
          </article>
        ))}
      </div>

      {/* Chart & Collection Progress Section */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#24203a]">Monthly Collection</h3>
              <p className="text-sm text-stone-500">Payment collection history over recent months</p>
            </div>
          </div>
          <CollectionChart data={data?.chartData} />
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#24203a]">Collection Progress</h3>
          <p className="text-sm text-stone-500">{currentMonthYearName} Target</p>
          <div className="mt-8 flex justify-center">
            <div className="flex size-40 flex-col items-center justify-center rounded-full border-[14px] border-[#7257f4] border-l-violet-100">
              <strong className="text-3xl font-extrabold text-[#24203a]">{collectionPercent}%</strong>
              <span className="text-xs text-stone-500">
                ₹{monthlyCollection.toLocaleString("en-IN")} raised
              </span>
            </div>
          </div>
          <div className="mt-7 space-y-3 text-sm">
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-500">Target</span>
              <strong>₹{targetCollection.toLocaleString("en-IN")}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Remaining</span>
              <strong className="text-[#7257f4]">₹{remainingTarget.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </article>
      </div>

      {/* Recent Payments & Upcoming Events Section */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {/* Recent Payments */}
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#24203a]">Recent Payments</h3>
              <p className="text-sm text-stone-500">Latest member payment activity</p>
            </div>
            <Link className="text-sm font-semibold text-[#7257f4] hover:underline" href="/payments">
              View all
            </Link>
          </div>

          {data?.recentPayments && data.recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="py-3 font-medium">Member</th>
                    <th className="py-3 font-medium">Month</th>
                    <th className="py-3 font-medium">Amount</th>
                    <th className="py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-3 font-semibold text-[#24203a]">{p.memberName}</td>
                      <td className="py-3 text-stone-500">{p.monthYear}</td>
                      <td className="py-3 font-semibold">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            p.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "Pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-semibold text-stone-600">No payment activity recorded yet</p>
              <p className="mt-1 text-xs text-stone-400">
                Payment transactions submitted by members will appear here.
              </p>
            </div>
          )}
        </article>

        {/* Upcoming Birthdays */}
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#24203a]">Upcoming Birthdays</h3>
              <p className="text-sm text-stone-500">Members celebrating soon</p>
            </div>

            <Link
              href="/members"
              className="text-sm font-semibold text-[#7257f4] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {data?.upcomingBirthdays && data.upcomingBirthdays.length > 0 ? (
              data.upcomingBirthdays.map((birthday) => (
                <div
                  key={birthday.id}
                  className="flex items-center gap-3"
                >
                  <span className="flex min-w-[58px] flex-col items-center justify-center rounded-xl bg-violet-50 px-3 py-2 text-center text-xs font-bold text-[#7257f4]">
                    {birthday.dateDay}
                    <span className="font-medium text-stone-500">
                      {birthday.dateMonth}
                    </span>
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#24203a]">
                      {birthday.memberName}
                    </p>
                    <p className="text-xs text-stone-500">
                      Turning {birthday.age}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-stone-600">
                  No upcoming birthdays
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Member birthdays will appear here.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
