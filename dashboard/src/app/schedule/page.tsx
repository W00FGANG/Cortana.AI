import { Edit, Clock, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAgentStyle } from "@/lib/agent-ui";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const agents = await prisma.agent.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage when your AI workers execute automatically.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent) => {
          const style = getAgentStyle(agent.name);
          const Icon = style.icon;
          const scheduleParts = (agent.schedule || "On-demand — Custom").split("—");
          const frequency = scheduleParts[0]?.trim() || "On-demand";
          const time = scheduleParts[1]?.trim() || "Triggered on event";

          return (
            <div key={agent.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
              <div className={`h-2 w-full ${style.accentBg}`}></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${style.color} ${style.borderColor} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <p className="text-xs text-slate-500">{agent.role}</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Frequency</p>
                      <p className="text-sm font-medium text-slate-900">{frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Execution Time</p>
                      <p className="text-sm font-medium text-slate-900">{time}</p>
                    </div>
                  </div>
                </div>
                
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                  <Edit className="h-4 w-4" />
                  Edit Schedule
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
