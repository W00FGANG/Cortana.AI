import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const {
      agentName,
      agentRole,
      currentTaskTitle,
      recentActivities,
      userPrompt,
    } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return new Response("GEMINI_API_KEY is not configured.", {
        status: 500,
      });
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    let systemPrompt = `You are ${agentName}, an AI agent with the role of "${agentRole}".

You are talking to a human operator who is viewing your dashboard.

Speak in the first person. Do not use emojis, keep it professional but approachable and conversational.

Here is your current context:

- Current active task: ${
      currentTaskTitle ? `"${currentTaskTitle}"` : "None"
    }

- Recent completed activities: ${
      recentActivities?.length > 0
        ? recentActivities.join(", ")
        : "None"
    }
`;

    if (userPrompt) {
      systemPrompt += `
The human operator just said to you: "${userPrompt}"

Please respond directly to what they said based on your context. Keep your response brief, clear, and helpful.`;
    } else {
      systemPrompt += `
Write a short, natural greeting that covers the following points:

1. Your current status (what you are currently doing).
2. What you need to do next or are prepared to do.
3. How you can help the user right now.

Keep it brief (2-3 sentences max).`;
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      prompt: systemPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error generating agent chat:", error);

    const errorMessage = error?.message || "An error occurred during text generation";
    return new Response(errorMessage, {
      status: error?.statusCode || 500,
    });
  }
}