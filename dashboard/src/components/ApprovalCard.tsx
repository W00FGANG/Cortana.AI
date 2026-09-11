"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ShieldAlert, Mail, Loader2, AlertCircle } from "lucide-react";
import { formatTimeAgo } from "@/lib/agent-ui";
import { approveApproval, rejectApproval } from "@/app/approvals/actions";

interface ApprovalCardProps {
  item: {
    id: string;
    title: string;
    content: string;
    status: string;
    createdAt: Date | string;
    agent: {
      id: string;
      name: string;
      role: string;
      avatar?: string | null;
    };
    task?: {
      id: string;
      title: string;
      status: string;
    } | null;
  };
  onResolved?: (id: string) => void;
}

function cleanApprovalContent(raw: string) {
  return raw.replace(/<!-- (?:n8n_)?approval_metadata:[\s\S]*?-->/g, "").trim();
}

function parseEmailDetails(content: string) {
  const clean = cleanApprovalContent(content);
  const matchTo = clean.match(/^Recipient:\s*([^\n]+)/i);
  const matchSubj = clean.match(/Subject:\s*([^\n]+)/i);
  let body = clean;
  if (matchSubj) {
    const idx = clean.indexOf(matchSubj[0]);
    body = clean.slice(idx + matchSubj[0].length).trim();
  }
  return {
    recipient: matchTo ? matchTo[1].trim() : "",
    subject: matchSubj ? matchSubj[1].trim() : "",
    body: body,
    isEmail: Boolean(matchTo || matchSubj),
  };
}

export function ApprovalCard({ item, onResolved }: ApprovalCardProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailDetails = parseEmailDetails(item.content);
  const cleanContent = cleanApprovalContent(item.content);

  const [subject, setSubject] = useState(emailDetails.subject);
  const [body, setBody] = useState(emailDetails.body);

  const isPending = isApproving || isRejecting;

  if (isResolved) {
    return null;
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setIsApproving(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (emailDetails.isEmail) {
        formData.append("subject", subject);
        formData.append("body", body);
      }

      const res = await approveApproval(item.id, formData);
      if (res && !res.success) {
        throw new Error(res.error || "Failed to approve action");
      }
      setIsResolved(true);
      if (onResolved) onResolved(item.id);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while approving.");
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (isPending) return;

    setIsRejecting(true);
    setErrorMessage(null);

    try {
      const res = await rejectApproval(item.id);
      if (res && !res.success) {
        throw new Error(res.error || "Failed to decline action");
      }
      setIsResolved(true);
      if (onResolved) onResolved(item.id);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while declining.");
      setIsRejecting(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-700/60 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-amber-50/80 dark:bg-amber-950/40 px-6 py-4 border-b border-amber-100 dark:border-amber-800/50 flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          {emailDetails.isEmail ? (
            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {item.agent.name} wants to:
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
            {item.title}
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
          {formatTimeAgo(item.createdAt)}
        </span>
      </div>

      <div className="p-6">
        {/* Associated Task */}
        {item.task && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Associated Task
            </span>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
              {item.task.title}
            </p>
          </div>
        )}

        {/* Email Editing & Preview Form */}
        {emailDetails.isEmail ? (
          <form onSubmit={handleApprove}>
            <div className="space-y-4 mb-6">
              {emailDetails.recipient && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Recipient:
                  </span>
                  <span className="font-medium bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs">
                    {emailDetails.recipient}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isPending}
                  className="w-full text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Outreach Email Message
                </label>
                <textarea
                  name="body"
                  rows={7}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={isPending}
                  className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans disabled:opacity-60"
                />
              </div>
            </div>

            {/* In-flight loader banner */}
            {isPending && (
              <div className="mb-4 p-3 rounded-lg flex items-center gap-2.5 text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {isApproving 
                    ? "Dispatching approval decision & waiting for confirmation..." 
                    : "Recording rejection & waiting for confirmation..."}
                </span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg flex items-start gap-2 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-400 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Approving & sending...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Approve & Send Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                className="ml-auto flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/60 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>Decline</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Content Payload
              </span>
              <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {cleanContent}
                </p>
              </div>
            </div>

            {/* In-flight loader banner */}
            {isPending && (
              <div className="mt-4 p-3 rounded-lg flex items-center gap-2.5 text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {isApproving 
                    ? "Dispatching approval decision & waiting for confirmation..." 
                    : "Recording rejection & waiting for confirmation..."}
                </span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg flex items-start gap-2 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-400 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Approve Action</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                className="ml-auto flex items-center gap-2 rounded-md bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
