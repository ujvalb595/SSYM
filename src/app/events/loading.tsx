export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-2xl bg-violet-200/60" />
          <div className="h-4 w-60 rounded-xl bg-stone-200/70" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded-2xl bg-stone-100" />
          <div className="h-10 w-32 rounded-2xl bg-violet-200/50" />
        </div>
      </div>

      {/* Calendar Navigation & Mode Filter Bar */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-20 rounded-xl bg-stone-100" />
            <div className="flex items-center gap-1">
              <div className="size-8 rounded-xl bg-stone-100" />
              <div className="size-8 rounded-xl bg-stone-100" />
            </div>
            <div className="h-6 w-36 rounded-xl bg-violet-200/70" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded-xl bg-stone-100" />
            <div className="h-9 w-24 rounded-xl bg-stone-100" />
          </div>
        </div>
      </div>

      {/* 7-Column Month Grid Skeleton */}
      <div className="card-base p-4 sm:p-6 overflow-hidden">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-2 pb-4 text-center border-b border-stone-100">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d, i) => (
            <div key={i} className="h-3 w-8 mx-auto rounded bg-stone-200/80" />
          ))}
        </div>

        {/* 5 Rows of 7 Day Cells */}
        <div className="grid grid-cols-7 gap-2 pt-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[90px] rounded-2xl border border-stone-100 bg-stone-50/40 p-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="size-6 rounded-lg bg-stone-200/60" />
              </div>
              {i % 4 === 1 && (
                <div className="h-4 w-full rounded-md bg-violet-100/80" />
              )}
              {i % 7 === 3 && (
                <div className="h-4 w-full rounded-md bg-amber-100/80" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
