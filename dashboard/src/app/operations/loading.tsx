export default function OperationsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-slate-800 mb-2" />
          <div className="h-4 w-60 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-64 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="h-4 w-full rounded bg-slate-200/60 dark:bg-slate-800/60" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-48 rounded bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="h-4 w-32 rounded bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="h-6 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
