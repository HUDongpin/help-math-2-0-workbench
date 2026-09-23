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
const R3_ATTEMPT_IMPLEMENTATION = Object.freeze([
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r3.mjs',
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r3.test.mjs',
]);
const R4_IMPLEMENTATION = Object.freeze([
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r4.mjs',
  'scripts/build-development-epoch-currentness-successor-2026-08-08-r4.test.mjs',
]);
const OUTPUTS = Object.freeze([
  'reports/development-epoch-currentness-successor-2026-08-08-r4.json',
  'reports/development-epoch-currentness-successor-2026-08-08-r4.md',
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
    id: 'r3-development-epoch-attempt-retained-without-output',
    attribution: 'r3 source pair remains for audit only; no r3 receipt was emitted and r4 does not use it as a predecessor',
    expectedStatus: '??',
    paths: R3_ATTEMPT_IMPLEMENTATION,
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
      'scripts/darwin-atomic-directory-swap.test.mjs': '7d4860112d59d120d8e9e75dd4c5b237ff29ca6ea207632af2f35749f9eacb9c',
      'scripts/lib/darwin-atomic-directory-swap-native.c': '041db960d7c7b6150fc01cc821d04e3f19f5178b2fe8fc9f0ba8cd97571ef572',
      'scripts/lib/darwin-atomic-directory-swap.mjs': 'c094017d9ddbfc6a2480fa0b78b42826da9e0cd28bed31ee1a215c4641ff7a9a',
    }),
  }),
  Object.freeze({
    id: 'external-unattributed-fla-swf-counterpart-baseline',
    attribution: 'separately observed external FLA/SWF counterpart baseline workstream; no human author identity inferred',
    expectedStatus: '??',
    paths: Object.freeze([
      'catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline-complete.json',
      'catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json',
      'scripts/build-fla-swf-counterpart-successor-baseline.mjs',
      'scripts/build-fla-swf-counterpart-successor-baseline.test.mjs',
    ]),
    requiredSha256: Object.freeze({
      'catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline-complete.json': '77f2dd70a14cf9eb001137b077ee1c1329337c83ffdd37ca1e547c6c9567794c',
      'catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json': 'fef6741b8f48be96780e88d0e17c0b8abc0710b392821a56c258c7ec424d6fc4',
      'scripts/build-fla-swf-counterpart-successor-baseline.mjs': 'bf95dca90a24fc0ad07d3d14acaae8c912981b6e35c6d10ef1bb0f5686190f10',
      'scripts/build-fla-swf-counterpart-successor-baseline.test.mjs': '136d0449fa644840a8018ac8036f2bb77c32aad3061daca1e37652059ac65f15',
    }),
  }),
  Object.freeze({
    id: 'external-unattributed-fidelity-governance-amendment',
    attribution: 'separately observed project-instruction amendment for integer-scaled Canvas evidence; no human author identity inferred',
    expectedStatus: ' M',
    paths: Object.freeze([
      'AGENTS.md',
      'skills/flash-to-js/references/fidelity-validation.md',
    ]),
    requiredSha256: Object.freeze({
      'AGENTS.md': '33b0f45764e2e6faa3e0ee68091cd01c9c0310ca22e956647b4335f781f8c2b9',
      'skills/flash-to-js/references/fidelity-validation.md': '8db93da641c23db043994bd9ecaa1eb6e01853940eedf045b82db6898dfe5aab',
    }),
  }),
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  currentJavascriptEvidence: false,
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
  const status = new Map();
  for (const record of raw.toString('utf8').split('\0').filter(Boolean)) {
    const code = record.slice(0, 2);
    const relativePath = record.slice(3);
    invariant(code === ' M' || code === '??', `${relativePath}: unexpected or staged Git status ${JSON.stringify(code)}`);
    invariant(!status.has(relativePath), `${relativePath}: duplicate Git status record`);
    status.set(relativePath, code);
  }
  return status;
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
  invariant(paths.length === 19, 'continuation path count changed');
  return paths;
}

