#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

export const EPOCH_CLOSURE = Object.freeze({
  head: '42e7f80ce70aaa3819af2f7158e15f5da5470cce',
  jsonPath: 'reports/development-epoch-closure-2026-08-07-r1.json',
  markdownPath: 'reports/development-epoch-closure-2026-08-07-r1.md',
});

const CLUSTERS = Object.freeze([
  Object.freeze({
    id: 'whole-lesson-current-js-product',
    attribution:
      'current-JavaScript whole-lesson playback completion, narration controls, responsive shell, descriptors, QA, and package projection',
    retention:
      'retain-active-product-epoch-requires-green-regression-and-no-acceptance-promotion',
    paths: Object.freeze([
      'apps/web/app/globals.css',
      'apps/web/components/animation-runtime.tsx',
      'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
      'apps/web/components/g4-l3-whole-lesson-player.tsx',
      'apps/web/components/legacy-responsive-lesson-shell.tsx',
      'apps/web/lib/g4-l3-whole-lesson-player-descriptor.ts',
      'apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts',
      'apps/web/lib/whole-lesson-player-descriptor.ts',
      'apps/web/tests/descriptor-driven-whole-lesson-player.test.ts',
      'apps/web/tests/g4-l3-whole-lesson-player-descriptor.test.ts',
      'apps/web/tests/g4-l3-whole-lesson.test.ts',
      'apps/web/tests/g5-l4-whole-lesson-player-descriptor.test.ts',
      'scripts/build-g4-l3-whole-lesson-package-mvp.mjs',
      'scripts/build-g4-l3-whole-lesson-package-mvp.test.mjs',
      'scripts/qa-g4-l3-current-js-product.mjs',
      'apps/web/tests/playback-completion.test.ts',
    ]),
  }),
  Object.freeze({
    id: 'g4-whole-course-wave-planning',
    attribution: 'Grade 4 whole-course integration plan successor chain v5-v7',
    retention:
      'retain-v5-v7-history-v7-current-planning-zero-waves-admitted-not-executable',
    paths: Object.freeze([
      'catalog/batches/g4-whole-course-batch-integration-plan-v5.json',
      'catalog/batches/g4-whole-course-batch-integration-plan-v5.md',
      'catalog/batches/g4-whole-course-batch-integration-plan-v6.json',
      'catalog/batches/g4-whole-course-batch-integration-plan-v6.md',
      'catalog/batches/g4-whole-course-batch-integration-plan-v7.json',
      'catalog/batches/g4-whole-course-batch-integration-plan-v7.md',
      'scripts/build-g4-whole-course-batch-integration-plan-v5.mjs',
      'scripts/build-g4-whole-course-batch-integration-plan-v5.test.mjs',
      'scripts/build-g4-whole-course-batch-integration-plan-v6.mjs',
      'scripts/build-g4-whole-course-batch-integration-plan-v6.test.mjs',
      'scripts/build-g4-whole-course-batch-integration-plan-v7.mjs',
      'scripts/build-g4-whole-course-batch-integration-plan-v7.test.mjs',
    ]),
  }),
  Object.freeze({
    id: 'g4-keyterm-runtime-resolution',
    attribution: 'Grade 4 Key Term runtime resolution successor chain v1-v2',
    retention:
      'retain-v1-v2-v2-is-current-exhausted-ledger-evidence-stop-repeating-same-ledger-search',
    paths: Object.freeze([
      'catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1.json',
      'catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1.md',
      'catalog/source-promotions/g4-key-term-runtime-resolution-plan-v2.json',
      'catalog/source-promotions/g4-key-term-runtime-resolution-plan-v2.md',
      'scripts/build-g4-key-term-runtime-resolution-plan-v1.mjs',
      'scripts/build-g4-key-term-runtime-resolution-plan-v1.test.mjs',
      'scripts/build-g4-key-term-runtime-resolution-plan-v2.mjs',
      'scripts/build-g4-key-term-runtime-resolution-plan-v2.test.mjs',
    ]),
  }),
  Object.freeze({
    id: 'g4-missing-mp3-resolution',
    attribution: 'Grade 4 sixteen-missing-MP3 frozen-ledger resolution v2',
    retention:
      'retain-v2-as-current-exhausted-ledger-evidence-stop-repeating-same-ledger-search',
    paths: Object.freeze([
      'catalog/source-promotions/g4-missing-mp3-resolution-plan-v2.json',
      'catalog/source-promotions/g4-missing-mp3-resolution-plan-v2.md',
      'scripts/build-g4-missing-mp3-resolution-plan-v2.mjs',
      'scripts/build-g4-missing-mp3-resolution-plan-v2.test.mjs',
    ]),
  }),
  Object.freeze({
    id: 'g4-l10-complete-migration-template',
    attribution: 'G4 L10 complete-migration template successor chain v11-v13',
    retention:
      'retain-v11-v13-history-v13-current-template-fail-closed-not-stable',
    paths: Object.freeze([
      'reports/g4-l10-complete-migration-template-contract-v11-2026-08-07.json',
      'reports/g4-l10-complete-migration-template-contract-v11-2026-08-07.md',
      'reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.json',
      'reports/g4-l10-complete-migration-template-contract-v12-2026-08-07.md',
      'reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.json',
      'reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.md',
      'scripts/build-g4-l10-complete-migration-template-contract-v11.mjs',
      'scripts/build-g4-l10-complete-migration-template-contract-v11.test.mjs',
      'scripts/build-g4-l10-complete-migration-template-contract-v12.mjs',
      'scripts/build-g4-l10-complete-migration-template-contract-v12.test.mjs',
      'scripts/build-g4-l10-complete-migration-template-contract-v13.mjs',
      'scripts/build-g4-l10-complete-migration-template-contract-v13.test.mjs',
    ]),
  }),
  Object.freeze({
    id: 'g4-l10-ts007-currentness',
    attribution: 'G4 L10 TS007 frame-domain-disposition currentness v1-v2',
    retention:
      'retain-v1-serialization-defect-as-history-and-v2-as-parse-stable-currentness',
    paths: Object.freeze([
      'reports/g4-l10-ts007-frame-domain-disposition-currentness-v1.json',
      'reports/g4-l10-ts007-frame-domain-disposition-currentness-v1.md',
      'reports/g4-l10-ts007-frame-domain-disposition-currentness-v2.json',
      'reports/g4-l10-ts007-frame-domain-disposition-currentness-v2.md',
      'scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v1.mjs',
      'scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v1.test.mjs',
      'scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v2.mjs',
      'scripts/build-g4-l10-ts007-frame-domain-disposition-currentness-v2.test.mjs',
    ]),
  }),
  Object.freeze({
    id: 'g4-l10-vb003-static-gap',
    attribution: 'G4 L10 VB003 tracked-workspace static specification gap successor v2',
    retention:
      'retain-v2-tracked-clean-currentness-do-not-apply-candidate-patch',
    paths: Object.freeze([
      'reports/g4-l10-vb003-static-specification-gap-closure-v2.json',
      'reports/g4-l10-vb003-static-specification-gap-closure-v2.md',
      'scripts/build-g4-l10-vb003-static-specification-gap-closure-v2.mjs',
      'scripts/build-g4-l10-vb003-static-specification-gap-closure-v2.test.mjs',
    ]),
  }),
  Object.freeze({
    id: 'g4-l10-native-helper-review-authoring',
    attribution: 'G4 L10 native-helper v2.16 and v2.17 review/security authoring',
    retention:
      'retain-authoring-only-v2-17-current-unreviewed-no-review-set-no-runtime-authority',
    paths: Object.freeze([
      'docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md',
      'docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md',
      'docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md',
      'scripts/g4-l10-native-helper-v2_16-review-verifier.mjs',
      'scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs',
      'scripts/g4-l10-native-helper-v2_17-review-verifier.mjs',
      'scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs',
    ]),
  }),
]);

