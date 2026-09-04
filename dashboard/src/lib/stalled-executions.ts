import { prisma } from "@/lib/prisma";

/**
 * Checks for any Task, AgentRun, or Activity that has been in "Running" status
 * for more than the specified threshold (default 6 hours) and updates them to "Stalled".
 */
export async function updateStalledExecutions(hoursThreshold = 6) {
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

  try {
    // 1. Update AgentRuns running for > 6 hours
    const stalledRuns = await prisma.agentRun.updateMany({
      where: {
        status: "Running",
        startedAt: { lt: cutoff },
      },
      data: {
        status: "Stalled",
        completedAt: new Date(),
        error: `Execution automatically marked as Stalled after exceeding ${hoursThreshold} hours.`,
      },
    });

    // 2. Update Tasks running for > 6 hours
    const stalledTasks = await prisma.task.updateMany({
      where: {
        status: "Running",
        OR: [
          { startedAt: { lt: cutoff } },
          { startedAt: null, createdAt: { lt: cutoff } },
        ],
      },
      data: {
        status: "Stalled",
        completedAt: new Date(),
      },
    });

    // 3. Update Activities running for > 6 hours
    const stalledActivities = await prisma.activity.updateMany({
      where: {
        status: "Running",
        createdAt: { lt: cutoff },
      },
      data: {
        status: "Stalled",
      },
    });

    return {
      stalledRunsCount: stalledRuns.count,
      stalledTasksCount: stalledTasks.count,
      stalledActivitiesCount: stalledActivities.count,
    };
  } catch (err) {
    console.error("Failed to check/update stalled executions:", err);
    return {
      stalledRunsCount: 0,
      stalledTasksCount: 0,
      stalledActivitiesCount: 0,
    };
  }
}
