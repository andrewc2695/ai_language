import { tool } from "ai";
import { z } from "zod/v4";
import { getDb } from "@/lib/db";

export const getRandomWords = tool({
  description:
    "Get 30 random words from the user's vocabulary. Use this to get words for building sentences. You can exclude word IDs you already have to avoid duplicates.",
  inputSchema: z.object({
    exclude: z
      .array(z.number())
      .optional()
      .describe("Word IDs to exclude from the results"),
  }),
  execute: async ({ exclude }) => {
    const db = getDb();

    if (exclude && exclude.length > 0) {
      const placeholders = exclude.map(() => "?").join(",");
      return db.prepare(`
        SELECT * FROM words
        WHERE id NOT IN (${placeholders})
        ORDER BY RANDOM()
        LIMIT 30
      `).all(...exclude);
    }

    return db.prepare(`
      SELECT * FROM words
      ORDER BY RANDOM()
      LIMIT 30
    `).all();
  },
});
