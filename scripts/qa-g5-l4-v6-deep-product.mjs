#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import {createServer as createNetServer} from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  buildCurrentPackageInputSnapshot,
  selectG5L4Release,
} from './build-g5-l4-whole-lesson-package-mvp.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const WESTWORLD_TEMP_ROOT = '/Volumes/WestWorld';
export const PACKAGE_ID = 'g5-l4-whole-lesson-package-mvp-v6';
export const PACKAGE_BASENAME =
  'g5-l4-whole-lesson-package-mvp-v6-darwin-arm64';
export const RELEASE_ID = 'lesson-g05-l04-number-lines';
export const ARCHIVE_RELATIVE_PATH =
  `outputs/${PACKAGE_BASENAME}.zip`;
export const ARCHIVE_SHA256 =
  '6c642f4081466ec826bb79a3525e30b701940c184a5a50bb74afba912c83ef85';
export const PACKAGE_MANIFEST_SHA256 =
  'fa640b7ce7f64096744106cc87a88aebb56f25958e4270aed69b0b6776bda05c';
export const PACKAGE_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189_628_108,
  sha256: 'f8e506deb23dfd1c2c9d231d1c80470cab4df9ae91992409d29fc6dc293d955a',
});
export const OBSERVED_POST_V6_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189_628_204,
  sha256: '88e39500a536fd8dae91cf1b907734c6ab88d8b665a7e5562f7b43604b6a2484',
});

export const LOCALES = Object.freeze([
  Object.freeze({
    id: 'en',
    path: '/courses/5/4',
    pickerLabel: 'Go to a lesson page',
  }),
  Object.freeze({
    id: 'es',
    path: '/es/courses/5/4',
    pickerLabel: 'Ir a una p\u00e1gina de la lecci\u00f3n',
  }),
]);

export const VIEWPORTS = Object.freeze([
  Object.freeze({id: 'native-4x3', width: 800, height: 600}),
  Object.freeze({id: 'desktop-16x9', width: 1280, height: 720}),
  Object.freeze({id: 'desktop-review', width: 1440, height: 1000}),
  Object.freeze({id: 'tablet-portrait', width: 768, height: 1024}),
  Object.freeze({id: 'mobile-portrait', width: 390, height: 844}),
  Object.freeze({id: 'mobile-landscape', width: 844, height: 390}),
]);

export const REPLAY_ACTIVATIONS = Object.freeze([
  Object.freeze({id: 'mouse', kind: 'click'}),
  Object.freeze({id: 'Enter', kind: 'keyboard', key: 'Enter'}),
  Object.freeze({id: 'Space', kind: 'keyboard', key: 'Space'}),
]);

export const PLAYER_SELECTOR =
  '[data-lesson-player="descriptor-driven-whole-lesson-audit"]';
export const SESSION_STORAGE_KEY =
  'helpmath:g5-l4:whole-lesson-audit:v1';
export const ACTIVE_PAGE_COUNT = 54;
export const RELEASE_MEMBER_COUNT = 55;
export const LAYOUT_OBSERVATION_COUNT =
  LOCALES.length * VIEWPORTS.length * ACTIVE_PAGE_COUNT;
export const REDUCED_MOTION_OBSERVATION_COUNT =
  LOCALES.length * ACTIVE_PAGE_COUNT;
export const REDUCED_MOTION_SAMPLE_COUNT =
  REDUCED_MOTION_OBSERVATION_COUNT * 3;
export const REPLAY_ACTIVATION_COUNT =
  LOCALES.length * ACTIVE_PAGE_COUNT * REPLAY_ACTIVATIONS.length;

export const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntimeAccepted: false,
  originalRuntimeFullFrameAccepted: false,
  originalRuntimeNaturalTraversalAccepted: false,
  audioAccepted: false,
  humanAudioAccepted: false,
  humanVisualAccepted: false,
  rmseAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonStrictComplete: false,
  publicReleaseAuthorized: false,
  published: false,
});

export const KNOWN_REMEDIATIONS_REQUIRED = Object.freeze([
  Object.freeze({
    id: 'reduced-motion-note-pointer-interception',
    status: 'machine-remediation-required',
    observedV6: true,
  }),
  Object.freeze({
    id: 'vb004-spanish-app-owned-ui-remains-english',
    status: 'machine-remediation-required',
    observedV6: true,
  }),
  Object.freeze({
    id: 'mobile-390-legacy-exit-control-clips',
    status: 'machine-remediation-required',
    observedV6: true,
  }),
  Object.freeze({
    id: 'course-map-same-current-page-reselect-focuses-body',
    status: 'machine-remediation-required',
    observedV6: true,
  }),
]);

