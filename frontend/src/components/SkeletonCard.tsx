type SkeletonCardProps = {
  staggerIndex?: number;
};

export default function SkeletonCard({ staggerIndex = 0 }: SkeletonCardProps) {
  const animationDelay = `${Math.max(0, staggerIndex) * 120}ms`;

  return (
    <article
      className="h-[250px] rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-900"
      style={{ animationDelay }}
    >
      <div className="h-full animate-pulse" style={{ animationDelay }}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="skeleton-shimmer h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
          <div className="skeleton-shimmer h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
        </div>

        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
          <div className="skeleton-shimmer h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
          <div className="skeleton-shimmer h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="skeleton-shimmer h-4 w-full rounded bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
          <div className="skeleton-shimmer mt-2 h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" style={{ animationDelay }} />
        </div>
      </div>
    </article>
  );
}
