#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstat, readFile, writeFile, chmod} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const PREDECESSOR = Object.freeze({
  json: Object.freeze({
    path: 'reports/development-epoch-closure-2026-08-07-r1.json',
    bytes: 27247,
    sha256: '7e6a97a06887d526de62e9e33da0343ab6554de58131520948d5d9eab4464601',
  }),
  markdown: Object.freeze({
    path: 'reports/development-epoch-closure-2026-08-07-r1.md',
    bytes: 2055,
    sha256: '2879d092245d128bed180ea0855a3cc0428090cf96132adda4d9cca7fd7d000e',
  }),
});

const IMPLEMENTATION_PATHS = Object.freeze([
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r2.mjs',
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r2.test.mjs',
]);

const OUTPUT_PATHS = Object.freeze([
  'reports/development-epoch-currentness-successor-2026-08-08-r2.json',
  'reports/development-epoch-currentness-successor-2026-08-08-r2.md',
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  audioAcceptance: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictCompletion: false,
  lessonPublication: false,
  publicLibraryVisibility: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(relativePath) {
  invariant(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath),
    'expected a non-empty project-relative path',
  );
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(
    resolved.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${relativePath}: path escapes project root`,
  );
  return resolved;
}

function git(args, encoding = 'utf8') {
  return execFileSync('/usr/bin/git', args, {
    cwd: PROJECT_ROOT,
    encoding,
    maxBuffer: 32 * 1024 * 1024,
  });
}

function readStatus() {
  const raw = git(['status', '--porcelain=v1', '-z'], 'buffer');
  const records = raw.toString('utf8').split('\0').filter(Boolean);
  const result = new Map();
  for (const record of records) {
    const status = record.slice(0, 2);
    const relativePath = record.slice(3);
    invariant(
      status === ' M' || status === '??',
      `${relativePath}: unsupported or staged Git status ${JSON.stringify(status)}`,
    );
    invariant(!result.has(relativePath), `${relativePath}: duplicate porcelain record`);
    result.set(relativePath, status);
  }
  return result;
}

async function bind(relativePath, {requireReadOnly = false} = {}) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${relativePath}: expected a single-link ordinary file`,
  );
  if (requireReadOnly) {
    invariant((before.mode & 0o222) === 0, `${relativePath}: expected read-only evidence`);
  }
  const bytes = await readFile(target);
  const after = await lstat(target);
  invariant(
    before.dev === after.dev
      && before.ino === after.ino
      && before.size === after.size
      && before.mode === after.mode,
    `${relativePath}: changed while being read`,
  );
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: `0${(before.mode & 0o777).toString(8).padStart(3, '0')}`,
  });
}

async function readPredecessor() {
  const [jsonBinding, markdownBinding] = await Promise.all([
    bind(PREDECESSOR.json.path, {requireReadOnly: true}),
    bind(PREDECESSOR.markdown.path, {requireReadOnly: true}),
  ]);
  invariant(
    jsonBinding.bytes === PREDECESSOR.json.bytes
      && jsonBinding.sha256 === PREDECESSOR.json.sha256,
    'r1 JSON predecessor identity drifted',
  );
  invariant(
    markdownBinding.bytes === PREDECESSOR.markdown.bytes
      && markdownBinding.sha256 === PREDECESSOR.markdown.sha256,
    'r1 Markdown predecessor identity drifted',
  );
  const report = JSON.parse(await readFile(absolute(PREDECESSOR.json.path), 'utf8'));
  invariant(
    report?.artifactType === 'help-math-development-epoch-attribution-and-retention-closure'
      && report?.git?.originalEntryCount === 71
      && Array.isArray(report?.originalBindings)
      && report.originalBindings.length === 71
      && Array.isArray(report?.closureImplementation?.bindings)
      && report.closureImplementation.bindings.length === 9,
    'r1 predecessor schema or retained intake scope drifted',
  );
  return Object.freeze({
    report,
    descriptors: Object.freeze({json: jsonBinding, markdown: markdownBinding}),
  });
}

async function compareFrozenBindings(bindings, status) {
  const result = [];
  for (const predecessor of bindings) {
    invariant(
      typeof predecessor?.path === 'string'
        && typeof predecessor?.bytes === 'number'
        && typeof predecessor?.sha256 === 'string',
      'predecessor binding is malformed',
    );
    const currentStatus = status.get(predecessor.path);
    invariant(currentStatus === ' M' || currentStatus === '??', `${predecessor.path}: left the dirty epoch`);
    const current = await bind(predecessor.path);
    result.push(Object.freeze({
      path: predecessor.path,
      status: currentStatus,
      predecessor: Object.freeze({bytes: predecessor.bytes, sha256: predecessor.sha256}),
      current,
      byteIdenticalToR1: current.bytes === predecessor.bytes && current.sha256 === predecessor.sha256,
    }));
  }
  return result;
}

