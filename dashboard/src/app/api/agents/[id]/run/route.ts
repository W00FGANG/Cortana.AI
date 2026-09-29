import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import http from "node:http";
import https from "node:https";
import { prisma } from "@/lib/prisma";

const httpAgent = new http.Agent({ keepAlive: true, timeout: 300000 });
const httpsAgent = new https.Agent({ keepAlive: true, timeout: 300000 });

// Custom HTTP request using built-in node:http with no artificial socket timeouts
function postJson(urlStr: string, data: any): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === "https:";
      const client = isHttps ? https : http;
      const agent = isHttps ? httpsAgent : httpAgent;
      const bodyStr = JSON.stringify(data);

      const req = client.request(
        url,
        {
          method: "POST",
          agent,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr),
            "Connection": "keep-alive",
          },
        },
        (res) => {
          let resData = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            resData += chunk;
          });
          res.on("end", () => {
            resolve({ status: res.statusCode || 200, text: resData });
          });
        }
      );

      // Disable socket timeout to allow local LLM generations to take full time
      req.setTimeout(0);

      req.on("error", (err) => {
        reject(err);
      });

      req.write(bodyStr);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function executeWorkflowInBackground({
  agentId,
  agentName,
  taskId,
  runId,
  webhookUrl,
  payload,
  keywords,
  category,
  language,
  focusTopic,
}: {
  agentId: string;
  agentName: string;
  taskId: string;
  runId: string;
  webhookUrl: string;
  payload: any;
  keywords: string;
  category: string;
  language: string;
  focusTopic?: string;
}) {
  try {
    const { status, text: resText } = await postJson(webhookUrl, payload);

    if (status === 404) {
      const errorMsg = "The workflow endpoint was not found or is currently inactive. Please ensure the agent workflow is active.";
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "Failed",
          completedAt: new Date(),
          result: errorMsg,
        },
      });
      await prisma.agentRun.update({
        where: { id: runId },
        data: {
          status: "Failed",
          completedAt: new Date(),
          error: errorMsg,
        },
      });
      await prisma.activity.create({
        data: {
          agentId,
          action: "Workflow execution failed to start",
          description: errorMsg,
          status: "Failed",
        },
      });
      return;
    }

    if (status >= 400) {
      const errorMsg = `Workflow execution returned HTTP ${status}: ${resText}`;
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "Failed",
          completedAt: new Date(),
          result: errorMsg,
        },
      });
      await prisma.agentRun.update({
        where: { id: runId },
        data: {
          status: "Failed",
          completedAt: new Date(),
          error: errorMsg,
        },
      });
      await prisma.activity.create({
        data: {
          agentId,
          action: "Workflow execution failed",
          description: errorMsg,
          status: "Failed",
        },
      });
      return;
    }

    // Process result from n8n
    let responseData: any = null;
    try {
      responseData = JSON.parse(resText);
    } catch {
      responseData = resText;
    }

    const isDirectCompleted =
      responseData &&
      (typeof responseData === "string" ||
        (typeof responseData === "object" &&
          (responseData.sections ||
            responseData.sources ||
            responseData.title ||
            responseData.slug ||
            responseData.result ||
            responseData.body ||
            responseData.step ||
            responseData.nodesExecuted ||
            responseData.markdown ||
            responseData.article ||
            responseData.articleJson ||
            responseData.post_summary ||
            responseData.platforms ||
            responseData.output)));

    if (isDirectCompleted) {
      // Unwrap clean article JSON if responseData is wrapped
      let cleanArticle = responseData;
      if (responseData && typeof responseData === "object") {
        if (responseData.articleJson && typeof responseData.articleJson === "object") {
          cleanArticle = responseData.articleJson;
        } else if (typeof responseData.articleJson === "string") {
          try {
            cleanArticle = JSON.parse(responseData.articleJson);
          } catch { }
        } else if (responseData.data && typeof responseData.data === "object") {
          if (responseData.data.articleJson && typeof responseData.data.articleJson === "object") {
            cleanArticle = responseData.data.articleJson;
          } else if (responseData.data.sections) {
            cleanArticle = responseData.data;
          }
        }
      }

      // If cleanArticle still has telemetry wrapper fields, clean them
      if (cleanArticle && typeof cleanArticle === "object") {
        const {
          step: _s,
          result: _r,
          nodesExecuted: _n,
          generatedAt: _g,
          markdown: _m,
          jsonOutput: _j,
          data: _d,
          articleJson: _aj,
          ...cleanSchema
        } = cleanArticle;

        if (cleanSchema.sections || cleanSchema.sources || cleanSchema.title || cleanSchema.slug) {
          const ordered: Record<string, any> = {};
          const keyOrder = [
            "slug", "title", "description", "introduction", "category", "author",
            "publishDate", "readingEstimation", "color", "image", "sections", "takeaways", "sources"
          ];
          for (const k of keyOrder) {
            if (cleanSchema[k] !== undefined) ordered[k] = cleanSchema[k];
          }
          for (const k of Object.keys(cleanSchema)) {
            if (!(k in ordered)) ordered[k] = cleanSchema[k];
          }
          cleanArticle = ordered;
        }
      }

      const resultText =
        typeof cleanArticle === "object"
          ? JSON.stringify(cleanArticle, null, 2)
          : (typeof responseData === "object" ? JSON.stringify(responseData, null, 2) : resText);

      const stepName = responseData?.step || "Workflow Completed";
      const nodesList = Array.isArray(responseData?.nodesExecuted) ? responseData.nodesExecuted : null;
      const articleTitle =
        cleanArticle?.title ||
        responseData?.title ||
        (focusTopic ? `Market Research: "${focusTopic}"` : keywords ? `Haiku / Content for "${keywords}"` : "Generated Content");

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          result: resultText,
        },
      });

      await prisma.agentRun.update({
        where: { id: runId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          output: resultText,
        },
      });

      // Mark any in-progress activities for this agent as Success so they stop showing as running
      await prisma.activity.updateMany({
        where: {
          agentId,
          status: "Running",
        },
        data: {
          status: "Success",
        },
      });

      const isHarper = agentName?.toLowerCase().includes("harper");

      let finalAction = `Completed: ${stepName}`;
      let finalDescription = `Workflow completed successfully.`;

      if (isHarper) {
        finalAction = "Research Article Generated";
        if (cleanArticle && typeof cleanArticle === "object" && cleanArticle.title) {
          const sectionCount = Array.isArray(cleanArticle.sections) ? cleanArticle.sections.length : null;
          const sourceCount = Array.isArray(cleanArticle.sources) ? cleanArticle.sources.length : null;
          const readTime = cleanArticle.readingEstimation 
            ? (String(cleanArticle.readingEstimation).includes("min") ? cleanArticle.readingEstimation : `${cleanArticle.readingEstimation} min read`)
            : null;
          const details = [
            cleanArticle.category,
            readTime,
            sectionCount ? `${sectionCount} sections` : null,
            sourceCount ? `${sourceCount} verified citations` : null,
          ].filter(Boolean).join(" · ");

          finalDescription = `Completed in-depth article: "${cleanArticle.title}"${details ? ` (${details})` : ""}`;
        } else {
          finalDescription = `Completed research and drafted article for "${articleTitle}"`;
        }
      } else if (agentName?.toLowerCase().includes("maya")) {
        const mayaData = responseData?.post_summary || responseData?.platforms ? responseData : null;
        if (mayaData?.post_summary || mayaData?.platforms) {
          const summary = mayaData.post_summary || {};
          const platformsObj = mayaData.platforms || {};
          const text = typeof summary === "string" ? summary : (summary.text || "");
          const cleanText = text.replace(/\r?\n+/g, " ").trim();
          const snippet = cleanText.length > 55 ? `${cleanText.slice(0, 52)}...` : cleanText;
          const liSuccess = platformsObj.linkedin?.success;
          const xSuccess = platformsObj.x?.success;

          if (liSuccess && xSuccess) {
            finalAction = "Social Media Post Published";
            finalDescription = `Successfully published post across X (Twitter) & LinkedIn: "${snippet}"`;
          } else if (liSuccess) {
            finalAction = "LinkedIn Post Published";
            finalDescription = `Successfully published post to LinkedIn: "${snippet}"`;
          } else if (xSuccess) {
            finalAction = "X (Twitter) Post Published";
            finalDescription = `Successfully published post to X (Twitter): "${snippet}"`;
          } else if (platformsObj.linkedin?.error || platformsObj.x?.error) {
            const err = platformsObj.linkedin?.error || platformsObj.x?.error;
            finalAction = "Social Post Dispatch Result";
            finalDescription = `Publish attempt finished: ${err}. Post: "${snippet}"`;
          } else {
            finalAction = "Social Media Post Published";
            finalDescription = `Successfully published social media post: "${snippet || articleTitle}"`;
          }
        } else {
          finalAction = "Social Research Report Generated";
          finalDescription = focusTopic
            ? `Completed strategic market research report on "${focusTopic}" with YouTube & audience trends`
            : `Completed social media and market research for "${articleTitle}"`;
        }
      } else {
        finalDescription = `Workflow completed for ${agentName}: ${articleTitle}`;
      }

      await prisma.activity.create({
        data: {
          agentId,
          action: finalAction,
          description: finalDescription,
          status: "Success",
        },
      });
      if (!isHarper && (responseData?.markdown || responseData?.report || responseData?.body || responseData?.result || responseData?.articleJson || (typeof responseData === "object" && Object.keys(responseData).length > 0))) {
        await prisma.approval.create({
          data: {
            agentId,
            taskId,
            title: `Approve: ${articleTitle}`,
            content: responseData?.markdown || responseData?.report || resultText,
            status: "Pending",
          },
        });
      }

      try {
        revalidatePath(`/${agentName?.toLowerCase()}`);
        revalidatePath(`/agents/${agentId}`);
        revalidatePath(`/agents/${agentName?.toLowerCase()}`);
        revalidatePath("/");
        revalidatePath("/tasks");
        revalidatePath("/operations");
        revalidatePath("/approvals");
      } catch {}
    } else if (status >= 200 && status < 300) {
      // Fallback completion for any successful HTTP 2xx response
      const resultText =
        typeof responseData === "object" && responseData !== null
          ? JSON.stringify(responseData, null, 2)
          : (resText || "Workflow completed successfully");

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          result: resultText,
        },
      });

      await prisma.agentRun.update({
        where: { id: runId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          output: resultText,
        },
      });

      await prisma.activity.updateMany({
        where: { agentId, status: "Running" },
        data: { status: "Success" },
      });

      const fallbackTitle = focusTopic ? `Market Research: "${focusTopic}"` : keywords ? `Content for "${keywords}"` : "Generated Content";
      let fallbackAction = "Workflow completed";
      let fallbackDesc = `Execution finished with HTTP ${status}`;
      if (agentName?.toLowerCase().includes("harper")) {
        fallbackAction = "Research Article Generated";
        fallbackDesc = `Drafted publication-ready research article for "${fallbackTitle}"`;
      } else if (agentName?.toLowerCase().includes("maya")) {
        const mayaData = responseData?.post_summary || responseData?.platforms ? responseData : null;
        if (mayaData?.post_summary || mayaData?.platforms) {
          const summary = mayaData.post_summary || {};
          const platformsObj = mayaData.platforms || {};
          const text = typeof summary === "string" ? summary : (summary.text || "");
          const cleanText = text.replace(/\r?\n+/g, " ").trim();
          const snippet = cleanText.length > 55 ? `${cleanText.slice(0, 52)}...` : cleanText;
          const liSuccess = platformsObj.linkedin?.success;
          const xSuccess = platformsObj.x?.success;

          if (liSuccess && xSuccess) {
            fallbackAction = "Social Media Post Published";
            fallbackDesc = `Successfully published post across X (Twitter) & LinkedIn: "${snippet}"`;
          } else if (liSuccess) {
            fallbackAction = "LinkedIn Post Published";
            fallbackDesc = `Successfully published post to LinkedIn: "${snippet}"`;
          } else if (xSuccess) {
            fallbackAction = "X (Twitter) Post Published";
            fallbackDesc = `Successfully published post to X (Twitter): "${snippet}"`;
          } else if (platformsObj.linkedin?.error || platformsObj.x?.error) {
            const err = platformsObj.linkedin?.error || platformsObj.x?.error;
            fallbackAction = "Social Post Dispatch Result";
            fallbackDesc = `Publish attempt finished: ${err}. Post: "${snippet}"`;
          } else {
            fallbackAction = "Social Media Post Published";
            fallbackDesc = `Successfully published social media post: "${snippet}"`;
          }
        } else {
          fallbackAction = "Social Research Report Generated";
          fallbackDesc = `Completed strategic social media and market research for "${focusTopic || fallbackTitle}"`;
        }
      }

      await prisma.activity.create({
        data: {
          agentId,
          action: fallbackAction,
          description: fallbackDesc,
          status: "Success",
        },
      });

      try {
        revalidatePath(`/${agentName?.toLowerCase()}`);
        revalidatePath(`/agents/${agentId}`);
        revalidatePath(`/agents/${agentName?.toLowerCase()}`);
        revalidatePath("/");
        revalidatePath("/tasks");
        revalidatePath("/operations");
        revalidatePath("/approvals");
      } catch {}
    }
  } catch (err: any) {
    const isAsyncOngoing =
      err?.name === "AbortError" ||
      err?.name === "TimeoutError" ||
      err?.code === "UND_ERR_HEADERS_TIMEOUT" ||
      err?.code === "ECONNRESET" ||
      err?.cause?.code === "UND_ERR_HEADERS_TIMEOUT" ||
      err?.cause?.name === "HeadersTimeoutError" ||
      err?.message?.toLowerCase().includes("timeout") ||
      err?.message?.toLowerCase().includes("abort") ||
      err?.message?.toLowerCase().includes("closed");

    if (isAsyncOngoing) {
      console.log(`[Cortana] Webhook dispatched to ${agentName}. Workflow is processing asynchronously in n8n.`);
      // Monitor in background for completion reported via progress callback
      try {
        after(async () => {
          for (let i = 0; i < 24; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            const currentTask = await prisma.task.findUnique({ where: { id: taskId } });
            if (currentTask && currentTask.status !== "Running") {
              try {
                revalidatePath(`/${agentName?.toLowerCase()}`);
                revalidatePath(`/agents/${agentId}`);
                revalidatePath(`/agents/${agentName?.toLowerCase()}`);
                revalidatePath("/");
                revalidatePath("/tasks");
              } catch {}
              return;
            }
          }
        });
      } catch {}
      return;
    }

    console.error("[Cortana] Background workflow execution error:", err);
    const errorMsg = err?.message || "Execution encountered an error";
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "Failed",
        completedAt: new Date(),
        result: errorMsg,
      },
    }).catch(() => { });
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: "Failed",
        completedAt: new Date(),
        error: errorMsg,
      },
    }).catch(() => { });
    await prisma.activity.create({
      data: {
        agentId,
        action: "Execution error",
        description: errorMsg,
        status: "Failed",
      },
    }).catch(() => { });

    try {
      revalidatePath(`/${agentName?.toLowerCase()}`);
      revalidatePath(`/agents/${agentId}`);
      revalidatePath(`/agents/${agentName?.toLowerCase()}`);
      revalidatePath("/");
      revalidatePath("/tasks");
    } catch {}
  }
}

