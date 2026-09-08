import { NextResponse, after } from "next/server";
import http from "node:http";
import https from "node:https";
import { prisma } from "@/lib/prisma";

// Custom HTTP request using built-in node:http with no artificial socket timeouts
function postJson(urlStr: string, data: any): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === "https:" ? https : http;
      const bodyStr = JSON.stringify(data);

      const req = client.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr),
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
          } catch {}
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
      const articleTitle = cleanArticle?.title || responseData?.title || (keywords ? `Haiku / Content for "${keywords}"` : "Generated Content");

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

      await prisma.activity.create({
        data: {
          agentId,
          action: `Completed: ${stepName}`,
          description: nodesList
            ? `Workflow completed. Executed nodes:\n${nodesList.map((n: string, i: number) => `${i + 1}. ${n}`).join('\n')}\n\nOutput:\n${resultText}`
            : `Workflow completed with output:\n${resultText}`,
          status: "Success",
        },
      });

      const isHarper = agentName?.toLowerCase().includes("harper");
      if (!isHarper && (responseData?.markdown || responseData?.body || responseData?.result || responseData?.articleJson || (typeof responseData === "object" && Object.keys(responseData).length > 0))) {
        await prisma.approval.create({
          data: {
            agentId,
            taskId,
            title: `Approve: ${articleTitle}`,
            content: responseData?.markdown || resultText,
            status: "Pending",
          },
        });
      }
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
      // Do NOT mark as failed since n8n is actively running
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
    }).catch(() => {});
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: "Failed",
        completedAt: new Date(),
        error: errorMsg,
      },
    }).catch(() => {});
    await prisma.activity.create({
      data: {
        agentId,
        action: "Execution error",
        description: errorMsg,
        status: "Failed",
      },
    }).catch(() => {});
  }
}

function resolveWebhookUrl(agent: { n8nWorkflowId?: string | null; role?: string | null; name?: string | null }): string {
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
    let keywords = "";
    let category = "AI";
    let language = "English";
    let recipientName = "";
    let recipientEmail = "";
    let urls = "";
    let extraPoints = "";
    let recipientsList: any[] | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await request.json();
        keywords = body.keywords || body.Keywords || "";
        category = body.category || body.Category || "AI";
        language = body.language || body.Language || "English";
        recipientName = body.recipientName || body.name || "";
        recipientEmail = body.recipientEmail || body.email || "";
        urls = body.urls || "";
        extraPoints = body.extraPoints || body.talkingPoints || "";
        if (Array.isArray(body.recipients)) {
          recipientsList = body.recipients;
        }
      } catch {
        // use defaults
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      try {
        const formData = await request.formData();
        keywords = (formData.get("keywords") as string) || "";
        category = (formData.get("category") as string) || "AI";
        language = (formData.get("language") as string) || "English";
        recipientName = (formData.get("recipientName") as string) || (formData.get("name") as string) || "";
        recipientEmail = (formData.get("recipientEmail") as string) || (formData.get("email") as string) || "";
        urls = (formData.get("urls") as string) || "";
        extraPoints = (formData.get("extraPoints") as string) || (formData.get("talkingPoints") as string) || "";

        const uploadedFile = formData.get("file") || formData.get("Upload_JSON_File") || formData.get("json");
        if (uploadedFile && typeof (uploadedFile as any).text === "function") {
          try {
            const fileText = await (uploadedFile as any).text();
            const parsed = JSON.parse(fileText);
            recipientsList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.recipients) ? parsed.recipients : [parsed]);
          } catch {}
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

    let taskTitle = "";
    let taskDesc = "";
    let runInput = "";
    let payload: any = null;

    if (isEmailWorkflow) {
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

    if (!isEmailWorkflow) {
      await prisma.activity.create({
        data: {
          agentId: agent.id,
          action: `Executing: ${agent.name} Workflow`,
          description: `Initiated workflow execution: ${taskTitle}`,
          status: "Running",
        },
      });
    }

    // 2. Dispatch to n8n webhook asynchronously in background using Next.js after()
    const webhookUrl = resolveWebhookUrl(agent);

    // Execute in background with Next.js after()
    after(() => {
      executeWorkflowInBackground({
        agentId: agent.id,
        agentName: agent.name,
        taskId: task.id,
        runId: run.id,
        webhookUrl,
        payload,
        keywords,
        category,
        language,
      });
    });

    const isHtmlForm = request.headers.get("accept")?.includes("text/html");
    if (isHtmlForm) {
      return NextResponse.redirect(new URL(`/agents/${agent.id}`, request.url));
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
