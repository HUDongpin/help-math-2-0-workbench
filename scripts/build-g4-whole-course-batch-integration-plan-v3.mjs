#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, open, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {checkCompletionLedger} from "./build-completion-ledger.mjs";
import {checkLessonReleaseLedger} from "./build-lesson-release-ledger.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const OUTPUT_PATH =
  "catalog/batches/g4-whole-course-batch-integration-plan-v3.json";
const L10_RELEASE_ID = "lesson-g04-l10-perimeter-area";

const V2_ARTIFACTS = Object.freeze({
  predecessorV2Generator: Object.freeze({
    path: "scripts/build-g4-whole-course-batch-integration-plan-v2.mjs",
    kind: "text",
    bytes: 15_485,
    sha256:
      "4d3e691612b51d4c0d663702170740a86fe8708ac7366c0a5b2c3d6f41e9532f",
    mode: "0644",
  }),
  predecessorV2Tests: Object.freeze({
    path: "scripts/build-g4-whole-course-batch-integration-plan-v2.test.mjs",
    kind: "text",
    bytes: 5_693,
    sha256:
      "769f7df9c9761e466b2eba2c3906da0daff62ae2c2019c8e9b61a193c232632b",
    mode: "0644",
  }),
  predecessorV2Json: Object.freeze({
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v2.json",
    kind: "json",
    bytes: 32_127,
    sha256:
      "b96f8b3d872d91f77432ecb23954c5e36afbdef41241ba203c3be6937cd31f7c",
    mode: "0644",
  }),
});

const CURRENT_LEDGER_EPOCH = Object.freeze({
  completionLedger: Object.freeze({
    path: "catalog/completion-ledger.json",
    kind: "json",
    bytes: 122_550,
    sha256:
      "3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db",
    mode: "0644",
  }),
  releaseLedger: Object.freeze({
    path: "catalog/lesson-release-ledger.json",
    kind: "json",
    bytes: 102_724,
    sha256:
      "1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc",
    mode: "0644",
  }),
});

const AUTHORITATIVE_ENTRYPOINTS = Object.freeze({
  authoritativeCompletionLedgerGenerator: Object.freeze({
    path: "scripts/build-completion-ledger.mjs",
    kind: "text",
    bytes: 10_642,
    sha256:
      "922e8bf742c6916e492163b0c4787a71365d1d83177c02ad810b8f2f2fbd6ca0",
    mode: "0644",
  }),
  authoritativeLessonReleaseLedgerGenerator: Object.freeze({
    path: "scripts/build-lesson-release-ledger.mjs",
    kind: "text",
    bytes: 22_577,
    sha256:
      "c1881ab81ea897d3ac616abdf590644d9e773ccd47d1b810808160f153148a50",
    mode: "0644",
  }),
  authoritativeMigrationValidator: Object.freeze({
    path: "skills/flash-to-js/scripts/validate_migration.mjs",
    kind: "text",
    bytes: 165_346,
    sha256:
      "fdf214b3accf42d6801231bc4c6b5dd6ae9de32e7cb89f1f471ca838bc64d36d",
    mode: "0644",
  }),
});

const L10_V5_ARTIFACTS = Object.freeze({
  l10V5Generator: Object.freeze({
    path: "scripts/build-g4-l10-complete-migration-template-contract-v5.mjs",
    kind: "text",
    bytes: 39_219,
    sha256:
      "a983c289bc54aeedc2c1604bc5f72cb243406dc35e5be2177c6224de5e0bcc61",
    mode: "0644",
  }),
  l10V5Tests: Object.freeze({
    path: "scripts/build-g4-l10-complete-migration-template-contract-v5.test.mjs",
    kind: "text",
    bytes: 8_488,
    sha256:
      "b0cdb2831ed8cbe2386e87d5ca3e7f1a5554743f55ae53601afa18110464b92a",
    mode: "0644",
  }),
  l10V5Json: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.json",
    kind: "json",
    bytes: 228_467,
    sha256:
      "b4777628d6433241c247c1e3c4236becadd3b4b66e03585f51a81babd5fbeef9",
    mode: "0644",
  }),
  l10V5Markdown: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.md",
    kind: "text",
    bytes: 63_074,
    sha256:
      "4acf3e17800365cbae4dbc2aca69f24a0baeb28fdb3fb9ffa552b8a6e51bf142",
    mode: "0644",
  }),
});

const MISSING_MP3_ARTIFACTS = Object.freeze({
  missingMp3Generator: Object.freeze({
    path: "scripts/build-g4-missing-mp3-resolution-plan-v1.mjs",
    kind: "text",
    bytes: 44_727,
    sha256:
      "d66f099bbcccf7e939914f184532eff9f4023880b20e7e20dacf7456fc96c8e8",
    mode: "0644",
  }),
  missingMp3Tests: Object.freeze({
    path: "scripts/build-g4-missing-mp3-resolution-plan-v1.test.mjs",
    kind: "text",
    bytes: 11_219,
    sha256:
      "9245b4bde23a8af5e9a81c5419b696ce431b9a474c02dfd4a4435ef327b29778",
    mode: "0644",
  }),
  missingMp3Json: Object.freeze({
    path: "catalog/source-promotions/g4-missing-mp3-resolution-plan-v1.json",
    kind: "json",
    bytes: 41_768,
    sha256:
      "1ae71b2ef098dde37885c89f351e55d29e2ee6d80140b2c6335c99e238b649fd",
    mode: "0644",
  }),
  missingMp3Markdown: Object.freeze({
    path: "catalog/source-promotions/g4-missing-mp3-resolution-plan-v1.md",
    kind: "text",
    bytes: 7_685,
    sha256:
      "e3e5eb78fa96ceb2230afc2f1d13aabfeff16dc61ac2120eeff47159b36655a7",
    mode: "0644",
  }),
});

