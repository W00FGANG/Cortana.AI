import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAgentStyle, formatTimeAgo } from "@/lib/agent-ui";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
      },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            AI Workers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your autonomous workforce.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-sm">
          <Plus className="h-4 w-4" />
          Create Worker
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const style = getAgentStyle(agent.name);
          const Icon = style.icon;
          const currentTask = agent.tasks.find((t) => t.status === "Running" || t.status === "Pending") || agent.tasks[0];
          const completedCount = agent.tasks.filter((t) => t.status === "Completed").length;
          const lastRun = agent.runs[0];

          return (
            <div key={agent.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${style.color} ${style.borderColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {agent.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-3">{agent.role}</p>
                <p className="text-sm text-slate-600 line-clamp-3 mb-6">
                  {agent.description}
                </p>
                
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
                    <p className="text-sm text-slate-700 line-clamp-1">
                      {currentTask ? currentTask.title : "No active task"}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Completed total</span>
                    <span className="font-medium text-slate-900">{completedCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Last run</span>
                    <span className="font-medium text-slate-900">
                      {lastRun ? formatTimeAgo(lastRun.startedAt) : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Schedule</span>
                    <span className="font-medium text-slate-900">{agent.schedule || "On-demand"}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border-t border-slate-100 p-4">
                <Link 
                  href={`/agents/${agent.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  View Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
