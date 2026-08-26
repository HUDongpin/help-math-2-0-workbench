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

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const OUTPUT_PREFIX =
  "catalog/batches/g4-whole-course-batch-integration-plan-v5";
const OUTPUT_MODE = 0o444;
const SHA256 = /^[a-f0-9]{64}$/u;

const FIXED_INPUTS = Object.freeze({
  predecessorBuilder: {
    path: "scripts/build-g4-whole-course-batch-integration-plan-v4.mjs",
    bytes: 20_300,
    sha256: "fc699488a812582adf28b8b92ff856259cc20b86b72c53fcda1708dfc8c6ac1e",
    mode: "0644",
    kind: "text",
  },
  predecessorTest: {
    path: "scripts/build-g4-whole-course-batch-integration-plan-v4.test.mjs",
    bytes: 5_413,
    sha256: "8b6393ee3fd36b0da2c9f2004a67333021eb0b92e1aca74867ffae049f6533e2",
    mode: "0644",
    kind: "text",
  },
  predecessorJson: {
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v4.json",
    bytes: 49_978,
    sha256: "8b9d42460ec8fee86b0048f5f8d944918cf032f9e736fed5bf59af6f19ecbdd0",
    mode: "0644",
    kind: "json",
  },
  missingMp3V2Builder: {
    path: "scripts/build-g4-missing-mp3-resolution-plan-v2.mjs",
    bytes: 50_165,
    sha256: "64638c28c9c25681b630acc061d94afecbda3f6b1e526c31f83ff6448990b01e",
    mode: "0644",
    kind: "text",
  },
  missingMp3V2Test: {
    path: "scripts/build-g4-missing-mp3-resolution-plan-v2.test.mjs",
    bytes: 7_336,
    sha256: "054c14c02d004e97c882f26478ac166f2fb19beaab231ea7112031b4ab60568b",
    mode: "0644",
    kind: "text",
  },
  missingMp3V2Json: {
    path: "catalog/source-promotions/g4-missing-mp3-resolution-plan-v2.json",
    bytes: 29_878,
    sha256: "237f92f9629c8c4d5bf94c0913b2aa1c59d8bc86d1c731147d78edb6092bebf5",
    mode: "0444",
    kind: "json",
  },
  missingMp3V2Markdown: {
    path: "catalog/source-promotions/g4-missing-mp3-resolution-plan-v2.md",
    bytes: 1_412,
    sha256: "54ca34ae77229c8292443c9234f71d4dcf455a4943a86941c369899d8a22a7ab",
    mode: "0444",
    kind: "text",
  },
  l10V13Builder: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v13.mjs",
    bytes: 28_003,
    sha256: "cc04f930ca84332ac4a0a1ac9e1fccfabdc0178dd6c462be698017f27aac7dd4",
    mode: "0644",
    kind: "text",
  },
  l10V13Test: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v13.test.mjs",
    bytes: 7_599,
    sha256: "3a03fb95ca2b494d7d0759bd9675537637197d49ee1f205cdbaa599da9711669",
    mode: "0644",
    kind: "text",
  },
  l10V13Json: {
    path: "reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.json",
    bytes: 278_558,
    sha256: "fa9719d7950878f4db1b928b9501348b47f37f25273e9459348aeb46f6e1a18b",
    mode: "0444",
    kind: "json",
  },
  l10V13Markdown: {
    path: "reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.md",
    bytes: 1_287,
    sha256: "30e0e34a48b2199bf4c704271d7509a1fbbc08cdbb30c60fc074601470094ffc",
    mode: "0444",
    kind: "text",
  },
  vb003GapV2Builder: {
    path: "scripts/build-g4-l10-vb003-static-specification-gap-closure-v2.mjs",
    bytes: 40_943,
    sha256: "2d0b2d2d430588bd2db7ca4a0ae31aba11deba8181dfa351872f29261815bf01",
    mode: "0644",
    kind: "text",
  },
  vb003GapV2Test: {
    path: "scripts/build-g4-l10-vb003-static-specification-gap-closure-v2.test.mjs",
    bytes: 8_928,
    sha256: "d75f1e1c05f96523d0cc4292ede9ecb5fd40c0490e94d5ad776ccddd9c3f89c1",
    mode: "0644",
    kind: "text",
  },
  vb003GapV2Json: {
    path: "reports/g4-l10-vb003-static-specification-gap-closure-v2.json",
    bytes: 32_678,
    sha256: "ff67deb108f808345b26b45d06f95619f90d84fe2267510e494765511ec8b359",
    mode: "0444",
    kind: "json",
  },
  vb003GapV2Markdown: {
    path: "reports/g4-l10-vb003-static-specification-gap-closure-v2.md",
    bytes: 1_639,
    sha256: "0618b9e0ea6ba8bbeb3139e3f4e41d98d3806fd4a196ddb3f306553d21b1abe8",
    mode: "0444",
    kind: "text",
  },
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

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertNoUndefined(value, location = "$") {
  assert.notEqual(value, undefined, `Undefined value at ${location}`);
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
  assert.ok(before.isFile() && !before.isSymbolicLink());
  assert.equal(before.nlink, 1n);
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
    `${specification.path} byte count drifted`);
  assert.equal(record.sha256, specification.sha256,
    `${specification.path} SHA-256 drifted`);
  assert.equal(record.mode, specification.mode,
    `${specification.path} mode drifted`);
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

