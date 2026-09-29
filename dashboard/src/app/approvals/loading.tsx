export default function ApprovalsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="flex justify-between items-center">
        <div>
          <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-slate-800 mb-2" />
          <div className="h-4 w-72 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
      </header>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1">
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-20 rounded bg-slate-200/60 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="h-6 w-24 rounded-full bg-amber-100/50 dark:bg-amber-900/20" />
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-9 w-28 rounded-lg bg-emerald-200 dark:bg-emerald-900/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