export const KNOWN_LIMITATIONS = Object.freeze([
  Object.freeze({
    id: 'url-backed-per-page-deep-links',
    status: 'absent-in-v6-v7-required-if-requested',
  }),
  Object.freeze({
    id: 'original-runtime-and-full-frame-fidelity-evidence',
    status: 'not-established',
  }),
  Object.freeze({
    id: 'audio-cue-mapping-and-listening-acceptance',
    status: 'not-established',
  }),
  Object.freeze({
    id: 'human-visual-owner-strict-and-publication-acceptance',
    status: 'not-established',
  }),
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const REPORT_TYPE = 'g5-l4-v6-fresh-unzip-deep-current-javascript-product-qa';
const EXPECTED_CONTROLLED_HEADER = 'g5-l4-ceo-preview';
const TEMP_PREFIX = '.g5-l4-v6-deep-qa-';

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeSeparators(value) {
  return value.split(path.sep).join('/');
}

function relativeToWorkspace(absolutePath, workspaceRoot = WORKSPACE_ROOT) {
  return normalizeSeparators(path.relative(workspaceRoot, absolutePath));
}

function resolveInside(root, value, label) {
  invariant(typeof value === 'string' && value.length > 0, `${label} requires a path`);
  const resolved = path.resolve(root, value);
  const relative = path.relative(root, resolved);
  invariant(
    relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${label} must stay inside ${root}`,
  );
  return resolved;
}

export function usage() {
  return [
    'Usage:',
    '  node scripts/qa-g5-l4-v6-deep-product.mjs \\',
    '    --output-json reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1.json \\',
    '    --output-md reports/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1.md \\',
    '    --artifact-dir output/playwright/g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1',
    '',
    'The three output flags are mandatory and have no defaults. Every target must be absent.',
  ].join('\n');
}

export function parseArguments(argv) {
  const options = {
    help: false,
    outputJson: null,
    outputMd: null,
    artifactDir: null,
  };
  const names = new Map([
    ['--output-json', 'outputJson'],
    ['--output-md', 'outputMd'],
    ['--artifact-dir', 'artifactDir'],
  ]);
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--help' || value === '-h') {
      invariant(argv.length === 1, '--help cannot be combined with output flags');
      options.help = true;
      continue;
    }
    const property = names.get(value);
    invariant(property, `Unknown argument: ${value}`);
    invariant(!seen.has(value), `Duplicate argument: ${value}`);
    const next = argv[index + 1];
    invariant(next && !next.startsWith('--'), `${value} requires a value`);
    seen.add(value);
    options[property] = next;
    index += 1;
  }
  if (!options.help) {
    invariant(
      options.outputJson && options.outputMd && options.artifactDir,
      '--output-json, --output-md, and --artifact-dir are all required; no default output is permitted',
    );
  }
  return options;
}

async function lstatIfPresent(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function assertOrdinaryDirectory(target, label) {
  const metadata = await lstatIfPresent(target);
  invariant(metadata?.isDirectory() && !metadata.isSymbolicLink(), `${label} must be an existing ordinary directory`);
}

export async function prepareOutputPlan(
  options,
  {workspaceRoot = WORKSPACE_ROOT} = {},
) {
  invariant(options && !options.help, 'Output plan is unavailable in help mode');
  const reportsRoot = path.join(workspaceRoot, 'reports');
  const artifactsRoot = path.join(workspaceRoot, 'output', 'playwright');
  const candidate = (value) => path.isAbsolute(value)
    ? value
    : path.resolve(workspaceRoot, value);
  const outputJson = resolveInside(reportsRoot, candidate(options.outputJson), '--output-json');
  const outputMd = resolveInside(reportsRoot, candidate(options.outputMd), '--output-md');
  const artifactDir = resolveInside(artifactsRoot, candidate(options.artifactDir), '--artifact-dir');
  invariant(outputJson.endsWith('.json'), '--output-json must end in .json');
  invariant(outputMd.endsWith('.md'), '--output-md must end in .md');
  invariant(new Set([outputJson, outputMd, artifactDir]).size === 3, 'Output targets must be distinct');
  await assertOrdinaryDirectory(path.dirname(outputJson), '--output-json parent');
  await assertOrdinaryDirectory(path.dirname(outputMd), '--output-md parent');
  await assertOrdinaryDirectory(path.dirname(artifactDir), '--artifact-dir parent');
  for (const [label, target] of [
    ['--output-json', outputJson],
    ['--output-md', outputMd],
    ['--artifact-dir', artifactDir],
  ]) {
    invariant(!(await lstatIfPresent(target)), `${label} target already exists: ${target}`);
  }
  return Object.freeze({outputJson, outputMd, artifactDir, workspaceRoot});
}

export function sourceObservation(packageSnapshot, currentSnapshot) {
  const sourceCurrentAtObservation =
    JSON.stringify(packageSnapshot) === JSON.stringify(currentSnapshot);
  return {
    sourceCurrentAtObservation,
    packageSnapshot,
    currentSnapshot,
    delta: {
      fileCount: currentSnapshot.fileCount - packageSnapshot.fileCount,
      totalBytes: currentSnapshot.totalBytes - packageSnapshot.totalBytes,
      sha256Changed: currentSnapshot.sha256 !== packageSnapshot.sha256,
    },
    driftReason: sourceCurrentAtObservation
      ? 'none'
      : 'The shared-workspace G4 v3.1 package build automatically updated apps/web/tsconfig.json by adding .next-g4-l3-package-v3-1 generated type includes and formatting it. The aggregate is +96 bytes. This post-v6 source drift does not modify the hash-bound v6 ZIP or its extracted runtime and therefore does not reject fresh-unzip QA.',
    driftDisposition:
      'recorded-nonblocking-for-hash-bound-v6-fresh-unzip-runtime-only',
    qaRuntimeSource: 'fresh-unzip-hash-bound-v6-archive',
    currentWorkspaceSourceUsedToServeQa: false,
    currentWorkspaceSourceRollbackPerformed: false,
    acceptanceEffect: 'none',
  };
}

export function expectedPageIdsFromManifest(manifest) {
  invariant(manifest?.packageId === PACKAGE_ID, 'Unexpected package manifest packageId');
  invariant(manifest?.release?.releaseId === RELEASE_ID, 'Unexpected releaseId');
  invariant(manifest.release?.activePages === ACTIVE_PAGE_COUNT, 'Manifest active page count drifted');
  invariant(manifest.release?.expectedMembers === RELEASE_MEMBER_COUNT, 'Manifest release member count drifted');
  invariant(manifest.release?.strictCompleteCount === 0, 'Manifest strict boundary is no longer 0/55');
  invariant(manifest.release?.published === false, 'Manifest is unexpectedly published');
  invariant(Object.values(manifest.authority ?? {}).every((value) => value === false), 'Manifest authority fields must remain false');
  const active = (manifest.members ?? [])
    .filter((member) => member.releaseRole === 'active-xml-referenced-page')
    .sort((left, right) => left.ordinal - right.ordinal);
  invariant(active.length === ACTIVE_PAGE_COUNT, 'Manifest does not contain exactly 54 active pages');
  invariant(active.every((member, index) => member.ordinal === index + 1), 'Manifest active release order is not exact');
  const ids = active.map((member) => member.animationId);
  invariant(new Set(ids).size === ACTIVE_PAGE_COUNT, 'Manifest active animation IDs are not unique');
  invariant(ids.every((id) => /^course-g05-l04-[a-z0-9-]+$/.test(id)), 'Manifest contains an unsafe G5 L4 animation ID');
  return ids;
}

export function isExpectedRscAbort(url, errorText) {
  try {
    return errorText === 'net::ERR_ABORTED' && new URL(url).searchParams.has('_rsc');
  } catch {
    return false;
  }
}

export function validateReportBoundary(report) {
  const errors = [];
  if (report?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (report?.reportType !== REPORT_TYPE) errors.push(`reportType must be ${REPORT_TYPE}`);
  if (report?.packageId !== PACKAGE_ID) errors.push(`packageId must be ${PACKAGE_ID}`);
  if (JSON.stringify(report?.acceptanceEffects) !== JSON.stringify(ACCEPTANCE_EFFECTS)) {
    errors.push('acceptanceEffects must preserve the fixed fail-closed boundary');
  }
  if (Object.values(report?.acceptanceEffects ?? {}).some((value) => value !== false)) {
    errors.push('every acceptanceEffects value must be boolean false');
  }
  if (
    report?.authorityBoundary?.acceptanceNeutral !== true
    || report?.authorityBoundary?.strictAcceptanceEffect !== 'none'
  ) {
    errors.push('authorityBoundary must remain acceptance-neutral with strict effect none');
  }
  if (report?.releaseBoundary?.strictCompleteCount !== 0 || report?.releaseBoundary?.expectedMembers !== 55 || report?.releaseBoundary?.published !== false) {
    errors.push('releaseBoundary must remain 0/55 and unpublished');
  }
  if (report?.sourceObservation?.acceptanceEffect !== 'none') {
    errors.push('sourceObservation must have no acceptance effect');
  }
  if (report?.sourceObservation?.currentWorkspaceSourceUsedToServeQa !== false) {
    errors.push('QA must be served only from the fresh-unzipped v6 runtime');
  }
  if (report?.sourceObservation?.sourceCurrentAtObservation === false) {
    if (
      report.sourceObservation.delta?.totalBytes !== 96
      || report.sourceObservation.packageSnapshot?.sha256 !== PACKAGE_SOURCE_SNAPSHOT.sha256
      || report.sourceObservation.currentSnapshot?.sha256 !== OBSERVED_POST_V6_SOURCE_SNAPSHOT.sha256
      || !String(report.sourceObservation.driftReason).includes('apps/web/tsconfig.json')
    ) {
      errors.push('known +96-byte post-v6 source drift is not fully disclosed');
    }
  }
  if (
    report?.status?.startsWith('pass-')
    || report?.status ===
      'observed-current-javascript-deep-qa-remediations-required'
  ) {
    const counts = report.assertionCounts ?? {};
    for (const [key, expected] of [
      ['layout', LAYOUT_OBSERVATION_COUNT],
      ['identity', LAYOUT_OBSERVATION_COUNT],
      ['overflow', LAYOUT_OBSERVATION_COUNT],
      ['reducedMotionObservations', REDUCED_MOTION_OBSERVATION_COUNT],
      ['reducedMotionSamples', REDUCED_MOTION_SAMPLE_COUNT],
      ['replayActivations', REPLAY_ACTIVATION_COUNT],
    ]) {
      if (counts[key]?.passed !== expected || counts[key]?.failed !== 0) {
        errors.push(`passing report requires assertionCounts.${key} = ${expected}/0`);
      }
    }
    for (const key of ['exactReleaseOrder', 'keyTerms', 'fq', 'persistence', 'networkBoundary']) {
      if (report.freshClaims?.[key] !== true) errors.push(`passing report requires freshClaims.${key} = true`);
    }
    if (
      report.status ===
        'observed-current-javascript-deep-qa-remediations-required'
      && (
        report.freshClaims?.mapCore !== true
        || report.freshClaims?.mapDifferentPageFocus !== true
        || report.freshClaims?.mapSameCurrentPageReselectFocus !== false
        || report.freshClaims?.map !== false
        || report.remediationFindings?.length !== 4
        || report.remediationFindings.some(({observed}) => observed !== true)
      )
    ) {
      errors.push('remediations-required report must preserve the four observed v6 findings and split Map claims');
    }
    if (report.freshClaims?.perPageDirectUrl !== false) {
      errors.push('v6 passing report must preserve the absent per-page direct URL boundary');
    }
    if (report.freshClaims?.productQaComplete !== false) {
      errors.push('bounded current-JS deep QA cannot claim complete product acceptance');
    }
  }
  return errors;
}

function reportMarkdown(report) {
  const count = (key) => {
    const value = report.assertionCounts?.[key] ?? {passed: 0, failed: 0};
    return `${value.passed} passed, ${value.failed} failed`;
  };
  return `# G5 L4 v6 fresh-unzip deep current-JavaScript product QA

- Status: \`${report.status}\`
- Package: \`${report.packageId}\`
- Archive SHA-256: \`${report.archiveBinding.sha256}\`
- Fresh runtime: dynamic loopback from a unique \`/Volumes/WestWorld\` extraction directory
- Source current at observation: \`${report.sourceObservation.sourceCurrentAtObservation}\`
- Source drift: ${report.sourceObservation.driftReason}
- Release boundary: \`0/55\` strict members; unpublished

## Machine assertions

- Layout: ${count('layout')}
- Identity: ${count('identity')}
- Horizontal overflow: ${count('overflow')}
- Reduced-motion observations: ${count('reducedMotionObservations')}
- Reduced-motion samples: ${count('reducedMotionSamples')}
- Replay mouse/Enter/Space activations: ${count('replayActivations')}
- Course Map: \`${report.freshClaims.map}\`
- Key Terms: \`${report.freshClaims.keyTerms}\`
- FQ full traversal/review/replay: \`${report.freshClaims.fq}\`
- Persistence: \`${report.freshClaims.persistence}\`
- Per-page direct URL available: \`${report.freshClaims.perPageDirectUrl}\`
- Network boundary: \`${report.freshClaims.networkBoundary}\`

## Evidence boundary

This report is acceptance-neutral current-JavaScript machine evidence. It does not establish original-runtime fidelity, full-frame parity, audio listening acceptance, human visual acceptance, Owner acceptance, strict completion, publication, or public release. The strict acceptance effect is \`none\`.
`;
}

export async function commitImmutableEvidence(
  plan,
  report,
  stagedArtifacts = [],
) {
  const boundaryErrors = validateReportBoundary(report);
  invariant(boundaryErrors.length === 0, `Report boundary validation failed: ${boundaryErrors.join('; ')}`);
  for (const target of [plan.outputJson, plan.outputMd, plan.artifactDir]) {
    invariant(!(await lstatIfPresent(target)), `Immutable target appeared before commit: ${target}`);
  }
  await mkdir(plan.artifactDir, {recursive: false, mode: 0o755});
  const bindings = [];
  for (const artifact of stagedArtifacts) {
    invariant(/^[a-z0-9][a-z0-9._-]*\.png$/.test(artifact.name), `Unsafe artifact name: ${artifact.name}`);
    const bytes = await readFile(artifact.stagedPath);
    const target = path.join(plan.artifactDir, artifact.name);
    await writeFile(target, bytes, {flag: 'wx', mode: 0o444});
    bindings.push({
      path: relativeToWorkspace(target, plan.workspaceRoot),
      bytes: bytes.length,
      sha256: sha256(bytes),
    });
  }
  report.artifacts = bindings;
  report.outputBindings = {
    json: {
      path: relativeToWorkspace(plan.outputJson, plan.workspaceRoot),
      selfSha256: null,
      reason: 'A JSON document cannot contain a SHA-256 of its own final bytes; the immutable successor receipt must bind the committed file externally.',
    },
    markdown: null,
    artifactDirectory: relativeToWorkspace(plan.artifactDir, plan.workspaceRoot),
  };
  const markdown = Buffer.from(reportMarkdown(report));
  report.outputBindings.markdown = {
    path: relativeToWorkspace(plan.outputMd, plan.workspaceRoot),
    bytes: markdown.length,
    sha256: sha256(markdown),
  };
  const committedJson = Buffer.from(stableJson(report));
  await writeFile(plan.outputJson, committedJson, {flag: 'wx', mode: 0o444});
  await writeFile(plan.outputMd, reportMarkdown(report), {flag: 'wx', mode: 0o444});
  return {
    json: {path: plan.outputJson, bytes: committedJson.length, sha256: sha256(committedJson)},
    markdown: {path: plan.outputMd, bytes: Buffer.byteLength(reportMarkdown(report)), sha256: sha256(Buffer.from(reportMarkdown(report)))},
    artifacts: bindings,
  };
}

async function fileBinding(absolutePath, workspaceRoot = WORKSPACE_ROOT) {
  const bytes = await readFile(absolutePath);
  return {
    path: relativeToWorkspace(absolutePath, workspaceRoot),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function runCommand(command, args, {cwd, env = process.env, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        command: [command, ...args].join(' '),
        status: code,
        signal,
        timedOut,
        stdout: Buffer.concat(stdout).toString('utf8').slice(-20_000),
        stderr: Buffer.concat(stderr).toString('utf8').slice(-20_000),
      });
    });
  });
}

