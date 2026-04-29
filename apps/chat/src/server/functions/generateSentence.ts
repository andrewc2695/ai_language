import { google } from "@ai-sdk/google";
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai"; // Use lowercase 'output'
import { z } from "zod";
import { type WordRow } from "../../lib/db";
import { getPracticeWordQuery } from "./getPracticeWord";

// Provide the full context in the prompt
const formatWord = (word: WordRow) => `ID: ${word.id} | Jyutping: ${word.jyutping} | English: ${word.english}`;

export const generateSentenceFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const { focusWord, supportingWords } = await getPracticeWordQuery();
    
    const { output } = await generateText({
      model: google("gemini-2.5-flash"), 
      output: Output.object({
        schema: z.object({
          sentence: z.string().describe("The natural Cantonese sentence in Jyutping"),
          usedWords: z.array(
            z.object({
              id: z.number(),
              jyutping: z.string(),
              english: z.string(),
            })
          ).describe("The full word objects used in the sentence"),
        }),
      }),
      system: "You are a master of Cantonese. Provide a natural sentence and track used word details.",
      prompt: `
      Generate one complete, natural Cantonese practice sentence using ONLY the provided vocabulary.
      
      Focus word: 
      ${formatWord(focusWord)}

      Supporting vocabulary: 
      ${supportingWords.map(formatWord).join("\n")}

      For every word used in the sentence, return its corresponding ID, Jyutping, and English definition in the usedWords array.`,
    });

    // Validation
    if (!output.sentence) {
      throw new Error("No sentence was generated");
    }

    return output;
  },
);
