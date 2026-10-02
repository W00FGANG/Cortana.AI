export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-slate-800 mb-2" />
          <div className="h-4 w-72 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </header>

      {/* Featured Voice Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-64 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="h-7 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Guardrails Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/50" />
        </div>
      </div>
    </div>
  );
}
