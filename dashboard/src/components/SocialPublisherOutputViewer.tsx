"use client";

import { useState } from "react";
import { 
  Download, Copy, Check, ExternalLink, Share2, Globe, FileCode2, 
  Sparkles, CheckCircle2, AlertTriangle, XCircle, Clock, Hash,
  MessageCircle, Heart, Repeat, Image as ImageIcon, Video, Link2
} from "lucide-react";

interface SocialPublisherOutputViewerProps {
  outputData: string | object | null | undefined;
  defaultTitle?: string;
}

export function SocialPublisherOutputViewer({
  outputData,
  defaultTitle = "Social Media Publishing Receipt",
}: SocialPublisherOutputViewerProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "json">("preview");

  if (!outputData) return null;

  let parsed: any = null;
  try {
    if (typeof outputData === "string") {
      const trimmed = outputData.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      }
    } else if (typeof outputData === "object") {
      parsed = outputData;
    }
  } catch {
    return null;
  }

  // Verify that this is indeed a Social Media Publisher output
  if (!parsed || (!parsed.platforms && !parsed.post_summary && !parsed.status)) {
    return null;
  }

  const isOverallSuccess = parsed.status === "success" || parsed.status === "success (simulation)";
  const isPartialSuccess = parsed.status === "partial_success";
  const isFailed = parsed.status === "failed";

  const xData = parsed.platforms?.x;
  const liData = parsed.platforms?.linkedin;
  const summary = parsed.post_summary || {};
  const message = parsed.message || "Social media publishing completed.";
  const postText = summary.text || xData?.text || liData?.text || "";
  const hashtags = Array.isArray(summary.hashtags) ? summary.hashtags : [];
  const mediaType = summary.media_type || (summary.media_url ? "IMAGE" : "NONE");
  const mediaUrl = summary.media_url || null;
  const articleUrl = summary.article_url || null;

  const jsonString = JSON.stringify(parsed, null, 2);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-publish-receipt-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTextWithHashtags = (rawText: string) => {
    if (!rawText) return null;
    const parts = rawText.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("#")) {
        return (
          <span key={idx} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Status Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
              Social Post Published
            </span>

            {/* Overall Status Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
              isOverallSuccess
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : isPartialSuccess
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800"
            }`}>
              {isOverallSuccess ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              ) : isPartialSuccess ? (
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              ) : (
                <XCircle className="h-3 w-3 text-rose-600" />
              )}
              {isOverallSuccess ? "Success" : isPartialSuccess ? "Partial" : "Failed"}
            </span>

            {/* Platform indicators */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Target:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {xData?.attempted && liData?.attempted
                  ? "X & LinkedIn"
                  : xData?.attempted
                  ? "X (Twitter)"
                  : liData?.attempted
                  ? "LinkedIn"
                  : "All"}
              </span>
            </div>
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xl">
            {defaultTitle}
          </h3>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Post Copy */}
          <button
            onClick={() => handleCopy(postText, "copy")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Copy post copy to clipboard"
          >
            {copiedType === "copy" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy Post</span>
              </>
            )}
          </button>

          {/* Download JSON Receipt */}
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Download full execution receipt (.json)"
          >
            <Download className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Receipt (.json)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Platform Previews
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "json"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            JSON Diagnostics
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {activeTab === "preview" ? (
          <div className="space-y-6">
            {/* n8n Status Banner */}
            <div className="rounded-xl border border-purple-100 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/60 to-indigo-50/30 dark:from-purple-950/30 dark:to-indigo-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                    Execution Diagnostic Summary
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* X / Twitter Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden flex flex-col">
                {/* Platform Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                      𝕏
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        X / Twitter Post
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        {xData?.attempted ? "Published Tweet" : "Skipped"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {xData?.attempted ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        xData.success 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}>
                        {xData.success ? "Live" : "Failed"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Not Targeted</span>
                    )}
                  </div>
                </div>

                {/* Tweet Body Preview */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <img 
                      src="/assets/MayaProfile.jpg" 
                      alt="Maya" 
                      className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Maya</span>
                        <span className="text-xs text-slate-500">@ZumifyMaya</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">Just now</span>
                      </div>

                      <div className="mt-2 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {renderTextWithHashtags(xData?.text || (postText + (hashtags.length ? `\n\n${hashtags.join(" ")}` : "")))}
                      </div>

                      {/* Media Link / Image Preview if available */}
                      {mediaUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <img src={mediaUrl} alt="Attached media" className="object-cover max-h-48 w-full" />
                        </div>
                      )}

                      {articleUrl && (
                        <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Link2 className="h-4 w-4 text-purple-600 shrink-0" />
                            <span className="text-xs font-mono text-purple-600 dark:text-purple-400 truncate">{articleUrl}</span>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </div>
                      )}

                      {/* Tweet Simulated Engagement Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-slate-400 text-xs">
                        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> 0</span>
                        <span className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /> 0</span>
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 0</span>
                        <span className="text-[10px] font-mono">{xData?.char_count || postText.length} chars</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tweet Receipt Link Footer */}
                {xData?.tweet_url && (
                  <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 truncate">
                      ID: {xData.tweet_id || "N/A"}
                    </span>
                    <a
                      href={xData.tweet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <span>Open Tweet on X</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* LinkedIn Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden flex flex-col">
                {/* Platform Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-sm bg-[#0077B5] text-white flex items-center justify-center font-bold text-xs">
                      in
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        LinkedIn Post
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        {liData?.attempted ? "Live Post" : "Skipped"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {liData?.attempted ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        liData.success 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}>
                        {liData.success ? "Live" : "Failed"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Not Targeted</span>
                    )}
                  </div>
                </div>

                {/* LinkedIn Body Preview */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <img 
                      src="/assets/MayaProfile.jpg" 
                      alt="Maya" 
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Maya
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Creative Marketing Agent • Zumify LLC
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            <span>Just now</span>
                            <span>•</span>
                            <Globe className="h-2.5 w-2.5" />
                            <span>{liData?.visibility || "Public"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {renderTextWithHashtags(liData?.text || (postText + (hashtags.length ? `\n\n${hashtags.join(" ")}` : "")))}
                      </div>

                      {/* Media Link / Image Preview if available */}
                      {mediaUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <img src={mediaUrl} alt="Attached media" className="object-cover max-h-48 w-full" />
                        </div>
                      )}

                      {articleUrl && (
                        <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Link2 className="h-4 w-4 text-[#0077B5] shrink-0" />
                            <span className="text-xs font-mono text-[#0077B5] truncate">{articleUrl}</span>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* LinkedIn Receipt Link Footer */}
                {liData?.post_url && (
                  <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 truncate">
                      URN: {liData.post_urn ? liData.post_urn.slice(0, 24) + "..." : "N/A"}
                    </span>
                    <a
                      href={liData.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0077B5] hover:underline"
                    >
                      <span>Open on LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* JSON Tab */
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Full Execution Receipt Payload (n8n Webhook Output)
              </span>
              <button
                onClick={() => handleCopy(jsonString, "json")}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
              >
                {copiedType === "json" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto border border-slate-800 max-h-[450px]">
              {jsonString}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
