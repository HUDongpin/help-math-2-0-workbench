import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import test from "node:test";

import {canonicalJson} from "./build-g4-l3-static-source-event-index.mjs";
import {
  buildBatch003StaticMachineAudit,
  parseArguments,
  renderBatch003StaticMachineAuditMarkdown,
  validateBatch003StaticMachineAudit,
  writeOrCheckReport,
} from "./build-batch-003-static-machine-audit.mjs";

const execFileAsync = promisify(execFile);

const PROTECTED_FILES = [
  "catalog/completion-ledger.json",
  "catalog/source-manifest.sha256",
  "reports/current-javascript-output-human-approval.json",
  "reports/pilot-strict-acceptance.json",
  "reports/vb004-semantic-review-packet.json",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function snapshotProtectedFiles() {
  return Object.fromEntries(await Promise.all(PROTECTED_FILES.map(async (file) => {
    const bytes = await readFile(file);
    return [file, {bytes: bytes.length, sha256: sha256(bytes)}];
  })));
}

const protectedBeforePromise = snapshotProtectedFiles();
let reportPromise;

function buildReportOnce() {
  reportPromise ||= buildBatch003StaticMachineAudit();
  return reportPromise;
}

test("physically audits the exact closed-gate batch-003 slice without changing protected evidence", async () => {
  const before = await protectedBeforePromise;
  const report = await buildReportOnce();
  const after = await snapshotProtectedFiles();
  assert.deepEqual(after, before);
  assert.equal(report.scope.batchId, "batch-003");
  assert.equal(report.scope.queueId, "grade-3-active");
  assert.equal(report.scope.grade, 3);
  assert.equal(report.scope.lesson, 1);
  assert.equal(report.scope.fullLessonActivePageReferences, 74);
  assert.equal(report.scope.completeLessonAudit, false);
  assert.equal(report.scope.canonicalAssets, 25);
  assert.equal(report.scope.placementPaths, 26);
  assert.deepEqual(report.scope.sectionCounts, {IN: 3, IR: 1, RW: 4, TI: 1, VB: 16});
  assert.equal(report.summary.physicallyRehashedCanonicalSwfs, 25);
  assert.equal(report.summary.physicallyRehashedPlacementSwfs, 26);
  assert.equal(report.summary.physicallyRehashedCanonicalFlas, 18);
  assert.equal(report.summary.physicallyRehashedPlacementFlas, 19);
  assert.equal(report.sourceBindings.lessonXml.physicalHashVerified, true);
  assert.equal(report.sourceBindings.lessonXml.sha256, "f803cd0f01016385e8fd6d2ad11ee2b5379c82f252015999c62727c7fd581443");
});

test("retains the exact native, FFDec, asset, event, and embedded-audio machine facts", async () => {
  const report = await buildReportOnce();
  assert.equal(report.summary.canonicalSwfBytes, 7_428_345);
  assert.equal(report.summary.rootFrameCountSum, 250);
  assert.equal(report.summary.canonicalFlaBytes, 38_204_416);
  assert.equal(report.summary.flaBacked, 18);
  assert.equal(report.summary.swfOnly, 7);
  assert.equal(report.summary.exportedScriptFileCount, 629);
  assert.equal(report.summary.assetDefinitionCount, 3_294);
  assert.deepEqual(report.summary.assetDefinitionCategoryCounts, {
    binary: 0,
    bitmap: 62,
    button: 153,
    font: 127,
    morph: 466,
    shape: 1_455,
    sound: 0,
    sprite: 247,
    text: 784,
    video: 0,
  });
  assert.equal(report.summary.exactFontDefinitionFacts, 127);
  assert.equal(report.summary.exactTextOccurrences, 965);
  assert.deepEqual(report.summary.staticSourceCandidateCounts, {
    candidateFamilyCount: 92,
    clipEventTokens: 15,
    externalApiOccurrences: 0,
    handlerEventTokens: 227,
    handlerFiles: 212,
    indexedSourceEventFiles: 563,
    inputSignalOccurrences: 53,
    keyboardEventTokens: 0,
    pointerEventTokens: 212,
    randomCallOccurrences: 12,
    replayOrResetOccurrences: 0,
    scoringSignalOccurrences: 51,
    timelineNavigationOccurrences: 723,
  });
  assert.deepEqual(report.summary.embeddedAudioTagCounts, {
    DefineSound: 0,
    SoundStreamBlock: 12_314,
    SoundStreamHead: 111,
    SoundStreamHead2: 0,
  });
  assert.equal(report.summary.itemsWithEmbeddedAudioTags, 25);
  const embeddedAudioProjection = JSON.stringify(report.items.map((item) => item.embeddedAudio));
  assert.doesNotMatch(embeddedAudioProjection, /plannedArchivePath|archivePath|archiveWritten|physicalHashVerified/);
  assert.doesNotMatch(embeddedAudioProjection, /artifacts\/g4-l3-embedded-audio/);
  assert.equal(report.assetReuse.allIdentityCount, 3_132);
  assert.equal(report.assetReuse.duplicateGroupCount, 89);
  assert.equal(report.assetReuse.crossSwfReuseGroupCount, 89);
  assert.ok(report.items.every((item) => item.swf.header.signature === "CWS" &&
    item.swf.header.version === 6 && item.swf.header.stage.width === 800 &&
    item.swf.header.stage.height === 600 && item.swf.header.fps === 12 &&
    item.swf.header.rootFrameCount === 10));
});

test("keeps catalog audio unknown-language and the duplicate placement exact", async () => {
  const report = await buildReportOnce();
  assert.equal(report.audioInventory.associationCount, 24);
  assert.equal(report.audioInventory.uniqueFileCount, 24);
  assert.equal(report.audioInventory.totalBytes, 6_419_616);
  assert.deepEqual(report.audioInventory.catalogLanguageCounts, {und: 24});
  assert.equal(report.audioInventory.allPhysicalHashesVerified, true);
  assert.equal(report.audioInventory.languageMappingEstablished, false);
  assert.equal(report.audioInventory.cueMappingEstablished, false);
  assert.equal(report.audioInventory.synchronizationEstablished, false);
  assert.equal(report.audioInventory.listeningAcceptanceEstablished, false);
  assert.equal(report.aliasRelationships.length, 1);
  const alias = report.aliasRelationships[0];
  assert.equal(alias.canonicalAnimationId, "course-g03-l01-ir-001-f1ec7620");
  assert.deepEqual(alias.placements.map((placement) => placement.animationId), [
    "course-g03-l01-ir-001-f1ec7620",
    "course-g03-l01-rw-001",
  ]);
  assert.equal(new Set(alias.placements.map((placement) => placement.swf.sha256)).size, 1);
  assert.equal(new Set(alias.placements.map((placement) => placement.fla.sha256)).size, 1);
  assert.equal(alias.placementRoutesAndContextRequireSeparateFutureValidation, true);
});

test("binds the current ledger while leaving batch-003 and every acceptance dimension closed", async () => {
  const report = await buildReportOnce();
  assert.equal(report.batchGate.open, false);
  assert.equal(report.batchGate.prerequisiteKind, "release-strict");
  assert.equal(report.batchGate.prerequisiteBatchId, null);
  assert.equal(report.batchGate.prerequisiteReleaseId, "lesson-g04-l03-negative-numbers");
  assert.equal(report.batchGate.requiredAnimationCount, 40);
  assert.equal(report.batchGate.admittedAnimationCount, 0);
  assert.equal(report.batchGate.missingAnimationCount, 40);
  assert.equal(report.sourceBindings.completionLedgerCheck.current, true);
  assert.equal(report.sourceBindings.completionLedgerCheck.strictComplete, 0);
  assert.equal(report.acceptance.acceptanceNeutral, true);
  assert.equal(report.acceptance.implementationAuthorized, false);
  for (const [key, value] of Object.entries(report.acceptance)) {
    if (["acceptanceNeutral", "implementationAuthorized", "statement"].includes(key)) continue;
    assert.equal(value, 0, key);
  }
  assert.equal(report.summary.implementationAuthorized, 0);
  assert.equal(report.summary.strictComplete, 0);
  assert.equal(report.summary.selectedPilotWorkspacesExcludedFromWrites, 1);
  assert.equal(report.sourceBindings.ffdec.legacyCodeExecuted, false);
  assert.equal(report.sourceBindings.ffdec.networkEndpointsInvoked, 0);
  assert.equal(report.sourceBindings.ffdec.temporaryOutputRemoved, true);
});

test("checked-in JSON and Markdown are exactly reproducible", async () => {
  const report = await buildReportOnce();
  const [json, markdown] = await Promise.all([
    readFile("reports/batch-003-static-machine-audit.json", "utf8"),
    readFile("reports/batch-003-static-machine-audit.md", "utf8"),
  ]);
  assert.equal(json, canonicalJson(report));
  assert.equal(markdown, renderBatch003StaticMachineAuditMarkdown(report));
});

test("validator fails closed on gate, approval, physical, language, alias, and fingerprint promotion", async () => {
  const report = await buildReportOnce();
  const mutations = [
    ["gate", (copy) => { copy.batchGate.open = true; }, /gate boundary/],
    ["authorization", (copy) => { copy.acceptance.implementationAuthorized = true; }, /cannot authorize/],
    ["ledger", (copy) => { copy.sourceBindings.completionLedgerCheck.strictComplete = 1; }, /ledger is not current and empty/],
    ["physical", (copy) => { copy.items[0].source.canonical.swf.physicalHashVerified = false; }, /physical\/evidence boundary/],
    ["language", (copy) => { copy.audioInventory.catalogLanguageCounts = {es: 24}; }, /catalog audio boundary/],
    ["alias", (copy) => { copy.aliasRelationships[0].placementCount = 1; }, /alias placement relationship/],
    ["fingerprint", (copy) => { copy.summary.itemSetSha256 = "0".repeat(64); }, /item-set fingerprint/],
  ];
  for (const [label, mutate, pattern] of mutations) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateBatch003StaticMachineAudit(copy), pattern, label);
  }
});

