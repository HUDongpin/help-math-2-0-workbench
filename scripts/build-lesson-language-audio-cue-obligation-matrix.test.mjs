import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  buildLessonLanguageAudioCueObligationMatrix,
  parseLessonLanguageAudioCueObligationArguments,
  stableJson,
  validateLessonLanguageAudioCueObligationMatrix,
} from "./build-lesson-language-audio-cue-obligation-matrix.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const REPORT_PATH = path.join(ROOT, "reports", `${RELEASE_ID}-language-audio-cue-obligation-matrix.json`);

let reportPromise;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function refreshTopFingerprint(value) {
  const {reportFingerprintSha256: ignored, ...payload} = value;
  void ignored;
  value.reportFingerprintSha256 = createHash("sha256")
    .update(JSON.stringify(canonicalize(payload)))
    .digest("hex");
  return value;
}

function report() {
  reportPromise ||= buildLessonLanguageAudioCueObligationMatrix({root: ROOT, releaseId: RELEASE_ID});
  return reportPromise;
}

test("builds the exact 47-member by EN/ES L10 cue obligation matrix", async () => {
  const value = await report();
  assert.equal(value.summary.memberCount, 47);
  assert.equal(value.summary.memberLanguageObligationCount, 94);
  assert.deepEqual(value.summary.languages, ["en", "es"]);
  assert.equal(value.members.length, 47);
  assert.equal(value.obligationRows.length, 94);
  assert.equal(new Set(value.obligationRows.map(({obligationId}) => obligationId)).size, 94);
  assert.ok(value.obligationRows.every((row) => row.status === "unresolved-listening-required"));
  assert.ok(value.obligationRows.every((row) => !row.authoritativeOriginalRuntimeTraversalComplete
    && !row.namedHumanListeningComplete && !row.accepted));
  assert.equal(value.sourceBindings.animationsCatalog.path, "catalog/animations.json");
  assert.equal(value.sourceBindings.audioGroupsCatalog.path, "catalog/audio-groups.json");
  assert.ok(value.members.every(({catalogAudioBinding}) => catalogAudioBinding.currentCatalogReconciled === true));
});

test("separates canonical cue rows, raw embedded structures, and ActionScript operations", async () => {
  const value = await report();
  assert.equal(value.summary.audioInventoryFileCount, 47);
  assert.equal(value.summary.audioInventoryExactMachineTriangulationCount, 47);
  assert.equal(value.summary.canonicalInventoryMemberCount, 44);
  assert.equal(value.summary.emptyCanonicalAudioInventoryMemberCount, 3);
  assert.equal(value.summary.canonicalInventoryRowCount, 245);
  assert.deepEqual(value.summary.canonicalInventoryLanguageLabelCounts, {es: 42, und: 203});
  assert.equal(value.summary.embeddedSoundStreamStructureCount, 383);
  assert.equal(value.summary.embeddedTimedSoundStreamCount, 201);
  assert.equal(value.summary.embeddedZeroBlockOrUnknownDurationSoundStreamCount, 182);
  assert.equal(value.summary.embeddedDefineSoundCount, 2);
  assert.equal(value.summary.embeddedTimedDefineSoundCount, 2);
  assert.equal(value.summary.actionScriptAudioOperationCount, 22);
  assert.deepEqual(value.summary.actionScriptAudioOperationCounts, {
    attachSound: 1,
    loadSound: 1,
    start: 3,
    stop: 17,
  });
  assert.equal(value.summary.manifestAudioRequiredMemberCount, 45);
  assert.equal(value.summary.manifestAudioNotRequiredMemberCount, 2);
  assert.deepEqual(value.summary.manifestAudioNotRequiredButTimedEmbeddedEvidenceMemberIds, [
    "course-g04-l10-ir-001",
    "shell-course-g04-l10-index-local",
  ]);
  assert.equal(value.summary.manifestCueAdoptionCount, 0);
  assert.equal(value.summary.manifestFollowUpMemberCount, 47);
  assert.ok(value.embeddedStructuralCandidates.soundStreams
    .filter(({durationMs}) => !(Number(durationMs) > 0))
    .every(({inventoryRepresented, status}) => inventoryRepresented === false
      && status === "zero-block-or-unknown-duration-stream-structure-not-proven-audible"));
  assert.ok(value.actionScriptAudioOperations.every(({resolvedCueCandidateId, runtimeInvocationEstablished}) =>
    resolvedCueCandidateId === null && runtimeInvocationEstablished === false));
});

