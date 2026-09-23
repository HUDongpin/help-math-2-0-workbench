#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  derivePlan as deriveV6Plan,
  readSnapshot as readV6Snapshot,
  validatePlanV6,
} from "./build-g4-whole-course-batch-integration-plan-v6.mjs";
import {
  deriveReport as deriveKeyTermV2Report,
  readSnapshot as readKeyTermV2Snapshot,
  stableJson as stableKeyTermV2Json,
  validateResolutionPlanV2 as validateKeyTermV2,
} from "./build-g4-key-term-runtime-resolution-plan-v2.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const OUTPUT_PREFIX =
  "catalog/batches/g4-whole-course-batch-integration-plan-v7";
const OUTPUT_MODE = 0o444;
const SHA256 = /^[a-f0-9]{64}$/u;

const FIXED_INPUTS = Object.freeze({
  predecessorV6Builder: Object.freeze({
    path: "scripts/build-g4-whole-course-batch-integration-plan-v6.mjs",
    bytes: 26_677,
    sha256: "fa8cffcec9d06d44c5afe60721667d074e93bcbb226664b8eb878ef843bab377",
    mode: "0644",
    kind: "text",
  }),
  predecessorV6Test: Object.freeze({
    path: "scripts/build-g4-whole-course-batch-integration-plan-v6.test.mjs",
    bytes: 8_192,
    sha256: "b7c4b07961f9fadcfb321337478f0826c2bc5f97b6629eb4063618156750d62d",
    mode: "0644",
    kind: "text",
  }),
  predecessorV6Json: Object.freeze({
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v6.json",
    bytes: 57_036,
    sha256: "dc3c823b78144690eb5990fd2076cd21bc8b2737ec17e0236915ffc71cea7725",
    mode: "0444",
    kind: "json",
  }),
  predecessorV6Markdown: Object.freeze({
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v6.md",
    bytes: 1_073,
    sha256: "acd45468ea319afabc9fba91cd2138bdad8b6dcc88dba117571924b01dfa5662",
    mode: "0444",
    kind: "text",
  }),
  keyTermV2Builder: Object.freeze({
    path: "scripts/build-g4-key-term-runtime-resolution-plan-v2.mjs",
    bytes: 44_217,
    sha256: "6a5b4ebda53bc05d16611286e9a0b9146ced1fc5c5d3a30e0cec19dec3d34cf8",
    mode: "0644",
    kind: "text",
  }),
  keyTermV2Test: Object.freeze({
    path: "scripts/build-g4-key-term-runtime-resolution-plan-v2.test.mjs",
    bytes: 9_209,
    sha256: "322dac850f2060b79f4c94b57d8e861d417ec782b3c5b58d301c50ecbd157ec9",
    mode: "0644",
    kind: "text",
  }),
  keyTermV2Json: Object.freeze({
    path: "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v2.json",
    bytes: 264_796,
    sha256: "486abdba834be7550936002fd9807a9f4bb76c752ec6529eacc210db278f6db5",
    mode: "0444",
    kind: "json",
  }),
  keyTermV2Markdown: Object.freeze({
    path: "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v2.md",
    bytes: 1_216,
    sha256: "bf1334b8b7e342dd6a8bbe69848ded813c309c2c2a76f3def99fb97bc2e166b8",
    mode: "0444",
    kind: "text",
  }),
});

