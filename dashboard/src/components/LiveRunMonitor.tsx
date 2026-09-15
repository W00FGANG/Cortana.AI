"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface LiveRunMonitorProps {
  isRunning: boolean;
  agentId: string;
}

export function LiveRunMonitor({ isRunning, agentId }: LiveRunMonitorProps) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
      setJustCompleted(false);
      return;
    }

    // Timer tick
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Active status polling every 2.5 seconds
    const poller = setInterval(async () => {
      if (isRefreshingRef.current) return;
      try {
        const res = await fetch(`/api/agents/${agentId}/status?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && !data.isRunning) {
            // Execution ended!
            isRefreshingRef.current = true;
            setJustCompleted(true);
            router.refresh();

            // Fallback reload if router cache holds old state after 1.5s
            setTimeout(() => {
              router.refresh();
            }, 1200);
            return;
          }
        }
      } catch {}

      // Keep server cache fresh while executing
      router.refresh();
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [isRunning, agentId, router]);

  if (!isRunning && !justCompleted) return null;

  if (justCompleted) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-medium text-emerald-800 transition-all duration-300">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <div className="flex-1 flex items-center justify-between gap-2">
          <span>Workflow execution completed! Rendering report...</span>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline"
          >
            <RefreshCw className="h-3 w-3" />
            Update Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs font-medium text-blue-800">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
      <div className="flex-1 flex items-center justify-between gap-2">
        <span>Active workflow executing... ({seconds}s elapsed)</span>
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold underline"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}
