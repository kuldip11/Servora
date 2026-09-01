import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("../index");
  vi.doUnmock("fs");
  vi.doUnmock("drizzle-orm/postgres-js");
  vi.doUnmock("drizzle-orm/postgres-js/migrator");
});

const loadMigrate = async (options: {
  hasMigrationsFolder: boolean;
  hasAppSchema?: boolean;
  hasMigrationHistory?: boolean;
  historyCount?: number;
}) => {
  const migrationClient = Object.assign(
    vi.fn(async (strings: TemplateStringsArray) => {
      const sql = Array.from(strings).join(" ");
      if (
        sql.includes("information_schema.tables") &&
        sql.includes("table_name = 'tenants'")
      ) {
        return [{ exists: options.hasAppSchema ?? false }];
      }
      if (sql.includes("table_name = '__drizzle_migrations'")) {
        return [{ exists: options.hasMigrationHistory ?? false }];
      }
      return [{ count: options.historyCount ?? 0 }];
    }),
    { end: vi.fn().mockResolvedValue(undefined) },
  );

  const migrate = vi.fn().mockResolvedValue(undefined);
  const drizzle = vi.fn().mockReturnValue({});

  vi.doMock("../index", () => ({ migrationClient }));
  vi.doMock("fs", () => ({
    existsSync: vi.fn(() => options.hasMigrationsFolder),
  }));
  vi.doMock("drizzle-orm/postgres-js", () => ({ drizzle }));
  vi.doMock("drizzle-orm/postgres-js/migrator", () => ({ migrate }));

  await import("../migrate");
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { migrationClient, migrate, drizzle };
};

describe("db migrate entrypoint", () => {
  it("exits with an error when no migrations folder exists", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(((
      code?: number,
    ) => {
      expect(code).toBe(1);
      return undefined as never;
    }) as never);

    const { migrationClient, migrate } = await loadMigrate({
      hasMigrationsFolder: false,
    });

    expect(migrationClient.end).toHaveBeenCalled();
    expect(migrate).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("runs drizzle migrations after confirming schema history is consistent", async () => {
    const { migrationClient, migrate, drizzle } = await loadMigrate({
      hasMigrationsFolder: true,
      hasAppSchema: true,
      hasMigrationHistory: true,
      historyCount: 3,
    });

    expect(drizzle).toHaveBeenCalledWith(migrationClient);
    expect(migrate).toHaveBeenCalledWith(
      {},
      { migrationsFolder: "./src/db/migrations" },
    );
    expect(migrationClient.end).toHaveBeenCalled();
  });
});
