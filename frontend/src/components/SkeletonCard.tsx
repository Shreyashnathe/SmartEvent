export default function SkeletonCard() {
  return (
    <article className="min-h-[250px] rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="animate-pulse">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </div>

        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
        </div>
      </div>
    </article>
  );
}
