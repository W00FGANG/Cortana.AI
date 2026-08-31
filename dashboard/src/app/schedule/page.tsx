import { Edit, Clock, CalendarDays } from "lucide-react";
import { workers } from "@/lib/mock-data";

export default function SchedulePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Schedule</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage when your AI workers run automatically.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className={`h-2 w-full ${worker.color.split(' ')[0]} dark:opacity-50`}></div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${worker.color} ${worker.borderColor} dark:bg-slate-800 dark:border-slate-700 shrink-0`}>
                  <worker.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{worker.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{worker.role}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Frequency</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{worker.schedule.split('—')[0].trim()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Time</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{worker.schedule.split('—')[1]?.trim() || 'Custom'}</p>
                  </div>
                </div>
              </div>
              
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50 transition-colors shadow-sm">
                <Edit className="h-4 w-4" />
                Edit Schedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
