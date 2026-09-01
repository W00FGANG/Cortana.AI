"use client";

import { useState } from "react";
import { Download, Copy, Check, FileText, Code2, Eye, ExternalLink, BookOpen, Clock, User, Calendar, Tag } from "lucide-react";

interface ArticleOutputViewerProps {
  outputData: string | null | undefined;
  defaultTitle?: string;
}

function formatArticleObjectToMarkdown(obj: any): string {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return "";

  // If there's an explicit markdown field, use it
  if (obj.markdown && typeof obj.markdown === "string") return obj.markdown;

  let md = "";
  if (obj.title) md += `# ${obj.title}\n\n`;
  if (obj.description) md += `*${obj.description}*\n\n`;
  if (obj.image) md += `![${obj.title || 'Featured Image'}](${obj.image})\n\n`;
  
  if (obj.introduction) {
    md += `${obj.introduction}\n\n`;
  }
  
  if (obj.takeaways) {
    md += `## Key Takeaways\n\n${obj.takeaways}\n\n`;
  }
  
  if (Array.isArray(obj.sections)) {
    for (const sec of obj.sections) {
      if (sec.title) md += `## ${sec.title}\n\n`;
      if (sec.image) md += `![${sec.title}](${sec.image})\n\n`;
      if (sec.content) md += `${sec.content}\n\n`;
    }
  }
  
  if (Array.isArray(obj.sources) && obj.sources.length > 0) {
    md += `## Authoritative References\n\n`;
    for (const src of obj.sources) {
      if (src.title && src.url) {
        md += `- [${src.title}](${src.url})\n`;
      } else if (src.url) {
        md += `- <${src.url}>\n`;
      }
    }
    md += "\n";
  }

  if (obj.author || obj.publishDate) {
    md += `---\n*Published by ${obj.author || 'Zumify Team'} on ${obj.publishDate || new Date().toLocaleDateString()}*\n`;
  }

  return md.trim();
}