const CLOSURE_NON_OUTPUT_PATHS = Object.freeze([
  'apps/web/proxy.ts',
  'apps/web/tests/g4-l3-controlled-ceo-preview.test.ts',
  'apps/web/tests/g5-l4-executive-preview.test.ts',
  'packages/demos/tests/course-g05-l13-rw-002.test.ts',
  'scripts/build-g5-l13-rw002-current-js-binding-successor-r2.mjs',
  'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-07-r2.json',
  'migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-07-r2.md',
  'scripts/build-development-epoch-closure-2026-08-07-r1.mjs',
  'scripts/build-development-epoch-closure-2026-08-07-r1.test.mjs',
]);

const CLOSURE_OUTPUT_PATHS = Object.freeze([
  EPOCH_CLOSURE.jsonPath,
  EPOCH_CLOSURE.markdownPath,
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

function git(args, encoding = 'utf8') {
  return execFileSync('/usr/bin/git', args, {
    cwd: PROJECT_ROOT,
    encoding,
    maxBuffer: 32 * 1024 * 1024,
  });
}

function readStatus() {
  const output = git(['status', '--porcelain=v1', '-z'], 'buffer');
  const records = output.toString('utf8').split('\0').filter(Boolean);
  return new Map(records.map((record) => [record.slice(3), record.slice(0, 2)]));
}

async function bindPath(relativePath, status) {
  const absolutePath = path.join(PROJECT_ROOT, ...relativePath.split('/'));
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relativePath}: expected one ordinary single-link file`,
  );
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath,
    status,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function flattenClusterPaths() {
  const paths = CLUSTERS.flatMap((cluster) => cluster.paths);
  invariant(paths.length === 71, `baseline path count changed: ${paths.length}`);
  invariant(new Set(paths).size === paths.length, 'baseline cluster paths overlap');
  return paths;
}

export async function buildEpochClosureReport() {
  invariant(git(['rev-parse', 'HEAD']).trim() === EPOCH_CLOSURE.head, 'Git HEAD drifted');
  const baselinePaths = flattenClusterPaths();
  const expectedNonOutputPaths = [...baselinePaths, ...CLOSURE_NON_OUTPUT_PATHS];
  invariant(
    new Set(expectedNonOutputPaths).size === expectedNonOutputPaths.length,
    'closure paths overlap the original 71-entry intake',
  );

  const status = readStatus();
  const outputPresence = CLOSURE_OUTPUT_PATHS.map((outputPath) => status.has(outputPath));
  invariant(
    outputPresence.every(Boolean) || outputPresence.every((value) => !value),
    'closure output pair is partially present',
  );
  for (const outputPath of CLOSURE_OUTPUT_PATHS) status.delete(outputPath);
  invariant(
    JSON.stringify([...status.keys()].sort())
      === JSON.stringify([...expectedNonOutputPaths].sort()),
    'working-tree path set differs from the fixed 71-entry intake plus closure implementation',
  );

  const originalBindings = [];
  for (const relativePath of baselinePaths) {
    const pathStatus = status.get(relativePath);
    invariant(
      pathStatus === ' M' || pathStatus === '??',
      `${relativePath}: unexpected status ${pathStatus}`,
    );
    originalBindings.push(await bindPath(relativePath, pathStatus));
  }
  const closureBindings = [];
  for (const relativePath of CLOSURE_NON_OUTPUT_PATHS) {
    const pathStatus = status.get(relativePath);
    invariant(
      pathStatus === ' M' || pathStatus === '??',
      `${relativePath}: unexpected closure status ${pathStatus}`,
    );
    closureBindings.push(await bindPath(relativePath, pathStatus));
  }

  return {
    schemaVersion: 1,
    artifactType: 'help-math-development-epoch-attribution-and-retention-closure',
    issuedOn: '2026-08-07',
    status: 'attributed-retained-test-remediation-bound-acceptance-neutral',
    git: {
      head: EPOCH_CLOSURE.head,
      branch: 'codex/g4-l3-fidelity-finish',
      originalEntryCount: 71,
      originalTrackedModifiedCount: 15,
      originalUntrackedCount: 56,
      closureNonOutputEntryCount: CLOSURE_NON_OUTPUT_PATHS.length,
      closureOutputEntryCount: CLOSURE_OUTPUT_PATHS.length,
      expectedPostPublicationEntryCount:
        expectedNonOutputPaths.length + CLOSURE_OUTPUT_PATHS.length,
      stagedEntryCount: 0,
    },
    attributionMethod: {
      basis:
        'exact path membership, paired generator/test/artifact lineage, immutable successor naming, and current byte identity',
      humanAuthorIdentityEstablished: false,
      limitation:
        'This receipt attributes files to bounded workstreams and retention decisions. It does not invent or attest a human author for uncommitted bytes.',
    },
    clusters: CLUSTERS.map((cluster) => ({
      id: cluster.id,
      entryCount: cluster.paths.length,
      attribution: cluster.attribution,
      retention: cluster.retention,
      paths: [...cluster.paths],
    })),
    originalBindings,
    closureImplementation: {
      purpose:
        'Fix the two time-dependent executive-preview proxy tests, preserve RW002 r1, add a current r2 binding successor, and bind this epoch without rewriting immutable evidence.',
      bindings: closureBindings,
      immutablePredecessorsRewritten: false,
      filesDeleted: 0,
    },
    exhaustedSearchBoundary: {
      repeatV7V8LedgerSearchAuthorized: false,
      missingMp3Count: 16,
      missingKeyTermRuntimePathCount: 317,
      digReviewHoldCount: 316,
      polynomialSwfUnresolved: true,
      nextEvidenceRequired:
        'new Owner-authorized source identity or separate placement/SHA/receipt review',
    },
    previewAndPublicationBoundary: {
      privatePreviewRetained: true,
      anonymousAccessAllowed: false,
      strictCompleteMembers: 0,
      publicLessonPublicationAuthorized: false,
      publicLibraryExpansionAuthorized: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
  };
}

export function renderEpochClosureMarkdown(report) {
  const rows = report.clusters
    .map((cluster) => `| ${cluster.id} | ${cluster.entryCount} | ${cluster.retention} |`)
    .join('\n');
  return `# HELP Math development epoch closure — 2026-08-07 r1\n\n`
    + `Status: **${report.status}**\n\n`
    + `The original dirty-worktree intake is exactly 71 entries at Git HEAD \`${report.git.head}\`: 15 tracked modifications and 56 untracked files. Every entry is attributed to one bounded workstream below and retained; no file was deleted. Attribution establishes workstream lineage, not a human author identity.\n\n`
    + `| Workstream | Entries | Retention |\n| --- | ---: | --- |\n${rows}\n\n`
    + `## Remediation\n\n`
    + `The closure binds deterministic-time proxy verification for the two private-preview tests and a new RW002 r2 byte-binding successor. RW002 r1 and all other immutable predecessors remain unchanged.\n\n`
    + `## Closed authority\n\n`
    + `The v7/v8 ledger search is exhausted for the 16 MP3 and 317 Key Term runtime-path obligations and is not authorized to repeat. Private preview remains protected; strict completion and public lesson/library publication remain at zero and unauthorized. This receipt creates no original-runtime, audio, human, Owner, strict-completion, or publication acceptance.\n`;
}

export async function buildEpochClosureArtifacts() {
  const report = await buildEpochClosureReport();
  return {
    report,
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderEpochClosureMarkdown(report)),
  };
}

