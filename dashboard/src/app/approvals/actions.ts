"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveApproval(approvalId: string) {
  const approval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: "Approved",
      reviewedAt: new Date(),
    },
    include: {
      agent: true,
      task: true,
    },
  });

  // If there's an associated task, update it to Completed or Running
  if (approval.taskId) {
    await prisma.task.update({
      where: { id: approval.taskId },
      data: {
        status: "Completed",
        completedAt: new Date(),
        result: `Approved by user: ${approval.title}`,
      },
    });
  }

  // Create an Activity record for audit log
  await prisma.activity.create({
    data: {
      agentId: approval.agentId,
      action: `Approved action: ${approval.title}`,
      description: `User authorized: ${approval.content.slice(0, 100)}...`,
      status: "Success",
    },
  });

  revalidatePath("/approvals");
  revalidatePath("/tasks");
  revalidatePath("/operations");
  revalidatePath("/");
}

export async function rejectApproval(approvalId: string) {
  const approval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: "Rejected",
      reviewedAt: new Date(),
    },
    include: {
      agent: true,
      task: true,
    },
  });

  // If there's an associated task, update it to Failed
  if (approval.taskId) {
    await prisma.task.update({
      where: { id: approval.taskId },
      data: {
        status: "Failed",
        completedAt: new Date(),
        result: `Rejected by user: ${approval.title}`,
      },
    });
  }

  // Create an Activity record for audit log
  await prisma.activity.create({
    data: {
      agentId: approval.agentId,
      action: `Rejected action: ${approval.title}`,
      description: `User declined authorization`,
      status: "Failed",
    },
  });

  revalidatePath("/approvals");
  revalidatePath("/tasks");
  revalidatePath("/operations");
  revalidatePath("/");
}
