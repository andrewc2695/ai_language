import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { ONLY_SENTENCE_AGENT } from "../functions/consts";
import { updateWordProgressQuery } from "../tools/updateWordProgress";

type SentenceMetadata = {
  agent: typeof ONLY_SENTENCE_AGENT;
  usedWords: { id: number; jyutping: string; english: string }[];
};

const getText = (message?: UIMessage) =>
  message?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n") ?? "";

const getSentenceMetadata = (message?: UIMessage) => {
  const messageMetadata = message?.metadata as SentenceMetadata | undefined;

  if (messageMetadata?.agent === ONLY_SENTENCE_AGENT) {
    return messageMetadata;
  }

  for (const part of message?.parts ?? []) {
    const partMetadata =
      "metadata" in part
        ? (part.metadata as SentenceMetadata | undefined)
        : undefined;

    if (partMetadata?.agent === ONLY_SENTENCE_AGENT) {
      return partMetadata;
    }
  }

  return undefined;
};

const getPracticeContext = (messages: UIMessage[]) => {
  const lastIndex = messages.length - 1;

  if (messages[lastIndex]?.role !== "user") {
    return { expectedSentence: "", usedWords: [] };
  }

  const previousMessage = messages[lastIndex - 1];
  const metadata = getSentenceMetadata(previousMessage);

  return {
    expectedSentence: getText(previousMessage),
    usedWords: metadata?.usedWords ?? [],
  };
};

const gradingFeedbackSystemPrompt = (
  expectedSentence: string,
  usedWords: SentenceMetadata["usedWords"],
) => `You are a master of Cantonese. You fully understand Cantonese grammar, sentence structure, and vocabulary.
  Your goal is to grade the user's English translation of a Cantonese sentence and provide helpful feedback.

  Expected Cantonese sentence in Jyutping:
  ${expectedSentence || "(No expected sentence was provided.)"}

  Words the user was expected to translate:
  ${JSON.stringify(usedWords, null, 2)}

  Explain whether the user's response was right or wrong and why. Keep the response concise and user-facing.
  Do not include JSON or any machine-readable grading object in this streamed response.

  Before you finish, call recordGradingResult exactly once with a wordResults object containing every expected word keyed by word ID.
  Mark a word correct only if the user's response translated and used that word with the correct meaning.`;

const gradingResultSchema = z.object({
  wordResults: z
    .record(
      z.string(),
      z.object({
        id: z.number(),
        jyutping: z.string(),
        english: z.string(),
        correct: z.boolean(),
        reason: z.string(),
      }),
    )
    .describe("Every expected word keyed by word ID."),
});

type GradingResult = z.infer<typeof gradingResultSchema>;

const updateProgressFromStructuredGrade = ({
  usedWords,
  gradingResult,
}: {
  usedWords: SentenceMetadata["usedWords"];
  gradingResult?: GradingResult;
}) => {
  if (usedWords.length === 0 || !gradingResult) {
    return;
  }

  updateWordProgressQuery(
    usedWords.map((word) => ({
      id: word.id,
      success: gradingResult.wordResults[String(word.id)]?.correct ?? false,
    })),
  );
};

export async function handleChat(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages must be an array", { status: 400 });
    }

    const modelMessages = await convertToModelMessages(messages);
    const { expectedSentence, usedWords } = getPracticeContext(messages);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: gradingFeedbackSystemPrompt(expectedSentence, usedWords),
      messages: modelMessages,
      tools: {
        recordGradingResult: tool({
          description:
            "Record the structured grading result for this translation attempt. This does not update the database.",
          inputSchema: gradingResultSchema,
          execute: async (result) => {
            return result;
          },
        }),
      },
      onFinish: async ({ steps, toolResults }) => {
        try {
          const allToolResults = [
            ...toolResults,
            ...steps.flatMap((step) => step.toolResults),
          ];
          const gradingResult = allToolResults.find(
            (toolResult) => toolResult.toolName === "recordGradingResult",
          )?.output as GradingResult | undefined;

          updateProgressFromStructuredGrade({
            usedWords,
            gradingResult,
          });
        } catch (error) {
          console.error("Failed to update word progress:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
