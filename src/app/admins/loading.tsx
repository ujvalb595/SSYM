export default function AdminsLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-2xl bg-violet-200/60" />
          <div className="h-4 w-64 rounded-xl bg-stone-200/70" />
        </div>
        <div className="h-10 w-40 rounded-2xl bg-violet-200/50" />
      </div>

      {/* Role Badges Bar */}
      <div className="card-base p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 rounded-xl bg-violet-100/70" />
          <div className="h-8 w-28 rounded-xl bg-stone-100" />
        </div>
        <div className="h-8 w-36 rounded-xl bg-stone-100 hidden sm:block" />
      </div>

      {/* Admin Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card-base p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-violet-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded-lg bg-stone-200/80" />
                  <div className="h-3 w-20 rounded-md bg-stone-100" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-xl bg-violet-100/80" />
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="h-3 w-40 rounded bg-stone-100" />
              <div className="h-3 w-32 rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
