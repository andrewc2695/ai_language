import { tool } from "ai";
import { z } from "zod/v4";
import { getDb } from "@/lib/db";

export const getLeastProficientWord = tool({
  description:
    "Get the word with the lowest proficiency level and oldest practice date, along with 30 random words from the vocabulary to use for building sentences.",
  inputSchema: z.object({}),
  execute: async () => {
    const db = getDb();

    const focusWord = db.prepare(`
      SELECT * FROM words
      ORDER BY proficiency_level ASC, date_last_practiced ASC NULLS FIRST
      LIMIT 1
    `).get() as { id: number } | undefined;

    if (!focusWord) {
      return { focusWord: null, supportingWords: [] };
    }

    const supportingWords = db.prepare(`
      SELECT * FROM words
      WHERE id != ?
      ORDER BY RANDOM()
      LIMIT 30
    `).all(focusWord.id);
    console.log(focusWord);
    return { focusWord, supportingWords };
  },
});
