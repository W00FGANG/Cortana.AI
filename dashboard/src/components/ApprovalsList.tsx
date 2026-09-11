"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ApprovalCard } from "@/components/ApprovalCard";

interface ApprovalsListProps {
  initialApprovals: any[];
}

export function ApprovalsList({ initialApprovals }: ApprovalsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialApprovals);

  useEffect(() => {
    setItems(initialApprovals);
  }, [initialApprovals]);

  // Periodic polling every 4s to check for new approvals in background
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const handleResolved = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-sm animate-in fade-in duration-300">
        <ShieldAlert className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All caught up!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          There are no pending actions requiring your approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <ApprovalCard key={item.id} item={item} onResolved={handleResolved} />
      ))}
    </div>
  );
}
