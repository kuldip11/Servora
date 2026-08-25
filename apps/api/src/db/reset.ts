import postgres from 'postgres';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) throw new Error('DATABASE_URL environment variable is required');
if (process.env['NODE_ENV'] === 'production') {
  throw new Error('Refusing to reset a production database.');
}

const sql = postgres(connectionString, { max: 1 });

try {
  console.log('🧹 Resetting development database...');
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO public`;
  console.log('✅ Database reset complete. Run `bun run db:migrate` next.');
} finally {
  await sql.end();
}