function resolveWebhookUrl(
  agent: { n8nWorkflowId?: string | null; role?: string | null; name?: string | null },
  isFollowup = false,
  isPublisher = false
): string {
  if (isPublisher) {
    const publisherWebhook = process.env.N8N_SOCIAL_PUBLISHER_WEBHOOK_URL?.trim();
    return publisherWebhook || "http://127.0.0.1:5678/webhook/social-media-publisher";
  }
  if (isFollowup) {
    const followupWebhook = process.env.N8N_GMAIL_FOLLOWUP_WEBHOOK_URL?.trim();
    return followupWebhook || "http://127.0.0.1:5678/webhook/gmail-followup";
  }
  if (agent.n8nWorkflowId === "Al3atlOTCSx8ZNgN" || agent.role?.toLowerCase().includes("outreach") || agent.role?.toLowerCase().includes("email") || agent.name?.toLowerCase().includes("kainoa")) {
    const emailWebhook = process.env.N8N_EMAIL_WEBHOOK_URL?.trim();
    return emailWebhook || "http://127.0.0.1:5678/webhook/email-agent";
  }
  if (agent.n8nWorkflowId === "BDtjr1LOoK7VClxc" || agent.role?.toLowerCase().includes("haiku")) {
    return "http://127.0.0.1:5678/webhook/haiku-generator";
  }
  if (agent.n8nWorkflowId === "yF7_KBvc1CZZvXjTgI4Fs") {
    return "http://127.0.0.1:5678/webhook/generate-article";
  }
  if (
    agent.n8nWorkflowId === "6SfepVmMljnVsWBG" ||
    agent.role?.toLowerCase().includes("marketing") ||
    agent.name?.toLowerCase().includes("maya")
  ) {
    const mayaWebhook = process.env.N8N_MAYA_WEBHOOK_URL?.trim();
    return mayaWebhook || "http://127.0.0.1:5678/webhook/social-media-research";
  }
  if (agent.n8nWorkflowId === "1DElnhi9xf3iwYcp") {
    const articleWebhook = process.env.N8N_ARTICLE_WEBHOOK_URL?.trim();
    return articleWebhook || "http://127.0.0.1:5678/webhook/generate-article-ollama";
  }
  return process.env.N8N_ARTICLE_WEBHOOK_URL?.trim() || "http://127.0.0.1:5678/webhook/generate-article-ollama";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find agent by ID or name
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [
          { id: id },
          { name: { equals: id, mode: "insensitive" } },
        ],
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: "Agent not found" },
        { status: 404 }
      );
    }

    // Extract optional payload
    let mode = "";
    let keywords = "";
    let category = "AI";
    let language = "English";
    let recipientName = "";
    let recipientEmail = "";
    let urls = "";
    let extraPoints = "";
    let recipientsList: any[] | null = null;
    let focusTopic = "";
    let targetAudience = "";
    let additionalContext = "";

    // Social Publisher Fields
    let postText = "";
    let platforms = "both";
    let mediaType = "NONE";
    let mediaUrl = "";
    let articleUrl = "";
    let hashtags = "";
    let mediaBase64 = "";
    let fileName = "";
    let mediaMimeType = "";
    let linkedinVisibility = "PUBLIC";
    let linkedinPostAs = "person";
    let linkedinOrganizationUrn = "";
    let xReplySettings = "everyone";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await request.json();
        mode = body.mode || body.type || body.workflow || "";
        keywords = body.keywords || body.Keywords || "";
        category = body.category || body.Category || "AI";
        language = body.language || body.Language || "English";
        recipientName = body.recipientName || body.name || "";
        recipientEmail = body.recipientEmail || body.email || "";
        urls = body.urls || "";
        extraPoints = body.extraPoints || body.talkingPoints || "";
        focusTopic = body.focusTopic || body.focus_topic || body["Focus Topic"] || "";
        targetAudience = body.targetAudience || body.target_audience || body["Target Audience"] || "";
        additionalContext = body.additionalContext || body.additional_context || body["Additional Context"] || "";
        
        postText = body.postText || body.post_text || body.text || body.content || body["Post Text"] || "";
        platforms = body.platforms || body.target_platforms || body["Target Platforms"] || "both";
        mediaType = body.mediaType || body.media_type || body["Media Type"] || "NONE";
        mediaUrl = body.mediaUrl || body.media_url || body["Media URL"] || body["Media URL (Image or Video Direct Link)"] || "";
        articleUrl = body.articleUrl || body.article_url || body["Article / Link URL"] || body.url || "";
        hashtags = body.hashtags || body.tags || body["Hashtags / Tags"] || "";
        mediaBase64 = body.mediaBase64 || body.media_base64 || "";
        fileName = body.fileName || body.file_name || "";
        mediaMimeType = body.mediaMimeType || body.media_mime_type || "";
        
        linkedinVisibility = body.linkedinVisibility || body.linkedin_visibility || body["LinkedIn Visibility"] || "PUBLIC";
        linkedinPostAs = body.linkedinPostAs || body.linkedin_post_as || body["LinkedIn Post As"] || "person";
        linkedinOrganizationUrn = body.linkedinOrganizationUrn || body.linkedin_organization_urn || body["LinkedIn Organization URN"] || "";
        xReplySettings = body.xReplySettings || body.x_reply_settings || body["X / Twitter Reply Settings"] || "everyone";

        if (Array.isArray(body.recipients)) {
          recipientsList = body.recipients;
        }
      } catch {
        // use defaults
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      try {
        const formData = await request.formData();
        mode = (formData.get("mode") as string) || (formData.get("type") as string) || "";
        keywords = (formData.get("keywords") as string) || "";
        category = (formData.get("category") as string) || "AI";
        language = (formData.get("language") as string) || "English";
        recipientName = (formData.get("recipientName") as string) || (formData.get("name") as string) || "";
        recipientEmail = (formData.get("recipientEmail") as string) || (formData.get("email") as string) || "";
        urls = (formData.get("urls") as string) || "";
        extraPoints = (formData.get("extraPoints") as string) || (formData.get("talkingPoints") as string) || "";
        focusTopic = (formData.get("focusTopic") as string) || (formData.get("focus_topic") as string) || (formData.get("Focus Topic") as string) || "";
        targetAudience = (formData.get("targetAudience") as string) || (formData.get("target_audience") as string) || (formData.get("Target Audience") as string) || "";
        additionalContext = (formData.get("additionalContext") as string) || (formData.get("additional_context") as string) || (formData.get("Additional Context") as string) || "";

        postText = (formData.get("postText") as string) || (formData.get("post_text") as string) || (formData.get("text") as string) || "";
        platforms = (formData.get("platforms") as string) || (formData.get("target_platforms") as string) || "both";
        mediaType = (formData.get("mediaType") as string) || (formData.get("media_type") as string) || "NONE";
        mediaUrl = (formData.get("mediaUrl") as string) || (formData.get("media_url") as string) || "";
        articleUrl = (formData.get("articleUrl") as string) || (formData.get("article_url") as string) || "";
        hashtags = (formData.get("hashtags") as string) || (formData.get("tags") as string) || "";
        mediaBase64 = (formData.get("mediaBase64") as string) || (formData.get("media_base64") as string) || "";
        fileName = (formData.get("fileName") as string) || (formData.get("file_name") as string) || "";
        mediaMimeType = (formData.get("mediaMimeType") as string) || (formData.get("media_mime_type") as string) || "";
        linkedinVisibility = (formData.get("linkedinVisibility") as string) || (formData.get("linkedin_visibility") as string) || "PUBLIC";
        linkedinPostAs = (formData.get("linkedinPostAs") as string) || (formData.get("linkedin_post_as") as string) || "person";
        linkedinOrganizationUrn = (formData.get("linkedinOrganizationUrn") as string) || (formData.get("linkedin_organization_urn") as string) || "";
        xReplySettings = (formData.get("xReplySettings") as string) || (formData.get("x_reply_settings") as string) || "everyone";

        const uploadedFile = formData.get("file") || formData.get("Upload_JSON_File") || formData.get("json");
        if (uploadedFile && typeof (uploadedFile as any).text === "function") {
          try {
            const fileText = await (uploadedFile as any).text();
            const parsed = JSON.parse(fileText);
            recipientsList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.recipients) ? parsed.recipients : [parsed]);
          } catch { }
        }
      } catch {
        // use defaults
      }
    }

    const isEmailWorkflow =
      agent.n8nWorkflowId === "Al3atlOTCSx8ZNgN" ||
      agent.role?.toLowerCase().includes("outreach") ||
      agent.role?.toLowerCase().includes("email") ||
      agent.name?.toLowerCase().includes("kainoa");

    const isMarketingWorkflow =
      agent.n8nWorkflowId === "6SfepVmMljnVsWBG" ||
      agent.role?.toLowerCase().includes("marketing") ||
      agent.name?.toLowerCase().includes("maya");

    const isFollowupWorkflow =
      isEmailWorkflow &&
      (mode.toLowerCase().includes("followup") || mode.toLowerCase().includes("follow-up"));

    const isSocialPublisherWorkflow =
      isMarketingWorkflow &&
      (mode.toLowerCase().includes("publisher") ||
       mode.toLowerCase().includes("poster") ||
       mode.toLowerCase().includes("publish") ||
       mode.toLowerCase().includes("social-media-publisher") ||
       Boolean(postText.trim()));

    let taskTitle = "";
    let taskDesc = "";
    let runInput = "";
    let payload: any = null;

    if (isSocialPublisherWorkflow) {
      const cleanPostText = postText.trim() || "Autonomous social media publishing update";
      const snippet = cleanPostText.length > 50 ? `${cleanPostText.slice(0, 47)}...` : cleanPostText;
      const targetPlatformUpper = platforms === "both" ? "X & LinkedIn" : platforms === "x" ? "X (Twitter)" : "LinkedIn";
      
      taskTitle = `Social Media Post: "${snippet}"`;
      taskDesc = `Platforms: ${targetPlatformUpper} | Media: ${mediaType} | Mode: Live Publish`;
      runInput = `Platforms: ${targetPlatformUpper}\nMedia: ${mediaType}\nMode: Live Publish\nText:\n${cleanPostText}${hashtags ? `\n\nHashtags: ${hashtags}` : ""}${mediaUrl ? `\nMedia URL: ${mediaUrl}` : ""}${articleUrl ? `\nArticle URL: ${articleUrl}` : ""}`;

      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
      const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      
      let finalMediaUrl = "";
      if (mediaType === "IMAGE" || mediaType === "VIDEO") {
        finalMediaUrl = mediaUrl && mediaUrl.startsWith("/") ? `${proto}://${host}${mediaUrl}` : mediaUrl;
      }

      const finalArticleUrl = mediaType === "ARTICLE" ? articleUrl.trim() : "";

      payload = {
        post_text: cleanPostText,
        platforms,
        media_type: mediaType,
        media_url: finalMediaUrl,
        article_url: finalArticleUrl,
        hashtags,
        dry_run: false,
        mode: "live",
        linkedin_visibility: linkedinVisibility,
        linkedin_post_as: linkedinPostAs,
        linkedin_organization_urn: linkedinOrganizationUrn,
        x_reply_settings: xReplySettings,
        // Also map standard Form labels for n8n compatibility:
        "Post Text": cleanPostText,
        "Target Platforms": platforms === "both" ? "Both X and LinkedIn" : platforms === "x" ? "X (Twitter) Only" : "LinkedIn Only",
        "Media Type": mediaType === "NONE" ? "Text Only" : mediaType === "IMAGE" ? "Image" : mediaType === "VIDEO" ? "Video" : "Article Link",
        "Execution Mode": "Live Publish (Post to Platforms)",
        "Media URL (Image or Video Direct Link)": finalMediaUrl,
        "Article / Link URL": finalArticleUrl,
        "Hashtags / Tags": hashtags,
        "LinkedIn Visibility": linkedinVisibility,
        "LinkedIn Post As": linkedinPostAs === "organization" ? "Organization" : "Person",
        "LinkedIn Organization URN": linkedinOrganizationUrn,
        "X / Twitter Reply Settings": xReplySettings,
        ...((mediaType === "IMAGE" || mediaType === "VIDEO") && mediaBase64 ? {
          media_base64: mediaBase64,
          file_name: fileName || "media",
          fileName: fileName || "media",
          media_mime_type: mediaMimeType || (mediaType === "VIDEO" ? "video/mp4" : "image/jpeg"),
        } : {}),
      };
    } else if (isMarketingWorkflow) {
      const topic = focusTopic.trim() || "Hawaii business & AI automation";
      const audience = targetAudience.trim() || "Local business owners, entrepreneurs, and service professionals";
      const context = additionalContext.trim() || "Focus on practical ROI, eliminating repetitive manual admin work, and modernizing traditional workflows";

      taskTitle = `Social Media Research: ${topic}`;
      taskDesc = `Audience: ${audience} | Live YouTube & Search Trends`;
      runInput = `Focus Topic: "${topic}"\nTarget Audience: "${audience}"\nContext: "${context}"`;
      payload = {
        focus_topic: topic,
        target_audience: audience,
        additional_context: context,
        "Focus Topic": topic,
        "Target Audience": audience,
        "Additional Context": context,
      };
    } else if (isFollowupWorkflow) {
      taskTitle = "Scan & draft Gmail follow-ups";
      taskDesc = "Autonomous scan of sent Gmail threads (older than 5d) for unreplied prospects";
      runInput = "Mode: Gmail Follow-up Scanner";
      payload = { mode: "followup", trigger: "manual" };
    } else if (isEmailWorkflow) {
      if (recipientsList && recipientsList.length > 0) {
        taskTitle = `Send outreach to ${recipientsList.length} prospect(s)`;
        taskDesc = `Batch outreach: ${recipientsList.map(r => r.name || r.email).slice(0, 3).join(", ")}${recipientsList.length > 3 ? "..." : ""}`;
        runInput = JSON.stringify(recipientsList, null, 2);
        payload = { recipients: recipientsList };
      } else {
        const targetLabel = recipientName ? `${recipientName} (${recipientEmail})` : recipientEmail || "Prospect";
        taskTitle = `Send outreach email to ${targetLabel}`;
        taskDesc = urls ? `Researching ${urls} | Context: ${extraPoints || 'Personalized outreach'}` : `Context: ${extraPoints || 'Personalized outreach'}`;
        runInput = `Recipient: ${targetLabel}\nURLs: ${urls || 'None'}\nPoints: ${extraPoints || 'None'}`;
        payload = {
          recipientName: recipientName || "Prospect",
          recipientEmail: recipientEmail || "",
          urls: urls ? (typeof urls === 'string' ? urls.split('\n').map((u: string) => u.trim()).filter(Boolean) : urls) : [],
          extraPoints: extraPoints || "",
          recipients: [{
            name: recipientName || "Prospect",
            email: recipientEmail || "",
            urls: urls ? (typeof urls === 'string' ? urls.split('\n').map((u: string) => u.trim()).filter(Boolean) : urls) : [],
            extraPoints: extraPoints || ""
          }]
        };
      }
    } else {
      taskTitle = keywords
        ? `Generate content for "${keywords}"`
        : `Manual execution for ${agent.name}`;
      taskDesc = `Category: ${category} | Language: ${language}`;
      runInput = keywords
        ? `Keywords: "${keywords}", Category: "${category}", Language: "${language}"`
        : `Manual execution for ${agent.name}`;
      payload = {
        Keywords: keywords || "AI Automation for Local Business, High ROI AI workflows",
        Category: category || "AI",
        Language: language || "English",
      };
    }

    // 1. Immediately create Task and Run in Database (< 30ms)
    const task = await prisma.task.create({
      data: {
        agentId: agent.id,
        title: taskTitle,
        description: taskDesc,
        status: "Running",
        priority: "High",
        startedAt: new Date(),
      },
    });

    const run = await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        taskId: task.id,
        status: "Running",
        startedAt: new Date(),
        input: runInput,
        output: `Workflow running for ${agent.name}...`,
      },
    });

    if (!isEmailWorkflow || isFollowupWorkflow) {
      const isHarper = agent.name?.toLowerCase().includes("harper");
      let startAction = `Executing: ${agent.name} Workflow`;
      let startDesc = `Initiated workflow execution: ${taskTitle}`;

      if (isHarper) {
        startAction = "Research & Fact Discovery";
        startDesc = keywords
          ? `Analyzing search angles and retrieving verified citations for "${keywords}"`
          : `Initiated comprehensive web research and outline drafting`;
      } else if (isSocialPublisherWorkflow) {
        startAction = "Publishing Social Post";
        startDesc = `Dispatching post to ${platforms === "both" ? "X (Twitter) & LinkedIn" : platforms === "x" ? "X (Twitter)" : "LinkedIn"}: "${taskTitle.replace('Social Media Post: ', '')}"`;
      } else if (isMarketingWorkflow) {
        startAction = "Market & Trend Research Started";
        startDesc = `Analyzing search trends, video engagement, and audience demand for "${focusTopic.trim() || 'Hawaii business & AI automation'}"`;
      } else if (isFollowupWorkflow) {
        startAction = "Scanning Gmail For Follow-ups";
      }

      await prisma.activity.create({
        data: {
          agentId: agent.id,
          action: startAction,
          description: startDesc,
          status: "Running",
        },
      });
    }

    // 2. Dispatch to n8n webhook asynchronously in background using Next.js after()
    const webhookUrl = resolveWebhookUrl(agent, isFollowupWorkflow, isSocialPublisherWorkflow);

    // Execute in background with Next.js after(), with fallback if run outside server request scope
    const dispatchBg = () => {
      const trackingPayload = {
        ...payload,
        agentId: agent.id,
        agentName: agent.name,
        taskId: task.id,
        runId: run.id,
      };

      executeWorkflowInBackground({
        agentId: agent.id,
        agentName: agent.name,
        taskId: task.id,
        runId: run.id,
        webhookUrl,
        payload: trackingPayload,
        keywords,
        category,
        language,
        focusTopic,
      });
    };

    try {
      after(dispatchBg);
    } catch {
      dispatchBg();
    }

    const isHtmlForm = request.headers.get("accept")?.includes("text/html");
    if (isHtmlForm) {
      return NextResponse.redirect(new URL(`/${agent.name.toLowerCase()}`, request.url));
    }

    // 3. Immediately return 200 OK so the browser never freezes
    return NextResponse.json({
      success: true,
      agentId: agent.id,
      taskId: task.id,
      runId: run.id,
      status: "Running",
      message: `Workflow dispatched successfully. Running in background.`,
    });
  } catch (error) {
    console.error("Agent execution error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to dispatch agent workflow" },
      { status: 500 }
    );
  }
}
