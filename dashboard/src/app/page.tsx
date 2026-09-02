import { 
  CheckCircle2, 
  Clock, 
  Users,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAgentStyle, formatTimeAgo } from "@/lib/agent-ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // 1. Fetch live metrics from Supabase
  const [
    activeAgentsCount,
    totalTasksCount,
    completedTasksCount,
    pendingApprovalsCount,
    agents,
    recentActivities
  ] = await Promise.all([
    prisma.agent.count({ where: { status: "Active" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "Completed" } }),
    prisma.approval.count({ where: { status: "Pending" } }),
    prisma.agent.findMany({
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
    }),
    prisma.activity.findMany({
      include: { agent: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const metrics = [
    { name: "Active Workers", value: activeAgentsCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Tasks", value: totalTasksCount.toString(), icon: Clock, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Completed", value: completedTasksCount.toString(), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Needs Approval", value: pendingApprovalsCount.toString(), icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Agent Control Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor and control your autonomous workforce.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${metric.bg} ${metric.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{metric.name}</p>
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Workers Section (2/3 width on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">AI Workforce</h2>
            <Link href="/agents" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all ({agents.length})
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const style = getAgentStyle(agent.name);
              const Icon = style.icon;
              const currentTask = agent.tasks.find(t => t.status === "Running" || t.status === "Pending") || agent.tasks[0];
              const completedCount = agent.tasks.filter(t => t.status === "Completed").length;

              return (
                <div key={agent.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${style.color} ${style.borderColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {agent.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{agent.role}</p>
                    
                    <div className="space-y-3 mt-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {currentTask ? currentTask.title : "No active task assigned"}
                        </p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Completed tasks</span>
                        <span className="font-medium text-slate-900">{completedCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Schedule</span>
                        <span className="font-medium text-slate-900">{agent.schedule || "On-demand"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-100 p-3">
                    <Link 
                      href={`/agents/${agent.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                      Open Worker
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed (1/3 width on lg) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <Link href="/operations" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View log
            </Link>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
                  <div className="pl-6 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{activity.agent.name}</span>
                      <span className="text-xs text-slate-500">{formatTimeAgo(activity.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600">{activity.action}</p>
                    {activity.description && (
                      <p className="text-sm text-slate-500 mt-1 italic">"{activity.description}"</p>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
            
          </div>
        </div>
      
    </div>
  );
}
