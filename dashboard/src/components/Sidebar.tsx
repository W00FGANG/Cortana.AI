"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Activity,
  Calendar,
  ShieldCheck,
  Settings,
  Bot
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Workers", href: "/agents", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Operations", href: "/operations", icon: Activity },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Approvals", href: "/approvals", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Bot className="h-5 w-5 text-blue-600" />
          <span className="tracking-tight text-lg">Zumify AI OS</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-6 bg-slate-50 mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
            Z
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Zumify AI OS</p>
            <p className="text-xs text-slate-500">Internal Operations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
