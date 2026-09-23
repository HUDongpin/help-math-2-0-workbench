#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  buildStrictGapCurrentnessSuccessor,
} from './build-g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.mjs';
import {
  buildCurrentJsCaptureSuccessorR2,
} from './build-g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const INPUT_PATHS = Object.freeze([
  'reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.json',
  'reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.md',
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.json',
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r2.md',
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.json',
  'reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.md',
  'catalog/completion-ledger.json',
  'catalog/lesson-release-ledger.json',
]);

const IMPLEMENTATION_PATHS = Object.freeze([
  'scripts/build-g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.mjs',
  'scripts/build-g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.test.mjs',
]);

const OUTPUT_PATHS = Object.freeze([
  'reports/g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.json',
  'reports/g4-l3-g5-l4-strict-acceptance-handoff-2026-08-08-r1.md',
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  currentJavascriptEvidence: true,
  authoritativeOriginalRuntime: false,
  naturalTraceEstablished: false,
  fullFrameRmseAccepted: false,
  audioAccepted: false,
  interactionAccepted: false,
  replayAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  publicReleaseAuthorized: false,
  published: false,
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

async function bind(relativePath, {readOnly = false, parseJson = false} = {}) {
  const target = absolute(relativePath);
  const before = await lstat(target);
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1, `${relativePath}: expected one ordinary single-link file`);
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

function requireAllFalse(value, label) {
  invariant(
    value && Object.values(value).every((entry) => entry === false),
    `${label}: acceptance boundary drifted`,
  );
}

function asLessonSummary(lesson, capture) {
  return Object.freeze({
    release: lesson.release,
    currentJavascript: capture,
    runtimeBoundary: lesson.runtimeBoundary,
  });
}

function renderMarkdown(report) {
  const {g4Lesson3, g5Lesson4} = report.lessons;
  return `# G4 L3 / G5 L4 strict-acceptance handoff — 2026-08-08 r1\n\n`
    + `Status: **${report.status}**\n\n`
    + `## Current machine evidence\n\n`
    + `- r6/r3 verifies ${report.currentJavascriptCapture.frameCount} private, session-protected current-JavaScript frames at native 800×600: G4 L3 TS006 128 and G5 L4 RW002 419. This is implementation evidence only.\n`
    + `- G4 L3 release: ${g4Lesson3.release.strictCompleteMembers}/${g4Lesson3.release.expectedMembers} strict members, ${g4Lesson3.release.status}. G5 L4 release: ${g5Lesson4.release.strictCompleteMembers}/${g5Lesson4.release.expectedMembers} strict members, ${g5Lesson4.release.status}.\n`
    + `- The current strict-ledger verdict is **${report.strictLedgerCurrentness.verdict}**. Its summary is unchanged, but the checked-in ledger is stale; do not infer a strict PASS or current strict-zero result from it.\n\n`
    + `## Exact blockers\n\n`
    + `- **G4 L3:** zero original-runtime sessions, named operators, approved containment controls, and authoritative baseline packages. Its M2/M3 planning predecessors are stale.\n`
    + `- **G5 L4:** zero original-runtime sessions/baselines; `
    + `missing declared dependencies \`${g5Lesson4.runtimeBoundary.missingDeclaredDependencies.join('`, `')}\`; `
    + `${g5Lesson4.sourceScope.descriptorOnlyDiffCount} source-descriptor-only differences while the 55-member logical scope is unchanged.\n`
    + `- **Both lessons:** natural interaction/Replay trace authority, full-frame baseline/implementation pairs and RMSE review, required audio listening, named-human visual review, owner decision, strict-validator admission, a current ledger, and the external production trust adapter remain absent.\n\n`
    + `## Next authority-needed sequence\n\n`
    + `1. Owner or authorized representative: issue an exact per-session authorization naming scope, host, operator, containment controls, source identity, output boundary, and stop conditions. G5 must first resolve or separately disposition its two missing XML dependencies.\n`
    + `2. Named human operator: perform the authorized original-runtime natural traces; direct seek may supplement linear root visuals only and cannot prove interaction, navigation, Replay, scoring, or audio.\n`
    + `3. Engineering: bind complete native-size baseline and implementation manifests, inspect every full-frame diff/RMSE result, and retain all required audio session inputs.\n`
    + `4. Named human reviewer, then Owner: create separate append-only records against the exact technical evidence.\n`
    + `5. Only after attributed authorization to update the shared ledger: run strict validation and rebuild completion/release ledgers; public release still additionally needs the external trust adapter.\n\n`
    + `This handoff creates no authorization, runtime launch, review signature, source promotion, ledger rewrite, strict completion, or publication.\n`;
}

export async function buildStrictAcceptanceHandoffR1() {
  const [strictGap, currentJs, inputBindings, implementationBindings] = await Promise.all([
    buildStrictGapCurrentnessSuccessor(),
    buildCurrentJsCaptureSuccessorR2(),
    Promise.all(INPUT_PATHS.map((relativePath) => bind(relativePath, {
      readOnly: relativePath.startsWith('reports/'),
      parseJson: relativePath.endsWith('.json'),
    }))),
    Promise.all(IMPLEMENTATION_PATHS.map((relativePath) => bind(relativePath))),
  ]);
  invariant(
    strictGap.status === 'current-by-successor-validation-original-runtime-human-owner-strict-and-publication-closed',
    'strict-gap successor is not current',
  );
  requireAllFalse(strictGap.acceptanceEffects, 'strict-gap successor');
  invariant(
    strictGap.g4Lesson3?.release?.expectedMembers === 40
      && strictGap.g4Lesson3.release.strictCompleteMembers === 0
      && strictGap.g4Lesson3.release.published === false,
    'G4 L3 release scope drifted',
  );
  invariant(
    strictGap.g5Lesson4?.release?.expectedMembers === 55
      && strictGap.g5Lesson4.release.strictCompleteMembers === 0
      && strictGap.g5Lesson4.release.published === false,
    'G5 L4 release scope drifted',
  );
  invariant(
    strictGap.g4Lesson3.runtimeBoundary.runtimeSessionsExecuted === 0
      && strictGap.g4Lesson3.runtimeBoundary.authoritativeBaselinePackages === 0
      && strictGap.g4Lesson3.runtimeBoundary.originalRuntimeExecutionReady === false,
    'G4 L3 original-runtime boundary drifted',
  );
  invariant(
    strictGap.g5Lesson4.runtimeBoundary.runtimeSessionsExecuted === 0
      && strictGap.g5Lesson4.runtimeBoundary.authoritativeBaselines === 0
      && strictGap.g5Lesson4.runtimeBoundary.originalRuntimeExecutionReady === false
      && JSON.stringify(strictGap.g5Lesson4.runtimeBoundary.missingDeclaredDependencies)
        === JSON.stringify(['L4KTE01.xml', 'L4KTS01.xml']),
    'G5 L4 original-runtime dependency boundary drifted',
  );
  invariant(
    strictGap.nextAuthorizedWork?.originalRuntimeRequiresExactSessionAuthorization === true
      && strictGap.nextAuthorizedWork?.humanVisualReviewRequiresNamedHuman === true
      && strictGap.nextAuthorizedWork?.ownerAcceptanceRequiresOwnerOrAuthorizedRepresentative === true
      && strictGap.nextAuthorizedWork?.publicationRequiresStrictCompleteAllMembersAndExternalTrustAdapter === true,
    'next-authority boundary drifted',
  );
  invariant(
    currentJs.captureVerification?.result?.verdict === 'PASS'
      && currentJs.captureVerification.result.frameCount === 547
      && currentJs.captureVerification.result.strictComplete === false
      && currentJs.captureVerification.result.published === false,
    'current-JS capture result drifted',
  );
  invariant(
    currentJs.strictLedgerCurrentness?.verdict === 'UNEVALUATED_STALE_CHECKED_IN_LEDGER_DO_NOT_INFER_STRICT_ZERO'
      && currentJs.strictLedgerCurrentness.changedDiagnosticCount === 1
      && currentJs.strictLedgerCurrentness.summaryUnchanged === true
      && currentJs.strictLedgerCurrentness.ledgerBytesCurrent === false,
    'strict-ledger currentness boundary drifted',
  );
  const inputByPath = new Map(inputBindings.map((binding) => [binding.descriptor.path, binding]));
  const r3 = inputByPath.get('reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-08-r3.json')?.value;
  invariant(
    r3?.revision === 'r3'
      && r3?.r6CurrentVerification?.frameCount === 547
      && r3.r6CurrentVerification.strictComplete === false
      && r3.r6CurrentVerification.published === false,
    'r3 rendered current-JS successor drifted',
  );
  const completionLedger = inputByPath.get('catalog/completion-ledger.json')?.value;
  const releaseLedger = inputByPath.get('catalog/lesson-release-ledger.json')?.value;
  invariant(
    completionLedger?.summary?.migrationDirectories === 215
      && completionLedger.summary.strictComplete === 0
      && completionLedger.summary.strictFailed === 215,
    'checked-in completion-ledger summary drifted',
  );
  invariant(
    releaseLedger?.summary?.releaseCount === 4
      && releaseLedger.summary.publishedReleaseCount === 0
      && releaseLedger.summary.strictCompleteMemberCount === 0,
    'checked-in release-ledger summary drifted',
  );
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g4-l3-g5-l4-strict-acceptance-handoff',
    issuedOn: '2026-08-08',
    revision: 'r1',
    status: 'current-machine-gaps-revalidated-no-session-authorization-no-strict-ledger-rewrite',
    inputs: inputBindings.map(({descriptor}) => descriptor),
    implementation: Object.freeze({
      bindings: implementationBindings.map(({descriptor}) => descriptor),
      outputDisposition: 'new-read-only-no-clobber-handoff-only',
    }),
    currentJavascriptCapture: Object.freeze({
      revision: 'r6-r3',
      verifierResult: currentJs.captureVerification.result,
      frameCount: r3.r6CurrentVerification.frameCount,
      strictComplete: false,
      published: false,
      privateSessionProtected: true,
      currentJavascriptEvidenceOnly: true,
    }),
    lessons: Object.freeze({
      g4Lesson3: Object.freeze({
        ...asLessonSummary(strictGap.g4Lesson3, Object.freeze({
          activePages: strictGap.g4Lesson3.currentJavascript.activePages,
          boundModules: strictGap.g4Lesson3.currentJavascript.boundModules,
          modulesChangedSincePredecessor: strictGap.g4Lesson3.currentJavascript.modulesChangedSincePredecessor,
        })),
        planningCurrentness: strictGap.g4Lesson3.planningCurrentness,
      }),
      g5Lesson4: Object.freeze({
        ...asLessonSummary(strictGap.g5Lesson4, Object.freeze({
          memberCount: strictGap.g5Lesson4.sourceScope.memberCount,
          pairedFlaSwfCount: strictGap.g5Lesson4.sourceScope.pairedFlaSwfCount,
          swfOnlyCount: strictGap.g5Lesson4.sourceScope.swfOnlyCount,
          logicalScopeChanged: strictGap.g5Lesson4.sourceScope.logicalScopeChanged,
          descriptorOnlyDiffCount: strictGap.g5Lesson4.sourceScope.descriptorOnlyDiffCount,
        })),
        sourceScope: strictGap.g5Lesson4.sourceScope,
        machinePreparation: strictGap.g5Lesson4.machinePreparation,
      }),
    }),
    strictLedgerCurrentness: Object.freeze({
      verdict: currentJs.strictLedgerCurrentness.verdict,
      changedDiagnosticCount: currentJs.strictLedgerCurrentness.changedDiagnosticCount,
      summaryUnchanged: currentJs.strictLedgerCurrentness.summaryUnchanged,
      ledgerBytesCurrent: currentJs.strictLedgerCurrentness.ledgerBytesCurrent,
      checkedInCompletionSummary: currentJs.strictLedgerCurrentness.checkedInCompletionSummary,
      checkedInLessonReleaseSummary: currentJs.strictLedgerCurrentness.checkedInLessonReleaseSummary,
      writeDisposition: 'NO_LEDGER_REWRITE_IN_DIRTY_SHARED_WORKTREE_WITHOUT_ATTRIBUTED_OWNER_AUTHORIZATION',
    }),
    nextAuthorityRequired: Object.freeze({
      exactOriginalRuntimeSessionAuthorization: true,
      namedHumanOperator: true,
      G5L4MissingXmlDisposition: ['L4KTE01.xml', 'L4KTS01.xml'],
      fullFrameBaselineAndRmseReview: true,
      originalRuntimeAudioListeningWhenRequired: true,
      namedHumanVisualReview: true,
      ownerOrAuthorizedRepresentativeDecision: true,
      attributedStrictLedgerRebuildAuthority: true,
      externalProductionTrustAdapterForPublication: true,
    }),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

export async function buildStrictAcceptanceHandoffArtifactsR1() {
  const report = await buildStrictAcceptanceHandoffR1();
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
  for (const relativePath of OUTPUT_PATHS) {
    try {
      await lstat(absolute(relativePath));
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    throw new Error(`${relativePath}: handoff output already exists; never overwrite immutable evidence`);
  }
}

async function writeNoClobber(artifacts) {
  await assertOutputsAbsent();
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
  invariant(json.equals(artifacts.json), 'strict-acceptance handoff JSON drifted');
  invariant(markdown.equals(artifacts.markdown), 'strict-acceptance handoff Markdown drifted');
  await Promise.all(OUTPUT_PATHS.map((relativePath) => bind(relativePath, {readOnly: true})));
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  const artifacts = await buildStrictAcceptanceHandoffArtifactsR1();
  if (mode === 'write') {
    await writeNoClobber(artifacts);
    process.stdout.write(`wrote ${OUTPUT_PATHS.join(' and ')}\n`);
    return;
  }
  if (mode === 'check') {
    await check(artifacts);
    process.stdout.write('G4 L3/G5 L4 strict-acceptance handoff r1: PASS\n');
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
