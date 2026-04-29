import { OnlySentenceAgent } from "../../agents/OnlySentenceAgent";

export async function POST() {
  try {
    const agent = OnlySentenceAgent();

    const result = await agent.stream({
      messages: [{ role: "user", content: "Generate a sentence." }],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Sentence API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
