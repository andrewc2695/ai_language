import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter ?q=" }, { status: 400 });
  }

  const db = getDb();
  const pattern = `%${query}%`;

  const words = db.prepare(`
    SELECT * FROM words
    WHERE english LIKE ? OR jyutping LIKE ?
    ORDER BY
      CASE
        WHEN english LIKE ? OR jyutping LIKE ? THEN 0
        WHEN english LIKE ? OR jyutping LIKE ? THEN 1
        ELSE 2
      END,
      proficiency_level ASC
    LIMIT 20
  `).all(
    pattern, pattern,
    query, query,
    `${query}%`, `${query}%`
  );

  return NextResponse.json(words);
}
