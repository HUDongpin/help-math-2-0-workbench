#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash, randomBytes} from 'node:crypto';
import {chmod, lstat, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {chromium} from '@playwright/test';

import {captureKeyframes} from './capture-animation-keyframes.mjs';
import {captureCoverageV2Requirements} from './capture-coverage-v2-requirements.mjs';
import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
} from './implementation-artifact-closure.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const COOKIE_NAME = 'helpmath_executive_preview';
const SESSION_PATTERN = /^v1\.\d+\.[A-Za-z0-9_-]{43}$/u;
const RECEIPT_PATH =
  'reports/g4-l3-g5-l4-private-preview-capture-execution-receipt-2026-08-08-r4.json';
const LOCAL_DIAGNOSTIC_BUILD_ID =
  'apps/web/.next-local-reference-diagnostic/BUILD_ID';
const TS006_INVENTORY_R2 = Object.freeze({
  path: 'reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-08-r2.json',
  sha256: '2156d805bceb62c71c2209d4fa68a6affc0a7667ae235daea8237d65106d0cb7',
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

export const G4_TARGET = Object.freeze({
  id: 'course-g04-l03-ts-006',
  requirement: 'req:sprite-23:lesson-shell-natural-entry:en',
  outputRoot:
    'output/playwright/g4-l3-current-js-v4/course-g04-l03-ts-006-en-current-r8',
  manifestPath:
    'output/playwright/g4-l3-current-js-v4/course-g04-l03-ts-006-en-current-r8/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json',
  orchestrationPath:
    'output/playwright/g4-l3-current-js-v4/course-g04-l03-ts-006-en-current-r8/capture-orchestration.json',
  frameCount: 128,
});

export const G5_TARGET = Object.freeze({
  id: 'course-g05-l04-rw-002',
  requirement: 'req:sprite-341:lesson-shell-natural-entry:en',
  outputRoot:
    'output/playwright/g5-l4-executive-preview-current-js-v2/course-g05-l04-rw-002-en-current-r4',
  manifestPath:
    'output/playwright/g5-l4-executive-preview-current-js-v2/course-g05-l04-rw-002-en-current-r4/capture-manifest.json',
  frameCount: 419,
  scene: 'course-g05-l04-rw-002',
  frameDomain: 'sprite-341',
  trace: 'trace:sprite-341:lesson-shell-natural-entry:en:seed-0',
  entryStateSha256:
    '5fb35907bcc3c97623c984f348129763d48568c39eb3c322068bfa10794da9c1',
  scenario: 'source-static-frame',
  lang: 'en',
  seed: '0',
});

/**
 * The generic implementation closure binds the individual G5 renderer. This
 * additional closure binds the session-protected executive route that hosts
 * that renderer during this private current-JavaScript capture.
 */
export const G5_EXECUTIVE_ROUTE_CLOSURE_PATHS = Object.freeze([
  'apps/web/app/[locale]/executive-preview/g5-l4/page.tsx',
  'apps/web/app/globals.css',
  'apps/web/components/animation-runtime.tsx',
  'apps/web/components/g5-l4-executive-preview.module.css',
  'apps/web/components/g5-l4-executive-preview.tsx',
  'apps/web/lib/executive-preview-access.ts',
  'apps/web/lib/executive-preview-server.ts',
  'apps/web/lib/g5-l4-executive-preview-capture.ts',
  'apps/web/lib/g5-l4-executive-preview-content.ts',
  'apps/web/lib/g5-l4-executive-preview.ts',
  'apps/web/proxy.ts',
]);

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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
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
    content,
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

function allFalse(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.values(value).every((entry) => entry === false);
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
      && receipt.value?.currentRenderer?.manifest?.sha256 === '424fb84965b48be6b7ddcd25ed770cac4d9e4e6db7c8e2d599daa295f12222aa'
      && allFalse(receipt.value?.acceptanceEffects),
    'TS006 r2 inventory receipt no longer bounds the current inventory without acceptance promotion',
  );
  return Object.freeze({receipt: receipt.descriptor, inventory: inventory.descriptor});
}

export function parseMode(argv) {
  if (argv.length === 1 && argv[0] === '--run') return 'run';
  if (argv.length === 1 && argv[0] === '--help') return 'help';
  throw new Error('expected exactly --run or --help');
}

function isExactLoopbackOrigin(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:'
      && parsed.hostname === '127.0.0.1'
      && parsed.username === ''
      && parsed.password === ''
      && parsed.pathname === '/'
      && parsed.search === ''
      && parsed.hash === '';
  } catch {
    return false;
  }
}

