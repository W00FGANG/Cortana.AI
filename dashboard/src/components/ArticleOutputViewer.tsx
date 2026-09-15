"use client";

import { useState } from "react";
import { 
  Download, Copy, Check, FileText, Code2, Eye, ExternalLink, 
  BookOpen, Clock, User, Calendar, Tag, TrendingUp, Sparkles, 
  Video, Lightbulb, Compass, ArrowRight 
} from "lucide-react";

interface ArticleOutputViewerProps {
  outputData: string | null | undefined;
  defaultTitle?: string;
  agentType?: "article" | "marketing" | "general";
}

function formatArticleObjectToMarkdown(obj: any): string {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return "";

  // If there's an explicit markdown field, use it
  if (obj.markdown && typeof obj.markdown === "string") return obj.markdown;
  if (obj.report && typeof obj.report === "string") return obj.report;

  let md = "";
  if (obj.title) md += `# ${obj.title}\n\n`;
  if (obj.description) md += `*${obj.description}*\n\n`;
  if (obj.image) md += `![${obj.title || 'Featured Image'}](${obj.image})\n\n`;

  if (obj.introduction) {
    md += `${obj.introduction}\n\n`;
  }

  if (Array.isArray(obj.sections)) {
    for (const sec of obj.sections) {
      if (sec.title) md += `## ${sec.title}\n\n`;
      if (sec.image) md += `![${sec.title}](${sec.image})\n\n`;
      if (sec.content) md += `${sec.content}\n\n`;
    }
  }

  const takeawaysContent = obj.takeaways || obj.conclusion;
  if (takeawaysContent) {
    md += `## Key Takeaways & Conclusion\n\n${takeawaysContent}\n\n`;
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

function RichMarkdownRenderer({ content, isMarketing = true }: { content: string; isMarketing?: boolean }) {
  if (!content) return null;
  const lines = content.split('\n');

  // 1. Extract metadata parameter quotes (> Focus Topic, > Target Audience, > Context)
  const metadataParams: { label: string; value: string; icon: any }[] = [];
  const processedLines: string[] = [];
  let inHeaderMetadata = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inHeaderMetadata && trimmed.startsWith('# ')) {
      processedLines.push(line);
      continue;
    }

    if (inHeaderMetadata && trimmed.startsWith('> ')) {
      const quoteText = trimmed.slice(2).trim();
      const colonIdx = quoteText.indexOf(':');
      if (colonIdx > 0) {
        const label = quoteText.slice(0, colonIdx).trim();
        const value = quoteText.slice(colonIdx + 1).trim();
        let icon = Compass;
        const lLower = label.toLowerCase();
        if (lLower.includes('audience')) icon = User;
        if (lLower.includes('context') || lLower.includes('angle') || lLower.includes('directive')) icon = Lightbulb;
        metadataParams.push({ label, value, icon });
        continue;
      }
    }

    if (inHeaderMetadata && (trimmed === '---' || trimmed === '***')) {
      inHeaderMetadata = false;
      continue;
    }

    if (trimmed && !trimmed.startsWith('> ') && !trimmed.startsWith('# ')) {
      inHeaderMetadata = false;
    }

    processedLines.push(line);
  }

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-purple-100/70 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 font-mono text-xs border border-purple-200/80 dark:border-purple-800/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2.5 my-3 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  // Video Suggestion Card accumulator
  let currentVideoCard: {
    title: string;
    items: { label: string; text: string }[];
  } | null = null;

  const flushVideoCard = () => {
    if (currentVideoCard) {
      const card = currentVideoCard;
      currentVideoCard = null;
      elements.push(
        <div
          key={`video-${elements.length}`}
          className="rounded-xl border border-purple-200 dark:border-purple-900/80 bg-slate-50 dark:bg-slate-950 p-5 shadow-xs space-y-3.5 my-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-600 text-white shadow-2xs">
                Video Concept
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {card.title}
              </h3>
            </div>
            <Video className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          </div>

          <div className="space-y-2.5 text-sm text-slate-800 dark:text-slate-200">
            {card.items.map((it, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                {it.label && (
                  <span className="font-bold shrink-0 sm:w-48 text-xs uppercase tracking-wider text-purple-900 dark:text-purple-300">
                    {it.label}:
                  </span>
                )}
                <div className="flex-1 leading-relaxed text-slate-700 dark:text-slate-300">
                  {renderInline(it.text)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      flushVideoCard();
      elements.push(
        <div key={i} className="pb-5 border-b border-slate-200 dark:border-slate-800 space-y-2.5 mt-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Autonomous Market Intelligence Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {renderInline(trimmed.slice(2))}
          </h1>
        </div>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      flushVideoCard();
      const heading = trimmed.slice(3);
      let SectionIcon = TrendingUp;
      const hLower = heading.toLowerCase();
      if (hLower.includes('video') || hLower.includes('hook') || hLower.includes('suggestion')) SectionIcon = Video;
      else if (hLower.includes('trend')) SectionIcon = Sparkles;
      else if (hLower.includes('next') || hLower.includes('action')) SectionIcon = ArrowRight;
      else if (hLower.includes('summary')) SectionIcon = FileText;

      elements.push(
        <div key={i} className="pt-6 pb-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 mt-8 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
            <SectionIcon className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {renderInline(heading)}
          </h2>
        </div>
      );
    } else if (trimmed.startsWith('### Video Suggestion') || (trimmed.startsWith('### ') && trimmed.toLowerCase().includes('video'))) {
      flushList();
      flushVideoCard();
      const rawTitle = trimmed.slice(4).replace(/^Video Suggestion\s*\d*:\s*/i, '');
      currentVideoCard = {
        title: rawTitle,
        items: []
      };
    } else if (currentVideoCard && (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('  - '))) {
      const itemText = trimmed.replace(/^[-*]\s*/, '').replace(/^\s*[-*]\s*/, '');
      const colonIdx = itemText.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        currentVideoCard.items.push({
          label: itemText.slice(0, colonIdx).trim(),
          text: itemText.slice(colonIdx + 1).trim()
        });
      } else {
        currentVideoCard.items.push({
          label: '',
          text: itemText
        });
      }
    } else if (trimmed.startsWith('### ')) {
      flushList();
      flushVideoCard();
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-6 mb-2">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('> ')) {
      flushList();
      flushVideoCard();
      elements.push(
        <blockquote key={i} className="border-l-4 border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 px-4 py-3 my-3 text-sm text-slate-800 dark:text-slate-200 italic rounded-r-xl font-medium">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
    } else if (trimmed === '---' || trimmed === '***') {
      flushList();
      flushVideoCard();
      elements.push(<hr key={i} className="my-8 border-slate-200 dark:border-slate-800" />);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushVideoCard();
      inList = true;
      listItems.push(
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
          <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
        </li>
      );
    } else {
      flushList();
      if (!currentVideoCard) {
        elements.push(
          <p key={i} className="text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed my-2.5 font-normal">
            {renderInline(trimmed)}
          </p>
        );
      }
    }
  }

  flushList();
  flushVideoCard();

  return (
    <div className="space-y-4">
      {metadataParams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {metadataParams.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-purple-200 dark:border-purple-900/80 bg-purple-50/60 dark:bg-slate-950 p-4 shadow-xs space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{p.label}</span>
                </div>
                <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-semibold">
                  {p.value}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-1">{elements}</div>
    </div>
  );
}

export function ArticleOutputViewer({
  outputData,
  defaultTitle = "Generated Output",
  agentType = "article",
}: ArticleOutputViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "markdown" | "json">("preview");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!outputData) return null;

  const isMarketing =
    agentType === "marketing" ||
    defaultTitle.toLowerCase().includes("research") ||
    defaultTitle.toLowerCase().includes("social media");

  let rawParsedObject: any = null;
  let parsedTitle = defaultTitle;
  let parsedSlug = "article";
  let markdownContent = "";
  let structuredJsonObject: Record<string, any> = {};

  try {
    const rawParsed = typeof outputData === "string" ? JSON.parse(outputData) : outputData;
    const parsed = Array.isArray(rawParsed) ? (rawParsed[0] || {}) : rawParsed;
    if (parsed && typeof parsed === "object") {
      // Unwrap clean articleJson if nested in responseData wrapper
      let targetObj: Record<string, any> = parsed;
      if (parsed.articleJson && typeof parsed.articleJson === "object") {
        targetObj = parsed.articleJson;
      } else if (typeof parsed.articleJson === "string") {
        try {
          targetObj = JSON.parse(parsed.articleJson);
        } catch { }
      } else if (parsed.data && typeof parsed.data === "object") {
        if (parsed.data.articleJson && typeof parsed.data.articleJson === "object") {
          targetObj = parsed.data.articleJson;
        } else if (parsed.data.sections) {
          targetObj = parsed.data;
        }
      }

      // Strip telemetry wrapper fields (step, result, nodesExecuted, etc.)
      const {
        step: _step,
        result: _result,
        nodesExecuted: _nodesExecuted,
        generatedAt: _generatedAt,
        articleJson: _articleJson,
        data: _data,
        jsonOutput: _jsonOutput,
        markdown: _markdownField,
        ...cleanSchema
      } = targetObj;

      const finalArticleObj =
        cleanSchema.sections || cleanSchema.sources || cleanSchema.title || cleanSchema.slug
          ? cleanSchema
          : targetObj;

      // Reorder keys to guarantee takeaways is placed after sections and before sources
      const orderedObj: Record<string, any> = {};
      const keyOrder = [
        "slug",
        "title",
        "description",
        "introduction",
        "category",
        "author",
        "publishDate",
        "readingEstimation",
        "color",
        "image",
        "sections",
        "takeaways",
        "sources"
      ];
      for (const k of keyOrder) {
        if (finalArticleObj[k] !== undefined) {
          orderedObj[k] = finalArticleObj[k];
        }
      }
      for (const k of Object.keys(finalArticleObj)) {
        if (!(k in orderedObj)) {
          orderedObj[k] = finalArticleObj[k];
        }
      }

      rawParsedObject = orderedObj;
      parsedTitle = orderedObj.title || parsed.title || orderedObj.slug || defaultTitle;
      parsedSlug = (orderedObj.slug || parsed.slug || parsedTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Preserve clean complete JSON structure
      structuredJsonObject = orderedObj;

      // Generate or extract markdown
      if (parsed.markdown && typeof parsed.markdown === "string") {
        markdownContent = parsed.markdown;
      } else if (targetObj.markdown && typeof targetObj.markdown === "string") {
        markdownContent = targetObj.markdown;
      } else {
        markdownContent = formatArticleObjectToMarkdown(finalArticleObj);
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mt-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
              isMarketing
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isMarketing ? "bg-purple-600" : "bg-emerald-600"}`} />
              {isMarketing ? "Research Report Ready" : "Article Ready"}
            </span>
            {structuredJsonObject.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                <Tag className="h-3 w-3" />
                {structuredJsonObject.category}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {wordCount} words
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xl">
            {parsedTitle}
          </h3>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Markdown */}
          <button
            onClick={() => handleDownload(markdownContent, `${parsedSlug}.md`, "text/markdown;charset=utf-8;")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title={isMarketing ? "Download full research report (.md)" : "Download full Markdown article"}
          >
            <Download className={`h-3.5 w-3.5 ${isMarketing ? "text-purple-600 dark:text-purple-400" : "text-rose-600 dark:text-rose-400"}`} />
            <span>Download .md</span>
          </button>

          {/* Download JSON */}
          {!isMarketing && (
            <button
              onClick={() => handleDownload(jsonString, `${parsedSlug}.json`, "application/json;charset=utf-8;")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Download full structured JSON"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Download .json</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${activeTab === "preview"
                ? isMarketing
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-rose-600 text-rose-600 dark:text-rose-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Formatted View
          </button>

          <button
            onClick={() => setActiveTab("markdown")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${activeTab === "markdown"
                ? isMarketing
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-rose-600 text-rose-600 dark:text-rose-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Raw Markdown (.md)
          </button>

          {!isMarketing && (
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer ${activeTab === "json"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Complete JSON Schema (.json)
            </button>
          )}
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
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900">
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

                {/* Key Takeaways & Conclusion Callout */}
                {(structuredJsonObject.takeaways || structuredJsonObject.conclusion) && (
                  <div className="rounded-xl bg-gradient-to-br from-amber-50/70 to-yellow-50/40 border border-amber-200 p-5 space-y-2 mt-8">
                    <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-amber-900">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      <span>Key Takeaways & Conclusion</span>
                    </div>
                    <div className="text-xs text-amber-950/90 leading-relaxed whitespace-pre-wrap">
                      {structuredJsonObject.takeaways || structuredJsonObject.conclusion}
                    </div>
                  </div>
                )}

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
              <div className="max-w-4xl mx-auto">
                <RichMarkdownRenderer content={markdownContent} isMarketing={isMarketing} />
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
        {!isMarketing && activeTab === "json" && (
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
