import assert from "node:assert/strict";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildArtifacts,
  buildLedger,
  checkArtifacts,
  parseArguments,
  stableJson,
  validateLedgerContract,
  writeArtifacts,
} from "./build-page-only-migration-control-ledger.mjs";

const ledgerPromise = buildLedger();

test("builds the exact page-only denominator in deterministic source order", async () => {
  const ledger = await ledgerPromise;

  assert.equal(ledger.scope.lessonCount, 29);
  assert.equal(ledger.scope.occurrenceCount, 1_751);
  assert.deepEqual(ledger.scope.gradeOccurrences, {3: 546, 4: 645, 5: 560});
  assert.equal(ledger.scope.courseShellCount, 0);
  assert.equal(ledger.rows.length, 1_751);
  assert.equal(new Set(ledger.rows.map(({placementId}) => placementId)).size,
    1_751);

  const rowsByLesson = new Map();
  ledger.rows.forEach((row, index) => {
    assert.equal(row.catalogOccurrenceOrdinal, index + 1);
    assert.doesNotMatch(row.catalogAnimationId, /^shell-/u);
    assert.doesNotMatch(row.uniqueRendererId ?? "", /^shell-/u);
    const key = `${row.grade}:${row.lesson}`;
    const lessonRows = rowsByLesson.get(key) ?? [];
    lessonRows.push(row);
    rowsByLesson.set(key, lessonRows);
  });
  assert.equal(rowsByLesson.size, 29);
  for (const rows of rowsByLesson.values()) {
    rows.forEach((row, index) => {
      assert.equal(row.sourceOccurrence, index + 1);
      assert.equal(row.globalPageOrdinal, index + 1);
      assert.equal(row.placementId,
        `g${String(row.grade).padStart(2, "0")}-l${String(row.lesson)
          .padStart(2, "0")}-placement-${String(index + 1).padStart(3, "0")}`);
    });
  }
});

test("joins 1,361 resolved and 390 missing source occurrences without collapsing IN028", async () => {
  const ledger = await ledgerPromise;
  assert.deepEqual(ledger.summary.sourceCustody, {
    resolvedOccurrences: 1_361,
    missingOccurrences: 390,
    uniqueMissingExpectedPaths: 389,
    joinedOccurrences: 1_751,
    physicalFreeze: ledger.summary.sourceCustody.physicalFreeze,
  });
  assert.equal(ledger.summary.sourceCustody.physicalFreeze.fileCount, 9_313);
  assert.equal(ledger.summary.sourceCustody.physicalFreeze.totalBytes,
    3_308_484_004);
  assert.equal(ledger.summary.sourceCustody.physicalFreeze.writableEntries, 0);

  const shared = ledger.rows.filter(({sharedRendererGroup}) =>
    sharedRendererGroup !== null);
  assert.deepEqual(shared.map(({grade, lesson, sourceOccurrence,
    expectedSwfPath, uniqueRendererId}) => ({
    grade,
    lesson,
    sourceOccurrence,
    expectedSwfPath,
    uniqueRendererId,
  })), [45, 46].map((sourceOccurrence) => ({
    grade: 5,
    lesson: 3,
    sourceOccurrence,
    expectedSwfPath: "HELP_COURSES/ELMGR5/L3/IN/L3IN28.swf",
    uniqueRendererId: "course-g05-l03-in-028",
  })));
});

test("retains exactly 426 registered occurrences, 425 renderers, and eight Lessons", async () => {
  const ledger = await ledgerPromise;
  const registeredRows = ledger.rows.filter(
    ({registeredCurrentJs}) => registeredCurrentJs.satisfied,
  );
  assert.equal(registeredRows.length, 426);
  assert.equal(new Set(registeredRows.map(({uniqueRendererId}) =>
    uniqueRendererId)).size, 425);
  assert.deepEqual(ledger.lessons
    .filter(({registeredCurrentJs, occurrences}) =>
      registeredCurrentJs === occurrences)
    .map(({grade, lesson, occurrences}) => ({grade, lesson, occurrences})), [
    {grade: 3, lesson: 2, occurrences: 70},
    {grade: 4, lesson: 3, occurrences: 39},
    {grade: 4, lesson: 5, occurrences: 53},
    {grade: 4, lesson: 10, occurrences: 46},
    {grade: 4, lesson: 11, occurrences: 43},
    {grade: 5, lesson: 3, occurrences: 65},
    {grade: 5, lesson: 4, occurrences: 54},
    {grade: 5, lesson: 5, occurrences: 56},
  ]);
  for (const row of registeredRows) {
    assert.equal(row.registeredCurrentJs.evidence.moduleKey,
      row.uniqueRendererId);
    assert.equal(row.myLessons.satisfied, true);
    assert.equal(row.myLessons.evidence.descriptorId,
      row.registeredCurrentJs.evidence.descriptorId);
  }
  assert.equal(ledger.summary.currentJs.remainingOccurrences, 1_325);
});