export function g5CaptureSourceUrl(origin) {
  invariant(isExactLoopbackOrigin(origin), 'origin must be exact credential-free 127.0.0.1 HTTP');
  const route = new URL('/executive-preview/g5-l4', origin);
  route.searchParams.set('scene', G5_TARGET.scene);
  return route.href;
}

export function privateSessionTransportDescriptor(origin) {
  invariant(isExactLoopbackOrigin(origin), 'origin must be exact credential-free 127.0.0.1 HTTP');
  return Object.freeze({
    mode: 'existing-private-preview-session-cookie',
    exactOrigin: origin,
    cookieName: COOKIE_NAME,
    credentialSource: 'ephemeral-in-process-login-response',
    credentialRecorded: false,
    cookieInstalledForExactOriginAndStrippedFromOtherOrigins: true,
    publicBypassCreated: false,
  });
}

export function buildSessionScopedBrowserType({session, exactOrigin, browserType = chromium}) {
  invariant(SESSION_PATTERN.test(session), 'private preview session has an invalid shape');
  privateSessionTransportDescriptor(exactOrigin);
  return Object.freeze({
    async launch(options) {
      const browser = await browserType.launch(options);
      return Object.freeze({
        version: () => browser.version(),
        async newContext(contextOptions) {
          const context = await browser.newContext(contextOptions);
          await context.addCookies([{
            name: COOKIE_NAME,
            value: session,
            url: exactOrigin,
            httpOnly: true,
            sameSite: 'Lax',
          }]);
          await context.route('**/*', async (route) => {
            let requestOrigin = '';
            try {
              requestOrigin = new URL(route.request().url()).origin;
            } catch {
              // Non-URL requests never receive the session cookie.
            }
            const headers = {...route.request().headers()};
            if (requestOrigin !== exactOrigin) delete headers.cookie;
            await route.continue({headers});
          });
          return context;
        },
        close: () => browser.close(),
      });
    },
  });
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

async function waitForServer(origin, child, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'not started';
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`local diagnostic server exited early with ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/executive-preview`, {redirect: 'manual'});
      if (response.status === 200) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`local diagnostic server did not become ready: ${lastError}`);
}

