#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash, randomBytes} from 'node:crypto';
import {chmod, lstat, readFile, stat, writeFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from '@playwright/test';

import {captureKeyframes} from './capture-animation-keyframes.mjs';
import {captureCoverageV2Requirements} from './capture-coverage-v2-requirements.mjs';
import {
  G4_R5,
  G5_R5,
} from './run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.mjs';
import {
  G5_EXECUTIVE_ROUTE_CLOSURE_PATHS,
  buildSessionScopedBrowserType,
  g5CaptureSourceUrl,
} from './run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs';
import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
} from './implementation-artifact-closure.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const COOKIE_NAME = 'helpmath_executive_preview';
const SESSION_PATTERN = /^v1\.\d+\.[A-Za-z0-9_-]{43}$/u;
const RECEIPT_PATH =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r6.json';
const LOCAL_DIAGNOSTIC_BUILD_ID =
  'apps/web/.next-local-reference-diagnostic/BUILD_ID';
const TS006_INVENTORY_R2 = Object.freeze({
  path: 'reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.json',
  sha256: '2156d805bceb62c71c2209d4fa68a6affc0a7667ae235daea8237d65106d0cb7',
});
const R5_ABORT_RECORD = Object.freeze({
  path: 'reports/g4-l3-g5-l4-private-preview-capture-r5-abort-record-2026-08-08.json',
  sha256: 'ebac65f012b56985689c033c7eb3eb4f60b71dd79752ecb1f4986725bc119c4b',
});

export const G4_R6 = Object.freeze({
  ...G4_R5,
  outputRoot:
    'output/playwright/g4-l3-current-js-v6/course-g04-l03-ts-006-en-current-r10',
  manifestPath:
    'output/playwright/g4-l3-current-js-v6/course-g04-l03-ts-006-en-current-r10/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json',
});

export const G5_R6 = Object.freeze({
  ...G5_R5,
  outputRoot:
    'output/playwright/g5-l4-executive-preview-current-js-v4/course-g05-l04-rw-002-en-current-r6',
  manifestPath:
    'output/playwright/g5-l4-executive-preview-current-js-v4/course-g05-l04-rw-002-en-current-r6/capture-manifest.json',
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function absolute(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath && !path.isAbsolute(relativePath), 'project-relative path required');
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${relativePath}: path escapes project root`);
  return resolved;
}

async function bind(relativePath, {parseJson = false} = {}) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(before.isFile() && !before.isSymbolicLink() && physical.nlink === 1, `${relativePath}: expected one ordinary file`);
  const content = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(before.dev === after.dev && before.ino === after.ino && before.size === after.size, `${relativePath}: changed while read`);
  return Object.freeze({
    descriptor: Object.freeze({path: relativePath, bytes: content.length, sha256: sha256(content)}),
    value: parseJson ? JSON.parse(content.toString('utf8')) : undefined,
  });
}

async function assertAbsent(relativePath, label) {
  try {
    await lstat(absolute(relativePath));
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists; a new revision is required instead of overwrite`);
}

function sameDescriptor(left, right) {
  return left.path === right.path && left.bytes === right.bytes && left.sha256 === right.sha256;
}

