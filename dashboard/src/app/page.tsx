import { Suspense } from "react";
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
import { scheduleStalledExecutionsCheck } from "@/lib/stalled-executions";
import { formatHumanReadableActivity } from "@/lib/log-formatter";

export const dynamic = "force-dynamic";

// ==================== METRICS SECTION ====================
async function DashboardMetrics() {
  const [
    activeAgentsCount,
    totalTasksCount,
    completedTasksCount,
    pendingApprovalsCount,
  ] = await Promise.all([
    prisma.agent.count({ where: { status: "Active" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "Completed" } }),
    prisma.approval.count({
      where: {
        status: "Pending",
        agent: {
          name: {
            not: "Harper",
            mode: "insensitive",
          },
        },
        NOT: [
          {
            title: {
              contains: "Research",
              mode: "insensitive",
            },
          },
        ],
      },
    }),
  ]);

  const metrics = [
    { name: "Active Workers", value: activeAgentsCount.toString(), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
    { name: "Total Tasks", value: totalTasksCount.toString(), icon: Clock, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { name: "Completed", value: completedTasksCount.toString(), icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
    { name: "Needs Approval", value: pendingApprovalsCount.toString(), icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/40" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.name} className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${metric.bg} ${metric.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.name}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{metric.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-12 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== WORKERS GRID SECTION ====================
async function WorkersGrid() {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {agents.map((agent) => {
        const style = getAgentStyle(agent.name);
        const Icon = style.icon;
        const currentTask = agent.tasks.find(t => t.status === "Running" || t.status === "Needs Approval");
        const completedCount = agent.tasks.filter(t => t.status === "Completed").length;

        return (
          <Link 
            key={agent.id} 
            href={`/${agent.name.toLowerCase()}`}
            className="group relative flex flex-col justify-end min-h-[460px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 border border-slate-200 dark:border-slate-800 cursor-pointer block text-left"
          >
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
              <div className="flex items-center gap-4 mb-4 transition-opacity">
                {agent.avatar ? (
                  <img src={agent.avatar} alt={agent.name} className="h-14 w-14 rounded-full object-cover border-2 border-white/20 shadow-lg" />
                ) : (
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 shadow-lg ${style.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white drop-shadow-sm group-hover:text-blue-300 transition-colors">{agent.name}</h3>
                  <p className="text-sm font-medium text-slate-300 drop-shadow-sm line-clamp-1">{agent.role}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
                  <p className="text-sm text-slate-100 line-clamp-2">
                    {currentTask ? currentTask.title : "No tasks happening at the moment"}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-4 mb-4 px-1">
                  <span className="text-slate-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400"/> {completedCount} Completed
                  </span>
                </div>

                <div 
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 group-hover:bg-white/20 backdrop-blur-md border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all group-hover:gap-3"
                >
                  Open Worker
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function WorkersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col justify-end min-h-[460px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3.5 w-44 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="h-16 w-full rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
          <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

// ==================== RECENT ACTIVITY SECTION ====================
async function RecentActivity() {
  const recentActivities = await prisma.activity.findMany({
    include: { agent: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-in fade-in duration-300">
      <div className="space-y-6">
        {recentActivities.map((activity) => {
          const formatted = formatHumanReadableActivity(activity.action, activity.description, activity.agent.name);
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/${activity.agent.name.toLowerCase()}`} className="text-sm font-medium text-slate-900 dark:text-slate-50 hover:underline">
                    {activity.agent.name}
                  </Link>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatTimeAgo(activity.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{formatted.action}</p>
                {formatted.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">"{formatted.description}"</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-14 rounded bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
            <div className="h-3.5 w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN DASHBOARD ====================
export default function Dashboard() {
  scheduleStalledExecutionsCheck();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header - RENDERS INSTANTLY WITHOUT ANY WAIT */}
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

      {/* Metrics Section - Streams with its own local loader */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>

      {/* Main Content Vertical Stack */}
      <div className="flex flex-col gap-10">
        
        {/* Workers Section - Streams with its own local loader */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Corvana Workers</h2>
          </div>
          <Suspense fallback={<WorkersGridSkeleton />}>
            <WorkersGrid />
          </Suspense>
        </div>

        {/* Activity Feed - Streams with its own local loader */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Activity</h2>
            <Link href="/operations" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:hover:text-blue-500">
              View log
            </Link>
          </div>
          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivity />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
