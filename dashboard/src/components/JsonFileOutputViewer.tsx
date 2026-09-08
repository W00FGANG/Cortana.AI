"use client";

import { useState } from "react";
import { Download, Copy, Check, FileCode2, FileJson } from "lucide-react";

interface JsonFileOutputViewerProps {
  outputData: any;
  fileName?: string;
  title?: string;
}

export function JsonFileOutputViewer({
  outputData,
  fileName = "output.json",
  title = "Workflow Output",
}: JsonFileOutputViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!outputData) return null;

  // Format clean JSON string
  let jsonString = "";
  try {
    if (typeof outputData === "string") {
      const trimmed = outputData.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        // If wrapped in our internal format, unwrap clean payload
        if (parsed && typeof parsed === "object" && parsed.type === "email_sent_list" && parsed.sentEmails) {
          jsonString = JSON.stringify(
            parsed.sentEmails.map((e: any) => ({ email: e.email || e.recipientEmail || e })),
            null,
            2
          );
        } else if (parsed && typeof parsed === "object" && parsed.jsonOutput) {
          jsonString = typeof parsed.jsonOutput === "string" 
            ? parsed.jsonOutput 
            : JSON.stringify(parsed.jsonOutput, null, 2);
        } else {
          jsonString = JSON.stringify(parsed, null, 2);
        }
      } else {
        jsonString = JSON.stringify({ message: outputData }, null, 2);
      }
    } else {
      jsonString = JSON.stringify(outputData, null, 2);
    }
  } catch {
    jsonString = String(outputData);
  }

  const lineCount = jsonString.split("\n").length;
  const byteSize = new Blob([jsonString]).size;
  const formattedSize =
    byteSize > 1024 ? `${(byteSize / 1024).toFixed(1)} KB` : `${byteSize} B`;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <FileCode2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                {fileName}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                JSON
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {lineCount} lines • {formattedSize}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Body */}
      <div className="relative bg-slate-950 p-4 sm:p-5 overflow-x-auto max-h-96">
        <pre className="font-mono text-xs sm:text-sm text-emerald-400/90 leading-relaxed">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
