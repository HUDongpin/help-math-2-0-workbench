import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {
  expect,
  test,
  type Browser,
  type CDPSession,
  type Page,
} from '@playwright/test';

import {
  type CanvasPerformanceTarget,
  validatePerformanceBaselineCoverage,
} from './canvas-resolution-performance-contract';

/**
 * Chromium-only hard performance/leak gate for adaptive Canvas resolution.
 *
 * This file is intentionally independent from canvas-resolution.spec.ts and
 * is explicitly admitted by the dedicated config's reviewed testMatch list.
 * It never skips a missing production v2 profile or v1 baseline receipt:
 * either input is a gate failure before browser work starts.
 */

const execFileAsync = promisify(execFile);
const WEB_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const WORKSPACE_ROOT = path.resolve(WEB_ROOT, '../..');
const V2_PROFILE_PATH = path.join(
  WEB_ROOT,
  'config/current-js-production-assets.v2.json',
);
const ACTIVE_BINDINGS_PATH = path.join(
  WORKSPACE_ROOT,
  'packages/demos/src/adaptive-canvas-production-bindings.generated.ts',
);
const V1_PERFORMANCE_BASELINE_PATH = path.join(
  WORKSPACE_ROOT,
  'reports/canvas-resolution/performance/v1-baseline.json',
);
const V1_PROFILE_CHECKSUM =
  '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25';
const PAGE_RENDERER =
  /^courses\/(course-g(?:03|04|05)-l\d{2}-[^/]+)\/canvas-renderer\.js$/u;
const REQUIRED_PERFORMANCE_PILOT_IDS = Object.freeze([
  'course-g04-l03-in-002',
  'course-g04-l03-in-003',
  'course-g04-l03-rw-003',
  'course-g04-l03-in-009',
  'course-g04-l03-ir-001-341242cc',
  'course-g04-l03-rw-002',
  'course-g05-l04-fq-002',
  'course-g05-l04-fq-003',
  'course-g05-l05-fq-003',
  'course-g05-l03-rw-002',
  'course-g05-l03-in-028',
  'course-g04-l03-gs-002',
]);
const LEAK_NAVIGATION_PILOT_ID = 'course-g04-l03-in-002';
const FONT_PILOT_ID = 'course-g04-l03-gs-002';
const FONT_PILOT_ORDINAL = 29;
const FONT_PILOT_IDENTITY = Object.freeze({
  requirementId: 'req:sprite-321:lesson-shell-natural-entry:en',
  frameDomainId: 'sprite-321',
  traceId: 'trace:sprite-321:lesson-shell-natural-entry:en:seed-0',
  entryStateSha256:
    'a1e46925e0d38c99565e5218712663aea69c93d83870bdf5c7f027ba6610501c',
  frame: 427,
  scenario: 'source-static-frame',
  language: 'en' as const,
  seed: '0',
});
const FONT_FACE_CHECKS = Object.freeze([
  Object.freeze({
    id: 'timer-arial',
    css: 'bold 12.7998046875px Arial, sans-serif',
    sample: '00:00:00',
  }),
  Object.freeze({
    id: 'score-bauhaus-fallback',
    css: 'bold 17px "Bauhaus Md BT", "Arial Rounded MT Bold", sans-serif',
    sample: '0',
  }),
]);
const REPEATED_PLACEMENT_PILOT_ID = 'course-g05-l03-in-028';
const REPEATED_PLACEMENTS = Object.freeze([
  Object.freeze({
    placementId: 'g05-l03-placement-045',
    ordinal: 45,
  }),
  Object.freeze({
    placementId: 'g05-l03-placement-046',
    ordinal: 46,
  }),
]);
const PERFORMANCE_SCOPE =
  process.env.CANVAS_RESOLUTION_PERFORMANCE_SCOPE ??
  'production-preview-full';
if (PERFORMANCE_SCOPE !== 'ci-pilots' &&
  PERFORMANCE_SCOPE !== 'production-preview-full') {
  throw new Error(
    'CANVAS_RESOLUTION_PERFORMANCE_SCOPE must be ci-pilots or production-preview-full',
  );
}

type PerformancePilot = CanvasPerformanceTarget;

interface FontTransformMetric {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

interface FontFillTextMetric {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly font: string;
  readonly textAlign: CanvasTextAlign;
  readonly textBaseline: CanvasTextBaseline;
  readonly width: number;
  readonly actualBoundingBoxAscent: number;
  readonly actualBoundingBoxDescent: number;
  readonly actualBoundingBoxLeft: number;
  readonly actualBoundingBoxRight: number;
  readonly transform: FontTransformMetric;
}

interface FontPilotBaseline {
  readonly animationId: typeof FONT_PILOT_ID;
  readonly ordinal: typeof FONT_PILOT_ORDINAL;
  readonly identity: typeof FONT_PILOT_IDENTITY;
  readonly metricTolerancePx: number;
  readonly fontChecks: ReadonlyArray<{
    readonly id: string;
    readonly css: string;
    readonly sample: string;
    readonly ready: boolean;
  }>;
  readonly k1FillTextCalls: readonly [
    FontFillTextMetric,
    FontFillTextMetric,
  ];
}

interface BaselineReceipt {
  readonly schemaVersion: 1;
  readonly artifactType: 'canvas-resolution-v1-performance-baseline';
  readonly contentSha256: string;
  readonly payload: {
    readonly profile: {
      readonly profileId: 'current-js-production-assets-v1';
      readonly checksumSetSha256: string;
    };
    readonly environment: {
      readonly cpuThrottleRate: 2;
      readonly browserName: 'chromium';
      readonly browserVersion: string;
      readonly operatingSystem: string;
    };
    readonly renderers: readonly PerformancePilot[];
    readonly pilots: readonly PerformancePilot[];
    readonly fontPilot: FontPilotBaseline;
  };
}

interface GateInputs {
  readonly v2ProfileSha256: string;
  readonly v2ChecksumSetSha256: string;
  readonly baseline: BaselineReceipt;
  readonly renderers: readonly PerformancePilot[];
  readonly pilots: readonly PerformancePilot[];
}

interface LeakSnapshot {
  readonly connectedCanvasCount: number;
  readonly detachedCanvasCount: number;
  readonly backingPixelArea: number;
  readonly pendingAnimationFrameCount: number;
  readonly pendingTimeoutCount: number;
  readonly activeIntervalCount: number;
  readonly heapBytes: number;
  readonly rssBytes: number;
  readonly documents: number;
  readonly nodes: number;
  readonly listeners: number;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]));
  }
  return value;
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function sha256(bytes: Buffer | string) {
  return createHash('sha256').update(bytes).digest('hex');
}