const ACCEPTANCE_KEYS = Object.freeze([
  "waveAdmission",
  "batchExecution",
  "sourcePromotion",
  "runtimeDependencyClosure",
  "rendererAcceptance",
  "originalRuntimeAcceptance",
  "behaviorAcceptance",
  "accessibilityAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "localizationAcceptance",
  "keyTermAcceptance",
  "quizAcceptance",
  "humanAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "wholeCoursePublication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertNoUndefined(value, location = "$") {
  assert.notEqual(value, undefined, `undefined value at ${location}`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUndefined(item, `${location}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoUndefined(item, `${location}.${key}`);
    }
  }
}

function planFingerprint(plan) {
  const projection = structuredClone(plan);
  delete projection.planFingerprintSha256;
  assertNoUndefined(projection);
  return sha256(canonicalJson(projection));
}

function modeString(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs, info.nlink]
    .map(String).join(":");
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false);
  assert.equal(relativePath.includes("\\"), false);
  assert.equal(path.posix.normalize(relativePath), relativePath);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`));
  return absolute;
}

async function canonicalRoot(projectRoot) {
  const root = path.resolve(projectRoot);
  const info = await lstat(root, {bigint: true});
  assert.ok(info.isDirectory() && !info.isSymbolicLink());
  assert.equal(await realpath(root), root);
  return root;
}

async function readBound(projectRoot, key, specification) {
  const root = await canonicalRoot(projectRoot);
  const absolute = resolveInsideRoot(root, specification.path);
  assert.equal(await realpath(path.dirname(absolute)), path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n);
  assert.equal(await realpath(absolute), absolute);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${specification.path} changed while read`);
  const record = {
    key,
    path: specification.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(after),
  };
  assert.equal(record.bytes, specification.bytes,
    `${specification.path}: byte count drifted`);
  assert.equal(record.sha256, specification.sha256,
    `${specification.path}: SHA-256 drifted`);
  assert.equal(record.mode, specification.mode,
    `${specification.path}: mode drifted`);
  if (specification.kind === "json") record.document = JSON.parse(bytes.toString("utf8"));
  return record;
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function validateKeyTermV2Report(report) {
  assert.equal(validateKeyTermV2(report), true);
  assert.equal(report.status,
    "acceptance-neutral-v7-v8-ledger-exhausted-316-holds-polynomial-runtime-unresolved");
  assert.equal(report.summary.obligationCount, 317);
  assert.equal(report.summary.existingQuarantineReviewCandidateCount, 316);
  assert.equal(report.summary.expectedRuntimeSha256AcceptedCount, 0);
  assert.equal(report.summary.expectedRuntimeSha256UnacceptedCount, 317);
  assert.equal(report.summary.v7V8LedgerFileCount, 6060);
  assert.equal(report.summary.v7V8PathFieldCount, 12120);
  assert.equal(report.summary.exactCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.caseInsensitiveCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.basenameMatchCount, 0);
  assert.equal(report.summary.candidateObjectCount, 0);
  assert.equal(report.summary.selectedCandidateCount, 0);
  assert.equal(report.summary.unresolvedRuntimeSwfCount, 1);
  assert.equal(report.summary.sourceDependencyClosure, false);
  assert.equal(report.controls.frozenObjectPayloadBytesReadByThisSuccessor, false);
  assert.equal(report.controls.applySupported, false);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.deepEqual(report.promotionRecords, []);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
}

function updateKeyTermBlocker(predecessorBlocker, report, fixedBindings) {
  return {
    ...structuredClone(predecessorBlocker),
    dependencyClosureComplete: false,
    resolutionPlan: {
      ...structuredClone(predecessorBlocker.resolutionPlan),
      version: 2,
      mode: report.mode,
      status: report.status,
      artifacts: {
        generator: fixedBindings.keyTermV2Builder,
        tests: fixedBindings.keyTermV2Test,
        json: fixedBindings.keyTermV2Json,
        markdown: fixedBindings.keyTermV2Markdown,
      },
      reportFingerprintSha256: report.reportFingerprintSha256,
      inputSetSha256: report.inputSetSha256,
      targetRuntimeGapCount: report.summary.obligationCount,
      expectedRuntimeSha256AcceptedCount:
        report.summary.expectedRuntimeSha256AcceptedCount,
      expectedRuntimeSha256UnacceptedCount:
        report.summary.expectedRuntimeSha256UnacceptedCount,
      existingQuarantineReviewCandidateCount:
        report.summary.existingQuarantineReviewCandidateCount,
      frozenV7V8LedgerFileCount: report.summary.v7V8LedgerFileCount,
      frozenV7V8PathFieldCount: report.summary.v7V8PathFieldCount,
      frozenV7V8ExactSuffixMatchCount:
        report.summary.exactCanonicalSuffixMatchCount,
      frozenV7V8CaseInsensitiveSuffixMatchCount:
        report.summary.caseInsensitiveCanonicalSuffixMatchCount,
      frozenV7V8BasenameMatchCount: report.summary.basenameMatchCount,
      frozenV7V8CandidateObjectCount: report.summary.candidateObjectCount,
      selectedCandidateCount: report.summary.selectedCandidateCount,
      frozenV7V8UnionDigestSetSha256:
        report.frozenLedgerEvidence.union.digestSetSha256,
      frozenPrivatePathProjectionSha256:
        report.frozenLedgerEvidence.privatePathProjectionSha256,
      runtimeSwfUnresolved: report.summary.unresolvedRuntimeSwfCount,
      sourceDependencyClosure: false,
      automaticPlacementOrCaseAdmissionAuthorized: false,
      promotionRecordCount: report.summary.promotionRecordCount,
      acceptanceEffect: "none",
    },
  };
}

function inputSetSha256(plan) {
  return sha256(canonicalJson({
    inputBindings: plan.inputBindings,
    predecessorFingerprint: plan.successorOf.planFingerprintSha256,
    currentEvidence: {
      missingMp3V2: plan.currentEvidence.missingMp3V2.reportFingerprintSha256,
      l10V13: plan.currentEvidence.l10V13.reportFingerprintSha256,
      vb003GapV2: plan.currentEvidence.vb003GapV2.reportFingerprintSha256,
      keyTermV2: plan.currentEvidence.keyTermV2.reportFingerprintSha256,
    },
  }));
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const fixedRecords = {};
  for (const [key, specification] of Object.entries(FIXED_INPUTS)) {
    fixedRecords[key] = await readBound(projectRoot, key, specification);
  }
  const [v6Snapshot, keyTermV2Snapshot] = await Promise.all([
    readV6Snapshot(projectRoot),
    readKeyTermV2Snapshot(projectRoot),
  ]);
  const liveV6 = deriveV6Plan(v6Snapshot);
  const liveKeyTermV2 = deriveKeyTermV2Report(keyTermV2Snapshot);
  assert.equal(validatePlanV6(liveV6), true);
  validateKeyTermV2Report(liveKeyTermV2);
  assert.deepEqual(fixedRecords.predecessorV6Json.document, liveV6,
    "checked-in v6 differs from live deterministic derivation");
  assert.equal(stableKeyTermV2Json(liveKeyTermV2),
    `${JSON.stringify(fixedRecords.keyTermV2Json.document, null, 2)}\n`,
    "checked-in Key Term v2 differs from live deterministic derivation");
  return {
    projectRoot,
    fixedRecords,
    predecessor: fixedRecords.predecessorV6Json.document,
    keyTermV2: fixedRecords.keyTermV2Json.document,
  };
}

export function derivePlan(snapshot) {
  const predecessor = snapshot.predecessor;
  const fixedBindings = Object.fromEntries(Object.keys(snapshot.fixedRecords).sort(compareText)
    .map((key) => [key, binding(snapshot.fixedRecords[key])]));
  const inputBindings = Object.fromEntries(Object.entries({
    ...predecessor.inputBindings,
    ...fixedBindings,
  }).sort(([left], [right]) => compareText(left, right)));
  assert.equal(Object.keys(inputBindings).length, 67);
  const oldKeyTermReason = predecessor.admissionDecision.reasons.find((reason) =>
    reason.startsWith("Key Term v1 rehashed 443 catalog-resolved canonical SWFs"));
  assert.ok(oldKeyTermReason, "v6 Key Term admission reason is absent");
  const plan = {
    ...structuredClone(predecessor),
    schemaVersion: 7,
    planDate: "2026-08-07",
    successorOf: {
      path: FIXED_INPUTS.predecessorV6Json.path,
      bytes: snapshot.fixedRecords.predecessorV6Json.bytes,
      sha256: snapshot.fixedRecords.predecessorV6Json.sha256,
      mode: snapshot.fixedRecords.predecessorV6Json.mode,
      schemaVersion: predecessor.schemaVersion,
      status: predecessor.status,
      planFingerprintSha256: predecessor.planFingerprintSha256,
    },
    blockers: {
      ...structuredClone(predecessor.blockers),
      keyTerms: updateKeyTermBlocker(
        predecessor.blockers.keyTerms,
        snapshot.keyTermV2,
        fixedBindings,
      ),
    },
    admissionDecision: {
      ...structuredClone(predecessor.admissionDecision),
      reasons: predecessor.admissionDecision.reasons.map((reason) =>
        reason === oldKeyTermReason
          ? "Key Term v2 preserves v1's rehashed 443 canonical SWFs and 1,594-file DIG quarantine evidence, then independently rehashes all 6,060 frozen ledger JSON files and scans 12,120 path fields against all 317 runtime gaps; it finds zero additional candidates, leaves 316 review holds unaccepted, and leaves Polynomial.swf unresolved."
          : reason),
    },
    authorityBoundary: {
      ...structuredClone(predecessor.authorityBoundary),
      keyTermV2ClosesRuntimeDependency: false,
      keyTermV2AuthorizesFrozenObjectPayloadRead: false,
      keyTermV2AuthorizesPlacementOrCaseMapping: false,
      keyTermV2AuthorizesPromotion: false,
      keyTermV2AuthorizesRuntimeOrAcceptance: false,
    },
    inputBindings,
    predecessorDisposition: {
      v6: {
        preserved: true,
        modified: false,
        semanticCourseWaveAudioL10Vb003AndKeyTermV1PlanCarriedForward: true,
        staleKeyTermLedgerScopeSupersededByV2: true,
        acceptanceEffect: "none",
      },
      olderHistory: structuredClone(predecessor.predecessorDisposition),
    },
    currentEvidence: {
      ...structuredClone(predecessor.currentEvidence),
      keyTermV2: {
        artifact: fixedBindings.keyTermV2Json,
        status: snapshot.keyTermV2.status,
        reportFingerprintSha256: snapshot.keyTermV2.reportFingerprintSha256,
        inputSetSha256: snapshot.keyTermV2.inputSetSha256,
        targetRuntimeGapCount: snapshot.keyTermV2.summary.obligationCount,
        frozenLedgerFilesRehashed:
          snapshot.keyTermV2.summary.v7V8LedgerFileCount,
        frozenPathFieldsScanned:
          snapshot.keyTermV2.summary.v7V8PathFieldCount,
        frozenCandidateObjectCount:
          snapshot.keyTermV2.summary.candidateObjectCount,
        existingQuarantineReviewCandidateCount:
          snapshot.keyTermV2.summary.existingQuarantineReviewCandidateCount,
        runtimeSwfUnresolved:
          snapshot.keyTermV2.summary.unresolvedRuntimeSwfCount,
        sourceDependencyClosure:
          snapshot.keyTermV2.summary.sourceDependencyClosure,
      },
    },
    inputSetSha256: null,
    planFingerprintSha256: null,
  };
  delete plan.currentEvidence.keyTermV1;
  plan.inputSetSha256 = inputSetSha256(plan);
  plan.planFingerprintSha256 = planFingerprint(plan);
  validatePlanV7(plan);
  return plan;
}

export function validatePlanV7(plan) {
  assertNoUndefined(plan);
  assert.equal(plan.schemaVersion, 7);
  assert.equal(plan.artifactType,
    "g4-whole-course-batch-and-atomic-integration-plan");
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.deepEqual({
    lessons: plan.courseBaseline.lessonCount,
    pages: plan.courseBaseline.pageCount,
    shells: plan.courseBaseline.shellCount,
    members: plan.courseBaseline.memberCount,
    currentJs: plan.courseBaseline.currentJsMembers,
    currentJsGap: plan.courseBaseline.currentJsGap,
    strictComplete: plan.courseBaseline.strictCompleteMembers,
  }, {
    lessons: 12,
    pages: 645,
    shells: 12,
    members: 657,
    currentJs: 43,
    currentJsGap: 614,
    strictComplete: 0,
  });
  assert.equal(plan.template.contractVersion, 13);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.authoritativeRuntimeSessions, 0);
  assert.equal(plan.template.authoritativeCapturedFrames, 0);
  assert.equal(plan.template.registeredFormalRendererCount, 0);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.template.activeReviewProtocol, "v2.16");
  assert.equal(plan.template.specReviewQualified, false);
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.version, 2);
  assert.equal(plan.blockers.audio.resolutionPlan.candidateObjectCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.sourceDependencyClosure, false);

  const keyTerms = plan.blockers.keyTerms;
  assert.equal(keyTerms.occurrences, 1515);
  assert.equal(keyTerms.unique, 760);
  assert.equal(keyTerms.canonicalResolved, 443);
  assert.equal(keyTerms.canonicalMissing, 317);
  assert.equal(keyTerms.totalReviewHolds, 316);
  assert.equal(keyTerms.dependencyClosureComplete, false);
  assert.equal(keyTerms.resolutionPlan.version, 2);
  assert.equal(keyTerms.resolutionPlan.targetRuntimeGapCount, 317);
  assert.equal(keyTerms.resolutionPlan.expectedRuntimeSha256AcceptedCount, 0);
  assert.equal(keyTerms.resolutionPlan.expectedRuntimeSha256UnacceptedCount, 317);
  assert.equal(keyTerms.resolutionPlan.existingQuarantineReviewCandidateCount, 316);
  assert.equal(keyTerms.resolutionPlan.frozenV7V8LedgerFileCount, 6060);
  assert.equal(keyTerms.resolutionPlan.frozenV7V8PathFieldCount, 12120);
  assert.equal(keyTerms.resolutionPlan.frozenV7V8ExactSuffixMatchCount, 0);
  assert.equal(keyTerms.resolutionPlan.frozenV7V8CaseInsensitiveSuffixMatchCount, 0);
  assert.equal(keyTerms.resolutionPlan.frozenV7V8BasenameMatchCount, 0);
  assert.equal(keyTerms.resolutionPlan.frozenV7V8CandidateObjectCount, 0);
  assert.equal(keyTerms.resolutionPlan.selectedCandidateCount, 0);
  assert.equal(keyTerms.resolutionPlan.runtimeSwfUnresolved, 1);
  assert.equal(keyTerms.resolutionPlan.sourceDependencyClosure, false);
  assert.equal(keyTerms.resolutionPlan.automaticPlacementOrCaseAdmissionAuthorized,
    false);
  assert.equal(keyTerms.resolutionPlan.promotionRecordCount, 0);

  assert.equal(plan.waves.length, 4);
  assert.ok(plan.waves.every((wave) =>
    wave.admissionStatus === "planned-not-admitted" &&
    wave.admittedLessonCount === 0 && wave.executable === false));
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
  assert.equal(plan.admissionDecision.mayStartRendererBatch, false);
  assert.equal(plan.admissionDecision.mayIntegrateCourse, false);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  for (const key of [
    "planMayCreateReviewTasks",
    "planMayRunPhaseAOrPhaseB",
    "planMayImplementOrTestProductionHelper",
    "planMayExecuteOriginalRuntime",
    "planMayApplySourcePromotion",
    "planMayStartBatch",
    "planMayIntegrateOrPublish",
    "keyTermV2ClosesRuntimeDependency",
    "keyTermV2AuthorizesFrozenObjectPayloadRead",
    "keyTermV2AuthorizesPlacementOrCaseMapping",
    "keyTermV2AuthorizesPromotion",
    "keyTermV2AuthorizesRuntimeOrAcceptance",
  ]) assert.equal(plan.authorityBoundary[key], false, key);
  assert.deepEqual(Object.keys(plan.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(plan.successorOf.sha256, FIXED_INPUTS.predecessorV6Json.sha256);
  assert.equal(plan.successorOf.planFingerprintSha256,
    "076587b8f281518005b58aa886fe1abf56401e5a23298418ff7b27114cc54489");
  assert.equal(plan.predecessorDisposition.v6.preserved, true);
  assert.equal(plan.predecessorDisposition.v6.modified, false);
  assert.equal(Object.keys(plan.inputBindings).length, 67);
  assert.ok(Object.values(plan.inputBindings).every((record) =>
    SHA256.test(record.sha256)));
  assert.equal(plan.currentEvidence.keyTermV1, undefined);
  assert.equal(plan.currentEvidence.keyTermV2.sourceDependencyClosure, false);
  assert.equal(plan.inputSetSha256, inputSetSha256(plan));
  assert.match(plan.planFingerprintSha256, SHA256);
  assert.equal(plan.planFingerprintSha256, planFingerprint(plan));
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  return true;
}

export function renderMarkdown(plan) {
  validatePlanV7(plan);
  return `# Grade 4 Whole-Course Batch Integration Plan v7\n\n` +
    `- Status: \`${plan.status}\`\n` +
    `- Grade 4 denominator: ${plan.courseBaseline.memberCount} members ` +
    `(${plan.courseBaseline.pageCount} pages + ${plan.courseBaseline.shellCount} shells)\n` +
    `- Current JavaScript: ${plan.courseBaseline.currentJsMembers}/${plan.courseBaseline.memberCount}\n` +
    `- Strict complete: ${plan.courseBaseline.strictCompleteMembers}/${plan.courseBaseline.memberCount}\n` +
    `- Waves admitted: ${plan.waveAdmissionCount}/${plan.waves.length}\n` +
    `- L10 template stable: \`${plan.template.templateStable}\`\n` +
    `- Missing Grade 4 MP3s: ${plan.blockers.audio.missing}\n` +
    `- Key Term runtime gaps checked: ` +
    `${plan.blockers.keyTerms.resolutionPlan.targetRuntimeGapCount}\n` +
    `- Frozen ledgers rehashed for Key Terms: ` +
    `${plan.blockers.keyTerms.resolutionPlan.frozenV7V8LedgerFileCount}\n` +
    `- Frozen Key Term path candidates: ` +
    `${plan.blockers.keyTerms.resolutionPlan.frozenV7V8CandidateObjectCount}\n` +
    `- Existing unaccepted DIG review candidates: ` +
    `${plan.blockers.keyTerms.resolutionPlan.existingQuarantineReviewCandidateCount}\n` +
    `- Plan fingerprint: \`${plan.planFingerprintSha256}\`\n\n` +
    `## Admission\n\n` +
    `\`${plan.admissionDecision.outcome}\`. Key Term v2 finds zero frozen-ledger ` +
    `path candidates for all 317 gaps; 316 DIG candidates remain unaccepted review ` +
    `holds and \`Polynomial.swf\` remains unresolved. The 16 MP3 identities, L10 ` +
    `template, original-runtime, renderer, strict-completion, and whole-course adapter ` +
    `gates also remain closed.\n\n` +
    `## Boundary\n\n` +
    `This deterministic successor creates no reviewer task, Phase A/Phase B evidence, ` +
    `production helper, original-runtime session, frozen-object payload read, source ` +
    `promotion, acceptance, integration, release, or publication effect.\n`;
}

function snapshotProjection(snapshot) {
  return Object.fromEntries(Object.keys(snapshot.fixedRecords).sort(compareText)
    .map((key) => [key, binding(snapshot.fixedRecords[key])]));
}

async function assertSnapshotCurrent(snapshot) {
  const current = await readSnapshot(snapshot.projectRoot);
  assert.deepEqual(snapshotProjection(current), snapshotProjection(snapshot),
    "whole-course v7 fixed inputs changed after snapshot");
}

export function parseArguments(args) {
  assert.equal(args.length, 1, "choose exactly one: --write or --check");
  assert.ok(["--write", "--check"].includes(args[0]),
    "only plan write/check modes are supported; apply and runtime modes are forbidden");
  return args[0];
}

async function outputPath(projectRoot, suffix) {
  const root = await canonicalRoot(projectRoot);
  const relative = `${OUTPUT_PREFIX}.${suffix}`;
  const absolute = resolveInsideRoot(root, relative);
  assert.equal(await realpath(path.dirname(absolute)), path.dirname(absolute));
  try {
    const info = await lstat(absolute, {bigint: true});
    assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
    assert.equal(await realpath(absolute), absolute);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return {relative, absolute};
}

export async function writeNoClobber(absolute, contents) {
  await writeFile(absolute, Buffer.from(contents, "utf8"), {
    flag: "wx",
    mode: OUTPUT_MODE,
  });
  const info = await lstat(absolute, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  assert.equal(modeString(info), "0444");
  assert.equal(await realpath(absolute), absolute);
  assert.deepEqual(await readFile(absolute), Buffer.from(contents, "utf8"));
}

async function checkOutput(absolute, contents) {
  const info = await lstat(absolute, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1n);
  assert.equal(modeString(info), "0444");
  assert.equal(await realpath(absolute), absolute);
  assert.deepEqual(await readFile(absolute), Buffer.from(contents, "utf8"));
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(args);
  const snapshot = await readSnapshot(projectRoot);
  const plan = derivePlan(snapshot);
  const json = `${JSON.stringify(plan, null, 2)}\n`;
  const markdown = renderMarkdown(plan);
  await assertSnapshotCurrent(snapshot);
  const jsonOutput = await outputPath(projectRoot, "json");
  const markdownOutput = await outputPath(projectRoot, "md");
  if (mode === "--write") {
    await writeNoClobber(markdownOutput.absolute, markdown);
    await writeNoClobber(jsonOutput.absolute, json);
    await assertSnapshotCurrent(snapshot);
  } else {
    await checkOutput(markdownOutput.absolute, markdown);
    await checkOutput(jsonOutput.absolute, json);
    await assertSnapshotCurrent(snapshot);
  }
  return {mode, plan, outputs: [jsonOutput.relative, markdownOutput.relative]};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ` +
      `${result.outputs.join(" ")}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
