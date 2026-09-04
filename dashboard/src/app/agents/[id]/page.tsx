import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Activity as ActivityIcon, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAgentStyle, formatTimeAgo } from "@/lib/agent-ui";
import { updateStalledExecutions } from "@/lib/stalled-executions";
import { LiveRunMonitor } from "@/components/LiveRunMonitor";
import { ArticleOutputViewer } from "@/components/ArticleOutputViewer";
import { AgentRunForm } from "@/components/AgentRunForm";
import { AgentChatBubble } from "@/components/AgentChatBubble";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;

  await updateStalledExecutions();

  const agent = await prisma.agent.findFirst({
    where: {
      OR: [
        { id: id },
        { name: { equals: id, mode: "insensitive" } },
      ],
    },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
      },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          task: true,
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });

  if (!agent) {
    notFound();
  }

  const allAgents = await prisma.agent.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  const currentIndex = allAgents.findIndex(a => a.id === agent.id);
  const prevAgent = currentIndex > 0 ? allAgents[currentIndex - 1] : allAgents[allAgents.length - 1];
  const nextAgent = currentIndex < allAgents.length - 1 ? allAgents[currentIndex + 1] : allAgents[0];

  const isArticleGenerator =
    agent.name.toLowerCase().includes("harper") ||
    agent.role.toLowerCase().includes("article") ||
    agent.n8nWorkflowId === "1DElnhi9xf3iwYcp";

  const style = getAgentStyle(agent.name);
  const Icon = style.icon;
  const isRunning = agent.tasks.some((t) => t.status === "Running") || agent.runs.some((r) => r.status === "Running");
  const currentTask = agent.tasks.find((t) => t.status === "Running" || t.status === "Pending") || agent.tasks[0];
  const completedTasks = agent.tasks.filter((t) => t.status === "Completed");

  let chatTheme = {
    bg: "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border-slate-200 dark:border-slate-700/80",
    tail: "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80",
    avatarBorder: "border-slate-200 dark:border-slate-600",
    fallbackIcon: "border-slate-200 bg-slate-100 text-slate-600",
    cardBg: "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-200 dark:border-slate-700/50"
  };

  const nameLower = agent.name.toLowerCase();
  if (nameLower.includes("kainoa")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-800/40 dark:to-slate-900 border-emerald-100 dark:border-emerald-700/50",
      tail: "bg-emerald-50 dark:bg-emerald-800/40 border-emerald-100 dark:border-emerald-700/50",
      avatarBorder: "border-emerald-200 dark:border-emerald-600",
      fallbackIcon: "border-emerald-200 bg-emerald-100 text-emerald-600",
      cardBg: "bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-800/30 dark:to-slate-900 border-emerald-100 dark:border-emerald-700/40"
    };
  } else if (nameLower.includes("kent")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-blue-50 to-white dark:from-blue-800/40 dark:to-slate-900 border-blue-100 dark:border-blue-700/50",
      tail: "bg-blue-50 dark:bg-blue-800/40 border-blue-100 dark:border-blue-700/50",
      avatarBorder: "border-blue-200 dark:border-blue-600",
      fallbackIcon: "border-blue-200 bg-blue-100 text-blue-600",
      cardBg: "bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-800/30 dark:to-slate-900 border-blue-100 dark:border-blue-700/40"
    };
  } else if (nameLower.includes("maya")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-800/40 dark:to-slate-900 border-yellow-100 dark:border-yellow-700/50",
      tail: "bg-yellow-50 dark:bg-yellow-800/40 border-yellow-100 dark:border-yellow-700/50",
      avatarBorder: "border-yellow-200 dark:border-yellow-600",
      fallbackIcon: "border-yellow-200 bg-yellow-100 text-yellow-600",
      cardBg: "bg-gradient-to-br from-yellow-50/50 to-white dark:from-yellow-800/30 dark:to-slate-900 border-yellow-100 dark:border-yellow-700/40"
    };
  } else if (nameLower.includes("nora")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-purple-50 to-white dark:from-purple-800/40 dark:to-slate-900 border-purple-100 dark:border-purple-700/50",
      tail: "bg-purple-50 dark:bg-purple-800/40 border-purple-100 dark:border-purple-700/50",
      avatarBorder: "border-purple-200 dark:border-purple-600",
      fallbackIcon: "border-purple-200 bg-purple-100 text-purple-600",
      cardBg: "bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-800/30 dark:to-slate-900 border-purple-100 dark:border-purple-700/40"
    };
  } else if (nameLower.includes("harper") || isArticleGenerator) {
    chatTheme = {
      bg: "bg-gradient-to-r from-rose-50 to-white dark:from-rose-800/40 dark:to-slate-900 border-rose-100 dark:border-rose-700/50",
      tail: "bg-rose-50 dark:bg-rose-800/40 border-rose-100 dark:border-rose-700/50",
      avatarBorder: "border-rose-200 dark:border-rose-600",
      fallbackIcon: "border-rose-200 bg-rose-100 text-rose-600",
      cardBg: "bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-800/30 dark:to-slate-900 border-rose-100 dark:border-rose-700/40"
    };
  }

  // Find latest completed article output
  const completedTaskWithResult = agent.tasks.find((t) => t.status === "Completed" && t.result) || agent.tasks.find((t) => t.result);
  const completedRunWithOutput = agent.runs.find((r) => r.status === "Completed" && r.output) || agent.runs.find((r) => r.output);
  const latestArticleOutput = completedTaskWithResult?.result || completedRunWithOutput?.output;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {allAgents.length > 1 && (
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 dark:border-slate-800 pb-6">
          <Link 
            href={`/agents/${prevAgent.id}`} 
            className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 group-hover:-translate-x-1 transition-transform">
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Previous</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{prevAgent.name}</p>
            </div>
          </Link>

          <Link 
            href={`/agents/${nextAgent.id}`} 
            className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Next Worker</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{nextAgent.name}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 group-hover:translate-x-1 transition-transform">
              <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
          </Link>
        </div>
      )}

      {/* Agent Header & Welcome Chat Bubble */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl border ${style.color} ${style.borderColor} shrink-0 overflow-hidden shadow-sm`}>
                {agent.avatar ? (
                  <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-8 w-8" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{agent.name}</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">{agent.role}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium border ${isRunning
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                    <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-blue-500 animate-ping" : "bg-emerald-500"}`} />
                    {isRunning ? "Executing Workflow..." : agent.status}
                  </span>
                </div>
              </div>
            </div>

            <LiveRunMonitor isRunning={isRunning} agentId={agent.id} />
        </div>
        
        <AgentChatBubble
          agentId={agent.id}
          agentName={agent.name}
          agentRole={agent.role}
          agentAvatar={agent.avatar}
          agentIcon={<Icon className="h-5 w-5" />}
          currentTaskTitle={currentTask?.title}
          recentActivities={agent.activities?.slice(0, 3).map(a => a.action) || []}
          theme={{
            bg: chatTheme.bg,
            tail: chatTheme.tail,
            avatarBorder: chatTheme.avatarBorder,
            fallbackIcon: chatTheme.fallbackIcon
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Interactive Trigger Panel */}
          {isArticleGenerator && (
            <AgentRunForm agentId={agent.id} agentName={agent.name} />
          )}

          {/* Current Active Task & Live Step Updates */}
          <div className={`rounded-xl border p-6 shadow-sm ${chatTheme.cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Current Task & Step Execution</h2>
              {isRunning && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Live Running
                </span>
              )}
            </div>

            {currentTask ? (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900">{currentTask.title}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${currentTask.status === "Running" ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" :
                      currentTask.status === "Needs Approval" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        currentTask.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          currentTask.status === "Stalled" ? "bg-orange-50 text-orange-700 border-orange-200" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                    {currentTask.status}
                  </span>
                </div>
                {currentTask.description && (
                  <p className="text-sm text-slate-600 mb-3">{currentTask.description}</p>
                )}
                {currentTask.result && !currentTask.result.includes('"markdown"') && !currentTask.result.includes('# ') && (
                  <p className="text-xs font-mono bg-white p-2 rounded border border-slate-200 text-slate-700 mb-3">
                    Result: {currentTask.result}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Priority</span>
                    <span className="font-medium text-slate-700">{currentTask.priority}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No tasks currently queued.</p>
            )}

            {/* Step Updates Stream from Activity Logs */}
            {agent.activities && agent.activities.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <ActivityIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step Execution Logs ({agent.activities.length})
                  </h3>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {agent.activities.map((act) => {
                    const isActActive = act.status === "Running" && isRunning;
                    const isActFailed = act.status === "Failed";
                    const isActSuccess = !isActActive && !isActFailed;

                    return (
                      <div
                        key={act.id}
                        className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-xs transition-all ${isActActive
                            ? "bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-950 dark:text-blue-100 shadow-xs"
                            : isActFailed
                              ? "bg-rose-50/70 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-100"
                              : "bg-emerald-50/30 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-slate-800 dark:text-slate-200 hover:border-emerald-200 dark:hover:border-emerald-700/50"
                          }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {isActActive ? (
                            <span className="mt-1 flex h-2 w-2 relative shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-blue-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                            </span>
                          ) : isActFailed ? (
                            <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {isActSuccess && act.action.startsWith("Executing:")
                                  ? act.action.replace("Executing:", "Executed:")
                                  : act.action}
                              </p>
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${isActActive
                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50"
                                    : isActFailed
                                      ? "bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                                      : "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                                  }`}
                              >
                                {isActActive ? "In Progress" : isActFailed ? "Failed" : "Completed"}
                              </span>
                            </div>
                            {act.description && (
                              <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5">{act.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 pt-0.5">
                          {formatTimeAgo(act.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Output Viewer (Markdown & JSON Download) */}
          {latestArticleOutput && (
            <ArticleOutputViewer
              outputData={latestArticleOutput}
              defaultTitle={completedTaskWithResult?.title || "Research Article Output"}
            />
          )}

          <div className={`rounded-xl border p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start ${chatTheme.cardBg}`}>
            {agent.avatar && (
              <img src={agent.avatar} alt={agent.name} className="w-32 sm:w-48 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">About {agent.name}</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{agent.description}</p>
              {agent.systemPrompt && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg relative">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1 block">Directive</span>
                  <p className="text-sm text-blue-900/80 italic">
                    "{agent.systemPrompt}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Runs Table */}
          <div className={`rounded-xl border p-6 shadow-sm ${chatTheme.cardBg}`}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Runs</h2>
            {agent.runs.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No execution logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Task / Input</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {agent.runs.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatTimeAgo(run.startedAt)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                          {run.task?.title || run.input || "Scheduled execution"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${run.status === "Completed" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400" :
                              run.status === "Running" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 animate-pulse" :
                                run.status === "Stalled" ? "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400" :
                                  "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                            }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs font-mono max-w-sm truncate">
                          {run.error || run.output?.slice?.(0, 100) || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">

          <div className={`rounded-xl border p-6 shadow-sm ${chatTheme.cardBg}`}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-wider">Capabilities</h2>
            <ul className="space-y-3">
              {agent.capabilities && agent.capabilities.length > 0 ? (
                agent.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm">{cap}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500 italic">No specific capabilities listed.</li>
              )}
            </ul>
          </div>

          <div className={`rounded-xl border p-6 shadow-sm ${chatTheme.cardBg}`}>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-wider">Total Activity</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{completedTasks.length}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">completed tasks</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
