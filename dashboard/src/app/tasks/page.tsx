import { Filter, Play, CheckCircle2, Clock, AlertCircle, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTimeAgo } from "@/lib/agent-ui";
import { updateStalledExecutions } from "@/lib/stalled-executions";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await updateStalledExecutions();

  const tasks = await prisma.task.findMany({
    include: {
      agent: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Running": return <Clock className="h-4 w-4 text-blue-500" />;
      case "Needs Approval": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "Stalled": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "Running": return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50";
      case "Needs Approval": return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
      case "Stalled": return "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50";
      default: return "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all live AI worker tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
            Filters ({tasks.length})
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Task</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Scheduled</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No tasks currently registered.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>
                        <p>{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{task.agent.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${
                        task.priority === 'High' ? 'text-red-600 dark:text-red-400' : task.priority === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {task.scheduledFor ? formatTimeAgo(task.scheduledFor) : "On demand"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {task.status === "Pending" || task.status === "Needs Approval" ? (
                        <button className="inline-flex items-center gap-1.5 rounded bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                          <Play className="h-3 w-3 fill-current" />
                          Run
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">Logged</span>
                      )}
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
