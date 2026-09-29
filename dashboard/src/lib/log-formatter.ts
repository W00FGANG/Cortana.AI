/**
 * Log Formatter Utility
 * Converts noisy, verbose telemetry logs and raw JSON blobs into concise,
 * easy-to-understand human-readable updates for all AI workers (especially Harper).
 */

export interface FormattedLog {
  action: string;
  description: string;
}

/**
 * Parses and formats an Activity record into a human-readable title and description.
 * Supports both object input ({ action, description }) and positional arguments (action, description, agentName).
 */
export function formatHumanReadableActivity(
  actOrAction: { action: string; description: string | null; status?: string } | string,
  descOrAgentName?: string | null,
  maybeAgentName?: string
): FormattedLog {
  let rawAction = "";
  let rawDescription: string | null = "";
  let rawStatus = "";
  let agentName = "";

  if (typeof actOrAction === "object" && actOrAction !== null) {
    rawAction = actOrAction.action || "";
    rawDescription = actOrAction.description;
    rawStatus = actOrAction.status || "";
    agentName = typeof descOrAgentName === "string" ? descOrAgentName : "";
  } else {
    rawAction = actOrAction || "";
    rawDescription = descOrAgentName ?? null;
    agentName = maybeAgentName || "";
  }

  const isHarper =
    agentName.toLowerCase().includes("harper") ||
    rawAction.toLowerCase().includes("harper") ||
    rawAction.toLowerCase().includes("article");

  let action = rawAction || "Workflow step";
  let description = rawDescription || "";

  // 1. HARPER SPECIFIC ACCURACY & TASK-SPECIFIC UPDATES
  if (isHarper) {
    // Extract topic or quoted subject from existing description or action
    const topicMatch = description.match(/"([^"]+)"/) || action.match(/"([^"]+)"/) || description.match(/for "([^"]+)"/);
    const extractedTopic = topicMatch ? topicMatch[1] : null;

    // Check if description contains raw JSON or article payloads
    const hasRawJson = description.includes('"sections"') || description.includes('"slug"') || description.includes('"title"');
    const hasNodeList = description.includes("Executed nodes:") || description.includes("Output:");

    // A. ERROR STATE (Cancelled, Failed, Timeout)
    if (rawStatus === "Failed" || action.toLowerCase().includes("failed") || description.includes("HTTP 5")) {
      if (description.includes("cancelled manually") || description.includes("code:0")) {
        return {
          action: "Execution Cancelled",
          description: "Workflow execution was cancelled in n8n.",
        };
      }
      if (description.includes("timeout") || description.includes("Timeout")) {
        return {
          action: "Execution Timed Out",
          description: "The research workflow took longer than usual and is processing asynchronously.",
        };
      }
      return {
        action: "Research Execution Failed",
        description: extractedTopic ? `Failed while processing article for "${extractedTopic}".` : "Workflow encountered an error during research execution.",
      };
    }

    // B. COMPLETED ARTICLE GENERATION (Accomplishment)
    const isCompleted =
      rawStatus === "Success" &&
      (action.toLowerCase().includes("completed") ||
       action.toLowerCase().includes("generated") ||
       description.toLowerCase().includes("completed in-depth article") ||
       description.toLowerCase().includes("drafted publication") ||
       hasRawJson ||
       hasNodeList);

    if (isCompleted) {
      action = "Article Generated";

      // If description has a quoted title, simplify to title & read time
      const quotedTitleMatch = description.match(/"([^"]+)"/);
      const readTimeMatch = description.match(/(\d+\s*min(?:\s*read)?)/i);
      if (quotedTitleMatch) {
        description = `"${quotedTitleMatch[1]}"${readTimeMatch ? ` (${readTimeMatch[1]})` : ""}`;
        return { action, description };
      }

      // Try parsing full article JSON
      const parsed = extractArticleMetadata(description);
      if (parsed?.title) {
        const readTime = parsed.readingEstimation
          ? (String(parsed.readingEstimation).includes("min") ? parsed.readingEstimation : `${parsed.readingEstimation} min`)
          : null;
        description = `"${parsed.title}"${readTime ? ` (${readTime})` : ""}`;
        return { action, description };
      }

      if (extractedTopic) {
        description = `Article on "${extractedTopic}"`;
        return { action, description };
      }

      description = "Comprehensive research article completed";
      return { action, description };
    }

    // C. INITIATED / IN-PROGRESS DISCOVERY (Task Start)
    const isStarting =
      rawStatus === "Running" ||
      action.toLowerCase().includes("executing") ||
      action.toLowerCase().includes("discovery") ||
      action.toLowerCase().includes("researching & drafting") ||
      description.toLowerCase().includes("initiated") ||
      description.toLowerCase().includes("conducting live web research") ||
      description.toLowerCase().includes("generate content");

    if (isStarting) {
      action = "Research Discovery";
      description = extractedTopic
        ? `Gathering verified citations for "${extractedTopic}"`
        : "Gathering authoritative sources";
      return { action, description };
    }

    // D. SPECIFIC STEP-BY-STEP PROGRESS MILESTONES
    // Keyword Analysis
    if (action.toLowerCase().includes("keyword") || description.toLowerCase().includes("keyword")) {
      action = "Topic Keywords";
      description = extractedTopic
        ? `Query angles for "${extractedTopic}"`
        : "Evaluating search queries";
      return { action, description };
    }

    // Citations / Live Web Sources Retrieval (Avoid matching "research")
    const isWebSearch = (/\bsearch\b/i.test(action) && !action.toLowerCase().includes("research")) ||
                        action.toLowerCase().includes("citation") ||
                        action.toLowerCase().includes("collect");
    if (isWebSearch) {
      action = "Web Citations";
      description = extractedTopic
        ? `Sources for "${extractedTopic}"`
        : "Gathering reference sources";
      return { action, description };
    }

    // Outline / Structural Architecture
    if (action.toLowerCase().includes("outline") || action.toLowerCase().includes("structure")) {
      action = "Structuring Layout";
      description = extractedTopic
        ? `Section layout for "${extractedTopic}"`
        : "Organizing section hierarchy";
      return { action, description };
    }

    // Drafting / Writing
    if (action.toLowerCase().includes("writing") || (action.toLowerCase().includes("draft") && !action.toLowerCase().includes("researching"))) {
      action = "Writing Draft";
      description = extractedTopic
        ? `Composing draft for "${extractedTopic}"`
        : "Drafting publication content";
      return { action, description };
    }

    // Fallback for Harper if description already contains valuable info
    if (description && !description.includes("Executing nodes:") && !description.startsWith("{")) {
      return { action, description };
    }
  }

  // 2. MAYA SPECIFIC AUDIT & REFINEMENT (Social Media & Market Researcher)
  const isMaya =
    agentName.toLowerCase().includes("maya") ||
    rawAction.toLowerCase().includes("social") ||
    rawAction.toLowerCase().includes("marketing");

  if (isMaya) {
    // A. ERROR STATE (Cancelled, Failed, Inactive, Timeout)
    if (rawStatus === "Failed" || rawAction.toLowerCase().includes("failed") || description.includes("HTTP 5") || description.includes("inactive in n8n")) {
      if (description.includes("cancelled manually") || description.includes("code:0")) {
        return {
          action: "Execution Cancelled",
          description: "Workflow execution was cancelled in n8n.",
        };
      }
      if (description.includes("timeout") || description.includes("Timeout")) {
        return {
          action: "Execution Timed Out",
          description: "The social workflow took longer than usual and is processing asynchronously.",
        };
      }
      if (description.includes("inactive")) {
        return {
          action: "Workflow Inactive",
          description: "The agent workflow is currently inactive in n8n. Please toggle the Active switch to ON.",
        };
      }
      let cleanDesc = description.replace(/Workflow execution returned HTTP \d+:\s*/i, "").trim();
      if (cleanDesc.startsWith("Completed") || cleanDesc.startsWith("{") || !cleanDesc) {
        cleanDesc = "Workflow execution failed in n8n. Please check workflow nodes or credentials.";
      }
      return {
        action: "Execution Failed",
        description: cleanDesc,
      };
    }

    // Try to parse embedded JSON from description (e.g. from "Execution finished with HTTP 200:\n{ ... }")
    let mayaJson: any = null;
    if (description.includes("{")) {
      try {
        const start = description.indexOf("{");
        const end = description.lastIndexOf("}");
        if (start !== -1 && end > start) {
          mayaJson = JSON.parse(description.slice(start, end + 1));
        }
      } catch {}
    }

    const postSummary = mayaJson?.post_summary || null;
    const platformsObj = mayaJson?.platforms || null;
    const hasPublisherData = Boolean(
      postSummary ||
      platformsObj ||
      action.toLowerCase().includes("publish") ||
      action.toLowerCase().includes("social post") ||
      description.toLowerCase().includes("social media post") ||
      description.toLowerCase().includes("social post") ||
      description.toLowerCase().includes("post text:") ||
      description.toLowerCase().includes("clip") ||
      description.toLowerCase().includes("article link") ||
      description.toLowerCase().includes("what’s shaping mobile apps")
    );

    // B. Social Media Publisher (Post Publishing)
    if (hasPublisherData) {
      let postText = "";
      if (typeof postSummary === "string") {
        postText = postSummary;
      } else if (postSummary && typeof postSummary === "object") {
        postText = postSummary.text || postSummary.postText || "";
      } else {
        const quoteMatch = description.match(/Social Media Post: "([^"]+)"/) ||
                           description.match(/social post: "([^"]+)"/) ||
                           description.match(/"([^"]+)"/);
        if (quoteMatch) postText = quoteMatch[1];
      }

      const cleanSnippetText = postText.replace(/\r?\n+/g, " ").trim();
      const snippet = cleanSnippetText
        ? (cleanSnippetText.length > 60 ? `${cleanSnippetText.slice(0, 57)}...` : cleanSnippetText)
        : "";

      const isStartStep =
        rawAction.toLowerCase().includes("publishing") ||
        rawAction.toLowerCase().includes("initiated") ||
        rawAction.toLowerCase().includes("executing") ||
        (rawDescription && (
          rawDescription.toLowerCase().includes("initiated workflow execution") ||
          rawDescription.toLowerCase().includes("dispatching post to")
        ));

      if (isStartStep) {
        action = "Publishing Social Post";
        description = snippet
          ? `Dispatching post to target channels: "${snippet}"`
          : "Formatting and dispatching social media post.";
        return { action, description };
      }

      // Check for completion
      const isPostCompleted =
        rawStatus === "Success" ||
        action.toLowerCase().includes("completed") ||
        action.toLowerCase().includes("published") ||
        Boolean(mayaJson);

      if (isPostCompleted) {
        const li = platformsObj?.linkedin;
        const x = platformsObj?.x;

        if (li?.success && x?.success) {
          action = "Social Media Post Published";
          description = snippet
            ? `Successfully published post across X (Twitter) & LinkedIn: "${snippet}"`
            : "Successfully published post across X (Twitter) and LinkedIn.";
          return { action, description };
        }

        if (li?.success) {
          action = "LinkedIn Post Published";
          description = snippet
            ? `Successfully published post to LinkedIn: "${snippet}"`
            : "Successfully published post to LinkedIn.";
          return { action, description };
        }

        if (x?.success) {
          action = "X (Twitter) Post Published";
          description = snippet
            ? `Successfully published post to X (Twitter): "${snippet}"`
            : "Successfully published post to X (Twitter).";
          return { action, description };
        }

        const rawErr = li?.error || x?.error;
        let errStr = "";
        if (typeof rawErr === "object" && rawErr !== null) {
          errStr = rawErr.message || rawErr.error || rawErr.description || JSON.stringify(rawErr);
        } else if (rawErr) {
          errStr = String(rawErr);
        }

        if (errStr) {
          action = "Social Post Dispatch Result";
          description = snippet
            ? `Dispatch finished with platform notice: ${errStr}. Post: "${snippet}"`
            : `Publish dispatch finished: ${errStr}.`;
          return { action, description };
        }

        action = "Post Published";
        description = snippet
          ? `Dispatched: "${snippet}"`
          : "Successfully published post.";
        return { action, description };
      }

      action = "Publishing Post";
      description = snippet
        ? `Target: "${snippet}"`
        : "Formatting social media post.";
      return { action, description };
    }

    // B. Social Media & Market Research (Market Trends, YouTube Insights, etc.)
    const topicMatch = description.match(/Social Media Research:\s*([^"]+)/i) ||
                       description.match(/report on "([^"]+)"/i) ||
                       description.match(/"([^"]+)"/) ||
                       action.match(/"([^"]+)"/);
    let topic = topicMatch ? topicMatch[1].trim() : "Hawaii business & AI automation";
    if (topic.toLowerCase() === "success" || topic.toLowerCase() === "live") {
      topic = "Hawaii business & AI automation";
    }

    const isResearchStart =
      rawStatus === "Running" ||
      rawAction.toLowerCase().includes("executing") ||
      (rawDescription && (
        rawDescription.toLowerCase().includes("initiated") ||
        rawDescription.toLowerCase().includes("analyzing search trends")
      ));

    if (isResearchStart) {
      action = "Market Research";
      description = `Analyzing trends for "${topic}"`;
      return { action, description };
    }

    // Completed research
    action = "Research Report";
    description = `Strategic report on "${topic}"`;
    return { action, description };
  }

  // 3. ERROR CLEANUP (Strip raw JSON codes or 500 stacks)
  if (rawStatus === "Failed" || action.toLowerCase().includes("failed") || description.includes("HTTP 5")) {
    if (description.includes("cancelled manually") || description.includes("code:0")) {
      action = "Execution Cancelled";
      description = "Workflow execution was cancelled in n8n.";
      return { action, description };
    }

    if (description.includes("timeout") || description.includes("Timeout")) {
      action = "Execution Timed Out";
      description = "The workflow took longer than usual and is processing asynchronously.";
      return { action, description };
    }

    // Clean up generic JSON in error string
    try {
      const matchJson = description.match(/\{.*\}/);
      if (matchJson) {
        const errObj = JSON.parse(matchJson[0]);
        if (errObj.message) {
          description = `Error: ${errObj.message}`;
        }
      }
    } catch {}

    action = action.replace("Executing:", "Failed:");
    return { action, description };
  }

  // 3. GENERIC CLEANUP FOR ANY RAW JSON BLOB
  if (description.startsWith("{") || description.includes('"markdown"') || description.includes('"title"')) {
    try {
      const jsonStart = description.indexOf("{");
      if (jsonStart !== -1) {
        const potentialJson = description.slice(jsonStart);
        const parsed = JSON.parse(potentialJson);
        if (parsed.title) {
          description = `Completed: "${parsed.title}"`;
        } else if (parsed.post_summary || parsed.post_text) {
          description = `Created social post: "${(parsed.post_summary || parsed.post_text).slice(0, 100)}..."`;
        }
      }
    } catch {}
  }

  // Cap runaway descriptions to at most 90 chars cleanly
  if (description.length > 90) {
    description = description.slice(0, 87).trim() + "...";
  }

  return { action, description };
}