test("deduplicates physical FQ files while preserving all three member references", async () => {
  const value = await report();
  assert.equal(value.summary.exactBasenameReferenceCount, 42);
  assert.equal(value.summary.exactBasenameUniquePhysicalFileCount, 42);
  assert.equal(value.summary.candidateOnlyReferenceCount, 342);
  assert.equal(value.summary.candidateOnlyUniquePhysicalFileCount, 114);
  assert.deepEqual(value.summary.candidateOnlyUniquePhysicalFileLanguageCounts, {en: 54, es: 60});
  assert.equal(value.summary.repeatedCandidateReferenceGroupCount, 114);
  assert.equal(value.summary.externalUniquePhysicalFileCount, 156);
  assert.equal(value.summary.externalUniqueContentHashCount, 156);
  assert.equal(value.summary.externalDuplicateContentHashGroupCount, 0);
  assert.ok(value.externalPools.candidateOnly.every(({referenceCount, ownerAnimationIds}) =>
    referenceCount === 3 && ownerAnimationIds.length === 3));
  assert.ok(value.externalPools.repeatedCandidateReferenceGroups.every(({referenceCount, duplicateMeaning}) =>
    referenceCount === 3 && duplicateMeaning.includes("not multiple unique files")));
});

test("binds bilingual XML labels and structural host routes without a spoken-language claim", async () => {
  const value = await report();
  assert.equal(value.lessonXmlLanguageEvidence.sectionCount, 8);
  assert.equal(value.lessonXmlLanguageEvidence.activePageReferenceCount, 46);
  assert.equal(value.lessonXmlLanguageEvidence.bilingualSectionLabels.length, 8);
  assert.deepEqual(value.lessonXmlLanguageEvidence.randomAudioYesMemberIds, ["course-g04-l10-ir-001"]);
  assert.equal(value.lessonXmlLanguageEvidence.explicitAudioCueTimingOrVoiceBindingsPresent, false);
  assert.deepEqual(value.hostLanguageRouting.routeCandidates.en, {
    hostLanguageCode: "EN",
    finalQuizDirectory: "EA",
    ordinaryPageExternalDirectory: null,
    evidenceScope: "legacy-host-routing-only",
  });
  assert.equal(value.hostLanguageRouting.routeCandidates.es.hostLanguageCode, "SP");
  assert.equal(value.hostLanguageRouting.routeCandidates.es.finalQuizDirectory, "SA");
  assert.equal(value.hostLanguageRouting.routeCandidates.es.ordinaryPageExternalDirectory, "SA");
  assert.equal(value.hostLanguageRouting.spokenLanguageEstablished, false);
  assert.equal(value.hostLanguageRouting.audibleContentEstablished, false);
  assert.equal(value.hostLanguageRouting.runtimeRouteTraversalEstablished, false);
});

test("is deterministic and matches the checked-in report byte-for-byte", async () => {
  const first = await report();
  const second = await buildLessonLanguageAudioCueObligationMatrix({root: ROOT, releaseId: RELEASE_ID});
  assert.equal(stableJson(second), stableJson(first));
  assert.equal(await readFile(REPORT_PATH, "utf8"), stableJson(first));
});

test("validator fails closed on invented listening, language, timing, or acceptance", async () => {
  const original = await report();

  const listened = structuredClone(original);
  listened.obligationRows[0].namedHumanListeningComplete = true;
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(listened), /crossed the pending human\/runtime boundary/);

  const spoken = structuredClone(original);
  spoken.embeddedStructuralCandidates.soundStreams[0].spokenLanguage = "en";
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(spoken), /embedded language\/timing was invented/);

  const timed = structuredClone(original);
  timed.externalPools.exactBasenameAssociations[0].cueTiming = {startFrame: 1};
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(timed), /crossed an evidence boundary/);

  const accepted = structuredClone(original);
  accepted.summary.acceptedCueCount = 1;
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(accepted), /acceptedCueCount must remain zero/);
});

