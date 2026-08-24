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
  derivePlan as deriveV5Plan,
  readSnapshot as readV5Snapshot,
  validatePlanV5,
} from "./build-g4-whole-course-batch-integration-plan-v5.mjs";
import {
  deriveReport as deriveKeyTermReport,
  readSnapshot as readKeyTermSnapshot,
  stableJson as stableKeyTermJson,
  validateResolutionPlanV1,
} from "./build-g4-key-term-runtime-resolution-plan-v1.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const OUTPUT_PREFIX =
  "catalog/batches/g4-whole-course-batch-integration-plan-v6";
const OUTPUT_MODE = 0o444;
const SHA256 = /^[a-f0-9]{64}$/u;

const FIXED_INPUTS = Object.freeze({
  predecessorV5Builder: Object.freeze({
    path: "scripts/build-g4-whole-course-batch-integration-plan-v5.mjs",
    bytes: 32_906,
    sha256: "6478b323676fb712456f94ed26288ef7c01b6c785716bbb19ff4a24d6b03dd17",
    mode: "0644",
    kind: "text",
  }),
  predecessorV5Test: Object.freeze({
    path: "scripts/build-g4-whole-course-batch-integration-plan-v5.test.mjs",
    bytes: 7_059,
    sha256: "d130d1650e0370333719b41db9d9d0136bf5a01b61406b91b1ece1b02f9945f8",
    mode: "0644",
    kind: "text",
  }),
  predecessorV5Json: Object.freeze({
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v5.json",
    bytes: 50_640,
    sha256: "55e19f29a2e8705d712cef335c84cb0591276eb3138a82f4cbc336d1dab28e92",
    mode: "0444",
    kind: "json",
  }),
  predecessorV5Markdown: Object.freeze({
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v5.md",
    bytes: 1_010,
    sha256: "5c99f88a1bef733a22cdd4f3d79705617dad19437108810eb8287f7fd89e597b",
    mode: "0444",
    kind: "text",
  }),
  keyTermV1Builder: Object.freeze({
    path: "scripts/build-g4-key-term-runtime-resolution-plan-v1.mjs",
    bytes: 54_320,
    sha256: "19f19d9fe6909076414988e823ff436a9d56903bd9732b86d907c6d073ac64a4",
    mode: "0644",
    kind: "text",
  }),
  keyTermV1Test: Object.freeze({
    path: "scripts/build-g4-key-term-runtime-resolution-plan-v1.test.mjs",
    bytes: 10_521,
    sha256: "1b589ffd8c0707e75eca57d449229aab10a3d2794e35f90785b1135492d95b6f",
    mode: "0644",
    kind: "text",
  }),
  keyTermV1Json: Object.freeze({
    path: "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1.json",
    bytes: 314_850,
    sha256: "66b47caf4822b213066a39885d1258f99054e4c00186835b1086dd303f69faaa",
    mode: "0444",
    kind: "json",
  }),
  keyTermV1Markdown: Object.freeze({
    path: "catalog/source-promotions/g4-key-term-runtime-resolution-plan-v1.md",
    bytes: 1_657,
    sha256: "3cc3da06e390c1cbbc91553984feaf87250ae0265ea349819d8149c7eab8fc71",
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

function validateKeyTermReport(report) {
  assert.equal(validateResolutionPlanV1(report), true);
  assert.equal(report.status,
    "acceptance-neutral-review-batches-prepared-316-holds-polynomial-runtime-unresolved");
  assert.equal(report.declarations.lessonCount, 12);
  assert.equal(report.declarations.declaredDiagramOccurrences, 1515);
  assert.equal(report.declarations.uniqueRuntimeSwfPaths, 760);
  assert.equal(report.canonicalRuntimeEvidence.filesRehashed, 443);
  assert.equal(report.canonicalRuntimeEvidence.runtimeBehaviorVerified, false);
  assert.equal(report.quarantineEvidence.verifiedTreeFilesRehashed, 1594);
  assert.equal(report.quarantineEvidence.verifiedTreeBytesRehashed, 169045760);
  assert.equal(report.resolutionSummary.candidateReviewHolds, 316);
  assert.equal(report.resolutionSummary.caseVariantPlacementReviewHolds, 299);
  assert.equal(report.resolutionSummary.exactPlacementShaReceiptReviewHolds, 17);
  assert.equal(report.resolutionSummary.candidatesWithCompanionFla, 313);
  assert.equal(report.resolutionSummary.runtimeSwfUnresolved, 1);
  assert.equal(report.resolutionSummary.potentialResolvedAfterAllReviewHoldsAccepted,
    759);
  assert.equal(report.resolutionSummary.sourceDependencyClosure, false);
  assert.equal(report.controls.writeOrApplySupported, false);
  assert.equal(report.controls.promotionRecordCount, 0);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
}

function updateKeyTermBlocker(predecessorBlocker, report, fixedBindings) {
  return {
    ...structuredClone(predecessorBlocker),
    dependencyClosureComplete: false,
    resolutionPlan: {
      version: 1,
      mode: report.mode,
      status: report.status,
      artifacts: {
        generator: fixedBindings.keyTermV1Builder,
        tests: fixedBindings.keyTermV1Test,
        json: fixedBindings.keyTermV1Json,
        markdown: fixedBindings.keyTermV1Markdown,
      },
      reportFingerprintSha256: report.reportFingerprintSha256,
      inputSetSha256: report.inputs.inputSetSha256,
      requiredRuntimeSwfCount:
        report.canonicalRuntimeEvidence.requiredRuntimeSwfCount,
      canonicalFilesRehashed: report.canonicalRuntimeEvidence.filesRehashed,
      canonicalBytesRehashed: report.canonicalRuntimeEvidence.bytesRehashed,
      canonicalExactPlacementCount:
        report.canonicalRuntimeEvidence.exactPlacementCount,
      canonicalCaseVariantSameDirectoryCount:
        report.canonicalRuntimeEvidence.caseVariantSameDirectoryCount,
      canonicalUniqueBasenameOtherDirectoryCount:
        report.canonicalRuntimeEvidence.uniqueBasenameOtherDirectoryCount,
      folderZipRehashed: report.quarantineEvidence.folderZipRehashed,
      folderZipSha256: report.quarantineEvidence.folderZipSha256,
      quarantineFilesRehashed:
        report.quarantineEvidence.verifiedTreeFilesRehashed,
      quarantineBytesRehashed:
        report.quarantineEvidence.verifiedTreeBytesRehashed,
      quarantineChecksumSetSha256:
        report.quarantineEvidence.verifiedTreeChecksumSetSha256,
      candidateReviewHolds: report.resolutionSummary.candidateReviewHolds,
      exactPlacementReviewHolds:
        report.resolutionSummary.exactPlacementShaReceiptReviewHolds,
      caseVariantPlacementReviewHolds:
        report.resolutionSummary.caseVariantPlacementReviewHolds,
      candidatesWithCompanionFla:
        report.resolutionSummary.candidatesWithCompanionFla,
      potentialResolvedAfterAllReviewHoldsAccepted:
        report.resolutionSummary.potentialResolvedAfterAllReviewHoldsAccepted,
      runtimeSwfUnresolved: report.resolutionSummary.runtimeSwfUnresolved,
      unresolvedRuntimePath:
        report.reviewBatches.unresolvedRuntime.records[0].expectedRuntimePath,
      companionFlaSha256:
        report.reviewBatches.unresolvedRuntime.records[0].companionFla.sha256,
      companionFlaIsRuntimeSubstitute: false,
      sourceDependencyClosure: false,
      automaticPlacementOrCaseAdmissionAuthorized: false,
      promotionRecordCount: report.controls.promotionRecordCount,
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
      keyTermV1: plan.currentEvidence.keyTermV1.reportFingerprintSha256,
    },
  }));
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const fixedRecords = {};
  for (const [key, specification] of Object.entries(FIXED_INPUTS)) {
    fixedRecords[key] = await readBound(projectRoot, key, specification);
  }

  const [v5Snapshot, keyTermSnapshot] = await Promise.all([
    readV5Snapshot(projectRoot),
    readKeyTermSnapshot(projectRoot),
  ]);
  const liveV5 = deriveV5Plan(v5Snapshot);
  const liveKeyTerm = deriveKeyTermReport(keyTermSnapshot);
  validatePlanV5(liveV5);
  validateKeyTermReport(liveKeyTerm);
  assert.deepEqual(fixedRecords.predecessorV5Json.document, liveV5,
    "checked-in v5 differs from its live deterministic derivation");
  assert.equal(stableKeyTermJson(liveKeyTerm),
    `${JSON.stringify(fixedRecords.keyTermV1Json.document, null, 2)}\n`,
    "checked-in Key Term v1 differs from its live deterministic derivation");
  return {
    projectRoot,
    fixedRecords,
    predecessor: fixedRecords.predecessorV5Json.document,
    keyTerm: fixedRecords.keyTermV1Json.document,
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
  assert.equal(Object.keys(inputBindings).length, 59);

  const plan = {
    ...structuredClone(predecessor),
    schemaVersion: 6,
    planDate: "2026-08-07",
    successorOf: {
      path: FIXED_INPUTS.predecessorV5Json.path,
      bytes: snapshot.fixedRecords.predecessorV5Json.bytes,
      sha256: snapshot.fixedRecords.predecessorV5Json.sha256,
      mode: snapshot.fixedRecords.predecessorV5Json.mode,
      schemaVersion: predecessor.schemaVersion,
      status: predecessor.status,
      planFingerprintSha256: predecessor.planFingerprintSha256,
    },
    blockers: {
      ...structuredClone(predecessor.blockers),
      keyTerms: updateKeyTermBlocker(
        predecessor.blockers.keyTerms,
        snapshot.keyTerm,
        fixedBindings,
      ),
    },
    admissionDecision: {
      ...structuredClone(predecessor.admissionDecision),
      reasons: predecessor.admissionDecision.reasons.map((reason) =>
        reason === "Key Term review holds and Polynomial.swf remain unresolved."
          ? "Key Term v1 rehashed 443 catalog-resolved canonical SWFs, the 92,213,676-byte DIG folder ZIP, and all 1,594 manifest-bound quarantine files; nevertheless 17 exact-placement and 299 case-variant records remain unaccepted review holds, and Polynomial.swf remains unresolved."
          : reason),
    },
    authorityBoundary: {
      ...structuredClone(predecessor.authorityBoundary),
      keyTermV1ClosesRuntimeDependency: false,
      keyTermV1AuthorizesPlacementOrCaseMapping: false,
      keyTermV1AuthorizesPromotion: false,
      keyTermV1AuthorizesRuntimeOrAcceptance: false,
    },
    inputBindings,
    predecessorDisposition: {
      v5: {
        preserved: true,
        modified: false,
        semanticCourseWaveAudioL10AndVb003PlanCarriedForward: true,
        staleKeyTermEvidenceSupersededByRehashedV1: true,
        acceptanceEffect: "none",
      },
      olderHistory: structuredClone(predecessor.predecessorDisposition),
    },
    currentEvidence: {
      ...structuredClone(predecessor.currentEvidence),
      keyTermV1: {
        artifact: fixedBindings.keyTermV1Json,
        status: snapshot.keyTerm.status,
        reportFingerprintSha256: snapshot.keyTerm.reportFingerprintSha256,
        inputSetSha256: snapshot.keyTerm.inputs.inputSetSha256,
        canonicalFilesRehashed:
          snapshot.keyTerm.canonicalRuntimeEvidence.filesRehashed,
        quarantineFilesRehashed:
          snapshot.keyTerm.quarantineEvidence.verifiedTreeFilesRehashed,
        candidateReviewHolds:
          snapshot.keyTerm.resolutionSummary.candidateReviewHolds,
        runtimeSwfUnresolved:
          snapshot.keyTerm.resolutionSummary.runtimeSwfUnresolved,
        sourceDependencyClosure:
          snapshot.keyTerm.resolutionSummary.sourceDependencyClosure,
      },
    },
    inputSetSha256: null,
    planFingerprintSha256: null,
  };
  plan.inputSetSha256 = inputSetSha256(plan);
  plan.planFingerprintSha256 = planFingerprint(plan);
  validatePlanV6(plan);
  return plan;
}

export function validatePlanV6(plan) {
  assertNoUndefined(plan);
  assert.equal(plan.schemaVersion, 6);
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
    strictComplete: plan.courseBaseline.strictCompleteMembers,
  }, {
    lessons: 12,
    pages: 645,
    shells: 12,
    members: 657,
    currentJs: 43,
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
  assert.equal(keyTerms.residualUnresolvedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(keyTerms.dependencyClosureComplete, false);
  assert.equal(keyTerms.resolutionPlan.version, 1);
  assert.equal(keyTerms.resolutionPlan.canonicalFilesRehashed, 443);
  assert.equal(keyTerms.resolutionPlan.canonicalExactPlacementCount, 35);
  assert.equal(keyTerms.resolutionPlan.canonicalCaseVariantSameDirectoryCount, 407);
  assert.equal(keyTerms.resolutionPlan.canonicalUniqueBasenameOtherDirectoryCount, 1);
  assert.equal(keyTerms.resolutionPlan.quarantineFilesRehashed, 1594);
  assert.equal(keyTerms.resolutionPlan.quarantineBytesRehashed, 169045760);
  assert.equal(keyTerms.resolutionPlan.candidateReviewHolds, 316);
  assert.equal(keyTerms.resolutionPlan.exactPlacementReviewHolds, 17);
  assert.equal(keyTerms.resolutionPlan.caseVariantPlacementReviewHolds, 299);
  assert.equal(keyTerms.resolutionPlan.candidatesWithCompanionFla, 313);
  assert.equal(keyTerms.resolutionPlan.potentialResolvedAfterAllReviewHoldsAccepted, 759);
  assert.equal(keyTerms.resolutionPlan.runtimeSwfUnresolved, 1);
  assert.equal(keyTerms.resolutionPlan.companionFlaIsRuntimeSubstitute, false);
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
    "keyTermV1ClosesRuntimeDependency",
    "keyTermV1AuthorizesPlacementOrCaseMapping",
    "keyTermV1AuthorizesPromotion",
    "keyTermV1AuthorizesRuntimeOrAcceptance",
  ]) assert.equal(plan.authorityBoundary[key], false, key);
  assert.deepEqual(Object.keys(plan.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(plan.successorOf.sha256, FIXED_INPUTS.predecessorV5Json.sha256);
  assert.equal(plan.successorOf.planFingerprintSha256,
    "aef901de0ec51d062d8645f9b89e5a836fe469a8574de8d32148f07989c6c30c");
  assert.equal(plan.predecessorDisposition.v5.preserved, true);
  assert.equal(plan.predecessorDisposition.v5.modified, false);
  assert.equal(Object.keys(plan.inputBindings).length, 59);
  assert.ok(Object.values(plan.inputBindings).every((record) =>
    SHA256.test(record.sha256)));
  assert.equal(plan.currentEvidence.keyTermV1.sourceDependencyClosure, false);
  assert.equal(plan.inputSetSha256, inputSetSha256(plan));
  assert.match(plan.planFingerprintSha256, SHA256);
  assert.equal(plan.planFingerprintSha256, planFingerprint(plan));
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  return true;
}

export function renderMarkdown(plan) {
  validatePlanV6(plan);
  return `# Grade 4 Whole-Course Batch Integration Plan v6\n\n` +
    `- Status: \`${plan.status}\`\n` +
    `- Grade 4 denominator: ${plan.courseBaseline.memberCount} members ` +
    `(${plan.courseBaseline.pageCount} pages + ${plan.courseBaseline.shellCount} shells)\n` +
    `- Current JavaScript: ${plan.courseBaseline.currentJsMembers}/${plan.courseBaseline.memberCount}\n` +
    `- Strict complete: ${plan.courseBaseline.strictCompleteMembers}/${plan.courseBaseline.memberCount}\n` +
    `- Waves admitted: ${plan.waveAdmissionCount}/${plan.waves.length}\n` +
    `- L10 template stable: \`${plan.template.templateStable}\`\n` +
    `- Missing Grade 4 MP3s: ${plan.blockers.audio.missing}\n` +
    `- Key Term canonical files rehashed: ` +
    `${plan.blockers.keyTerms.resolutionPlan.canonicalFilesRehashed}\n` +
    `- Key Term quarantine files rehashed: ` +
    `${plan.blockers.keyTerms.resolutionPlan.quarantineFilesRehashed}\n` +
    `- Key Term review holds: ${plan.blockers.keyTerms.resolutionPlan.candidateReviewHolds}\n` +
    `- Key Term runtime SWFs still unresolved: ` +
    `${plan.blockers.keyTerms.resolutionPlan.runtimeSwfUnresolved}\n` +
    `- Plan fingerprint: \`${plan.planFingerprintSha256}\`\n\n` +
    `## Admission\n\n` +
    `\`${plan.admissionDecision.outcome}\`. Key Term v1 strengthens identity evidence but ` +
    `does not accept any of 316 placement/receipt holds; \`Polynomial.swf\` remains absent. ` +
    `The 16 MP3 identities, L10 template, original-runtime, renderer, strict-completion, ` +
    `and whole-course adapter gates also remain closed.\n\n` +
    `## Boundary\n\n` +
    `This deterministic successor creates no reviewer task, Phase A/Phase B evidence, ` +
    `production helper, original-runtime session, source promotion, renderer adoption, ` +
    `acceptance, integration, release, or publication effect.\n`;
}

function snapshotProjection(snapshot) {
  return Object.fromEntries(Object.keys(snapshot.fixedRecords).sort(compareText)
    .map((key) => [key, binding(snapshot.fixedRecords[key])]));
}

async function assertSnapshotCurrent(snapshot) {
  const current = await readSnapshot(snapshot.projectRoot);
  assert.deepEqual(snapshotProjection(current), snapshotProjection(snapshot),
    "whole-course v6 fixed inputs changed after snapshot");
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