async function findAvailableLoopbackPort() {
  const server = createNetServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({host: '127.0.0.1', port: 0, exclusive: true}, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to allocate a dynamic loopback port'));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForCourse(url, child, timeoutMs = 60_000) {
  const started = Date.now();
  let lastError = 'not attempted';
  while (Date.now() - started < timeoutMs) {
    invariant(child.exitCode === null, `Package server exited early with ${child.exitCode}`);
    try {
      const response = await fetch(url, {redirect: 'manual'});
      if (response.status === 200) {
        return {
          status: response.status,
          controlledPreview: response.headers.get('x-helpmath-controlled-preview'),
          cacheControl: response.headers.get('cache-control'),
          robots: response.headers.get('x-robots-tag'),
        };
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await new Promise((resolve) => child.once('close', resolve));
  }
}

async function childOwnsLoopbackListener(child, port) {
  if (!child?.pid) return false;
  const result = await runCommand(
    '/usr/sbin/lsof',
    ['-nP', '-a', '-p', String(child.pid), `-iTCP:${port}`, '-sTCP:LISTEN', '-Fn'],
    {timeoutMs: 10_000},
  );
  return result.status === 0 && result.stdout.includes(`p${child.pid}`);
}

async function assertNoSymlinks(root) {
  let fileCount = 0;
  let totalBytes = 0;
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      const metadata = await lstat(target);
      invariant(!metadata.isSymbolicLink(), `Fresh package contains a symbolic link: ${target}`);
      if (metadata.isDirectory()) await visit(target);
      else if (metadata.isFile()) {
        fileCount += 1;
        totalBytes += metadata.size;
      }
    }
  }
  await visit(root);
  return {fileCount, totalBytes, symbolicLinks: 0};
}

function emptyRuntimeEvents(scope) {
  return {
    scope,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    ignoredAbortedRscRequests: [],
    badHttpResponses: [],
    externalRequests: [],
    dialogs: [],
    popups: [],
    downloads: [],
    webSockets: [],
  };
}

function attachRuntimeMonitor(page, baseOrigin, scope) {
  const events = emptyRuntimeEvents(scope);
  page.on('console', (message) => {
    if (message.type() === 'error') events.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('request', (request) => {
    try {
      const url = new URL(request.url());
      if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== baseOrigin) {
        events.externalRequests.push({method: request.method(), url: request.url()});
      }
    } catch {
      events.externalRequests.push({method: request.method(), url: request.url()});
    }
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? '';
    const value = {method: request.method(), url: request.url(), errorText};
    if (isExpectedRscAbort(request.url(), errorText)) events.ignoredAbortedRscRequests.push(value);
    else events.failedRequests.push(value);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      events.badHttpResponses.push({status: response.status(), url: response.url()});
    }
  });
  page.on('dialog', async (dialog) => {
    events.dialogs.push({type: dialog.type(), message: dialog.message()});
    await dialog.dismiss().catch(() => undefined);
  });
  page.on('popup', async (popup) => {
    events.popups.push({url: popup.url()});
    await popup.close().catch(() => undefined);
  });
  page.on('download', async (download) => {
    events.downloads.push({suggestedFilename: download.suggestedFilename()});
    await download.cancel().catch(() => undefined);
  });
  page.on('websocket', (socket) => {
    events.webSockets.push({url: socket.url()});
  });
  return events;
}

function runtimeEventFailures(events) {
  return [
    ...events.consoleErrors.map((value) => `console error: ${value}`),
    ...events.pageErrors.map((value) => `page error: ${value}`),
    ...events.failedRequests.map((value) => `failed request: ${value.url} ${value.errorText}`),
    ...events.badHttpResponses.map((value) => `bad HTTP response: ${value.status} ${value.url}`),
    ...events.externalRequests.map((value) => `external request: ${value.method} ${value.url}`),
    ...events.dialogs.map((value) => `unexpected dialog: ${value.type} ${value.message}`),
    ...events.popups.map((value) => `unexpected popup: ${value.url}`),
    ...events.downloads.map((value) => `unexpected download: ${value.suggestedFilename}`),
    ...events.webSockets
      .filter(({url}) => {
        try {
          return new URL(url).hostname !== '127.0.0.1';
        } catch {
          return true;
        }
      })
      .map((value) => `unexpected websocket: ${value.url}`),
  ];
}

async function navigateCourse(page, baseUrl, locale) {
  const response = await page.goto(`${baseUrl}${locale.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  invariant(response?.status() === 200, `${locale.id} course returned ${response?.status()}`);
  invariant(
    response.headers()['x-helpmath-controlled-preview'] === EXPECTED_CONTROLLED_HEADER,
    `${locale.id} course lost controlled-preview response identity`,
  );
  await page.locator(`${PLAYER_SELECTOR}[data-hydrated="true"]`).waitFor({
    state: 'visible',
    timeout: 60_000,
  });
  return {
    status: response.status(),
    controlledPreview: response.headers()['x-helpmath-controlled-preview'] ?? null,
    cacheControl: response.headers()['cache-control'] ?? null,
    robots: response.headers()['x-robots-tag'] ?? null,
  };
}

async function pickerValues(page, locale) {
  return page.locator(`select[aria-label="${locale.pickerLabel}"] option`)
    .evaluateAll((elements) => elements.map((element) => element.value));
}

async function selectAndWaitForPage(page, locale, animationId, ordinal) {
  const picker = page.locator(`select[aria-label="${locale.pickerLabel}"]`);
  const pickerVisible = await picker.isVisible();
  await picker.selectOption(animationId, {force: true});
  await page.locator(
    `${PLAYER_SELECTOR}[data-current-animation-id="${animationId}"][data-current-page="${ordinal}"]`,
  ).waitFor({state: 'visible', timeout: 60_000});
  await page.locator(
    `canvas[data-animation-id="${animationId}"][data-render-state="ready"]`,
  ).waitFor({state: 'visible', timeout: 60_000});
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.locator(
    `canvas[data-animation-id="${animationId}"][data-render-state="ready"]`,
  ).waitFor({state: 'visible', timeout: 60_000});
  return {pickerVisible};
}

async function observeLayout(page, expected) {
  return page.locator(PLAYER_SELECTOR).evaluate((player, value) => {
    const runtimeShells = [...player.querySelectorAll('.runtime-shell')];
    const stages = [...player.querySelectorAll('.runtime-stage')];
    const canvases = [...player.querySelectorAll(
      `canvas[data-animation-id="${value.animationId}"][data-render-state="ready"]`,
    )];
    const stage = stages[0] ?? null;
    const canvas = canvases[0] ?? null;
    const shell = runtimeShells[0] ?? null;
    const rectangle = (element) => {
      if (!element) return null;
      const result = element.getBoundingClientRect();
      return {
        left: result.left,
        right: result.right,
        top: result.top,
        bottom: result.bottom,
        width: result.width,
        height: result.height,
      };
    };
    const documentElement = document.documentElement;
    const canvasRect = rectangle(canvas);
    const playerRect = rectangle(player);
    const runtimeShellRect = rectangle(shell);
    const identityPassed =
      player.getAttribute('data-current-animation-id') === value.animationId
      && Number(player.getAttribute('data-current-page')) === value.ordinal
      && player.getAttribute('data-hydrated') === 'true'
      && player.getAttribute('data-renderer-availability') === 'registered'
      && runtimeShells.length === 1
      && stages.length === 1
      && canvases.length === 1
      && stage?.getAttribute('data-animation-id') === value.animationId
      && stage?.getAttribute('data-animation-module') === value.animationId
      && canvas?.getAttribute('width') === '800'
      && canvas?.getAttribute('height') === '600'
      && canvasRect !== null
      && canvasRect.width > 0
      && canvasRect.height > 0
      && player.querySelectorAll('object, embed, iframe').length === 0;
    const horizontalOverflowPx = Math.max(
      0,
      documentElement.scrollWidth - documentElement.clientWidth,
      document.body.scrollWidth - window.innerWidth,
    );
    const overflowPassed = horizontalOverflowPx <= 1
      && Boolean(canvasRect)
      && canvasRect.left >= -1
      && canvasRect.right <= window.innerWidth + 1
      && Boolean(playerRect)
      && playerRect.left >= -1
      && playerRect.right <= window.innerWidth + 1;
    const layoutPassed = identityPassed
      && overflowPassed
      && Boolean(runtimeShellRect)
      && runtimeShellRect.width > 0
      && runtimeShellRect.height > 0;
    return {
      animationId: value.animationId,
      ordinal: value.ordinal,
      locale: value.locale,
      viewport: {width: window.innerWidth, height: window.innerHeight},
      playerIdentity: player.getAttribute('data-lesson-player'),
      hydrated: player.getAttribute('data-hydrated'),
      rendererAvailability: player.getAttribute('data-renderer-availability'),
      currentAnimationId: player.getAttribute('data-current-animation-id'),
      currentPage: Number(player.getAttribute('data-current-page')),
      runtimeShellCount: runtimeShells.length,
      runtimeStageCount: stages.length,
      canvasCount: canvases.length,
      runtimeAnimationId: stage?.getAttribute('data-animation-id') ?? null,
      runtimeModule: stage?.getAttribute('data-animation-module') ?? null,
      runtimeLanguage: stage?.getAttribute('data-flash-lang') ?? null,
      frameDomain: stage?.getAttribute('data-flash-frame-domain') ?? null,
      frame: Number(stage?.getAttribute('data-flash-frame') ?? NaN),
      canvasBacking: canvas
        ? {width: Number(canvas.getAttribute('width')), height: Number(canvas.getAttribute('height'))}
        : null,
      canvasRect,
      playerRect,
      runtimeShellRect,
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      horizontalOverflowPx,
      forbiddenLegacyEmbedCount: player.querySelectorAll('object, embed, iframe').length,
      layoutPassed,
      identityPassed,
      overflowPassed,
    };
  }, expected);
}

async function stageScreenshot(page, stagingRoot, name) {
  invariant(/^[a-z0-9][a-z0-9._-]*\.png$/.test(name), `Unsafe screenshot name: ${name}`);
  const bytes = await page.screenshot({fullPage: true});
  const stagedPath = path.join(stagingRoot, name);
  await writeFile(stagedPath, bytes, {flag: 'wx', mode: 0o600});
  return {name, stagedPath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function newContext(browser, locale, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({
    viewport: {width: viewport.width, height: viewport.height},
    deviceScaleFactor: 1,
    locale: locale.id === 'es' ? 'es-ES' : 'en-US',
    reducedMotion,
    serviceWorkers: 'block',
  });
  await context.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  return context;
}

async function runLayoutMatrix({browser, baseUrl, pageIds, stagingRoot}) {
  const entries = [];
  const runtimeEvents = [];
  const artifacts = [];
  const failures = [];
  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      const context = await newContext(browser, locale, viewport);
      try {
        const page = await context.newPage();
        const events = attachRuntimeMonitor(
          page,
          new URL(baseUrl).origin,
          `layout:${locale.id}:${viewport.id}`,
        );
        runtimeEvents.push(events);
        const response = await navigateCourse(page, baseUrl, locale);
        const values = await pickerValues(page, locale);
        const exactOrder = JSON.stringify(values) === JSON.stringify(pageIds);
        if (!exactOrder) {
          failures.push(`layout ${locale.id}/${viewport.id}: picker order differs from the manifest`);
        }
        const observations = [];
        for (let index = 0; index < pageIds.length; index += 1) {
          const animationId = pageIds[index];
          const selection = await selectAndWaitForPage(
            page,
            locale,
            animationId,
            index + 1,
          );
          const observed = await observeLayout(page, {
            animationId,
            ordinal: index + 1,
            locale: locale.id,
          });
          const expectedPickerVisible = viewport.id !== 'mobile-landscape';
          const observation = {
            ...observed,
            pickerVisible: selection.pickerVisible,
            expectedPickerVisible,
            pickerPresentationPassed:
              selection.pickerVisible === expectedPickerVisible,
          };
          observations.push(observation);
          if (!observation.layoutPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: layout assertion failed`,
          );
          if (!observation.identityPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: identity assertion failed`,
          );
          if (!observation.overflowPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: ${observation.horizontalOverflowPx}px horizontal overflow`,
          );
          if (!observation.pickerPresentationPassed) failures.push(
            `layout ${locale.id}/${viewport.id}/${animationId}: compact picker visibility drifted`,
          );
        }
        const captureProfile =
          (locale.id === 'en' && [
            'native-4x3',
            'desktop-16x9',
            'tablet-portrait',
          ].includes(viewport.id))
          || (locale.id === 'es' && [
            'desktop-review',
            'mobile-portrait',
            'mobile-landscape',
          ].includes(viewport.id));
        if (captureProfile) {
          artifacts.push(await stageScreenshot(
            page,
            stagingRoot,
            `matrix-${locale.id}-${viewport.width}x${viewport.height}.png`,
          ));
        }
        entries.push({
          locale: locale.id,
          viewport,
          response,
          pickerOptionCount: values.length,
          pickerUniqueCount: new Set(values).size,
          exactReleaseOrder: exactOrder,
          observations,
        });
        failures.push(...runtimeEventFailures(events).map((value) =>
          `layout ${locale.id}/${viewport.id}: ${value}`));
      } finally {
        await context.close();
      }
    }
  }
  return {entries, runtimeEvents, artifacts, failures};
}