function verifyHashBoundReceipt(receipt: BaselineReceipt) {
  expect(Object.keys(receipt).sort()).toEqual([
    'artifactType',
    'contentSha256',
    'payload',
    'schemaVersion',
  ]);
  expect(receipt.schemaVersion).toBe(1);
  expect(receipt.artifactType).toBe(
    'canvas-resolution-v1-performance-baseline',
  );
  expect(receipt.contentSha256).toMatch(/^[a-f0-9]{64}$/u);
  expect(receipt.contentSha256).toBe(sha256(canonicalJson({
    schemaVersion: receipt.schemaVersion,
    artifactType: receipt.artifactType,
    payload: receipt.payload,
  })));
}

async function loadGateInputs(): Promise<GateInputs> {
  let v2Bytes: Buffer;
  let baselineBytes: Buffer;
  let bindings: string;
  try {
    [v2Bytes, baselineBytes, bindings] = await Promise.all([
      readFile(V2_PROFILE_PATH),
      readFile(V1_PERFORMANCE_BASELINE_PATH),
      readFile(ACTIVE_BINDINGS_PATH, 'utf8'),
    ]);
  } catch (error) {
    throw new Error(
      `Canvas performance gate input is missing: ${(error as Error).message}`,
    );
  }
  const profile = JSON.parse(v2Bytes.toString('utf8')) as {
    schemaVersion?: number;
    profileId?: string;
    parentProfileId?: string;
    parentChecksumSetSha256?: string;
    checksumSetSha256?: string;
    entries?: Array<{assetPath?: string}>;
  };
  expect(profile.schemaVersion).toBe(2);
  expect(profile.profileId).toBe('current-js-production-assets-v2');
  expect(profile.parentProfileId).toBe('current-js-production-assets-v1');
  expect(profile.parentChecksumSetSha256).toBe(V1_PROFILE_CHECKSUM);
  expect(profile.checksumSetSha256).toMatch(/^[a-f0-9]{64}$/u);
  const rendererIds = (profile.entries ?? [])
    .map(({assetPath}) => PAGE_RENDERER.exec(assetPath ?? '')?.[1] ?? null)
    .filter((value): value is string => value !== null);
  expect(rendererIds).toHaveLength(283);
  expect(new Set(rendererIds).size).toBe(283);
  const activeBindingIds = [...bindings.matchAll(
    /animationId:\s*"(course-g(?:03|04|05)-l\d{2}-[^"]+)"/gu,
  )].map((match) => match[1]!);
  expect(new Set(activeBindingIds).size).toBe(284);
  expect(rendererIds.every((id) => activeBindingIds.includes(id))).toBe(true);

  const baseline = JSON.parse(
    baselineBytes.toString('utf8'),
  ) as BaselineReceipt;
  verifyHashBoundReceipt(baseline);
  expect(baseline.payload.profile.profileId).toBe(
    'current-js-production-assets-v1',
  );
  expect(baseline.payload.profile.checksumSetSha256).toBe(
    V1_PROFILE_CHECKSUM,
  );
  expect(baseline.payload.environment.cpuThrottleRate).toBe(2);
  expect(baseline.payload.environment.browserName).toBe('chromium');
  expect(baseline.payload.environment.browserVersion).toBeTruthy();
  expect(baseline.payload.environment.operatingSystem).toBeTruthy();
  expect(validatePerformanceBaselineCoverage({
    profileRendererIds: rendererIds,
    renderers: baseline.payload.renderers,
    pilots: baseline.payload.pilots,
    requiredPilotIds: REQUIRED_PERFORMANCE_PILOT_IDS,
  })).toEqual({rendererCount: 283, pilotCount: 12});
  const fontPilot = baseline.payload.fontPilot;
  expect(fontPilot.animationId).toBe(FONT_PILOT_ID);
  expect(fontPilot.ordinal).toBe(FONT_PILOT_ORDINAL);
  expect(fontPilot.identity).toEqual(FONT_PILOT_IDENTITY);
  expect(Number.isFinite(fontPilot.metricTolerancePx) &&
    fontPilot.metricTolerancePx >= 0 &&
    fontPilot.metricTolerancePx <= 0.1).toBe(true);
  expect(fontPilot.fontChecks.map(({id, css, sample}) => ({id, css, sample})))
    .toEqual(FONT_FACE_CHECKS);
  expect(fontPilot.fontChecks.every(({ready}) => typeof ready === 'boolean'))
    .toBe(true);
  expect(fontPilot.k1FillTextCalls).toHaveLength(2);
  const [timerCall, scoreCall] = fontPilot.k1FillTextCalls;
  expect(timerCall).toMatchObject({
    text: '00:00:00',
    x: 102.29940490722656,
    y: 164.4998291015625,
    textAlign: 'center',
    textBaseline: 'alphabetic',
  });
  expect(timerCall.font).toContain('Arial');
  expect(scoreCall).toMatchObject({
    text: '0',
    x: 268.9,
    y: 153.1,
    textAlign: 'center',
    textBaseline: 'alphabetic',
  });
  expect(scoreCall.font).toContain('Bauhaus Md BT');
  expect(scoreCall.font).toContain('Arial Rounded MT Bold');
  for (const call of fontPilot.k1FillTextCalls) {
    expect([
      call.x,
      call.y,
      call.width,
      call.actualBoundingBoxAscent,
      call.actualBoundingBoxDescent,
      call.actualBoundingBoxLeft,
      call.actualBoundingBoxRight,
      call.transform.a,
      call.transform.b,
      call.transform.c,
      call.transform.d,
      call.transform.e,
      call.transform.f,
    ].every(Number.isFinite)).toBe(true);
  }
  return {
    v2ProfileSha256: sha256(v2Bytes),
    v2ChecksumSetSha256: profile.checksumSetSha256!,
    baseline,
    renderers: baseline.payload.renderers,
    pilots: baseline.payload.pilots,
  };
}