function sameClosure(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

async function validateTs006InventoryR2() {
  const [receipt, inventory] = await Promise.all([
    bind(TS006_INVENTORY_R2.path, {parseJson: true}),
    bind('migrations/course-g04-l03-ts-006/asset-inventory.csv'),
  ]);
  invariant(receipt.descriptor.sha256 === TS006_INVENTORY_R2.sha256, 'TS006 r2 inventory receipt drifted');
  invariant(
    receipt.value?.status === 'exact-inventory-transition-current-r1-retained-historical-product-qa-stale-acceptance-neutral'
      && receipt.value?.currentInventory?.sha256 === inventory.descriptor.sha256
      && receipt.value?.currentRenderer?.manifest?.sha256 === '424fb84965b48be6b7ddcd25ed770cac4d9e4e6db7c8e2d599daa295f12222aa',
    'TS006 r2 inventory receipt no longer binds current source inventory',
  );
  return Object.freeze({receipt: receipt.descriptor, inventory: inventory.descriptor});
}

async function collectCurrentClosure(input) {
  await validateTs006InventoryR2();
  return collectImplementationArtifactClosure(input);
}

async function collectRouteClosure() {
  const files = await Promise.all(
    G5_EXECUTIVE_ROUTE_CLOSURE_PATHS.map(async (entry) => (await bind(entry)).descriptor),
  );
  files.sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze({
    algorithm: 'sha256-canonical-explicit-private-preview-route-files-v1',
    files,
    aggregateSha256: sha256(Buffer.from(canonicalJson(files))),
    totalBytes: files.reduce((sum, entry) => sum + entry.bytes, 0),
  });
}

async function bindExecutionInputs() {
  const [runner, runnerTest, captureGenerator, coverageOrchestrator, r5PredecessorRunner, r4SharedUtilities] = await Promise.all([
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r6.mjs'),
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r6.test.mjs'),
    bind('scripts/capture-animation-keyframes.mjs'),
    bind('scripts/capture-coverage-v2-requirements.mjs'),
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.mjs'),
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs'),
  ]);
  return Object.freeze({
    runner: runner.descriptor,
    runnerTest: runnerTest.descriptor,
    canonicalCaptureGenerator: captureGenerator.descriptor,
    canonicalCoverageOrchestrator: coverageOrchestrator.descriptor,
    r5PredecessorRunner: r5PredecessorRunner.descriptor,
    r4SharedCaptureUtilities: r4SharedUtilities.descriptor,
  });
}

function exactLoopbackOrigin(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1'
      && parsed.username === '' && parsed.password === '' && parsed.pathname === '/'
      && parsed.search === '' && parsed.hash === '';
  } catch {
    return false;
  }
}

async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  invariant(address && typeof address === 'object', 'failed to reserve a loopback port');
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(origin, child) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`local diagnostic server exited early with ${child.exitCode}`);
    try {
      if ((await fetch(`${origin}/executive-preview`, {redirect: 'manual'})).status === 200) return;
    } catch {
      // Wait for the isolated server to bind its loopback socket.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('local diagnostic server did not become ready');
}

