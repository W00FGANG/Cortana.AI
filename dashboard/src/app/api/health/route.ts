import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import http from "node:http";

export const dynamic = "force-dynamic";

function checkN8nReachable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const req = http.request("http://127.0.0.1:5678/healthz", { method: "GET", timeout: 1500 }, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500);
      });
      req.on("error", () => {
        // Try host.docker.internal
        const req2 = http.request("http://host.docker.internal:5678/healthz", { method: "GET", timeout: 1500 }, (res2) => {
          resolve(res2.statusCode !== undefined && res2.statusCode < 500);
        });
        req2.on("error", () => resolve(false));
        req2.end();
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

export async function GET() {
  const startTime = Date.now();
  let dbOk = false;
  let agentCount = 0;

  try {
    agentCount = await prisma.agent.count();
    dbOk = true;
  } catch (err) {
    dbOk = false;
  }

  const n8nOk = await checkN8nReachable();
  const geminiConfigured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);
  const latencyMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbOk ? "healthy" : "degraded",
    latencyMs,
    database: {
      status: dbOk ? "connected" : "disconnected",
      agentCount,
    },
    n8n: {
      status: n8nOk ? "connected" : "idle",
      endpoint: "http://127.0.0.1:5678",
    },
    gemini: {
      status: geminiConfigured ? "configured" : "unconfigured",
      model: "gemini-2.5-flash",
    },
    timestamp: new Date().toISOString(),
  });
}
