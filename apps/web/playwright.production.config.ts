import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3214);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1 through 65535.');
}

const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const baseURL = `http://${host}:${port}`;

const publicFeatureEnvironment = {
  // Legacy environment switches are deliberately adversarial here. The exact
  // public launch manifest must remain the final authority in production.
  MODERN_WIDE_SHELL_ENABLED: process.env.MODERN_WIDE_SHELL_ENABLED ?? 'true',
  CURRENT_JS_CANDIDATE_PROFILE_ENABLED:
    process.env.CURRENT_JS_CANDIDATE_PROFILE_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G3_L2_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G3_L2_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G4_L3_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G4_L3_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G4_L5_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G4_L5_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G4_L10_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G4_L10_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G4_L11_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G4_L11_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G5_L3_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G5_L3_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G5_L4_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G5_L5_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G5_L5_ENABLED ?? 'true',
  CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED:
    process.env.CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED ?? 'true',
  NOVA_TUTOR_ENABLED: 'true',
  LRS_ENABLED: 'true',
  CLERK_LOCAL_AUTH_ENABLED: 'false',
  CONTACT_FORM_ENABLED: 'true',
  MIGRATION_STATUS_ENABLED: '1',
  HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC: '1',
  VERCEL_ENV: 'production',
  WEB_ANALYTICS_ENABLED: 'false',
  REVIEWER_INSTRUMENTATION_ENABLED: 'false',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: 'production-smoke.spec.ts',
  fullyParallel: true,
  failOnFlakyTests: Boolean(process.env.CI),
  forbidOnly: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [['line']],
  outputDir:
    process.env.PLAYWRIGHT_OUTPUT_DIR ??
    '/tmp/helpmath-production-playwright-results',
  expect: {timeout: 10_000},
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    contextOptions: {reducedMotion: 'reduce'},
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run start -- --hostname ${host} --port ${port}`,
    env: publicFeatureEnvironment,
    url: `${baseURL}/learning-theme-bootstrap.js`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
