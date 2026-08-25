#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  chmod,
  mkdir,
  open,
  realpath,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const BASELINE_PATH =
  'migrations/course-g04-l03-in-009/baseline/adobe-flash-player-32-standalone-default.json';
const RECEIPT_PATH =
  'work/gate0a/in009-root-baseline-evidence-canonicalization.v1.json';
const RECEIPT_TYPE =
  'gate0a-in009-root-baseline-evidence-canonicalization-v1';
const V9_PLAN = 'work/adaptive-canvas-production-five.plan.v9.json';
const V9_PLAN_SHA256 =
  '6ff98b7642c1d3dbb68058d889c0699749050d0cb198ae556d392a8b51bd7a75';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      canonical(value[key])
    ]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonical(value));
}

function documentBytes(document) {
  return Buffer.from(`${JSON.stringify(canonical(document), null, 2)}\n`);
}

function safePath(root, relativePath, label) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0,
    `${label}: path is required`);
  invariant(!path.isAbsolute(relativePath), `${label}: path must be relative`);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  invariant(resolved.startsWith(`${resolvedRoot}${path.sep}`),
    `${label}: path escapes its root`);
  return resolved;
}

async function stableOrdinaryFile(absolutePath, label) {
  const handle = await open(absolutePath, 'r');
  try {
    const before = await handle.stat({bigint: true});
    invariant(before.isFile(), `${label}: must be an ordinary file`);
    invariant(before.nlink === 1n, `${label}: must have exactly one hard link`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    for (const field of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'mode']) {
      invariant(before[field] === after[field], `${label}: changed while read`);
    }
    invariant(BigInt(bytes.length) === after.size, `${label}: size changed`);
    return {
      bytes,
      identity: {
        bytes: bytes.length,
        mode: `0${Number(after.mode & 0o777n).toString(8)}`,
        sha256: sha256(bytes)
      }
    };
  } finally {
    await handle.close();
  }
}

async function createExclusive(absolutePath, bytes) {
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, bytes, {flag: 'wx', mode: 0o444});
  await chmod(absolutePath, 0o444);
}