test("validator rejects duplicate or incomplete member-language coverage", async () => {
  const original = await report();
  const duplicate = structuredClone(original);
  duplicate.obligationRows[1].obligationId = duplicate.obligationRows[0].obligationId;
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(duplicate), /Cue obligation IDs are duplicated/);

  const missing = structuredClone(original);
  missing.obligationRows.pop();
  missing.summary.memberLanguageObligationCount -= 1;
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(missing), /exactly EN and ES rows/);
});

test("validator rejects dangling references, stale row counts, and inconsistent route-resolution flags", async () => {
  const original = await report();

  const dangling = structuredClone(original);
  dangling.obligationRows[0].embeddedUnknownLanguageCandidateIds = ["missing-candidate"];
  refreshTopFingerprint(dangling);
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(dangling), /candidate references are stale or dangling/);

  const staleCount = structuredClone(original);
  staleCount.obligationRows[0].counts.embeddedSoundStreams = 999;
  refreshTopFingerprint(staleCount);
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(staleCount), /counts\/route-resolution flag are stale/);

  const finalQuizRow = original.obligationRows.find(({preListeningRouteResolutionRequired}) =>
    preListeningRouteResolutionRequired === true);
  assert.ok(finalQuizRow);
  const routeFlag = structuredClone(original);
  routeFlag.obligationRows.find(({obligationId}) => obligationId === finalQuizRow.obligationId)
    .preListeningRouteResolutionRequired = false;
  refreshTopFingerprint(routeFlag);
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(routeFlag), /counts\/route-resolution flag are stale/);
});

test("validator independently recomputes catalog-set and summary fingerprints", async () => {
  const original = await report();

  const catalogSet = structuredClone(original);
  catalogSet.members[0].catalogAudioBinding.candidateOnlyFileCount += 1;
  refreshTopFingerprint(catalogSet);
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(catalogSet), /current audio catalog set binding is stale/);

  const externalFingerprint = structuredClone(original);
  externalFingerprint.summary.externalPoolSha256 = "0".repeat(64);
  refreshTopFingerprint(externalFingerprint);
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(externalFingerprint), /External pool fingerprint is stale/);

  const obligationFingerprint = structuredClone(original);
  obligationFingerprint.summary.obligationSetSha256 = "0".repeat(64);
  refreshTopFingerprint(obligationFingerprint);
  assert.throws(() => validateLessonLanguageAudioCueObligationMatrix(obligationFingerprint), /Obligation-set fingerprint is stale/);
});

test("generic generator also validates a second current-schema complete lesson release", async () => {
  const value = await buildLessonLanguageAudioCueObligationMatrix({
    root: ROOT,
    releaseId: "lesson-g05-l04-number-lines",
  });
  assert.equal(value.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(value.summary.memberCount, 55);
  assert.equal(value.summary.memberLanguageObligationCount, 110);
  assert.equal(value.sourceBindings.animationsCatalog.path, "catalog/animations.json");
  assert.equal(value.sourceBindings.audioGroupsCatalog.path, "catalog/audio-groups.json");
  assert.ok(value.obligationRows.every(({accepted}) => accepted === false));
});

test("parses deterministic report and check arguments", () => {
  assert.deepEqual(parseLessonLanguageAudioCueObligationArguments([
    "--release-id",
    RELEASE_ID,
    "--check",
  ]), {
    check: true,
    releaseId: RELEASE_ID,
    output: `reports/${RELEASE_ID}-language-audio-cue-obligation-matrix.json`,
    help: false,
  });
  assert.throws(() => parseLessonLanguageAudioCueObligationArguments(["--wat"]), /Unknown option/);
});
