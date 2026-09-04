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
import { updateStalledExecutions } from "@/lib/stalled-executions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await updateStalledExecutions();

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
            Corvana Dashboard
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

      {/* Main Content Vertical Stack */}
      <div className="flex flex-col gap-10">
        
        {/* Workers Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Corvana Workers</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const style = getAgentStyle(agent.name);
              const Icon = style.icon;
              const currentTask = agent.tasks.find(t => t.status === "Running" || t.status === "Pending") || agent.tasks[0];
              const completedCount = agent.tasks.filter(t => t.status === "Completed").length;

              return (
                <div key={agent.id} className="group relative flex flex-col justify-end min-h-[460px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 border border-slate-200 dark:border-slate-800">
                  
                  {/* Full Background Image */}
                  <img 
                    src={`/assets/${agent.name}Body.jpg`} 
                    alt={agent.name} 
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlays for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent pointer-events-none"></div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/50 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      {agent.status}
                    </span>
                  </div>

                  {/* Glassmorphism Info Panel */}
                  <div className="relative z-10 p-5 mt-auto">
                    <div className="flex items-center gap-4 mb-4">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="h-14 w-14 rounded-full object-cover border-2 border-white/20 shadow-lg" />
                      ) : (
                        <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 shadow-lg ${style.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white drop-shadow-sm">{agent.name}</h3>
                        <p className="text-sm font-medium text-slate-300 drop-shadow-sm line-clamp-1">{agent.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
                        <p className="text-sm text-slate-100 line-clamp-2">
                          {currentTask ? currentTask.title : "No active task assigned"}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 mb-4 px-1">
                        <span className="text-slate-300 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400"/> {completedCount} Completed
                        </span>
                      </div>

                      <Link 
                        href={`/agents/${agent.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all group-hover:gap-3"
                      >
                        Open Worker
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Activity</h2>
            <Link href="/operations" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:hover:text-blue-500">
              View log
            </Link>
          </div>
          
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900" />
                  <div className="pl-6 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{activity.agent.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatTimeAgo(activity.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{activity.action}</p>
                    {activity.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">"{activity.description}"</p>
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
