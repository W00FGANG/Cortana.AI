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
import { workers } from "@/lib/mock-data";
import Link from "next/link";

export default function Dashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeWorker = workers[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + workers.length) % workers.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % workers.length);
  };

  // Mock logs for the active agent to show in their control board
  const agentLogs = [
    { time: activeWorker.lastRun, action: "Task Completed", details: activeWorker.currentTask, status: "Success" },
    { time: "Yesterday, 3:00 PM", action: "Scheduled execution", details: "Routine check and synchronization", status: "Success" },
    { time: "Yesterday, 10:00 AM", action: "Data processing", details: "Analyzed 150 items", status: "Success" }
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
          
          {/* Right Column: Telemetry & Control */}
          <div className={`lg:col-span-7 p-6 space-y-8 flex flex-col justify-center transition-colors duration-300 ${activeWorker.theme.panelBg}`}>
            
            {/* Quick Actions */}
            <div className="flex gap-4">
              <button className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${activeWorker.theme.bg} ${activeWorker.theme.hover} px-4 py-3.5 text-sm font-semibold text-white transition-colors shadow-md`}>
                <Play className="h-4 w-4 fill-current" />
                Trigger Execution
              </button>
              <Link 
                href={`/agents/${activeWorker.id}`}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors shadow-sm ${activeWorker.theme.buttonSecondaryBg}`}
              >
                <Activity className="h-4 w-4" />
                View Full Logs
              </Link>
            </div>

            {/* Current State */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 transition-colors duration-300 ${activeWorker.theme.textMuted}`}>
                <Activity className="h-4 w-4" /> Current Activity
              </h3>
              <div className={`rounded-xl border p-5 shadow-sm transition-colors duration-300 ${activeWorker.theme.cardBg} ${activeWorker.theme.cardBorder}`}>
                <p className={`mb-5 text-sm leading-relaxed transition-colors duration-300 ${activeWorker.theme.textBody}`}>
                  {activeWorker.description}
                </p>
                <div className={`flex items-center gap-3 text-sm font-medium p-3 rounded-lg border transition-colors duration-300 ${activeWorker.theme.textHeading} ${activeWorker.theme.cardBg} ${activeWorker.theme.cardBorder}`}>
                  <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${activeWorker.theme.pulse}`} />
                  <span className={`transition-colors duration-300 ${activeWorker.theme.textMuted}`}>Target:</span> 
                  <span className={`font-semibold transition-colors duration-300 ${activeWorker.theme.textHeading}`}>{activeWorker.currentTask}</span>
                </div>
              </div>
            </div>

            {/* Schedule & Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-xl border p-5 shadow-sm transition-colors duration-300 ${activeWorker.theme.cardBg} ${activeWorker.theme.cardBorder}`}>
                <div className={`flex items-center gap-2 mb-3 transition-colors duration-300 ${activeWorker.theme.textMuted}`}>
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
                </div>
                <p className={`font-semibold text-sm transition-colors duration-300 ${activeWorker.theme.textHeading}`}>{activeWorker.schedule}</p>
                <p className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${activeWorker.theme.textMuted}`}>Next: {activeWorker.nextRun}</p>
              </div>
              <div className={`rounded-xl border p-5 shadow-sm transition-colors duration-300 ${activeWorker.theme.cardBg} ${activeWorker.theme.cardBorder}`}>
                <div className={`flex items-center gap-2 mb-3 transition-colors duration-300 ${activeWorker.theme.textMuted}`}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tasks</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${activeWorker.theme.textHeading}`}>{activeWorker.completed}</span>
                  <span className={`text-xs font-medium transition-colors duration-300 ${activeWorker.theme.textMuted}`}>completed today</span>
                </div>
              </div>
            </div>

            {/* Recent Outputs / Log */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 transition-colors duration-300 ${activeWorker.theme.textMuted}`}>
                <Clock className="h-4 w-4" /> Recent Outputs
              </h3>
              <div className="space-y-3">
                {agentLogs.map((log, index) => (
                  <div key={index} className={`flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300 shadow-sm group ${activeWorker.theme.cardBg} ${activeWorker.theme.cardBorder}`}>
                    <div className={`mt-0.5 rounded-full p-1.5 group-hover:scale-110 transition-all duration-300 ${activeWorker.theme.iconBg}`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold transition-colors duration-300 ${activeWorker.theme.textHeading}`}>{log.action}</p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${activeWorker.theme.textBody}`}>{log.details}</p>
                      <p className={`text-[11px] font-medium mt-2 flex items-center gap-1.5 uppercase tracking-wide transition-colors duration-300 ${activeWorker.theme.textMuted}`}>
                        <Clock className="h-3 w-3" />
                        {log.time}
                      </p>
                    </div>
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
