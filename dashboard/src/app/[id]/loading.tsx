export default function AgentProfileLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Back to Dashboard Link Skeleton */}
      <div className="mb-8">
        <div className="h-5 w-36 rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>


      {/* Agent Header & Chat Bubble Skeleton */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2">
              <div className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-60 rounded bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="h-6 w-28 rounded-full bg-slate-200/60 dark:bg-slate-800/60 mt-2" />
            </div>
          </div>
          <div className="h-9 w-32 rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
        </div>

        {/* Chat Bubble Skeleton */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-3/4 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Action Trigger Panel Skeleton */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Current Task Execution Skeleton */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-1/2 rounded bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
