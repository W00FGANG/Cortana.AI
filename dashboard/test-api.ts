import "dotenv/config";
import { POST } from "./src/app/api/agents/[id]/chat/route";

async function test() {
  const req = new Request("http://localhost/api/agents/1/chat", {
    method: "POST",
    body: JSON.stringify({
      agentName: "Kainoa",
      agentRole: "Sales Agent",
      currentTaskTitle: "Checking emails",
      recentActivities: []
    })
  });
  
  try {
    const res = await POST(req, { params: Promise.resolve({ id: "1" }) });
    console.log("Status:", res.status);
    
    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log("Chunk:", decoder.decode(value));
      }
    } else {
      console.log("Body:", await res.text());
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();
