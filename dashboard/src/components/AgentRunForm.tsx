"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, AlertCircle, CheckCircle2, Mail, Users, Upload, RefreshCw } from "lucide-react";

interface AgentRunFormProps {
  agentId: string;
  agentName: string;
  isEmailAgent?: boolean;
  defaultKeywords?: string;
  defaultCategory?: string;
  defaultLanguage?: string;
}

function parseRelaxedJson(raw: string): any {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {}

  let sanitized = text;
  // Quote unquoted URLs like [https://www.zumify.co] or links: https://...
  sanitized = sanitized.replace(/(:\s*|\[\s*)(https?:\/\/[^\s,\]}]+)/gi, '$1"$2"');

  // Quote unquoted object keys (e.g. { email: -> { "email": )
  sanitized = sanitized.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  // Convert single quotes to double quotes
  sanitized = sanitized.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // Remove trailing commas
  sanitized = sanitized.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(sanitized);
  } catch {}

  try {
    const fn = new Function(`return (${sanitized});`);
    return fn();
  } catch (err: any) {
    throw new Error(err.message || "Invalid JSON syntax");
  }
}

export function AgentRunForm({
  agentId,
  agentName,
  isEmailAgent = false,
  defaultKeywords = "Modern Web Architecture & AI Agents",
  defaultCategory = "Technology",
  defaultLanguage = "en",
}: AgentRunFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email agent specific state
  const [emailMode, setEmailMode] = useState<"single" | "upload" | "followup">("single");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [urls, setUrls] = useState("");
  const [extraPoints, setExtraPoints] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; recipients: any[] } | null>(null);
  const [rawPastedJson, setRawPastedJson] = useState("");

  // Article writer state
  const [keywords, setKeywords] = useState(defaultKeywords);
  const [category, setCategory] = useState(defaultCategory);
  const [language, setLanguage] = useState(defaultLanguage);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseRelaxedJson(text);
        const recipients = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.recipients) ? parsed.recipients : [parsed]);
        if (!Array.isArray(recipients) || recipients.length === 0) {
          throw new Error("JSON file must contain an array of recipient objects.");
        }
        setUploadedFile({ name: file.name, recipients });
        setStatusMessage({
          type: "success",
          text: `Successfully loaded ${recipients.length} prospect(s) from ${file.name}`
        });
      } catch (err: any) {
        setUploadedFile(null);
        setStatusMessage({
          type: "error",
          text: `Failed to parse JSON file: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      let requestBody: any = {};

      if (isEmail) {
        if (emailMode === "followup") {
          requestBody = { mode: "followup" };
        } else if (emailMode === "upload") {
          let recipientsToSend = uploadedFile?.recipients;
          if (!recipientsToSend && rawPastedJson.trim()) {
            try {
              const parsed = parseRelaxedJson(rawPastedJson);
              recipientsToSend = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.recipients) ? parsed.recipients : [parsed]);
            } catch (err: any) {
              throw new Error(`Invalid JSON format: ${err.message}`);
            }
          }

          if (!recipientsToSend || recipientsToSend.length === 0) {
            throw new Error("Please upload a .json file or paste a JSON array of prospects.");
          }

          requestBody = { recipients: recipientsToSend };
        } else {
          if (!recipientEmail) {
            throw new Error("Recipient email is required.");
          }
          requestBody = {
            recipientName,
            recipientEmail,
            urls,
            extraPoints,
          };
        }
      } else {
        requestBody = {
          keywords,
          category,
          language,
        };
      }

      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to execute workflow.");
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Execution initiated successfully! Progress streaming below.",
      });

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

  const isEmail = isEmailAgent || agentName.toLowerCase().includes("kainoa");

  const theme = isEmail
    ? {
        border: "border-emerald-200 dark:border-emerald-900/50",
        gradient: "bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900",
        iconBg: "bg-emerald-600",
        focusRing: "focus:border-emerald-500 focus:ring-emerald-500",
        buttonBg: "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      }
    : {
        border: "border-rose-200 dark:border-rose-900/50",
        gradient: "bg-gradient-to-br from-rose-50/50 via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900",
        iconBg: "bg-rose-600",
        focusRing: "focus:border-rose-500 focus:ring-rose-500",
        buttonBg: "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400",
        badgeBg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
      };

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.gradient} p-6 shadow-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${theme.iconBg} text-white shadow-sm shrink-0`}>
            {isEmail ? <Mail className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {isEmail ? "Run Sales Outreach Workflow" : "Run Agent Workflow"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEmail 
                ? "Autonomous prospect research, tailored drafting, and approval tracking"
                : "Autonomous workflow execution with live progress"}
            </p>
          </div>
        </div>

        {isEmail && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setEmailMode("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${emailMode === "single" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <Users className="h-3.5 w-3.5" />
              Single Prospect
            </button>
            <button
              type="button"
              onClick={() => setEmailMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${emailMode === "upload" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <Upload className="h-3.5 w-3.5" />
              JSON Upload
            </button>
            <button
              type="button"
              onClick={() => setEmailMode("followup")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${emailMode === "followup" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Gmail Follow-ups
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {isEmail ? (
          emailMode === "followup" ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                  <RefreshCw className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Automated Gmail Follow-up Scanner
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kainoa scans sent conversations (5–30 days old) with 0 replies.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                When initiated, Kainoa fetches recent outreach threads, filters for recipients who haven&apos;t replied, generates friendly follow-up drafts, and pauses at the <strong>Approval Node</strong>. Each draft appears directly on the <strong>Approvals</strong> page for your review and one-click authorization before sending.
              </p>
            </div>
          ) : emailMode === "single" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recipientName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="recipientEmail" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Prospect Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="recipientEmail"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. jane@islandtech.com"
                    required
                    className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="urls" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Prospect Website / Research URLs <span className="text-[11px] font-normal text-slate-400 normal-case">(Optional - one per line)</span>
                </label>
                <textarea
                  id="urls"
                  rows={2}
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://islandtech.com&#10;https://islandtech.com/about"
                  className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100 font-mono text-xs`}
                  disabled={isLoading}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Kainoa autonomously scrapes and analyzes these links to reference specific details about the recipient.
                </p>
              </div>

              <div>
                <label htmlFor="extraPoints" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Talking Points / Value Proposition <span className="text-[11px] font-normal text-slate-400 normal-case">(Optional)</span>
                </label>
                <textarea
                  id="extraPoints"
                  rows={2}
                  value={extraPoints}
                  onChange={(e) => setExtraPoints(e.target.value)}
                  placeholder="e.g. Mention website redesign, AI workflow automation for Hawaiian small businesses, 10-15 minute quick call"
                  className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* File Upload Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Prospects JSON File (.json)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-lg p-5 text-center bg-white dark:bg-slate-800 transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className={`h-9 w-9 rounded-full ${theme.badgeBg} flex items-center justify-center`}>
                      <Upload className="h-5 w-5" />
                    </div>
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {uploadedFile.recipients.length} prospect(s) loaded. Click to select another file.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          Click to select a JSON file from your computer
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Supports array of objects: name, email, urls, extraPoints
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Or Paste JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="rawJson" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Or Paste JSON Array Directly
                  </label>
                  {rawPastedJson && (
                    <button
                      type="button"
                      onClick={() => setRawPastedJson("")}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  id="rawJson"
                  rows={4}
                  value={rawPastedJson}
                  onChange={(e) => {
                    setRawPastedJson(e.target.value);
                    if (e.target.value) setUploadedFile(null);
                  }}
                  placeholder={`[
  {
    "name": "Jane Doe",
    "email": "jane@islandtech.com",
    "urls": ["https://islandtech.com"],
    "extraPoints": "Workflow automation savings"
  }
]`}
                  className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 font-mono disabled:bg-slate-100`}
                  disabled={isLoading}
                />
              </div>
            </div>
          )
        ) : (
          <>
            <div>
              <label htmlFor="keywords" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Keywords & Topic
              </label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Hawaii Sustainable Tourism, AI Customer Support..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Domain / Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
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
                <label htmlFor="language" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Output Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
                >
                  <option value="English">English</option>
                  <option value="Español">Español</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Hawaiian">Hawaiian (ʻŌlelo Hawaiʻi)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Inline Feedback Alerts */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 text-xs border ${statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
              }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-slate-400" />
            <span>{isEmail ? "Prospect Research & Drafting" : "Autonomous Research & Generation"}</span>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-lg ${theme.buttonBg} px-5 py-2 text-sm font-medium text-white shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>
                  {isEmail && emailMode === "followup"
                    ? "Scanning Gmail threads..."
                    : "Executing Workflow..."}
                </span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>
                  {isEmail
                    ? emailMode === "followup"
                      ? "Run Gmail Follow-up Scan"
                      : "Launch Outreach Workflow"
                    : "Launch Workflow"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
