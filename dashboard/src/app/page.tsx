"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Calendar,
  Settings
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAgentStyle, formatTimeAgo } from "@/lib/agent-ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // 1. Fetch live metrics from Supabase
  const [
    activeAgentsCount,
    totalTasksCount,
    completedTasksCount,
    pendingApprovalsCount,
    agents,
    recentActivities
  ] = await Promise.all([
    prisma.agent.count({ where: { status: "Active" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "Completed" } }),
    prisma.approval.count({ where: { status: "Pending" } }),
    prisma.agent.findMany({
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.activity.findMany({
      include: { agent: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const metrics = [
    { name: "Active Workers", value: activeAgentsCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Tasks", value: totalTasksCount.toString(), icon: Clock, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Completed", value: completedTasksCount.toString(), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Needs Approval", value: pendingApprovalsCount.toString(), icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Agent Control Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor and control your autonomous workforce.
          </p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className={`relative rounded-2xl border border-transparent shadow-xl overflow-hidden transition-colors duration-300 ${activeWorker.theme.containerBg}`}>
        
        {/* Navigation Bar */}
        <div className={`flex items-center justify-between border-b p-4 transition-colors duration-300 ${activeWorker.theme.navBg}`}>
          <button 
            onClick={handlePrev}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors text-inherit shadow-sm border border-transparent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <span className={`font-semibold text-lg transition-colors duration-300 ${activeWorker.theme.navText}`}>{activeWorker.name}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeWorker.status}
            </span>
          </div>
          
          <button 
            onClick={handleNext}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors text-inherit shadow-sm border border-transparent"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Control Board Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Column: Visuals */}
          <div className="lg:col-span-5 relative bg-slate-100 dark:bg-slate-950 min-h-[450px] border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            {/* Body Image Background */}
            {activeWorker.bodyImage && (
              <div className="absolute inset-0">
                <img 
                  src={activeWorker.bodyImage} 
                  alt={`${activeWorker.name} body`} 
                  className="w-full h-full object-cover object-top opacity-90"
                />
                {/* Gradient overlay for text readability at the bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90" />
              </div>
            )}
            
            <div className="relative z-10 p-6 flex justify-between items-start">
              {/* Profile Badge */}
              <div className="flex flex-col items-center">
                <div className={`flex h-20 w-20 overflow-hidden items-center justify-center rounded-xl border-2 shadow-lg ${activeWorker.color} ${activeWorker.borderColor} bg-white dark:bg-slate-800`}>
                  {activeWorker.avatar ? (
                    <img src={activeWorker.avatar} alt={activeWorker.name} className="h-full w-full object-cover" />
                  ) : (
                    <activeWorker.icon className="h-10 w-10" />
                  )}
                </div>
              </div>
              
              <Link 
                href={`/agents/${activeWorker.id}`}
                className="flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 text-sm font-medium text-white transition-colors border border-white/20 shadow-sm"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
            
            <div className="relative z-10 p-6">
              <h2 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">{activeWorker.name}</h2>
              <p className="text-slate-200 font-medium mb-5 text-lg drop-shadow-sm">{activeWorker.role}</p>
              
              {/* Capabilities Tags */}
              <div className="flex flex-wrap gap-2">
                {activeWorker.capabilities.map((cap, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/40 text-white backdrop-blur-sm border border-white/10 shadow-sm">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Workers Section (2/3 width on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">AI Workforce</h2>
            <Link href="/agents" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all ({agents.length})
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const style = getAgentStyle(agent.name);
              const Icon = style.icon;
              const currentTask = agent.tasks.find(t => t.status === "Running" || t.status === "Pending") || agent.tasks[0];
              const completedCount = agent.tasks.filter(t => t.status === "Completed").length;

              return (
                <div key={agent.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${style.color} ${style.borderColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {agent.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{agent.role}</p>
                    
                    <div className="space-y-3 mt-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {currentTask ? currentTask.title : "No active task assigned"}
                        </p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Completed tasks</span>
                        <span className="font-medium text-slate-900">{completedCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Schedule</span>
                        <span className="font-medium text-slate-900">{agent.schedule || "On-demand"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-100 p-3">
                    <Link 
                      href={`/agents/${agent.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                      Open Worker
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed (1/3 width on lg) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <Link href="/operations" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View log
            </Link>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
                  <div className="pl-6 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{activity.agent.name}</span>
                      <span className="text-xs text-slate-500">{formatTimeAgo(activity.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600">{activity.action}</p>
                    {activity.description && (
                      <p className="text-sm text-slate-500 mt-1 italic">"{activity.description}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Carousel Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {workers.map((worker, index) => (
          <button
            key={worker.id}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex 
                ? `w-10 ${worker.theme.dot}` 
                : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
            }`}
            aria-label={`Go to ${worker.name}`}
          />
        ))}
      </div>
    </div>
  );
}
