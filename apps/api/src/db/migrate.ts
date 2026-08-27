import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrationClient } from "./index";
import { existsSync } from "fs";

async function runMigrations() {
  const migrationsFolder = "./src/db/migrations";

  if (!existsSync(migrationsFolder)) {
    console.log("⚠️  No migrations folder found.");
    console.log(
      "   Run `bun run db:generate` first to generate SQL migrations from the schema,",
    );
    console.log(
      "   OR run `bun run db:push` to push the schema directly (dev only).",
    );
    await migrationClient.end();
    process.exit(1);
    return;
  }

  // Detect the one drift pattern that turns into a confusing raw Postgres
  // error mid-migration: `drizzle-kit push` (or any other out-of-band schema
  // sync) already created application tables, but never recorded anything in
  // drizzle's own migration-history table, since `push` diffs the live schema
  // directly and doesn't go through the migrations folder at all. When that
  // happens, `migrate()` below has no record of what's "already applied" and
  // tries to replay every migration from 0000 — including RBAC reference-data
  // migrations later in the chain — onto a database that already has that
  // schema, which fails part-way through (e.g. "type already exists") and
  // aborts before the RBAC seed migrations ever run.
  const db = drizzle(migrationClient);
  const appSchemaRows = await migrationClient`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tenants'
    ) AS exists
  `;
  const hasAppSchema = Boolean(appSchemaRows[0]?.["exists"]);
  const migrationHistoryRows = await migrationClient`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
    ) AS exists
  `;
  const hasMigrationHistory = Boolean(migrationHistoryRows[0]?.["exists"]);
  let historyRowCount = 0;
  if (hasMigrationHistory) {
    const countRows =
      await migrationClient`SELECT count(*)::int AS count FROM "drizzle"."__drizzle_migrations"`;
    historyRowCount = Number(countRows[0]?.["count"] ?? 0);
  }

  if (hasAppSchema && historyRowCount === 0) {
    console.error(
      "❌ Database schema already exists, but no migration history is recorded.",
    );
    console.error("");
    console.error(
      "   This usually means `drizzle-kit push` was run against this database instead of",
    );
    console.error(
      "   `db:migrate` — push syncs the schema directly and skips the migrations folder",
    );
    console.error(
      "   entirely, so RBAC reference-data migrations (roles/permissions) never ran, and",
    );
    console.error("   drizzle has no record of what's already applied.");
    console.error("");
    console.error(
      "   Fix: reset and re-migrate through the migrations folder so history stays",
    );
    console.error("   consistent and RBAC reference data gets installed:");
    console.error("     bun run db:reset");
    console.error("     bun run db:migrate");
    console.error("");
    console.error(
      "   Avoid `db:push` on this project — required RBAC reference data lives in raw SQL",
    );
    console.error(
      "   migrations, not in schema.ts, so push can never install it.",
    );
    await migrationClient.end();
    process.exit(1);
  }

  console.log("🔄 Running database migrations...");
  await migrate(db, { migrationsFolder });
  console.log("✅ Migrations complete!");
  await migrationClient.end();
}

runMigrations().catch((err: any) => {
  console.error("❌ Migration failed:", err);
  if (
    process.env["NODE_ENV"] !== "production" &&
    (err?.code === "42710" || err?.code === "42P07")
  ) {
    console.error("");
    console.error(
      "💡 Development database appears to contain objects that are not aligned with Drizzle migration history.",
    );
    console.error("   If this database does not contain data you need, run:");
    console.error("   bun run db:reset");
    console.error("   bun run db:migrate");
  }
  process.exit(1);
});
