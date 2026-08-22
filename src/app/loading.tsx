export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-6">
      {/* Top Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-2xl bg-violet-200/50" />
          <div className="h-4 w-64 rounded-xl bg-stone-200/60" />
        </div>
        <div className="h-10 w-32 rounded-2xl bg-violet-200/40" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-3xl border border-[#ebe7f6] bg-white p-5 shadow-xs"
          >
            <div className="size-12 rounded-2xl bg-violet-100/70" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 rounded-lg bg-stone-200/60" />
              <div className="h-6 w-32 rounded-xl bg-stone-200/80" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Card Skeleton */}
      <div className="rounded-3xl border border-[#ebe7f6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="h-5 w-40 rounded-xl bg-stone-200/70" />
          <div className="h-9 w-60 rounded-xl bg-stone-100" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full rounded-2xl bg-stone-50 border border-stone-100/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