function validateV4(plan) {
  assert.equal(plan.schemaVersion, 4);
  assert.equal(plan.artifactType,
    "g4-whole-course-batch-and-atomic-integration-plan");
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.courseBaseline.lessonCount, 12);
  assert.equal(plan.courseBaseline.pageCount, 645);
  assert.equal(plan.courseBaseline.shellCount, 12);
  assert.equal(plan.courseBaseline.memberCount, 657);
  assert.equal(plan.courseBaseline.currentJsMembers, 43);
  assert.equal(plan.courseBaseline.strictCompleteMembers, 0);
  assert.equal(plan.template.contractVersion, 6);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.version, 1);
  assert.equal(plan.waves.length, 4);
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.deepEqual(Object.keys(plan.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(Object.keys(plan.inputBindings).length, 36);
  assert.equal(plan.planFingerprintSha256,
    "2724ae17239cba950f4429339cec4f809615ccffcb2ab50d1318b03ac6ecc1ae");
  assert.equal(planFingerprint(plan), plan.planFingerprintSha256);
  return true;
}

function validateMp3V2(plan) {
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.artifactType, "g4-missing-mp3-resolution-plan-v2");
  assert.equal(plan.status,
    "acceptance-neutral-v7-v8-ledger-exhausted-missing-16-unresolved");
  assert.equal(plan.summary.obligationCount, 16);
  assert.equal(plan.summary.expectedSha256KnownCount, 0);
  assert.equal(plan.summary.expectedSha256UnknownCount, 16);
  assert.equal(plan.summary.v7V8LedgerFileCount, 6060);
  assert.equal(plan.summary.v7V8PathFieldCount, 12120);
  assert.equal(plan.summary.exactCanonicalSuffixMatchCount, 0);
  assert.equal(plan.summary.caseInsensitiveCanonicalSuffixMatchCount, 0);
  assert.equal(plan.summary.basenameMatchCount, 0);
  assert.equal(plan.summary.candidateObjectCount, 0);
  assert.equal(plan.summary.selectedCandidateCount, 0);
  assert.equal(plan.summary.sourceDependencyClosure, false);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
}

