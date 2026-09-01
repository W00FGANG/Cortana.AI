import { LineChart, Megaphone, ClipboardList, Search, Bot, BookOpen, LucideIcon } from "lucide-react";

export interface AgentStyle {
  icon: LucideIcon;
  color: string;
  borderColor: string;
  accentBg: string;
}

export function getAgentStyle(nameOrRole: string = ""): AgentStyle {
  const normalized = nameOrRole.toLowerCase();

  if (normalized.includes("harper") || normalized.includes("article") || normalized.includes("writer") || normalized.includes("generator")) {
    return {
      icon: BookOpen,
      color: "bg-rose-50 text-rose-700",
      borderColor: "border-rose-200",
      accentBg: "bg-rose-600",
    };
  }

  if (normalized.includes("kai") || normalized.includes("sales") || normalized.includes("outreach")) {
    return {
      icon: LineChart,
      color: "bg-blue-50 text-blue-700",
      borderColor: "border-blue-200",
      accentBg: "bg-blue-600",
    };
  }

  if (normalized.includes("maya") || normalized.includes("marketing") || normalized.includes("content")) {
    return {
      icon: Megaphone,
      color: "bg-purple-50 text-purple-700",
      borderColor: "border-purple-200",
      accentBg: "bg-purple-600",
    };
  }

  if (normalized.includes("nora") || normalized.includes("admin") || normalized.includes("operations")) {
    return {
      icon: ClipboardList,
      color: "bg-emerald-50 text-emerald-700",
      borderColor: "border-emerald-200",
      accentBg: "bg-emerald-600",
    };
  }

  if (normalized.includes("atlas") || normalized.includes("research") || normalized.includes("intelligence")) {
    return {
      icon: Search,
      color: "bg-amber-50 text-amber-700",
      borderColor: "border-amber-200",
      accentBg: "bg-amber-600",
    };
  }

  return {
    icon: Bot,
    color: "bg-slate-50 text-slate-700",
    borderColor: "border-slate-200",
    accentBg: "bg-slate-900",
  };
}

export function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours < 24) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return `Yesterday, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
