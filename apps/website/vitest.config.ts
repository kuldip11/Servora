import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Playwright owns everything under tests/e2e (see playwright.config.ts);
    // without this exclude, Vitest's default glob also picks up those
    // *.spec.ts files and tries to run them as Vitest tests, which fails
    // because they call Playwright's test() outside of the Playwright runner.
    exclude: ["node_modules/**", "tests/e2e/**"],
  },
});