async function sampleReducedMotion(page, animationId) {
  const samples = [];
  for (let sample = 0; sample < 3; sample += 1) {
    if (sample > 0) await page.waitForTimeout(125);
    samples.push(await page.locator(
      `.runtime-stage[data-animation-id="${animationId}"]`,
    ).evaluate((stage) => ({
      frame: Number(stage.getAttribute('data-flash-frame')),
      frameDomain: stage.getAttribute('data-flash-frame-domain'),
      animationId: stage.getAttribute('data-animation-id'),
      module: stage.getAttribute('data-animation-module'),
      language: stage.getAttribute('data-flash-lang'),
    })));
  }
  return samples;
}

async function runReducedMotionMatrix({browser, baseUrl, pageIds}) {
  const entries = [];
  const runtimeEvents = [];
  const failures = [];
  const viewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  for (const locale of LOCALES) {
    const context = await newContext(browser, locale, viewport, 'reduce');
    try {
      const page = await context.newPage();
      const events = attachRuntimeMonitor(
        page,
        new URL(baseUrl).origin,
        `reduced-motion:${locale.id}`,
      );
      runtimeEvents.push(events);
      await navigateCourse(page, baseUrl, locale);
      const values = await pickerValues(page, locale);
      invariant(JSON.stringify(values) === JSON.stringify(pageIds), `Reduced-motion ${locale.id} picker order drifted`);
      for (let index = 0; index < pageIds.length; index += 1) {
        const animationId = pageIds[index];
        await selectAndWaitForPage(page, locale, animationId, index + 1);
        const note = page.locator('.reduced-motion-note[role="status"]');
        await note.waitFor({state: 'visible', timeout: 30_000});
        const samples = await sampleReducedMotion(page, animationId);
        const stable = samples.every(({frame}) =>
          Number.isSafeInteger(frame) && frame >= 1 && frame === samples[0].frame
        );
        const identityPassed = samples.every((sample) =>
          sample.animationId === animationId && sample.module === animationId
        );
        if (!stable) failures.push(`reduced motion ${locale.id}/${animationId}: three samples are not stable`);
        if (!identityPassed) failures.push(`reduced motion ${locale.id}/${animationId}: runtime identity drifted`);
        entries.push({
          locale: locale.id,
          animationId,
          ordinal: index + 1,
          noteVisible: await note.isVisible(),
          noteText: (await note.textContent())?.trim() ?? '',
          samples,
          stable,
          identityPassed,
          passed: stable && identityPassed,
        });
      }
      failures.push(...runtimeEventFailures(events).map((value) =>
        `reduced motion ${locale.id}: ${value}`));
    } finally {
      await context.close();
    }
  }
  return {entries, runtimeEvents, failures};
}

async function storageState(page) {
  return page.evaluate((key) => {
    if (localStorage.getItem(key) === null) return {key: null, value: null};
    try {
      return {key, value: JSON.parse(localStorage.getItem(key) ?? 'null')};
    } catch {
      return {key, value: null};
    }
  }, SESSION_STORAGE_KEY);
}

async function waitForStorageState(page) {
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    SESSION_STORAGE_KEY,
    {timeout: 30_000},
  );
  return storageState(page);
}

async function waitForReplayCount(page, storageKey, animationId, expected) {
  await page.waitForFunction(
    ({key, id, count}) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
        return parsed?.replayCounts?.[id] === count;
      } catch {
        return false;
      }
    },
    {key: storageKey, id: animationId, count: expected},
    {timeout: 30_000},
  );
}

async function runReplayMatrix({browser, baseUrl, pageIds}) {
  const entries = [];
  const runtimeEvents = [];
  const failures = [];
  const viewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  for (const locale of LOCALES) {
    const context = await newContext(browser, locale, viewport);
    try {
      const page = await context.newPage();
      const events = attachRuntimeMonitor(
        page,
        new URL(baseUrl).origin,
        `replay:${locale.id}`,
      );
      runtimeEvents.push(events);
      await navigateCourse(page, baseUrl, locale);
      const values = await pickerValues(page, locale);
      invariant(JSON.stringify(values) === JSON.stringify(pageIds), `Replay ${locale.id} picker order drifted`);
      for (let index = 0; index < pageIds.length; index += 1) {
        const animationId = pageIds[index];
        await selectAndWaitForPage(page, locale, animationId, index + 1);
        const initialStorage = await waitForStorageState(page);
        invariant(initialStorage.key, `Replay ${locale.id}/${animationId}: session storage key is absent`);
        let expected = initialStorage.value?.replayCounts?.[animationId] ?? 0;
        const activations = [];
        for (const activation of REPLAY_ACTIVATIONS) {
          const replay = page.locator(
            'button[data-responsive-focus-key="replay"]:visible',
          ).first();
          await replay.waitFor({state: 'visible', timeout: 30_000});
          if (activation.kind === 'click') await replay.click();
          else {
            await replay.focus();
            await replay.press(activation.key);
          }
          expected += 1;
          await waitForReplayCount(page, initialStorage.key, animationId, expected);
          await page.locator(
            `canvas[data-animation-id="${animationId}"][data-render-state="ready"]`,
          ).waitFor({state: 'visible', timeout: 60_000});
          const observed = await storageState(page);
          const observedCount = observed.value?.replayCounts?.[animationId] ?? null;
          const passed = observedCount === expected;
          if (!passed) failures.push(
            `Replay ${locale.id}/${animationId}/${activation.id}: expected ${expected}, observed ${observedCount}`,
          );
          activations.push({
            activation: activation.id,
            expectedCount: expected,
            observedCount,
            passed,
          });
        }
        entries.push({
          locale: locale.id,
          animationId,
          ordinal: index + 1,
          storageKey: initialStorage.key,
          activations,
          passed: activations.every(({passed}) => passed),
        });
      }
      failures.push(...runtimeEventFailures(events).map((value) =>
        `Replay ${locale.id}: ${value}`));
    } finally {
      await context.close();
    }
  }
  return {entries, runtimeEvents, failures};
}

async function inspectMap(page, locale, pageIds) {
  const trigger = page.locator('button[data-responsive-focus-key="map"]:visible').first();
  const panel = page.locator('.lesson-shell2__side-panel--map');
  const closeIfOpen = async () => {
    const open = await page.locator('.lesson-shell2').getAttribute('data-map-open');
    if (open === 'true') {
      await page.keyboard.press('Escape');
      await page.waitForFunction(() =>
        document.querySelector('.lesson-shell2')?.getAttribute('data-map-open') === 'false'
      );
    }
  };
  const ensureOpen = async () => {
    const open = await page.locator('.lesson-shell2').getAttribute('data-map-open');
    if (open !== 'true') await trigger.click();
    await page.waitForFunction(() =>
      document.querySelector('.lesson-shell2')?.getAttribute('data-map-open') === 'true'
    );
    const presentation = await page.locator('.lesson-shell2')
      .getAttribute('data-map-presentation');
    if (presentation === 'overlay') {
      await page.waitForFunction(() =>
        document.activeElement?.getAttribute('data-course-map-close-control')
          === 'true'
      );
    }
  };
  await closeIfOpen();
  const keyboardOpen = [];
  for (const key of ['Enter', 'Space']) {
    await trigger.focus();
    await trigger.press(key);
    await page.waitForFunction(() =>
      document.querySelector('.lesson-shell2')?.getAttribute('data-map-open') === 'true'
    );
    const openingFocus = await page.evaluate(() => ({
      tagName: document.activeElement?.tagName ?? null,
      closeControl: document.activeElement?.getAttribute(
        'data-course-map-close-control',
      ) ?? null,
      insideMap: Boolean(document.activeElement?.closest(
        '.lesson-shell2__side-panel--map',
      )),
      mapPresentation: document.querySelector('.lesson-shell2')
        ?.getAttribute('data-map-presentation') ?? null,
    }));
    const focusTrapApplicable = openingFocus.mapPresentation === 'overlay';
    let focusTrapPassed = null;
    if (focusTrapApplicable) {
      await panel.locator('[data-course-map-close-control="true"]').focus();
      await page.keyboard.press('Shift+Tab');
      focusTrapPassed = await page.evaluate(() =>
        Boolean(document.activeElement?.closest(
          '.lesson-shell2__side-panel--map',
        ))
      );
    }
    keyboardOpen.push({
      key,
      opened: true,
      openingFocus,
      closeButtonInitialFocus: focusTrapApplicable
        ? openingFocus.closeControl === 'true'
        : null,
      focusTrapApplicable,
      focusTrapPassed,
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() =>
      document.querySelector('.lesson-shell2')?.getAttribute('data-map-open') === 'false'
    );
  }
  await ensureOpen();
  await panel.waitFor({state: 'visible', timeout: 30_000});
  const rows = panel.locator('.lesson-shell2__map-content ol li button');
  const rowCount = await rows.count();
  const currentOrdinal = Number(await page.locator(PLAYER_SELECTOR)
    .getAttribute('data-current-page'));
  await rows.nth(currentOrdinal - 1).click();
  await page.waitForFunction(() =>
    document.querySelector('.lesson-shell2')?.getAttribute('data-map-open') === 'false'
  );
  const samePageFocus = await page.evaluate(() => ({
    tagName: document.activeElement?.tagName ?? null,
    responsiveFocusKey:
      document.activeElement?.getAttribute('data-responsive-focus-key') ?? null,
  }));
  const samePageReselectFocusRestored = samePageFocus.responsiveFocusKey === 'map';
  const jumpIndex = Math.floor(pageIds.length / 2);
  const differentIndex = jumpIndex === currentOrdinal - 1
    ? Math.min(pageIds.length - 1, jumpIndex + 1)
    : jumpIndex;
  await ensureOpen();
  await panel.waitFor({state: 'visible', timeout: 30_000});
  await rows.nth(differentIndex).click();
  await page.locator(
    `${PLAYER_SELECTOR}[data-current-animation-id="${pageIds[differentIndex]}"][data-current-page="${differentIndex + 1}"]`,
  ).waitFor({state: 'visible', timeout: 30_000});
  await page.waitForFunction(() =>
    document.activeElement?.tagName === 'H1'
    && Boolean(document.activeElement.closest('.lesson-shell2__page-heading')),
  undefined, {timeout: 2_000}).catch(() => undefined);
  const differentPageFocus = await page.evaluate(() => ({
    tagName: document.activeElement?.tagName ?? null,
    insidePageHeading: Boolean(document.activeElement?.closest(
      '.lesson-shell2__page-heading',
    )),
    text: document.activeElement?.textContent?.trim() ?? null,
  }));
  const differentPageFocusRestored =
    differentPageFocus.tagName === 'H1'
    && differentPageFocus.insidePageHeading;
  await ensureOpen();
  await panel.waitFor({state: 'visible', timeout: 30_000});
  await page.keyboard.press('Escape');
  await page.waitForFunction(() =>
    document.querySelector('.lesson-shell2')?.getAttribute('data-map-open') === 'false'
  );
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute('data-responsive-focus-key') === 'map'
  , undefined, {timeout: 2_000}).catch(() => undefined);
  const focusRestored = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-responsive-focus-key') === 'map'
  );
  return {
    locale: locale.id,
    rowCount,
    samePageAnimationId: pageIds[currentOrdinal - 1],
    samePageFocus,
    samePageReselectFocusRestored,
    knownRemediationObserved: !samePageReselectFocusRestored,
    jumpAnimationId: pageIds[differentIndex],
    jumpOrdinal: differentIndex + 1,
    jumpPassed: true,
    differentPageFocus,
    differentPageFocusRestored,
    keyboardOpen,
    keyboardOpenPassed: keyboardOpen.every((entry) =>
      entry.opened
      && (!entry.focusTrapApplicable || (
        entry.closeButtonInitialFocus && entry.focusTrapPassed
      ))),
    escapeClosed: true,
    focusRestored,
    corePassed: rowCount === pageIds.length
      && differentPageFocusRestored
      && keyboardOpen.every((entry) =>
        entry.opened
        && (!entry.focusTrapApplicable || (
          entry.closeButtonInitialFocus && entry.focusTrapPassed
        )))
      && focusRestored,
    passed: rowCount === pageIds.length
      && focusRestored
      && samePageReselectFocusRestored,
  };
}

