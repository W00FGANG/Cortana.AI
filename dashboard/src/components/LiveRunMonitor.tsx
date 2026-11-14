"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface LiveRunMonitorProps {
  isRunning: boolean;
  agentId: string;
}

export function LiveRunMonitor({ isRunning: initialIsRunning, agentId }: LiveRunMonitorProps) {
  const router = useRouter();
  const [running, setRunning] = useState(initialIsRunning);
  const [seconds, setSeconds] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevTaskRef = useRef<{ id: string; done: boolean } | null>(null);
  const completionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const markCompletedAndRefresh = useCallback(() => {
    setRunning(false);
    setJustCompleted(true);
    router.refresh();

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
    }
    completionTimerRef.current = setTimeout(() => {
      setJustCompleted(false);
    }, 5000);
  }, [router]);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  // Sync state if server prop changes
  useEffect(() => {
    if (initialIsRunning) {
      setRunning(true);
      setJustCompleted(false);
    }
  }, [initialIsRunning]);

  // Listen for custom agent-run-started events from AgentRunForm
  useEffect(() => {
    const handleRunStarted = (e: any) => {
      const targetId = e?.detail?.agentId;
      if (!targetId || targetId === agentId) {
        if (completionTimerRef.current) {
          clearTimeout(completionTimerRef.current);
        }
        setRunning(true);
        setJustCompleted(false);
        setSeconds(0);
      }
    };

    window.addEventListener("agent-run-started", handleRunStarted);
    return () => window.removeEventListener("agent-run-started", handleRunStarted);
  }, [agentId]);

  // Status check function
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/status?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      const currentRunning = Boolean(data.isRunning);
      const latestTaskId = data.latestTask?.id || null;
      const latestTaskDone = Boolean(data.latestTask?.isCompleted && data.latestTask?.hasResult);
      const prevTask = prevTaskRef.current;

      if (latestTaskId) {
        prevTaskRef.current = { id: latestTaskId, done: latestTaskDone };
      }

      // Case 1: Was running, now stopped -> WORKFLOW FINISHED!
      if (running && !currentRunning) {
        markCompletedAndRefresh();
        return;
      }

      // Case 2: Wasn't running, but API indicates it is now running
      if (!running && currentRunning) {
        setRunning(true);
        setJustCompleted(false);
        return;
      }

      // Case 3: Latest task transitioned from incomplete -> completed between polls
      if (
        prevTask &&
        latestTaskId === prevTask.id &&
        !prevTask.done &&
        latestTaskDone &&
        running
      ) {
        markCompletedAndRefresh();
        return;
      }
    } catch {}
  }, [agentId, running, markCompletedAndRefresh]);

  // Initial check on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Polling loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let poller: NodeJS.Timeout | null = null;

    if (running) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Fast polling (every 2s) while active
      poller = setInterval(() => {
        checkStatus();
      }, 2000);
    } else {
      // Idle polling (every 6s) to catch external or n8n workflow triggers
      poller = setInterval(() => {
        checkStatus();
      }, 6000);
    }

    const onFocus = () => checkStatus();
    window.addEventListener("focus", onFocus);

    return () => {
      if (timer) clearInterval(timer);
      if (poller) clearInterval(poller);
      window.removeEventListener("focus", onFocus);
    };
  }, [running, checkStatus]);

  if (!running && !justCompleted) return null;

  if (justCompleted) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-4 py-2.5 text-xs font-medium text-emerald-900 dark:text-emerald-200 shadow-sm animate-in fade-in duration-300">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="flex-1 flex items-center justify-between gap-3">
          <span>Workflow finished! Dashboard updated with latest results.</span>
          <button
            onClick={() => {
              router.refresh();
              setJustCompleted(false);
            }}
            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold underline hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-4 py-2.5 text-xs font-medium text-blue-900 dark:text-blue-200 shadow-sm animate-in fade-in duration-300">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
      <div className="flex-1 flex items-center justify-between gap-3">
        <span>Active workflow executing... ({seconds}s elapsed)</span>
        <button
          onClick={() => {
            router.refresh();
            checkStatus();
          }}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-semibold underline cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}