async function installLeakInstrumentation(page: Page) {
  await page.addInitScript(() => {
    const createdCanvases = new Set<WeakRef<HTMLCanvasElement>>();
    const originalCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function createElement(
      name: string,
      options?: ElementCreationOptions,
    ) {
      const element = originalCreateElement.call(this, name, options);
      if (name.toLowerCase() === 'canvas') {
        createdCanvases.add(new WeakRef(element as HTMLCanvasElement));
      }
      return element;
    };

    const pendingAnimationFrames = new Set<number>();
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      let handle = 0;
      handle = nativeRequestAnimationFrame((time) => {
        pendingAnimationFrames.delete(handle);
        callback(time);
      });
      pendingAnimationFrames.add(handle);
      return handle;
    };
    window.cancelAnimationFrame = (handle: number) => {
      pendingAnimationFrames.delete(handle);
      nativeCancelAnimationFrame(handle);
    };

    const pendingTimeouts = new Set<number>();
    const activeIntervals = new Set<number>();
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      let handle = 0;
      const wrapped = typeof handler === 'function'
        ? () => {
            pendingTimeouts.delete(handle);
            handler(...args);
          }
        : handler;
      handle = nativeSetTimeout(wrapped, timeout);
      pendingTimeouts.add(handle);
      return handle;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((handle?: number) => {
      if (handle !== undefined) pendingTimeouts.delete(handle);
      nativeClearTimeout(handle);
    }) as typeof window.clearTimeout;
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const handle = nativeSetInterval(handler, timeout, ...args);
      activeIntervals.add(handle);
      return handle;
    }) as typeof window.setInterval;
    window.clearInterval = ((handle?: number) => {
      if (handle !== undefined) activeIntervals.delete(handle);
      nativeClearInterval(handle);
    }) as typeof window.clearInterval;

    const longTasks: number[] = [];
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    try {
      longTaskObserver.observe({entryTypes: ['longtask']});
    } catch {
      // Chromium in the approved matrix is required to expose long tasks.
      longTasks.push(Number.POSITIVE_INFINITY);
    }

    let contextLostCount = 0;
    document.addEventListener('contextlost', () => {
      contextLostCount += 1;
    }, {capture: true});

    const state = {
      createdCanvases,
      pendingAnimationFrames,
      pendingTimeouts,
      activeIntervals,
      longTasks,
      get contextLostCount() { return contextLostCount; },
    };
    (window as unknown as {__canvasResolutionPerf: typeof state})
      .__canvasResolutionPerf = state;
  });
}

async function installFontInstrumentation(page: Page) {
  await page.addInitScript(() => {
    const calls: Array<FontFillTextMetric & {
      canvasWidth: number;
      canvasHeight: number;
    }> = [];
    const nativeFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function fillText(
      text: string,
      x: number,
      y: number,
      maxWidth?: number,
    ) {
      const metrics = this.measureText(String(text));
      const transform = this.getTransform();
      calls.push({
        text: String(text),
        x,
        y,
        font: this.font,
        textAlign: this.textAlign,
        textBaseline: this.textBaseline,
        width: metrics.width,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
        actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
        actualBoundingBoxRight: metrics.actualBoundingBoxRight,
        transform: {
          a: transform.a,
          b: transform.b,
          c: transform.c,
          d: transform.d,
          e: transform.e,
          f: transform.f,
        },
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
      });
      if (calls.length > 10_000) calls.splice(0, calls.length - 10_000);
      if (maxWidth === undefined) {
        return nativeFillText.call(this, text, x, y);
      }
      return nativeFillText.call(this, text, x, y, maxWidth);
    };
    (window as unknown as {
      __canvasResolutionFontCalls: typeof calls;
    }).__canvasResolutionFontCalls = calls;
  });
}

function fontCaptureUrl(baseURL: string, fontPilot: FontPilotBaseline) {
  const url = new URL(`/animations/${fontPilot.animationId}`, baseURL);
  const {identity} = fontPilot;
  url.searchParams.set('capture', '1');
  url.searchParams.set('requirementId', identity.requirementId);
  url.searchParams.set('frameDomain', identity.frameDomainId);
  url.searchParams.set('trace', identity.traceId);
  url.searchParams.set('entryStateSha256', identity.entryStateSha256);
  url.searchParams.set('frame', String(identity.frame));
  url.searchParams.set('scenario', identity.scenario);
  url.searchParams.set('lang', identity.language);
  url.searchParams.set('seed', identity.seed);
  return url.href;
}

