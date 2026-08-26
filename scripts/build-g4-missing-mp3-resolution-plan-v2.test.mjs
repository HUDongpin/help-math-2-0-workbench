import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  OUTPUT_PREFIX,
  PROJECT_ROOT,
  deriveReport,
  parseArguments,
  readSnapshot,
  renderMarkdown,
  runCli,
  stableJson,
  validateResolutionPlanV2,
  writeNoClobber,
} from "./build-g4-missing-mp3-resolution-plan-v2.mjs";

let snapshot;
let report;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  report = deriveReport(snapshot);
});

test("requires exactly one plan-only write or check mode", () => {
  assert.equal(parseArguments(["--write"]), "--write");
  assert.equal(parseArguments(["--check"]), "--check");
  assert.throws(() => parseArguments([]), /choose exactly one/u);
  assert.throws(() => parseArguments(["--write", "--check"]),
    /choose exactly one/u);
  assert.throws(() => parseArguments(["--apply"]), /unsupported/u);
  assert.throws(() => parseArguments(["--launch"]), /unsupported/u);
});

test("binds v1 without changing its sixteen unresolved obligations", () => {
  assert.equal(validateResolutionPlanV2(report), true);
  assert.equal(report.successorOf.sha256,
    "1ae71b2ef098dde37885c89f351e55d29e2ee6d80140b2c6335c99e238b649fd");
  assert.equal(report.successorOf.missingPathSetSha256,
    "439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286");
  assert.equal(report.obligations.length, 16);
  assert.deepEqual(report.distribution.byLesson, {L2: 14, L6: 1, L8: 1});
  assert.equal(report.summary.expectedSha256KnownCount, 0);
  assert.equal(report.summary.expectedSha256UnknownCount, 16);
});

test("rehashes the exact frozen 5793 plus 267 ledger universe", () => {
  assert.equal(report.frozenLedgerEvidence.allLedgerFilesRehashed, true);
  assert.equal(report.frozenLedgerEvidence.v7.ledgerCount, 5793);
  assert.equal(report.frozenLedgerEvidence.v8.ledgerCount, 267);
  assert.equal(report.frozenLedgerEvidence.union.uniqueSha256Count, 6060);
  assert.equal(report.frozenLedgerEvidence.union.overlapCount, 0);
  assert.equal(report.frozenLedgerEvidence.union.digestSetSha256,
    "705c93bd496e8979e14a10b66e3cb376c1f00d9d417a6c4a6acc4790169ac9ed");
  assert.equal(report.frozenLedgerEvidence.v7.ledgerBindingSetSha256,
    "87fc25a75e7f0a52f8af377966c71331d0157044aa013ccb29e7ac5539d5c734");
  assert.equal(report.frozenLedgerEvidence.v8.ledgerBindingSetSha256,
    "e1cca49d20754b8bf78089ccb1530cf2dee6601175034c33440dffa9b8326668");
  assert.equal(report.frozenLedgerEvidence.objectManifestBindingsChecked, 6060);
});

test("scans 12120 retained-buffer path fields and finds no target candidate", () => {
  assert.equal(report.frozenLedgerEvidence.pathFieldCount, 12120);
  assert.match(report.frozenLedgerEvidence.privatePathProjectionSha256,
    /^[a-f0-9]{64}$/u);
  assert.equal(report.summary.exactCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.caseInsensitiveCanonicalSuffixMatchCount, 0);
  assert.equal(report.summary.basenameMatchCount, 0);
  assert.equal(report.summary.candidateObjectCount, 0);
  assert.ok(report.obligations.every((item) =>
    item.frozenV7V8LedgerDiscovery
      .exactCanonicalSuffixCaseSensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery
      .exactCanonicalSuffixCaseInsensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery.basenameCaseInsensitiveMatchCount === 0 &&
    item.frozenV7V8LedgerDiscovery.candidateObjectCount === 0));
});

test("keeps path discovery separate from SHA-256 admission", () => {
  assert.ok(report.obligations.every((item) =>
    item.expectedSha256 === null && item.expectedBytes === null &&
    item.frozenV7V8LedgerDiscovery.selectedCandidate === null &&
    item.frozenV7V8LedgerDiscovery.admissionAuthority === false));
  assert.equal(report.controls.filenameOrPathAdmissionUsed, false);
  assert.equal(report.summary.selectedCandidateCount, 0);
  assert.deepEqual(report.promotionRecords, []);
});

test("reads no frozen payload object and creates no operational authority", () => {
  assert.equal(report.controls.frozenObjectBytesReadByThisSuccessor, false);
  assert.equal(report.frozenLedgerEvidence.objectFilesRehashedByThisSuccessor, 0);
  assert.equal(report.controls.executable, false);
  assert.equal(report.controls.executorPresent, false);
  assert.equal(report.controls.applySupported, false);
  assert.equal(report.controls.sourceAssetsMutationPerformed, false);
  assert.equal(report.controls.frozenV7V8MutationPerformed, false);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("emits no private raw path or personal identifier", () => {
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  for (const output of [json, markdown]) {
    assert.doesNotMatch(output, /\/Volumes\//u);
    assert.doesNotMatch(output,
      /firstObserved|relativePathBytesBase64|DriveFolderId/u);
    assert.doesNotMatch(output, /private-archive\//u);
    assert.doesNotMatch(output,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  }
});

test("validator rejects a fabricated match, candidate, promotion, or acceptance", () => {
  const fabricatedMatch = structuredClone(report);
  fabricatedMatch.obligations[0].frozenV7V8LedgerDiscovery.basenameCaseInsensitiveMatchCount = 1;
  assert.throws(() => validateResolutionPlanV2(fabricatedMatch));

  const fabricatedCandidate = structuredClone(report);
  fabricatedCandidate.obligations[0].expectedSha256 = "a".repeat(64);
  assert.throws(() => validateResolutionPlanV2(fabricatedCandidate));

  const fabricatedPromotion = structuredClone(report);
  fabricatedPromotion.promotionRecords.push({sha256: "a".repeat(64)});
  assert.throws(() => validateResolutionPlanV2(fabricatedPromotion));

  const acceptanceExpansion = structuredClone(report);
  acceptanceExpansion.acceptanceEffects.audioCorrectnessOrAcceptance = true;
  assert.throws(() => validateResolutionPlanV2(acceptanceExpansion));
});

test("no-clobber output creates mode 0444 once and refuses reuse", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-mp3-v2-output-"),
  ));
  try {
    const output = path.join(temporary, "report.json");
    await writeNoClobber(output, "exact\n");
    await assert.rejects(writeNoClobber(output, "exact\n"), /EEXIST/u);
    await chmod(output, 0o644);
    await writeFile(output, "foreign\n", "utf8");
    await assert.rejects(writeNoClobber(output, "exact\n"), /EEXIST/u);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("checked-in JSON and Markdown equal the live deterministic report", async () => {
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, `${OUTPUT_PREFIX}.json`), "utf8"),
    stableJson(report),
  );
  assert.equal(
    await readFile(path.join(PROJECT_ROOT, `${OUTPUT_PREFIX}.md`), "utf8"),
    renderMarkdown(report),
  );
});

test("check mode repeats the complete read-only frozen-ledger verification", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.outputs, [
    `${OUTPUT_PREFIX}.json`,
    `${OUTPUT_PREFIX}.md`,
  ]);
});
