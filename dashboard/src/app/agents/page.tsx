import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { workers } from "@/lib/mock-data";

export default function AgentsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            AI Workers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your autonomous workforce.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={`flex h-12 w-12 overflow-hidden items-center justify-center rounded-xl border ${worker.color} ${worker.borderColor} dark:bg-slate-800 dark:border-slate-700`}>
                  {worker.avatar ? (
                    <img src={worker.avatar} alt={worker.name} className="h-full w-full object-cover" />
                  ) : (
                    <worker.icon className="h-6 w-6" />
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {worker.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{worker.name}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-3">{worker.role}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-6">
                {worker.description}
              </p>
              
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Current Task</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{worker.currentTask}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Completed total</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{worker.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Last run</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{worker.lastRun}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Next run</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{worker.nextRun}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4">
              <Link 
                href={`/agents/${worker.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50 transition-all"
              >
                View Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
