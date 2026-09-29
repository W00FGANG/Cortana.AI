import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      agentId,
      agentName = "Harper",
      step = "Processing workflow step",
      status = "Running",
      description,
      output,
      error,
      runId,
      taskId,
      markdown,
      article,
      jsonOutput,
      articleJson,
      title,
      slug,
    } = body;

    // 1. Find the agent by ID or Name
    const agent = await prisma.agent.findFirst({
      where: agentId
        ? { id: agentId }
        : { name: { equals: agentName, mode: "insensitive" } },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: `Agent '${agentName || agentId}' not found.` },
        { status: 404 }
      );
    }

    const isFinished = status === "Completed" || status === "Failed";
    const activityStatus =
      status === "Completed"
        ? "Success"
        : status === "Failed"
        ? "Failed"
        : "Running";

    // Format the stored output (if full article / JSON is provided)
    const finalMarkdown = markdown || article || "";
    const finalJson = typeof articleJson === "object" 
      ? JSON.stringify(articleJson, null, 2) 
      : (typeof jsonOutput === "string" ? jsonOutput : (jsonOutput ? JSON.stringify(jsonOutput, null, 2) : ""));

    // 2. Resolve agent type
    const isKainoa =
      agent.name.toLowerCase().includes("kainoa") ||
      agent.role.toLowerCase().includes("outreach") ||
      agent.role.toLowerCase().includes("email");

    const isDraftingStep = step?.toLowerCase().includes("draft");

    let combinedOutput = output || `Step: ${step}`;
    if (finalMarkdown || finalJson) {
      combinedOutput = JSON.stringify({
        title: title || articleJson?.title || "Article Output",
        slug: slug || articleJson?.slug || "article-output",
        markdown: finalMarkdown,
        jsonOutput: finalJson,
        completedAt: new Date().toISOString(),
      });
    } else if (body.sentEmails) {
      const list = Array.isArray(body.sentEmails) ? body.sentEmails : [body.sentEmails];
      const emails = list.map((item: any) =>
        typeof item === "string" ? item : (item.email || item.recipientEmail || String(item))
      );
      combinedOutput = JSON.stringify(emails, null, 2);
    } else if (isKainoa && output) {
      try {
        const parsed = JSON.parse(output);
        if (Array.isArray(parsed)) {
          const emails = parsed.map((item: any) =>
            typeof item === "string" ? item : (item.email || item.recipientEmail || String(item))
          );
          combinedOutput = JSON.stringify(emails, null, 2);
        }
      } catch {}
    }

    // 2. If finished, resolve previous Running activities for this agent
    if (isFinished) {
      await prisma.activity.updateMany({
        where: {
          agentId: agent.id,
          status: "Running",
        },
        data: {
          status: status === "Completed" ? "Success" : "Failed",
        },
      });
    }

    // Log step execution in Supabase Activity stream
    // For Kainoa, strictly only log the drafting step (the approval step is recorded upon review)
    let activity = null;
    if (!isKainoa) {
      const rawAction = status === "Completed" 
        ? `Completed: ${step || 'Article Generation'}` 
        : status === "Failed" 
        ? `Failed step: ${step}` 
        : `Executing: ${step}`;
      const rawDesc = description || (title ? `Generated "${title}"` : `Executing: ${step}`);

      const isHarper = agent.name.toLowerCase().includes("harper");
      let humanAction = rawAction;
      let humanDesc = rawDesc;

      if (isHarper) {
        const topicOrTitle = title || (description && description.match(/"([^"]+)"/)?.[1]) || "";
        const topicSuffix = topicOrTitle ? ` for "${topicOrTitle}"` : "";

        if (status === "Completed") {
          humanAction = "Research Article Generated";
          humanDesc = title
            ? `Completed in-depth article: "${title}" with citations & key takeaways`
            : (topicOrTitle ? `Completed in-depth research article on "${topicOrTitle}" with verified web citations` : "Completed comprehensive research article with verified web citations");
        } else if (step?.toLowerCase().includes("keyword")) {
          humanAction = "Analyzing Topic Keywords";
          humanDesc = `Evaluating search queries and identifying technical angles${topicSuffix}`;
        } else if ((/\bsearch\b/i.test(step || "") && !step?.toLowerCase().includes("research")) || step?.toLowerCase().includes("citation") || step?.toLowerCase().includes("collect")) {
          humanAction = "Gathering Web Citations";
          humanDesc = `Retrieving live web reference data and verifying citations${topicSuffix}`;
        } else if (step?.toLowerCase().includes("outline") || step?.toLowerCase().includes("analyz")) {
          humanAction = "Structuring Article Layout";
          humanDesc = `Organizing section hierarchy and key takeaways${topicSuffix}`;
        } else if (step?.toLowerCase().includes("draft") || step?.toLowerCase().includes("writ")) {
          humanAction = "Writing Article Draft";
          humanDesc = `Composing publication draft with citations and SEO tags${topicSuffix}`;
        }
      }

      const isMaya = agent.name.toLowerCase().includes("maya");
      if (isMaya) {
        const topicOrTitle = title || (description && description.match(/"([^"]+)"/)?.[1]) || "";
        const topicSuffix = topicOrTitle ? ` for "${topicOrTitle}"` : "";

        if (status === "Completed") {
          humanAction = "Social Research Report Generated";
          humanDesc = topicOrTitle
            ? `Completed strategic market research report for "${topicOrTitle}"`
            : "Completed strategic social media and trend research report";
        } else if (step?.toLowerCase().includes("video") || step?.toLowerCase().includes("youtube")) {
          humanAction = "Analyzing Video & Content Trends";
          humanDesc = `Evaluating YouTube video engagement and popular formats${topicSuffix}`;
        } else if (step?.toLowerCase().includes("trend") || step?.toLowerCase().includes("search")) {
          humanAction = "Evaluating Search & Trend Signals";
          humanDesc = `Synthesizing search volume and audience interest signals${topicSuffix}`;
        } else if (step?.toLowerCase().includes("audience") || step?.toLowerCase().includes("competitor")) {
          humanAction = "Audience & Opportunity Mapping";
          humanDesc = `Mapping high-converting audience angles and competitor gaps${topicSuffix}`;
        }
      }

      activity = await prisma.activity.create({
        data: {
          agentId: agent.id,
          action: humanAction,
          description: humanDesc,
          status: activityStatus,
        },
      });
    } else if (isDraftingStep) {
      await prisma.activity.updateMany({
        where: { agentId: agent.id, status: "Running" },
        data: { status: "Success" },
      });

      activity = await prisma.activity.create({
        data: {
          agentId: agent.id,
          action: "Drafting Outreach Email",
          description: description || "Synthesizing prospect research & generating personalized email via Gemini AI",
          status: "Running",
        },
      });
    }

    // 3. Find active AgentRun to update, or use specified runId
    let run = runId
      ? await prisma.agentRun.findUnique({ where: { id: runId } })
      : await prisma.agentRun.findFirst({
          where: {
            agentId: agent.id,
            status: "Running",
          },
          orderBy: { startedAt: "desc" },
        });

    if (run) {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: isFinished ? status : "Running",
          output: combinedOutput,
          error: error || (status === "Failed" ? description : null),
          completedAt: isFinished ? new Date() : null,
        },
      });

      // If there's an associated Task, update it as well
      const activeTaskId = taskId || run.taskId;
      if (activeTaskId) {
        await prisma.task.update({
          where: { id: activeTaskId },
          data: {
            status: isFinished ? (status === "Completed" ? "Completed" : "Failed") : "Running",
            completedAt: isFinished ? new Date() : null,
            result: combinedOutput,
          },
        });
      }
    } else {
      // Create new run record if none was actively running
      run = await prisma.agentRun.create({
        data: {
          agentId: agent.id,
          status: status === "Completed" ? "Completed" : status === "Failed" ? "Failed" : "Running",
          startedAt: new Date(),
          completedAt: isFinished ? new Date() : null,
          input: `Step execution update: ${step}`,
          output: combinedOutput,
          error: error || (status === "Failed" ? description : null),
        },
      });
    }

    // 4. If an approval is requested (e.g. from Email Agent or Article Writer)
    const hasResumeWebhook = Boolean(body.resumeUrl);
    const isApprovalStep = status === "Needs Approval" || step?.toLowerCase().includes("approval") || hasResumeWebhook;

    if (isApprovalStep) {
      const recipientEmail = body.recipientEmail || body.email || "";
      const recipientName = body.recipientName || body.name || "";
      const emailSubject = body.subject || body.Subject || "";
      const emailBody = body.body || body.emailBody || body.content || "";

      let approvalContent = finalMarkdown || combinedOutput;
      if (emailSubject || emailBody || recipientEmail) {
        approvalContent = `Recipient: ${recipientName} <${recipientEmail}>\nSubject: ${emailSubject}\n\n${emailBody}`;
      }

      // Embed metadata comment with resumeUrl if present so dashboard action can resume n8n execution
      if (body.resumeUrl) {
        const metadataTag = `\n\n<!-- n8n_approval_metadata: ${JSON.stringify({
          resumeUrl: body.resumeUrl,
          recipientEmail,
          recipientName,
          subject: emailSubject,
          body: emailBody,
        })} -->`;
        approvalContent += metadataTag;
      }

      const approvalTitle = title || (recipientName ? `Send outreach email to ${recipientName} (${recipientEmail})` : "Review Generated Outreach Email");

      await prisma.approval.create({
        data: {
          agentId: agent.id,
          taskId: taskId || run?.taskId || null,
          title: approvalTitle,
          content: approvalContent,
          status: "Pending",
        },
      });

      // Update associated task status to Needs Approval
      if (run?.taskId || taskId) {
        await prisma.task.update({
          where: { id: (taskId || run?.taskId)! },
          data: { status: "Needs Approval" },
        }).catch(() => {});
      }

      if (isKainoa) {
        await prisma.activity.updateMany({
          where: {
            agentId: agent.id,
            status: "Running",
          },
          data: {
            status: "Success",
          },
        });
      }
    } else if (status === "Completed" && (finalMarkdown || title)) {
      const isHarper = agent.name?.toLowerCase().includes("harper");
      if (!isHarper) {
        const articleTitle = title || articleJson?.title || "Research Article Draft";
        await prisma.approval.create({
          data: {
            agentId: agent.id,
            taskId: taskId || run.taskId || null,
            title: `Approve Publication: ${articleTitle}`,
            content: finalMarkdown || combinedOutput,
            status: "Pending",
          },
        });
      }
    }

    try {
      revalidatePath(`/${agent.name.toLowerCase()}`);
      revalidatePath(`/agents/${agent.id}`);
      revalidatePath(`/agents/${agent.name.toLowerCase()}`);
      revalidatePath("/");
      revalidatePath("/tasks");
      revalidatePath("/operations");
      revalidatePath("/approvals");
    } catch {}

    return NextResponse.json({
      success: true,
      logged: true,
      step,
      status: activityStatus,
      activityId: activity?.id || null,
      runId: run.id,
    });
  } catch (err: any) {
    console.error("Error logging agent step progress:", err);
    return NextResponse.json(
      { success: false, message: "Failed to record step progress", error: err?.message },
      { status: 500 }
    );
  }
}
