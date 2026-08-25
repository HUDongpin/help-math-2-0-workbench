#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {
  lstat,
  open,
  readFile,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {
  collectChromiumToolchainIdentity,
  planReceiptBytes,
} from './generate-adaptive-canvas-batch.mjs';

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

export const OUTPUT_PATH =
  'work/adaptive-canvas-real-browser-validation-v10.freeze.v1.json';
export const V10_PLAN_PATH =
  'work/adaptive-canvas-production-five.plan.v10.json';
export const PREDECESSOR_FREEZE_PATH =
  'work/adaptive-canvas-production-five.gate0a-freeze.v2.json';

const EXPECTED = Object.freeze({
  v10PlanSha256:
    'db4b349f5863d3e4b784953aa5342d5499a38311fa268ce9a068f7e7b633d983',
  regenerationProvenanceSha256:
    'd901badb154a562b97f102edb0a1ffd23fee67628254d8235a8814fcaac0ce8a',
  atomicBuildReceiptSha256:
    'd6836dbeea6b029e572b2286b39bf5b68f24d8e08904b7b523e2968dbcc0eda5',
  inactiveBindingSha256:
    'e3999ed5a22d2eb1eb422bdfc3b25fe10aff237f0eb5aceb0908bee1219a1b63',
  v1ProfileSha256:
    'ccd832025b2df2c69615872645944b5bcfab18628d4d69df71ea0341925f9eca',
  predecessorFreezeSha256:
    'ab8de7e712a9eddc31e71c44019afa95c04d2056e14f54cecf587287d7220a9a',
});

const CONTROL_PATHS = Object.freeze([
  V10_PLAN_PATH,
  'work/adaptive-canvas-production-five.regeneration-provenance.v1.json',
  'work/adaptive-canvas-atomic-commit-build.v2.json',
  'packages/demos/src/adaptive-canvas-production-bindings.generated.ts',
  'apps/web/config/current-js-production-assets.v1.json',
  PREDECESSOR_FREEZE_PATH,
  'package-lock.json',
]);

const FORBIDDEN_PRESENT_PATHS = Object.freeze([
  'apps/web/config/current-js-production-assets.v2.json',
  'work/adaptive-canvas-production-five.chromium-proof.v2.json',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonicalize(value[key]),
    ]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(document) {
  return Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
}

function absolute(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0,
    'freeze path is empty');
  const resolved = path.resolve(projectRoot, relativePath);
  invariant(resolved.startsWith(`${projectRoot}${path.sep}`),
    `freeze path escapes the project: ${relativePath}`);
  return resolved;
}

