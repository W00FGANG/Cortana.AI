import { Check, X, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTimeAgo } from "@/lib/agent-ui";
import { approveApproval, rejectApproval } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const approvals = await prisma.approval.findMany({
    where: {
      status: "Pending",
    },
    include: {
      agent: true,
      task: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and authorize actions pending execution.
          </p>
        </div>
      </header>

      {approvals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1">There are no pending actions requiring your approval.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {approvals.map((item) => (
            <div key={item.id} className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-slate-900">{item.agent.name} wants to:</span>
                  <span className="font-medium text-slate-700">{item.title}</span>
                </div>
                <span className="text-xs text-slate-500">{formatTimeAgo(item.createdAt)}</span>
              </div>
              
              <div className="p-6">
                {item.task && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Associated Task</span>
                    <p className="text-sm font-medium text-slate-900 mt-1">{item.task.title}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Content Payload</span>
                  <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">{item.content}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-3">
                  <form action={approveApproval.bind(null, item.id)}>
                    <button 
                      type="submit"
                      className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Approve Action
                    </button>
                  </form>
                  <form action={rejectApproval.bind(null, item.id)} className="ml-auto">
                    <button 
                      type="submit"
                      className="flex items-center gap-2 rounded-md bg-white border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
