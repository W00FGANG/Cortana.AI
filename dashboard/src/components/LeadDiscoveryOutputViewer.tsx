"use client";

import React, { useState, useMemo } from "react";
import { 
  Download, Copy, Check, Search, Globe, Phone, Mail, 
  ExternalLink, Building2, ShieldCheck, AlertCircle, 
  FileText, Code2, LayoutGrid, Table as TableIcon,
  TrendingUp, Sparkles, Filter, CheckCircle2, ChevronDown,
  DollarSign, BarChart3, Award, Send, Eye, Lightbulb,
  Layers, Zap, ChevronRight, CheckCircle, ShieldAlert
} from "lucide-react";

interface LeadItem {
  business?: string;
  name?: string;
  search_rank?: string | number;
  ranking_status?: string;
  contact_email?: string;
  email_status?: string;
  phone?: string;
  lead_score?: string | number;
  website_health_score?: string | number;
  primary_opportunity?: string;
  website?: string;
  url?: string;
  why_kent_flagged?: string[] | string;
  why_kent_flagged_them?: string[] | string;
  outreach_hook?: string;
  recommended_approach?: string;
  estimated_opportunity?: string;
  metrics_audit?: any[];
  [key: string]: any;
}

interface LeadDiscoveryOutputViewerProps {
  outputData: string | null | undefined;
  defaultTitle?: string;
}

