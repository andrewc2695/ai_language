import { seedFromCsv } from "../lib/db";

const csvPath = process.argv[2];

if (!csvPath) {
  console.error("Usage: npx tsx scripts/seed.ts <path-to-csv>");
  process.exit(1);
}

const count = seedFromCsv(csvPath);
console.log(`Inserted ${count} words`);
