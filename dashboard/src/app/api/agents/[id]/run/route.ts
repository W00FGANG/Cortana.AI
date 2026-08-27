import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    
    // Abstracting n8n execution logic:
    // 1. In a real scenario, fetch agent from DB (e.g. prisma.agent.findUnique)
    // 2. Extract n8nWorkflowId
    // 3. Post to process.env.N8N_BASE_URL + "/webhook/" + n8nWorkflowId
    
    // For now, we simulate execution and return a mock successful result
    console.log(`[Mock n8n] Triggering workflow for agent: ${agentId}`);
    
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      agentId,
      message: "Agent run completed successfully.",
      result: {
        timestamp: new Date().toISOString(),
        action: "Simulated execution",
        status: "Completed",
        output: "Found 10 qualified Hawaii prospects."
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to run agent workflow" },
      { status: 500 }
    );
  }
}
