"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface AgentRunFormProps {
  agentId: string;
  agentName: string;
  defaultKeywords?: string;
  defaultCategory?: string;
  defaultLanguage?: string;
}

export function AgentRunForm({
  agentId,
  agentName,
  defaultKeywords = "AI Automation for Local Business, High ROI AI workflows",
  defaultCategory = "AI",
  defaultLanguage = "English",
}: AgentRunFormProps) {
  const router = useRouter();
  const [keywords, setKeywords] = useState(defaultKeywords);
  const [category, setCategory] = useState(defaultCategory);
  const [language, setLanguage] = useState(defaultLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          keywords,
          category,
          language,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to execute workflow.");
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Execution completed successfully!",
      });

      // Smoothly revalidate server component data without full-page refresh
      router.refresh();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An error occurred while running the workflow.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-orange-50/30 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Run Agent Workflow</h2>
            <p className="text-xs text-slate-500">Autonomous workflow execution with live progress</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label htmlFor="keywords" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Target Keywords & Topic
          </label>
          <input
            type="text"
            id="keywords"
            name="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. Hawaii Sustainable Tourism, AI Customer Support..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Domain / Category
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="AI">AI & Machine Learning</option>
              <option value="Hawaii Technology">Hawaii Technology</option>
              <option value="Software Development">Software Development</option>
              <option value="Web Design">Web Design</option>
              <option value="SEO Ranking">SEO Ranking</option>
              <option value="Marketing/Advertising">Marketing & Advertising</option>
              <option value="Business Positioning">Business Positioning</option>
              <option value="Growth & Strategy">Growth & Strategy</option>
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Output Language
            </label>
            <select
              id="language"
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Japanese">Japanese</option>
              <option value="Hawaiian">Hawaiian (ʻŌlelo Hawaiʻi)</option>
            </select>
          </div>
        </div>

        {/* Inline Feedback Alerts */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 text-xs border ${statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 text-slate-400" />
            <span>Autonomous Research & Generation</span>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-rose-400 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Executing Workflow...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Launch Workflow</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