async function inspectKeyTerms(page, locale) {
  const trigger = page.locator(
    'button[data-responsive-focus-key="key-terms"]:visible',
  ).first();
  const toolPanel = page.locator('.lesson-shell2__side-panel--tool');
  const browser = page.locator('.lesson-shell2__key-terms-browser');
  const expectedInitial = locale.id === 'en' ? '761' : '753';
  const keyboardOpen = [];
  for (const key of ['Enter', 'Space']) {
    await trigger.focus();
    await trigger.press(key);
    await page.waitForFunction(() =>
      document.querySelector('.lesson-shell2')?.getAttribute('data-active-tool')
        === 'key-terms'
    );
    await page.waitForFunction((labels) =>
      labels.includes(document.activeElement?.getAttribute('aria-label')),
    [
      'Close tool',
      'Cerrar herramienta',
    ]);
    const openingFocus = await page.evaluate(() => ({
      tagName: document.activeElement?.tagName ?? null,
      ariaLabel: document.activeElement?.getAttribute('aria-label') ?? null,
      insideTool: Boolean(document.activeElement?.closest(
        '.lesson-shell2__side-panel--tool',
      )),
      toolPresentation: document.querySelector('.lesson-shell2')
        ?.getAttribute('data-tool-presentation') ?? null,
    }));
    const closeButtonInitialFocus = openingFocus.insideTool
      && ['Close tool', 'Cerrar herramienta'].includes(openingFocus.ariaLabel);
    const focusTrapApplicable = openingFocus.toolPresentation === 'overlay';
    let focusTrapPassed = null;
    if (focusTrapApplicable) {
      await toolPanel.getByRole('button', {
        name: locale.id === 'es' ? 'Cerrar herramienta' : 'Close tool',
      }).focus();
      await page.keyboard.press('Shift+Tab');
      focusTrapPassed = await page.evaluate(() =>
        Boolean(document.activeElement?.closest(
          '.lesson-shell2__side-panel--tool',
        ))
      );
    }
    keyboardOpen.push({
      key,
      opened: true,
      openingFocus,
      closeButtonInitialFocus,
      focusTrapApplicable,
      focusTrapPassed,
    });
    await browser.waitFor({state: 'visible', timeout: 30_000});
    await browser.locator('.lesson-shell2__key-terms-count')
      .filter({hasText: expectedInitial}).waitFor({timeout: 30_000});
    await page.keyboard.press('Escape');
    await page.waitForFunction(() =>
      document.querySelector('.lesson-shell2')?.getAttribute('data-active-tool')
        === 'none'
    );
  }
  await trigger.click();
  await browser.waitFor({state: 'visible', timeout: 30_000});
  await browser.locator('.lesson-shell2__key-terms-count')
    .filter({hasText: expectedInitial}).waitFor({timeout: 30_000});
  const firstCount = (await browser.locator('.lesson-shell2__key-terms-count').textContent())?.trim() ?? '';
  const initialEnglish = firstCount.includes('761');
  const initialSpanish = firstCount.includes('753');
  const alternateButton = browser.getByRole('button', {
    name: locale.id === 'en' ? '\u00cdndice espa\u00f1ol' : 'English index',
  });
  await alternateButton.click();
  const expectedAlternate = locale.id === 'en' ? '753' : '761';
  await browser.locator('.lesson-shell2__key-terms-count')
    .filter({hasText: expectedAlternate}).waitFor({timeout: 30_000});
  const alternateCount = (await browser.locator('.lesson-shell2__key-terms-count').textContent())?.trim() ?? '';
  const boundary = await browser.evaluate((element) => ({
    authority: element.getAttribute('data-data-authority'),
    originalRuntimeAccepted: element.getAttribute('data-original-runtime-accepted'),
    referenceUseAuthorized: element.getAttribute('data-reference-use-authorized'),
    runtimeLoadVerified: element.getAttribute('data-runtime-load-verified'),
    runtimeByteVariantVerified: element.getAttribute('data-runtime-byte-variant-verified'),
    sourceDisposition: element.getAttribute('data-source-disposition'),
    text: element.querySelector('.lesson-shell2__key-terms-boundary')?.textContent ?? '',
  }));
  await browser.locator('.lesson-shell2__key-terms-list li button').first().click();
  const detailHeading = browser.locator(
    '.lesson-shell2__key-term-definition h3',
  );
  await detailHeading.waitFor({state: 'visible', timeout: 30_000});
  await page.waitForFunction(() =>
    document.activeElement?.matches(
      '.lesson-shell2__key-term-definition h3',
    ) === true
  );
  const detail = {
    heading: (await detailHeading.textContent())?.trim() ?? '',
    headingFocused: await detailHeading.evaluate((element) =>
      document.activeElement === element
    ),
  };
  await page.keyboard.press('Escape');
  await page.waitForFunction(() =>
    document.querySelector('.lesson-shell2')?.getAttribute('data-active-tool') === 'none'
  );
  const focusRestored = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-responsive-focus-key') === 'key-terms'
  );
  const countsPassed = locale.id === 'en'
    ? initialEnglish && alternateCount.includes('753')
    : initialSpanish && alternateCount.includes('761');
  const boundaryPassed = boundary.originalRuntimeAccepted === 'false'
    && boundary.referenceUseAuthorized === 'true'
    && boundary.runtimeLoadVerified === 'false'
    && boundary.runtimeByteVariantVerified === 'false'
    && boundary.text.includes('L4KTE01.xml')
    && boundary.text.includes('L4KTS01.xml');
  return {
    locale: locale.id,
    firstCount,
    alternateCount,
    boundary,
    keyboardOpen,
    detail,
    escapeClosed: true,
    focusRestored,
    countsPassed,
    boundaryPassed,
    keyboardOpenPassed: keyboardOpen.every((entry) =>
      entry.opened
      && entry.closeButtonInitialFocus
      && (!entry.focusTrapApplicable || entry.focusTrapPassed)),
    passed: countsPassed
      && boundaryPassed
      && detail.heading.length > 0
      && detail.headingFocused
      && keyboardOpen.every((entry) =>
        entry.opened
        && entry.closeButtonInitialFocus
        && (!entry.focusTrapApplicable || entry.focusTrapPassed))
      && focusRestored,
  };
}

