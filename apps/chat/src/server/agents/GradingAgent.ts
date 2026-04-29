import { google } from "@ai-sdk/google";
import { Experimental_Agent as Agent, stepCountIs } from "ai";
import { updateWordProgress } from "../tools/updateWordProgress"

const systemPrompt = `You are a master of Cantonese. You fully understand Cantonese grammar, sentence structure, and vocabulary.
Your goal is to grade the user's translation of a sentence and provide feedback on whether it is correct or incorrect.

## Grading Workflow

1. After the user submits their translation:
   - Evaluate their answer and explain what was correct or incorrect.
   - Call updateWordProgress with the IDs of all words used in the sentence and whether the user got each one correct. 
   - Grade each word individually — if the user gets one word wrong, only that word should be marked as unsuccessful.
`;

export const GradingAgent = () => {

    return new Agent({
        model: google("gemini-2.5-flash"),
        stopWhen: stepCountIs(30),
        instructions: systemPrompt,
        tools: {
          updateWordProgress,
        },
      });
}