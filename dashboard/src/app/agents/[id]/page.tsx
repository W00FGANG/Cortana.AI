import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Activity as ActivityIcon, Loader2, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAgentStyle, formatTimeAgo } from "@/lib/agent-ui";
import { LiveRunMonitor } from "@/components/LiveRunMonitor";
import { ArticleOutputViewer } from "@/components/ArticleOutputViewer";
import { AgentRunForm } from "@/components/AgentRunForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;

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

  const isArticleGenerator =
    agent.name.toLowerCase().includes("harper") ||
    agent.role.toLowerCase().includes("article") ||
    agent.n8nWorkflowId === "1DElnhi9xf3iwYcp";

  const style = getAgentStyle(agent.name);
  const Icon = style.icon;
  const isRunning = agent.tasks.some((t) => t.status === "Running") || agent.runs.some((r) => r.status === "Running");
  const currentTask = agent.tasks.find((t) => t.status === "Running" || t.status === "Pending") || agent.tasks[0];
  const completedTasks = agent.tasks.filter((t) => t.status === "Completed");

  // Find latest completed article output
  const completedTaskWithResult = agent.tasks.find((t) => t.status === "Completed" && t.result) || agent.tasks.find((t) => t.result);
  const completedRunWithOutput = agent.runs.find((r) => r.status === "Completed" && r.output) || agent.runs.find((r) => r.output);
  const latestArticleOutput = completedTaskWithResult?.result || completedRunWithOutput?.output;

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
            <div className={`flex h-16 w-16 items-center justify-center rounded-xl border ${style.color} ${style.borderColor} shrink-0`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{agent.name}</h1>
              <p className="text-lg text-slate-600">{agent.role}</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Interactive Trigger Panel */}
          {isArticleGenerator && (
            <AgentRunForm agentId={agent.id} agentName={agent.name} />
          )}

          {/* Current Active Task & Live Step Updates */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Current Task & Step Execution</h2>
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
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <ActivityIcon className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                            ? "bg-blue-50/80 border-blue-200 text-blue-950 shadow-xs"
                            : isActFailed
                              ? "bg-rose-50/70 border-rose-200 text-rose-900"
                              : "bg-emerald-50/30 border-emerald-100 text-slate-800 hover:border-emerald-200"
                          }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {isActActive ? (
                            <span className="mt-1 flex h-2 w-2 relative shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                          ) : isActFailed ? (
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 truncate">
                                {isActSuccess && act.action.startsWith("Executing:")
                                  ? act.action.replace("Executing:", "Executed:")
                                  : act.action}
                              </p>
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${isActActive
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : isActFailed
                                      ? "bg-rose-100 text-rose-800 border-rose-200"
                                      : "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                                  }`}
                              >
                                {isActActive ? "In Progress" : isActFailed ? "Failed" : "Completed"}
                              </span>
                            </div>
                            {act.description && (
                              <p className="text-slate-500 truncate mt-0.5">{act.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 pt-0.5">
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

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Overview</h2>
            <p className="text-slate-600 leading-relaxed">{agent.description}</p>
          </div>

          {/* Recent Runs Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Runs</h2>
            {agent.runs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No execution logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Task / Input</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agent.runs.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatTimeAgo(run.startedAt)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                          {run.task?.title || run.input || "Scheduled execution"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${run.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                              run.status === "Running" ? "bg-blue-100 text-blue-800 animate-pulse" :
                                "bg-red-100 text-red-800"
                            }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs font-mono max-w-sm truncate">
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

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Schedule</h2>
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Clock className="h-5 w-5 text-slate-400 shrink-0" />
              <span>{agent.schedule || "On-demand execution"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Capabilities</h2>
            <ul className="space-y-3">
              {agent.capabilities && agent.capabilities.length > 0 ? (
                agent.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm">{cap}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-500 italic">No specific capabilities listed.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Total Activity</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{completedTasks.length}</span>
              <span className="text-sm text-slate-500">completed tasks</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
