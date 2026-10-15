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
  const isReloadingRef = useRef(false);
  const prevTaskIdRef = useRef<string | null>(null);

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
        setRunning(true);
        setJustCompleted(false);
        setSeconds(0);
        isReloadingRef.current = false;
      }
    };

    window.addEventListener("agent-run-started", handleRunStarted);
    return () => window.removeEventListener("agent-run-started", handleRunStarted);
  }, [agentId]);

  // Status check function
  const checkStatus = useCallback(async () => {
    if (isReloadingRef.current) return;
    try {
      const res = await fetch(`/api/agents/${agentId}/status?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      const currentRunning = Boolean(data.isRunning);
      const latestTaskId = data.latestTask?.id || null;
      const latestTaskDone = data.latestTask?.isCompleted && data.latestTask?.hasResult;

      // Case 1: Was running, now stopped -> WORKFLOW FINISHED!
      if (running && !currentRunning) {
        isReloadingRef.current = true;
        setRunning(false);
        setJustCompleted(true);
        router.refresh();

        // Automatically reload page to display newly generated results & dossier
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      // Case 2: Wasn't running, but API indicates it is now running
      if (!running && currentRunning) {
        setRunning(true);
        setJustCompleted(false);
      }

      // Case 3: Transition in latest task status
      if (
        prevTaskIdRef.current &&
        latestTaskId === prevTaskIdRef.current &&
        latestTaskDone &&
        running
      ) {
        isReloadingRef.current = true;
        setRunning(false);
        setJustCompleted(true);
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      if (latestTaskId) {
        prevTaskIdRef.current = latestTaskId;
      }
    } catch {}
  }, [agentId, running, router]);

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
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-bounce" />
        <div className="flex-1 flex items-center justify-between gap-3">
          <span>Workflow finished! Updating dashboard with results...</span>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold underline hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Update Now
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
