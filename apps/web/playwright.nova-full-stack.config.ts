import {defineConfig, devices} from '@playwright/test';
import {mkdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3214);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1 through 65535.');
}
const host = '127.0.0.1';
const baseURL = `http://${host}:${port}`;
const scenario = process.env.NOVA_FULL_STACK_SCENARIO ?? 'all-on';
const allowedScenarios = new Set([
  'all-on',
  'course-off',
  'master-off',
  'media-off',
  'modern-off',
  'provider-invalid',
  'release-empty',
  'rollout-invalid',
]);
if (!allowedScenarios.has(scenario)) {
  throw new Error(`Unknown NOVA_FULL_STACK_SCENARIO: ${scenario}`);
}
const receiptDirectory = path.join(tmpdir(), 'helpmath-nova-full-stack');
export const novaFullStackReceiptPath = path.join(
  receiptDirectory,
  `browser-receipts-${port}.ndjson`,
);

mkdirSync(receiptDirectory, {recursive: true, mode: 0o700});
// Playwright evaluates the config for `--list` as well. Listing tests must not
// erase the receipt from the most recent executed run.
if (!process.argv.includes('--list')) {
  writeFileSync(novaFullStackReceiptPath, '', {encoding: 'utf8', mode: 0o600});
}

const releaseIds = [
  'lesson-g04-l03-negative-numbers',
  'lesson-g05-l04-number-lines',
  'lesson-g03-l02-addition-subtraction-page-only-current-js',
  'lesson-g04-l05-multiplication-page-only',
  'lesson-g04-l10-perimeter-area-page-only',
  'lesson-g04-l11-coordinate-grid-page-only',
  'lesson-g05-l03-exponents-prime-factorizations-page-only',
  'lesson-g05-l05-add-subtract-negative-numbers',
].join(',');
const scenarioReleaseIds = scenario === 'course-off'
  ? 'lesson-g04-l03-negative-numbers'
  : scenario === 'release-empty'
    ? ''
    : scenario === 'rollout-invalid'
      ? [
          'lesson-g04-l03-negative-numbers',
          'lesson-g04-l03-negative-numbers',
        ].join(',')
      : releaseIds;

export default defineConfig({
  testDir: './e2e',
  testMatch: scenario === 'all-on'
    ? ['nova-full-stack.spec.ts', 'nova-speech-negative.spec.ts']
    : 'nova-capability-gates.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['line']],
  outputDir: path.join(tmpdir(), 'helpmath-nova-full-stack-playwright-results'),
  expect: {timeout: 15_000},
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    contextOptions: {reducedMotion: 'reduce'},
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --hostname ${host} --port ${port}`,
    env: {
      CLERK_LOCAL_AUTH_ENABLED: 'false',
      CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G3_L2_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G4_L10_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G4_L11_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G5_L3_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
      CURRENT_JS_SHOWCASE_G5_L5_ENABLED: 'true',
      MODERN_WIDE_SHELL_ENABLED: scenario === 'modern-off' ? 'false' : 'true',
      NOVA_ALLOW_FRAME_CONTEXT: scenario === 'media-off' ? 'false' : 'true',
      NOVA_ALLOW_SPEECH_INPUT: scenario === 'media-off' ? 'false' : 'true',
      NOVA_MAX_OUTPUT_TOKENS: '700',
      NOVA_MODEL: 'openai/gpt-5.6-luna',
      NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION: 'full-stack-fake-upstream-v1',
      NOVA_TEST_FAKE_TRANSPORT_ORIGIN: baseURL,
      NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH: novaFullStackReceiptPath,
      NOVA_TIMEOUT_MS: '45000',
      NOVA_TUTOR_ENABLED: scenario === 'master-off' ? 'false' : 'true',
      NOVA_TUTOR_RATE_LIMIT_PER_MINUTE: '120',
      NOVA_TUTOR_RELEASE_IDS: scenarioReleaseIds,
      OPENROUTER_API_KEY: scenario === 'provider-invalid'
        ? 'invalid-test-key'
        : 'sk-or-v1-local-full-stack-fake-transport-000000000000',
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      PLAYWRIGHT_PORT: String(port),
    },
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