function parseArguments(argv) {
  const options = {check: false, sourceWorktreeRoot: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') options.check = true;
    else if (argument === '--source-worktree-root') {
      const value = argv[index + 1];
      invariant(value && !value.startsWith('--'),
        '--source-worktree-root requires a path');
      options.sourceWorktreeRoot = value;
      index += 1;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  invariant(options.sourceWorktreeRoot &&
    path.isAbsolute(options.sourceWorktreeRoot),
  '--source-worktree-root must be an explicit absolute path');
  return options;
}

export async function canonicalizeIn009RootBaselineEvidence({
  projectRoot = ROOT,
  sourceWorktreeRoot,
  check = false
} = {}) {
  invariant(typeof sourceWorktreeRoot === 'string' &&
    path.isAbsolute(sourceWorktreeRoot),
  'sourceWorktreeRoot must be an explicit absolute path');
  const root = path.resolve(projectRoot);
  const sourceRoot = path.resolve(sourceWorktreeRoot);
  invariant(sourceRoot !== root,
    'source worktree root must differ from the isolated target worktree');
  invariant(await realpath(sourceRoot) === sourceRoot,
    'source worktree root may not be a symlink or path alias');
  const [baselineFile, planFile, generatorFile] = await Promise.all([
    stableOrdinaryFile(safePath(root, BASELINE_PATH, 'baseline'), 'baseline'),
    stableOrdinaryFile(safePath(root, V9_PLAN, 'v9 plan'), 'v9 plan'),
    stableOrdinaryFile(SCRIPT_PATH, 'canonicalization generator')
  ]);
  invariant(planFile.identity.sha256 === V9_PLAN_SHA256,
    'frozen v9 plan changed');
  const baseline = JSON.parse(baselineFile.bytes);
  invariant(
    baseline?.source?.swfSha256 ===
      '766b6ab686bbaf8ab1dacc30a7ffb96f33735102a1dff7df6b7a97976e3ab25c' &&
      baseline?.capture?.archiveDirectory ===
        'artifacts/full-frame/pilot-baselines/course-g04-l03-in-009/adobe-flash-player-32-standalone-default' &&
      Array.isArray(baseline.frames) && baseline.frames.length === 10,
    'IN009 root baseline identity changed'
  );
  const records = [];
  let createdCount = 0;
  for (const [index, frame] of baseline.frames.entries()) {
    invariant(
      frame.frame === index + 1 &&
        frame.file === `frame-${String(index + 1).padStart(4, '0')}.png` &&
        Number.isSafeInteger(frame.bytes) && frame.bytes > 0 &&
        /^[a-f0-9]{64}$/.test(frame.sha256),
      `baseline frame ${index + 1}: identity changed`
    );
    const relativePath = path.posix.join(
      baseline.capture.archiveDirectory,
      frame.file
    );
    const source = await stableOrdinaryFile(
      safePath(sourceRoot, relativePath, `source frame ${frame.frame}`),
      `source frame ${frame.frame}`
    );
    invariant(source.identity.bytes === frame.bytes &&
      source.identity.sha256 === frame.sha256,
    `source frame ${frame.frame}: baseline binding mismatch`);
    const destinationPath = safePath(
      root,
      relativePath,
      `destination frame ${frame.frame}`
    );
    let destination;
    try {
      destination = await stableOrdinaryFile(
        destinationPath,
        `destination frame ${frame.frame}`
      );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      invariant(!check,
        `destination frame ${frame.frame}: absent in --check mode`);
      await createExclusive(destinationPath, source.bytes);
      createdCount += 1;
      destination = await stableOrdinaryFile(
        destinationPath,
        `installed frame ${frame.frame}`
      );
    }
    invariant(destination.identity.bytes === frame.bytes &&
      destination.identity.sha256 === frame.sha256,
    `destination frame ${frame.frame}: baseline binding mismatch`);
    records.push({
      frame: frame.frame,
      path: relativePath,
      source: {root: sourceRoot, ...source.identity},
      destination: {root, ...destination.identity},
      installationContract: 'create-exclusive-or-existing-identical'
    });
  }
  const payload = {
    status: 'pass',
    authority: 'gate0a-supporting-evidence-canonicalization-only',
    boundary: {
      browserStarted: false,
      applyExecuted: false,
      productionRendererModified: false,
      v2ProfileModified: false,
      activeBindingModified: false,
      deploymentModified: false,
      applySentinelModified: false,
      acceptanceChanged: false
    },
    v9Plan: {path: V9_PLAN, ...planFile.identity},
    generator: {
      path: path.posix.relative(root, SCRIPT_PATH),
      ...generatorFile.identity
    },
    baseline: {path: BASELINE_PATH, ...baselineFile.identity},
    sourceWorktreeRoot: sourceRoot,
    targetWorktreeRoot: root,
    recordCount: records.length,
    records
  };
  const document = {
    schemaVersion: 1,
    receiptType: RECEIPT_TYPE,
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload
  };
  const bytes = documentBytes(document);
  const receiptPath = safePath(root, RECEIPT_PATH, 'receipt');
  if (check) {
    const existing = await stableOrdinaryFile(receiptPath, 'existing receipt');
    invariant(existing.bytes.equals(bytes), 'existing receipt is stale');
  } else {
    await createExclusive(receiptPath, bytes);
  }
  return {
    receiptPath: RECEIPT_PATH,
    receiptBytes: bytes.length,
    receiptSha256: sha256(bytes),
    payloadSha256: document.payloadSha256,
    recordCount: records.length,
    createdCount,
    browserStarted: false,
    applyExecuted: false
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  console.log(JSON.stringify(await canonicalizeIn009RootBaselineEvidence({
    sourceWorktreeRoot: options.sourceWorktreeRoot,
    check: options.check
  }), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
