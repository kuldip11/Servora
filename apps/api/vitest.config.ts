import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {

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
