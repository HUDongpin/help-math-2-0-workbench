import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3211);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1 through 65535.');
}
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['line']],
  outputDir: '/tmp/helpmath-site-playwright-results',
  expect: {
    timeout: 10_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    contextOptions: {
      reducedMotion: 'reduce',
    },
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --hostname ${host} --port ${port}`,
    env: {
      // The browser suite exercises unfinished candidates only in a local
      // development server. Production does not expose a review route.
      MODERN_WIDE_SHELL_ENABLED:
        process.env.MODERN_WIDE_SHELL_ENABLED ?? 'false',
      REVIEWER_INSTRUMENTATION_ENABLED:
        process.env.REVIEWER_INSTRUMENTATION_ENABLED ?? 'false',
    },
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1',
    timeout: 120_000,
  },
});