function extractSessionCookie(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  for (const value of values) {
    const match = value.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`, 'u'));
    if (match && SESSION_PATTERN.test(match[1])) return {
      value: match[1],
      flags: {
        httpOnly: /(?:^|;)\s*HttpOnly(?:;|$)/iu.test(value),
        sameSiteLax: /(?:^|;)\s*SameSite=Lax(?:;|$)/iu.test(value),
        pathRoot: /(?:^|;)\s*Path=\/(?:;|$)/iu.test(value),
        secure: /(?:^|;)\s*Secure(?:;|$)/iu.test(value),
      },
    };
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

async function collectCurrentClosure(input) {
  await validateTs006InventoryR2();
  return collectImplementationArtifactClosure(input);
}

async function collectFileClosure(paths) {
  const files = await Promise.all(paths.map(async (entry) => (await bind(entry)).descriptor));
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

async function captureG4(browserType, logger) {
  logger(`[private capture r4] ${G4_TARGET.id}`);
  await captureCoverageV2Requirements({
    id: G4_TARGET.id,
    projectRoot: PROJECT_ROOT,
    baseUrl: CURRENT_ORIGIN.get(),
    outputRoot: G4_TARGET.outputRoot,
    requirements: [G4_TARGET.requirement],
    check: false,
  }, {
    capture: (options) => captureKeyframes(options, {
      browserType,
      collectArtifactClosure: collectCurrentClosure,
    }),
    collectCurrentArtifactClosure: collectCurrentClosure,
    logger,
  });
}

/**
 * `captureCoverageV2Requirements` deliberately follows a migration's generic
 * animation route. G5's private production preview is instead its explicit,
 * session-protected executive route, so the source-bound route contract is
 * supplied directly to the same capture generator.
 */
async function captureG5Executive(browserType, origin, logger) {
  logger(`[private capture r4] ${G5_TARGET.id} via session-protected executive route`);
  await captureKeyframes({
    id: G5_TARGET.id,
    projectRoot: PROJECT_ROOT,
    url: g5CaptureSourceUrl(origin),
    frameList: Array.from({length: G5_TARGET.frameCount}, (_, index) => index + 1),
    output: absolute(G5_TARGET.outputRoot),
    selector: '[data-capture-stage="true"]',
    frameParam: 'frame',
    frameDomain: G5_TARGET.frameDomain,
    frameDomainParam: 'frameDomain',
    requirementId: G5_TARGET.requirement,
    requirementIdParam: 'requirementId',
    trace: G5_TARGET.trace,
    traceParam: 'trace',
    entryStateSha256: G5_TARGET.entryStateSha256,
    entryStateSha256Param: 'entryStateSha256',
    scenario: G5_TARGET.scenario,
    scenarioParam: 'scenario',
    lang: G5_TARGET.lang,
    langParam: 'lang',
    seed: G5_TARGET.seed,
    seedParam: 'seed',
    width: 800,
    height: 600,
    deviceScale: 1,
  }, {
    browserType,
    collectArtifactClosure: collectCurrentClosure,
  });
}

async function describeCapture(target, {expectedSourceUrl = null, requireExecutiveRoute = false} = {}) {
  const capture = await bind(target.manifestPath, {parseJson: true});
  const value = capture.value;
  invariant(
    value?.schemaVersion === 4
      && value?.status === 'complete'
      && value?.animationId === target.id
      && value?.requirementId === target.requirement
      && value?.captured?.length === target.frameCount,
    `${target.id}: capture manifest identity changed`,
  );
  if (expectedSourceUrl !== null) {
    invariant(value.sourceUrl === expectedSourceUrl, `${target.id}: capture source URL changed`);
  } else {
    const source = new URL(value.sourceUrl);
    invariant(source.origin === CURRENT_ORIGIN.get() && source.pathname.endsWith(`/animations/${target.id}`), `${target.id}: generic capture route is not local and expected`);
  }
  if (requireExecutiveRoute) {
    const source = new URL(value.sourceUrl);
    invariant(
      source.pathname === '/executive-preview/g5-l4'
        && source.searchParams.get('scene') === G5_TARGET.scene
        && source.searchParams.size === 1,
      `${target.id}: capture did not use the narrow executive-preview route`,
    );
  }
  for (const field of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
    invariant(Array.isArray(value[field]) && value[field].length === 0, `${target.id}: ${field} is not empty`);
  }
  invariant(value.error === null, `${target.id}: capture records an error`);
  const closure = value.implementationArtifactClosure;
  invariant(closure && implementationArtifactClosureErrors(closure).length === 0, `${target.id}: stored implementation closure is invalid`);
  const migration = await bind(`migrations/${target.id}/migration.json`, {parseJson: true});
  const currentClosure = await collectCurrentClosure({
    projectRoot: PROJECT_ROOT,
    workspace: absolute(`migrations/${target.id}`),
    manifest: migration.value,
  });
  const currentnessErrors = implementationArtifactClosureErrors(closure, currentClosure);
  invariant(currentnessErrors.length === 0, `${target.id}: implementation closure changed after capture (${currentnessErrors.join('; ')})`);

  const frameRows = [];
  let totalBytes = 0;
  for (const [index, frame] of value.captured.entries()) {
    const expectedFrame = index + 1;
    invariant(
      frame.frame === expectedFrame
        && frame.reportedFrame === expectedFrame
        && frame.frameDomainId === (target.frameDomain ?? 'sprite-23')
        && frame.reportedFrameDomainId === (target.frameDomain ?? 'sprite-23')
        && frame.reportedRenderState === 'ready'
        && frame.width === 800
        && frame.height === 600,
      `${target.id}: frame ${expectedFrame} identity or stage changed`,
    );
    invariant(typeof frame.file === 'string' && /^frame-\d{3}\.png$/u.test(frame.file) && path.basename(frame.file) === frame.file, `${target.id}: unsafe frame ${expectedFrame} file name`);
    const file = await bind(`${path.posix.dirname(target.manifestPath)}/${frame.file}`);
    invariant(file.descriptor.sha256 === frame.sha256, `${target.id}: frame ${expectedFrame} hash drifted`);
    totalBytes += file.descriptor.bytes;
    frameRows.push(file.descriptor);
  }
  frameRows.sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze({
    animationId: target.id,
    requirementId: target.requirement,
    sourceUrl: value.sourceUrl,
    captureManifest: capture.descriptor,
    orchestration: target.orchestrationPath ? (await bind(target.orchestrationPath)).descriptor : null,
    frames: {
      fileCount: frameRows.length,
      totalBytes,
      aggregateSha256: sha256(Buffer.from(canonicalJson(frameRows))),
    },
    implementationClosure: {
      artifactCount: currentClosure.artifactCount,
      projectionCount: currentClosure.projectionCount,
      totalBytes: currentClosure.totalBytes,
      aggregateSha256: currentClosure.aggregateSha256,
    },
    diagnostics: Object.fromEntries(
      ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests'].map((field) => [field, 0]),
    ),
  });
}

async function writeReceiptNoClobber(receipt) {
  await assertAbsent(RECEIPT_PATH, 'capture receipt');
  const destination = absolute(RECEIPT_PATH);
  const bytes = Buffer.from(stableJson(receipt));
  try {
    await writeFile(destination, bytes, {flag: 'wx', mode: 0o444});
    await chmod(destination, 0o444);
  } catch (error) {
    await unlink(destination).catch(() => {});
    throw error;
  }
  return Object.freeze({path: RECEIPT_PATH, bytes: bytes.length, sha256: sha256(bytes)});
}

async function buildReceipt({
  origin,
  login,
  probes,
  captures,
  inventoryR2,
  localDiagnosticBuildId,
  g5RouteClosure,
}) {
  const [runner, runnerTest, captureGenerator, coverageOrchestrator, r3Abort, retainedReceipt, retainedInvalidation] =
    await Promise.all([
      bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs'),
      bind('scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.test.mjs'),
      bind('scripts/capture-animation-keyframes.mjs'),
      bind('scripts/capture-coverage-v2-requirements.mjs'),
      bind(R3_ABORT_RECORD.path),
      bind(RETAINED_R2_RECEIPT.path),
      bind(RETAINED_R3_INVALIDATION.path),
    ]);
  invariant(r3Abort.descriptor.sha256 === R3_ABORT_RECORD.sha256, 'r3 abort record drifted');
  invariant(retainedReceipt.descriptor.sha256 === RETAINED_R2_RECEIPT.sha256, 'retained r2 receipt drifted');
  invariant(retainedInvalidation.descriptor.sha256 === RETAINED_R3_INVALIDATION.sha256, 'retained r3 invalidation receipt drifted');
  return {
    schemaVersion: 1,
    receiptType: 'g4-l3-g5-l4-private-preview-current-javascript-capture-execution',
    issuedOn: '2026-08-08',
    revision: 'r4',
    executedAt: new Date().toISOString(),
    status: 'executed-complete-session-protected-private-preview-current-javascript-captures-r4',
    executionPreimage: {
      runner: runner.descriptor,
      runnerTest: runnerTest.descriptor,
      canonicalCaptureGenerator: captureGenerator.descriptor,
      canonicalCoverageOrchestrator: coverageOrchestrator.descriptor,
      ts006InventoryR2: inventoryR2.receipt,
      ts006CurrentInventory: inventoryR2.inventory,
      localDiagnosticBuildId: localDiagnosticBuildId.descriptor,
      g5ExecutiveRouteClosure: g5RouteClosure,
    },
    retainedPredecessors: {
      r3AbortRecord: {...r3Abort.descriptor, rewritten: false},
      executionReceiptR2: {...retainedReceipt.descriptor, rewritten: false},
      captureInvalidationR3: {...retainedInvalidation.descriptor, rewritten: false},
    },
    privatePreviewSession: {
      server: 'Next.js local-reference-diagnostic production server',
      localDiagnosticBuild: true,
      exactOrigin: origin,
      loginEndpoint: '/api/executive-preview/session',
      loginStatus: login.status,
      redirectLocation: login.redirectLocation,
      cookieName: COOKIE_NAME,
      httpOnly: login.flags.httpOnly,
      sameSiteLax: login.flags.sameSiteLax,
      pathRoot: login.flags.pathRoot,
      secure: login.flags.secure,
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
}

const CURRENT_ORIGIN = (() => {
  let value = null;
  return Object.freeze({
    set(next) {
      invariant(value === null, 'capture origin may be set only once');
      invariant(isExactLoopbackOrigin(next), 'capture origin must be exact credential-free loopback HTTP');
      value = next;
    },
    get() {
      invariant(value !== null, 'capture origin is unavailable before server setup');
      return value;
    },
  });
})();

export async function runPrivatePreviewCapturesR4({logger = console.error} = {}) {
  await assertAbsent(RECEIPT_PATH, 'capture receipt');
  await assertAbsent(G4_TARGET.outputRoot, 'G4 r4 output root');
  await assertAbsent(G5_TARGET.outputRoot, 'G5 r4 output root');
  const [inventoryR2, buildBefore, routeClosureBefore] = await Promise.all([
    validateTs006InventoryR2(),
    bind(LOCAL_DIAGNOSTIC_BUILD_ID),
    collectFileClosure(G5_EXECUTIVE_ROUTE_CLOSURE_PATHS),
  ]);
  const port = await reserveLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  CURRENT_ORIGIN.set(origin);
  const accessKey = randomBytes(32).toString('hex');
  const sessionSecret = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const captureEnvironment = {
    ...process.env,
    HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC: '1',
    NODE_ENV: 'production',
    EXECUTIVE_PREVIEW_ENABLED: 'true',
    EXECUTIVE_PREVIEW_ACCESS_KEY: accessKey,
    EXECUTIVE_PREVIEW_SESSION_SECRET: sessionSecret,
    EXECUTIVE_PREVIEW_EXPIRES_AT: expiresAt,
  };
  delete captureEnvironment.VERCEL_ENV;
  const child = spawn('npm', ['run', 'start', '--workspace', '@helpmath/web', '--', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'ignore', 'ignore'],
    env: captureEnvironment,
  });
  try {
    await waitForServer(origin, child);
    const loginResponse = await fetch(`${origin}/api/executive-preview/session`, {
      method: 'POST',
      redirect: 'manual',
      headers: {'content-type': 'application/x-www-form-urlencoded', origin},
      body: new URLSearchParams({locale: 'en', passphrase: accessKey, returnTo: '/executive-preview'}),
    });
    invariant(loginResponse.status === 303, `private preview login returned HTTP ${loginResponse.status}`);
    const session = extractSessionCookie(loginResponse);
    invariant(session.flags.httpOnly && session.flags.sameSiteLax && session.flags.pathRoot && !session.flags.secure, 'loopback preview session cookie flags are invalid');
    const probes = [
      await probe(origin, '/courses/4/3', undefined),
      await probe(origin, '/courses/4/3', session.value),
      await probe(origin, '/executive-preview/g5-l4', undefined),
      await probe(origin, '/executive-preview/g5-l4', session.value),
      await probe(origin, new URL(g5CaptureSourceUrl(origin)).pathname + new URL(g5CaptureSourceUrl(origin)).search, session.value),
    ];
    invariant(probes[0].status === 307 && probes[0].location === '/executive-preview', 'unauthenticated G4 L3 route did not redirect to private preview');
    invariant(probes[2].status === 307 && probes[2].location === '/executive-preview', 'unauthenticated G5 executive route did not redirect to private preview');
    invariant(probes.slice(1).filter((_, index) => index !== 1).every((entry) => entry.status === 200 && entry.robots?.includes('noindex') && entry.controlledPreview === 'executive-preview'), 'authenticated G4/G5 private preview probes failed');
    const browserType = buildSessionScopedBrowserType({session: session.value, exactOrigin: origin});
    await captureG4(browserType, logger);
    await captureG5Executive(browserType, origin, logger);
    const [buildAfter, routeClosureAfter] = await Promise.all([
      bind(LOCAL_DIAGNOSTIC_BUILD_ID),
      collectFileClosure(G5_EXECUTIVE_ROUTE_CLOSURE_PATHS),
    ]);
    invariant(buildAfter.descriptor.sha256 === buildBefore.descriptor.sha256, 'local diagnostic build identity changed during capture');
    invariant(sameClosure(routeClosureBefore, routeClosureAfter), 'G5 executive preview route closure changed during capture');
    const captures = [
      await describeCapture(G4_TARGET),
      await describeCapture(G5_TARGET, {
        expectedSourceUrl: g5CaptureSourceUrl(origin),
        requireExecutiveRoute: true,
      }),
    ];
    const receipt = await buildReceipt({
      origin,
      login: {status: loginResponse.status, redirectLocation: loginResponse.headers.get('location'), flags: session.flags},
      probes,
      captures,
      inventoryR2,
      localDiagnosticBuildId: buildBefore,
      g5RouteClosure: routeClosureBefore,
    });
    const descriptor = await writeReceiptNoClobber(receipt);
    return Object.freeze({
      status: receipt.status,
      receipt: descriptor,
      captureCount: captures.length,
      frameCount: captures.reduce((sum, capture) => sum + capture.frames.fileCount, 0),
      strictComplete: false,
      published: false,
    });
  } finally {
    await stopChild(child);
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  if (mode === 'help') {
    process.stdout.write('Usage: node scripts/run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r4.mjs --run\n');
    return;
  }
  process.stdout.write(`${JSON.stringify(await runPrivatePreviewCapturesR4(), null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
