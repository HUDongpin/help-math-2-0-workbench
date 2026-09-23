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
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r5.json';
const LOCAL_DIAGNOSTIC_BUILD_ID =
  'apps/web/.next-local-reference-diagnostic/BUILD_ID';
const TS006_INVENTORY_R2 = Object.freeze({
  path: 'reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.json',
  sha256: '2156d805bceb62c71c2209d4fa68a6affc0a7667ae235daea8237d65106d0cb7',
});
const R4_ABORT_RECORD = Object.freeze({
  path: 'reports/g4-l3-g5-l4-private-preview-capture-r4-abort-record-2026-08-08.json',
  sha256: 'a376696a000fcba11e2059bc70049d40bba4ef9a27b3291101986c19b9cff025',
});
const R3_ABORT_RECORD = Object.freeze({
  path: 'reports/g4-l3-g5-l4-private-preview-capture-r3-abort-record-2026-08-08.json',
  sha256: 'c916752497064297669af431c035a49bed243c74f34081754f81a4694458f3ed',
});
const RETAINED_R2_RECEIPT = Object.freeze({
  path: 'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-07-r2.json',
  sha256: '38e87526122b61ac20a34ef913c706989e03b5d77a733f1897094e54a57ac41c',
});
const RETAINED_R3_INVALIDATION = Object.freeze({
  path: 'reports/g4-l3-g5-l4-private-preview-capture-currentness-invalidation-2026-08-07-r3.json',
  sha256: 'e7b005c52a5034c32de62068a582a67a29c77eb81115ccb7aed001ef304a8773',
});

export const G4_R5 = Object.freeze({
  id: 'course-g04-l03-ts-006',
  requirement: 'req:sprite-23:lesson-shell-natural-entry:en',
  frameDomain: 'sprite-23',
  frameCount: 128,
  outputRoot:
    'output/playwright/g4-l3-current-js-v5/course-g04-l03-ts-006-en-current-r9',
  manifestPath:
    'output/playwright/g4-l3-current-js-v5/course-g04-l03-ts-006-en-current-r9/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json',
});

