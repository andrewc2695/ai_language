import { convertToModelMessages } from "ai";
import { GradingAgent } from "../../agents/GradingAgent";

// Note: Using Node.js runtime instead of Edge because SQLite requires Node.js
// export const runtime = "edge"; // Removed - SQLite needs Node.js runtime
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages must be an array", { status: 400 });
    }

    const modelMessages = await convertToModelMessages(messages);

    const agent = GradingAgent();

    const result = await agent.stream({
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
