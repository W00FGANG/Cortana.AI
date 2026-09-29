import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Activity as ActivityIcon, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAgentStyle, formatTimeAgo } from "@/lib/agent-ui";
import { scheduleStalledExecutionsCheck } from "@/lib/stalled-executions";
import { formatHumanReadableActivity, formatHumanReadableRunOutput } from "@/lib/log-formatter";
import { LiveRunMonitor } from "@/components/LiveRunMonitor";
import { ArticleOutputViewer } from "@/components/ArticleOutputViewer";
import { SocialPublisherOutputViewer } from "@/components/SocialPublisherOutputViewer";
import { JsonFileOutputViewer } from "@/components/JsonFileOutputViewer";
import { AgentRunForm } from "@/components/AgentRunForm";
import { AgentChatBubble } from "@/components/AgentChatBubble";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ==================== SLOWER SECTION 1: CURRENT TASK & LOGS ====================
async function AgentTaskExecutionSection({ 
  agentId, 
  agentName,
  chatThemeCardBg 
}: { 
  agentId: string; 
  agentName: string;
  chatThemeCardBg: string;
}) {
  const [tasks, activities, runs] = await Promise.all([
    prisma.task.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.activity.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.agentRun.findMany({
      where: { agentId, status: "Running" },
      take: 1,
    }),
  ]);

  const isRunning = tasks.some((t) => t.status === "Running") || runs.length > 0;
  const currentTask = tasks.find((t) => t.status === "Running" || t.status === "Needs Approval") || tasks[0];

  const isEmailAgent = agentName.toLowerCase().includes("kainoa");
  const displayedActivities = isEmailAgent
    ? activities.filter((act) => {
        const a = act.action.toLowerCase();
        return a.includes("draft") || a.includes("approv") || a.includes("declin");
      })
    : activities;

  const recentLogs = displayedActivities.slice(0, 5);

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${chatThemeCardBg} animate-in fade-in duration-300`}>
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Current Task Execution</h2>
        {isRunning && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            Live Running
          </span>
        )}
      </div>

      {currentTask ? (
        <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${
                currentTask.status === "Running" ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" :
                currentTask.status === "Needs Approval" ? "bg-amber-50 text-amber-700 border-amber-200" :
                currentTask.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                currentTask.status === "Stalled" ? "bg-orange-50 text-orange-700 border-orange-200" :
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {currentTask.status}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Priority: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentTask.priority}</span>
              </span>
            </div>
            {currentTask.createdAt && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {formatTimeAgo(currentTask.createdAt)}
              </span>
            )}
          </div>

          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
            {currentTask.title}
          </p>

          {currentTask.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentTask.description}
            </p>
          )}

          {currentTask.result && (
            <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-400 dark:text-slate-500 shrink-0">Output:</span>
              <span className="truncate">{formatHumanReadableRunOutput(currentTask.result, null, agentName)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">No tasks happening at the moment.</p>
      )}

      {recentLogs && recentLogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ActivityIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Execution Logs
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Recent {recentLogs.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {recentLogs.map((act) => {
              const isActActive = act.status === "Running" && isRunning;
              const isActFailed = act.status === "Failed";
              const formatted = formatHumanReadableActivity(act, agentName);

              return (
                <div
                  key={act.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-xs transition-colors ${
                    isActActive
                      ? "bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-950 dark:text-blue-100"
                      : isActFailed
                      ? "bg-rose-50/70 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-100"
                      : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isActActive ? (
                      <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                      </span>
                    ) : isActFailed ? (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                      {formatted.action}
                    </span>
                    {formatted.description && formatted.description !== formatted.action && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate">
                          {formatted.description}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 ml-2">
                    {formatTimeAgo(act.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskExecutionSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/2 rounded bg-slate-200/60 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

// ==================== SLOWER SECTION 2: OUTPUT VIEWERS ====================
async function AgentOutputWrapper({
  agentId,
  agentName,
  agentRole,
  n8nWorkflowId,
}: {
  agentId: string;
  agentName: string;
  agentRole: string;
  n8nWorkflowId?: string | null;
}) {
  const isArticleGenerator =
    agentName.toLowerCase().includes("harper") ||
    agentRole.toLowerCase().includes("article") ||
    n8nWorkflowId === "1DElnhi9xf3iwYcp";

  const isEmailAgent =
    agentName.toLowerCase().includes("kainoa") ||
    agentRole.toLowerCase().includes("outreach") ||
    agentRole.toLowerCase().includes("email") ||
    n8nWorkflowId === "Al3atlOTCSx8ZNgN";

  const isMarketingAgent =
    agentName.toLowerCase().includes("maya") ||
    agentRole.toLowerCase().includes("marketing") ||
    n8nWorkflowId === "6SfepVmMljnVsWBG";

  const [completedTask, completedRun, approvals] = await Promise.all([
    prisma.task.findFirst({
      where: { agentId, result: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentRun.findFirst({
      where: { agentId, output: { not: null } },
      orderBy: { startedAt: "desc" },
    }),
    isEmailAgent
      ? prisma.approval.findMany({
          where: { agentId, status: "Approved" },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const latestArticleOutput = completedTask?.result || completedRun?.output;

  let isSocialPublisherOutput = false;
  if (isMarketingAgent && latestArticleOutput) {
    try {
      const trimmed = latestArticleOutput.trim();
      if (trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        if (parsed && (parsed.platforms || parsed.post_summary || parsed.target_platforms || parsed.post_text)) {
          isSocialPublisherOutput = true;
        }
      }
    } catch {}
  }

  let emailWorkflowJsonOutput: string | null = null;
  if (isEmailAgent) {
    const rawOutput = completedRun?.output || completedTask?.result;
    if (rawOutput) {
      try {
        const parsed = JSON.parse(rawOutput);
        if (Array.isArray(parsed)) {
          const stringArray = parsed
            .map((item) => typeof item === "string" ? item : (item.email || item.recipientEmail || String(item)))
            .filter(Boolean);
          emailWorkflowJsonOutput = JSON.stringify(stringArray, null, 2);
        } else if (parsed && typeof parsed === "object") {
          const arr = parsed.sentEmails || parsed.emails;
          if (Array.isArray(arr)) {
            const stringArray = arr
              .map((item: any) => typeof item === "string" ? item : (item.email || item.recipientEmail || String(item)))
              .filter(Boolean);
            emailWorkflowJsonOutput = JSON.stringify(stringArray, null, 2);
          } else {
            emailWorkflowJsonOutput = JSON.stringify(parsed, null, 2);
          }
        }
      } catch {}
    }

    if (!emailWorkflowJsonOutput && approvals.length > 0) {
      const taskApprovedEmails = approvals
        .map((a) => {
          const match =
            a.content.match(/<([^>]+@[^>]+)>/) ||
            a.content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          return match ? match[1] : a.title;
        })
        .filter(Boolean);

      if (taskApprovedEmails.length > 0) {
        emailWorkflowJsonOutput = JSON.stringify(taskApprovedEmails, null, 2);
      }
    }
  }

  if (isMarketingAgent && isSocialPublisherOutput && latestArticleOutput) {
    return (
      <div className="animate-in fade-in duration-300">
        <SocialPublisherOutputViewer
          outputData={latestArticleOutput}
          defaultTitle={completedTask?.title || "Social Media Publishing Receipt"}
        />
      </div>
    );
  }

  if (!isEmailAgent && latestArticleOutput) {
    return (
      <div className="animate-in fade-in duration-300">
        <ArticleOutputViewer
          outputData={latestArticleOutput}
          defaultTitle={completedTask?.title || (isMarketingAgent ? "Social Media Research Report" : "Research Article Output")}
          agentType={isMarketingAgent ? "marketing" : isArticleGenerator ? "article" : "general"}
        />
      </div>
    );
  }

  if (isEmailAgent && emailWorkflowJsonOutput) {
    return (
      <div className="animate-in fade-in duration-300">
        <JsonFileOutputViewer
          outputData={emailWorkflowJsonOutput}
          fileName="sent-emails.json"
          title="Workflow Output"
        />
      </div>
    );
  }

  return null;
}

function OutputSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 animate-pulse">
      <div className="h-6 w-52 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="h-4 w-4/5 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="h-4 w-2/3 rounded bg-slate-200/70 dark:bg-slate-800/70" />
      </div>
    </div>
  );
}

// ==================== SLOWER SECTION 3: RECENT RUNS ====================
async function AgentRecentRunsSection({ 
  agentId, 
  agentName,
  chatThemeCardBg 
}: { 
  agentId: string; 
  agentName?: string;
  chatThemeCardBg: string; 
}) {
  const runs = await prisma.agentRun.findMany({
    where: { agentId },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { task: true },
  });

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${chatThemeCardBg} animate-in fade-in duration-300`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Runs</h2>
      {runs.length === 0 ? (
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
              {runs.map((run) => {
                const outputSummary = formatHumanReadableRunOutput(run.output, run.error, agentName);
                return (
                  <tr key={run.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatTimeAgo(run.startedAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {run.task?.title || run.input || "Scheduled execution"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        run.status === "Completed" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400" :
                        run.status === "Running" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 animate-pulse" :
                        run.status === "Stalled" ? "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400" :
                        "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs max-w-sm truncate" title={outputSummary}>
                      {outputSummary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentRunsSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 animate-pulse">
      <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-40 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SLOWER SECTION 4: TOTAL ACTIVITY ====================
async function AgentTotalActivitySection({ 
  agentId, 
  chatThemeCardBg 
}: { 
  agentId: string; 
  chatThemeCardBg: string; 
}) {
  const completedCount = await prisma.task.count({
    where: { agentId, status: "Completed" },
  });

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${chatThemeCardBg} animate-in fade-in duration-300`}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 uppercase tracking-wider">Total Activity</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{completedCount}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">completed tasks</span>
      </div>
    </div>
  );
}

function TotalActivitySkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-2 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

// ==================== MAIN AGENT PROFILE PAGE ====================
export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;

  scheduleStalledExecutionsCheck();

  // Fast query: Only fetch the basic agent info
  const agent = await prisma.agent.findFirst({
    where: {
      OR: [
        { id: id },
        { name: { equals: id, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      role: true,
      description: true,
      avatar: true,
      status: true,
      systemPrompt: true,
      capabilities: true,
      n8nWorkflowId: true,
    },
  });

  if (!agent) {
    notFound();
  }

  const isArticleGenerator =
    agent.name.toLowerCase().includes("harper") ||
    agent.role.toLowerCase().includes("article") ||
    agent.n8nWorkflowId === "1DElnhi9xf3iwYcp";

  const isEmailAgent =
    agent.name.toLowerCase().includes("kainoa") ||
    agent.role.toLowerCase().includes("outreach") ||
    agent.role.toLowerCase().includes("email") ||
    agent.n8nWorkflowId === "Al3atlOTCSx8ZNgN";

  const isMarketingAgent =
    agent.name.toLowerCase().includes("maya") ||
    agent.role.toLowerCase().includes("marketing") ||
    agent.n8nWorkflowId === "6SfepVmMljnVsWBG";

  const style = getAgentStyle(agent.name);
  const Icon = style.icon;

  let chatTheme = {
    bg: "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border-slate-200 dark:border-slate-700/80",
    tail: "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80",
    avatarBorder: "border-slate-200 dark:border-slate-600",
    fallbackIcon: "border-slate-200 bg-slate-100 text-slate-600",
    cardBg: "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-200 dark:border-slate-700/50",
  };

  const nameLower = agent.name.toLowerCase();
  if (nameLower.includes("kainoa")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-800/40 dark:to-slate-900 border-emerald-100 dark:border-emerald-700/50",
      tail: "bg-emerald-50 dark:bg-emerald-800/40 border-emerald-100 dark:border-emerald-700/50",
      avatarBorder: "border-emerald-200 dark:border-emerald-600",
      fallbackIcon: "border-emerald-200 bg-emerald-100 text-emerald-600",
      cardBg: "bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-800/30 dark:to-slate-900 border-emerald-100 dark:border-emerald-700/40",
    };
  } else if (nameLower.includes("kent")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-blue-50 to-white dark:from-blue-800/40 dark:to-slate-900 border-blue-100 dark:border-blue-700/50",
      tail: "bg-blue-50 dark:bg-blue-800/40 border-blue-100 dark:border-blue-700/50",
      avatarBorder: "border-blue-200 dark:border-blue-600",
      fallbackIcon: "border-blue-200 bg-blue-100 text-blue-600",
      cardBg: "bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-800/30 dark:to-slate-900 border-blue-100 dark:border-blue-700/40",
    };
  } else if (nameLower.includes("maya")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-purple-50 to-white dark:from-purple-800/40 dark:to-slate-900 border-purple-100 dark:border-purple-700/50",
      tail: "bg-purple-50 dark:bg-purple-800/40 border-purple-100 dark:border-purple-700/50",
      avatarBorder: "border-purple-200 dark:border-purple-600",
      fallbackIcon: "border-purple-200 bg-purple-100 text-purple-600",
      cardBg: "bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-800/30 dark:to-slate-900 border-purple-100 dark:border-purple-700/40",
    };
  } else if (nameLower.includes("nora")) {
    chatTheme = {
      bg: "bg-gradient-to-r from-purple-50 to-white dark:from-purple-800/40 dark:to-slate-900 border-purple-100 dark:border-purple-700/50",
      tail: "bg-purple-50 dark:bg-purple-800/40 border-purple-100 dark:border-purple-700/50",
      avatarBorder: "border-purple-200 dark:border-purple-600",
      fallbackIcon: "border-purple-200 bg-purple-100 text-purple-600",
      cardBg: "bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-800/30 dark:to-slate-900 border-purple-100 dark:border-purple-700/40",
    };
  } else if (nameLower.includes("harper") || isArticleGenerator) {
    chatTheme = {
      bg: "bg-gradient-to-r from-rose-50 to-white dark:from-rose-800/40 dark:to-slate-900 border-rose-100 dark:border-rose-700/50",
      tail: "bg-rose-50 dark:bg-rose-800/40 border-rose-100 dark:border-rose-700/50",
      avatarBorder: "border-rose-200 dark:border-rose-600",
      fallbackIcon: "border-rose-200 bg-rose-100 text-rose-600",
      cardBg: "bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-800/30 dark:to-slate-900 border-rose-100 dark:border-rose-700/40",
    };
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation - RENDERS IMMEDIATELY */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>


      {/* Agent Header - RENDERS IMMEDIATELY */}
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
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {agent.status}
                </span>
              </div>
            </div>
          </div>

          <LiveRunMonitor isRunning={false} agentId={agent.id} />
        </div>
        
        <AgentChatBubble
          agentId={agent.id}
          agentName={agent.name}
          agentRole={agent.role}
          agentAvatar={agent.avatar}
          agentIcon={<Icon className="h-5 w-5" />}
          theme={{
            bg: chatTheme.bg,
            tail: chatTheme.tail,
            avatarBorder: chatTheme.avatarBorder,
            fallbackIcon: chatTheme.fallbackIcon,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Interactive Trigger Panel - RENDERS IMMEDIATELY FOR FAST INTERACTION */}
          {(isArticleGenerator || isEmailAgent || isMarketingAgent) && (
            <AgentRunForm
              agentId={agent.id}
              agentName={agent.name}
              isEmailAgent={isEmailAgent}
              isMarketingAgent={isMarketingAgent}
            />
          )}

          {/* Current Active Task & Live Step Execution - STREAMS WITH DEDICATED LOADER */}
          <Suspense fallback={<TaskExecutionSkeleton />}>
            <AgentTaskExecutionSection 
              agentId={agent.id} 
              agentName={agent.name} 
              chatThemeCardBg={chatTheme.cardBg} 
            />
          </Suspense>

          {/* Output Section - STREAMS WITH DEDICATED LOADER */}
          <Suspense fallback={<OutputSkeleton />}>
            <AgentOutputWrapper
              agentId={agent.id}
              agentName={agent.name}
              agentRole={agent.role}
              n8nWorkflowId={agent.n8nWorkflowId}
            />
          </Suspense>

          {/* About Agent Section - RENDERS IMMEDIATELY */}
          <div className={`rounded-xl border p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start ${chatTheme.cardBg}`}>
            {agent.avatar && (
              <img src={agent.avatar} alt={agent.name} className="w-32 sm:w-48 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">About {agent.name}</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{agent.description}</p>
              {agent.systemPrompt && agent.name.toLowerCase() !== "maya" && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg relative">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1 block">Directive</span>
                  <p className="text-sm text-blue-900/80 dark:text-blue-200 italic">
                    "{agent.systemPrompt}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Runs Table - STREAMS WITH DEDICATED LOADER */}
          <Suspense fallback={<RecentRunsSkeleton />}>
            <AgentRecentRunsSection 
              agentId={agent.id} 
              agentName={agent.name}
              chatThemeCardBg={chatTheme.cardBg} 
            />
          </Suspense>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Capabilities - RENDERS IMMEDIATELY */}
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

          {/* Total Activity Count - STREAMS WITH DEDICATED LOADER */}
          <Suspense fallback={<TotalActivitySkeleton />}>
            <AgentTotalActivitySection 
              agentId={agent.id} 
              chatThemeCardBg={chatTheme.cardBg} 
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
