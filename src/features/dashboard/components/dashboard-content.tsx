"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ChartItem } from "@/features/dashboard/components/collection-chart";
import {
  DashboardHeaderActions,
  FilterState,
} from "@/features/dashboard/components/dashboard-header-actions";

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
  userPayments: {
    month: number;
    year: number;
    status: string;
    amount: number;
  }[];
  financialYearStart: number;
}

export function DashboardContent({
  data,
  canManageDashboardReports,
}: {
  data?: DashboardData;
  canManageDashboardReports: boolean;
}) {
  const [metricsData, setMetricsData] = useState({
    totalPaymentsReceived: data?.totalPaymentsReceived ?? 0,
    totalDonationsReceived: data?.totalDonationsReceived ?? 0,
    totalExpenses: data?.totalExpenses ?? 0,
    monthlyCollectionSum: data?.monthlyCollectionSum ?? 0,
  });
  const [activeFilterLabel, setActiveFilterLabel] = useState<string>("This Month");
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const activeStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStepRef.current) {
      setTimeout(() => {
        activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setMetricsData({
        totalPaymentsReceived: data.totalPaymentsReceived ?? 0,
        totalDonationsReceived: data.totalDonationsReceived ?? 0,
        totalExpenses: data.totalExpenses ?? 0,
        monthlyCollectionSum: data.monthlyCollectionSum ?? 0,
      });
    }
  }, [data]);

  const handleFilterChange = async (newFilter: FilterState) => {
    setActiveFilterLabel(newFilter.label);
    setLoadingMetrics(true);
    try {
      const params = new URLSearchParams();
      params.set("period", newFilter.period);
      if (newFilter.month) params.set("month", String(newFilter.month));
      if (newFilter.year) params.set("year", String(newFilter.year));
      if (newFilter.startDate) params.set("startDate", newFilter.startDate);
      if (newFilter.endDate) params.set("endDate", newFilter.endDate);

      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.summary) {
          setMetricsData({
            totalPaymentsReceived: json.summary.totalPaymentsAmount,
            totalDonationsReceived: json.summary.totalDonationsAmount,
            totalExpenses: json.summary.totalExpensesAmount,
            monthlyCollectionSum: json.summary.totalPaymentsAmount,
          });
        }
      }
    } catch (err) {
      console.error("Failed to update dashboard metrics for filter:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const totalPaymentsReceived = metricsData.totalPaymentsReceived;
  const totalDonationsReceived = metricsData.totalDonationsReceived;
  const totalIncome = totalPaymentsReceived + totalDonationsReceived;
  const monthlyCollection = metricsData.monthlyCollectionSum;
  const totalExpenses = metricsData.totalExpenses;
  const targetCollection = data?.targetCollection || 50000;

    targetCollection > 0
      ? Math.min(Math.round((monthlyCollection / targetCollection) * 100), 100)
      : 0;


  const metrics = [
    [
      "Total Income",
      `₹ ${totalIncome.toLocaleString("en-IN")}`,
      `Payments + Donations (${activeFilterLabel})`,
      IndianRupee,
      "bg-violet-100 text-violet-600",
    ],
    [
      "Total Expenses",
      `₹ ${totalExpenses.toLocaleString("en-IN")}`,
      `Recorded activity (${activeFilterLabel})`,
      CheckCircle2,
      "bg-emerald-100 text-emerald-700",
    ],
    [
      "Total Donations",
      `₹ ${totalDonationsReceived.toLocaleString("en-IN")}`,
      `All donations (${activeFilterLabel})`,
      IndianRupee,
      "bg-fuchsia-100 text-fuchsia-600",
    ],
  ] as const;

  return (
    <section className="mx-auto max-w-7xl p-5 md:p-9">
      {/* Top Header with Filter & Download Actions */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">Dashboard</h2>
          <p className="mt-1 text-sm text-stone-500">Here&apos;s real-time mandal management progress today.</p>
        </div>
        {canManageDashboardReports && (
          <DashboardHeaderActions onFilterChange={handleFilterChange} />
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loadingMetrics
          ? Array.from({ length: 3 }).map((_, idx) => (
              <article
                key={`metric-skeleton-${idx}`}
                className="animate-pulse rounded-2xl border border-white bg-white/90 p-5 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]"
              >
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-2xl bg-violet-100/70" />
                  <div className="h-4 w-10 rounded-full bg-stone-100" />
                </div>
                <div className="mt-5 h-3.5 w-24 rounded-lg bg-stone-200/80" />
                <div className="mt-2 h-7 w-36 rounded-xl bg-violet-200/80" />
                <div className="mt-2.5 h-3 w-44 rounded-lg bg-stone-100" />
              </article>
            ))
          : metrics.map(([label, value, trend, Icon, tone]) => (
              <article
                key={label}
                className="rounded-2xl border border-white bg-white/90 p-5 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)] transition-all"
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
          <p className="text-sm text-stone-500">Your Personal Payment Status</p>
          {loadingMetrics ? (
            <div className="mt-5 space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-10 w-full rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : (
            <div className="mt-5 max-h-[420px] px-2 pt-2 overflow-y-auto pr-1 no-scrollbar">
              {(() => {
                const MANDAL_MONTH_CYCLE = [
                  { name: "Oct", fullMonth: "October", monthNum: 10, year: 2026 },
                  { name: "Nov", fullMonth: "November", monthNum: 11, year: 2026 },
                  { name: "Dec", fullMonth: "December", monthNum: 12, year: 2026 },
                  { name: "Jan", fullMonth: "January", monthNum: 1, year: 2027 },
                  { name: "Feb", fullMonth: "February", monthNum: 2, year: 2027 },
                  { name: "Mar", fullMonth: "March", monthNum: 3, year: 2027 },
                  { name: "Apr", fullMonth: "April", monthNum: 4, year: 2027 },
                  { name: "May", fullMonth: "May", monthNum: 5, year: 2027 },
                  { name: "Jun", fullMonth: "June", monthNum: 6, year: 2027 },
                  { name: "Jul", fullMonth: "July", monthNum: 7, year: 2027 },
                  { name: "Aug", fullMonth: "August", monthNum: 8, year: 2027 },
                  { name: "Sept", fullMonth: "September", monthNum: 9, year: 2027 },
                ];
                
                const paymentMap = new Map();
                data?.userPayments?.forEach((p) => paymentMap.set(`${p.year}-${p.month}`, p));

                let activeStepIndex = MANDAL_MONTH_CYCLE.length;
                for (let i = 0; i < MANDAL_MONTH_CYCLE.length; i++) {
                  const key = `${MANDAL_MONTH_CYCLE[i].year}-${MANDAL_MONTH_CYCLE[i].monthNum}`;
                  const record = paymentMap.get(key);
                  if (!record || record.status === "REJECTED") {
                    activeStepIndex = i;
                    break;
                  }
                }

                return MANDAL_MONTH_CYCLE.map((item, index) => {
                  const key = `${item.year}-${item.monthNum}`;
                  const record = paymentMap.get(key);
                  const status = record?.status;
                  
                  const isCompleted = status === "APPROVED";
                  const isPending = status === "PENDING";
                  const isRejected = status === "REJECTED";
                  const isActive = index === activeStepIndex;
                  const isPast = index < activeStepIndex;
                  
                  const lineIsColored = isCompleted;

                  return (
                    <div 
                      key={key} 
                      ref={isActive ? activeStepRef : null}
                      className="relative flex items-start gap-4 pb-8 last:pb-2"
                    >
                      {/* Vertical Line */}
                      {index !== MANDAL_MONTH_CYCLE.length - 1 && (
                        <div 
                          className={`absolute left-[13px] top-7 bottom-[-7px] w-[2px] ${
                            lineIsColored ? "bg-[#7257f4]" : "bg-stone-200"
                          }`} 
                        />
                      )}

                      {/* Step Indicator */}
                      <div className="relative z-10 shrink-0 mt-0.5">
                        {isCompleted ? (
                          <div className="flex size-7 items-center justify-center rounded-full bg-[#7257f4] text-white ring-4 ring-white">
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                        ) : isActive ? (
                          <div className="flex size-7 items-center justify-center rounded-full bg-white ring-4 ring-violet-100">
                            <div className="size-3.5 rounded-full bg-[#7257f4]" />
                          </div>
                        ) : (
                          <div className="flex size-7 items-center justify-center rounded-full border-2 border-stone-200 bg-white ring-4 ring-white">
                            <div className="size-2.5 rounded-full bg-stone-300" />
                          </div>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 pt-1">
                        <h4 className={`text-base font-bold ${isActive || isCompleted || isPast ? 'text-[#24203a]' : 'text-stone-500'}`}>
                          {item.fullMonth} {item.year}
                        </h4>
                        <p className="mt-0.5 text-sm text-stone-500">
                          {isCompleted ? (
                            <span className="font-medium text-emerald-600">Payment Done • ₹{record.amount.toLocaleString()}</span>
                          ) : isPending ? (
                            <span className="font-medium text-amber-600">Payment Pending Verification</span>
                          ) : isRejected ? (
                            <span className="font-medium text-rose-600">Payment Rejected • Action Required</span>
                          ) : isActive ? (
                            <span className="font-medium text-[#7257f4]">Payment Due • ₹500 remaining</span>
                          ) : (
                            <span>Upcoming • ₹500</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
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
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto no-scrollbar relative">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white border-y border-stone-100 text-xs uppercase tracking-wide text-stone-400 backdrop-blur-sm">
                  <tr>
                    <th className="py-3 font-medium bg-white">Member</th>
                    <th className="py-3 font-medium bg-white">Month</th>
                    <th className="py-3 font-medium bg-white">Amount</th>
                    <th className="py-3 font-medium text-right bg-white">Status</th>
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
