import { Filter, Search } from "lucide-react";

export default function OperationsPage() {
  const activityLog = [
    { id: 1, agent: "Kainoa", action: "Started sales research task", timestamp: "10:45 AM", status: "Running" },
    { id: 2, agent: "Kent", action: "Discovered 8 potential prospects", timestamp: "10:42 AM", status: "Success" },
    { id: 3, agent: "Maya", action: "Completed marketing research", timestamp: "9:45 AM", status: "Success" },
    { id: 4, agent: "Nora", action: "Created an administrative reminder", timestamp: "9:00 AM", status: "Success" },
    { id: 5, agent: "Kainoa", action: "Failed to connect to CRM API", timestamp: "Yesterday, 4:30 PM", status: "Failed" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Global activity log for all AI workers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="bg-white dark:bg-slate-900 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activityLog.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{log.agent}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{log.action}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                      log.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                      log.status === 'Failed' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' :
                      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                    }`}>
                      {log.status}
                    </span>
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
