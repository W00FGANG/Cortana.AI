import Link from "next/link";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { workers } from "@/lib/mock-data";

export default function Dashboard() {
  const metrics = [
    { name: "Active Workers", value: "4", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Tasks Today", value: "12", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Completed", value: "8", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Needs Approval", value: "2", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const recentActivity = [
    {
      time: "10:42 AM",
      agent: "Atlas",
      action: "Research Leads completed",
      details: '"Find 10 Hawaii businesses that may need a website redesign."',
    },
    {
      time: "10:31 AM",
      agent: "Kai",
      action: "Sales Outreach started",
      details: '"Prepare personalized outreach for 5 qualified leads."',
    },
    {
      time: "9:45 AM",
      agent: "Maya",
      action: "Marketing completed",
      details: '"Generate this week\'s LinkedIn content ideas."',
    },
    {
      time: "9:00 AM",
      agent: "Nora",
      action: "Administration completed",
      details: '"Review upcoming administrative tasks."',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Good afternoon, Wolfgang
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what your AI workforce is working on today.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${metric.bg}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{metric.name}</p>
                <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
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
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers.map((worker) => (
              <div key={worker.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${worker.color} ${worker.borderColor}`}>
                      <worker.icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {worker.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900">{worker.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{worker.role}</p>
                  
                  <div className="space-y-3 mt-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current Task</p>
                      <p className="text-sm text-slate-700 line-clamp-2">{worker.currentTask}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Completed today</span>
                      <span className="font-medium text-slate-900">{worker.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Next run</span>
                      <span className="font-medium text-slate-900">{worker.nextRun}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border-t border-slate-100 p-3">
                  <Link 
                    href={`/agents/${worker.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                  >
                    Open Worker
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
                  <div className="pl-6 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{activity.agent}</span>
                      <span className="text-xs text-slate-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-slate-600">{activity.action}</p>
                    <p className="text-sm text-slate-500 mt-1 italic">{activity.details}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/operations" className="mt-6 block w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900">
              Show more activity
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