function partitionCurrentness(bindings) {
  const unchanged = bindings.filter((binding) => binding.byteIdenticalToR1);
  const drifted = bindings.filter((binding) => !binding.byteIdenticalToR1);
  return Object.freeze({
    retainedByteIdenticalCount: unchanged.length,
    driftedCount: drifted.length,
    drifted,
  });
}

function statusCounts(status) {
  return Object.freeze({
    trackedModified: [...status.values()].filter((value) => value === ' M').length,
    untracked: [...status.values()].filter((value) => value === '??').length,
  });
}

function renderMarkdown(report) {
  const originalDrifts = report.r1OriginalIntake.currentness.drifted
    .map((binding) => `\`${binding.path}\``)
    .join(', ');
  const remediationDrifts = report.r1Remediation.currentness.drifted
    .map((binding) => `\`${binding.path}\``)
    .join(', ');
  return `# HELP Math development epoch currentness successor — 2026-08-08 r2\n\n`
    + `Status: **${report.status}**\n\n`
    + `The r1 closure remains an immutable, hash-pinned predecessor. Its original 71-entry attribution remains retained as historical workstream lineage, but it is no longer a current full-worktree closure.\n\n`
    + `- Original r1 intake: ${report.r1OriginalIntake.currentness.retainedByteIdenticalCount}/71 byte-identical; ${report.r1OriginalIntake.currentness.driftedCount} drifted: ${originalDrifts}.\n`
    + `- r1 test-remediation/binding scope: ${report.r1Remediation.currentness.retainedByteIdenticalCount}/9 byte-identical; ${report.r1Remediation.currentness.driftedCount} drifted: ${remediationDrifts}.\n`
    + `- The current dirty tree includes ${report.postR1UnattributedWorktree.entryCount} post-r1 entries not attributed by this successor. They are retained as exact snapshot descriptors, not assigned to a person or silently absorbed into r1.\n\n`
    + `This successor preserves the original 71-entry workstream attribution and all immutable predecessors. It does not rewrite a ledger, retry the closed v7/v8 search, grant private-preview/public access, or confer original-runtime, audio, human, Owner, strict-completion, release, or publication acceptance.\n`;
}

export async function buildDevelopmentEpochCurrentnessSuccessorR2() {
  const predecessor = await readPredecessor();
  const status = readStatus();
  const outputPresence = OUTPUT_PATHS.map((relativePath) => status.has(relativePath));
  invariant(
    outputPresence.every(Boolean) || outputPresence.every((value) => !value),
    'r2 output pair is partially present',
  );
  if (outputPresence.every(Boolean)) {
    for (const relativePath of OUTPUT_PATHS) {
      invariant(status.get(relativePath) === '??', `${relativePath}: output is staged or modified`);
      await bind(relativePath, {requireReadOnly: true});
      status.delete(relativePath);
    }
  }

  const originalPaths = new Set(predecessor.report.originalBindings.map(({path: relativePath}) => relativePath));
  const remediationPaths = new Set(
    predecessor.report.closureImplementation.bindings.map(({path: relativePath}) => relativePath),
  );
  const predecessorPaths = new Set([PREDECESSOR.json.path, PREDECESSOR.markdown.path]);
  for (const relativePath of [...originalPaths, ...remediationPaths, ...predecessorPaths]) {
    invariant(status.has(relativePath), `${relativePath}: r1 epoch path is absent from current status`);
  }
  for (const relativePath of IMPLEMENTATION_PATHS) {
    invariant(status.get(relativePath) === '??', `${relativePath}: r2 implementation must remain untracked`);
  }

  const [originalBindings, remediationBindings, implementationBindings] = await Promise.all([
    compareFrozenBindings(predecessor.report.originalBindings, status),
    compareFrozenBindings(predecessor.report.closureImplementation.bindings, status),
    Promise.all(IMPLEMENTATION_PATHS.map((relativePath) => bind(relativePath))),
  ]);
  const originalCurrentness = partitionCurrentness(originalBindings);
  const remediationCurrentness = partitionCurrentness(remediationBindings);
  invariant(
    originalCurrentness.retainedByteIdenticalCount === 69 && originalCurrentness.driftedCount === 2,
    'r1 original intake currentness changed; issue a new successor',
  );
  invariant(
    remediationCurrentness.retainedByteIdenticalCount === 6 && remediationCurrentness.driftedCount === 3,
    'r1 remediation currentness changed; issue a new successor',
  );

  const excludedPaths = new Set([
    ...originalPaths,
    ...remediationPaths,
    ...predecessorPaths,
    ...IMPLEMENTATION_PATHS,
  ]);
  const postR1Entries = [...status.entries()]
    .filter(([relativePath]) => !excludedPaths.has(relativePath))
    .map(([relativePath, gitStatus]) => ({relativePath, gitStatus}))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const postR1Bindings = [];
  for (const {relativePath, gitStatus} of postR1Entries) {
    postR1Bindings.push(Object.freeze({
      status: gitStatus,
      descriptor: await bind(relativePath),
    }));
  }
  invariant(postR1Bindings.length === 79, 'post-r1 worktree membership changed; issue a new successor');

  const head = git(['rev-parse', 'HEAD']).trim();
  invariant(head === predecessor.report.git.head, 'Git HEAD drifted from the r1 epoch');
  const counts = statusCounts(status);
  invariant(
    counts.trackedModified === 30 && counts.untracked === 133,
    'current r2 epoch status count changed; issue a new successor',
  );

  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'help-math-development-epoch-currentness-successor',
    issuedOn: '2026-08-08',
    revision: 'r2',
    status: 'r1-attribution-retained-current-tree-expanded-five-bound-drift-sites-no-global-currentness-claim',
    git: Object.freeze({
      head,
      branch: predecessor.report.git.branch,
      currentDirtyEntryCount: counts.trackedModified + counts.untracked,
      ...counts,
      stagedEntryCount: 0,
    }),
    immutablePredecessor: Object.freeze({
      descriptors: predecessor.descriptors,
      rewritten: false,
      originalAttributionStillHistorical: true,
      humanAuthorIdentityEstablished: false,
    }),
    r1OriginalIntake: Object.freeze({
      entryCount: originalBindings.length,
      currentness: originalCurrentness,
      disposition: 'retain-r1-historical-workstream-attribution-no-current-full-tree-closure-claim',
    }),
    r1Remediation: Object.freeze({
      entryCount: remediationBindings.length,
      currentness: remediationCurrentness,
      disposition: 'retain-r1-remediation-history-no-claim-that-repaired-bytes-remain-current',
    }),
    r2Implementation: Object.freeze({
      bindings: implementationBindings,
      outputDisposition: 'new-read-only-no-clobber-successor-only',
    }),
    postR1UnattributedWorktree: Object.freeze({
      entryCount: postR1Bindings.length,
      attributionMethod: 'exact-current-path-byte-and-status-snapshot-only',
      humanAuthorIdentityEstablished: false,
      disposition: 'retain-untouched-outside-r1-and-r2-epoch-scope',
      bindings: postR1Bindings,
    }),
    closedBoundaries: Object.freeze({
      repeatV7V8LedgerSearchAuthorized: false,
      missingMp3Count: 16,
      missingKeyTermRuntimePathCount: 317,
      polynomialSwfUnresolved: true,
      privatePreviewIsNotPublicPublication: true,
      strictLedgerRewriteAuthorized: false,
    }),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

export async function buildDevelopmentEpochCurrentnessArtifactsR2() {
  const report = await buildDevelopmentEpochCurrentnessSuccessorR2();
  return Object.freeze({
    report,
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderMarkdown(report)),
  });
}

