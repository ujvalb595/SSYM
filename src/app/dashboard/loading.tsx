export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-7">
      {/* Top Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-8 w-60 rounded-2xl bg-violet-200/60" />
          <div className="h-4 w-48 rounded-xl bg-stone-200/70" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded-2xl bg-stone-100" />
          <div className="h-10 w-36 rounded-2xl bg-violet-200/50" />
        </div>
      </div>

      {/* Metrics Row Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[#ebe7f6] bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded-lg bg-stone-200/70" />
              <div className="size-9 rounded-xl bg-violet-100/70" />
            </div>
            <div className="h-7 w-32 rounded-xl bg-stone-200/80" />
            <div className="h-2.5 w-20 rounded-md bg-stone-100" />
          </div>
        ))}
      </div>

      {/* Chart & Upcoming Birthdays Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Financial Year Bar Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-[#ebe7f6] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="space-y-1.5">
              <div className="h-5 w-48 rounded-xl bg-stone-200/80" />
              <div className="h-3.5 w-64 rounded-lg bg-stone-100" />
            </div>
            <div className="h-7 w-24 rounded-xl bg-stone-100" />
          </div>
          {/* Bar Chart Skeletons */}
          <div className="flex items-end justify-between gap-2 h-56 pt-6 px-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-violet-200/80 to-purple-100"
                  style={{ height: `${25 + (i * 17) % 65}%` }}
                />
                <div className="h-3 w-6 rounded bg-stone-200/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Birthdays Card (1 col) */}
        <div className="rounded-3xl border border-[#ebe7f6] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="h-5 w-36 rounded-xl bg-stone-200/80" />
            <div className="size-7 rounded-xl bg-amber-100/70" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-amber-100/80" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 rounded-lg bg-stone-200/80" />
                    <div className="h-2.5 w-16 rounded-md bg-stone-100" />
                  </div>
                </div>
                <div className="h-6 w-12 rounded-xl bg-stone-200/60" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments Section Skeleton */}
      <div className="rounded-3xl border border-[#ebe7f6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="h-5 w-40 rounded-xl bg-stone-200/80" />
          <div className="h-7 w-20 rounded-xl bg-stone-100" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-stone-100/80 bg-stone-50/40 p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-violet-100/60" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded-lg bg-stone-200/80" />
                  <div className="h-2.5 w-20 rounded-md bg-stone-100" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-16 rounded-lg bg-stone-200/70" />
                <div className="h-6 w-20 rounded-xl bg-emerald-100/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