function validateL10V13(contract) {
  assert.equal(contract.schemaVersion, 13);
  assert.equal(contract.status, "fail-closed-template-not-stable");
  assert.equal(contract.templateStable, false);
  assert.equal(contract.scope.memberCount, 47);
  assert.equal(contract.currentFormalState.requirements.total, 520);
  assert.equal(contract.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(contract.currentFormalState.requirements.unresolvedFrameDomainDispositions, 74);
  assert.equal(contract.currentFormalState.frameObligations.total, 44488);
  assert.equal(contract.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(contract.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(contract.currentFormalState.originalRuntime.exactAuthorizedMemberCountNow, 0);
  assert.equal(contract.currentFormalState.javascript.registeredFormalRendererCount, 0);
  assert.equal(contract.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(contract.currentFormalState.reviewAndRelease.atomicPublished, false);
  assert.equal(contract.latestSecurityReviewBoundary.activeProtocolVersion, "v2.16");
  assert.equal(contract.latestSecurityReviewBoundary.v216AuthoringStatus,
    "AUTHORING_COMPLETE_INDEPENDENT_REVIEW_NOT_STARTED");
  assert.equal(contract.latestSecurityReviewBoundary.specReviewQualified, false);
  assert.equal(contract.operatorGateSuccessor.decision, "DO_NOT_LAUNCH");
}

function validateVb003V2(report) {
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.status,
    "acceptance-neutral-static-gap-plan-current-tracked-workspace-do-not-apply");
  assert.equal(report.decision, "DO_NOT_APPLY");
  assert.equal(report.workspaceIdentity.trackedFileCount, 37);
  assert.equal(report.workspaceIdentity.scopedStatusAfter, "");
  assert.equal(report.templateCurrentness.templateStable, false);
  assert.equal(report.templateCurrentness.originalRuntimeSessions, 0);
  assert.equal(report.candidatePlanCarryForward.applyAttempted, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const fixedRecords = {};
  for (const [key, specification] of Object.entries(FIXED_INPUTS)) {
    fixedRecords[key] = await readBound(projectRoot, key, specification);
  }
  const predecessor = fixedRecords.predecessorJson.document;
  const mp3 = fixedRecords.missingMp3V2Json.document;
  const l10 = fixedRecords.l10V13Json.document;
  const vb003 = fixedRecords.vb003GapV2Json.document;
  validateV4(predecessor);
  validateMp3V2(mp3);
  validateL10V13(l10);
  validateVb003V2(vb003);
  const inheritedRecords = {};
  for (const [key, specification] of Object.entries(predecessor.inputBindings)) {
    inheritedRecords[key] = await readBound(projectRoot, key, {
      ...specification,
      kind: "binary",
    });
  }
  assert.deepEqual(Object.fromEntries(Object.keys(inheritedRecords).sort()
    .map((key) => [key, binding(inheritedRecords[key])])),
  predecessor.inputBindings);
  return {projectRoot, fixedRecords, inheritedRecords, predecessor, mp3, l10, vb003};
}

function updateTemplate(predecessorTemplate, contract, fixedBindings) {
  const current = contract.currentFormalState;
  const candidateCode = contract.liveWholeLessonClosure.candidateCode;
  return {
    ...structuredClone(predecessorTemplate),
    contractVersion: 13,
    contract: fixedBindings.l10V13Json,
    templateStable: false,
    batchAdmissionAllowed: false,
    downstreamTransactionDecision: "DO_NOT_APPLY",
    recursiveLocalCandidateCodeClosure: {
      records: candidateCode.fullLocalCodeClosure.recordCount,
      sha256: candidateCode.fullLocalCodeClosure.setSha256,
    },
    digestDeclaredRuntimeAssetClosure: {
      records: candidateCode.runtimeAssetClosure.recordCount,
      sha256: candidateCode.runtimeAssetClosure.setSha256,
      digestMismatches: candidateCode.assetDigestMismatchCount,
    },
    rule:
      "L10 remains inside the 657-member denominator and outside all four waves. Exact v13 is current; templateStable is false, v2.16 independent review is not started, Peter Hu is conditionally designated but not activated, original-runtime sessions and formal renderers are zero, strict completion is 0/47, and downstream remains DO_NOT_APPLY.",
    artifacts: {
      generator: fixedBindings.l10V13Builder,
      tests: fixedBindings.l10V13Test,
      json: fixedBindings.l10V13Json,
      markdown: fixedBindings.l10V13Markdown,
    },
    strictCompleteMembers: current.reviewAndRelease.strictCompleteMembers,
    requiredMembers: contract.scope.memberCount,
    published: current.reviewAndRelease.atomicPublished,
    conditionallyDesignatedOperator:
      current.originalRuntime.conditionallyDesignatedOperator,
    operatorDesignationRecorded:
      current.originalRuntime.operatorDesignationRecorded,
    operatorActivated: current.originalRuntime.operatorActivated,
    operatorReady: current.originalRuntime.operatorReady,
    exactConditionallyScopedCaptureKitCount:
      contract.operatorGateSuccessor.exactScope.exactCaptureKitCount,
    exactUnsignedBilingualKitCount:
      current.originalRuntime.exactUnsignedBilingualKits,
    exactAuthorizedMemberCountNow:
      current.originalRuntime.exactAuthorizedMemberCountNow,
    authoritativeRuntimeSessions: current.originalRuntime.runtimeSessions,
    authoritativeCapturedFrames: current.frameObligations.authoritativeCaptured,
    registeredFormalRendererCount:
      current.javascript.registeredFormalRendererCount,
    requirementCount: current.requirements.total,
    naturalScheduleReadyRequirementCount:
      current.requirements.naturalScheduleReady,
    unresolvedFrameDomainDispositionCount:
      current.requirements.unresolvedFrameDomainDispositions,
    activeReviewProtocol:
      contract.latestSecurityReviewBoundary.activeProtocolVersion,
    independentReviewStatus:
      contract.latestSecurityReviewBoundary.v216AuthoringStatus,
    specReviewQualified:
      contract.latestSecurityReviewBoundary.specReviewQualified,
  };
}

function updateAudioBlocker(predecessorAudio, mp3, fixedBindings) {
  return {
    ...structuredClone(predecessorAudio),
    expectedSha256KnownForAllMissing: false,
    dependencyClosureComplete: false,
    resolutionPlan: {
      version: 2,
      artifacts: {
        generator: fixedBindings.missingMp3V2Builder,
        tests: fixedBindings.missingMp3V2Test,
        json: fixedBindings.missingMp3V2Json,
        markdown: fixedBindings.missingMp3V2Markdown,
      },
      obligationCount: mp3.summary.obligationCount,
      expectedSha256KnownCount: mp3.summary.expectedSha256KnownCount,
      expectedSha256UnknownCount: mp3.summary.expectedSha256UnknownCount,
      frozenV7V8LedgerFileCount: mp3.summary.v7V8LedgerFileCount,
      frozenV7V8PathFieldCount: mp3.summary.v7V8PathFieldCount,
      exactCanonicalSuffixMatchCount:
        mp3.summary.exactCanonicalSuffixMatchCount,
      caseInsensitiveCanonicalSuffixMatchCount:
        mp3.summary.caseInsensitiveCanonicalSuffixMatchCount,
      basenameMatchCount: mp3.summary.basenameMatchCount,
      candidateObjectCount: mp3.summary.candidateObjectCount,
      selectedCandidateCount: mp3.summary.selectedCandidateCount,
      promotionRecordCount: mp3.summary.promotionRecordCount,
      sourceDependencyClosure: mp3.summary.sourceDependencyClosure,
      unionDigestSetSha256:
        mp3.frozenLedgerEvidence.union.digestSetSha256,
      privatePathProjectionSha256:
        mp3.frozenLedgerEvidence.privatePathProjectionSha256,
      acceptanceEffect: "none",
    },
  };
}

function inputSetSha256(plan) {
  return sha256(canonicalJson({
    inputBindings: plan.inputBindings,
    predecessorFingerprint: plan.successorOf.planFingerprintSha256,
    mp3Fingerprint:
      plan.currentEvidence.missingMp3V2.reportFingerprintSha256,
    l10Fingerprint: plan.currentEvidence.l10V13.reportFingerprintSha256,
    vb003Fingerprint: plan.currentEvidence.vb003GapV2.reportFingerprintSha256,
  }));
}

export function derivePlan(snapshot) {
  const fixedBindings = Object.fromEntries(Object.keys(snapshot.fixedRecords).sort()
    .map((key) => [key, binding(snapshot.fixedRecords[key])]));
  const inheritedBindings = Object.fromEntries(Object.keys(snapshot.inheritedRecords).sort()
    .map((key) => [key, binding(snapshot.inheritedRecords[key])]));
  const predecessor = snapshot.predecessor;
  const plan = {
    schemaVersion: 5,
    artifactType: predecessor.artifactType,
    planDate: "2026-08-07",
    status: "planned-not-admitted-not-executable",
    planOnly: true,
    executable: false,
    executorPresent: false,
    waveAdmissionCount: 0,
    template: updateTemplate(predecessor.template, snapshot.l10, fixedBindings),
    courseBaseline: structuredClone(predecessor.courseBaseline),
    lessonGateDag: structuredClone(predecessor.lessonGateDag),
    lessons: structuredClone(predecessor.lessons),
    waves: structuredClone(predecessor.waves),
    waveMembership: structuredClone(predecessor.waveMembership),
    blockers: {
      ...structuredClone(predecessor.blockers),
      audio: updateAudioBlocker(predecessor.blockers.audio, snapshot.mp3,
        fixedBindings),
    },
    atomicWholeCourseIntegration:
      structuredClone(predecessor.atomicWholeCourseIntegration),
    admissionDecision: {
      outcome: "ZERO-WAVES-ADMITTED",
      reasons: [
        "L10 v13 remains templateStable=false with 0 original-runtime sessions, 0 authoritative captured frames, 0 registered formal renderers, 0/47 strict-complete members, and v2.16 independent review not started.",
        "The exact missing-MP3 v2 successor rehashed all 6,060 frozen ledger files and scanned 12,120 private path fields but found zero candidates; all 16 expected SHA-256 identities remain unknown and source dependency closure is false.",
        "VB003 is tracked-clean across 37 ordinary files, but its five static candidate changes remain DO_NOT_APPLY and create no runtime or renderer authority.",
        "Key Term review holds and Polynomial.swf remain unresolved.",
        "10 Grade 4 lesson release definitions are absent.",
        "Strict completion is 0 and the whole-course trust adapter does not exist.",
        "Current publisher behavior still lacks an enforced whole-course 0-or-12 invariant.",
      ],
      mayStartRendererBatch: false,
      mayIntegrateCourse: false,
      mayPublishAnyLessonFromWave: false,
    },
    authorityBoundary: {
      ...structuredClone(predecessor.authorityBoundary),
      L10V13CurrentIsTemplateStable: false,
      missingMp3V2ClosesDependency: false,
      v7V8LedgerCandidateCount: 0,
      vb003GapV2AppliesCandidatePatch: false,
      v216IndependentReviewStarted: false,
      v216SpecReviewQualified: false,
      planMayCreateReviewTasks: false,
      planMayRunPhaseAOrPhaseB: false,
      planMayImplementOrTestProductionHelper: false,
      planMayExecuteOriginalRuntime: false,
      planMayApplySourcePromotion: false,
      planMayStartBatch: false,
      planMayIntegrateOrPublish: false,
    },
    acceptanceEffects: Object.fromEntries(ACCEPTANCE_KEYS.map((key) =>
      [key, false])),
    inputBindings: {
      ...inheritedBindings,
      ...fixedBindings,
    },
    successorOf: {
      ...fixedBindings.predecessorJson,
      schemaVersion: predecessor.schemaVersion,
      status: predecessor.status,
      planFingerprintSha256: predecessor.planFingerprintSha256,
    },
    predecessorDisposition: {
      v4: {
        preserved: true,
        modified: false,
        semanticCourseAndWavePlanCarriedForward: true,
        staleL10V6AndMissingMp3V1CurrentnessSuperseded: true,
        acceptanceEffect: "none",
      },
      olderHistory: structuredClone(predecessor.predecessorDisposition),
    },
    currentEvidence: {
      missingMp3V2: {
        artifact: fixedBindings.missingMp3V2Json,
        status: snapshot.mp3.status,
        reportFingerprintSha256: snapshot.mp3.reportFingerprintSha256,
        inputSetSha256: snapshot.mp3.inputSetSha256,
      },
      l10V13: {
        artifact: fixedBindings.l10V13Json,
        status: snapshot.l10.status,
        templateStable: snapshot.l10.templateStable,
        reportFingerprintSha256: snapshot.l10.reportFingerprintSha256,
      },
      vb003GapV2: {
        artifact: fixedBindings.vb003GapV2Json,
        status: snapshot.vb003.status,
        decision: snapshot.vb003.decision,
        trackedWorkspaceSetSha256:
          snapshot.vb003.workspaceIdentity.trackedWorkspaceSetSha256,
        reportFingerprintSha256: snapshot.vb003.reportFingerprintSha256,
      },
    },
    inputSetSha256: null,
  };
  plan.inputSetSha256 = inputSetSha256(plan);
  plan.planFingerprintSha256 = planFingerprint(plan);
  validatePlanV5(plan);
  return plan;
}

export function validatePlanV5(plan) {
  assertNoUndefined(plan);
  assert.equal(plan.schemaVersion, 5);
  assert.equal(plan.artifactType,
    "g4-whole-course-batch-and-atomic-integration-plan");
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.courseBaseline.lessonCount, 12);
  assert.equal(plan.courseBaseline.pageCount, 645);
  assert.equal(plan.courseBaseline.shellCount, 12);
  assert.equal(plan.courseBaseline.memberCount, 657);
  assert.equal(plan.courseBaseline.currentJsMembers, 43);
  assert.equal(plan.courseBaseline.strictCompleteMembers, 0);
  assert.equal(plan.template.contractVersion, 13);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.authoritativeRuntimeSessions, 0);
  assert.equal(plan.template.authoritativeCapturedFrames, 0);
  assert.equal(plan.template.registeredFormalRendererCount, 0);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.template.exactAuthorizedMemberCountNow, 0);
  assert.equal(plan.template.activeReviewProtocol, "v2.16");
  assert.equal(plan.template.specReviewQualified, false);
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.version, 2);
  assert.equal(plan.blockers.audio.resolutionPlan.frozenV7V8LedgerFileCount, 6060);
  assert.equal(plan.blockers.audio.resolutionPlan.frozenV7V8PathFieldCount, 12120);
  assert.equal(plan.blockers.audio.resolutionPlan.candidateObjectCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.expectedSha256UnknownCount, 16);
  assert.equal(plan.blockers.audio.resolutionPlan.sourceDependencyClosure, false);
  assert.equal(plan.waves.length, 4);
  assert.ok(plan.waves.every((wave) =>
    wave.admissionStatus === "planned-not-admitted" &&
    wave.admittedLessonCount === 0 && wave.executable === false));
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
  assert.equal(plan.admissionDecision.mayStartRendererBatch, false);
  assert.equal(plan.admissionDecision.mayIntegrateCourse, false);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.authorityBoundary.L10V13CurrentIsTemplateStable, false);
  assert.equal(plan.authorityBoundary.missingMp3V2ClosesDependency, false);
  assert.equal(plan.authorityBoundary.v7V8LedgerCandidateCount, 0);
  assert.equal(plan.authorityBoundary.vb003GapV2AppliesCandidatePatch, false);
  assert.equal(plan.authorityBoundary.v216IndependentReviewStarted, false);
  assert.equal(plan.authorityBoundary.v216SpecReviewQualified, false);
  for (const key of [
    "planMayCreateReviewTasks",
    "planMayRunPhaseAOrPhaseB",
    "planMayImplementOrTestProductionHelper",
    "planMayExecuteOriginalRuntime",
    "planMayApplySourcePromotion",
    "planMayStartBatch",
    "planMayIntegrateOrPublish",
  ]) assert.equal(plan.authorityBoundary[key], false, key);
  assert.deepEqual(Object.keys(plan.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(plan.successorOf.sha256, FIXED_INPUTS.predecessorJson.sha256);
  assert.equal(plan.successorOf.planFingerprintSha256,
    "2724ae17239cba950f4429339cec4f809615ccffcb2ab50d1318b03ac6ecc1ae");
  assert.equal(plan.predecessorDisposition.v4.preserved, true);
  assert.equal(plan.predecessorDisposition.v4.modified, false);
  assert.equal(Object.keys(plan.inputBindings).length, 51);
  assert.ok(Object.values(plan.inputBindings).every((record) =>
    SHA256.test(record.sha256)));
  assert.equal(plan.inputSetSha256, inputSetSha256(plan));
  assert.ok(SHA256.test(plan.planFingerprintSha256));
  assert.equal(plan.planFingerprintSha256, planFingerprint(plan));
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  return true;
}

export function renderMarkdown(plan) {
  validatePlanV5(plan);
  return `# Grade 4 Whole-Course Batch Integration Plan v5\n\n` +
    `- Status: \`${plan.status}\`\n` +
    `- Grade 4 denominator: ${plan.courseBaseline.memberCount} members ` +
    `(${plan.courseBaseline.pageCount} pages + ${plan.courseBaseline.shellCount} shells)\n` +
    `- Current JavaScript: ${plan.courseBaseline.currentJsMembers}/${plan.courseBaseline.memberCount}\n` +
    `- Strict complete: ${plan.courseBaseline.strictCompleteMembers}/${plan.courseBaseline.memberCount}\n` +
    `- Waves admitted: ${plan.waveAdmissionCount}/${plan.waves.length}\n` +
    `- L10 template version: ${plan.template.contractVersion}\n` +
    `- L10 template stable: \`${plan.template.templateStable}\`\n` +
    `- L10 original-runtime sessions: ${plan.template.authoritativeRuntimeSessions}\n` +
    `- L10 formal renderers: ${plan.template.registeredFormalRendererCount}\n` +
    `- Missing Grade 4 MP3s: ${plan.blockers.audio.missing}\n` +
    `- Frozen ledgers rehashed: ${plan.blockers.audio.resolutionPlan.frozenV7V8LedgerFileCount}\n` +
    `- Frozen-ledger MP3 candidates: ${plan.blockers.audio.resolutionPlan.candidateObjectCount}\n` +
    `- Plan fingerprint: \`${plan.planFingerprintSha256}\`\n\n` +
    `## Admission\n\n` +
    `\`${plan.admissionDecision.outcome}\`. L10 v13 remains fail-closed, all 16 ` +
    `missing MP3 identities remain unknown after the complete frozen-ledger scan, ` +
    `VB003 remains DO_NOT_APPLY, and no whole-course trust adapter exists.\n\n` +
    `## Boundary\n\n` +
    `This is a deterministic planning successor only. It creates no reviewer task, ` +
    `Phase A/Phase B evidence, production helper, original-runtime session, source ` +
    `promotion, renderer adoption, acceptance, integration, release, or publication effect.\n`;
}

function snapshotProjection(snapshot) {
  return {
    fixed: Object.fromEntries(Object.keys(snapshot.fixedRecords).sort()
      .map((key) => [key, binding(snapshot.fixedRecords[key])])),
    inherited: Object.fromEntries(Object.keys(snapshot.inheritedRecords).sort()
      .map((key) => [key, binding(snapshot.inheritedRecords[key])])),
  };
}

async function assertSnapshotCurrent(snapshot) {
  const current = await readSnapshot(snapshot.projectRoot);
  assert.deepEqual(snapshotProjection(current), snapshotProjection(snapshot),
    "whole-course v5 inputs changed after snapshot");
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