test("keeps candidate stock and every downstream gate independent", async () => {
  const ledger = await ledgerPromise;
  const candidateOnly = ledger.rows.filter(
    ({candidate}) => candidate.candidateOnly,
  );
  assert.equal(candidateOnly.length, 5);
  assert.equal(candidateOnly.every(
    ({registeredCurrentJs}) => !registeredCurrentJs.satisfied), true);
  assert.deepEqual(ledger.summary.currentJs.candidateToProductYield, {
    state: "not-established",
    numerator: null,
    denominator: null,
    percentage: null,
    reason: ledger.summary.currentJs.candidateToProductYield.reason,
  });
  assert.deepEqual(ledger.summary.downstreamGates, {
    myLessonsCurrentCode: 426,
    originalRuntime: 0,
    technicalFidelity: 0,
    audio: 0,
    humanReview: 0,
    ownerAcceptance: 0,
    strictComplete: 0,
    released: 0,
    productionVerified: 0,
  });
  for (const row of ledger.rows) {
    for (const gate of [
      row.originalRuntime,
      row.technicalFidelity,
      row.audio,
      row.humanReview,
      row.ownerAcceptance,
      row.strictCompletion,
      row.release,
      row.production,
    ]) assert.equal(gate.satisfied, false);
  }
});

test("reports complexity and implementation lanes without inference", async () => {
  const ledger = await ledgerPromise;
  assert.deepEqual(ledger.summary.complexity, {
    "behavior-heavy": 165,
    "interactive-understood": 24,
    low: 9,
    unclassified: 1_553,
  });
  assert.equal(ledger.summary.implementationLanes.factory, 47);
  assert.equal(ledger.summary.implementationLanes["advanced-manual"], 0);
  assert.equal(ledger.summary.implementationLanes.unclassified, 1_704);
  assert.equal(ledger.summary.implementationLanes.observedLabels[
    "manual-source-static-fallback-private-current-js"
  ], 7);
});

test("schema and independent-gate validation fail closed", async () => {
  const ledger = await ledgerPromise;
  assert.equal(validateLedgerContract(ledger), true);

  const extraField = structuredClone(ledger);
  extraField.rows[0].unsupportedInference = true;
  assert.throws(() => validateLedgerContract(extraField),
    /fields must be exactly/u);

  const nestedExtraField = structuredClone(ledger);
  nestedExtraField.rows[0].sourceXml.unboundReceipt = "invented";
  assert.throws(() => validateLedgerContract(nestedExtraField),
    /sourceXml fields must be exactly/u);

  const invalidSourceHash = structuredClone(ledger);
  invalidSourceHash.rows[0].sourceXml.sha256 = "unknown";
  assert.throws(() => validateLedgerContract(invalidSourceHash),
    /source XML path\/SHA-256 is invalid/u);

  const missingWithInferredAsset = structuredClone(ledger);
  const missingIndex = missingWithInferredAsset.rows.findIndex(
    ({sourceCustody}) => !sourceCustody.satisfied,
  );
  missingWithInferredAsset.rows[missingIndex].assetId = `swf-${"0".repeat(64)}`;
  assert.throws(() => validateLedgerContract(missingWithInferredAsset),
    /missing source custody contains inferred canonical evidence/u);

  const inferredFidelity = structuredClone(ledger);
  inferredFidelity.rows[0].technicalFidelity.satisfied = true;
  assert.throws(() => validateLedgerContract(inferredFidelity),
    /technicalFidelity gate is invalid or inferred|independent downstream gate was inferred/u);

  const collapsedOccurrence = structuredClone(ledger);
  collapsedOccurrence.rows[1].sourceOccurrence = 1;
  assert.throws(() => validateLedgerContract(collapsedOccurrence),
    /global\/source occurrence mismatch|placementId drift|not contiguous source order/u);
});

test("generation and check mode are byte-for-byte deterministic", async (t) => {
  const [first, second] = await Promise.all([buildArtifacts(), buildArtifacts()]);
  assert.equal(first.ledgerText, second.ledgerText);
  assert.equal(first.dashboardText, second.dashboardText);
  assert.equal(first.ledgerText, stableJson(first.ledger));
  assert.match(first.dashboardText,
    /baseline remains \*\*426 \/ 1,751 occurrences\*\*/u);

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-p1-ledger-test-"));
  t.after(() => rm(temporaryRoot, {recursive: true, force: true}));
  const ledgerPath = path.join(temporaryRoot, "ledger.json");
  const dashboardPath = path.join(temporaryRoot, "dashboard.md");

  assert.equal((await checkArtifacts({ledgerPath, dashboardPath})).ok, false);
  await writeArtifacts({ledgerPath, dashboardPath});
  assert.equal((await checkArtifacts({ledgerPath, dashboardPath})).ok, true);
  await writeFile(dashboardPath, "stale\n");
  const stale = await checkArtifacts({ledgerPath, dashboardPath});
  assert.equal(stale.ledgerCurrent, true);
  assert.equal(stale.dashboardCurrent, false);
  assert.equal(stale.ok, false);
});

test("CLI arguments reject unknown or ambiguous modes", () => {
  assert.deepEqual(parseArguments([]), {check: false, json: false, help: false});
  assert.deepEqual(parseArguments(["--check", "--json"]), {
    check: true,
    json: true,
    help: false,
  });
  assert.throws(() => parseArguments(["--write-anywhere"]),
    /Unknown argument/u);
});
