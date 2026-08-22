export default function MembersLoading() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 animate-pulse space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-2xl bg-violet-200/60" />
          <div className="h-4 w-64 rounded-xl bg-stone-200/70" />
        </div>
        <div className="h-10 w-36 rounded-2xl bg-violet-200/50" />
      </div>

      {/* Search and Filters Bar */}
      <div className="card-base p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-10 w-full sm:w-80 rounded-2xl bg-stone-100" />
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="h-10 w-32 rounded-2xl bg-stone-100" />
            <div className="h-10 w-24 rounded-2xl bg-stone-100" />
          </div>
        </div>
      </div>

      {/* Members Table Card */}
      <div className="card-base overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-stone-100 p-5 bg-stone-50/50">
          <div className="h-4 w-32 rounded-lg bg-stone-200/80" />
          <div className="h-4 w-20 rounded-lg bg-stone-200/60" />
        </div>
        <div className="divide-y divide-stone-100">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 px-5">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-full bg-violet-100/80" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded-lg bg-stone-200/80" />
                  <div className="h-3 w-24 rounded-md bg-stone-100" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-8">
                <div className="h-3.5 w-20 rounded bg-stone-200/60" />
                <div className="h-6 w-12 rounded-xl bg-violet-100/70" />
                <div className="h-3.5 w-28 rounded bg-stone-100" />
              </div>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-stone-100" />
                <div className="size-8 rounded-xl bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
