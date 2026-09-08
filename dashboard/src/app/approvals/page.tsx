import { prisma } from "@/lib/prisma";
import { ApprovalsList } from "@/components/ApprovalsList";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const approvals = await prisma.approval.findMany({
    where: {
      status: "Pending",
      agent: {
        name: {
          not: "Harper",
          mode: "insensitive",
        },
      },
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Approvals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and authorize actions pending execution.
          </p>
        </div>
      </header>

      <ApprovalsList initialApprovals={approvals} />
    </div>
  );
}

