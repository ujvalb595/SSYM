export default function SocialLoading() {
  return (
    <div className="mx-auto max-w-md space-y-6 animate-pulse p-2 sm:p-4">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between rounded-3xl border border-[#ebe7f6] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="size-10 rounded-2xl bg-violet-100" />
          <div className="size-10 rounded-2xl bg-pink-100" />
          <div className="size-10 rounded-2xl bg-blue-100" />
        </div>
        <div className="h-8 w-36 rounded-2xl bg-stone-100" />
      </div>

      {/* Stories Bar Skeleton */}
      <div className="flex items-center gap-3 overflow-hidden rounded-3xl border border-[#ebe7f6] bg-white p-4 shadow-xs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="size-14 rounded-full bg-violet-100/80 border-2 border-violet-200" />
            <div className="h-2.5 w-10 rounded-md bg-stone-200" />
          </div>
        ))}
      </div>

      {/* Feed Cards Skeleton */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-[#ebe7f6] bg-white shadow-xs space-y-3 p-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-violet-100" />
            <div className="h-3.5 w-32 rounded-lg bg-stone-200" />
          </div>
          <div className="h-64 w-full rounded-2xl bg-stone-100" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="h-3 w-48 rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
