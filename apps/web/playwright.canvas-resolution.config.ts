import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig, devices} from '@playwright/test';

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(webRoot, '../..');
const hashReporter = path.join(
  webRoot,
  'e2e/canvas-resolution-hash-reporter.ts',
);

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3222);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1 through 65535.');
}
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const localBaseURL = `http://${host}:${port}`;
const requestedPreviewOrigin =
  process.env.CANVAS_RESOLUTION_BASE_URL?.trim() ?? '';
let baseURL = localBaseURL;
let deploymentId: string | null = null;
let runScope: 'local-candidate' | 'production-preview' = 'local-candidate';
if (requestedPreviewOrigin) {
  const preview = new URL(requestedPreviewOrigin);
  if (
    preview.protocol !== 'https:' ||
    preview.username ||
    preview.password ||
    preview.port ||
    preview.pathname !== '/' ||
    preview.search ||
    preview.hash ||
    !preview.hostname.endsWith('.vercel.app')
  ) {
    throw new Error(
      'CANVAS_RESOLUTION_BASE_URL must be a credential-free HTTPS Vercel deployment origin.',
    );
  }
  deploymentId = process.env.CANVAS_RESOLUTION_DEPLOYMENT_ID?.trim() ?? null;
  if (!deploymentId || !/^dpl_[A-Za-z0-9]+$/u.test(deploymentId)) {
    throw new Error(
      'CANVAS_RESOLUTION_DEPLOYMENT_ID is required for an exact preview origin.',
    );
  }
  preview.pathname = '';
  baseURL = preview.href.replace(/\/$/u, '');
  runScope = 'production-preview';
}

const productionLessonFlags = {
  CLERK_LOCAL_AUTH_ENABLED: 'false',
  CURRENT_JS_SHOWCASE_G3_L2_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L3_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L5_ENABLED: 'true',
  CURRENT_JS_SHOWCASE_G5_L4_AUDIO_ENABLED: 'true',
  MODERN_WIDE_SHELL_ENABLED: 'true',
  REVIEWER_INSTRUMENTATION_ENABLED: 'true',
};

export default defineConfig({
  metadata: {
    canvasResolutionRun: {
      runScope,
      baseURL,
      deploymentId,
      performanceScope:
        process.env.CANVAS_RESOLUTION_PERFORMANCE_SCOPE ??
        'production-preview-full',
    },
  },
  testDir: './e2e',
  testMatch: [
    'canvas-resolution.spec.ts',
    'canvas-resolution-performance.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['line'],
    [hashReporter, {
      workspaceRoot,
      outputDirectory: path.join(
        workspaceRoot,
        'reports/canvas-resolution/e2e/runs',
      ),
      requiredInputs: [
        'package.json',
        'package-lock.json',
        'apps/web/package.json',
        'apps/web/playwright.canvas-resolution.config.ts',
        'apps/web/e2e/canvas-resolution-hash-reporter.ts',
        'apps/web/e2e/canvas-resolution.spec.ts',
        'apps/web/e2e/canvas-resolution-performance-contract.ts',
        'apps/web/e2e/canvas-resolution-performance.spec.ts',
        'apps/web/config/current-js-production-assets.v2.json',
        'packages/demos/src/adaptive-canvas-production-bindings.generated.ts',
        'reports/canvas-resolution/performance/v1-baseline.json',
      ],
    }],
  ],
  outputDir: '/tmp/helpmath-canvas-resolution-playwright-results',
  expect: {timeout: 15_000},
  use: {
    actionTimeout: 15_000,
    baseURL,
    locale: 'en-US',
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium-retina',
      use: {...devices['Desktop Chrome'], deviceScaleFactor: 2},
    },
    {
      name: 'firefox-retina',
      use: {...devices['Desktop Firefox'], deviceScaleFactor: 2},
    },
    {
      name: 'webkit-retina',
      use: {...devices['Desktop Safari'], deviceScaleFactor: 2},
    },
  ],
  webServer: runScope === 'local-candidate'
    ? {
        command: `npm run dev -- --hostname ${host} --port ${port}`,
        env: productionLessonFlags,
        url: `${baseURL}/robots.txt`,
        reuseExistingServer:
          process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1',
        timeout: 180_000,
      }
    : undefined,
});
