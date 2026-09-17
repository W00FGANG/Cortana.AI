"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, Loader2, Sparkles, AlertCircle, CheckCircle2, Mail, Users, Upload, 
  RefreshCw, Megaphone, ExternalLink, Share2, Globe, Image as ImageIcon, 
  Video, FileText, ChevronDown, ChevronUp, Hash, SlidersHorizontal, Check 
} from "lucide-react";

interface AgentRunFormProps {
  agentId: string;
  agentName: string;
  isEmailAgent?: boolean;
  isMarketingAgent?: boolean;
  defaultKeywords?: string;
  defaultCategory?: string;
  defaultLanguage?: string;
}

const quickSocialTemplates = [
  {
    label: "Product Announcement",
    text: "Excited to unveil our next-generation autonomous AI agents at Cortana.AI! Delivering 24/7 intelligent workflows, prospect research, and auto-generated content for modern teams.",
    hashtags: "#AI #AutonomousAgents #FutureOfWork #TechInnovation",
  },
  {
    label: "Workflow Tip",
    text: "Manual data entry and delayed prospect follow-ups are costing businesses 15+ hours every week. Here's how autonomous agent orchestration eliminates the bottleneck instantly ⬇️",
    hashtags: "#Automation #Productivity #BusinessGrowth #NoCode",
  },
  {
    label: "Case Study / ROI",
    text: "How a local enterprise cut lead response times from 4 hours to 45 seconds using automated agent pipelines with n8n and Cortana. Full breakdown:",
    hashtags: "#CaseStudy #CustomerSuccess #AIWorkflows #ROI",
  },
];

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
  isMarketingAgent = false,
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

  // Marketing agent (Maya) state
  const [marketingMode, setMarketingMode] = useState<"research" | "publisher">("research");
  const [focusTopic, setFocusTopic] = useState("Hawaii business & AI automation");
  const [targetAudience, setTargetAudience] = useState("Local business owners, entrepreneurs, and service professionals");
  const [additionalContext, setAdditionalContext] = useState("Focus on practical ROI, eliminating repetitive manual admin work, and modernizing traditional workflows");

  // Maya Social Publisher state
  const [postText, setPostText] = useState("");
  const [platforms, setPlatforms] = useState<"both" | "x" | "linkedin">("both");
  const [mediaType, setMediaType] = useState<"NONE" | "IMAGE" | "VIDEO" | "ARTICLE">("NONE");
  const [mediaUrl, setMediaUrl] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [hashtags, setHashtags] = useState("#AI #Automation #Productivity #Agents");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [linkedinVisibility, setLinkedinVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [linkedinPostAs, setLinkedinPostAs] = useState<"person" | "organization">("person");
  const [linkedinOrganizationUrn, setLinkedinOrganizationUrn] = useState("");
  const [xReplySettings, setXReplySettings] = useState<"everyone" | "following" | "mentionedUsers">("everyone");

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
      } else if (isMarketing) {
        if (marketingMode === "publisher") {
          if (!postText.trim()) {
            throw new Error("Post copy/text is required.");
          }
          requestBody = {
            mode: "publisher",
            postText: postText.trim(),
            platforms,
            mediaType,
            mediaUrl: mediaUrl.trim(),
            articleUrl: articleUrl.trim(),
            hashtags: hashtags.trim(),
            dryRun: false,
            linkedinVisibility,
            linkedinPostAs,
            linkedinOrganizationUrn: linkedinOrganizationUrn.trim(),
            xReplySettings,
          };
        } else {
          if (!focusTopic.trim()) {
            throw new Error("Focus topic is required.");
          }
          requestBody = {
            mode: "research",
            focusTopic: focusTopic.trim(),
            targetAudience: targetAudience.trim(),
            additionalContext: additionalContext.trim(),
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
  const isMarketing = isMarketingAgent || agentName.toLowerCase().includes("maya") || agentName.toLowerCase().includes("marketing");

  const theme = isEmail
    ? {
        border: "border-emerald-200 dark:border-emerald-900/50",
        gradient: "bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900",
        iconBg: "bg-emerald-600",
        focusRing: "focus:border-emerald-500 focus:ring-emerald-500",
        buttonBg: "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      }
    : isMarketing
    ? {
        border: "border-purple-200 dark:border-purple-900/50",
        gradient: "bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900",
        iconBg: "bg-purple-600",
        focusRing: "focus:border-purple-500 focus:ring-purple-500",
        buttonBg: "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400",
        badgeBg: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
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
            {isEmail ? <Mail className="h-4 w-4" /> : isMarketing ? (marketingMode === "publisher" ? <Share2 className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />) : <Sparkles className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {isEmail
                ? "Run Sales Outreach Workflow"
                : isMarketing
                ? marketingMode === "publisher"
                  ? "Run Social Media Publisher Workflow"
                  : "Run Social Media Research Workflow"
                : "Run Agent Workflow"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEmail 
                ? "Autonomous prospect research, tailored drafting, and approval tracking"
                : isMarketing
                ? marketingMode === "publisher"
                  ? "Cross-post and publish content directly to X (Twitter) & LinkedIn with rich media"
                  : "Live YouTube Shorts scraping, Google Search Trends, and viral video ideation"
                : "Autonomous workflow execution with live progress"}
            </p>
          </div>
        </div>

        {isMarketing && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMarketingMode("research")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${marketingMode === "research" ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              Social Research
            </button>
            <button
              type="button"
              onClick={() => setMarketingMode("publisher")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${marketingMode === "publisher" ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
            >
              <Share2 className="h-3.5 w-3.5" />
              Social Media Poster
            </button>
          </div>
        )}

        {isEmail && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setEmailMode("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${emailMode === "single" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <Users className="h-3.5 w-3.5" />
              Single Prospect
            </button>
            <button
              type="button"
              onClick={() => setEmailMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${emailMode === "upload" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <Upload className="h-3.5 w-3.5" />
              JSON Upload
            </button>
            <button
              type="button"
              onClick={() => setEmailMode("followup")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${emailMode === "followup" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
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
          )) : isMarketing ? (
            marketingMode === "publisher" ? (
              <div className="space-y-4">
                {/* Quick Templates */}
                <div className="rounded-lg border border-purple-100 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Quick Content Starters
                    </span>
                    <span className="text-[10px] text-slate-400">Click to autofill</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSocialTemplates.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPostText(tpl.text);
                          setHashtags(tpl.hashtags);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-700 dark:hover:text-purple-300 shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{tpl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Platforms */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Platforms <span className="text-purple-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "both", label: "Both X & LinkedIn", icon: Globe },
                      { id: "x", label: "X (Twitter) Only", icon: Share2 },
                      { id: "linkedin", label: "LinkedIn Only", icon: Globe },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPlatforms(item.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          platforms === item.id
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Copy / Content */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="postText" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Post Copy / Content <span className="text-purple-600">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono ${
                        (platforms === "both" || platforms === "x") && postText.length > 280
                          ? "text-rose-600 font-bold dark:text-rose-400"
                          : "text-slate-400"
                      }`}>
                        {postText.length} chars
                        {(platforms === "both" || platforms === "x") && (
                          <span className="ml-1 text-[10px] opacity-80">(X max: 280)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="postText"
                    rows={4}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Write high-impact social copy, insights, product news, or thought leadership..."
                    className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Media Type & Attachment Links */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Media Attachment Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {[
                      { id: "NONE", label: "Text Only", icon: FileText },
                      { id: "IMAGE", label: "Image", icon: ImageIcon },
                      { id: "VIDEO", label: "Video", icon: Video },
                      { id: "ARTICLE", label: "Article Link", icon: ExternalLink },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMediaType(m.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          mediaType === m.id
                            ? "bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-200 border-purple-400 font-semibold"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <m.icon className="h-3.5 w-3.5" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Conditionally reveal URL input for media */}
                  {(mediaType === "IMAGE" || mediaType === "VIDEO") && (
                    <div className="mt-2">
                      <label htmlFor="mediaUrl" className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        {mediaType === "IMAGE" ? "Image Direct URL (.jpg, .png, .webp)" : "Video Direct URL (.mp4, .mov)"}
                      </label>
                      <input
                        type="url"
                        id="mediaUrl"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/asset.jpg"
                        className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1`}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {mediaType === "ARTICLE" && (
                    <div className="mt-2">
                      <label htmlFor="articleUrl" className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Article / Webpage Link URL
                      </label>
                      <input
                        type="url"
                        id="articleUrl"
                        value={articleUrl}
                        onChange={(e) => setArticleUrl(e.target.value)}
                        placeholder="https://cortana.ai/insights/autonomous-agents"
                        className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1`}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                {/* Hashtags / Tags */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="hashtags" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Hashtags & Tags <span className="text-[11px] font-normal text-slate-400 normal-case">(Optional)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Hash className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      id="hashtags"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      placeholder="#AI #Automation #Productivity #HawaiiTech"
                      className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Separate tags by space or comma. Maya formats them cleanly at the end of each platform post.
                  </p>
                </div>

                {/* Advanced Platform Settings Collapsible */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Advanced Platform Rules</span>
                    {showAdvanced ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            LinkedIn Visibility
                          </label>
                          <select
                            value={linkedinVisibility}
                            onChange={(e) => setLinkedinVisibility(e.target.value as any)}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          >
                            <option value="PUBLIC">Public (Anyone on or off LinkedIn)</option>
                            <option value="CONNECTIONS">Connections Only</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            LinkedIn Post As
                          </label>
                          <select
                            value={linkedinPostAs}
                            onChange={(e) => setLinkedinPostAs(e.target.value as any)}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          >
                            <option value="person">Personal Profile</option>
                            <option value="organization">Organization / Company Page</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {linkedinPostAs === "organization" && (
                          <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                              LinkedIn Organization URN (ID)
                            </label>
                            <input
                              type="text"
                              value={linkedinOrganizationUrn}
                              onChange={(e) => setLinkedinOrganizationUrn(e.target.value)}
                              placeholder="e.g. 12345678"
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            X / Twitter Reply Permissions
                          </label>
                          <select
                            value={xReplySettings}
                            onChange={(e) => setXReplySettings(e.target.value as any)}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          >
                            <option value="everyone">Everyone can reply</option>
                            <option value="following">People you follow</option>
                            <option value="mentionedUsers">Only mentioned users</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="focusTopic" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Focus Topic & Niche <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="focusTopic"
                    name="focusTopic"
                    value={focusTopic}
                    onChange={(e) => setFocusTopic(e.target.value)}
                    placeholder="e.g. Hawaii business & AI automation"
                    className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Scrapes YouTube Shorts and Google Search Trends for real view metrics and viral angles.
                  </p>
                </div>

                <div>
                  <label htmlFor="targetAudience" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Audience <span className="text-[11px] font-normal text-slate-400 normal-case">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="targetAudience"
                    name="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Local business owners, entrepreneurs, and service professionals"
                    className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="additionalContext" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Additional Context & Strategic Focus <span className="text-[11px] font-normal text-slate-400 normal-case">(Optional)</span>
                  </label>
                  <textarea
                    id="additionalContext"
                    rows={3}
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="e.g. Focus on practical ROI, eliminating repetitive manual admin work, and modernizing traditional workflows"
                    className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ${theme.focusRing} focus:outline-none focus:ring-1 disabled:bg-slate-100`}
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
              <span>
                {isEmail
                  ? "Prospect Research & Drafting"
                  : isMarketing
                  ? marketingMode === "publisher"
                    ? "Live Social Media Publishing"
                    : "Live Scraped Research & Video Ideation"
                  : "Autonomous Research & Generation"}
              </span>
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
                      : isMarketing
                      ? marketingMode === "publisher"
                        ? "Publishing to platforms..."
                        : "Scraping & Synthesizing Trends..."
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
                      : isMarketing
                      ? marketingMode === "publisher"
                        ? "Publish to Platforms"
                        : "Launch Research Workflow"
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
