import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const folder = resolve(root, "apps/api/src/db/migrations");
const names = readdirSync(folder)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

if (!names.length) {
  console.error("No SQL migrations found.");
  process.exit(1);
}

const numbers = names.map((name) => Number(name.slice(0, 4)));
const errors = [];

for (let i = 0; i < numbers.length; i += 1) {
  if (numbers[i] !== i) {
    errors.push(`Expected migration ${String(i).padStart(4, "0")}, found ${names[i] ?? "nothing"}.`);
    break;
  }
}

const seen = new Set();
for (const name of names) {
  const prefix = name.slice(0, 4);
  if (seen.has(prefix)) errors.push(`Duplicate migration prefix: ${prefix}`);
  seen.add(prefix);

  const sql = readFileSync(resolve(folder, name), "utf8").trim();
  if (!sql) errors.push(`Empty migration: ${name}`);
  if (/DROP\s+SCHEMA\s+public\s+CASCADE/i.test(sql)) {
    errors.push(`Destructive schema reset is not allowed in a migration: ${name}`);
  }
}

if (errors.length) {
  console.error("Migration integrity audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Migration integrity OK: ${names.length} ordered SQL migrations (${names[0]} → ${names.at(-1)}).`);
