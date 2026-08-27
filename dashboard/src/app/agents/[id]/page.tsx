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
        <Link href="/agents" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-xl border ${worker.color} ${worker.borderColor} shrink-0`}>
              <worker.icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{worker.name}</h1>
              <p className="text-lg text-slate-600">{worker.role}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {worker.status}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <Pause className="h-4 w-4" />
              Pause Worker
            </button>
            <button className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <Settings className="h-4 w-4" />
              Edit Worker
            </button>
            <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Play className="h-4 w-4 fill-current" />
              Run Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Overview</h2>
            <p className="text-slate-600 leading-relaxed">{worker.description}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Task</h2>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <p className="font-medium text-slate-900 mb-3">{worker.currentTask}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-medium text-slate-700">65%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Runs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRuns.map((run, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{run.time}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{run.task}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          run.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{run.duration}</td>
                      <td className="px-4 py-3 text-slate-600">{run.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Schedule</h2>
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <worker.icon className="h-5 w-5 text-slate-400" />
              <span>{worker.schedule}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Capabilities</h2>
            <ul className="space-y-3">
              {worker.capabilities.map((cap, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Today's Activity</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{worker.completed}</span>
              <span className="text-sm text-slate-500">tasks completed</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
