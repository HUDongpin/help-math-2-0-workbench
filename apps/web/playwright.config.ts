import {tmpdir} from 'node:os';
import path from 'node:path';

import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3211);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1 through 65535.');
}
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const baseURL = `http://${host}:${port}`;
const novaClientRenderMockEnabled =
  process.env.NOVA_CLIENT_RENDER_MOCK_ENABLED === 'true';
const novaClientRenderMockKey = [
  'sk',
  'or',
  'v1',
  'client-render-mock-only-000000000000',
].join('-');

export default defineConfig({
  testDir: './e2e',
  // External Clerk mutation and Nova's real-route fake-upstream matrix each
  // have a dedicated, redacted, fresh-server launcher. Ordinary browser
  // regression must never discover either suite without its authorization
  // and scenario contract.
  testIgnore: [
    'clerk-synthetic-lifecycle.spec.ts',
    'nova-capability-gates.spec.ts',
    'nova-full-stack.spec.ts',
    'nova-provider-failure.spec.ts',
    'nova-speech-negative.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['line']],
  // The deployment candidate contains a large binary asset closure. Retain
  // commit/PR metadata, but do not buffer the full CI git diff in Playwright.
  captureGitInfo: {
    commit: true,
    diff: false,
  },
  outputDir:
    process.env.PLAYWRIGHT_OUTPUT_DIR
      ?? path.join(tmpdir(), 'helpmath-site-playwright-results'),
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
      // Ordinary browser regression must never connect to the development
      // Clerk instance. The destructive provider lifecycle has a separate,
      // explicitly authorized launcher and Playwright configuration.
      CLERK_LOCAL_AUTH_ENABLED: 'false',
      // The browser suite exercises unfinished candidates only in a local
      // development server. Production does not expose a review route.
      MODERN_WIDE_SHELL_ENABLED:
        process.env.MODERN_WIDE_SHELL_ENABLED ?? 'false',
      NOVA_TUTOR_ENABLED: novaClientRenderMockEnabled ? 'true' : 'false',
      NOVA_TUTOR_RELEASE_IDS: novaClientRenderMockEnabled
        ? 'lesson-g04-l03-negative-numbers'
        : '',
      NOVA_ALLOW_FRAME_CONTEXT: novaClientRenderMockEnabled ? 'true' : 'false',
      NOVA_ALLOW_SPEECH_INPUT: novaClientRenderMockEnabled ? 'true' : 'false',
      OPENROUTER_API_KEY: novaClientRenderMockEnabled
        ? novaClientRenderMockKey
        : '',
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      NOVA_MODEL: 'openai/gpt-5.6-luna',
      CURRENT_JS_SHOWCASE_G4_L3_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G4_L3_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G4_L5_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G4_L5_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G4_L10_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G4_L10_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G4_L11_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G4_L11_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G3_L2_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G3_L2_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G5_L3_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G5_L3_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G5_L4_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G5_L4_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G5_L5_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G5_L5_ENABLED ?? 'false',
      CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED:
        process.env.CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED ?? 'false',
      REVIEWER_INSTRUMENTATION_ENABLED:
        process.env.REVIEWER_INSTRUMENTATION_ENABLED ?? 'false',
    },
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1',
    timeout: 120_000,
  },
});