function extractSessionCookie(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  for (const value of values) {
    const match = value.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`, 'u'));
    if (match && SESSION_PATTERN.test(match[1])) return Object.freeze({
      value: match[1],
      flags: Object.freeze({
        httpOnly: /(?:^|;)\s*HttpOnly(?:;|$)/iu.test(value),
        sameSiteLax: /(?:^|;)\s*SameSite=Lax(?:;|$)/iu.test(value),
        pathRoot: /(?:^|;)\s*Path=\/(?:;|$)/iu.test(value),
        secure: /(?:^|;)\s*Secure(?:;|$)/iu.test(value),
      }),
    });
  }
  throw new Error('login response did not contain the expected session cookie');
}

async function probe(origin, pathname, session) {
  const response = await fetch(`${origin}${pathname}`, {
    redirect: 'manual',
    headers: session ? {cookie: `${COOKIE_NAME}=${session}`} : undefined,
  });
  return Object.freeze({
    pathname,
    authenticated: Boolean(session),
    status: response.status,
    location: response.headers.get('location'),
    cacheControl: response.headers.get('cache-control'),
    robots: response.headers.get('x-robots-tag'),
    controlledPreview: response.headers.get('x-helpmath-controlled-preview'),
  });
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  const exited = await Promise.race([
    new Promise((resolve) => child.once('exit', () => resolve(true))),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (!exited && child.exitCode === null) child.kill('SIGKILL');
}

export function g5CaptureFrameUrl(origin, frame) {
  invariant(exactLoopbackOrigin(origin), 'G5 capture origin must be exact credential-free loopback HTTP');
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= G5_R6.frameCount, 'G5 capture frame is outside the bound domain');
  const url = new URL(g5CaptureSourceUrl(origin));
  url.searchParams.set('capture', '1');
  url.searchParams.set('frame', String(frame));
  url.searchParams.set('frameDomain', G5_R6.frameDomain);
  url.searchParams.set('requirementId', G5_R6.requirement);
  url.searchParams.set('trace', G5_R6.trace);
  url.searchParams.set('entryStateSha256', G5_R6.entryStateSha256);
  url.searchParams.set('scenario', G5_R6.scenario);
  url.searchParams.set('lang', G5_R6.lang);
  url.searchParams.set('seed', G5_R6.seed);
  return url.href;
}

async function verifyG5Presentation(browserType, origin) {
  const browser = await browserType.launch({headless: true});
  try {
    const normalContext = await browser.newContext({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1});
    const normalPage = await normalContext.newPage();
    const normalResponse = await normalPage.goto(`${origin}/executive-preview/g5-l4`, {waitUntil: 'networkidle'});
    const normal = await normalPage.evaluate(() => ({
      captureRequestStatus: document.querySelector('[data-capture-request-status]')?.getAttribute('data-capture-request-status'),
      captureStageCount: document.querySelectorAll('[data-capture-stage="true"]').length,
      footerDisplay: getComputedStyle(document.querySelector('.site-footer')).display,
      headerDisplay: getComputedStyle(document.querySelector('.site-header')).display,
    }));
    await normalContext.close();
    invariant(
      normalResponse?.status() === 200
        && normal.captureRequestStatus === 'normal'
        && normal.captureStageCount === 0
        && normal.headerDisplay !== 'none'
        && normal.footerDisplay !== 'none',
      'ordinary session-protected G5 executive preview changed while adding capture isolation',
    );

    const captureContext = await browser.newContext({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});
    const capturePage = await captureContext.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    const httpErrors = [];
    capturePage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    capturePage.on('requestfailed', (request) => failedRequests.push(request.failure()?.errorText ?? 'failed'));
    capturePage.on('response', (response) => {
      if (response.status() >= 400) httpErrors.push(response.status());
    });
    const captureResponse = await capturePage.goto(g5CaptureFrameUrl(origin, 1), {waitUntil: 'networkidle'});
    const stage = capturePage.locator('[data-capture-stage="true"]').first();
    await stage.waitFor({state: 'visible'});
    const capture = await capturePage.evaluate(() => {
      const stage = document.querySelector('[data-capture-stage="true"]')?.getBoundingClientRect();
      return {
        captureRequestStatus: document.querySelector('[data-capture-request-status]')?.getAttribute('data-capture-request-status'),
        footerDisplay: getComputedStyle(document.querySelector('.site-footer')).display,
        headerDisplay: getComputedStyle(document.querySelector('.site-header')).display,
        skipDisplay: getComputedStyle(document.querySelector('.skip-link')).display,
        stage: stage ? {height: stage.height, width: stage.width, x: stage.x, y: stage.y} : null,
      };
    });
    await captureContext.close();
    invariant(
      captureResponse?.status() === 200
        && capture.captureRequestStatus === 'ready'
        && capture.headerDisplay === 'none'
        && capture.footerDisplay === 'none'
        && capture.skipDisplay === 'none'
        && capture.stage?.x === 0
        && capture.stage?.y === 0
        && capture.stage?.width === 800
        && capture.stage?.height === 600
        && consoleErrors.length === 0
        && failedRequests.length === 0
        && httpErrors.length === 0,
      'G5 exact capture presentation or diagnostic isolation failed',
    );
    return Object.freeze({
      capture: Object.freeze({
        diagnosticsClean: true,
        footerDisplay: capture.footerDisplay,
        headerDisplay: capture.headerDisplay,
        pngStage: capture.stage,
        skipDisplay: capture.skipDisplay,
        status: capture.captureRequestStatus,
      }),
      normal: Object.freeze({
        footerDisplay: normal.footerDisplay,
        headerDisplay: normal.headerDisplay,
        status: normal.captureRequestStatus,
      }),
    });
  } finally {
    await browser.close();
  }
}

async function runG4Capture(browserType, origin, logger) {
  logger(`[private capture r6] ${G4_R6.id}`);
  await captureCoverageV2Requirements({
    id: G4_R6.id,
    projectRoot: PROJECT_ROOT,
    baseUrl: origin,
    outputRoot: G4_R6.outputRoot,
    requirements: [G4_R6.requirement],
    check: false,
  }, {
    capture: (options) => captureKeyframes(options, {browserType, collectArtifactClosure: collectCurrentClosure}),
    collectCurrentArtifactClosure: collectCurrentClosure,
    logger,
  });
}

async function runG5Capture(browserType, origin, logger) {
  logger(`[private capture r6] ${G5_R6.id} via isolated session-protected executive route`);
  await captureKeyframes({
    id: G5_R6.id,
    projectRoot: PROJECT_ROOT,
    url: g5CaptureSourceUrl(origin),
    frameList: Array.from({length: G5_R6.frameCount}, (_, index) => index + 1),
    output: absolute(G5_R6.outputRoot),
    selector: '[data-capture-stage="true"]',
    frameParam: 'frame',
    frameDomain: G5_R6.frameDomain,
    frameDomainParam: 'frameDomain',
    requirementId: G5_R6.requirement,
    requirementIdParam: 'requirementId',
    trace: G5_R6.trace,
    traceParam: 'trace',
    entryStateSha256: G5_R6.entryStateSha256,
    entryStateSha256Param: 'entryStateSha256',
    scenario: G5_R6.scenario,
    scenarioParam: 'scenario',
    lang: G5_R6.lang,
    langParam: 'lang',
    seed: G5_R6.seed,
    seedParam: 'seed',
    width: 800,
    height: 600,
    deviceScale: 1,
  }, {browserType, collectArtifactClosure: collectCurrentClosure});
}

async function summarizeCapture(target, {origin, executive = false} = {}) {
  const manifest = await bind(target.manifestPath, {parseJson: true});
  const value = manifest.value;
  invariant(
    value?.schemaVersion === 4 && value?.status === 'complete'
      && value?.animationId === target.id && value?.requirementId === target.requirement
      && value?.captured?.length === target.frameCount && value?.error === null,
    `${target.id}: capture manifest is not complete and exact`,
  );
  for (const field of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
    invariant(Array.isArray(value[field]) && value[field].length === 0, `${target.id}: ${field} is not empty`);
  }
  if (executive) {
    invariant(value.sourceUrl === g5CaptureSourceUrl(origin), `${target.id}: capture did not use the narrow executive route`);
  } else {
    const source = new URL(value.sourceUrl);
    invariant(source.origin === origin && source.pathname.endsWith(`/animations/${target.id}`), `${target.id}: source URL is not the local G4 animation route`);
  }
  const capturedFiles = [];
  for (const [index, frame] of value.captured.entries()) {
    const expected = index + 1;
    invariant(
      frame.animationId === target.id && frame.reportedAnimationId === target.id
        && frame.frame === expected && frame.reportedFrame === expected
        && frame.frameDomainId === target.frameDomain && frame.reportedFrameDomainId === target.frameDomain
        && frame.requirementId === target.requirement && frame.reportedRenderState === 'ready'
        && frame.width === 800 && frame.height === 600,
      `${target.id}: frame ${expected} identity or native PNG size changed`,
    );
    invariant(typeof frame.file === 'string' && /^frame-\d{3}\.png$/u.test(frame.file) && path.basename(frame.file) === frame.file, `${target.id}: unsafe frame file name`);
    const file = await bind(`${path.posix.dirname(target.manifestPath)}/${frame.file}`);
    invariant(file.descriptor.sha256 === frame.sha256, `${target.id}: frame ${expected} hash drifted`);
    capturedFiles.push(file.descriptor);
  }
  capturedFiles.sort((left, right) => left.path.localeCompare(right.path));
  const storedClosure = value.implementationArtifactClosure;
  invariant(storedClosure && implementationArtifactClosureErrors(storedClosure).length === 0, `${target.id}: invalid stored implementation closure`);
  const migration = await bind(`migrations/${target.id}/migration.json`, {parseJson: true});
  const currentClosure = await collectCurrentClosure({projectRoot: PROJECT_ROOT, workspace: absolute(`migrations/${target.id}`), manifest: migration.value});
  const closureErrors = implementationArtifactClosureErrors(storedClosure, currentClosure);
  invariant(closureErrors.length === 0, `${target.id}: implementation closure drifted (${closureErrors.join('; ')})`);
  return Object.freeze({
    animationId: target.id,
    requirementId: target.requirement,
    sourceUrl: value.sourceUrl,
    captureManifest: manifest.descriptor,
    frames: Object.freeze({
      fileCount: capturedFiles.length,
      totalBytes: capturedFiles.reduce((sum, item) => sum + item.bytes, 0),
      aggregateSha256: sha256(Buffer.from(canonicalJson(capturedFiles))),
      nativePngDimensions: Object.freeze({width: 800, height: 600}),
    }),
    implementationClosure: Object.freeze({
      artifactCount: currentClosure.artifactCount,
      projectionCount: currentClosure.projectionCount,
      totalBytes: currentClosure.totalBytes,
      aggregateSha256: currentClosure.aggregateSha256,
    }),
  });
}

async function writeReceiptNoClobber(receipt) {
  await assertAbsent(RECEIPT_PATH, 'r6 receipt');
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  await writeFile(absolute(RECEIPT_PATH), bytes, {flag: 'wx', mode: 0o444});
  // Retain evidence if permission hardening ever fails; a successor handles it.
  await chmod(absolute(RECEIPT_PATH), 0o444);
  const stored = await bind(RECEIPT_PATH);
  invariant(stored.descriptor.bytes === bytes.length && stored.descriptor.sha256 === sha256(bytes), 'r6 receipt changed while finalized');
  return stored.descriptor;
}

export async function runPrivatePreviewCapturesR6({logger = console.error} = {}) {
  await Promise.all([
    assertAbsent(RECEIPT_PATH, 'r6 receipt'),
    assertAbsent(G4_R6.outputRoot, 'G4 r6 output root'),
    assertAbsent(G5_R6.outputRoot, 'G5 r6 output root'),
  ]);
  const [inventoryR2, buildBefore, routeClosureBefore, r5Abort, executionInputsBefore] = await Promise.all([
    validateTs006InventoryR2(),
    bind(LOCAL_DIAGNOSTIC_BUILD_ID),
    collectRouteClosure(),
    bind(R5_ABORT_RECORD.path),
    bindExecutionInputs(),
  ]);
  invariant(r5Abort.descriptor.sha256 === R5_ABORT_RECORD.sha256, 'r5 abort record drifted');
  const port = await reserveLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  invariant(exactLoopbackOrigin(origin), 'reserved origin is not exact loopback HTTP');
  const accessKey = randomBytes(32).toString('hex');
  const sessionSecret = randomBytes(32).toString('hex');
  const environment = {
    ...process.env,
    HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC: '1',
    NODE_ENV: 'production',
    EXECUTIVE_PREVIEW_ENABLED: 'true',
    EXECUTIVE_PREVIEW_ACCESS_KEY: accessKey,
    EXECUTIVE_PREVIEW_SESSION_SECRET: sessionSecret,
    EXECUTIVE_PREVIEW_EXPIRES_AT: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  delete environment.VERCEL_ENV;
  const child = spawn('npm', ['run', 'start', '--workspace', '@helpmath/web', '--', '--hostname', '127.0.0.1', '--port', String(port)], {cwd: PROJECT_ROOT, stdio: ['ignore', 'ignore', 'ignore'], env: environment});
  try {
    await waitForServer(origin, child);
    const loginResponse = await fetch(`${origin}/api/executive-preview/session`, {
      method: 'POST', redirect: 'manual', headers: {'content-type': 'application/x-www-form-urlencoded', origin},
      body: new URLSearchParams({locale: 'en', passphrase: accessKey, returnTo: '/executive-preview'}),
    });
    invariant(loginResponse.status === 303, `private preview login returned HTTP ${loginResponse.status}`);
    const session = extractSessionCookie(loginResponse);
    invariant(session.flags.httpOnly && session.flags.sameSiteLax && session.flags.pathRoot && !session.flags.secure, 'loopback preview cookie flags are invalid');
    const captureUrl = new URL(g5CaptureFrameUrl(origin, 1));
    const probes = [
      await probe(origin, '/courses/4/3', undefined),
      await probe(origin, '/courses/4/3', session.value),
      await probe(origin, '/executive-preview/g5-l4', undefined),
      await probe(origin, '/executive-preview/g5-l4', session.value),
      await probe(origin, `${captureUrl.pathname}${captureUrl.search}`, session.value),
    ];
    invariant(probes[0].status === 307 && probes[0].location === '/executive-preview', 'unauthenticated G4 route did not redirect');
    invariant(probes[2].status === 307 && probes[2].location === '/executive-preview', 'unauthenticated G5 route did not redirect');
    invariant(probes[1].status === 200 && probes[3].status === 200 && probes[4].status === 200, 'authenticated private routes did not return HTTP 200');
    for (const entry of [probes[1], probes[3], probes[4]]) {
      invariant(entry.robots?.includes('noindex') && entry.cacheControl === 'private, no-store, max-age=0' && entry.controlledPreview === 'executive-preview', 'private response headers drifted');
    }
    const browserType = buildSessionScopedBrowserType({session: session.value, exactOrigin: origin, browserType: chromium});
    const presentation = await verifyG5Presentation(browserType, origin);
    await runG4Capture(browserType, origin, logger);
    await runG5Capture(browserType, origin, logger);
    const [buildAfter, routeClosureAfter, executionInputsAfter] = await Promise.all([
      bind(LOCAL_DIAGNOSTIC_BUILD_ID),
      collectRouteClosure(),
      bindExecutionInputs(),
    ]);
    invariant(buildAfter.descriptor.sha256 === buildBefore.descriptor.sha256, 'local diagnostic build identity changed during capture');
    invariant(sameClosure(routeClosureBefore, routeClosureAfter), 'G5 route closure changed during capture');
    for (const key of Object.keys(executionInputsBefore)) {
      invariant(sameDescriptor(executionInputsBefore[key], executionInputsAfter[key]), `${key} changed during capture`);
    }
    const captures = [
      await summarizeCapture(G4_R6, {origin}),
      await summarizeCapture(G5_R6, {origin, executive: true}),
    ];
    const receipt = {
      schemaVersion: 1,
      receiptType: 'g4-l3-g5-l4-private-preview-current-javascript-capture-execution',
      issuedOn: '2026-08-08',
      revision: 'r6',
      executedAt: new Date().toISOString(),
      status: 'executed-complete-session-protected-private-preview-current-javascript-captures-r6',
      executionPreimage: {
        ...executionInputsBefore,
        ts006InventoryR2: inventoryR2.receipt,
        ts006CurrentInventory: inventoryR2.inventory,
        localDiagnosticBuildId: buildBefore.descriptor,
        g5ExecutiveRouteClosure: routeClosureBefore,
      },
      retainedPredecessors: {
        r5AbortRecord: {...r5Abort.descriptor, rewritten: false},
      },
      privatePreviewSession: {
        server: 'Next.js local-reference-diagnostic production server',
        localDiagnosticBuild: true,
        exactOrigin: origin,
        loginEndpoint: '/api/executive-preview/session',
        loginStatus: loginResponse.status,
        redirectLocation: loginResponse.headers.get('location'),
        cookieName: COOKIE_NAME,
        httpOnly: session.flags.httpOnly,
        sameSiteLax: session.flags.sameSiteLax,
        pathRoot: session.flags.pathRoot,
        secure: session.flags.secure,
        credentialsGeneratedEphemerally: true,
        credentialOrCredentialHashRecorded: false,
        cookieInstalledForExactOriginAndStrippedFromOtherOrigins: true,
        publicBypassCreated: false,
        publicDeploymentEvidence: false,
      },
      liveProbes: probes,
      g5CapturePresentation: presentation,
      captures,
      authority: {
        privatePreviewLoginAndLocalRoutingObserved: true,
        currentJavascriptImplementationCaptureOnly: true,
        nativePngDimensionsObserved: true,
        captureChromeIsolationObserved: true,
        ordinaryExecutivePreviewPreserved: true,
        productionDeployment: false,
        authoritativeOriginalRuntime: false,
        fullFrameBaselineComparison: false,
        visualOrBehavioralParity: false,
        audioAcceptance: false,
        interactionAcceptance: false,
        replayAcceptance: false,
        humanVisualReview: false,
        ownerAcceptance: false,
        strictCompletion: false,
        publication: false,
      },
    };
    const receiptDescriptor = await writeReceiptNoClobber(receipt);
    return Object.freeze({status: receipt.status, receipt: receiptDescriptor, captureCount: captures.length, frameCount: captures.reduce((sum, item) => sum + item.frames.fileCount, 0), strictComplete: false, published: false});
  } finally {
    await stopChild(child);
  }
}

export function parseMode(argv) {
  if (argv.length === 1 && argv[0] === '--run') return 'run';
  if (argv.length === 1 && argv[0] === '--help') return 'help';
  throw new Error('expected exactly --run or --help');
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const mode = parseMode(process.argv.slice(2));
  if (mode === 'help') {
    process.stdout.write('Usage: node scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r6.mjs --run\n');
  } else {
    runPrivatePreviewCapturesR6().then(
      (result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`),
      (error) => {
        process.stderr.write(`${error.stack ?? error.message}\n`);
        process.exitCode = 1;
      },
    );
  }
}
