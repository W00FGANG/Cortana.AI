import { Filter, Play, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function TasksPage() {
  const tasks = [
    { id: "t1", title: "Follow up with qualified prospects.", agent: "Kai", status: "Pending", priority: "High", scheduled: "Today, 2:00 PM" },
    { id: "t2", title: "Find Hawaii businesses with outdated websites.", agent: "Atlas", status: "Running", priority: "Medium", scheduled: "Today, 10:00 AM" },
    { id: "t3", title: "Generate this week's LinkedIn content ideas.", agent: "Maya", status: "Completed", priority: "Medium", scheduled: "Today, 9:00 AM" },
    { id: "t4", title: "Review upcoming administrative deadlines.", agent: "Nora", status: "Completed", priority: "Low", scheduled: "Today, 8:00 AM" },
    { id: "t5", title: "Send outreach email to John Doe", agent: "Kai", status: "Needs Approval", priority: "High", scheduled: "Today, 11:30 AM" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Running": return <Clock className="h-4 w-4 text-blue-500" />;
      case "Needs Approval": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Running": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Needs Approval": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all AI worker tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Task</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Scheduled</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{task.title}</td>
                  <td className="px-6 py-4 text-slate-600">{task.agent}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${
                      task.priority === 'High' ? 'text-red-600' : task.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{task.scheduled}</td>
                  <td className="px-6 py-4 text-right">
                    {task.status === "Pending" || task.status === "Needs Approval" ? (
                      <button className="inline-flex items-center gap-1.5 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                        <Play className="h-3 w-3 fill-current" />
                        Run Now
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