export const G5_R5 = Object.freeze({
  id: 'course-g05-l04-rw-002',
  requirement: 'req:sprite-341:lesson-shell-natural-entry:en',
  frameDomain: 'sprite-341',
  frameCount: 419,
  outputRoot:
    'output/playwright/g5-l4-executive-preview-current-js-v3/course-g05-l04-rw-002-en-current-r5',
  manifestPath:
    'output/playwright/g5-l4-executive-preview-current-js-v3/course-g05-l04-rw-002-en-current-r5/capture-manifest.json',
  scene: 'course-g05-l04-rw-002',
  trace: 'trace:sprite-341:lesson-shell-natural-entry:en:seed-0',
  entryStateSha256:
    '5fb35907bcc3c97623c984f348129763d48568c39eb3c322068bfa10794da9c1',
  scenario: 'source-static-frame',
  lang: 'en',
  seed: '0',
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

function sameClosure(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function sameDescriptor(left, right) {
  return left.path === right.path && left.bytes === right.bytes && left.sha256 === right.sha256;
}

async function bindExecutionInputs() {
  const [runner, runnerTest, captureGenerator, coverageOrchestrator, r4SharedUtilities] = await Promise.all([
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.mjs'),
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.test.mjs'),
    bind('scripts/capture-animation-keyframes.mjs'),
    bind('scripts/capture-coverage-v2-requirements.mjs'),
    bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs'),
  ]);
  return Object.freeze({
    runner: runner.descriptor,
    runnerTest: runnerTest.descriptor,
    canonicalCaptureGenerator: captureGenerator.descriptor,
    canonicalCoverageOrchestrator: coverageOrchestrator.descriptor,
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

async function runG4Capture(browserType, origin, logger) {
  logger(`[private capture r5] ${G4_R5.id}`);
  await captureCoverageV2Requirements({
    id: G4_R5.id,
    projectRoot: PROJECT_ROOT,
    baseUrl: origin,
    outputRoot: G4_R5.outputRoot,
    requirements: [G4_R5.requirement],
    check: false,
  }, {
    capture: (options) => captureKeyframes(options, {browserType, collectArtifactClosure: collectCurrentClosure}),
    collectCurrentArtifactClosure: collectCurrentClosure,
    logger,
  });
}

async function runG5Capture(browserType, origin, logger) {
  logger(`[private capture r5] ${G5_R5.id} via integer-pixel session-protected executive route`);
  await captureKeyframes({
    id: G5_R5.id,
    projectRoot: PROJECT_ROOT,
    url: g5CaptureSourceUrl(origin),
    frameList: Array.from({length: G5_R5.frameCount}, (_, index) => index + 1),
    output: absolute(G5_R5.outputRoot),
    selector: '[data-capture-stage="true"]',
    frameParam: 'frame',
    frameDomain: G5_R5.frameDomain,
    frameDomainParam: 'frameDomain',
    requirementId: G5_R5.requirement,
    requirementIdParam: 'requirementId',
    trace: G5_R5.trace,
    traceParam: 'trace',
    entryStateSha256: G5_R5.entryStateSha256,
    entryStateSha256Param: 'entryStateSha256',
    scenario: G5_R5.scenario,
    scenarioParam: 'scenario',
    lang: G5_R5.lang,
    langParam: 'lang',
    seed: G5_R5.seed,
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
  const source = new URL(value.sourceUrl);
  if (executive) {
    invariant(source.origin === origin && source.pathname === '/executive-preview/g5-l4' && source.searchParams.get('scene') === G5_R5.scene && source.searchParams.size === 1, `${target.id}: source URL is not the narrow executive preview route`);
  } else {
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
  await assertAbsent(RECEIPT_PATH, 'r5 receipt');
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  await writeFile(absolute(RECEIPT_PATH), bytes, {flag: 'wx', mode: 0o444});
  // If permission hardening fails, retain the newly written receipt rather than
  // deleting an evidence artifact. A future successor must handle that case.
  await chmod(absolute(RECEIPT_PATH), 0o444);
  const stored = await bind(RECEIPT_PATH);
  invariant(
    stored.descriptor.bytes === bytes.length && stored.descriptor.sha256 === sha256(bytes),
    'r5 receipt changed while being finalized',
  );
  return stored.descriptor;
}

async function bindRetainedPredecessors() {
  const [r4Abort, r3Abort, r2Receipt, r3Invalidation] = await Promise.all([
    bind(R4_ABORT_RECORD.path),
    bind(R3_ABORT_RECORD.path),
    bind(RETAINED_R2_RECEIPT.path),
    bind(RETAINED_R3_INVALIDATION.path),
  ]);
  invariant(r4Abort.descriptor.sha256 === R4_ABORT_RECORD.sha256, 'r4 abort record drifted');
  invariant(r3Abort.descriptor.sha256 === R3_ABORT_RECORD.sha256, 'r3 abort record drifted');
  invariant(r2Receipt.descriptor.sha256 === RETAINED_R2_RECEIPT.sha256, 'retained r2 receipt drifted');
  invariant(r3Invalidation.descriptor.sha256 === RETAINED_R3_INVALIDATION.sha256, 'retained r3 invalidation drifted');
  return Object.freeze({r4Abort: r4Abort.descriptor, r3Abort: r3Abort.descriptor, r2Receipt: r2Receipt.descriptor, r3Invalidation: r3Invalidation.descriptor});
}

export async function runPrivatePreviewCapturesR5({logger = console.error} = {}) {
  await assertAbsent(RECEIPT_PATH, 'r5 receipt');
  await assertAbsent(G4_R5.outputRoot, 'G4 r5 output root');
  await assertAbsent(G5_R5.outputRoot, 'G5 r5 output root');
  const [inventoryR2, buildBefore, routeClosureBefore, predecessors, executionInputsBefore] = await Promise.all([
    validateTs006InventoryR2(),
    bind(LOCAL_DIAGNOSTIC_BUILD_ID),
    collectRouteClosure(),
    bindRetainedPredecessors(),
    bindExecutionInputs(),
  ]);
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
    const g5Route = new URL(g5CaptureSourceUrl(origin));
    const probes = [
      await probe(origin, '/courses/4/3', undefined),
      await probe(origin, '/courses/4/3', session.value),
      await probe(origin, '/executive-preview/g5-l4', undefined),
      await probe(origin, '/executive-preview/g5-l4', session.value),
      await probe(origin, `${g5Route.pathname}${g5Route.search}`, session.value),
    ];
    invariant(probes[0].status === 307 && probes[0].location === '/executive-preview', 'unauthenticated G4 route did not redirect');
    invariant(probes[2].status === 307 && probes[2].location === '/executive-preview', 'unauthenticated G5 route did not redirect');
    invariant(probes[1].status === 200 && probes[3].status === 200 && probes[4].status === 200, 'authenticated private routes did not return HTTP 200');
    for (const entry of [probes[1], probes[3], probes[4]]) {
      invariant(entry.robots?.includes('noindex') && entry.cacheControl === 'private, no-store, max-age=0' && entry.controlledPreview === 'executive-preview', 'private response headers drifted');
    }
    const browserType = buildSessionScopedBrowserType({session: session.value, exactOrigin: origin});
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
      invariant(
        sameDescriptor(executionInputsBefore[key], executionInputsAfter[key]),
        `${key} changed during capture`,
      );
    }
    const captures = [
      await summarizeCapture(G4_R5, {origin}),
      await summarizeCapture(G5_R5, {origin, executive: true}),
    ];
    const receipt = {
      schemaVersion: 1,
      receiptType: 'g4-l3-g5-l4-private-preview-current-javascript-capture-execution',
      issuedOn: '2026-08-08',
      revision: 'r5',
      executedAt: new Date().toISOString(),
      status: 'executed-complete-session-protected-private-preview-current-javascript-captures-r5',
      executionPreimage: {
        ...executionInputsBefore,
        ts006InventoryR2: inventoryR2.receipt,
        ts006CurrentInventory: inventoryR2.inventory,
        localDiagnosticBuildId: buildBefore.descriptor,
        g5ExecutiveRouteClosure: routeClosureBefore,
      },
      retainedPredecessors: {
        r4AbortRecord: {...predecessors.r4Abort, rewritten: false},
        r3AbortRecord: {...predecessors.r3Abort, rewritten: false},
        executionReceiptR2: {...predecessors.r2Receipt, rewritten: false},
        captureInvalidationR3: {...predecessors.r3Invalidation, rewritten: false},
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
      captures,
      authority: {
        privatePreviewLoginAndLocalRoutingObserved: true,
        currentJavascriptImplementationCaptureOnly: true,
        nativePngDimensionsObserved: true,
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
    process.stdout.write('Usage: node scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r5.mjs --run\n');
  } else {
    runPrivatePreviewCapturesR5().then(
      (result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`),
      (error) => {
        process.stderr.write(`${error.stack ?? error.message}\n`);
        process.exitCode = 1;
      },
    );
  }
}