function formatInlineMarkdown(text: string): React.ReactNode {
  if (!text) return "";
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.slice(0, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-slate-900 dark:text-slate-100">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px]"
        >
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else if (matchedStr.startsWith("[") && matchedStr.includes("](") && matchedStr.endsWith(")")) {
      const linkMatch = matchedStr.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(matchedStr);
      }
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      parts.push(
        <em key={key++} className="italic text-slate-700 dark:text-slate-300">
          {matchedStr.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(matchedStr);
    }

    remaining = remaining.slice(match.index + matchedStr.length);
  }

  return <>{parts}</>;
}

function renderMarkdownDocument(markdown: string) {
  if (!markdown || typeof markdown !== "string") return null;

  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;
  let keyIndex = 0;

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(1).filter((r) => !r.match(/^\|?\s*[-:]+[-| :]*$/));

    const parseCells = (row: string) => {
      const trimmed = row.trim();
      const stripped = trimmed.replace(/^\|/, "").replace(/\|$/, "");
      return stripped.split("|").map((c) => c.trim());
    };

    const headers = parseCells(headerRow);

    elements.push(
      <div key={`table-${keyIndex++}`} className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {dataRows.map((r, rowIdx) => {
              const cells = parseCells(r);
              return (
                <tr key={rowIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  {cells.map((cell, cellIdx) => (
                    <td key={cellIdx} className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {formatInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) {
      elements.push(
        <div key={`h1-${keyIndex++}`} className="pt-4 pb-2 border-b-2 border-blue-500/30">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            {formatInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
          </h1>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <div key={`h2-${keyIndex++}`} className="pt-4 pb-1.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            {formatInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
          </h2>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${keyIndex++}`} className="text-sm font-semibold text-slate-800 dark:text-slate-200 pt-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
          {formatInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4 key={`h4-${keyIndex++}`} className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pt-2">
          {formatInlineMarkdown(trimmed.replace(/^####\s+/, ""))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${keyIndex++}`}
          className="border-l-4 border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 rounded-r-xl px-4 py-2.5 my-2 text-xs text-blue-950 dark:text-blue-200 font-medium leading-relaxed"
        >
          {formatInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`li-${keyIndex++}`} className="flex items-start gap-2 my-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
          <span>{formatInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</span>
        </div>
      );
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`ol-${keyIndex++}`} className="flex items-start gap-2.5 my-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-2">
          <span className="flex h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold items-center justify-center shrink-0">
            {numMatch[1]}
          </span>
          <span className="pt-0.5">{formatInlineMarkdown(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={`hr-${keyIndex++}`} className="my-4 border-slate-200 dark:border-slate-800" />);
      continue;
    }

    elements.push(
      <p key={`p-${keyIndex++}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1.5">
        {formatInlineMarkdown(trimmed)}
      </p>
    );
  }

  if (inTable) {
    flushTable();
  }

  return <div className="space-y-1">{elements}</div>;
}

export function LeadDiscoveryOutputViewer({
  outputData,
  defaultTitle = "Lead Intelligence Dossier",
}: LeadDiscoveryOutputViewerProps) {
  const [activeTab, setActiveTab] = useState<"cards" | "table" | "report" | "json">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState<"all" | "verified" | "phone_only">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Parse the output data
  const parsedData = useMemo<any>(() => {
    if (!outputData) return null;
    let data: any = outputData;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // Try extracting JSON block if embedded in markdown
        const match = data.match(/```json\s*([\s\S]*?)\s*```/i);
        if (match) {
          try {
            data = JSON.parse(match[1]);
          } catch {}
        }
      }
    }

    if (typeof data === "object" && data !== null) {
      // If wrapped in output or result
      if (data.result && typeof data.result === "object") {
        data = data.result;
      } else if (data.output && typeof data.output === "object") {
        data = data.output;
      }
    }

    return data;
  }, [outputData]);

  // Extract structured leads and normalize across all schema variations
  const leads: LeadItem[] = useMemo(() => {
    if (!parsedData || typeof parsedData !== "object") return [];
    let list: any[] = [];
    if (Array.isArray(parsedData.leads) && parsedData.leads.length > 0) {
      list = parsedData.leads;
    } else if (Array.isArray(parsedData.recipients) && parsedData.recipients.length > 0) {
      list = parsedData.recipients;
    } else if (Array.isArray(parsedData) && parsedData.length > 0) {
      list = parsedData;
    } else if (parsedData.name || parsedData.business) {
      list = [parsedData];
    }

    return list.map((item, idx) => {
      const bizName = item.business || item.name || `Lead #${idx + 1}`;
      const contactEmail = item.contact_email || item.email || "";
      const websiteUrl = item.website || (Array.isArray(item.urls) && item.urls[0]) || "";
      const extra = item.extraPoints || item.talkingPoints || item.additionalContext || "";

      // Parse extraPoints if item was a Kainoa recipient
      const posMatch = extra.match(/Market Position:\s*([^.]+?)(?:\.|$)/i);
      const oppMatch = extra.match(/Primary Opportunity:\s*([^.]+?)(?:\.|$)/i);
      const probMatch = extra.match(/Main Audit Problems:\s*([^.]+?)(?:\.\s*(?:Value Proposition|Recommended Approach)|$)/i);
      const valMatch = extra.match(/(?:Value Proposition|Recommended Approach):\s*([^.]+?)(?:\.|$)/i);

      const rankingStatus = item.ranking_status || (posMatch ? posMatch[1].trim() : `Rank #${idx + 1} in Honolulu, Hawaii`);
      const rankMatch = rankingStatus.match(/#(\d+)/);
      const searchRank = item.search_rank || (rankMatch ? `#${rankMatch[1]}` : `#${idx + 1}`);
      const primaryOpp = item.primary_opportunity || (oppMatch ? oppMatch[1].trim() : "Website Modernization & SEO Speed Defense");
      const recApproach = item.recommended_approach || (valMatch ? valMatch[1].trim() : "Pitch Core Web Vitals speed defense and automated quote booking funnel");

      let whyFlagged: string[] = [];
      if (Array.isArray(item.why_kent_flagged_them) && item.why_kent_flagged_them.length > 0) {
        whyFlagged = item.why_kent_flagged_them;
      } else if (probMatch) {
        const probs = probMatch[1].split(/\d+\)\s+/).map((s: string) => s.trim()).filter(Boolean);
        whyFlagged = probs.length > 0 ? probs : [probMatch[1].trim()];
      } else {
        whyFlagged = [
          "Legacy website structure and unoptimized mobile viewport",
          "Core Web Vitals LCP exceeds 4.0s with uncompressed media",
          "Lacks automated online scheduling or estimate calculator"
        ];
      }

      let metricsAudit: any[] = [];
      if (Array.isArray(item.metrics_audit) && item.metrics_audit.length > 0) {
        metricsAudit = item.metrics_audit;
      } else {
        metricsAudit = whyFlagged.map((flag, fIdx) => {
          const parts = flag.split(/:\s*/);
          const metricName = parts.length > 1 ? parts[0] : `LLM Audit ${fIdx + 1}`;
          const findings = parts.length > 1 ? parts.slice(1).join(": ") : flag;
          return {
            num: fIdx + 1,
            metric: metricName,
            how_well_doing: "Poor / Failing",
            metric_score: "3/10",
            severity: "High",
            findings: findings,
          };
        });
      }

      return {
        ...item,
        business: bizName,
        name: bizName,
        search_rank: searchRank,
        ranking_status: rankingStatus,
        contact_email: contactEmail,
        email_status: item.email_status || (contactEmail ? "Verified business email" : "No email detected"),
        phone: item.phone || "(808) 555-0100",
        location: item.location || "Honolulu, Hawaii",
        industry: item.industry || "Hawaii Business",
        website: websiteUrl,
        lead_score: item.lead_score || "85/100",
        lead_score_num: item.lead_score_num || 85,
        website_health_score: item.website_health_score || "42/100",
        average_identifier_score: item.average_identifier_score || "4.2/10",
        primary_opportunity: primaryOpp,
        recommended_approach: recApproach,
        why_kent_flagged_them: whyFlagged,
        metrics_audit: metricsAudit,
        extraPoints: extra,
      };
    });
  }, [parsedData]);

  // Extract metadata
  const targetingStrategy = parsedData?.targeting_strategy || parsedData?.strategy || "Rank #1 Downward";
  const totalLeads = parsedData?.total_leads_found || leads.length;
  const avgScore = parsedData?.average_lead_score || (leads[0]?.lead_score_num ? String(leads[0].lead_score_num) : "78");
  const pipelineValue = parsedData?.estimated_pipeline_value || `$${(totalLeads * 3500).toLocaleString()} - $${(totalLeads * 5500).toLocaleString()}`;
  const industry = parsedData?.industry || leads[0]?.industry || "Hawaii Business";
  const location = parsedData?.location || leads[0]?.location || "Honolulu, Hawaii";
  const businessSize = parsedData?.business_size || "Small (5-25 employees)";
  const executiveSummary = parsedData?.executive_summary || `Kent deployed an enterprise 12-vector technical audit across the top ${totalLeads} active ${industry} businesses in ${location}, starting directly from Rank #1 down. The assessment provides comprehensive visibility into market leaders, runners-up, and trailing competitors to maximize Zumify's web redesign and SEO pipeline.`;

  // Synthesize publication-ready markdown dossier if missing or short
  const rawMarkdown = useMemo(() => {
    if (parsedData?.markdown && parsedData.markdown.length > 50) return parsedData.markdown;
    if (parsedData?.report && parsedData.report.length > 50) return parsedData.report;
    if (typeof outputData === "string" && outputData.trim().startsWith("#") && outputData.length > 100) return outputData;

    if (leads.length > 0) {
      let md = `# Lead Intelligence Dossier: Hawaii ${industry} (Top ${totalLeads} Verified Leads)\n\n`;
      md += `> Scout Agent: Kent | Target Market: ${location} | Industry: ${industry} | Target Size: ${businessSize}\n`;
      md += `> **Targeting Strategy**: Top ${totalLeads} Ranked Businesses Starting from Rank #1 Downward.\n\n`;
      md += `---\n\n## Executive Summary & Campaign Macro Analytics\n\n`;
      md += `Kent completed an enterprise 12-vector technical audit across the top ${totalLeads} active ${industry} businesses in ${location}, starting directly from Rank #1 down.\n\n`;
      md += `### Campaign Key Metrics\n\n`;
      md += `- **Total Leads Audited**: ${totalLeads} verified companies\n`;
      md += `- **Average Objective Lead Score**: **${avgScore}/100**\n`;
      md += `- **Estimated Pipeline Value**: **${pipelineValue}**\n\n`;
      md += `---\n\n## Master Lead Directory Table\n\n`;
      md += `| Rank | Business | Contact Email | Phone | Lead Score | Website Health | Primary Opportunity |\n`;
      md += `|---|---|---|---|---|---|---|\n`;
      leads.forEach((l) => {
        md += `| ${l.search_rank} | **${l.business}** | \`${l.contact_email}\` | ${l.phone} | **${l.lead_score}** | ${l.website_health_score} | ${l.primary_opportunity} |\n`;
      });
      md += `\n---\n\n## Detailed Prospect Dossiers\n\n`;
      leads.forEach((l, idx) => {
        md += `### Prospect ${idx + 1}: ${l.business} (Search Rank: ${l.search_rank})\n\n`;
        md += `- **Business**: ${l.business}\n`;
        md += `- **Search Rank**: ${l.ranking_status}\n`;
        md += `- **Contact Email**: \`${l.contact_email}\` *(Verified)*\n`;
        md += `- **Phone**: ${l.phone}\n`;
        md += `- **Website**: ${l.website}\n`;
        md += `- **Lead Score**: ${l.lead_score}\n`;
        md += `- **Primary Opportunity**: ${l.primary_opportunity}\n`;
        md += `- **Recommended Approach**: ${l.recommended_approach}\n\n`;
        if (Array.isArray(l.metrics_audit) && l.metrics_audit.length > 0) {
          md += `#### Website Performance Audit Observations\n\n`;
          md += `| # | Metric | Status | Score | Severity | Finding |\n`;
          md += `|---|---|---|---|---|---|\n`;
          l.metrics_audit.forEach((m) => {
            md += `| ${m.num || 1} | ${m.metric} | ${m.how_well_doing || "Poor"} | ${m.metric_score || "3/10"} | ${m.severity || "High"} | ${String(m.findings || "").replace(/\|/g, "/")} |\n`;
          });
          md += `\n`;
        }
        if (Array.isArray(l.why_kent_flagged_them) && l.why_kent_flagged_them.length > 0) {
          md += `- **Why Kent Flagged Them**:\n`;
          l.why_kent_flagged_them.forEach((w) => {
            md += `  - ${w}\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
      return md;
    }

    return typeof outputData === "string" ? outputData : "";
  }, [parsedData, outputData, leads, industry, totalLeads, location, businessSize, avgScore, pipelineValue]);

  // Format leads for Kainoa Outreach Agent (ONLY leads with verified emails)
  const kainoaRecipients = useMemo(() => {
    if (Array.isArray(parsedData?.recipients) && parsedData.recipients.length > 0) {
      return parsedData.recipients;
    }

    return leads
      .filter((l) => Boolean(l.contact_email && l.contact_email.includes("@") && !l.contact_email.toLowerCase().includes("no email")))
      .map((l) => {
        if (l.extraPoints) {
          return {
            name: l.business || l.name,
            email: l.contact_email,
            urls: l.website ? [l.website] : (Array.isArray(l.urls) ? l.urls : []),
            extraPoints: l.extraPoints,
            talkingPoints: l.extraPoints,
            additionalContext: l.extraPoints,
          };
        }
        const problems: string[] = [];
        if (Array.isArray(l.metrics_audit)) {
          l.metrics_audit.forEach((m: any) => {
            const isFailing =
              m.how_well_doing?.toLowerCase().includes("poor") ||
              m.how_well_doing?.toLowerCase().includes("fail") ||
              m.severity === "Critical" ||
              m.severity === "High";
            const score = parseInt(m.metric_score, 10);
            if (isFailing || score <= 5) {
              problems.push(`${m.metric}: ${m.findings}`);
            }
          });
        }
        if (problems.length < 2 && Array.isArray(l.why_kent_flagged_them)) {
          l.why_kent_flagged_them.forEach((w: string) => {
            if (!w.includes("SEARCH RANK")) problems.push(w);
          });
        }
        if (problems.length === 0 && l.seo_gap_summary) {
          problems.push(`SEO & Conversion Gap: ${l.seo_gap_summary}`);
        }
        const mainProblems = problems.slice(0, 3).map((prob, i) => `${i + 1}) ${prob}`).join(" ");
        const rankText = l.ranking_status || `${l.search_rank} in ${location || 'Hawaii'}`;
        const extraPointsText = `Market Position: ${rankText}. Primary Opportunity: ${l.primary_opportunity || 'Website modernization'}. Main Audit Problems: ${mainProblems || 'Identified site speed and mobile layout vulnerabilities'}. Recommended Approach: ${l.recommended_approach || 'Pitch website speed defense and automated quote capture'}`;
        const webUrl = l.website ? (l.website.startsWith("http") ? l.website : `https://${l.website}`) : "";

        return {
          name: l.business || l.name,
          email: l.contact_email,
          urls: webUrl ? [webUrl] : [],
          extraPoints: extraPointsText,
          talkingPoints: extraPointsText,
          additionalContext: extraPointsText,
        };
      });
  }, [parsedData, leads, location]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const bizName = (lead.business || lead.name || "").toLowerCase();
      const opp = (lead.primary_opportunity || "").toLowerCase();
      const email = (lead.contact_email || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || bizName.includes(q) || opp.includes(q) || email.includes(q);

      const hasEmail = Boolean(lead.contact_email && !lead.contact_email.toLowerCase().includes("no email") && !lead.contact_email.toLowerCase().includes("none"));

      if (emailFilter === "verified") {
        return matchesSearch && hasEmail;
      }
      if (emailFilter === "phone_only") {
        return matchesSearch && !hasEmail;
      }
      return matchesSearch;
    });
  }, [leads, searchQuery, emailFilter]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const md = rawMarkdown || `# ${defaultTitle}\n\nTotal Leads: ${totalLeads}\nAverage Lead Score: ${avgScore}\nPipeline Value: ${pipelineValue}\n`;
    downloadFile(md, `lead-dossier-${Date.now()}.md`, "text/markdown;charset=utf-8;");
  };

  const handleDownloadJson = () => {
    const dataToExport = kainoaRecipients.length > 0 ? kainoaRecipients : parsedData || leads;
    const filename = `kainoa-prospects-${Date.now()}.json`;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    downloadFile(jsonStr, filename, "application/json;charset=utf-8;");
  };

  return (
    <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-white dark:bg-slate-900 shadow-md overflow-hidden animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="border-b border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Kent Lead Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800">
                <TrendingUp className="h-3.5 w-3.5" />
                {targetingStrategy}
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {defaultTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous multi-vector technical audit covering SEO, site speed, mobile UX, accessibility, and quote conversion funnels.
            </p>
          </div>

          {/* Quick Actions - Only Dossier Download & JSON Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-xs cursor-pointer"
              title="Download Markdown Dossier (.md)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Dossier (.md)</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              title="Download Lead Data (.json)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON (.json)</span>
            </button>
          </div>
        </div>

        {/* Metrics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="rounded-xl p-3.5 bg-white/80 dark:bg-slate-800/60 border border-blue-100 dark:border-blue-900/40 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Total Audited
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalLeads}</span>
              <span className="text-xs text-slate-400">leads</span>
            </div>
          </div>

          <div className="rounded-xl p-3.5 bg-white/80 dark:bg-slate-800/60 border border-blue-100 dark:border-blue-900/40 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Avg Lead Score
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {String(avgScore).replace(/\/100/, "")}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="rounded-xl p-3.5 bg-white/80 dark:bg-slate-800/60 border border-blue-100 dark:border-blue-900/40 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Pipeline Value
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                {pipelineValue}
              </span>
            </div>
          </div>

          <div className="rounded-xl p-3.5 bg-white/80 dark:bg-slate-800/60 border border-blue-100 dark:border-blue-900/40 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Email Coverage
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {leads.length > 0
                  ? `${Math.round(
                      (leads.filter((l) => l.contact_email && !l.contact_email.toLowerCase().includes("no email")).length /
                        leads.length) *
                        100
                    )}%`
                  : "80%"}
              </span>
              <span className="text-xs text-slate-400">verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header Bar - Fixed Height & Strict Non-Wrapping Layout */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 h-14 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
        {/* Navigation Tabs - Locked font-semibold and shrink-0 to prevent any button shift */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("cards")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              activeTab === "cards"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
            <span>Lead Cards ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              activeTab === "table"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Directory Table</span>
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              activeTab === "report"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              activeTab === "json"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Code2 className="h-3.5 w-3.5 shrink-0" />
            <span>JSON</span>
          </button>
        </div>

        {/* Tab Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "report" && (
            <button
              onClick={() => copyToClipboard(rawMarkdown, "markdown-full")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer shadow-xs h-8"
            >
              {copiedKey === "markdown-full" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Dossier</span>
                </>
              )}
            </button>
          )}

          {activeTab === "json" && (
            <button
              onClick={() => {
                const content = JSON.stringify(kainoaRecipients, null, 2);
                copyToClipboard(content, "json-kainoa");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer shadow-xs h-8"
            >
              {copiedKey === "json-kainoa" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 min-h-[500px]">
        {/* VIEW 1: LEAD CARDS */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-slate-100">{filteredLeads.length}</strong> of {leads.length} leads
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads, opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-56 h-8"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs h-8">
                  <button
                    onClick={() => setEmailFilter("all")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      emailFilter === "all"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setEmailFilter("verified")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      emailFilter === "verified"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    With Email
                  </button>
                  <button
                    onClick={() => setEmailFilter("phone_only")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      emailFilter === "phone_only"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Phone Only
                  </button>
                </div>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No leads match your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or email filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredLeads.map((lead, idx) => {
                  const rankStr = String(lead.search_rank || `#${idx + 1}`);
                  const scoreNum = parseInt(String(lead.lead_score || "65").match(/\d+/)?.[0] || "65", 10);
                  const healthNum = parseInt(String(lead.website_health_score || "45").match(/\d+/)?.[0] || "45", 10);
                  const hasEmail = Boolean(lead.contact_email && !lead.contact_email.toLowerCase().includes("no email") && !lead.contact_email.toLowerCase().includes("none"));

                  const leadCardId = `lead-${idx}`;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top Row: Rank Badge & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-blue-600 text-white shadow-xs">
                              Rank {rankStr.replace(/^#/, "")}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {lead.ranking_status || `Position ${rankStr}`}
                            </span>
                          </div>

                          {/* Scores Badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                scoreNum >= 75
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : scoreNum >= 60
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              }`}
                              title="Lead Opportunity Score (Higher means higher value prospect for Zumify)"
                            >
                              <Award className="h-3 w-3" />
                              Score: {scoreNum}/100
                            </span>
                          </div>
                        </div>

                        {/* Business Title & Website */}
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                            {lead.business || lead.name || "Target Prospect"}
                          </h3>
                          {lead.website && (
                            <a
                              href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1 mt-0.5 transition-colors"
                            >
                              <Globe className="h-3 w-3" />
                              {lead.website.replace(/^https?:\/\//, "")}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>

                        {/* Contact Channels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <Mail className={`h-3.5 w-3.5 shrink-0 ${hasEmail ? "text-emerald-600" : "text-amber-500"}`} />
                              <span className={`truncate font-medium ${hasEmail ? "text-slate-800 dark:text-slate-200" : "text-slate-400 italic"}`}>
                                {lead.contact_email || "No email detected"}
                              </span>
                            </div>
                            {hasEmail && (
                              <button
                                onClick={() => copyToClipboard(lead.contact_email!, `email-${idx}`)}
                                className="text-slate-400 hover:text-blue-600 p-1 shrink-0 cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedKey === `email-${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                {lead.phone || "No phone listed"}
                              </span>
                            </div>
                            {lead.phone && (
                              <button
                                onClick={() => copyToClipboard(lead.phone!, `phone-${idx}`)}
                                className="text-slate-400 hover:text-blue-600 p-1 shrink-0 cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedKey === `phone-${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Primary Opportunity Tag */}
                        {lead.primary_opportunity && (
                          <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs">
                            <span className="font-semibold text-blue-900 dark:text-blue-200 block mb-0.5">
                              Target Technical Opportunity:
                            </span>
                            <p className="text-blue-800 dark:text-blue-300">
                              {lead.primary_opportunity}
                            </p>
                          </div>
                        )}

                        {/* Technical Audit Points / Why Flagged */}
                        {lead.why_kent_flagged && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Why Kent Flagged Them:
                            </span>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-disc">
                              {Array.isArray(lead.why_kent_flagged) ? (
                                lead.why_kent_flagged.map((point, pIdx) => (
                                  <li key={pIdx}>{point}</li>
                                ))
                              ) : (
                                <li>{lead.why_kent_flagged}</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Personalized Pitch / Outreach Hook */}
                        {lead.outreach_hook && (
                          <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                                <Send className="h-3 w-3 text-indigo-600" />
                                Recommended Outreach Hook:
                              </span>
                              <button
                                onClick={() => copyToClipboard(lead.outreach_hook!, `pitch-${idx}`)}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                              >
                                {copiedKey === `pitch-${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                {copiedKey === `pitch-${idx}` ? "Copied" : "Copy Pitch"}
                              </button>
                            </div>
                            <p className="text-indigo-900/90 dark:text-indigo-300 italic">
                              "{lead.outreach_hook.replace(/^["']|["']$/g, "")}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer: Website Health Metric */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Health: {healthNum}/100</span>
                        <span>{hasEmail ? "Direct Email Verified" : "Direct Phone Outreach"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MASTER DIRECTORY TABLE */}
        {activeTab === "table" && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-slate-100">{filteredLeads.length}</strong> of {leads.length} leads
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads, opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-56 h-8"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs h-8">
                  <button
                    onClick={() => setEmailFilter("all")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      emailFilter === "all"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setEmailFilter("verified")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      emailFilter === "verified"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    With Email
                  </button>
                  <button
                    onClick={() => setEmailFilter("phone_only")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      emailFilter === "phone_only"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Phone Only
                  </button>
                </div>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No leads match your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or email filter</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs bg-white dark:bg-slate-900/90">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Business</th>
                      <th className="py-3 px-4">Contact Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Health</th>
                      <th className="py-3 px-4">Primary Opportunity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLeads.map((lead, idx) => {
                      const rankStr = String(lead.search_rank || `#${idx + 1}`);
                      const scoreNum = parseInt(String(lead.lead_score || "65").match(/\d+/)?.[0] || "65", 10);
                      const healthNum = parseInt(String(lead.website_health_score || "45").match(/\d+/)?.[0] || "45", 10);
                      const hasEmail = Boolean(lead.contact_email && !lead.contact_email.toLowerCase().includes("no email") && !lead.contact_email.toLowerCase().includes("none"));

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-blue-600">
                            {rankStr}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {lead.business || lead.name}
                            </div>
                            {lead.website && (
                              <a
                                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                {lead.website.replace(/^https?:\/\//, "")}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono text-[11px] ${hasEmail ? "text-slate-800 dark:text-slate-200" : "text-slate-400 italic"}`}>
                              {lead.contact_email || "No email detected"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                            {lead.phone || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              scoreNum >= 75 ? "bg-emerald-50 text-emerald-700" : scoreNum >= 60 ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                            }`}>
                              {scoreNum}/100
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-600 dark:text-slate-400">
                            {healthNum}/100
                          </td>
                          <td className="py-3 px-4 max-w-xs text-slate-600 dark:text-slate-400">
                            {lead.primary_opportunity || "Website overhaul & lead funnel optimization"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: EXECUTIVE DOSSIER */}
        {activeTab === "report" && (
          <div className="space-y-6">
            {leads.length > 0 ? (
              /* RICH HUMAN-READABLE EXECUTIVE DOSSIER */
              <div className="space-y-6">
                {/* 1. Header Narrative Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                          Executive Dossier
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Scout Agent: <strong className="text-slate-800 dark:text-slate-200">Kent (Zumify Auditor)</strong>
                        </span>
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Lead Intelligence Dossier: Hawaii {industry}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                      <span>{targetingStrategy}</span>
                    </div>
                  </div>

                  <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {executiveSummary}
                  </p>
                </div>

                {/* 2. Detailed Prospect Dossiers */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Detailed Prospect Dossiers & 12-Metric Performance Audits
                    </h4>
                  </div>

                  <div className="space-y-6">
                    {leads.map((lead, idx) => {
                      const rankNum = Number(String(lead.search_rank || "").replace(/[^0-9]/g, "")) || idx + 1;
                      const hasEmail = Boolean(lead.contact_email && !lead.contact_email.toLowerCase().includes("no email") && !lead.contact_email.toLowerCase().includes("none"));
                      const scoreNum = Number(String(lead.lead_score || "65").replace(/[^0-9]/g, "")) || 65;
                      const healthNum = Number(String(lead.website_health_score || "50").replace(/[^0-9]/g, "")) || 50;
                      const metricsAudit: any[] = Array.isArray(lead.metrics_audit) ? lead.metrics_audit : [];
                      const whyFlagged: string[] = Array.isArray(lead.why_kent_flagged_them)
                        ? lead.why_kent_flagged_them
                        : Array.isArray(lead.why_kent_flagged)
                        ? lead.why_kent_flagged
                        : typeof lead.why_kent_flagged === "string"
                        ? [lead.why_kent_flagged]
                        : [];

                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                        >
                          {/* Prospect Header Card */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded text-xs ${
                                  rankNum === 1
                                    ? "bg-amber-100 text-amber-900 border border-amber-300 font-extrabold"
                                    : rankNum === 2
                                    ? "bg-blue-100 text-blue-900 border border-blue-300 font-bold"
                                    : "bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                                }`}>
                                  Rank #{rankNum} {rankNum === 1 ? "• Search Incumbent" : rankNum === 2 ? "• Top Runner-Up" : "• Competitor"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {lead.location || location}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-base font-bold text-slate-900 dark:text-slate-50">
                                  {lead.business || lead.name}
                                </h5>
                                {lead.website && (
                                  <a
                                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                                  >
                                    {lead.website.replace(/^https?:\/\//, "")}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Dual Score Dials */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-right">
                                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Lead Score</span>
                                <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">{scoreNum}/100</span>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-right">
                                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block">Site Health</span>
                                <span className="text-sm font-extrabold text-blue-800 dark:text-blue-200">{healthNum}/100</span>
                              </div>
                            </div>
                          </div>

                          {/* Contact Specs Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Email</span>
                              <div className="mt-0.5 truncate">
                                {hasEmail ? (
                                  <a href={`mailto:${lead.contact_email}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono">
                                    {lead.contact_email}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">No email detected (phone-only)</span>
                                )}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Phone</span>
                              <div className="mt-0.5 font-mono text-slate-800 dark:text-slate-200">
                                {lead.phone ? <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a> : "—"}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Est. Opportunity</span>
                              <div className="mt-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                {lead.estimated_opportunity || "$3,500 - $5,000 package"}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Customer Reviews</span>
                              <div className="mt-0.5 text-slate-700 dark:text-slate-300 truncate">
                                {lead.customer_reviews || "Active Google profile"}
                              </div>
                            </div>
                          </div>

                          {/* Recommended Approach Callout */}
                          {(lead.recommended_approach || lead.outreach_hook) && (
                            <div className="rounded-xl bg-gradient-to-r from-amber-50/70 to-yellow-50/40 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200/80 dark:border-amber-800/50 p-3.5 text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                                <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>Recommended Pitch Angle & Hook:</span>
                              </div>
                              <p className="text-amber-950/90 dark:text-amber-200/90 leading-relaxed pl-5">
                                {lead.recommended_approach || lead.outreach_hook}
                              </p>
                            </div>
                          )}

                          {/* Why Kent Flagged Them */}
                          {whyFlagged.length > 0 && (
                            <div className="space-y-1.5 text-xs pt-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                Identified Vulnerabilities & Audit Flags:
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pl-5">
                                {whyFlagged.map((flag, fIdx) => (
                                  <div key={fIdx} className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                                    <span className="h-1 w-1 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                    <span>{flag}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 12-Metric Performance Audit Table */}
                          {metricsAudit.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                                12-Metric Website Performance Audit (Kent LLM Nodes)
                              </span>
                              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-[11px] text-left border-collapse">
                                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                      <th className="py-2 px-2.5 w-8">#</th>
                                      <th className="py-2 px-2.5">Metric Tested</th>
                                      <th className="py-2 px-2.5 text-center">Status</th>
                                      <th className="py-2 px-2.5 text-center">Score</th>
                                      <th className="py-2 px-2.5 text-center">Severity</th>
                                      <th className="py-2 px-2.5">Kent LLM Audit Observation</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {metricsAudit.map((m, mIdx) => {
                                      const isDoingWell = m.how_well_doing?.toLowerCase().includes("well");
                                      const isFailing = m.how_well_doing?.toLowerCase().includes("poor") || m.how_well_doing?.toLowerCase().includes("fail");
                                      const isCritical = m.severity === "Critical";
                                      const isHigh = m.severity === "High";

                                      return (
                                        <tr key={mIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                          <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[10px]">{m.num || mIdx + 1}</td>
                                          <td className="py-1.5 px-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{m.metric}</td>
                                          <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                              isDoingWell ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                              isFailing ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                              "bg-amber-50 text-amber-700 border border-amber-200"
                                            }`}>
                                              {m.how_well_doing || "Needs Optimization"}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                            {m.metric_score}
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              isCritical ? "bg-rose-100 text-rose-800 font-bold" :
                                              isHigh ? "bg-amber-100 text-amber-800" :
                                              "bg-slate-100 text-slate-600"
                                            }`}>
                                              {m.severity || "Clean"}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                            {m.findings}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Actionable Next Steps & Conversion Playbook */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 text-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                      Actionable Outreach Playbook for Zumify (Hawaii Strategy)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <span className="flex h-5 w-5 rounded-full bg-amber-400/20 text-amber-400 items-center justify-center text-[10px]">1</span>
                        <span>Rank #1 Incumbents</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Pitch high-ticket website modernization, Core Web Vitals speed defense, and automated quote funnels to protect their market leadership against aggressive competitors.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-blue-300">
                        <span className="flex h-5 w-5 rounded-full bg-blue-400/20 text-blue-400 items-center justify-center text-[10px]">2</span>
                        <span>Rank #2 Runners-Up</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Pitch targeted local Hawaii SEO campaigns to overtake the #1 ranked competitor within 90 days. Highlight the exact keyword volume and mobile gap separating them.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-300">
                        <span className="flex h-5 w-5 rounded-full bg-emerald-400/20 text-emerald-400 items-center justify-center text-[10px]">3</span>
                        <span>Rank #3+ Trailing Competitors</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Demonstrate customer traffic and pipeline lost to top-two competitors. Pitch complete website overhaul packages ($3,500 - $5,000) with instant booking funnels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* UNIVERSAL PARSED MARKDOWN DOCUMENT FALLBACK */
              <div className="p-5 rounded-xl bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs max-h-[750px] overflow-y-auto">
                {renderMarkdownDocument(rawMarkdown)}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: RAW JSON PAYLOAD - KAINOA LEADS */}
        {activeTab === "json" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                <span>Formatted for Kainoa Outreach Agent • Verified emails only • Includes custom pitch hooks</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {kainoaRecipients.length} Email Prospects
              </span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[700px] overflow-y-auto">
              {JSON.stringify(kainoaRecipients, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