export function parseArguments(argv) {
  invariant(argv.length === 1, 'exactly one mode is required');
  if (argv[0] === '--write-no-clobber') return {mode: 'write'};
  if (argv[0] === '--check') return {mode: 'check'};
  if (argv[0] === '--json') return {mode: 'json'};
  throw new Error(`Unknown option: ${argv[0]}`);
}

async function readOutput(relativePath) {
  const absolutePath = path.join(PROJECT_ROOT, ...relativePath.split('/'));
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relativePath}: output is not one ordinary file`,
  );
  return readFile(absolutePath);
}

async function writeOutputs(artifacts) {
  const jsonAbsolute = path.join(PROJECT_ROOT, ...EPOCH_CLOSURE.jsonPath.split('/'));
  const markdownAbsolute = path.join(
    PROJECT_ROOT,
    ...EPOCH_CLOSURE.markdownPath.split('/'),
  );
  await writeFile(jsonAbsolute, artifacts.json, {flag: 'wx', mode: 0o444});
  const ownedJson = await lstat(jsonAbsolute);
  try {
    await writeFile(markdownAbsolute, artifacts.markdown, {flag: 'wx', mode: 0o444});
  } catch (error) {
    const currentJson = await lstat(jsonAbsolute).catch(() => null);
    if (
      currentJson
      && currentJson.dev === ownedJson.dev
      && currentJson.ino === ownedJson.ino
      && currentJson.nlink === 1
    ) {
      await unlink(jsonAbsolute);
    }
    throw error;
  }
}

async function checkOutputs(artifacts) {
  invariant(
    (await readOutput(EPOCH_CLOSURE.jsonPath)).equals(artifacts.json),
    'epoch closure JSON drifted',
  );
  invariant(
    (await readOutput(EPOCH_CLOSURE.markdownPath)).equals(artifacts.markdown),
    'epoch closure Markdown drifted',
  );
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  const artifacts = await buildEpochClosureArtifacts();
  if (mode === 'write') {
    await writeOutputs(artifacts);
    process.stdout.write(`wrote ${EPOCH_CLOSURE.jsonPath} and ${EPOCH_CLOSURE.markdownPath}\n`);
  } else if (mode === 'check') {
    await checkOutputs(artifacts);
    process.stdout.write('development epoch closure: PASS\n');
  } else {
    process.stdout.write(artifacts.json);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
