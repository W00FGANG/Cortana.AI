"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

interface LiveRunMonitorProps {
  isRunning: boolean;
  agentId: string;
}

export function LiveRunMonitor({ isRunning, agentId }: LiveRunMonitorProps) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    // Timer tick
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Auto-refresh data every 3.5s while running
    const poller = setInterval(() => {
      router.refresh();
    }, 3500);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [isRunning, router]);

  if (!isRunning) return null;

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