test("validator rehashes every audit item before validating the item set", async () => {
  const report = await buildReportOnce();
  const mutations = [
    ["source bytes", (copy) => { copy.items[0].source.canonical.swf.bytes += 1; }],
    ["script fact", (copy) => { copy.items[0].scripts.exportedScriptFileCount += 1; }],
    ["item fingerprint", (copy) => { copy.items[0].auditFingerprintSha256 = "0".repeat(64); }],
  ];
  for (const [label, mutate] of mutations) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(
      () => validateBatch003StaticMachineAudit(copy),
      /item audit fingerprint is stale/,
      label,
    );
  }
});

test("CLI accepts only deterministic report options and bounded concurrency", () => {
  const options = parseArguments(["--check", "--concurrency", "8"]);
  assert.equal(options.check, true);
  assert.equal(options.concurrency, 8);
  assert.match(options.jsonOutput, /reports\/batch-003-static-machine-audit\.json$/);
  assert.match(options.markdownOutput, /reports\/batch-003-static-machine-audit\.md$/);
  assert.throws(() => parseArguments(["--concurrency", "0"]), /integer from 1 through 8/);
  assert.throws(() => parseArguments(["--concurrency", "9"]), /integer from 1 through 8/);
  assert.throws(() => parseArguments(["--batch", "batch-004"]), /Unknown option/);
});

test("local batch-003 report wrapper rejects an existing FIFO", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "batch-003-report-output-"));
  try {
    const reports = path.join(root, "reports");
    await mkdir(reports);
    const fifo = path.join(reports, "audit.json");
    await execFileAsync("mkfifo", [fifo]);
    await assert.rejects(
      writeOrCheckReport(fifo, "replacement\n", {root, extension: ".json"}),
      /existing regular file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