export function parseArguments(argv) {
  invariant(argv.length === 1, 'exactly one mode is required');
  if (argv[0] === '--write-no-clobber') return Object.freeze({mode: 'write'});
  if (argv[0] === '--check') return Object.freeze({mode: 'check'});
  if (argv[0] === '--json') return Object.freeze({mode: 'json'});
  throw new Error(`unknown option: ${argv[0]}`);
}

async function assertOutputPairAbsent() {
  for (const relativePath of OUTPUT_PATHS) {
    try {
      await lstat(absolute(relativePath));
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    throw new Error(`${relativePath}: successor output already exists; never overwrite immutable evidence`);
  }
}

async function writeNoClobber(artifacts) {
  await assertOutputPairAbsent();
  await writeFile(absolute(OUTPUT_PATHS[0]), artifacts.json, {flag: 'wx', mode: 0o444});
  await chmod(absolute(OUTPUT_PATHS[0]), 0o444);
  await writeFile(absolute(OUTPUT_PATHS[1]), artifacts.markdown, {flag: 'wx', mode: 0o444});
  await chmod(absolute(OUTPUT_PATHS[1]), 0o444);
}

async function check(artifacts) {
  const [json, markdown] = await Promise.all([
    readFile(absolute(OUTPUT_PATHS[0])),
    readFile(absolute(OUTPUT_PATHS[1])),
  ]);
  invariant(json.equals(artifacts.json), 'r2 epoch successor JSON drifted');
  invariant(markdown.equals(artifacts.markdown), 'r2 epoch successor Markdown drifted');
  await Promise.all(OUTPUT_PATHS.map((relativePath) => bind(relativePath, {requireReadOnly: true})));
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  const artifacts = await buildDevelopmentEpochCurrentnessArtifactsR2();
  if (mode === 'write') {
    await writeNoClobber(artifacts);
    process.stdout.write(`wrote ${OUTPUT_PATHS.join(' and ')}\n`);
    return;
  }
  if (mode === 'check') {
    await check(artifacts);
    process.stdout.write('development epoch currentness successor r2: PASS\n');
    return;
  }
  process.stdout.write(artifacts.json);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
