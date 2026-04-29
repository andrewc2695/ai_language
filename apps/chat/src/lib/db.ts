import Database from "better-sqlite3";
import { readFileSync } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "words.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

export function seedFromCsv(csvPath: string) {
  const db = getDb();
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n");

  const insert = db.prepare(
    "INSERT INTO words (english, jyutping) VALUES (?, ?)"
  );

  const insertMany = db.transaction((rows: [string, string][]) => {
    for (const [english, jyutping] of rows) {
      insert.run(english, jyutping);
    }
  });

  const rows: [string, string][] = [];
  for (const line of lines) {
    const firstComma = line.indexOf(",");
    if (firstComma === -1) continue;
    const english = line.slice(0, firstComma).trim();
    const jyutping = line.slice(firstComma + 1).trim();
    if (english && jyutping) {
      rows.push([english, jyutping]);
    }
  }

  insertMany(rows);
  return rows.length;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      english TEXT NOT NULL,
      jyutping TEXT NOT NULL,
      proficiency_level INTEGER DEFAULT 0,
      date_last_practiced TIMESTAMP,
      times_practiced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_practice_priority
      ON words (proficiency_level ASC, date_last_practiced ASC);
  `);
}
