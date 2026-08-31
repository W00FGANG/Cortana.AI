import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play, Pause, Settings, CheckCircle2 } from "lucide-react";
import { workers } from "@/lib/mock-data";

export default function AgentProfilePage({ params }: { params: { id: string } }) {
  const worker = workers.find((w) => w.id === params.id);

  if (!worker) {
    notFound();
  }

  const recentRuns = [
    { time: "10:31 AM", task: worker.currentTask, status: "Completed", duration: "4m 12s", result: "Success" },
    { time: "Yesterday, 3:15 PM", task: "Analyze competitor data", status: "Completed", duration: "8m 45s", result: "Success" },
    { time: "Yesterday, 9:00 AM", task: "Review internal notes", status: "Failed", duration: "1m 02s", result: "API Error" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation */}
      <div>
        <Link href="/agents" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-16 w-16 overflow-hidden items-center justify-center rounded-xl border ${worker.color} ${worker.borderColor} dark:bg-slate-800 dark:border-slate-700 shrink-0`}>
              {worker.avatar ? (
                <img src={worker.avatar} alt={worker.name} className="h-full w-full object-cover" />
              ) : (
                <worker.icon className="h-8 w-8" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{worker.name}</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">{worker.role}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {worker.status}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <Pause className="h-4 w-4" />
              Pause Worker
            </button>
            <button className="flex items-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <Settings className="h-4 w-4" />
              Edit Worker
            </button>
            <button className="flex items-center gap-2 rounded-md bg-blue-600 dark:bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Play className="h-4 w-4 fill-current" />
              Run Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {worker.bodyImage && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative h-[400px] w-full">
              <img src={worker.bodyImage} alt={`${worker.name} body`} className="absolute inset-0 w-full h-full object-cover object-top" />
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Overview</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{worker.description}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Current Task</h2>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-4">
              <p className="font-medium text-slate-900 dark:text-slate-50 mb-3">{worker.currentTask}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">65%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Runs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentRuns.map((run, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{run.time}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{run.task}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          run.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{run.duration}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{run.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-wider">Schedule</h2>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <worker.icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <span>{worker.schedule}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-wider">Capabilities</h2>
            <ul className="space-y-3">
              {worker.capabilities.map((cap, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-wider">Today's Activity</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{worker.completed}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">tasks completed</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
