export default function DonationsLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-2xl bg-violet-200/60" />
          <div className="h-4 w-60 rounded-xl bg-stone-200/70" />
        </div>
        <div className="h-10 w-36 rounded-2xl bg-violet-200/50" />
      </div>

      {/* Summary Metric Card */}
      <div className="card-base p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-emerald-100" />
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded-lg bg-stone-200/70" />
            <div className="h-7 w-40 rounded-xl bg-stone-200/90" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-2xl bg-stone-100 hidden sm:block" />
      </div>

      {/* Filter / Search Bar */}
      <div className="card-base p-4 flex items-center justify-between gap-3">
        <div className="h-10 w-full sm:w-72 rounded-2xl bg-stone-100" />
        <div className="h-10 w-32 rounded-2xl bg-stone-100" />
      </div>

      {/* Donations Table Card */}
      <div className="card-base overflow-hidden p-0">
        <div className="divide-y divide-stone-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 px-5">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-2xl bg-emerald-100/70" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded-lg bg-stone-200/80" />
                  <div className="h-3 w-28 rounded-md bg-stone-100" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-5 w-20 rounded-lg bg-stone-200/80" />
                <div className="h-3 w-16 rounded bg-stone-100 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