async function stableFile(relativePath) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} is not an ordinary file`);
  const handle = await open(target, 'r');
  try {
    const handleBefore = await handle.stat({bigint: true});
    const bytes = await handle.readFile();
    const handleAfter = await handle.stat({bigint: true});
    const after = await lstat(target);
    invariant(
      handleBefore.dev === handleAfter.dev &&
        handleBefore.ino === handleAfter.ino &&
        handleBefore.size === handleAfter.size &&
        handleBefore.mtimeNs === handleAfter.mtimeNs &&
        before.dev === after.dev && before.ino === after.ino &&
        BigInt(bytes.length) === handleAfter.size,
      `${relativePath} changed during the freeze read`,
    );
    return {
      path: relativePath,
      bytes: bytes.length,
      mode: (after.mode & 0o777).toString(8).padStart(3, '0'),
      sha256: sha256(bytes),
    };
  } finally {
    await handle.close();
  }
}

function checksumSet(rows) {
  return sha256(Buffer.from(rows.map((row) =>
    `${row.sha256} ${row.bytes} ${row.mode} ${row.path}`
  ).join('\n')));
}

async function readJson(relativePath) {
  const bytes = await readFile(absolute(relativePath));
  return JSON.parse(bytes.toString('utf8'));
}

async function candidatePathAllowlist() {
  const predecessor = await readJson(PREDECESSOR_FREEZE_PATH);
  const rows = predecessor?.payload?.candidateCodeSet?.rows;
  invariant(Array.isArray(rows) && rows.length === 84,
    'predecessor freeze must contain the exact 84-file candidate allowlist');
  const paths = rows.map((row) => row.path);
  invariant(paths.every((entry) => typeof entry === 'string') &&
    new Set(paths).size === 84,
  'predecessor candidate allowlist is invalid or duplicated');
  return paths.sort((left, right) => left.localeCompare(right, 'en'));
}

async function gitIdentity(candidatePaths) {
  const [{stdout: head}, {stdout: status}] = await Promise.all([
    execFileAsync('/usr/bin/git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
    }),
    execFileAsync('/usr/bin/git', [
      'status', '--porcelain=v1', '--untracked-files=all', '--',
      ...candidatePaths,
    ], {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
    }),
  ]);
  const commit = head.trim();
  invariant(/^[a-f0-9]{40}$/u.test(commit), 'Git HEAD is invalid');
  return {
    headCommit: commit,
    candidateStatusUtf8Bytes: Buffer.byteLength(status),
    candidateStatusSha256: sha256(Buffer.from(status)),
    candidateStatusLines: status.trim() === ''
      ? []
      : status.trimEnd().split('\n'),
  };
}

async function absent(relativePath) {
  const entry = await lstat(absolute(relativePath)).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  invariant(entry === null, `${relativePath} must remain absent at freeze time`);
  return relativePath;
}

function controlExpectation(pathname) {
  if (pathname === V10_PLAN_PATH) return EXPECTED.v10PlanSha256;
  if (pathname.endsWith('regeneration-provenance.v1.json')) {
    return EXPECTED.regenerationProvenanceSha256;
  }
  if (pathname.endsWith('atomic-commit-build.v2.json')) {
    return EXPECTED.atomicBuildReceiptSha256;
  }
  if (pathname.endsWith('adaptive-canvas-production-bindings.generated.ts')) {
    return EXPECTED.inactiveBindingSha256;
  }
  if (pathname.endsWith('current-js-production-assets.v1.json')) {
    return EXPECTED.v1ProfileSha256;
  }
  if (pathname === PREDECESSOR_FREEZE_PATH) {
    return EXPECTED.predecessorFreezeSha256;
  }
  return null;
}

export async function buildFreezePayload() {
  const candidatePaths = await candidatePathAllowlist();
  const [candidateRows, controlRows, forbiddenAbsent, git, toolchain] =
    await Promise.all([
    Promise.all(candidatePaths.map(stableFile)),
    Promise.all(CONTROL_PATHS.map(stableFile)),
    Promise.all(FORBIDDEN_PRESENT_PATHS.map(absent)),
    gitIdentity(candidatePaths),
    collectChromiumToolchainIdentity({projectRoot}),
  ]);
  for (const row of controlRows) {
    const expected = controlExpectation(row.path);
    if (expected !== null) {
      invariant(row.sha256 === expected,
        `${row.path} differs from the reviewed control hash`);
    }
  }
  const planBinding = controlRows.find(({path: pathname}) =>
    pathname === V10_PLAN_PATH);
  const planDocument = await readJson(V10_PLAN_PATH);
  invariant(planReceiptBytes(planDocument).equals(
    await readFile(absolute(V10_PLAN_PATH))),
  'v10 plan bytes are not canonical');
  const generator = candidateRows.find(({path: pathname}) =>
    pathname === 'scripts/generate-adaptive-canvas-batch.mjs');
  const test = candidateRows.find(({path: pathname}) =>
    pathname === 'scripts/generate-adaptive-canvas-batch.test.mjs');
  invariant(generator && test, 'batch generator/test are missing from candidate set');
  invariant(canonicalJson(planDocument.payload.generator) === canonicalJson({
    path: generator.path,
    bytes: generator.bytes,
    sha256: generator.sha256,
  }), 'v10 plan no longer binds the current batch generator');
  return {
    status: 'frozen-before-real-browser-validation-v10',
    scope: {
      productionLessons: ['G3 L2', 'G4 L3', 'G5 L3', 'G5 L4', 'G5 L5'],
      pageRendererCount: 283,
      loadedHostCount: 1,
      placementCount: 284,
    },
    git,
    candidateSet: {
      count: candidateRows.length,
      totalBytes: candidateRows.reduce((sum, row) => sum + row.bytes, 0),
      checksumSetSha256: checksumSet(candidateRows),
      rows: candidateRows,
    },
    controls: {
      count: controlRows.length,
      totalBytes: controlRows.reduce((sum, row) => sum + row.bytes, 0),
      checksumSetSha256: checksumSet(controlRows),
      rows: controlRows,
      v10PlanPayloadSha256: planDocument.payloadSha256,
      v10Plan: planBinding,
      batchGenerator: generator,
      batchTest: test,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      osType: os.type(),
      osRelease: os.release(),
      osVersion: os.version(),
      toolchain,
    },
    absentProductionOutputs: forbiddenAbsent,
    boundaries: {
      browserStartedByFreeze: false,
      adaptiveBatchApplyRun: false,
      productionRendererWritten: false,
      v2ProfileWritten: false,
      activeBindingWritten: false,
      deploymentRun: false,
      applyAuthorization: false,
      ownerAcceptanceChanged: false,
      releaseEligibilityChanged: false,
    },
  };
}

export function freezeDocument(payload) {
  return {
    schemaVersion: 1,
    artifactType: 'adaptive-canvas-real-browser-validation-v10-freeze',
    contentSha256: sha256(Buffer.from(canonicalJson({
      schemaVersion: 1,
      artifactType: 'adaptive-canvas-real-browser-validation-v10-freeze',
      payload,
    }))),
    payload,
  };
}

export async function writeOrCheckFreeze({check}) {
  const document = freezeDocument(await buildFreezePayload());
  const bytes = jsonBytes(document);
  const destination = absolute(OUTPUT_PATH);
  if (check) {
    const current = await readFile(destination);
    invariant(current.equals(bytes), `${OUTPUT_PATH} is missing or stale`);
    return {operation: 'checked', document, bytes};
  }
  await writeFile(destination, bytes, {flag: 'wx', mode: 0o444});
  return {operation: 'created', document, bytes};
}

export function parseArguments(argv) {
  invariant(argv.length === 1 && ['--write', '--check'].includes(argv[0]),
    'usage: build-adaptive-canvas-real-browser-v10-freeze.mjs --write|--check');
  return {check: argv[0] === '--check'};
}

async function main() {
  const result = await writeOrCheckFreeze(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify({
    status: result.operation,
    path: OUTPUT_PATH,
    bytes: result.bytes.length,
    sha256: sha256(result.bytes),
    contentSha256: result.document.contentSha256,
    candidateCount: result.document.payload.candidateSet.count,
    controlCount: result.document.payload.controls.count,
  })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`real-browser-v10-freeze: ${error.message}\n`);
    process.exitCode = 1;
  });
}
