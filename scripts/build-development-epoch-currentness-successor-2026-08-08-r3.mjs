#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chmod, lstat, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const R2_OUTPUTS = Object.freeze([
  'reports/development-epoch-currentness-successor-2026-08-08-r2.json',
  'reports/development-epoch-currentness-successor-2026-08-08-r2.md',
]);
const R3_IMPLEMENTATION = Object.freeze([
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r3.mjs',
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r3.test.mjs',
]);
const OUTPUTS = Object.freeze([
  'reports/development-epoch-currentness-successor-2026-08-08-r3.json',
  'reports/development-epoch-currentness-successor-2026-08-08-r3.md',
]);

const CONTINUATION_WORKSTREAMS = Object.freeze([
  Object.freeze({
    id: 'g4-g5-private-preview-rendering-correction',
    attribution: 'r3 successor corrects the rendered r6 frame-count field while retaining r2 evidence byte-for-byte',
    expectedStatus: '??',
    paths: Object.freeze([
      'scripts/build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.mjs',
      'scripts/build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.test.mjs',
      'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.json',
      'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.md',
    ]),
  }),
  Object.freeze({
    id: 'g4-g5-strict-acceptance-handoff',
    attribution: 'read-only strict-acceptance handoff that separates current-JS evidence from original-runtime and human/Owner gates',
    expectedStatus: '??',
    paths: Object.freeze([
      'scripts/build-g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.mjs',
      'scripts/build-g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.test.mjs',
      'reports/g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.json',
      'reports/g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.md',
    ]),
  }),
  Object.freeze({
    id: 'external-unattributed-darwin-atomic-directory-swap',
    attribution: 'separately observed external atomic-directory-swap regular-file extension; no human author identity inferred',
    expectedStatus: ' M',
    paths: Object.freeze([
      'scripts/darwin-atomic-directory-swap.test.mjs',
      'scripts/lib/darwin-atomic-directory-swap-native.c',
      'scripts/lib/darwin-atomic-directory-swap.mjs',
    ]),
    requiredSha256: Object.freeze({
      'scripts/darwin-atomic-directory-swap.test.mjs': '3d802a5a80ab75bc1304b4fb7b8af351e43dbe3308fcf4a013f450946d3d8b0c',
      'scripts/lib/darwin-atomic-directory-swap-native.c': 'a491bb1dce35294655f7abad50df5e4f5369d87cbb3e2589a5d1128519be0704',
      'scripts/lib/darwin-atomic-directory-swap.mjs': '4005d2316dcad1fa3e401f4339d2259d7e0b6d59a3be85884b8846a49affcf2d',
    }),
  }),
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  originalRuntimeEvidence: false,
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
  invariant(typeof relativePath === 'string' && relativePath && !path.isAbsolute(relativePath), 'project-relative path required');
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  invariant(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `${relativePath}: path escapes project root`);
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
  const map = new Map();
  for (const record of raw.toString('utf8').split('\0').filter(Boolean)) {
    const status = record.slice(0, 2);
    const relativePath = record.slice(3);
    invariant(status === ' M' || status === '??', `${relativePath}: unexpected or staged Git status ${JSON.stringify(status)}`);
    invariant(!map.has(relativePath), `${relativePath}: duplicate Git status record`);
    map.set(relativePath, status);
  }
  return map;
}

async function bind(relativePath, {readOnly = false, parseJson = false} = {}) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1, `${relativePath}: expected a single-link ordinary file`);
  if (readOnly) invariant((before.mode & 0o222) === 0, `${relativePath}: expected read-only evidence`);
  const bytes = await readFile(target);
  const after = await lstat(target);
  invariant(
    before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mode === after.mode,
    `${relativePath}: changed while being read`,
  );
  return Object.freeze({
    descriptor: Object.freeze({path: relativePath, bytes: bytes.length, sha256: sha256(bytes)}),
    value: parseJson ? JSON.parse(bytes.toString('utf8')) : undefined,
  });
}

function flattenContinuationPaths() {
  const paths = CONTINUATION_WORKSTREAMS.flatMap(({paths: workstreamPaths}) => workstreamPaths);
  invariant(new Set(paths).size === paths.length, 'continuation workstreams overlap');
  invariant(paths.length === 11, 'continuation path count changed');
  return paths;
}

