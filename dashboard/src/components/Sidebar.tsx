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
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Approvals", href: "/approvals", icon: ShieldCheck },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Operations", href: "/operations", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex shrink-0 items-center px-6 py-6 border-b border-slate-100 dark:border-slate-800">
        {/* Light Mode Logo */}
        <img 
          src="/assets/CovanaLogoDark.jpg" 
          alt="Corvana Logo" 
          className="h-20 w-auto object-contain rounded-sm drop-shadow-sm block dark:hidden" 
        />
        {/* Dark Mode Logo */}
        <img 
          src="/assets/CorvanaLogo.jpg" 
          alt="Corvana Logo" 
          className="h-20 w-auto object-contain rounded-sm drop-shadow-sm hidden dark:block" 
        />
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
                    ? "bg-slate-50 text-blue-600 dark:bg-slate-800/50 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-50"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50 mt-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme</span>
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col items-center justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/60">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Powered by</span>
          <img src="/assets/ZumifyLOGO.png" alt="Zumify Logo" className="h-16 w-auto opacity-70 hover:opacity-100 transition-opacity drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}
