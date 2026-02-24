type EmptyStateProps = {
  subtitle: string;
};

export default function EmptyState({ subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-900">
      <div
        aria-hidden="true"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="h-4 w-4 rounded-sm bg-slate-300 dark:bg-slate-500" />
      </div>

      <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">No events found</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
