import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrationClient } from "./index";
import { existsSync } from "fs";

async function runMigrations() {
  const migrationsFolder = "./src/db/migrations";

  if (!existsSync(migrationsFolder)) {
    console.log("⚠️  No migrations folder found.");
    console.log(
      "   Restore/generate the canonical migration set before running db:migrate.",
    );
    await migrationClient.end();
    process.exit(1);
    return;
  }

  // Refuse to replay the canonical migration baseline on a database that already
  // contains application tables without Drizzle migration history. Servora v1
  // treats the migration folder as the only supported schema-installation path
  // because required platform reference data and SQL-only invariants live there.
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
      "   The database was modified outside the canonical db:migrate flow, so Drizzle",
    );
    console.error(
      "   has no trustworthy record of which schema, reference-data, or SQL-only invariants",
    );
    console.error("   are already applied.");
    console.error("");
    console.error(
      "   Fix: reset and re-migrate through the migrations folder so history stays",
    );
    console.error("   consistent and RBAC reference data gets installed:");
    console.error("     bun run db:reset");
    console.error("     bun run db:migrate");
    console.error("");
    console.error(
      "   Use db:migrate as the supported schema-installation path for this project.",
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
