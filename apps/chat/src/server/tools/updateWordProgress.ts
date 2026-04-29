import { tool } from "ai";
import { z } from "zod/v4";
import { getDb } from "@/lib/db";

export type WordProgressUpdate = {
  id: number;
  success: boolean;
};

export function updateWordProgressQuery(words: WordProgressUpdate[]) {
  console.log("updateWordProgressQuery", words)
  const db = getDb();

  console.log(`[updateWordProgress] Updating ${words.length} words`);

  const getWord = db.prepare(
    `SELECT id, english, jyutping, proficiency_level FROM words WHERE id = ?`,
  );

  const updateSuccess = db.prepare(`
    UPDATE words
    SET proficiency_level = proficiency_level + 1,
        date_last_practiced = datetime('now'),
        times_practiced = times_practiced + 1
    WHERE id = ?
  `);

  const updateFail = db.prepare(`
    UPDATE words
    SET proficiency_level = MAX(proficiency_level - 1, 0),
        date_last_practiced = datetime('now'),
        times_practiced = times_practiced + 1
    WHERE id = ?
  `);

  const updateAll = db.transaction((words: WordProgressUpdate[]) => {
    for (const word of words) {
      const before = getWord.get(word.id) as
        | {
            id: number;
            english: string;
            jyutping: string;
            proficiency_level: number;
          }
        | undefined;
      if (word.success) {
        updateSuccess.run(word.id);
      } else {
        updateFail.run(word.id);
      }
      const after = getWord.get(word.id) as
        | { proficiency_level: number }
        | undefined;
      console.log(
        `[updateWordProgress]   ${word.success ? "✓" : "✗"} id=${word.id} "${before?.english}" (${before?.jyutping}) proficiency: ${before?.proficiency_level} → ${after?.proficiency_level}`,
      );
    }
  });

  updateAll(words);

  console.log(`[updateWordProgress] Done`);
  return { updated: words.length };
}

export const updateWordProgress = tool({
  description:
    "Update the proficiency and practice date for words after the user's translation attempt. For each word used in the sentence, pass its ID and whether the user got it correct. Correct words have their proficiency increased by 1, incorrect words have their proficiency decreased by 1 (minimum 0). All words get their date_last_practiced and times_practiced updated.",
  inputSchema: z.object({
    words: z
      .array(
        z.object({
          id: z.number().describe("The word ID"),
          success: z
            .boolean()
            .describe("Whether the user translated this word correctly"),
        }),
      )
      .describe("Array of words with their success status"),
  }),
  execute: async ({ words }) => {
    return updateWordProgressQuery(words);
  },
});
