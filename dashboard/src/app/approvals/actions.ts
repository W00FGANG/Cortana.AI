"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import http from "node:http";
import https from "node:https";

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

      req.setTimeout(10000);
      req.on("error", reject);
      req.write(bodyStr);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function parseApprovalMetadata(content: string) {
  const match = content.match(/<!-- n8n_approval_metadata:\s*({[\s\S]*?})\s*-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export async function approveApproval(approvalId: string, formData?: FormData) {
  try {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { agent: true, task: true },
    });

    if (!approval) return { success: false, error: "Approval not found" };

    const metadata = parseApprovalMetadata(approval.content);
    let editedSubject = metadata?.subject || "";
    let editedBody = metadata?.body || "";

    if (formData) {
      const s = formData.get("subject") as string;
      const b = formData.get("body") as string;
      if (s !== null && s !== undefined) editedSubject = s;
      if (b !== null && b !== undefined) editedBody = b;
    }

    // If this approval has a workflow resume webhook, call it
    if (metadata?.resumeUrl) {
      try {
        let targetUrl = metadata.resumeUrl;
        // Ensure container hostname translates properly if called from host
        if (targetUrl.includes("host.docker.internal")) {
          targetUrl = targetUrl.replace("host.docker.internal", "127.0.0.1");
        }
        await postJson(targetUrl, {
          Decision: "Approve",
          Subject: editedSubject,
          "Email Body": editedBody,
          recipientEmail: metadata.recipientEmail,
          recipientName: metadata.recipientName,
        });
        console.log("[Approvals] Successfully dispatched approval resume:", targetUrl);
      } catch (err: any) {
        console.error("[Approvals] Error notifying resume webhook:", err);
      }
    }

    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: "Approved",
        reviewedAt: new Date(),
      },
    });

    // If there's an associated task, update it
    if (approval.taskId) {
      await prisma.task.update({
        where: { id: approval.taskId },
        data: {
          status: metadata?.resumeUrl ? "Running" : "Completed",
          completedAt: metadata?.resumeUrl ? null : new Date(),
          result: metadata?.recipientEmail
            ? JSON.stringify(
                [
                  {
                    email: metadata.recipientEmail,
                  },
                ],
                null,
                2
              )
            : `Approved by user: ${approval.title}`,
        },
      });
    }

    if (metadata?.recipientEmail) {
      const activeRun = await prisma.agentRun.findFirst({
        where: {
          agentId: approval.agentId,
          status: "Running",
        },
        orderBy: { startedAt: "desc" },
      });
      if (activeRun) {
        await prisma.agentRun.update({
          where: { id: activeRun.id },
          data: {
            output: JSON.stringify(
              [
                {
                  email: metadata.recipientEmail,
                },
              ],
              null,
              2
            ),
          },
        }).catch(() => {});
      }
    }

    // Create an Activity record for audit log
    await prisma.activity.create({
      data: {
        agentId: approval.agentId,
        action: `Approved: ${approval.title.replace(/^Approve:\s*/i, "")}`,
        description: `User authorized email transmission to ${metadata?.recipientEmail || 'prospect'}`,
        status: "Success",
      },
    });

    revalidatePath("/approvals");
    revalidatePath("/tasks");
    revalidatePath("/operations");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("[Approvals] Error in approveApproval:", err);
    return { success: false, error: err.message || "Failed to approve action" };
  }
}

export async function rejectApproval(approvalId: string) {
  try {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { agent: true, task: true },
    });

    if (!approval) return { success: false, error: "Approval not found" };

    const metadata = parseApprovalMetadata(approval.content);

    // If this approval has a resume webhook, notify it of rejection
    if (metadata?.resumeUrl) {
      try {
        let targetUrl = metadata.resumeUrl;
        if (targetUrl.includes("host.docker.internal")) {
          targetUrl = targetUrl.replace("host.docker.internal", "127.0.0.1");
        }
        await postJson(targetUrl, {
          Decision: "Decline",
          recipientEmail: metadata.recipientEmail,
          recipientName: metadata.recipientName,
        });
        console.log("[Approvals] Successfully dispatched decline resume:", targetUrl);
      } catch (err: any) {
        console.error("[Approvals] Error notifying decline webhook:", err);
      }
    }

    await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: "Rejected",
        reviewedAt: new Date(),
      },
    });

    // If there's an associated task, update it
    if (approval.taskId) {
      await prisma.task.update({
        where: { id: approval.taskId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          result: `Declined by user: ${approval.title}`,
        },
      });
    }

    // Create an Activity record for audit log
    await prisma.activity.create({
      data: {
        agentId: approval.agentId,
        action: `Declined: ${approval.title.replace(/^Approve:\s*/i, "")}`,
        description: `User declined sending email to ${metadata?.recipientEmail || 'prospect'}`,
        status: "Failed",
      },
    });

    revalidatePath("/approvals");
    revalidatePath("/tasks");
    revalidatePath("/operations");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("[Approvals] Error in rejectApproval:", err);
    return { success: false, error: err.message || "Failed to reject action" };
  }
}
