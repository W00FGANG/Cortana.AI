export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 rounded bg-slate-200/70" />
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-24 rounded bg-slate-200" />
                <div className="h-6 w-12 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Workers Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-lg bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-5 w-36 rounded bg-slate-200" />
                    <div className="h-3.5 w-48 rounded bg-slate-200/70" />
                  </div>
                  
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="h-3 w-20 rounded bg-slate-200" />
                    <div className="h-4 w-full rounded bg-slate-200/70" />
                    <div className="flex justify-between pt-1">
                      <div className="h-3.5 w-28 rounded bg-slate-200/70" />
                      <div className="h-3.5 w-8 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 p-3">
                  <div className="h-9 w-full rounded-md bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed Skeleton (1/3 width) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 rounded bg-slate-200" />
            <div className="h-4 w-16 rounded bg-slate-200" />
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                    <div className="h-3 w-14 rounded bg-slate-200/60" />
                  </div>
                  <div className="h-3.5 w-full rounded bg-slate-200/80" />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100">
              <div className="h-4 w-32 mx-auto rounded bg-slate-200" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