async function inspectFqFlow(page, locale, animationId, expectedQuestionCount) {
  const controlsSelector = '[data-current-javascript-question-controls="true"]';
  const controls = page.locator(controlsSelector);
  await controls.waitFor({state: 'visible', timeout: 30_000});
  const legends = [];
  for (let position = 1; position <= expectedQuestionCount; position += 1) {
    const legend = (await controls.locator('legend').textContent())?.trim() ?? '';
    legends.push(legend);
    invariant(
      legend.includes(`Question ${position} of ${expectedQuestionCount}`),
      `${locale.id}/${animationId}: unexpected FQ legend at ${position}: ${legend}`,
    );
    await controls.locator('input[type="radio"]').first().check();
    await controls.locator('button[type="submit"]').click();
    if (position < expectedQuestionCount) {
      await controls.locator('legend')
        .filter({hasText: `Question ${position + 1} of ${expectedQuestionCount}`})
        .waitFor({timeout: 30_000});
    }
  }
  const results = page.locator('[data-current-javascript-results="true"]');
  await results.waitFor({state: 'visible', timeout: 30_000});
  const resultText = (await results.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  const scoreMatch = resultText.match(/Score:\s*(\d+)\s*\/\s*(\d+)/);
  await results.getByRole('button', {name: 'Review answers'}).click();
  const review = page.locator('[data-current-javascript-text-review="true"]');
  await review.waitFor({state: 'visible', timeout: 30_000});
  const reviewTexts = [];
  for (let position = 1; position <= expectedQuestionCount; position += 1) {
    const text = (await review.locator('p[aria-live="polite"]').textContent())
      ?.replace(/\s+/g, ' ').trim() ?? '';
    reviewTexts.push(text);
    invariant(
      text.includes(`Review ${position} of ${expectedQuestionCount}`),
      `${locale.id}/${animationId}: review order drifted at ${position}`,
    );
    if (position < expectedQuestionCount) {
      await review.getByRole('button', {name: 'Next review'}).click();
    }
  }
  await review.getByRole('button', {name: 'Back to results'}).click();
  await results.waitFor({state: 'visible', timeout: 30_000});
  await results.getByRole('button', {name: 'Replay quiz'}).click();
  await controls.locator('legend')
    .filter({hasText: `Question 1 of ${expectedQuestionCount}`})
    .waitFor({timeout: 30_000});
  const resetLegend = (await controls.locator('legend').textContent())?.trim() ?? '';
  return {
    locale: locale.id,
    animationId,
    expectedQuestionCount,
    traversedQuestionCount: legends.length,
    resultText,
    observedScore: scoreMatch
      ? {correct: Number(scoreMatch[1]), total: Number(scoreMatch[2])}
      : null,
    reviewCount: reviewTexts.length,
    firstReview: reviewTexts[0] ?? null,
    lastReview: reviewTexts.at(-1) ?? null,
    replayResetLegend: resetLegend,
    sourceRandomOrderParityEstablished: false,
    sourceReviewVisualParityEstablished: false,
    spanishQuestionVisualParityEstablished: false,
    originalRuntimeScoringParityEstablished: false,
    passed: legends.length === expectedQuestionCount
      && reviewTexts.length === expectedQuestionCount
      && scoreMatch?.[2] === String(expectedQuestionCount)
      && resetLegend.includes(`Question 1 of ${expectedQuestionCount}`),
  };
}

async function runSupportChecks({browser, baseUrl, pageIds, stagingRoot}) {
  const map = [];
  const keyTerms = [];
  const fq = [];
  const runtimeEvents = [];
  const artifacts = [];
  const failures = [];
  const viewports = VIEWPORTS.filter(({id}) =>
    id === 'desktop-16x9' || id === 'mobile-portrait'
  );
  const fqPlans = [
    {animationId: 'course-g05-l04-fq-002', count: 10},
    {animationId: 'course-g05-l04-fq-003', count: 18},
  ];
  for (const locale of LOCALES) {
    for (const viewport of viewports) {
      const context = await newContext(browser, locale, viewport);
      try {
        const page = await context.newPage();
        const events = attachRuntimeMonitor(
          page,
          new URL(baseUrl).origin,
          `support:${locale.id}:${viewport.id}`,
        );
        runtimeEvents.push(events);
        await navigateCourse(page, baseUrl, locale);
        const mapResult = await inspectMap(page, locale, pageIds);
        map.push({...mapResult, viewport});
        if (!mapResult.corePassed) failures.push(
          `Course Map core ${locale.id}/${viewport.id} failed`,
        );
        const keyTermsResult = await inspectKeyTerms(page, locale);
        keyTerms.push({...keyTermsResult, viewport});
        if (!keyTermsResult.passed) failures.push(
          `Key Terms ${locale.id}/${viewport.id} failed`,
        );
        if (viewport.id === 'mobile-portrait') {
          for (const plan of fqPlans) {
            const ordinal = pageIds.indexOf(plan.animationId) + 1;
            invariant(ordinal > 0, `${plan.animationId} is absent from v6 manifest`);
            await selectAndWaitForPage(page, locale, plan.animationId, ordinal);
            const fqResult = await inspectFqFlow(
              page,
              locale,
              plan.animationId,
              plan.count,
            );
            fq.push({...fqResult, viewport});
            if (!fqResult.passed) failures.push(
              `FQ ${locale.id}/${plan.animationId} failed`,
            );
          }
          artifacts.push(await stageScreenshot(
            page,
            stagingRoot,
            `support-fq-reset-${locale.id}.png`,
          ));
        }
        failures.push(...runtimeEventFailures(events).map((value) =>
          `support ${locale.id}/${viewport.id}: ${value}`));
      } finally {
        await context.close();
      }
    }
  }
  return {map, keyTerms, fq, runtimeEvents, artifacts, failures};
}

async function runPersistenceChecks({browser, baseUrl, pageIds}) {
  const entries = [];
  const runtimeEvents = [];
  const failures = [];
  const viewport = VIEWPORTS.find(({id}) => id === 'desktop-16x9');
  for (const locale of LOCALES) {
    const context = await browser.newContext({
      viewport: {width: viewport.width, height: viewport.height},
      deviceScaleFactor: 1,
      locale: locale.id === 'es' ? 'es-ES' : 'en-US',
      reducedMotion: 'no-preference',
      serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage();
      const events = attachRuntimeMonitor(
        page,
        new URL(baseUrl).origin,
        `persistence:${locale.id}`,
      );
      runtimeEvents.push(events);
      await navigateCourse(page, baseUrl, locale);
      const initialUrl = page.url();
      const initialHistoryLength = await page.evaluate(() => history.length);
      const targetIndex = 26;
      const targetId = pageIds[targetIndex];
      await selectAndWaitForPage(page, locale, targetId, targetIndex + 1);
      const afterSelectionUrl = page.url();
      const afterSelectionHistoryLength = await page.evaluate(() => history.length);
      await page.waitForFunction(({key, id}) => {
        try {
          return JSON.parse(localStorage.getItem(key) ?? 'null')
            ?.currentAnimationId === id;
        } catch {
          return false;
        }
      }, {key: SESSION_STORAGE_KEY, id: targetId}, {timeout: 30_000});
      const storedAfterWait = await waitForStorageState(page);
      invariant(storedAfterWait.key, `Persistence ${locale.id}: storage key is absent`);
      invariant(storedAfterWait.value?.currentAnimationId === targetId, `Persistence ${locale.id}: selected page was not stored`);
      await page.reload({waitUntil: 'domcontentloaded', timeout: 60_000});
      await page.locator(
        `${PLAYER_SELECTOR}[data-hydrated="true"][data-current-animation-id="${targetId}"]`,
      ).waitFor({state: 'visible', timeout: 60_000});
      await page.locator(
        `canvas[data-animation-id="${targetId}"][data-render-state="ready"]`,
      ).waitFor({state: 'visible', timeout: 60_000});
      const reloadRestored = await page.locator(PLAYER_SELECTOR)
        .getAttribute('data-current-animation-id') === targetId;
      await page.evaluate(({key}) => localStorage.setItem(key, '{invalid-json'), {
        key: storedAfterWait.key,
      });
      await page.reload({waitUntil: 'domcontentloaded', timeout: 60_000});
      await page.locator(
        `${PLAYER_SELECTOR}[data-hydrated="true"][data-current-animation-id="${pageIds[0]}"]`,
      ).waitFor({state: 'visible', timeout: 60_000});
      await page.locator(
        `canvas[data-animation-id="${pageIds[0]}"][data-render-state="ready"]`,
      ).waitFor({state: 'visible', timeout: 60_000});
      const invalidJsonFailedClosed = await page.locator(PLAYER_SELECTOR)
        .getAttribute('data-current-animation-id') === pageIds[0];
      const perPageUrlState = initialUrl !== afterSelectionUrl
        || initialHistoryLength !== afterSelectionHistoryLength;
      const passed = reloadRestored && invalidJsonFailedClosed && !perPageUrlState;
      if (!passed) failures.push(`Persistence ${locale.id} failed`);
      entries.push({
        locale: locale.id,
        storageKey: storedAfterWait.key,
        selectedAnimationId: targetId,
        reloadRestored,
        invalidJsonFailedClosed,
        initialUrl,
        afterSelectionUrl,
        initialHistoryLength,
        afterSelectionHistoryLength,
        selectionChangedUrlOrHistory: perPageUrlState,
        perPageUrlStateAvailable: false,
        passed,
      });
      failures.push(...runtimeEventFailures(events).map((value) =>
        `persistence ${locale.id}: ${value}`));
    } finally {
      await context.close();
    }
  }
  return {entries, runtimeEvents, failures};
}

async function runDirectUrlChecks({request, baseUrl, probeAnimationId}) {
  const plans = [
    {kind: 'course', path: '/courses/5/4', expected: 200},
    {kind: 'course', path: '/es/courses/5/4', expected: 200},
    {kind: 'animation', path: `/animations/${probeAnimationId}`, expected: 404},
    {kind: 'animation', path: `/en/animations/${probeAnimationId}`, expected: 404},
    {kind: 'animation', path: `/es/animations/${probeAnimationId}`, expected: 404},
    {kind: 'demo', path: `/demos/${probeAnimationId}`, expected: 404},
    {kind: 'demo', path: `/en/demos/${probeAnimationId}`, expected: 404},
    {kind: 'demo', path: `/es/demos/${probeAnimationId}`, expected: 404},
  ];
  const entries = [];
  const failures = [];
  for (const plan of plans) {
    const response = await request.get(`${baseUrl}${plan.path}`, {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    const observed = response.status();
    const passed = observed === plan.expected;
    if (!passed) failures.push(
      `Direct URL ${plan.path}: expected ${plan.expected}, observed ${observed}`,
    );
    entries.push({
      ...plan,
      observed,
      controlledPreview: response.headers()['x-helpmath-controlled-preview'] ?? null,
      passed,
    });
  }
  return {
    entries,
    courseRoutesAvailable: entries
      .filter(({kind}) => kind === 'course')
      .every(({observed}) => observed === 200),
    perPageDirectUrlAvailable: entries
      .filter(({kind}) => kind !== 'course')
      .some(({observed}) => observed === 200),
    expectedV6BoundaryPreserved: failures.length === 0,
    failures,
  };
}

function aggregateNetwork(runtimeEventGroups) {
  const flattened = runtimeEventGroups.flat();
  const combined = {
    scopeCount: flattened.length,
    consoleErrors: flattened.flatMap(({scope, consoleErrors}) =>
      consoleErrors.map((value) => ({scope, value}))),
    pageErrors: flattened.flatMap(({scope, pageErrors}) =>
      pageErrors.map((value) => ({scope, value}))),
    failedRequests: flattened.flatMap(({scope, failedRequests}) =>
      failedRequests.map((value) => ({scope, ...value}))),
    ignoredAbortedRscRequests: flattened.flatMap(({scope, ignoredAbortedRscRequests}) =>
      ignoredAbortedRscRequests.map((value) => ({scope, ...value}))),
    badHttpResponses: flattened.flatMap(({scope, badHttpResponses}) =>
      badHttpResponses.map((value) => ({scope, ...value}))),
    externalRequests: flattened.flatMap(({scope, externalRequests}) =>
      externalRequests.map((value) => ({scope, ...value}))),
    dialogs: flattened.flatMap(({scope, dialogs}) =>
      dialogs.map((value) => ({scope, ...value}))),
    popups: flattened.flatMap(({scope, popups}) =>
      popups.map((value) => ({scope, ...value}))),
    downloads: flattened.flatMap(({scope, downloads}) =>
      downloads.map((value) => ({scope, ...value}))),
    webSockets: flattened.flatMap(({scope, webSockets}) =>
      webSockets.map((value) => ({scope, ...value}))),
  };
  combined.passed = [
    combined.consoleErrors,
    combined.pageErrors,
    combined.failedRequests,
    combined.badHttpResponses,
    combined.externalRequests,
    combined.dialogs,
    combined.popups,
    combined.downloads,
    combined.webSockets,
  ].every((values) => values.length === 0);
  return combined;
}

async function runRemediationProbes({browser, baseUrl, pageIds}) {
  const failures = [];
  const runtimeEvents = [];
  const animationId = 'course-g05-l04-vb-004';
  const ordinal = pageIds.indexOf(animationId) + 1;
  invariant(ordinal > 0, `${animationId} is absent from v6 manifest`);

  const reducedContext = await browser.newContext({
    viewport: {width: 1280, height: 720},
    deviceScaleFactor: 1,
    locale: 'en-US',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  let reducedMotionPointerInterception;
  try {
    const page = await reducedContext.newPage();
    const events = attachRuntimeMonitor(
      page,
      new URL(baseUrl).origin,
      'remediation:reduced-motion-pointer-interception',
    );
    runtimeEvents.push(events);
    await navigateCourse(page, baseUrl, LOCALES[0]);
    await selectAndWaitForPage(page, LOCALES[0], animationId, ordinal);
    const negativeFive = page.getByRole('button', {name: 'Move negative five'});
    await negativeFive.waitFor({state: 'visible', timeout: 30_000});
    reducedMotionPointerInterception = await negativeFive.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const center = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
      const hit = document.elementFromPoint(center.x, center.y);
      const note = hit?.closest('.reduced-motion-note') ?? null;
      return {
        probe: 'VB004 negative-five center elementFromPoint under reduced motion',
        center,
        targetTag: button.tagName,
        targetAriaLabel: button.getAttribute('aria-label'),
        hitTag: hit?.tagName ?? null,
        hitClass: hit?.getAttribute('class') ?? null,
        hitText: hit?.textContent?.trim() ?? null,
        noteIntercepted: Boolean(note),
        expectedRemediationObserved: Boolean(note),
      };
    });
    failures.push(...runtimeEventFailures(events).map((value) =>
      `reduced pointer probe: ${value}`));
  } finally {
    await reducedContext.close();
  }

  const spanishContext = await browser.newContext({
    viewport: {width: 390, height: 844},
    deviceScaleFactor: 1,
    locale: 'es-ES',
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
  });
  let vb004SpanishModernUi;
  let mobileExitClip;
  try {
    const page = await spanishContext.newPage();
    const events = attachRuntimeMonitor(
      page,
      new URL(baseUrl).origin,
      'remediation:vb004-es-and-mobile-exit',
    );
    runtimeEvents.push(events);
    await navigateCourse(page, baseUrl, LOCALES[1]);
    await selectAndWaitForPage(page, LOCALES[1], animationId, ordinal);
    const mobileSurface = page.locator(
      '.course-g05-l04-vb004-mobile-surface:visible',
    );
    await mobileSurface.waitFor({state: 'visible', timeout: 30_000});
    vb004SpanishModernUi = await mobileSurface.evaluate((element) => {
      const ariaLabels = [...element.querySelectorAll('[aria-label]')]
        .map((candidate) => candidate.getAttribute('aria-label'))
        .filter(Boolean);
      const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const surfaceAriaLabel = element.getAttribute('aria-label');
      const englishOwnedUiObserved =
        surfaceAriaLabel === 'Responsive integer classification controls'
        || /\b(Integer|Non-integer|negative five|Drag|Select|placed)\b/i.test(
          `${text} ${ariaLabels.join(' ')}`,
        );
      return {
        probe: 'VB004 Spanish route app-owned responsive companion language',
        documentLanguage: document.documentElement.lang,
        surfaceAriaLabel,
        text,
        ariaLabels,
        englishOwnedUiObserved,
        expectedRemediationObserved: englishOwnedUiObserved,
      };
    });
    mobileExitClip = await page.locator('.lesson-shell2').evaluate((shell) => {
      const stage = shell.querySelector('.lesson-shell2__legacy-stage');
      const exit = shell.querySelector(
        '[data-responsive-focus-surface="legacy"] [data-responsive-focus-key="exit"]',
      );
      const toRect = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      const stageRect = toRect(stage);
      const exitRect = toRect(exit);
      const intersection = stageRect && exitRect ? {
        width: Math.max(0, Math.min(stageRect.right, exitRect.right)
          - Math.max(stageRect.left, exitRect.left)),
        height: Math.max(0, Math.min(stageRect.bottom, exitRect.bottom)
          - Math.max(stageRect.top, exitRect.top)),
      } : null;
      const visibleRatio = intersection && exitRect && exitRect.width * exitRect.height > 0
        ? (intersection.width * intersection.height) / (exitRect.width * exitRect.height)
        : 0;
      const clipped = Boolean(stageRect && exitRect && (
        exitRect.left < stageRect.left
        || exitRect.right > stageRect.right
        || exitRect.top < stageRect.top
        || exitRect.bottom > stageRect.bottom
      ));
      return {
        probe: '390px legacy Exit hit area against overflow-clipped stage',
        viewport: {width: innerWidth, height: innerHeight},
        stageRect,
        exitRect,
        stageOverflow: stage ? getComputedStyle(stage).overflow : null,
        intersection,
        visibleRatio,
        clipped,
        expectedRemediationObserved: clipped,
      };
    });
    failures.push(...runtimeEventFailures(events).map((value) =>
      `Spanish VB004/Exit probe: ${value}`));
  } finally {
    await spanishContext.close();
  }

  return {
    reducedMotionPointerInterception,
    vb004SpanishModernUi,
    mobileExitClip,
    runtimeEvents,
    failures,
  };
}

function assertionCounts({matrix, reducedMotion, replay, support, persistence}) {
  const layoutObservations = matrix.entries.flatMap(({observations}) => observations);
  const replayActivations = replay.entries.flatMap(({activations}) => activations);
  const count = (values, predicate) => ({
    passed: values.filter(predicate).length,
    failed: values.filter((value) => !predicate(value)).length,
  });
  return {
    layout: count(layoutObservations, ({layoutPassed}) => layoutPassed),
    identity: count(layoutObservations, ({identityPassed}) => identityPassed),
    overflow: count(layoutObservations, ({overflowPassed}) => overflowPassed),
    reducedMotionObservations: count(
      reducedMotion.entries,
      ({passed}) => passed,
    ),
    reducedMotionSamples: count(
      reducedMotion.entries.flatMap(({samples, identityPassed}) =>
        samples.map((sample, index, values) => ({
          sample,
          identityPassed,
          stable: Number.isSafeInteger(sample.frame)
            && sample.frame >= 1
            && sample.frame === values[0].frame,
        }))),
      ({identityPassed, stable}) => identityPassed && stable,
    ),
    replayActivations: count(replayActivations, ({passed}) => passed),
    mapCore: count(support.map, ({corePassed}) => corePassed),
    mapSamePageReselectFocus: count(
      support.map,
      ({samePageReselectFocusRestored}) => samePageReselectFocusRestored,
    ),
    keyTerms: count(support.keyTerms, ({passed}) => passed),
    fq: count(support.fq, ({passed}) => passed),
    persistence: count(persistence.entries, ({passed}) => passed),
  };
}

function expectedRemediationFindings({support, remediationProbes}) {
  return [
    {
      ...KNOWN_REMEDIATIONS_REQUIRED[0],
      observed: remediationProbes.reducedMotionPointerInterception
        ?.expectedRemediationObserved === true,
      evidence: remediationProbes.reducedMotionPointerInterception,
    },
    {
      ...KNOWN_REMEDIATIONS_REQUIRED[1],
      observed: remediationProbes.vb004SpanishModernUi
        ?.expectedRemediationObserved === true,
      evidence: remediationProbes.vb004SpanishModernUi,
    },
    {
      ...KNOWN_REMEDIATIONS_REQUIRED[2],
      observed: remediationProbes.mobileExitClip
        ?.expectedRemediationObserved === true,
      evidence: remediationProbes.mobileExitClip,
    },
    {
      ...KNOWN_REMEDIATIONS_REQUIRED[3],
      observed: support.map.length === 4
        && support.map.every(({knownRemediationObserved}) =>
          knownRemediationObserved === true),
      evidence: support.map.map((entry) => ({
        locale: entry.locale,
        viewport: entry.viewport,
        samePageAnimationId: entry.samePageAnimationId,
        samePageFocus: entry.samePageFocus,
        samePageReselectFocusRestored:
          entry.samePageReselectFocusRestored,
      })),
    },
  ];
}

function freshClaims({matrix, reducedMotion, replay, support, persistence, directUrl, network}) {
  const exactReleaseOrder = matrix.entries.length ===
      LOCALES.length * VIEWPORTS.length
    && matrix.entries.every(({exactReleaseOrder}) => exactReleaseOrder);
  const layout = matrix.entries.flatMap(({observations}) => observations)
    .every(({layoutPassed, identityPassed, overflowPassed}) =>
      layoutPassed && identityPassed && overflowPassed);
  return {
    deepQaFreshlyPerformed: true,
    freshUnzip: true,
    packageVerifierBeforeAndAfter: false,
    dynamicLoopbackServer: true,
    exactReleaseOrder,
    layout,
    reducedMotion: reducedMotion.entries.length ===
        REDUCED_MOTION_OBSERVATION_COUNT
      && reducedMotion.entries.every(({passed}) => passed),
    replayMouseEnterSpace: replay.entries.length ===
        LOCALES.length * ACTIVE_PAGE_COUNT
      && replay.entries.every(({passed}) => passed),
    mapCore: support.map.length === 4
      && support.map.every(({corePassed}) => corePassed),
    mapDifferentPageFocus: support.map.length === 4
      && support.map.every(({differentPageFocusRestored}) =>
        differentPageFocusRestored),
    mapSameCurrentPageReselectFocus: support.map.length === 4
      && support.map.every(({samePageReselectFocusRestored}) =>
        samePageReselectFocusRestored),
    map: support.map.length === 4
      && support.map.every(({passed}) => passed),
    keyTerms: support.keyTerms.length === 4
      && support.keyTerms.every(({passed}) => passed),
    fq: support.fq.length === 4
      && support.fq.every(({passed}) => passed),
    persistence: persistence.entries.length === 2
      && persistence.entries.every(({passed}) => passed),
    directUrlBoundary: directUrl.expectedV6BoundaryPreserved,
    perPageDirectUrl: directUrl.perPageDirectUrlAvailable,
    networkBoundary: network.passed,
    currentJavascriptDeepQaMatrixComplete: layout
      && exactReleaseOrder
      && reducedMotion.entries.every(({passed}) => passed)
      && replay.entries.every(({passed}) => passed),
    machineWorkExhausted: false,
    productQaComplete: false,
    migrationQaComplete: false,
  };
}

function initialReport() {
  return {
    schemaVersion: 1,
    reportType: REPORT_TYPE,
    packageId: PACKAGE_ID,
    status: 'running',
    generatedAt: new Date().toISOString(),
    generatorBinding: null,
    testBinding: null,
    archiveBinding: {
      path: ARCHIVE_RELATIVE_PATH,
      bytes: null,
      sha256: ARCHIVE_SHA256,
    },
    archiveSidecarBinding: null,
    packageManifestBinding: {
      path: `${PACKAGE_BASENAME}/package-manifest.json`,
      bytes: null,
      sha256: PACKAGE_MANIFEST_SHA256,
    },
    sourceObservation: sourceObservation(
      PACKAGE_SOURCE_SNAPSHOT,
      OBSERVED_POST_V6_SOURCE_SNAPSHOT,
    ),
    authorityBoundary: {
      evidenceLayer: 'current-javascript-machine-product-qa-only',
      acceptanceNeutral: true,
      strictAcceptanceEffect: 'none',
      originalRuntimeAuthority: false,
      humanReviewAuthority: false,
      ownerAuthority: false,
      publicationAuthority: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    releaseBoundary: {
      releaseId: RELEASE_ID,
      activePages: ACTIVE_PAGE_COUNT,
      courseShells: 1,
      expectedMembers: RELEASE_MEMBER_COUNT,
      strictCompleteCount: 0,
      missingCount: RELEASE_MEMBER_COUNT,
      published: false,
    },
    expectations: {
      locales: LOCALES,
      viewports: VIEWPORTS,
      activePages: ACTIVE_PAGE_COUNT,
      layoutObservations: LAYOUT_OBSERVATION_COUNT,
      reducedMotionObservations: REDUCED_MOTION_OBSERVATION_COUNT,
      reducedMotionSamples: REDUCED_MOTION_SAMPLE_COUNT,
      replayActivations: REPLAY_ACTIVATION_COUNT,
      deviceScaleFactor: 1,
    },
    freshUnzip: null,
    packageVerifier: {before: null, after: null},
    matrix: {entries: []},
    reducedMotion: {entries: []},
    replay: {entries: []},
    support: {map: [], keyTerms: [], fq: [], persistence: {entries: []}, directUrl: null},
    network: null,
    assertionCounts: {},
    freshClaims: {
      deepQaFreshlyPerformed: false,
      machineWorkExhausted: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    knownRemediationsRequired: KNOWN_REMEDIATIONS_REQUIRED,
    knownLimitations: KNOWN_LIMITATIONS,
    remediationFindings: [],
    artifacts: [],
    outputBindings: null,
    failures: [],
  };
}

async function safelyRemoveRunRoot(runRoot) {
  if (!runRoot) return;
  invariant(path.dirname(runRoot) === WESTWORLD_TEMP_ROOT, 'Refusing to remove a run root outside /Volumes/WestWorld');
  invariant(path.basename(runRoot).startsWith(TEMP_PREFIX), 'Refusing to remove an unrecognized run root');
  const metadata = await lstatIfPresent(runRoot);
  if (!metadata) return;
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(), 'Run root is not an ordinary directory');
  await rm(runRoot, {recursive: true, force: false});
}

export async function runDeepProductQa(options) {
  const outputPlan = await prepareOutputPlan(options);
  await assertOrdinaryDirectory(WESTWORLD_TEMP_ROOT, 'WestWorld temporary root');
  const runRoot = await mkdtemp(path.join(WESTWORLD_TEMP_ROOT, TEMP_PREFIX));
  const report = initialReport();
  const stagedArtifacts = [];
  let server = null;
  let browser = null;
  const serverLog = [];
  try {
    const archivePath = path.join(WORKSPACE_ROOT, ARCHIVE_RELATIVE_PATH);
    const archiveShaPath = `${archivePath}.sha256`;
    const archiveBytes = await readFile(archivePath);
    invariant(sha256(archiveBytes) === ARCHIVE_SHA256, 'v6 archive SHA-256 changed');
    report.archiveBinding = await fileBinding(archivePath);
    report.archiveSidecarBinding = await fileBinding(archiveShaPath);
    const sidecar = (await readFile(archiveShaPath, 'utf8')).trim();
    invariant(sidecar.startsWith(`${ARCHIVE_SHA256}  `), 'v6 archive SHA sidecar changed');

    const archiveTest = await runCommand('/usr/bin/unzip', ['-tq', archivePath], {
      cwd: runRoot,
      timeoutMs: 120_000,
    });
    invariant(archiveTest.status === 0, `v6 archive integrity test failed: ${archiveTest.stderr}`);
    const extractionRoot = path.join(runRoot, 'extracted');
    const stagingRoot = path.join(runRoot, 'staged-artifacts');
    await mkdir(extractionRoot, {recursive: false, mode: 0o700});
    await mkdir(stagingRoot, {recursive: false, mode: 0o700});
    const extraction = await runCommand(
      '/usr/bin/unzip',
      ['-q', archivePath, '-d', extractionRoot],
      {cwd: runRoot, timeoutMs: 180_000},
    );
    invariant(extraction.status === 0, `Fresh extraction failed: ${extraction.stderr}`);
    const packageRoot = path.join(extractionRoot, PACKAGE_BASENAME);
    const packageMetadata = await lstat(packageRoot);
    invariant(packageMetadata.isDirectory() && !packageMetadata.isSymbolicLink(), 'Fresh package root is invalid');
    const extractionInventory = await assertNoSymlinks(packageRoot);
    const manifestPath = path.join(packageRoot, 'package-manifest.json');
    const manifestBinding = await fileBinding(manifestPath, extractionRoot);
    invariant(manifestBinding.sha256 === PACKAGE_MANIFEST_SHA256, 'v6 package manifest SHA-256 changed');
    report.packageManifestBinding = manifestBinding;
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const pageIds = expectedPageIdsFromManifest(manifest);
    invariant(
      JSON.stringify(manifest.build?.inputSnapshotBefore) ===
        JSON.stringify(PACKAGE_SOURCE_SNAPSHOT)
      && JSON.stringify(manifest.build?.inputSnapshotAfter) ===
        JSON.stringify(PACKAGE_SOURCE_SNAPSHOT),
      'v6 manifest package source snapshot changed',
    );

    const releaseDocument = JSON.parse(await readFile(
      path.join(WORKSPACE_ROOT, 'catalog/lesson-releases.json'),
      'utf8',
    ));
    const currentSnapshot = await buildCurrentPackageInputSnapshot(
      selectG5L4Release(releaseDocument),
    );
    report.sourceObservation = {
      ...sourceObservation(PACKAGE_SOURCE_SNAPSHOT, currentSnapshot),
      observedExpectedPostV6Aggregate:
        JSON.stringify(currentSnapshot) ===
        JSON.stringify(OBSERVED_POST_V6_SOURCE_SNAPSHOT),
      tsconfigObservation: {
        ...(await fileBinding(path.join(WORKSPACE_ROOT, 'apps/web/tsconfig.json'))),
        containsG4V31GeneratedTypes: (await readFile(
          path.join(WORKSPACE_ROOT, 'apps/web/tsconfig.json'),
          'utf8',
        )).includes('.next-g4-l3-package-v3-1/types/**/*.ts'),
      },
    };
    report.generatorBinding = await fileBinding(SCRIPT_PATH);
    report.testBinding = await fileBinding(
      path.join(WORKSPACE_ROOT, 'scripts/qa-g5-l4-v6-deep-product.test.mjs'),
    );

    report.packageVerifier.before = await runCommand(
      process.execPath,
      ['verify.mjs'],
      {cwd: packageRoot, timeoutMs: 120_000},
    );
    invariant(report.packageVerifier.before.status === 0, 'Fresh package pre-QA verifier failed');

    const port = await findAvailableLoopbackPort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const runtimeRoot = path.join(packageRoot, 'runtime');
    const serverEntry = manifest.entry.serverEntry.replace(/^runtime\//, '');
    const environment = {
      ...process.env,
      NODE_ENV: 'production',
      G5_L4_CEO_PREVIEW_ENABLED: '1',
      G5_L4_WHOLE_LESSON_PACKAGE: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
    };
    delete environment.VERCEL_ENV;
    server = spawn(process.execPath, [serverEntry], {
      cwd: runtimeRoot,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
    server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));
    const initialResponse = await waitForCourse(`${baseUrl}/courses/5/4`, server);
    const listenerOwnedBySpawnedChild = await childOwnsLoopbackListener(server, port);
    invariant(listenerOwnedBySpawnedChild, 'Dynamic loopback listener is not owned by the spawned package child');
    report.freshUnzip = {
      rootPolicy: 'unique-mkdtemp-directly-under-/Volumes/WestWorld',
      runRootBasename: path.basename(runRoot),
      packageRootBasename: path.basename(packageRoot),
      archiveIntegrityTest: archiveTest.status === 0,
      extractionInventory,
      packageSource: 'hash-bound-v6-zip-only',
      currentWorkspaceSourceServed: false,
      loopback: {
        host: '127.0.0.1',
        dynamicPort: true,
        port,
        baseUrl,
        listenerOwnedBySpawnedChild,
        initialResponse,
      },
      serverEntry: manifest.entry.serverEntry,
    };

    const playwright = await import('playwright');
    browser = await playwright.chromium.launch({headless: true});
    const matrix = await runLayoutMatrix({
      browser,
      baseUrl,
      pageIds,
      stagingRoot,
    });
    stagedArtifacts.push(...matrix.artifacts);
    const reducedMotion = await runReducedMotionMatrix({
      browser,
      baseUrl,
      pageIds,
    });
    const replay = await runReplayMatrix({
      browser,
      baseUrl,
      pageIds,
    });
    const support = await runSupportChecks({
      browser,
      baseUrl,
      pageIds,
      stagingRoot,
    });
    stagedArtifacts.push(...support.artifacts);
    const persistence = await runPersistenceChecks({
      browser,
      baseUrl,
      pageIds,
    });
    const request = await playwright.request.newContext();
    let directUrl;
    try {
      directUrl = await runDirectUrlChecks({
        request,
        baseUrl,
        probeAnimationId: 'course-g05-l04-vb-004',
      });
    } finally {
      await request.dispose();
    }
    const remediationProbes = await runRemediationProbes({
      browser,
      baseUrl,
      pageIds,
    });
    await browser.close();
    browser = null;

    report.matrix = {entries: matrix.entries};
    report.reducedMotion = {entries: reducedMotion.entries};
    report.replay = {entries: replay.entries};
    report.support = {
      map: support.map,
      keyTerms: support.keyTerms,
      fq: support.fq,
      persistence,
      directUrl,
      remediationProbes: {
        reducedMotionPointerInterception:
          remediationProbes.reducedMotionPointerInterception,
        vb004SpanishModernUi: remediationProbes.vb004SpanishModernUi,
        mobileExitClip: remediationProbes.mobileExitClip,
      },
    };
    report.network = aggregateNetwork([
      matrix.runtimeEvents,
      reducedMotion.runtimeEvents,
      replay.runtimeEvents,
      support.runtimeEvents,
      persistence.runtimeEvents,
      remediationProbes.runtimeEvents,
    ]);
    report.assertionCounts = assertionCounts({
      matrix,
      reducedMotion,
      replay,
      support,
      persistence,
    });
    report.freshClaims = freshClaims({
      matrix,
      reducedMotion,
      replay,
      support,
      persistence,
      directUrl,
      network: report.network,
    });
    report.remediationFindings = expectedRemediationFindings({
      support,
      remediationProbes,
    });
    report.knownRemediationsRequired = report.remediationFindings.map(
      ({evidence: _evidence, ...finding}) => finding,
    );
    report.failures = [
      ...matrix.failures,
      ...reducedMotion.failures,
      ...replay.failures,
      ...support.failures,
      ...persistence.failures,
      ...directUrl.failures,
      ...remediationProbes.failures,
    ];
    const allExpectedRemediationsObserved = report.remediationFindings.length === 4
      && report.remediationFindings.every(({observed}) => observed);
    if (report.failures.length === 0 && allExpectedRemediationsObserved) {
      report.status = 'observed-current-javascript-deep-qa-remediations-required';
    } else {
      report.status = 'fail-current-javascript-deep-qa';
    }

    await stopChild(server);
    server = null;
    report.packageVerifier.after = await runCommand(
      process.execPath,
      ['verify.mjs'],
      {cwd: packageRoot, timeoutMs: 120_000},
    );
    invariant(report.packageVerifier.after.status === 0, 'Fresh package post-QA verifier failed');
    report.freshClaims.packageVerifierBeforeAndAfter = true;
    report.freshUnzip.serverLogTail = serverLog.join('').slice(-20_000);
  } catch (error) {
    report.failures.push(error instanceof Error ? error.message : String(error));
    report.status = 'fail-current-javascript-deep-qa-execution';
    if (browser) await browser.close().catch(() => undefined);
    browser = null;
    await stopChild(server).catch(() => undefined);
    server = null;
  }

  try {
    const result = await commitImmutableEvidence(outputPlan, report, stagedArtifacts);
    return {report, result};
  } finally {
    await safelyRemoveRunRoot(runRoot);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const {report, result} = await runDeepProductQa(options);
  process.stdout.write(stableJson({
    status: report.status,
    outputJson: relativeToWorkspace(result.json.path),
    outputMd: relativeToWorkspace(result.markdown.path),
    artifactCount: result.artifacts.length,
    failureCount: report.failures.length,
  }));
  if (report.status === 'fail-current-javascript-deep-qa-execution') {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
