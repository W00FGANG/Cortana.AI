import { Check, X, Edit, ShieldAlert } from "lucide-react";

export default function ApprovalsPage() {
  const approvals = [
    {
      id: "app_1",
      agent: "Kai",
      task: "Send follow-up email",
      recipient: "john.doe@example.com",
      content: "Hi John,\n\nI noticed your company's website hasn't been updated recently. At Zumify, we specialize in modernizing digital experiences. Would you be open to a quick 10-minute chat next week to see if there's a fit?\n\nBest,\nKai",
      time: "10 mins ago",
    },
    {
      id: "app_2",
      agent: "Maya",
      task: "Publish LinkedIn Post",
      recipient: "Zumify LLC Company Page",
      content: "Is your agency leveraging AI to automate daily operations? Discover how the new Zumify AI OS is helping small businesses in Hawaii scale effortlessly. #AI #Automation #HawaiiTech",
      time: "1 hour ago",
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and authorize actions pending execution.</p>
        </div>
      </header>

      {approvals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1">There are no pending actions requiring your approval.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {approvals.map((item) => (
            <div key={item.id} className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-amber-50/50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold text-slate-900">{item.agent} wants to:</span>
                  <span className="font-medium text-slate-700">{item.task}</span>
                </div>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</span>
                  <p className="text-sm font-medium text-slate-900 mt-1">{item.recipient}</p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Content</span>
                  <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{item.content}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-3">
                  <button className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm">
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="flex items-center gap-2 rounded-md bg-white border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm ml-auto">
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
