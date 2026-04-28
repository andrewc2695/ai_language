import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit")) || 30,
    50
  );

  const exclude = req.nextUrl.searchParams.get("exclude");
  const db = getDb();

  if (exclude) {
    const ids = exclude.split(",").map(Number).filter(Boolean);
    const placeholders = ids.map(() => "?").join(",");
    const words = db.prepare(`
      SELECT * FROM words
      WHERE id NOT IN (${placeholders})
      ORDER BY RANDOM()
      LIMIT ?
    `).all(...ids, limit);
    return NextResponse.json(words);
  }

  const words = db.prepare(`
    SELECT * FROM words
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit);

  return NextResponse.json(words);
}