export function ArticleOutputViewer({ outputData, defaultTitle = "Generated Output" }: ArticleOutputViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "markdown" | "json">("preview");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!outputData) return null;

  let rawParsedObject: any = null;
  let parsedTitle = defaultTitle;
  let parsedSlug = "article";
  let markdownContent = "";
  let structuredJsonObject: Record<string, any> = {};

  try {
    const parsed = typeof outputData === "string" ? JSON.parse(outputData) : outputData;
    if (parsed && typeof parsed === "object") {
      rawParsedObject = parsed;
      parsedTitle = parsed.title || parsed.slug || defaultTitle;
      parsedSlug = (parsed.slug || parsedTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      // Preserve complete JSON structure
      structuredJsonObject = parsed;

      // Generate or extract markdown
      if (parsed.markdown && typeof parsed.markdown === "string") {
        markdownContent = parsed.markdown;
      } else {
        markdownContent = formatArticleObjectToMarkdown(parsed);
      }
    } else if (typeof parsed === "string") {
      markdownContent = parsed;
      parsedSlug = defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      structuredJsonObject = {
        title: parsedTitle,
        slug: parsedSlug,
        content: markdownContent,
        createdAt: new Date().toISOString(),
      };
    }
  } catch {
    // If outputData is a plain string/markdown
    markdownContent = outputData;
    parsedSlug = defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Auto-extract title if markdown has a level 1 heading
    const firstHeadingMatch = outputData.match(/^#\s+(.+)$/m);
    if (firstHeadingMatch && firstHeadingMatch[1]) {
      parsedTitle = firstHeadingMatch[1].trim();
      parsedSlug = parsedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    structuredJsonObject = {
      title: parsedTitle,
      slug: parsedSlug,
      content: markdownContent,
      wordCount: markdownContent.split(/\s+/).filter(Boolean).length,
      characterCount: markdownContent.length,
      createdAt: new Date().toISOString(),
    };
  }

  const jsonString = JSON.stringify(structuredJsonObject, null, 2);
  const wordCount = markdownContent.split(/\s+/).filter(Boolean).length;
  const isRichArticle = rawParsedObject && (rawParsedObject.sections || rawParsedObject.introduction);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Article Ready
            </span>
            {structuredJsonObject.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                <Tag className="h-3 w-3" />
                {structuredJsonObject.category}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {wordCount} words
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 truncate max-w-xl">
            {parsedTitle}
          </h3>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Markdown */}
          <button
            onClick={() => handleDownload(markdownContent, `${parsedSlug}.md`, "text/markdown;charset=utf-8;")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer"
            title="Download full Markdown article"
          >
            <Download className="h-3.5 w-3.5 text-rose-600" />
            <span>Download .md</span>
          </button>

          {/* Download JSON */}
          <button
            onClick={() => handleDownload(jsonString, `${parsedSlug}.json`, "application/json;charset=utf-8;")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer"
            title="Download full structured JSON"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Formatted View
          </button>

          <button
            onClick={() => setActiveTab("markdown")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "markdown"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Raw Markdown (.md)
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "json"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Complete JSON Schema (.json)
          </button>
        </div>

        {/* Quick Copy active view */}
        <button
          onClick={() => {
            const copyContent = activeTab === "json" ? jsonString : markdownContent;
            handleCopy(copyContent, activeTab);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          {copiedType === activeTab ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy {activeTab === "json" ? "JSON" : "Markdown"}</span>
            </>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Formatted Rich View */}
        {activeTab === "preview" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {isRichArticle ? (
              <article className="space-y-6">
                {/* Hero Header */}
                <div className="space-y-3 pb-6 border-b border-slate-100">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    {structuredJsonObject.title}
                  </h1>
                  {structuredJsonObject.description && (
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {structuredJsonObject.description}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                    {structuredJsonObject.author && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{structuredJsonObject.author}</span>
                      </div>
                    )}
                    {structuredJsonObject.publishDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{structuredJsonObject.publishDate}</span>
                      </div>
                    )}
                    {structuredJsonObject.readingEstimation && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{structuredJsonObject.readingEstimation} min read</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero Featured Image */}
                {structuredJsonObject.image && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                    <img 
                      src={structuredJsonObject.image} 
                      alt={structuredJsonObject.title} 
                      className="w-full max-h-96 object-cover" 
                      loading="lazy" 
                    />
                  </div>
                )}

                {/* Introduction */}
                {structuredJsonObject.introduction && (
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {structuredJsonObject.introduction}
                  </div>
                )}

                {/* Key Takeaways Callout */}
                {structuredJsonObject.takeaways && (
                  <div className="rounded-xl bg-gradient-to-br from-amber-50/70 to-yellow-50/40 border border-amber-200 p-5 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-amber-900">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      <span>Key Takeaways & Summary</span>
                    </div>
                    <div className="text-xs text-amber-950/90 leading-relaxed whitespace-pre-wrap">
                      {structuredJsonObject.takeaways}
                    </div>
                  </div>
                )}

                {/* Article Sections */}
                {Array.isArray(structuredJsonObject.sections) && structuredJsonObject.sections.map((section: any, idx: number) => (
                  <section key={idx} className="space-y-3 pt-4">
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                      {section.title}
                    </h2>
                    {section.image && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs my-3 bg-slate-100">
                        <img 
                          src={section.image} 
                          alt={section.title} 
                          className="w-full max-h-72 object-cover" 
                          loading="lazy" 
                        />
                      </div>
                    )}
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </section>
                ))}

                {/* Authoritative References */}
                {Array.isArray(structuredJsonObject.sources) && structuredJsonObject.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                      Authoritative References ({structuredJsonObject.sources.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {structuredJsonObject.sources.map((source: any, idx: number) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all text-xs group"
                        >
                          <span className="font-medium text-slate-800 truncate group-hover:text-rose-600">
                            {source.title || source.url}
                          </span>
                          <ExternalLink className="h-3 w-3 text-slate-400 shrink-0 group-hover:text-rose-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ) : (
              <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-sm bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-2xs">
                {markdownContent}
              </div>
            )}
          </div>
        )}

        {/* Markdown Source */}
        {activeTab === "markdown" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>Full Generated Markdown Source</span>
              <span>{markdownContent.split("\n").length} lines</span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono max-h-[600px] overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {markdownContent}
            </pre>
          </div>
        )}

        {/* Complete JSON Source */}
        {activeTab === "json" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>Full Structured Schema JSON</span>
              <span>{jsonString.split("\n").length} lines • {Object.keys(structuredJsonObject).length} top-level fields</span>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono max-h-[600px] overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {jsonString}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
