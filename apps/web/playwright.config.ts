import { defineConfig, devices } from '@playwright/test';

/**
 * Accessibility/runtime verification config.
 *
 * The accessibility suite contains both unauthenticated component-preview
 * fixtures and authenticated product-route fixtures. The authenticated suite
 * seeds auth state and mocks API responses so axe can inspect real application
 * screens without requiring a live backend or seeded database.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'bun run dev --host 127.0.0.1',
      cwd: '.',
      url: 'http://127.0.0.1:5173/dev/form-preview',
      env: { VITE_API_URL: '/api' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'bun run dev --host 127.0.0.1',
      cwd: '../waiter-app',
      url: 'http://127.0.0.1:5175',
      env: { VITE_API_URL: '/api' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'bun run dev --host 127.0.0.1',
      cwd: '../kitchen-display',
      url: 'http://127.0.0.1:5174',
      env: { VITE_API_URL: '/api' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