/**
 * Extracts key article metadata from text that might contain article JSON.
 */
function extractArticleMetadata(text: string): {
  title?: string;
  category?: string;
  readingEstimation?: string;
  sectionCount?: number;
  sourceCount?: number;
} | null {
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

    const rawJson = text.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(rawJson);

    const article = parsed.articleJson || parsed.data?.articleJson || parsed.data || parsed;
    if (!article || (!article.title && !article.slug)) return null;

    return {
      title: article.title,
      category: article.category,
      readingEstimation: article.readingEstimation,
      sectionCount: Array.isArray(article.sections) ? article.sections.length : undefined,
      sourceCount: Array.isArray(article.sources) ? article.sources.length : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Formats a run output snippet into a clean, human-readable summary instead of raw JSON.
 */
export function formatHumanReadableRunOutput(
  output: string | null | undefined,
  error?: string | null | undefined,
  agentName: string = ""
): string {
  if (error) {
    if (error.includes("cancelled manually")) return "Execution cancelled manually";
    if (error.includes("Timeout")) return "Execution timed out";
    return error.length > 80 ? error.slice(0, 77) + "..." : error;
  }

  if (!output) return "Completed successfully";

  const trimmed = output.trim();

  // If output is article JSON
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const article = parsed.articleJson || parsed.data?.articleJson || parsed;
      if (article.title) {
        const extra = article.readingEstimation || (article.category ? article.category : "");
        return `"${article.title}"${extra ? ` (${extra})` : ""}`;
      }

      if (parsed.post_summary) {
        const text = typeof parsed.post_summary === "string" ? parsed.post_summary : (parsed.post_summary.text || "");
        const cleanSnippet = text.replace(/\r?\n+/g, " ").trim();
        const snippet = cleanSnippet.length > 50 ? `${cleanSnippet.slice(0, 47)}...` : cleanSnippet;
        const media = parsed.post_summary?.media_type && parsed.post_summary.media_type !== "NONE" ? ` [${parsed.post_summary.media_type}]` : "";
        return `Social Post: "${snippet}"${media}`;
      }

      if (parsed.platforms) {
        return "Social Media Dispatch Output";
      }

      if (parsed.topic || parsed.focus_topic) {
        return `Research Report: "${parsed.topic || parsed.focus_topic}"`;
      }

      return "Workflow completed with data output";
    } catch {
      return "Workflow completed with structured output";
    }
  }

  // If output is Kainoa sent emails array
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return `Sent outreach to ${parsed.length} recipient${parsed.length === 1 ? "" : "s"}`;
      }
    } catch {}
  }

  if (trimmed.length > 70) {
    return trimmed.slice(0, 67) + "...";
  }

  return trimmed;
}
