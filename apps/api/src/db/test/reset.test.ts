import { afterEach, describe, expect, it, vi } from 'vitest';

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

describe('db reset entrypoint', () => {
  it('rejects startup when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    await expect(import('../reset')).rejects.toThrow('DATABASE_URL environment variable is required');
  });

  it('refuses to run against production databases', async () => {
    process.env.DATABASE_URL = 'postgresql://example.test/pos';
    process.env.NODE_ENV = 'production';

    await expect(import('../reset')).rejects.toThrow('Refusing to reset a production database.');
  });

  it('drops and recreates the development schemas, then closes the client', async () => {
    process.env.DATABASE_URL = 'postgresql://example.test/pos';
    process.env.NODE_ENV = 'test';

    const sql = Object.assign(
      vi.fn(async () => undefined),
      { end: vi.fn().mockResolvedValue(undefined) },
    );

    vi.doMock('postgres', () => ({ default: vi.fn(() => sql) }));

    await import('../reset');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sql).toHaveBeenCalledTimes(4);
    expect(sql).toHaveBeenNthCalledWith(1, expect.anything());
    expect(sql).toHaveBeenNthCalledWith(2, expect.anything());
    expect(sql).toHaveBeenNthCalledWith(3, expect.anything());
    expect(sql).toHaveBeenNthCalledWith(4, expect.anything());
    expect(sql.end).toHaveBeenCalledOnce();
  });
});