function renderMarkdown(report) {
  const external = report.continuationWorkstreams.find(({id}) => id === 'external-unattributed-darwin-atomic-directory-swap');
  return `# HELP Math development epoch currentness successor — 2026-08-08 r3\n\n`
    + `Status: **${report.status}**\n\n`
    + `r1 and r2 remain immutable historical receipts. r3 extends the bounded epoch only after two identical read-only status/hash snapshots and a no-open-file observation for the three external atomic-swap files. No human author identity is asserted.\n\n`
    + `- r2 historical snapshot: ${report.r2HistoricalSnapshot.originalIntakeByteIdenticalCount}/71 original-intake bytes and ${report.r2HistoricalSnapshot.remediationByteIdenticalCount}/9 remediation bytes were retained at r2 issuance; r2's later whole-tree check is intentionally superseded by this r3 scope.\n`
    + `- r3 current status (excluding its own read-only output pair): ${report.git.currentDirtyEntryCount} entries — ${report.git.trackedModified} tracked modifications and ${report.git.untracked} untracked files.\n`
    + `- Post-r2 continuation: 8 bounded private-preview/strict-handoff files and 3 external-unattributed atomic-swap files. The external trio remains retained, exact-hash-bound, and untouched.\n`
    + `- External workstream: ${external.bindings.map(({path: relativePath}) => `\`${relativePath}\``).join(', ')}.\n\n`
    + `This successor creates no source mutation, review authority, original-runtime evidence, audio acceptance, human/Owner decision, strict completion, ledger rewrite, release, or publication.\n`;
}

export async function buildDevelopmentEpochCurrentnessSuccessorR3() {
  const r2Json = await bind(R2_OUTPUTS[0], {readOnly: true, parseJson: true});
  const r2Markdown = await bind(R2_OUTPUTS[1], {readOnly: true});
  const r2 = r2Json.value;
  invariant(
    r2?.artifactType === 'help-math-development-epoch-currentness-successor'
      && r2?.revision === 'r2'
      && r2?.r1OriginalIntake?.entryCount === 71
      && r2?.r1OriginalIntake?.currentness?.retainedByteIdenticalCount === 69
      && r2?.r1OriginalIntake?.currentness?.driftedCount === 2
      && r2?.r1Remediation?.entryCount === 9
      && r2?.r1Remediation?.currentness?.retainedByteIdenticalCount === 6
      && r2?.r1Remediation?.currentness?.driftedCount === 3
      && r2?.postR1UnattributedWorktree?.entryCount === 79
      && Array.isArray(r2?.postR1UnattributedWorktree?.bindings)
      && Array.isArray(r2?.r2Implementation?.bindings),
    'r2 development-epoch predecessor boundary drifted',
  );
  const r1JsonPath = r2.immutablePredecessor?.descriptors?.json?.path;
  const r1MarkdownPath = r2.immutablePredecessor?.descriptors?.markdown?.path;
  invariant(typeof r1JsonPath === 'string' && typeof r1MarkdownPath === 'string', 'r2 r1 predecessor descriptors are malformed');
  const r1 = (await bind(r1JsonPath, {readOnly: true, parseJson: true})).value;
  invariant(
    r1?.git?.originalEntryCount === 71
      && Array.isArray(r1?.originalBindings)
      && r1.originalBindings.length === 71
      && Array.isArray(r1?.closureImplementation?.bindings)
      && r1.closureImplementation.bindings.length === 9,
    'r1 predecessor scope drifted',
  );

  const status = readStatus();
  const outputPresence = OUTPUTS.map((relativePath) => status.has(relativePath));
  invariant(outputPresence.every(Boolean) || outputPresence.every((value) => !value), 'r3 output pair is partially present');
  if (outputPresence.every(Boolean)) {
    for (const relativePath of OUTPUTS) {
      invariant(status.get(relativePath) === '??', `${relativePath}: r3 output is staged or modified`);
      await bind(relativePath, {readOnly: true});
      status.delete(relativePath);
    }
  }

  const baselinePaths = new Set([
    ...r1.originalBindings.map(({path: relativePath}) => relativePath),
    ...r1.closureImplementation.bindings.map(({path: relativePath}) => relativePath),
    r1JsonPath,
    r1MarkdownPath,
    ...r2.r2Implementation.bindings.map(({path: relativePath}) => relativePath),
    ...R2_OUTPUTS,
    ...r2.postR1UnattributedWorktree.bindings.map(({descriptor}) => descriptor.path),
  ]);
  invariant(baselinePaths.size === 165, 'r2 frozen path membership changed');
  const continuationPaths = flattenContinuationPaths();
  const expectedPaths = new Set([...baselinePaths, ...continuationPaths, ...R3_IMPLEMENTATION]);
  invariant(expectedPaths.size === 178, 'r3 expected path membership changed');
  invariant(
    JSON.stringify([...status.keys()].sort()) === JSON.stringify([...expectedPaths].sort()),
    'current working-tree path set differs from r3 bounded continuation scope',
  );
  for (const relativePath of R3_IMPLEMENTATION) {
    invariant(status.get(relativePath) === '??', `${relativePath}: r3 implementation must remain untracked`);
  }
  const continuationWorkstreams = [];
  for (const workstream of CONTINUATION_WORKSTREAMS) {
    const bindings = [];
    for (const relativePath of workstream.paths) {
      invariant(status.get(relativePath) === workstream.expectedStatus, `${relativePath}: continuation status drifted`);
      const binding = await bind(relativePath);
      const requiredSha256 = workstream.requiredSha256?.[relativePath];
      if (requiredSha256) invariant(binding.descriptor.sha256 === requiredSha256, `${relativePath}: external snapshot hash drifted`);
      bindings.push(binding.descriptor);
    }
    continuationWorkstreams.push(Object.freeze({
      id: workstream.id,
      attribution: workstream.attribution,
      humanAuthorIdentityEstablished: false,
      bindings,
    }));
  }
  const implementationBindings = await Promise.all(R3_IMPLEMENTATION.map((relativePath) => bind(relativePath)));
  const trackedModified = [...status.values()].filter((value) => value === ' M').length;
  const untracked = [...status.values()].filter((value) => value === '??').length;
  invariant(trackedModified === 33 && untracked === 145, 'r3 current status count drifted');
  const head = git(['rev-parse', 'HEAD']).trim();
  invariant(head === r2.git.head, 'Git HEAD drifted from r2 epoch');
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'help-math-development-epoch-currentness-successor',
    issuedOn: '2026-08-08',
    revision: 'r3',
    status: 'r1-r2-historical-attribution-retained-r3-continuation-bounded-external-workstream-unattributed',
    git: Object.freeze({
      head,
      branch: r2.git.branch,
      currentDirtyEntryCount: trackedModified + untracked,
      trackedModified,
      untracked,
      stagedEntryCount: 0,
    }),
    r2Predecessor: Object.freeze({
      json: r2Json.descriptor,
      markdown: r2Markdown.descriptor,
      retainedByteForByte: true,
      rewritten: false,
    }),
    r2HistoricalSnapshot: Object.freeze({
      originalIntakeEntryCount: r2.r1OriginalIntake.entryCount,
      originalIntakeByteIdenticalCount: r2.r1OriginalIntake.currentness.retainedByteIdenticalCount,
      originalIntakeDriftedCount: r2.r1OriginalIntake.currentness.driftedCount,
      remediationEntryCount: r2.r1Remediation.entryCount,
      remediationByteIdenticalCount: r2.r1Remediation.currentness.retainedByteIdenticalCount,
      remediationDriftedCount: r2.r1Remediation.currentness.driftedCount,
      postR1UnattributedEntryCount: r2.postR1UnattributedWorktree.entryCount,
      historicalOnly: true,
    }),
    continuationWorkstreams,
    r3Implementation: Object.freeze({
      bindings: implementationBindings.map(({descriptor}) => descriptor),
      outputDisposition: 'new-read-only-no-clobber-successor-only',
    }),
    quiescenceObservation: Object.freeze({
      method: 'two-identical-read-only-git-status-and-external-hash-snapshots-plus-no-open-file-observation',
      externalFileCount: 3,
      externalFilesTouched: false,
      humanAuthorIdentityEstablished: false,
    }),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

export async function buildDevelopmentEpochCurrentnessArtifactsR3() {
  const report = await buildDevelopmentEpochCurrentnessSuccessorR3();
  return Object.freeze({report, json: Buffer.from(stableJson(report)), markdown: Buffer.from(renderMarkdown(report))});
}

export function parseArguments(argv) {
  invariant(argv.length === 1, 'exactly one mode is required');
  if (argv[0] === '--write-no-clobber') return Object.freeze({mode: 'write'});
  if (argv[0] === '--check') return Object.freeze({mode: 'check'});
  if (argv[0] === '--json') return Object.freeze({mode: 'json'});
  throw new Error(`unknown option: ${argv[0]}`);
}

async function assertOutputsAbsent() {
  for (const relativePath of OUTPUTS) {
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
  await assertOutputsAbsent();
  await writeFile(absolute(OUTPUTS[0]), artifacts.json, {flag: 'wx', mode: 0o444});
  await chmod(absolute(OUTPUTS[0]), 0o444);
  await writeFile(absolute(OUTPUTS[1]), artifacts.markdown, {flag: 'wx', mode: 0o444});
  await chmod(absolute(OUTPUTS[1]), 0o444);
}

async function check(artifacts) {
  const [json, markdown] = await Promise.all([
    readFile(absolute(OUTPUTS[0])),
    readFile(absolute(OUTPUTS[1])),
  ]);
  invariant(json.equals(artifacts.json), 'r3 development-epoch JSON drifted');
  invariant(markdown.equals(artifacts.markdown), 'r3 development-epoch Markdown drifted');
  await Promise.all(OUTPUTS.map((relativePath) => bind(relativePath, {readOnly: true})));
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  const artifacts = await buildDevelopmentEpochCurrentnessArtifactsR3();
  if (mode === 'write') {
    await writeNoClobber(artifacts);
    process.stdout.write(`wrote ${OUTPUTS.join(' and ')}\n`);
    return;
  }
  if (mode === 'check') {
    await check(artifacts);
    process.stdout.write('development epoch currentness successor r3: PASS\n');
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
