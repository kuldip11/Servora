import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getConnectionString(): string {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return connectionString;
}

let queryClient: ReturnType<typeof postgres> | undefined;
let migrationClientInstance: ReturnType<typeof postgres> | undefined;
let dbInstance: PostgresJsDatabase<typeof schema> | undefined;

function getQueryClient() {
  if (!queryClient) {
    queryClient = postgres(getConnectionString(), {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return queryClient;
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getQueryClient(), {
      schema,
      logger: process.env["NODE_ENV"] === "development",
    });
  }
  return dbInstance;
}

export const migrationClient: ReturnType<typeof postgres> = new Proxy(
  function () {} as unknown as ReturnType<typeof postgres>,
  {
    get(_target, prop, receiver) {
      if (!migrationClientInstance) {
        migrationClientInstance = postgres(getConnectionString(), { max: 1 });
      }
      return Reflect.get(migrationClientInstance, prop, receiver);
    },
    apply(_target, thisArg, args) {
      if (!migrationClientInstance) {
        migrationClientInstance = postgres(getConnectionString(), { max: 1 });
      }
      return Reflect.apply(
        migrationClientInstance as unknown as (...a: unknown[]) => unknown,
        thisArg,
        args,
      );
    },
  },
) as ReturnType<typeof postgres>;

export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getDb(), prop, receiver);
    },
  },
) as PostgresJsDatabase<typeof schema>;

export type Database = typeof db;

export async function closeDatabaseConnections(): Promise<void> {
  const clients: ReturnType<typeof postgres>[] = [];
  if (queryClient) clients.push(queryClient);
  if (migrationClientInstance) clients.push(migrationClientInstance);
  await Promise.allSettled(clients.map((client) => client.end({ timeout: 5 })));
  queryClient = undefined;
  migrationClientInstance = undefined;
  dbInstance = undefined;
}
