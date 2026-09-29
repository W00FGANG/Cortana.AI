import { prisma } from "@/lib/prisma";
import { after } from "next/server";

let lastRunTimestamp = 0;
const THROTTLE_MS = 10 * 60 * 1000; // Run at most once every 10 minutes

/**
 * Checks for any Task, AgentRun, or Activity that has been in "Running" status
 * for more than the specified threshold (default 6 hours) and updates them to "Stalled".
 */
export async function updateStalledExecutions(hoursThreshold = 6, force = false) {
  const now = Date.now();
  if (!force && now - lastRunTimestamp < THROTTLE_MS) {
    return { skipped: true, lastRunAgoMs: now - lastRunTimestamp };
  }
  lastRunTimestamp = now;

  const cutoff = new Date(now - hoursThreshold * 60 * 60 * 1000);

  try {
    // Run all three updates in parallel
    const [stalledRuns, stalledTasks, stalledActivities] = await Promise.all([
      prisma.agentRun.updateMany({
        where: {
          status: "Running",
          startedAt: { lt: cutoff },
        },
        data: {
          status: "Stalled",
          completedAt: new Date(),
          error: `Execution automatically marked as Stalled after exceeding ${hoursThreshold} hours.`,
        },
      }),
      prisma.task.updateMany({
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
      }),
      prisma.activity.updateMany({
        where: {
          status: "Running",
          createdAt: { lt: cutoff },
        },
        data: {
          status: "Stalled",
        },
      }),
    ]);

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

/**
 * Schedules updateStalledExecutions in the background after the response is rendered/sent.
 * Never blocks the main rendering thread or delays page load.
 */
export function scheduleStalledExecutionsCheck() {
  try {
    after(async () => {
      await updateStalledExecutions();
    });
  } catch {
    // If called outside request context (or after() fails), run asynchronously in background
    setTimeout(() => {
      updateStalledExecutions().catch(() => {});
    }, 0);
  }
}
