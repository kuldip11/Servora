import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Load environment defaults before test modules are evaluated.
    // This is required because src/lib/redis.ts validates REDIS_URL
    // during module initialization.
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/test/**", "src/**/*.d.ts", "src/**/index.ts"],
    },
  },
});