async function captureFontPilotAtScale(
  browser: Browser,
  baseURL: string,
  fontPilot: FontPilotBaseline,
  scale: 1 | 2,
) {
  const context = await browser.newContext({
    deviceScaleFactor: scale,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: 1440, height: 900},
  });
  const page = await context.newPage();
  try {
    await installFontInstrumentation(page);
    const signals = observeErrors(page);
    const response = await page.goto(fontCaptureUrl(baseURL, fontPilot), {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(200);
    const canvas = page.locator(
      `canvas[data-course-canvas="${fontPilot.animationId}"]`,
    );
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-render-state', 'ready');
    await expect(canvas).toHaveAttribute('data-capture-stage', 'true');
    await expect(canvas).toHaveAttribute('data-render-scale', String(scale));
    const observation = await page.evaluate(async ({checks, animationId}) => {
      await document.fonts.ready;
      const canvasNode = document.querySelector<HTMLCanvasElement>(
        `canvas[data-course-canvas="${animationId}"]`,
      );
      if (!canvasNode) throw new Error('font pilot Canvas is missing');
      const recorded = (window as unknown as {
        __canvasResolutionFontCalls: Array<FontFillTextMetric & {
          canvasWidth: number;
          canvasHeight: number;
        }>;
      }).__canvasResolutionFontCalls;
      const timer = recorded.filter((call) =>
        call.text === '00:00:00' && call.font.includes('Arial')).at(-1);
      const score = recorded.filter((call) =>
        call.text === '0' && call.font.includes('Bauhaus Md BT') &&
        call.font.includes('Arial Rounded MT Bold')).at(-1);
      if (!timer || !score) {
        throw new Error('font pilot did not execute both source-bound fillText calls');
      }
      const stripCanvas = (call: FontFillTextMetric & {
        canvasWidth: number;
        canvasHeight: number;
      }): FontFillTextMetric => ({
        text: call.text,
        x: call.x,
        y: call.y,
        font: call.font,
        textAlign: call.textAlign,
        textBaseline: call.textBaseline,
        width: call.width,
        actualBoundingBoxAscent: call.actualBoundingBoxAscent,
        actualBoundingBoxDescent: call.actualBoundingBoxDescent,
        actualBoundingBoxLeft: call.actualBoundingBoxLeft,
        actualBoundingBoxRight: call.actualBoundingBoxRight,
        transform: call.transform,
      });
      const visibleCanvases = [...document.querySelectorAll<HTMLCanvasElement>(
        'canvas',
      )].filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return candidate.isConnected && rect.width > 0 && rect.height > 0 &&
          style.display !== 'none' && style.visibility !== 'hidden';
      });
      return {
        fontsReady: document.fonts.status === 'loaded',
        fontChecks: checks.map((check) => ({
          ...check,
          ready: document.fonts.check(check.css, check.sample),
        })),
        canvas: {
          width: canvasNode.width,
          height: canvasNode.height,
          renderScale: Number(canvasNode.dataset.renderScale),
          visibleCanvasCount: visibleCanvases.length,
        },
        identity: {
          animationId:
            canvasNode.dataset.animationId ?? canvasNode.dataset.courseCanvas,
          requirementId: canvasNode.dataset.flashRequirementId,
          frameDomainId: canvasNode.dataset.flashFrameDomain,
          traceId: canvasNode.dataset.flashTraceId,
          entryStateSha256: canvasNode.dataset.flashEntryStateSha256,
          frame: Number(canvasNode.dataset.flashFrame),
          scenario:
            canvasNode.dataset.flashScenario ??
            canvasNode.dataset.runtimeScenario,
          language:
            canvasNode.dataset.flashLang ?? canvasNode.dataset.runtimeLanguage,
          seed: canvasNode.dataset.flashSeed ?? canvasNode.dataset.runtimeSeed,
        },
        sourceCalls: [stripCanvas(timer), stripCanvas(score)],
        sourceCallCanvasDimensions: [
          {width: timer.canvasWidth, height: timer.canvasHeight},
          {width: score.canvasWidth, height: score.canvasHeight},
        ],
      };
    }, {checks: FONT_FACE_CHECKS, animationId: fontPilot.animationId});
    expect(signals).toEqual({
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      httpErrors: [],
    });
    return observation;
  } finally {
    await context.close();
  }
}

