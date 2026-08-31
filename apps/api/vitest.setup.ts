/**
 * Test environment defaults.
 *
 * Vitest does not automatically load Bun's .env files, while the API's
 * runtime Redis module requires REDIS_URL at module evaluation time.
 * Keep tests self-contained and deterministic by providing safe local
 * defaults before any test module is imported.
 */
process.env.NODE_ENV ??= "test";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.DATABASE_URL ??=
  "postgresql://pos_user:pos_password@localhost:5434/restaurant_pos";
process.env.JWT_SECRET ??= "test-jwt-secret-change-me";
process.env.JWT_EXPIRES_IN ??= "15m";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.PORT ??= "3000";
