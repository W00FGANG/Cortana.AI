import { Filter, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTimeAgo } from "@/lib/agent-ui";
import { updateStalledExecutions } from "@/lib/stalled-executions";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await updateStalledExecutions();

  const activities = await prisma.activity.findMany({
    include: {
      agent: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global activity log for all AI workers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
            Filters ({activities.length})
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                activities.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">
                      <div className="flex items-center gap-3">
                        {log.agent.avatar ? (
                          <img src={log.agent.avatar} alt={log.agent.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{log.agent.name.charAt(0)}</span>
                          </div>
                        )}
                        <span>{log.agent.name === 'Kai' ? 'Kainoa' : log.agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{log.action}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs max-w-sm truncate">
                      {log.description || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                        log.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        log.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                        log.status === 'Stalled' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