function expectWithin(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}, received ${actual}`,
  ).toBeLessThanOrEqual(tolerance);
}

function expectFontCall(
  actual: FontFillTextMetric,
  baseline: FontFillTextMetric,
  metricTolerancePx: number,
  transformScale: 1 | 2,
) {
  expect({
    text: actual.text,
    font: actual.font,
    textAlign: actual.textAlign,
    textBaseline: actual.textBaseline,
  }).toEqual({
    text: baseline.text,
    font: baseline.font,
    textAlign: baseline.textAlign,
    textBaseline: baseline.textBaseline,
  });
  for (const key of [
    'x',
    'y',
    'width',
    'actualBoundingBoxAscent',
    'actualBoundingBoxDescent',
    'actualBoundingBoxLeft',
    'actualBoundingBoxRight',
  ] as const) {
    expectWithin(
      actual[key],
      baseline[key],
      metricTolerancePx,
      `${baseline.text}.${key}`,
    );
  }
  for (const key of ['a', 'b', 'c', 'd', 'e', 'f'] as const) {
    expectWithin(
      actual.transform[key],
      baseline.transform[key] * transformScale,
      metricTolerancePx,
      `${baseline.text}.transform.${key}`,
    );
  }
}

function observeErrors(page: Page) {
  const signals = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    failedRequests: [] as string[],
    httpErrors: [] as string[],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') signals.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => signals.pageErrors.push(error.message));
  page.on('requestfailed', (request) => signals.failedRequests.push(
    `${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`,
  ));
  page.on('response', (response) => {
    if (response.status() >= 400 && /^https?:/u.test(response.url())) {
      signals.httpErrors.push(`${response.status()} :: ${response.url()}`);
    }
  });
  return signals;
}

async function openPilot(page: Page, baseURL: string, pilot: PerformancePilot) {
  const started = Date.now();
  const response = await page.goto(
    new URL(`/courses/${pilot.grade}/${pilot.lesson}?mode=focus`, baseURL).href,
    {waitUntil: 'domcontentloaded'},
  );
  expect(response?.status()).toBe(200);
  const player = page.locator('[data-lesson-player]').first();
  await expect(player).toHaveAttribute('data-hydrated', 'true');
  await page.evaluate(({placementId, animationId}) => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
    const target = placementId
      ? buttons.find((button) => button.dataset.placementId === placementId)
      : buttons.find((button) => button.dataset.animationId === animationId);
    if (!target) throw new Error('performance pilot placement button is missing');
    target.click();
  }, pilot);
  await expect(player).toHaveAttribute(
    'data-current-animation-id',
    pilot.animationId,
  );
  await expect(player).toHaveAttribute(
    'data-current-page',
    String(pilot.ordinal),
  );
  if (pilot.placementId) {
    await expect(player).toHaveAttribute(
      'data-current-placement-id',
      pilot.placementId,
    );
  }
  const canvas = page.locator(
    `[data-lesson-player] canvas[data-course-canvas="${pilot.animationId}"]`,
  );
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-render-state', 'ready');
  await expect(canvas).toHaveAttribute('data-render-scale', '2');
  return {canvas, firstReadyMs: Date.now() - started, player};
}

async function captureRepeatedPlacements(
  browser: Browser,
  baseURL: string,
  locale: 'en' | 'es',
) {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    viewport: {width: 1440, height: 900},
  });
  const page = await context.newPage();
  try {
    const signals = observeErrors(page);
    await page.route('**/api/learning-events', async (route) => {
      await route.fulfill({status: 204});
    });
    const prefix = locale === 'es' ? '/es' : '';
    const response = await page.goto(
      new URL(`${prefix}/courses/5/3?mode=focus`, baseURL).href,
      {waitUntil: 'domcontentloaded'},
    );
    expect(response?.status()).toBe(200);
    const player = page.locator('[data-lesson-player]').first();
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('data-hydrated', 'true');
    const activations = [];
    for (const placement of REPEATED_PLACEMENTS) {
      const navigationTarget = player.locator(
        `button[data-placement-id="${placement.placementId}"]` +
          `[data-animation-id="${REPEATED_PLACEMENT_PILOT_ID}"]`,
      );
      await expect(navigationTarget).toHaveCount(1);
      await navigationTarget.click();
      await expect(player).toHaveAttribute(
        'data-current-animation-id',
        REPEATED_PLACEMENT_PILOT_ID,
      );
      await expect(player).toHaveAttribute(
        'data-current-placement-id',
        placement.placementId,
      );
      await expect(player).toHaveAttribute(
        'data-current-page',
        String(placement.ordinal),
      );
      const canvas = player.locator(
        `canvas[data-course-canvas="${REPEATED_PLACEMENT_PILOT_ID}"]`,
      );
      await expect(canvas).toHaveCount(1);
      await expect(canvas).toBeVisible();
      await expect(canvas).toHaveAttribute('data-render-state', 'ready');
      await expect(canvas).toHaveAttribute('data-capture-stage', 'true');
      await expect(canvas).toHaveAttribute('data-render-scale', '2');
      const snapshot = await canvas.evaluate((node) => {
        if (!(node instanceof HTMLCanvasElement)) {
          throw new Error('repeated placement target is not a Canvas');
        }
        const playerNode = node.closest<HTMLElement>('[data-lesson-player]');
        const runtime = node.closest<HTMLElement>('.runtime-stage');
        if (!playerNode || !runtime) {
          throw new Error('repeated placement Canvas host identity is missing');
        }
        const visibleCanvases = [...playerNode.querySelectorAll<HTMLCanvasElement>(
          'canvas',
        )].filter((candidate) => {
          const rect = candidate.getBoundingClientRect();
          const style = getComputedStyle(candidate);
          return candidate.isConnected && rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden';
        });
        return {
          placementId: playerNode.dataset.currentPlacementId,
          ordinal: Number(playerNode.dataset.currentPage),
          animationId: playerNode.dataset.currentAnimationId,
          canvasAnimationId: node.dataset.courseCanvas,
          captureIdentityStatus: node.dataset.captureIdentityStatus,
          backingWidth: node.width,
          backingHeight: node.height,
          visibleCanvasCount: visibleCanvases.length,
          runtimeIdentity: {
            requirementId: node.dataset.flashRequirementId,
            frameDomainId: node.dataset.flashFrameDomain,
            traceId: node.dataset.flashTraceId,
            entryStateSha256: node.dataset.flashEntryStateSha256,
            frame: node.dataset.flashFrame,
            scenario:
              node.dataset.flashScenario ?? node.dataset.runtimeScenario,
            language: node.dataset.flashLang ?? node.dataset.runtimeLanguage,
            seed: node.dataset.flashSeed ?? node.dataset.runtimeSeed,
          },
          runtimeHostIdentity: {
            animationId: runtime.dataset.animationId,
            requirementId: runtime.dataset.flashRequirementId,
            frameDomainId: runtime.dataset.flashFrameDomain,
            traceId: runtime.dataset.flashTraceId,
            entryStateSha256: runtime.dataset.flashEntryStateSha256,
            frame: runtime.dataset.flashFrame,
            scenario:
              runtime.dataset.flashScenario ?? runtime.dataset.runtimeScenario,
            language:
              runtime.dataset.flashLang ?? runtime.dataset.runtimeLanguage,
            seed: runtime.dataset.flashSeed ?? runtime.dataset.runtimeSeed,
          },
        };
      });
      expect(snapshot).toMatchObject({
        placementId: placement.placementId,
        ordinal: placement.ordinal,
        animationId: REPEATED_PLACEMENT_PILOT_ID,
        canvasAnimationId: REPEATED_PLACEMENT_PILOT_ID,
        captureIdentityStatus: 'verified',
        backingWidth: 1600,
        backingHeight: 1200,
        visibleCanvasCount: 1,
      });
      expect(snapshot.runtimeIdentity.language).toBe(locale);
      expect(snapshot.runtimeHostIdentity).toEqual({
        animationId: REPEATED_PLACEMENT_PILOT_ID,
        ...snapshot.runtimeIdentity,
      });
      expect(Object.values(snapshot.runtimeIdentity).every((value) =>
        typeof value === 'string' && value.length > 0)).toBe(true);
      activations.push(snapshot);
    }
    expect(new Set(activations.map(({placementId, ordinal}) =>
      `${placementId}:${ordinal}`)).size).toBe(2);
    expect(activations[0]!.runtimeIdentity).toEqual(
      activations[1]!.runtimeIdentity,
    );
    expect(signals).toEqual({
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      httpErrors: [],
    });
    return activations;
  } finally {
    await context.close();
  }
}

async function measureAdaptiveRedraws(page: Page, animationId: string) {
  return page.evaluate(async (id) => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      `canvas[data-course-canvas="${id}"]`,
    );
    if (!canvas) throw new Error('pilot Canvas is missing');
    const waitFor = async (scale: string) => {
      const deadline = performance.now() + 10_000;
      while (performance.now() < deadline) {
        if (canvas.dataset.renderScale === scale &&
          canvas.dataset.renderState === 'ready' &&
          canvas.dataset.captureStage === 'true') return;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()));
      }
      throw new Error(`Canvas did not reach ready ${scale}x`);
    };
    const durations: number[] = [];
    for (let index = 0; index < 12; index += 1) {
      canvas.style.width = '400px';
      canvas.style.height = 'auto';
      await waitFor('1');
      const start = performance.now();
      canvas.style.width = '800px';
      await waitFor('2');
      durations.push(performance.now() - start);
    }
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');
    await waitFor('2');
    const rect = canvas.getBoundingClientRect();
    return {
      durations,
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      backingArea: canvas.width * canvas.height,
      nativeArea: 800 * 600,
      cssWidth: rect.width,
      cssHeight: rect.height,
    };
  }, animationId);
}

function percentile95(values: readonly number[]) {
  expect(values.length).toBeGreaterThan(0);
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1]!;
}

function boundedFailure(error: unknown) {
  return String(error instanceof Error ? error.message : error)
    .replaceAll('\u0000', '')
    .slice(0, 2_000);
}

async function measurePerformanceTarget(
  browser: Browser,
  baseURL: string,
  target: PerformancePilot,
) {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
    viewport: {width: 1440, height: 900},
  });
  const page = await context.newPage();
  try {
    await installLeakInstrumentation(page);
    const signals = observeErrors(page);
    await page.route('**/api/learning-events', async (route) => {
      await route.fulfill({status: 204});
    });
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', {rate: 2});
    const {canvas, firstReadyMs} = await openPilot(page, baseURL, target);
    const firstReadyLimit = target.v1FirstReadyMs + Math.max(
      250,
      target.v1FirstReadyMs * 0.2,
    );
    expect(firstReadyMs, `${target.animationId} first ready`).toBeLessThanOrEqual(
      firstReadyLimit,
    );
    await page.evaluate(() => {
      const perf = (window as unknown as {
        __canvasResolutionPerf: {longTasks: number[]};
      }).__canvasResolutionPerf;
      perf.longTasks.length = 0;
    });
    const measurement = await measureAdaptiveRedraws(
      page,
      target.animationId,
    );
    const p95 = percentile95(measurement.durations);
    const frameBudgetMs = 1_000 / target.sourceFps;
    expect(p95, `${target.animationId} redraw p95`).toBeLessThanOrEqual(
      frameBudgetMs,
    );
    expect(measurement.backingWidth).toBe(1600);
    expect(measurement.backingHeight).toBe(1200);
    expect(measurement.backingArea).toBe(measurement.nativeArea * 4);
    expect(measurement.cssWidth).toBeLessThanOrEqual(800.5);
    expect(measurement.cssHeight).toBeLessThanOrEqual(600.5);
    await expect(canvas).toHaveAttribute('data-render-scale', '2');
    const runtime = await page.evaluate(() => {
      const perf = (window as unknown as {
        __canvasResolutionPerf: {
          longTasks: number[];
          contextLostCount: number;
        };
      }).__canvasResolutionPerf;
      return {
        longTasksOver250: perf.longTasks.filter((duration) => duration > 250),
        contextLostCount: perf.contextLostCount,
      };
    });
    expect(runtime.longTasksOver250,
      `${target.animationId} long tasks`).toEqual([]);
    expect(runtime.contextLostCount,
      `${target.animationId} context lost count`).toBe(0);
    expect(signals, `${target.animationId} browser errors`).toEqual({
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      httpErrors: [],
    });
    return {
      status: 'passed' as const,
      target,
      firstReadyMs,
      firstReadyLimitMs: firstReadyLimit,
      frameBudgetMs,
      redrawP95Ms: p95,
      redrawDurationsMs: measurement.durations,
      backingWidth: measurement.backingWidth,
      backingHeight: measurement.backingHeight,
      backingArea: measurement.backingArea,
      nativeArea: measurement.nativeArea,
      cssWidth: measurement.cssWidth,
      cssHeight: measurement.cssHeight,
      longTasksOver250: runtime.longTasksOver250,
      contextLostCount: runtime.contextLostCount,
      signals,
    };
  } finally {
    await context.close();
  }
}

async function measurePerformanceSet(
  browser: Browser,
  baseURL: string,
  targets: readonly PerformancePilot[],
  attachmentName: string,
) {
  const results: Array<Record<string, unknown>> = [];
  for (const target of targets) {
    try {
      results.push(await measurePerformanceTarget(browser, baseURL, target));
    } catch (error) {
      results.push({
        status: 'failed',
        target,
        error: boundedFailure(error),
      });
    }
  }
  const payload = {
    schemaVersion: 1,
    artifactType: 'canvas-resolution-performance-target-set',
    scope: attachmentName,
    targetCount: targets.length,
    passedCount: results.filter(({status}) => status === 'passed').length,
    failedCount: results.filter(({status}) => status === 'failed').length,
    results,
  };
  await test.info().attach(attachmentName, {
    body: Buffer.from(canonicalJson(payload)),
    contentType: 'application/json',
  });
  expect(
    results.filter(({status}) => status === 'failed'),
    `${attachmentName} has failed performance targets`,
  ).toEqual([]);
}

async function processRssBytes(browser: Browser, browserSession: CDPSession) {
  const processInfo = await browserSession.send('SystemInfo.getProcessInfo');
  const pids = processInfo.processInfo
    .map(({id}) => id)
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  expect(pids.length).toBeGreaterThan(0);
  const {stdout} = await execFileAsync(
    'ps',
    ['-o', 'rss=', '-p', pids.join(',')],
    {encoding: 'utf8'},
  );
  const rssKb = stdout.trim().split(/\s+/u)
    .filter(Boolean)
    .map(Number);
  expect(rssKb.length).toBeGreaterThan(0);
  expect(rssKb.every((value) => Number.isFinite(value) && value > 0)).toBe(true);
  // Keep browser referenced so this helper cannot accidentally accept a stale
  // CDP session detached from the test fixture.
  expect(browser.isConnected()).toBe(true);
  return rssKb.reduce((sum, value) => sum + value, 0) * 1024;
}

async function leakSnapshot(
  page: Page,
  pageSession: CDPSession,
  browser: Browser,
  browserSession: CDPSession,
): Promise<LeakSnapshot> {
  await pageSession.send('HeapProfiler.collectGarbage');
  const [dom, metrics, rssBytes, browserState] = await Promise.all([
    pageSession.send('Memory.getDOMCounters'),
    pageSession.send('Performance.getMetrics'),
    processRssBytes(browser, browserSession),
    page.evaluate(() => {
      const perf = (window as unknown as {
        __canvasResolutionPerf: {
          createdCanvases: Set<WeakRef<HTMLCanvasElement>>;
          pendingAnimationFrames: Set<number>;
          pendingTimeouts: Set<number>;
          activeIntervals: Set<number>;
        };
      }).__canvasResolutionPerf;
      const connected = [...document.querySelectorAll<HTMLCanvasElement>('canvas')];
      const tracked: HTMLCanvasElement[] = [];
      for (const reference of perf.createdCanvases) {
        const canvas = reference.deref();
        if (canvas) tracked.push(canvas);
        else perf.createdCanvases.delete(reference);
      }
      return {
        connectedCanvasCount: connected.length,
        detachedCanvasCount: tracked
          .filter((canvas) => !canvas.isConnected).length,
        backingPixelArea: tracked
          .reduce((sum, canvas) => sum + canvas.width * canvas.height, 0),
        pendingAnimationFrameCount: perf.pendingAnimationFrames.size,
        pendingTimeoutCount: perf.pendingTimeouts.size,
        activeIntervalCount: perf.activeIntervals.size,
      };
    }),
  ]);
  const heapBytes = metrics.metrics.find(
    ({name}) => name === 'JSHeapUsedSize',
  )?.value;
  expect(heapBytes).toBeDefined();
  return {
    ...browserState,
    heapBytes: heapBytes!,
    rssBytes,
    documents: dom.documents,
    nodes: dom.nodes,
    listeners: dom.jsEventListeners,
  };
}

function expectNoMonotonicUnboundedGrowth(
  values: readonly number[],
  label: string,
  allowedTotalGrowthRatio = 0,
) {
  expect(values).toHaveLength(3);
  const strictlyIncreasing = values[0]! < values[1]! && values[1]! < values[2]!;
  const totalGrowthRatio = (values[2]! - values[0]!) /
    Math.max(1, values[0]!);
  expect(
    strictlyIncreasing && totalGrowthRatio > allowedTotalGrowthRatio,
    `${label} grew monotonically beyond the bounded allowance across all three rounds`,
  ).toBe(false);
}

let gateInputs: GateInputs;

test.beforeAll(async () => {
  gateInputs = await loadGateInputs();
});

test.describe('adaptive Canvas Chromium performance hard gate', () => {
  test('2x-throttled pilot redraw p95, first ready, long tasks, context, and backing area stay within budget', async ({
    baseURL,
    browser,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'this gate requires Chromium CDP');
    test.setTimeout(30 * 60_000);
    expect(baseURL).toBeTruthy();
    await measurePerformanceSet(
      browser,
      baseURL!,
      gateInputs.pilots,
      'ci-pilots-performance-results',
    );
  });

  test('production preview measures all 283 renderer p95, first-ready, long-task, context, and backing-area gates', async ({
    baseURL,
    browser,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'this gate requires Chromium CDP');
    test.skip(
      PERFORMANCE_SCOPE !== 'production-preview-full',
      'CI pilot mode deliberately defers the full 283-renderer preview gate',
    );
    test.setTimeout(6 * 60 * 60_000);
    expect(baseURL).toBeTruthy();
    expect(gateInputs.renderers).toHaveLength(283);
    await measurePerformanceSet(
      browser,
      baseURL!,
      gateInputs.renderers,
      'production-preview-full-performance-results',
    );
  });

  test('GS002 font readiness, Arial/Bauhaus fallback, metrics, baselines, and k1/k2 state remain bound to v1', async ({
    baseURL,
    browser,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'this gate requires Chromium CDP');
    expect(baseURL).toBeTruthy();
    expect(browser.version()).toBe(
      gateInputs.baseline.payload.environment.browserVersion,
    );
    const fontPilot = gateInputs.baseline.payload.fontPilot;
    const [k1, k2] = await Promise.all([
      captureFontPilotAtScale(browser, baseURL!, fontPilot, 1),
      captureFontPilotAtScale(browser, baseURL!, fontPilot, 2),
    ]);
    expect(k1.fontsReady).toBe(true);
    expect(k2.fontsReady).toBe(true);
    expect(k1.fontChecks).toEqual(fontPilot.fontChecks);
    expect(k2.fontChecks).toEqual(fontPilot.fontChecks);
    expect(k1.canvas).toEqual({
      width: 800,
      height: 600,
      renderScale: 1,
      visibleCanvasCount: 1,
    });
    expect(k2.canvas).toEqual({
      width: 1600,
      height: 1200,
      renderScale: 2,
      visibleCanvasCount: 1,
    });
    const expectedIdentity = {
      animationId: FONT_PILOT_ID,
      ...fontPilot.identity,
    };
    expect(k1.identity).toEqual(expectedIdentity);
    expect(k2.identity).toEqual(expectedIdentity);
    expect(k1.sourceCallCanvasDimensions).toEqual([
      {width: 800, height: 600},
      {width: 800, height: 600},
    ]);
    expect(k2.sourceCallCanvasDimensions).toEqual([
      {width: 1600, height: 1200},
      {width: 1600, height: 1200},
    ]);
    for (const [index, baselineCall] of
      fontPilot.k1FillTextCalls.entries()) {
      expectFontCall(
        k1.sourceCalls[index]!,
        baselineCall,
        fontPilot.metricTolerancePx,
        1,
      );
      expectFontCall(
        k2.sourceCalls[index]!,
        baselineCall,
        fontPilot.metricTolerancePx,
        2,
      );
    }
  });

  test('G5 L3 IN028 keeps placements 045/046 distinct in EN and ES while sharing one deterministic renderer identity', async ({
    baseURL,
    browser,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'this gate requires Chromium CDP');
    expect(baseURL).toBeTruthy();
    for (const locale of ['en', 'es'] as const) {
      const activations = await captureRepeatedPlacements(
        browser,
        baseURL!,
        locale,
      );
      expect(activations.map(({placementId, ordinal}) => ({
        placementId,
        ordinal,
      }))).toEqual(REPEATED_PLACEMENTS);
    }
  });

  test('three navigation-Replay-return rounds restore Canvas, task, listener, heap, and RSS baselines', async ({
    baseURL,
    browser,
    browserName,
    page,
  }) => {
    test.skip(browserName !== 'chromium', 'this gate requires Chromium CDP');
    expect(baseURL).toBeTruthy();
    const pilot = gateInputs.pilots.find(
      ({animationId}) => animationId === LEAK_NAVIGATION_PILOT_ID,
    );
    if (!pilot) {
      throw new Error(
        `v1 baseline is missing leak pilot ${LEAK_NAVIGATION_PILOT_ID}`,
      );
    }
    await installLeakInstrumentation(page);
    const signals = observeErrors(page);
    await page.route('**/api/learning-events', async (route) => {
      await route.fulfill({status: 204});
    });
    const pageSession = await page.context().newCDPSession(page);
    const browserSession = await browser.newBrowserCDPSession();
    await pageSession.send('Performance.enable');
    await pageSession.send('Emulation.setCPUThrottlingRate', {rate: 2});
    const {player} = await openPilot(page, baseURL!, pilot);
    const baseline = await leakSnapshot(
      page,
      pageSession,
      browser,
      browserSession,
    );
    const rounds: LeakSnapshot[] = [];
    for (let round = 0; round < 3; round += 1) {
      const next = player.locator(
        '.lesson-shell2__learning-actions [data-responsive-focus-key="next"]',
      );
      await next.click();
      await expect(player).not.toHaveAttribute(
        'data-current-animation-id',
        pilot.animationId,
      );
      const replay = player.locator(
        '.lesson-shell2__modern-toolbar [data-responsive-focus-key="replay"]',
      );
      const replayBefore = Number(
        await player.getAttribute('data-current-replay-count'),
      );
      await replay.click();
      await expect(player).toHaveAttribute(
        'data-current-replay-count',
        String(replayBefore + 1),
      );
      await player.locator(
        '.lesson-shell2__learning-actions [data-responsive-focus-key="previous"]',
      ).click();
      await expect(player).toHaveAttribute(
        'data-current-animation-id',
        pilot.animationId,
      );
      await page.waitForTimeout(250);
      rounds.push(await leakSnapshot(
        page,
        pageSession,
        browser,
        browserSession,
      ));
    }

    for (const round of rounds) {
      expect(round.connectedCanvasCount).toBe(baseline.connectedCanvasCount);
      expect(round.detachedCanvasCount).toBeLessThanOrEqual(
        baseline.detachedCanvasCount,
      );
      expect(round.backingPixelArea).toBeLessThanOrEqual(
        baseline.backingPixelArea * 1.05,
      );
      expect(round.pendingAnimationFrameCount).toBeLessThanOrEqual(
        baseline.pendingAnimationFrameCount,
      );
      expect(round.pendingTimeoutCount).toBeLessThanOrEqual(
        baseline.pendingTimeoutCount,
      );
      expect(round.activeIntervalCount).toBeLessThanOrEqual(
        baseline.activeIntervalCount,
      );
      expect(round.documents).toBeLessThanOrEqual(baseline.documents);
      expect(round.nodes).toBeLessThanOrEqual(baseline.nodes * 1.05);
      expect(round.listeners).toBeLessThanOrEqual(baseline.listeners);
    }
    const penultimateHeap = rounds[1]!.heapBytes;
    const finalHeap = rounds[2]!.heapBytes;
    expect((finalHeap - penultimateHeap) / penultimateHeap).toBeLessThan(0.05);
    expectNoMonotonicUnboundedGrowth(
      rounds.map(({rssBytes}) => rssBytes),
      'Chromium process RSS',
      0.05,
    );
    expectNoMonotonicUnboundedGrowth(
      rounds.map(({backingPixelArea}) => backingPixelArea),
      'Canvas backing pixel area',
    );
    expect(signals).toEqual({
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      httpErrors: [],
    });
  });
});
