import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getDb();

  const focusWord = db.prepare(`
    SELECT * FROM words
    ORDER BY proficiency_level ASC, date_last_practiced ASC NULLS FIRST
    LIMIT 1
  `).get();

  if (!focusWord) {
    return NextResponse.json({ error: "No words in database" }, { status: 404 });
  }

  const supportingWords = db.prepare(`
    SELECT * FROM words
    WHERE id != ?
    ORDER BY RANDOM()
    LIMIT 30
  `).all((focusWord as { id: number }).id);

  return NextResponse.json({ focusWord, supportingWords });
}