function renderMarkdown(report) {
  const external = report.continuationWorkstreams.filter(({id}) => id.startsWith('external-unattributed-'));
  return `# HELP Math development epoch currentness successor — 2026-08-08 r4\n\n`
    + `Status: **${report.status}**\n\n`
    + `r1 and r2 remain immutable historical receipts. r3 is retained only as an output-absent attempt and is not a predecessor. r4 extends the bounded epoch after two identical read-only Git-status/external-hash snapshots and no-open-file observations. No human author identity is asserted for external workstreams.\n\n`
    + `- r2 historical snapshot: ${report.r2HistoricalSnapshot.originalIntakeByteIdenticalCount}/71 original-intake bytes and ${report.r2HistoricalSnapshot.remediationByteIdenticalCount}/9 remediation bytes were retained at r2 issuance.\n`
    + `- r4 current status (excluding its own read-only output pair): ${report.git.currentDirtyEntryCount} entries — ${report.git.trackedModified} tracked modifications and ${report.git.untracked} untracked files.\n`
    + `- r3 attempt: ${report.r3Attempt.sourceBindings.length} retained source files; both r3 output paths were absent at r4 issuance and neither was rewritten or treated as evidence.\n`
    + `- External bounded workstreams: ${external.map(({id, bindings}) => `${id} (${bindings.length})`).join('; ')}.\n`
    + `- The governance amendment is recorded as an external worktree input only; r4 grants no rendering, original-runtime, audio, human, Owner, strict, release, or publication acceptance.\n\n`
    + `This successor creates no source mutation, reviewer authority, ledger rewrite, strict completion, release, or publication.\n`;
}

export async function buildDevelopmentEpochCurrentnessSuccessorR4() {
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
  invariant(outputPresence.every(Boolean) || outputPresence.every((value) => !value), 'r4 output pair is partially present');
  if (outputPresence.every(Boolean)) {
    for (const relativePath of OUTPUTS) {
      invariant(status.get(relativePath) === '??', `${relativePath}: r4 output is staged or modified`);
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
  const expectedPaths = new Set([...baselinePaths, ...continuationPaths, ...R4_IMPLEMENTATION]);
  invariant(expectedPaths.size === 186, 'r4 expected path membership changed');
  invariant(
    JSON.stringify([...status.keys()].sort()) === JSON.stringify([...expectedPaths].sort()),
    'current working-tree path set differs from r4 bounded continuation scope',
  );
  for (const relativePath of R4_IMPLEMENTATION) {
    invariant(status.get(relativePath) === '??', `${relativePath}: r4 implementation must remain untracked`);
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
  const r4ImplementationBindings = await Promise.all(R4_IMPLEMENTATION.map((relativePath) => bind(relativePath)));
  const r3AttemptBindings = continuationWorkstreams.find(({id}) => id === 'r3-development-epoch-attempt-retained-without-output')?.bindings;
  invariant(Array.isArray(r3AttemptBindings) && r3AttemptBindings.length === 2, 'r3 attempt binding missing');
  const trackedModified = [...status.values()].filter((value) => value === ' M').length;
  const untracked = [...status.values()].filter((value) => value === '??').length;
  invariant(trackedModified === 35 && untracked === 151, 'r4 current status count drifted');
  const head = git(['rev-parse', 'HEAD']).trim();
  invariant(head === r2.git.head, 'Git HEAD drifted from r2 epoch');
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'help-math-development-epoch-currentness-successor',
    issuedOn: '2026-08-08',
    revision: 'r4',
    status: 'r1-r2-historical-attribution-retained-r3-output-absent-r4-current-continuations-bounded',
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
    r3Attempt: Object.freeze({
      sourceBindings: r3AttemptBindings,
      outputPaths: OUTPUTS.map((relativePath) => relativePath.replace(/r4/u, 'r3')),
      outputsAbsentAtR4Issuance: true,
      usedAsPredecessor: false,
      disposition: 'retained-source-only-not-repaired-not-promoted',
    }),
    continuationWorkstreams,
    r4Implementation: Object.freeze({
      bindings: r4ImplementationBindings.map(({descriptor}) => descriptor),
      outputDisposition: 'new-read-only-no-clobber-successor-only',
    }),
    quiescenceObservation: Object.freeze({
      method: 'two-identical-read-only-git-status-and-external-hash-snapshots-plus-no-open-file-observation',
      externalFileCount: 9,
      externalFilesTouched: false,
      humanAuthorIdentityEstablished: false,
    }),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

export async function buildDevelopmentEpochCurrentnessArtifactsR4() {
  const report = await buildDevelopmentEpochCurrentnessSuccessorR4();
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
  invariant(json.equals(artifacts.json), 'r4 development-epoch JSON drifted');
  invariant(markdown.equals(artifacts.markdown), 'r4 development-epoch Markdown drifted');
  await Promise.all(OUTPUTS.map((relativePath) => bind(relativePath, {readOnly: true})));
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  const artifacts = await buildDevelopmentEpochCurrentnessArtifactsR4();
  if (mode === 'write') {
    await writeNoClobber(artifacts);
    process.stdout.write(`wrote ${OUTPUTS.join(' and ')}\n`);
    return;
  }
  if (mode === 'check') {
    await check(artifacts);
    process.stdout.write('development epoch currentness successor r4: PASS\n');
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
