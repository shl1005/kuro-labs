export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-4 flex flex-col justify-between animate-pulse">
      <div>
        {/* Image skeleton */}
        <div className="aspect-square w-full rounded-lg bg-zinc-800/60 mb-4" />
        
        {/* Category & Badge skeleton */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="h-3.5 w-16 bg-zinc-800/80 rounded" />
          <div className="h-3.5 w-14 bg-zinc-800/80 rounded-full" />
        </div>

        {/* Title skeleton */}
        <div className="h-5 w-4/5 bg-zinc-800 rounded mb-2" />
        <div className="h-5 w-3/5 bg-zinc-800 rounded mb-3" />

        {/* Description skeleton */}
        <div className="h-3.5 w-full bg-zinc-850 rounded mb-1.5" />
        <div className="h-3.5 w-4/5 bg-zinc-850 rounded mb-4" />
      </div>

      {/* Footer skeleton */}
      <div className="pt-3 border-t border-zinc-850/80 flex items-center justify-between mt-auto">
        <div className="h-6 w-16 bg-zinc-800 rounded" />
        <div className="h-9 w-28 bg-zinc-800 rounded-lg" />
      </div>
    </div>
  );
}