const OLD_V2_LEDGER_SHA256 = Object.freeze({
  completionLedger:
    "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
  releaseLedger:
    "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
});

const REQUIRED_RECOVERY_STATES = Object.freeze([
  "blocked-expected-identity-unknown",
  "blocked-exact-bytes-not-found-in-checked-scopes",
  "candidate-only-pending-provenance-review",
  "eligible-for-new-successor-plan",
]);

const EXPECTED_ACCEPTANCE_EFFECT_KEYS = Object.freeze([
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

const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

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

function planFingerprint(plan) {
  const projection = structuredClone(plan);
  delete projection.planFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Backslash path is forbidden: ${relativePath}`);
  assert.equal(path.posix.normalize(relativePath), relativePath,
    `Path is not normalized: ${relativePath}`);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`),
    `Path escapes project root: ${relativePath}`);
  return absolute;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

function inferredKind(relativePath) {
  return relativePath.endsWith(".json") ? "json" : "text";
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${specification.path} must be one ordinary non-linked file`);
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const opened = await handle.stat({bigint: true});
    assert.equal(statIdentity(opened), statIdentity(before),
      `${specification.path} changed before read`);
    const bytes = await handle.readFile();
    const [afterOpen, afterPath] = await Promise.all([
      handle.stat({bigint: true}),
      lstat(absolute, {bigint: true}),
    ]);
    assert.equal(statIdentity(afterOpen), statIdentity(opened),
      `${specification.path} changed while open`);
    assert.equal(statIdentity(afterPath), statIdentity(opened),
      `${specification.path} path identity changed while read`);
    assert.equal(BigInt(bytes.length), opened.size,
      `${specification.path} size changed while read`);
    const digest = sha256(bytes);
    const mode = Number(opened.mode & 0o777n).toString(8).padStart(4, "0");
    if (Number.isInteger(specification.bytes)) {
      assert.equal(bytes.length, specification.bytes,
        `${specification.path} fixed byte count drifted`);
    }
    if (specification.sha256) {
      assert.equal(digest, specification.sha256,
        `${specification.path} fixed SHA-256 epoch drifted`);
    }
    if (specification.mode) {
      assert.equal(mode, specification.mode,
        `${specification.path} mode drifted`);
    }
    const record = {
      key,
      path: specification.path,
      kind: specification.kind ?? inferredKind(specification.path),
      bytes: bytes.length,
      sha256: digest,
      mode,
      statIdentity: statIdentity(opened),
      text: bytes.toString("utf8"),
    };
    if (record.kind === "json") record.document = JSON.parse(record.text);
    return record;
  } finally {
    await handle.close();
  }
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function validateV2Document(v2) {
  assert.equal(v2.schemaVersion, 2);
  assert.equal(v2.artifactType,
    "g4-whole-course-batch-and-atomic-integration-plan");
  assert.equal(v2.status, "planned-not-admitted-not-executable");
  assert.equal(v2.planOnly, true);
  assert.equal(v2.executable, false);
  assert.equal(v2.executorPresent, false);
  assert.equal(v2.waveAdmissionCount, 0);
  assert.equal(v2.planFingerprintSha256,
    "b9f47bf97d78181de917cb81f7b9cd18775e4efdb929d663a1b089dca4853617");
  assert.equal(v2.planFingerprintSha256, planFingerprint(v2));
  assert.equal(Object.keys(v2.inputBindings).length, 17);
  assert.equal(v2.inputBindings.completionLedger.sha256,
    OLD_V2_LEDGER_SHA256.completionLedger);
  assert.equal(v2.inputBindings.releaseLedger.sha256,
    OLD_V2_LEDGER_SHA256.releaseLedger);
  assert.equal(v2.template.contractVersion, 4);
  assert.equal(v2.template.templateStable, false);
  assert.equal(v2.template.batchAdmissionAllowed, false);
  assert.equal(v2.template.downstreamTransactionDecision, "DO_NOT_APPLY");
  assert.equal(v2.waveMembership.uniqueLessonCount, 11);
  assert.equal(v2.waveMembership.subtotal.members, 610);
  assert.equal(v2.waves.length, 4);
  assert.ok(v2.waves.every((wave) =>
    wave.admittedLessonCount === 0 &&
    wave.executable === false &&
    wave.executorPresent === false));
  assert.equal(v2.atomicWholeCourseIntegration
    .currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.equal(v2.atomicWholeCourseIntegration.currentPlatformRisk.futureRiskClosed,
    false);
  assert.deepEqual(Object.keys(v2.acceptanceEffects),
    EXPECTED_ACCEPTANCE_EFFECT_KEYS);
  assert.ok(Object.values(v2.acceptanceEffects).every((value) => value === false));
}

export function validateEpochTransition(oldBindings, currentBindings) {
  const oldKeys = Object.keys(oldBindings).sort();
  const currentKeys = Object.keys(currentBindings).sort();
  assert.deepEqual(currentKeys, oldKeys,
    "Rehydrated v2 semantic binding key set changed");
  const mismatches = oldKeys.filter((key) => {
    const oldBinding = oldBindings[key];
    const current = currentBindings[key];
    return oldBinding.path !== current.path ||
      oldBinding.bytes !== current.bytes ||
      oldBinding.sha256 !== current.sha256 ||
      oldBinding.mode !== current.mode;
  });
  assert.deepEqual(mismatches, ["completionLedger", "releaseLedger"],
    "V2 semantic hydration permits exactly the two lawful ledger replacements");
  for (const key of mismatches) {
    assert.equal(oldBindings[key].path, currentBindings[key].path,
      `${key} replacement path changed`);
    assert.equal(oldBindings[key].bytes, currentBindings[key].bytes,
      `${key} lawful rebuild must preserve the fixed byte count in this epoch`);
    assert.notEqual(oldBindings[key].sha256, currentBindings[key].sha256,
      `${key} did not advance beyond the stale v2 ledger epoch`);
    assert.equal(currentBindings[key].sha256, CURRENT_LEDGER_EPOCH[key].sha256,
      `${key} current SHA-256 does not match the reviewed successor epoch`);
  }
  return {
    oldBindingCount: oldKeys.length,
    currentBindingCount: currentKeys.length,
    replacementCount: mismatches.length,
    replacedKeys: mismatches,
    nonLedgerBindingsExact: true,
    oldFixedEpochCurrent: false,
    legacyV1V2ReaderOrCheckInvoked: false,
    rule:
      "V3 parses the exact preserved v2 JSON and rehydrates its 17 semantic bindings directly. It does not invoke v1/v2 snapshot readers or checks; exactly the two lawfully rebuilt ledgers may differ.",
  };
}

async function readV2SemanticRecords(projectRoot, v2Document) {
  const records = await Promise.all(Object.entries(v2Document.inputBindings)
    .map(([key, oldBinding]) => readStable(projectRoot, key,
      CURRENT_LEDGER_EPOCH[key] ?? {
        ...oldBinding,
        kind: inferredKind(oldBinding.path),
      })));
  const byKey = Object.fromEntries(records.map((record) => [record.key, record]));
  const currentBindings = Object.fromEntries(Object.keys(byKey).sort()
    .map((key) => [key, binding(byKey[key])]));
  const transition = validateEpochTransition(
    v2Document.inputBindings,
    currentBindings,
  );
  return {records: byKey, currentBindings, transition};
}

function validateL10V5(document) {
  assert.equal(document.schemaVersion, 5);
  assert.equal(document.status, "fail-closed-template-not-stable");
  assert.equal(document.templateStable, false);
  assert.equal(document.currentLedgerFreshness?.status,
    "current-authoritative-generator-proven");
  assert.equal(document.currentFormalState?.reviewAndRelease?.strictCompleteMembers, 0);
  assert.equal(document.currentFormalState?.reviewAndRelease?.published, false);
  assert.equal(document.currentFormalState?.reviewAndRelease?.atomicPublished, false);
  assert.equal(document.currentLedgerFreshness?.proof?.release?.l10
    ?.expectedMemberCount, 47);
  assert.equal(document.currentLedgerFreshness?.proof?.release?.l10
    ?.strictCompleteCount, 0);
  assert.equal(document.currentLedgerFreshness?.proof?.release?.l10?.published, false);
  assert.equal(document.downstreamTransactionBoundary?.decision, "DO_NOT_APPLY");
  assert.equal(document.automationBoundary?.templateBatchAdmissionAllowed, false);
  assert.equal(document.automationBoundary?.remainingGrade4LessonBatchStartAllowed,
    false);
  assert.equal(document.automationBoundary?.wholeCourseIntegrationAllowed, false);
  assert.equal(document.downstreamTransactionBoundary?.nativeHelperV2SecurityDesign
    ?.exactContractBound, false);
  assert.equal(document.downstreamTransactionBoundary?.nativeHelperV2SecurityDesign
    ?.implementationSourceBound, false);
  assert.equal(document.downstreamTransactionBoundary?.nativeHelperV2SecurityDesign
    ?.helperBinaryBound, false);
  assert.ok(Object.values(document.acceptanceEffects)
    .every((value) => value === false));
}

function validateMissingMp3Plan(document) {
  assert.equal(document.schemaVersion,
    "help-math-g4-missing-mp3-resolution-plan/v1");
  assert.equal(document.artifactType, "g4-missing-mp3-resolution-plan-v1");
  assert.equal(document.status,
    "acceptance-neutral-required-sources-unresolved");
  assert.equal(document.mode, "resolution-plan-only-no-executor");
  assert.equal(document.summary?.obligationCount, 16);
  assert.equal(document.summary?.expectedSha256KnownCount, 0);
  assert.equal(document.summary?.expectedSha256UnknownCount, 16);
  assert.equal(document.summary?.basenameObservedCount, 14);
  assert.equal(document.summary?.basenameNotObservedCount, 2);
  assert.equal(document.summary?.selectedCandidateCount, 0);
  assert.equal(document.summary?.promotionRecordCount, 0);
  assert.equal(document.summary?.executorPresent, false);
  assert.equal(document.acceptanceEffects?.sourceDependencyClosure, false);
  assert.equal(document.controls?.executable, false);
  assert.equal(document.controls?.executorPresent, false);
  assert.equal(document.controls?.writeOrApplySupported, false);
  assert.deepEqual(document.recoveryProtocol.map(({state}) => state),
    REQUIRED_RECOVERY_STATES);
  assert.ok(document.recoveryProtocol.every(({promotionEffect}) =>
    promotionEffect === false));
  assert.ok(document.obligations.every((obligation) =>
    obligation.expectedSha256 === null &&
    obligation.selectedCandidate === null));
}

export function validateAuthoritativeLedgerChecks({
  completionCheck,
  releaseCheck,
  completionRecord,
  releaseRecord,
  lessonReleases,
}) {
  for (const [label, check, record, epoch] of [
    ["completion", completionCheck, completionRecord,
      CURRENT_LEDGER_EPOCH.completionLedger],
    ["release", releaseCheck, releaseRecord,
      CURRENT_LEDGER_EPOCH.releaseLedger],
  ]) {
    assert.equal(check?.ok, true, `${label} ledger authoritative check failed`);
    assert.equal(check?.reason, "current", `${label} ledger is stale`);
    assert.equal(check.actual, check.expected,
      `${label} ledger expected/actual bytes differ`);
    assert.equal(check.actual, record.text,
      `${label} checker did not validate the exact bound ledger bytes`);
    assert.equal(Buffer.byteLength(check.actual), epoch.bytes,
      `${label} authoritative bytes drifted`);
    assert.equal(sha256(check.actual), epoch.sha256,
      `${label} authoritative SHA-256 drifted`);
    assert.deepEqual(check.ledger, record.document,
      `${label} authoritative document differs from bound bytes`);
  }

  const grade4Releases = lessonReleases.releases.filter(({grade}) => grade === 4);
  const grade4MemberIds = new Set(grade4Releases.flatMap(({members}) =>
    members.map(({animationId}) => animationId)));
  const l10Definition = grade4Releases.find(({releaseId}) =>
    releaseId === L10_RELEASE_ID);
  assert.ok(l10Definition, `Missing ${L10_RELEASE_ID} release definition`);
  const l10Ids = new Set(l10Definition.members.map(({animationId}) => animationId));
  const l10State = releaseCheck.ledger.releases.find(({releaseId}) =>
    releaseId === L10_RELEASE_ID);
  assert.ok(l10State, `Missing ${L10_RELEASE_ID} authoritative release state`);

  const proof = {
    proofKind: "authoritative-generator-recomputation-and-exact-byte-equality",
    codeBindingBoundary: {
      scope: "direct-entrypoints-only-not-transitive-semantic-code-closure",
      recursiveLocalDependenciesHashBound: false,
      packageRuntimeProvenanceBound: false,
      liveAuthoritativeFunctionsExecuted: true,
      acceptanceEffect: "none",
    },
    completion: {
      checkerExport: "checkCompletionLedger",
      ok: completionCheck.ok,
      reason: completionCheck.reason,
      actualEqualsExpected: true,
      bytes: Buffer.byteLength(completionCheck.actual),
      sha256: sha256(completionCheck.actual),
      generatedMarker: completionCheck.ledger.generatedMarker,
      migrationDirectories: completionCheck.ledger.summary.migrationDirectories,
      strictComplete: completionCheck.ledger.summary.strictComplete,
      grade4StrictComplete: completionCheck.ledger.entries.filter(({animationId}) =>
        grade4MemberIds.has(animationId)).length,
      l10StrictComplete: completionCheck.ledger.entries.filter(({animationId}) =>
        l10Ids.has(animationId)).length,
    },
    release: {
      checkerExport: "checkLessonReleaseLedger",
      ok: releaseCheck.ok,
      reason: releaseCheck.reason,
      actualEqualsExpected: true,
      bytes: Buffer.byteLength(releaseCheck.actual),
      sha256: sha256(releaseCheck.actual),
      generatedMarker: releaseCheck.ledger.generatedMarker,
      releaseCount: releaseCheck.ledger.summary.releaseCount,
      publishedReleaseCount: releaseCheck.ledger.summary.publishedReleaseCount,
      grade4ReleaseCount: grade4Releases.length,
      grade4PublishedReleaseCount: releaseCheck.ledger.releases.filter(
        ({grade, published}) => grade === 4 && published).length,
      l10: {
        releaseId: l10State.releaseId,
        expectedMemberCount: l10State.expectedMemberCount,
        strictCompleteCount: l10State.strictCompleteCount,
        missingCount: l10State.missingCount,
        assetMismatchCount: l10State.assetMismatchCount,
        published: l10State.published,
        status: l10State.status,
      },
    },
  };
  assert.equal(proof.completion.migrationDirectories, 215);
  assert.equal(proof.completion.strictComplete, 0);
  assert.equal(proof.completion.grade4StrictComplete, 0);
  assert.equal(proof.completion.l10StrictComplete, 0);
  assert.equal(proof.release.publishedReleaseCount, 0);
  assert.equal(proof.release.grade4PublishedReleaseCount, 0);
  assert.equal(proof.release.l10.expectedMemberCount, 47);
  assert.equal(proof.release.l10.strictCompleteCount, 0);
  assert.equal(proof.release.l10.missingCount, 47);
  assert.equal(proof.release.l10.assetMismatchCount, 0);
  assert.equal(proof.release.l10.published, false);
  assert.equal(proof.release.l10.status, "unpublished");
  return proof;
}

async function runAuthoritativeLedgerChecks(projectRoot, records, {
  completionChecker = checkCompletionLedger,
  releaseChecker = checkLessonReleaseLedger,
} = {}) {
  const migrationsRoot = path.join(projectRoot, "migrations");
  const completionLedgerPath = path.join(projectRoot,
    CURRENT_LEDGER_EPOCH.completionLedger.path);
  const releaseLedgerPath = path.join(projectRoot,
    CURRENT_LEDGER_EPOCH.releaseLedger.path);
  const completionCheck = await completionChecker({
    migrationsRoot,
    output: completionLedgerPath,
  });
  const releaseCheck = await releaseChecker({
    releasesPath: path.join(projectRoot, "catalog/lesson-releases.json"),
    completionLedgerPath,
    migrationsRoot,
    output: releaseLedgerPath,
    completionLedgerCheck: async () => completionCheck,
  });
  return validateAuthoritativeLedgerChecks({
    completionCheck,
    releaseCheck,
    completionRecord: records.completionLedger,
    releaseRecord: records.releaseLedger,
    lessonReleases: records.lessonReleases.document,
  });
}

async function readSpecificationGroup(projectRoot, specifications) {
  const records = await Promise.all(Object.entries(specifications)
    .map(([key, specification]) => readStable(projectRoot, key, specification)));
  return Object.fromEntries(records.map((record) => [record.key, record]));
}

export async function readCurrentSnapshot(projectRoot = PROJECT_ROOT, options = {}) {
  const root = path.resolve(projectRoot);
  const v2Artifacts = await readSpecificationGroup(root, V2_ARTIFACTS);
  const v2Document = v2Artifacts.predecessorV2Json.document;
  validateV2Document(v2Document);
  const semantic = await readV2SemanticRecords(root, v2Document);
  const [authoritativeEntrypoints, l10Artifacts, missingMp3Artifacts] =
    await Promise.all([
      readSpecificationGroup(root, AUTHORITATIVE_ENTRYPOINTS),
      readSpecificationGroup(root, L10_V5_ARTIFACTS),
      readSpecificationGroup(root, MISSING_MP3_ARTIFACTS),
    ]);
  validateL10V5(l10Artifacts.l10V5Json.document);
  validateMissingMp3Plan(missingMp3Artifacts.missingMp3Json.document);
  const authoritativeProof = await runAuthoritativeLedgerChecks(
    root,
    semantic.records,
    options,
  );
  const records = {
    ...semantic.records,
    ...v2Artifacts,
    ...authoritativeEntrypoints,
    ...l10Artifacts,
    ...missingMp3Artifacts,
  };
  assert.equal(Object.keys(records).length, 31);
  return {
    projectRoot: root,
    records,
    v2Document,
    semanticTransition: semantic.transition,
    authoritativeProof,
  };
}

async function assertRecordsUnchanged(snapshot) {
  await Promise.all(Object.values(snapshot.records).map(async (record) => {
    const reread = await readStable(snapshot.projectRoot, record.key, {
      path: record.path,
      kind: record.kind,
    });
    assert.equal(reread.statIdentity, record.statIdentity,
      `${record.path} stat identity drifted after snapshot`);
    assert.equal(reread.bytes, record.bytes,
      `${record.path} bytes drifted after snapshot`);
    assert.equal(reread.sha256, record.sha256,
      `${record.path} SHA-256 drifted after snapshot`);
    assert.equal(reread.mode, record.mode,
      `${record.path} mode drifted after snapshot`);
  }));
}

async function assertSnapshotCurrent(snapshot, options = {}) {
  await assertRecordsUnchanged(snapshot);
  const currentProof = await runAuthoritativeLedgerChecks(
    snapshot.projectRoot,
    snapshot.records,
    options,
  );
  assert.deepEqual(currentProof, snapshot.authoritativeProof,
    "Authoritative ledger proof changed after the initial v3 snapshot");
  await assertRecordsUnchanged(snapshot);
}

export function derivePlan(snapshot) {
  validateV2Document(snapshot.v2Document);
  const l10 = snapshot.records.l10V5Json.document;
  const mp3 = snapshot.records.missingMp3Json.document;
  validateL10V5(l10);
  validateMissingMp3Plan(mp3);
  const proof = snapshot.authoritativeProof;

  const plan = structuredClone(snapshot.v2Document);
  plan.schemaVersion = 3;
  plan.planDate = "2026-08-04";
  plan.status = "planned-not-admitted-not-executable";
  plan.successorOf = binding(snapshot.records.predecessorV2Json);
  plan.predecessorDisposition = {
    v2: {
      status:
        "rejected-superseded-lawful-ledger-rebuild-and-l10-v5-currentness",
      preserved: true,
      artifacts: {
        generator: binding(snapshot.records.predecessorV2Generator),
        tests: binding(snapshot.records.predecessorV2Tests),
        json: binding(snapshot.records.predecessorV2Json),
      },
      fixedEpochPlanFingerprintSha256:
        snapshot.v2Document.planFingerprintSha256,
      formerLedgerBindings: {
        completionLedger: snapshot.v2Document.inputBindings.completionLedger,
        releaseLedger: snapshot.v2Document.inputBindings.releaseLedger,
      },
      currentLedgerBindings: {
        completionLedger: binding(snapshot.records.completionLedger),
        releaseLedger: binding(snapshot.records.releaseLedger),
      },
      semanticHydration: snapshot.semanticTransition,
      oldGeneratorOrCheckInvoked: false,
      acceptanceEffect: "none",
    },
    v1: snapshot.v2Document.predecessorDisposition,
  };
  plan.v2SemanticHydration = {
    source: binding(snapshot.records.predecessorV2Json),
    inheritedPlanFingerprintSha256: snapshot.v2Document.planFingerprintSha256,
    inheritedWaveCount: snapshot.v2Document.waves.length,
    inheritedWaveMembers: snapshot.v2Document.waveMembership.subtotal.members,
    inheritedWaveLessons: snapshot.v2Document.waveMembership.uniqueLessonCount,
    inheritedAdmissionCount: snapshot.v2Document.waveAdmissionCount,
    transition: snapshot.semanticTransition,
    rule:
      "V3 clones the exact preserved v2 plan semantics after direct 17-binding rehydration. Only completionLedger and releaseLedger are replaced inside that semantic closure; v5 and MP3 evidence are separately added successor inputs.",
    acceptanceEffect: "none",
  };
  plan.currentLedgerFreshness = {
    status: "current-authoritative-generator-proven",
    completionLedger: binding(snapshot.records.completionLedger),
    lessonReleaseLedger: binding(snapshot.records.releaseLedger),
    authoritativeFunctions: {
      completion: {
        module: binding(snapshot.records.authoritativeCompletionLedgerGenerator),
        export: proof.completion.checkerExport,
      },
      lessonRelease: {
        module: binding(snapshot.records.authoritativeLessonReleaseLedgerGenerator),
        export: proof.release.checkerExport,
      },
      strictValidator: binding(snapshot.records.authoritativeMigrationValidator),
    },
    proof,
    rule:
      "Current means the authoritative checkCompletionLedger and checkLessonReleaseLedger functions regenerated bytes identical to the exact bound ledgers during this read-only v3 run.",
    acceptanceEffect: "none",
  };
  plan.courseBaseline.strictCompleteMembers = proof.completion.grade4StrictComplete;
  plan.courseBaseline.publishedLessonCount =
    proof.release.grade4PublishedReleaseCount;
  plan.template = {
    ...plan.template,
    contractVersion: 5,
    contract: binding(snapshot.records.l10V5Json),
    artifacts: {
      generator: binding(snapshot.records.l10V5Generator),
      tests: binding(snapshot.records.l10V5Tests),
      json: binding(snapshot.records.l10V5Json),
      markdown: binding(snapshot.records.l10V5Markdown),
    },
    templateStable: false,
    strictCompleteMembers: proof.release.l10.strictCompleteCount,
    requiredMembers: proof.release.l10.expectedMemberCount,
    published: proof.release.l10.published,
    batchAdmissionAllowed: false,
    downstreamTransactionDecision: "DO_NOT_APPLY",
    authoritativeLedgerCurrentness: "current-authoritative-generator-proven",
    rule:
      "L10 remains inside the 657-member course denominator but outside the four planning waves; exact v5 is current yet still templateStable false, 0/47 strict complete, unpublished, and DO_NOT_APPLY.",
  };
  plan.blockers.audio = {
    ...plan.blockers.audio,
    expectedSha256KnownForAllMissing: false,
    dependencyClosureComplete: false,
    resolutionPlan: {
      version: 1,
      artifacts: {
        generator: binding(snapshot.records.missingMp3Generator),
        tests: binding(snapshot.records.missingMp3Tests),
        json: binding(snapshot.records.missingMp3Json),
        markdown: binding(snapshot.records.missingMp3Markdown),
      },
      obligationCount: mp3.summary.obligationCount,
      expectedSha256KnownCount: mp3.summary.expectedSha256KnownCount,
      expectedSha256UnknownCount: mp3.summary.expectedSha256UnknownCount,
      basenameObservedCount: mp3.summary.basenameObservedCount,
      basenameNotObservedCount: mp3.summary.basenameNotObservedCount,
      selectedCandidateCount: mp3.summary.selectedCandidateCount,
      promotionRecordCount: mp3.summary.promotionRecordCount,
      executorPresent: mp3.summary.executorPresent,
      recoveryStates: mp3.recoveryProtocol.map(({state}) => state),
      sourceDependencyClosure: false,
      acceptanceEffect: "none",
    },
  };
  plan.atomicWholeCourseIntegration.currentPublishedLessonCount =
    proof.release.grade4PublishedReleaseCount;
  plan.atomicWholeCourseIntegration.currentPlatformRisk.currentStrictCompleteMembers =
    proof.completion.grade4StrictComplete;
  plan.atomicWholeCourseIntegration.currentPlatformRisk.currentPublishedGrade4Lessons =
    proof.release.grade4PublishedReleaseCount;
  plan.atomicWholeCourseIntegration.currentPlatformRisk.currentLeakObserved = false;
  plan.atomicWholeCourseIntegration.currentPlatformRisk.futureRiskClosed = false;
  plan.atomicWholeCourseIntegration.currentPlatformEnforcesWholeCourseZeroOrTwelve =
    false;
  plan.atomicWholeCourseIntegration.integrationAllowed = false;
  plan.atomicWholeCourseIntegration.publicationAllowed = false;
  plan.optionalEvolvingHelperDesign = {
    candidatePath: "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md",
    status: "evolving-design-explicitly-outside-v3-exact-input-closure",
    exactContractBound: false,
    designApproved: false,
    implementationSourceBound: false,
    helperBinaryBound: false,
    protectedInstallReceiptBound: false,
    executionAuthority: false,
    p0ClosureEffect: false,
    acceptanceEffect: "none",
  };
  plan.admissionDecision = {
    outcome: "ZERO-WAVES-ADMITTED",
    reasons: [
      "L10 v5 is authoritative-ledger-current but templateStable remains false, L10 remains 0/47, and downstream remains DO_NOT_APPLY",
      "the exact missing-MP3 resolution plan retains 16 unknown expected SHA-256 identities, selects zero candidates, and leaves source dependency closure false",
      "Key Term review holds and Polynomial.swf remain unresolved",
      "10 Grade 4 lesson release definitions are absent",
      "strict completion is 0 and the whole-course trust adapter does not exist",
      "current publisher retains individual eligibility outside controlled scopes; the 0-or-12 future risk remains unclosed",
      "the evolving helper design is outside the exact v3 closure and has no approval or execution effect",
    ],
    mayStartRendererBatch: false,
    mayIntegrateCourse: false,
    mayPublishAnyLessonFromWave: false,
  };
  plan.authorityBoundary = {
    ...plan.authorityBoundary,
    currentLedgersAuthoritativeGeneratorProven: true,
    L10V5CurrentIsTemplateStable: false,
    missingMp3ResolutionPlanClosesDependency: false,
    helperDesignIsBoundOrApproved: false,
    oldV1V2ReaderOrCheckInvoked: false,
    planMayStartBatch: false,
    planMayMutateRegistryOrLedger: false,
    planMayIntegrateOrPublish: false,
  };
  plan.planOnly = true;
  plan.executable = false;
  plan.executorPresent = false;
  plan.waveAdmissionCount = 0;
  plan.acceptanceEffects = Object.fromEntries(
    EXPECTED_ACCEPTANCE_EFFECT_KEYS.map((key) => [key, false]),
  );
  plan.inputBindings = Object.fromEntries(Object.keys(snapshot.records).sort()
    .map((key) => [key, binding(snapshot.records[key])]));
  delete plan.planFingerprintSha256;
  plan.planFingerprintSha256 = planFingerprint(plan);
  validatePlan(plan);
  return plan;
}

export function validatePlan(plan) {
  assert.equal(plan.schemaVersion, 3);
  assert.equal(plan.artifactType,
    "g4-whole-course-batch-and-atomic-integration-plan");
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.successorOf.sha256, V2_ARTIFACTS.predecessorV2Json.sha256);
  assert.equal(plan.predecessorDisposition.v2.preserved, true);
  assert.equal(plan.predecessorDisposition.v2.artifacts.generator.sha256,
    V2_ARTIFACTS.predecessorV2Generator.sha256);
  assert.equal(plan.predecessorDisposition.v2.artifacts.tests.sha256,
    V2_ARTIFACTS.predecessorV2Tests.sha256);
  assert.equal(plan.predecessorDisposition.v2.artifacts.json.sha256,
    V2_ARTIFACTS.predecessorV2Json.sha256);
  assert.equal(plan.predecessorDisposition.v2.oldGeneratorOrCheckInvoked, false);
  assert.deepEqual(plan.predecessorDisposition.v2.semanticHydration.replacedKeys,
    ["completionLedger", "releaseLedger"]);
  assert.equal(plan.predecessorDisposition.v2.semanticHydration.nonLedgerBindingsExact,
    true);
  assert.equal(plan.v2SemanticHydration.inheritedWaveCount, 4);
  assert.equal(plan.v2SemanticHydration.inheritedWaveMembers, 610);
  assert.equal(plan.v2SemanticHydration.inheritedWaveLessons, 11);
  assert.equal(plan.v2SemanticHydration.inheritedAdmissionCount, 0);

  assert.equal(plan.currentLedgerFreshness.status,
    "current-authoritative-generator-proven");
  assert.equal(plan.currentLedgerFreshness.completionLedger.sha256,
    CURRENT_LEDGER_EPOCH.completionLedger.sha256);
  assert.equal(plan.currentLedgerFreshness.lessonReleaseLedger.sha256,
    CURRENT_LEDGER_EPOCH.releaseLedger.sha256);
  assert.equal(plan.currentLedgerFreshness.proof.proofKind,
    "authoritative-generator-recomputation-and-exact-byte-equality");
  assert.equal(plan.currentLedgerFreshness.proof.codeBindingBoundary.scope,
    "direct-entrypoints-only-not-transitive-semantic-code-closure");
  assert.equal(plan.currentLedgerFreshness.proof.codeBindingBoundary
    .recursiveLocalDependenciesHashBound, false);
  assert.equal(plan.currentLedgerFreshness.proof.codeBindingBoundary
    .packageRuntimeProvenanceBound, false);
  assert.equal(plan.currentLedgerFreshness.proof.completion.strictComplete, 0);
  assert.equal(plan.currentLedgerFreshness.proof.completion.grade4StrictComplete, 0);
  assert.equal(plan.currentLedgerFreshness.proof.completion.l10StrictComplete, 0);
  assert.equal(plan.currentLedgerFreshness.proof.release.publishedReleaseCount, 0);
  assert.equal(plan.currentLedgerFreshness.proof.release
    .grade4PublishedReleaseCount, 0);
  assert.equal(plan.currentLedgerFreshness.proof.release.l10.expectedMemberCount, 47);
  assert.equal(plan.currentLedgerFreshness.proof.release.l10.strictCompleteCount, 0);
  assert.equal(plan.currentLedgerFreshness.proof.release.l10.missingCount, 47);
  assert.equal(plan.currentLedgerFreshness.proof.release.l10.published, false);

  assert.equal(plan.template.contractVersion, 5);
  assert.equal(plan.template.contract.sha256, L10_V5_ARTIFACTS.l10V5Json.sha256);
  assert.equal(plan.template.artifacts.generator.sha256,
    L10_V5_ARTIFACTS.l10V5Generator.sha256);
  assert.equal(plan.template.artifacts.tests.sha256,
    L10_V5_ARTIFACTS.l10V5Tests.sha256);
  assert.equal(plan.template.artifacts.json.sha256,
    L10_V5_ARTIFACTS.l10V5Json.sha256);
  assert.equal(plan.template.artifacts.markdown.sha256,
    L10_V5_ARTIFACTS.l10V5Markdown.sha256);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.template.requiredMembers, 47);
  assert.equal(plan.template.published, false);
  assert.equal(plan.template.batchAdmissionAllowed, false);
  assert.equal(plan.template.downstreamTransactionDecision, "DO_NOT_APPLY");

  const mp3 = plan.blockers.audio.resolutionPlan;
  assert.equal(mp3.artifacts.generator.sha256,
    MISSING_MP3_ARTIFACTS.missingMp3Generator.sha256);
  assert.equal(mp3.artifacts.tests.sha256,
    MISSING_MP3_ARTIFACTS.missingMp3Tests.sha256);
  assert.equal(mp3.artifacts.json.sha256,
    MISSING_MP3_ARTIFACTS.missingMp3Json.sha256);
  assert.equal(mp3.artifacts.markdown.sha256,
    MISSING_MP3_ARTIFACTS.missingMp3Markdown.sha256);
  assert.equal(mp3.obligationCount, 16);
  assert.equal(mp3.expectedSha256KnownCount, 0);
  assert.equal(mp3.expectedSha256UnknownCount, 16);
  assert.equal(mp3.basenameObservedCount, 14);
  assert.equal(mp3.basenameNotObservedCount, 2);
  assert.equal(mp3.selectedCandidateCount, 0);
  assert.equal(mp3.promotionRecordCount, 0);
  assert.equal(mp3.executorPresent, false);
  assert.equal(mp3.sourceDependencyClosure, false);
  assert.deepEqual(mp3.recoveryStates, REQUIRED_RECOVERY_STATES);
  assert.equal(plan.blockers.audio.dependencyClosureComplete, false);

  assert.equal(plan.waveMembership.uniqueLessonCount, 11);
  assert.equal(plan.waveMembership.subtotal.members, 610);
  assert.equal(plan.waves.length, 4);
  assert.ok(plan.waves.every((wave) =>
    wave.admittedLessonCount === 0 &&
    wave.executable === false &&
    wave.executorPresent === false &&
    wave.acceptanceEffect === "none"));
  assert.equal(plan.atomicWholeCourseIntegration
    .currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk
    .futureRiskClosed, false);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
  assert.equal(plan.admissionDecision.mayStartRendererBatch, false);
  assert.equal(plan.admissionDecision.mayIntegrateCourse, false);
  assert.equal(plan.admissionDecision.mayPublishAnyLessonFromWave, false);

  assert.equal(plan.optionalEvolvingHelperDesign.exactContractBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.designApproved, false);
  assert.equal(plan.optionalEvolvingHelperDesign.implementationSourceBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.helperBinaryBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.protectedInstallReceiptBound,
    false);
  assert.equal(plan.optionalEvolvingHelperDesign.executionAuthority, false);
  assert.equal(plan.optionalEvolvingHelperDesign.p0ClosureEffect, false);
  assert.equal(plan.authorityBoundary.oldV1V2ReaderOrCheckInvoked, false);
  assert.equal(plan.authorityBoundary.planMayStartBatch, false);
  assert.equal(plan.authorityBoundary.planMayMutateRegistryOrLedger, false);
  assert.equal(plan.authorityBoundary.planMayIntegrateOrPublish, false);

  assert.deepEqual(Object.keys(plan.acceptanceEffects),
    EXPECTED_ACCEPTANCE_EFFECT_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects)
    .every((value) => value === false));
  assert.equal(Object.keys(plan.inputBindings).length, 31);
  assert.equal("optionalEvolvingHelperDesign" in plan.inputBindings, false);
  assert.equal(Object.values(plan.inputBindings).some(({path: inputPath}) =>
    inputPath === plan.optionalEvolvingHelperDesign.candidatePath), false,
  "Evolving helper design path must remain outside the exact input closure");
  assert.equal(plan.planFingerprintSha256, planFingerprint(plan));
  return true;
}

export function serializePlan(plan) {
  validatePlan(plan);
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]),
    "Expected --write or --check");
  return args[0];
}

async function existingOutput(projectRoot, outputPath) {
  try {
    return (await readStable(projectRoot, "outputArtifact", {
      path: outputPath,
      kind: "text",
    })).text;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeOrCheckPlan({
  plan,
  projectRoot = PROJECT_ROOT,
  mode,
  outputPath = OUTPUT_PATH,
} = {}) {
  assert.ok(["--write", "--check"].includes(mode),
    "Expected --write or --check");
  const absolute = resolveInsideRoot(projectRoot, outputPath);
  const expected = serializePlan(plan);
  const current = await existingOutput(projectRoot, outputPath);
  if (mode === "--check") {
    assert.notEqual(current, null, `${outputPath} is missing`);
    assert.equal(current, expected,
      `${outputPath} is stale; preserve it and create a reviewed successor`);
    return {mode, disposition: "current", checked: outputPath};
  }
  assert.equal(current, null,
    `${outputPath} exists; write-no-clobber refuses every overwrite`);
  await writeFile(absolute, expected, {flag: "wx", mode: 0o644});
  return {mode, disposition: "created", written: outputPath};
}

export async function runCli(
  args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT,
  options = {},
) {
  const mode = parseCliArgs(args);
  const snapshot = await readCurrentSnapshot(projectRoot, options);
  const plan = derivePlan(snapshot);
  await assertSnapshotCurrent(snapshot, options);
  const result = await writeOrCheckPlan({plan, projectRoot, mode});
  await assertSnapshotCurrent(snapshot, options);
  return {...result, plan};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ${OUTPUT_PATH}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
