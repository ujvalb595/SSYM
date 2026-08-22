export default function PaymentsLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-2xl bg-violet-200/60" />
        <div className="h-4 w-72 rounded-xl bg-stone-200/70" />
      </div>

      {/* Make Payment Card Skeleton */}
      <div className="card-base p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-violet-100" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded-lg bg-stone-200/80" />
            <div className="h-3 w-48 rounded-md bg-stone-100" />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-2xl bg-stone-100/80" />
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <div className="h-10 w-40 rounded-2xl bg-violet-200/60" />
        </div>
      </div>

      {/* Payment Requests Section Skeleton */}
      <div className="card-base overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-stone-100 p-5 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-violet-100" />
            <div className="h-4 w-44 rounded-lg bg-stone-200/80" />
          </div>
          <div className="h-6 w-20 rounded-xl bg-amber-100/70" />
        </div>
        <div className="divide-y divide-stone-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 px-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-violet-100/80" />
                <div className="space-y-1">
                  <div className="h-3.5 w-32 rounded bg-stone-200/80" />
                  <div className="h-2.5 w-24 rounded bg-stone-100" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-16 rounded bg-stone-200/70" />
                <div className="h-8 w-20 rounded-xl bg-emerald-100/60" />
                <div className="h-8 w-20 rounded-xl bg-rose-100/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
