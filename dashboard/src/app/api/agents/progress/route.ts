import { NextResponse } from "next/server";
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

    let combinedOutput = output || `Step: ${step}`;
    if (finalMarkdown || finalJson) {
      combinedOutput = JSON.stringify({
        title: title || articleJson?.title || "Article Output",
        slug: slug || articleJson?.slug || "article-output",
        markdown: finalMarkdown,
        jsonOutput: finalJson,
        completedAt: new Date().toISOString(),
      });
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
    const activity = await prisma.activity.create({
      data: {
        agentId: agent.id,
        action: status === "Completed" 
          ? `Completed: ${step || 'Article Generation'}` 
          : status === "Failed" 
          ? `Failed step: ${step}` 
          : `Executing: ${step}`,
        description: description || (title ? `Generated "${title}"` : `Executing: ${step}`),
        status: activityStatus,
      },
    });

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

    // 4. If an article was completed, also create an Approval record for convenient review
    if (status === "Completed" && (finalMarkdown || title)) {
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

    return NextResponse.json({
      success: true,
      logged: true,
      step,
      status: activityStatus,
      activityId: activity.id,
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
