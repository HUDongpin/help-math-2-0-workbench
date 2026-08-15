import {tmpdir} from 'node:os';
import path from 'node:path';

import {defineConfig, devices} from '@playwright/test';

import {
  CLERK_SYNTHETIC_HOST,
  CLERK_SYNTHETIC_ORIGIN,
  CLERK_SYNTHETIC_PORT,
  CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION,
  CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION,
  CLERK_SYNTHETIC_RUNNER_GUARD,
} from './lib/clerk-synthetic-execution';

if (
  process.env.CLERK_SYNTHETIC_RUNNER_GUARD
  !== CLERK_SYNTHETIC_RUNNER_GUARD
) {
  throw new Error('Clerk synthetic config requires the governed launcher.');
}

for (const variable of [
  'ALL_PROXY',
  'CLERK_API_URL',
  'CLERK_FAPI',
  'CLERK_FAPI_URL',
  'CLERK_TESTING_TOKEN',
  'DEBUG',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NODE_EXTRA_CA_CERTS',
  'NODE_TLS_REJECT_UNAUTHORIZED',
  'NODE_USE_ENV_PROXY',
  'PWDEBUG',
  'SSL_CERT_DIR',
  'SSL_CERT_FILE',
  'all_proxy',
  'https_proxy',
  'http_proxy',
] as const) {
  if ((process.env[variable] ?? '').length > 0) {
    throw new Error('Clerk synthetic config rejected ambient overrides.');
  }
}
if (
  process.env.PLAYWRIGHT_HOST !== CLERK_SYNTHETIC_HOST
  || process.env.PLAYWRIGHT_PORT !== String(CLERK_SYNTHETIC_PORT)
  || process.env.CLERK_LOCAL_AUTH_ORIGIN !== CLERK_SYNTHETIC_ORIGIN
  || process.env.PLAYWRIGHT_NO_COPY_PROMPT !== '1'
  || process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1'
) {
  throw new Error('Clerk synthetic loopback boundary failed closed.');
}
const localAuthEnabled = process.env.CLERK_LOCAL_AUTH_ENABLED;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const keylessDisabled = process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (
  localAuthEnabled !== 'true'
  || keylessDisabled !== 'true'
  || typeof clerkSecretKey !== 'string'
  || clerkSecretKey.length === 0
  || typeof clerkPublishableKey !== 'string'
  || clerkPublishableKey.length === 0
) {
  throw new Error('Clerk synthetic provider configuration failed closed.');
}

const outputDir = process.env.CLERK_SYNTHETIC_OUTPUT_DIR ?? '';
if (
  path.dirname(outputDir) !== tmpdir()
  || !/^help-math-clerk-synthetic-[a-zA-Z0-9_-]+$/u.test(
    path.basename(outputDir),
  )
) {
  throw new Error('Clerk synthetic output directory failed closed.');
}
const recoveryOnly = process.env.CLERK_SYNTHETIC_RECOVERY_ONLY
  === CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION;
const pickEnvironment = (names: readonly string[]) => Object.fromEntries(
  names.flatMap((name) => {
    const value = process.env[name];
    return value === undefined ? [] : [[name, value]];
  }),
);
const processRuntimeEnvironment = pickEnvironment([
  'HOME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'PATH',
  'TEMP',
  'TMP',
  'TMPDIR',
]);
const browserEnvironment = pickEnvironment([
  'HOME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TEMP',
  'TMP',
  'TMPDIR',
]);

export default defineConfig({
  testDir: './e2e',
  testMatch: 'clerk-synthetic-lifecycle.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  globalTimeout: 300_000,
  retries: 0,
  workers: 1,
  reporter: [['./e2e/clerk-synthetic-redacted-reporter.ts']],
  outputDir,
  expect: {timeout: 10_000},
  use: {
    ...devices['Desktop Chrome'],
    baseURL: CLERK_SYNTHETIC_ORIGIN,
    contextOptions: {reducedMotion: 'reduce'},
    launchOptions: {
      args: ['--no-proxy-server'],
      env: browserEnvironment,
    },
    locale: 'en-US',
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  webServer: recoveryOnly ? undefined : {
    command:
      `npm run dev -- --hostname 127.0.0.1 --port ${CLERK_SYNTHETIC_PORT}`,
    env: {
      ...processRuntimeEnvironment,
      __NEXT_PROCESSED_ENV: 'true',
      CLERK_LOCAL_AUTH_ENABLED: localAuthEnabled,
      CLERK_LOCAL_AUTH_ORIGIN: CLERK_SYNTHETIC_ORIGIN,
      CLERK_SECRET_KEY: clerkSecretKey,
      HELP_MATH_CLERK_SYNTHETIC_BUILD:
        CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION,
      NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: keylessDisabled,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'development',
    },
    reuseExistingServer: false,
    stderr: 'ignore',
    stdout: 'ignore',
    timeout: 120_000,
    url: `${CLERK_SYNTHETIC_ORIGIN}/robots.txt`,
  },
});
