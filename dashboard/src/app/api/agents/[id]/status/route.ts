import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id }, { name: { equals: id, mode: "insensitive" } }],
      },
      select: {
        id: true,
        name: true,
        status: true,
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            status: true,
            title: true,
            completedAt: true,
            result: true,
          },
        },
        runs: {
          orderBy: { startedAt: "desc" },
          take: 3,
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: "Agent not found" },
        { status: 404 }
      );
    }

    const isRunning =
      agent.tasks.some((t) => t.status === "Running") ||
      agent.runs.some((r) => r.status === "Running");

    const latestTask = agent.tasks[0] || null;

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      status: agent.status,
      isRunning,
      latestTask: latestTask
        ? {
            id: latestTask.id,
            status: latestTask.status,
            title: latestTask.title,
            isCompleted: latestTask.status === "Completed",
            hasResult: Boolean(latestTask.result),
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch status", error: error?.message },
      { status: 500 }
    );
  }
}
