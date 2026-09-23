import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  REPORT_JSON_PATH,
  REPORT_MARKDOWN_PATH,
  buildReport,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateReport,
  writeExclusiveReportPair,
} from "./build-g5-l4-audio-static-cue-reconciliation.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPromise = buildReport({root: projectRoot});

function clone(value) {
  return structuredClone(value);
}

test("reconciles the complete G5 L4 static audio candidate surface without acceptance promotion", async () => {
  const report = await reportPromise;
  assert.equal(report.members.length, 55);
  assert.deepEqual(report.summary, {
    memberCount: 55,
    physicalCatalogCandidateFileCount: 135,
    externalPageCandidateFileCount: 50,
    fqGroupCandidateFileCount: 83,
    unmappedCandidateFileCount: 2,
    canonicalInventoryCueCount: 373,
    externalInventoryCueCount: 50,
    embeddedDefineSoundCueCount: 6,
    embeddedStreamCueCount: 317,
    cueClassificationCounts: {
      "embedded-define-sound-definition-only-candidate": 2,
      "embedded-define-sound-exported-dynamic-linkage-candidate": 2,
      "embedded-define-sound-nested-start-tag-candidate": 2,
      "embedded-stream-root-placement-graph-not-proven-candidate": 57,
      "embedded-stream-root-placement-graph-observed-candidate": 260,
      "external-page-host-path-hash-bound-candidate": 50,
    },
    inventoryIdentityTriangulatedCount: 373,
    zeroBlockStreamStructureCount: 267,
    zeroBlockStructuralReachabilityCounts: {
      "not-proven-by-root-placement-graph": 87,
      "reachable-from-root-placement-graph": 177,
      root: 3,
    },
    membersWithPlacementGraphObservedStreamCount: 51,
    membersWithPlacementGraphNotProvenStreamCount: 31,
    assetInventoryCount: 55,
    assetInventoryRowCount: 12066,
    soundDefinitionAssetRowCount: 6,
    ffdecBundleCount: 55,
    ffdecScriptCount: 2332,
    ffdecScriptBytes: 452488,
    actionScriptAudioOperationCount: 20,
    actionScriptAudioOperationCounts: {attachSound: 1, loadSound: 1, start: 3, stop: 15},
    fqExpectedPathCount: 180,
    fqPresentCandidateCount: 83,
    fqMissingSourceCount: 97,
    fqUnmatchedCandidateCount: 0,
    routingLanguageCandidateCounts: {en: 41, es: 92, unresolved: 2},
    spokenLanguageEstablishedFileCount: 0,
    runtimeReachabilityEstablishedCueCount: 0,
    audibleContentEstablishedCueCount: 0,
    synchronizationEstablishedCueCount: 0,
    listeningAcceptedCueCount: 0,
    ownerAcceptedCueCount: 0,
    strictCompleteMemberCount: 0,
    publishedMemberCount: 0,
    memberInputSetSha256: "f8c238922df858e85ca5b38638325eb9e790d8a77ff45454ca65e70aa6f4ef96",
    cueSetSha256: "0238e05bb2ae683963e6b0e275bb06f73bca1f807d2647809b4b1716b5a2c122",
    zeroBlockStructureSetSha256: "43e588102c866d3edf8df5955197319febf7bdaccc039c2c9f3edfc6e732843b",
  });
  assert.deepEqual(report.authorityBoundary, {
    acceptanceNeutral: true,
    audioPlayed: false,
    sourceFilesWritten: 0,
    workspaceFilesWritten: 0,
    canonicalInventoriesWritten: 0,
    migrationStatusOrReviewFilesWritten: 0,
    ledgersWritten: 0,
    runtimeReachabilityEstablished: false,
    audibleContentEstablished: false,
    spokenLanguageEstablished: false,
    synchronizationEstablished: false,
    listeningAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    published: false,
  });
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("binds cue identity and preserves zero-block structures below cue status", async () => {
  const report = await reportPromise;
  const cues = report.members.flatMap(({cueCandidates}) => cueCandidates);
  const zeroBlockStructures = report.members.flatMap(({zeroBlockStreamStructures}) => zeroBlockStreamStructures);
  assert.equal(cues.length, 373);
  assert.equal(new Set(cues.map(({cueCandidateId}) => cueCandidateId)).size, 373);
  assert.equal(cues.filter(({evidenceBoundary}) => Object.values(evidenceBoundary).some(Boolean)).length, 0);
  assert.equal(zeroBlockStructures.length, 267);
  assert.equal(zeroBlockStructures.filter(({cuePromoted}) => cuePromoted).length, 0);
  assert.equal(zeroBlockStructures.filter(({silenceEstablished}) => silenceEstablished).length, 0);
});

test("derives the 18 by 5 by 2 final-quiz matrix as static candidates only", async () => {
  const report = await reportPromise;
  const route = report.finalQuizStaticRoute;
  assert.equal(route.expectedPaths.length, 180);
  assert.equal(route.expectedPaths.filter(({status}) => status.startsWith("hash-bound")).length, 83);
  assert.equal(route.expectedPaths.filter(({status}) => status === "missing-source").length, 97);
  assert.equal(route.expectedPaths.filter(({cuePromoted}) => cuePromoted).length, 0);
  assert.deepEqual(route.staticPositiveOwnerCandidateIds, ["course-g05-l04-fq-002", "course-g05-l04-fq-003"]);
  assert.equal(route.catalogOwnershipChanged, false);
  const byId = new Map(route.childContracts.map((contract) => [contract.animationId, contract]));
  assert.equal(byId.get("course-g05-l04-fq-001").completeNegativeProofEstablished, false);
  assert.equal(byId.get("course-g05-l04-fq-002").selectionMode, "random-without-replacement-static-source-contract");
  assert.equal(byId.get("course-g05-l04-fq-003").selectionMode, "sequential-static-source-contract");
  for (const id of ["course-g05-l04-fq-002", "course-g05-l04-fq-003"]) {
    const contract = byId.get(id);
    assert.deepEqual(contract.literalQuestionLabels, Array.from({length: 18}, (_, index) => `Q${index + 1}`));
    assert.equal(contract.answerReleaseHandlerCounts.length, 18);
    assert.ok(contract.answerReleaseHandlerCounts.every(({count}) => count === 4));
    assert.equal(contract.runtimeSeedEstablished, false);
    assert.equal(contract.naturalRuntimeTraceEstablished, false);
  }
});

test("validator fails closed on runtime, cue, path, and acceptance promotion", async () => {
  const report = await reportPromise;
  const runtimePromotion = clone(report);
  runtimePromotion.authorityBoundary.runtimeReachabilityEstablished = true;
  assert.throws(() => validateReport(runtimePromotion), /must remain false/);

  const cuePromotion = clone(report);
  cuePromotion.members.find(({cueCandidates}) => cueCandidates.length).cueCandidates[0].evidenceBoundary.audibleContentEstablished = true;
  assert.throws(() => validateReport(cuePromotion), /evidence boundary changed/);

  const fqPromotion = clone(report);
  fqPromotion.finalQuizStaticRoute.expectedPaths[0].cuePromoted = true;
  assert.throws(() => validateReport(fqPromotion), /crossed the static-candidate boundary/);

  const acceptancePromotion = clone(report);
  acceptancePromotion.acceptanceEffects.ownerAccepted = true;
  assert.throws(() => validateReport(acceptancePromotion), /acceptanceEffects must remain false/);
});

test("exclusive report writer creates both files once and refuses overwrite", async () => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "g5-l4-audio-reconciliation-"));
  try {
    await mkdir(path.join(temporaryRoot, "reports"));
    const jsonText = "{\"test\":true}\n";
    const markdownText = "# Test\n";
    const descriptors = await writeExclusiveReportPair({root: temporaryRoot, jsonText, markdownText});
    assert.deepEqual(descriptors.map(({path: outputPath}) => outputPath), [REPORT_JSON_PATH, REPORT_MARKDOWN_PATH]);
    const original = await Promise.all([
      readFile(path.join(temporaryRoot, REPORT_JSON_PATH), "utf8"),
      readFile(path.join(temporaryRoot, REPORT_MARKDOWN_PATH), "utf8"),
    ]);
    await assert.rejects(
      writeExclusiveReportPair({root: temporaryRoot, jsonText: "replacement", markdownText: "replacement"}),
      /Refusing to overwrite existing output/,
    );
    assert.deepEqual(await Promise.all([
      readFile(path.join(temporaryRoot, REPORT_JSON_PATH), "utf8"),
      readFile(path.join(temporaryRoot, REPORT_MARKDOWN_PATH), "utf8"),
    ]), original);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("argument parser accepts check mode and rejects unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--help"]).help, true);
  assert.equal(parseArguments(["--root", projectRoot]).root, projectRoot);
  assert.throws(() => parseArguments(["--root"]), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("checked-in reports are byte-for-byte builder outputs", async () => {
  const report = await reportPromise;
  const [jsonText, markdownText] = await Promise.all([
    readFile(path.join(projectRoot, REPORT_JSON_PATH), "utf8"),
    readFile(path.join(projectRoot, REPORT_MARKDOWN_PATH), "utf8"),
  ]);
  assert.equal(jsonText, stableJson(report));
  assert.equal(markdownText, `${renderMarkdown(report)}\n`);
});
