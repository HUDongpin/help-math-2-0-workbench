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
} from "./build-g4-key-term-runtime-resolution-plan-v2.mjs";

let snapshot;
let report;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  report = deriveReport(snapshot);
});

test("accepts only one read-only write or check mode", () => {
  assert.equal(parseArguments(["--write"]), "--write");
  assert.equal(parseArguments(["--check"]), "--check");
  assert.throws(() => parseArguments([]), /choose exactly one/u);
  assert.throws(() => parseArguments(["--write", "--check"]),
    /choose exactly one/u);
  assert.throws(() => parseArguments(["--apply"]), /unsupported/u);
  assert.throws(() => parseArguments(["--launch"]), /unsupported/u);
});

test("binds the exact v1 review plan and all 317 missing runtime paths", () => {
  assert.equal(validateResolutionPlanV2(report), true);
  assert.equal(report.successorOf.sha256,
    "66b47caf4822b213066a39885d1258f99054e4c00186835b1086dd303f69faaa");
  assert.equal(report.successorOf.reportFingerprintSha256,
    "ca67ea117c084ab543d18ffcbf7a1afcee25b645bfbffefcdba42509afa14b11");
  assert.equal(report.successorOf.missingPathSetSha256,
    "10a4fb0f80281395066ef730d2f5fe4d0a504a43b70f4a2cb95f2e42c856dc99");
  assert.equal(report.summary.obligationCount, 317);
  assert.equal(report.obligations.length, 317);
});

test("rehashes the exact frozen 5793 plus 267 ledger universe", () => {
  assert.equal(report.frozenLedgerEvidence.allLedgerFilesRehashed, true);
  assert.equal(report.frozenLedgerEvidence.v7.ledgerCount, 5793);
  assert.equal(report.frozenLedgerEvidence.v8.ledgerCount, 267);
  assert.equal(report.frozenLedgerEvidence.v7.objectBytes, 6185764941);
  assert.equal(report.frozenLedgerEvidence.v8.objectBytes, 5876648196);
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

test("scans all 12120 retained path fields against all 317 targets and finds zero", () => {
  assert.equal(report.summary.v7V8PathFieldCount, 12120);
  assert.equal(report.frozenLedgerEvidence.pathFieldCount, 12120);
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

test("keeps known quarantine candidate hashes separate from accepted expected identity", () => {
  const candidates = report.obligations.filter(({quarantineCandidate}) =>
    quarantineCandidate);
  assert.equal(candidates.length, 316);
  assert.equal(new Set(candidates.map(({quarantineCandidate}) =>
    quarantineCandidate.sha256)).size, 315);
  assert.ok(candidates.every(({quarantineCandidate, expectedSha256}) =>
    /^[a-f0-9]{64}$/u.test(quarantineCandidate.sha256) &&
    Number.isSafeInteger(quarantineCandidate.bytes) &&
    expectedSha256 === null));
  assert.equal(report.summary.expectedRuntimeSha256AcceptedCount, 0);
  assert.equal(report.summary.expectedRuntimeSha256UnacceptedCount, 317);
  assert.equal(report.summary.existingQuarantineReviewCandidateCount, 316);
  assert.equal(report.summary.exactPlacementReviewHolds, 17);
  assert.equal(report.summary.caseVariantPlacementReviewHolds, 299);
  assert.equal(report.summary.selectedCandidateCount, 0);
});

test("keeps Polynomial.swf unresolved after both DIG and frozen-ledger search", () => {
  assert.equal(report.polynomialDisposition.expectedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(report.polynomialDisposition.expectedSha256, null);
  assert.equal(report.polynomialDisposition.v1QuarantineRuntimeCandidate, null);
  assert.equal(report.polynomialDisposition.v7V8LedgerPathCandidateCount, 0);
  assert.equal(report.polynomialDisposition.companionFlaSha256,
    "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263");
  assert.equal(report.polynomialDisposition
    .companionFlaDoesNotSubstituteForShippedRuntime, true);
  assert.equal(report.summary.unresolvedRuntimeSwfCount, 1);
  assert.equal(report.summary.sourceDependencyClosure, false);
});

test("reads no frozen payload and creates no mutation, runtime, or acceptance authority", () => {
  assert.equal(report.frozenLedgerEvidence.objectFilesRehashedByThisSuccessor, 0);
  assert.equal(report.controls.frozenObjectPayloadBytesReadByThisSuccessor, false);
  assert.equal(report.controls.executable, false);
  assert.equal(report.controls.executorPresent, false);
  assert.equal(report.controls.applySupported, false);
  assert.equal(report.controls.filenameOrPathAdmissionUsed, false);
  assert.equal(report.controls.automaticCaseNormalizationAuthorized, false);
  assert.equal(report.controls.sourceAssetsMutationAuthorized, false);
  assert.equal(report.controls.sourceAssetsMutationPerformed, false);
  assert.equal(report.controls.frozenV7V8MutationPerformed, false);
  assert.equal(report.controls.reviewTaskCreated, false);
  assert.equal(report.controls.helperImplementedOrExecuted, false);
  assert.equal(report.controls.originalRuntimeLaunched, false);
  assert.deepEqual(report.promotionRecords, []);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("emits no private raw path, Drive identifier, or personal identifier", () => {
  for (const output of [stableJson(report), renderMarkdown(report)]) {
    assert.doesNotMatch(output, /\/Volumes\//u);
    assert.doesNotMatch(output,
      /firstObserved|relativePathBytesBase64|DriveFolderId|driveEntryId/u);
    assert.doesNotMatch(output,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  }
});

test("validator rejects a fabricated match, expected identity, promotion, or acceptance", () => {
  const match = structuredClone(report);
  match.obligations[0].frozenV7V8LedgerDiscovery.basenameCaseInsensitiveMatchCount = 1;
  assert.throws(() => validateResolutionPlanV2(match));

  const expectedIdentity = structuredClone(report);
  expectedIdentity.obligations[0].expectedSha256 = "a".repeat(64);
  assert.throws(() => validateResolutionPlanV2(expectedIdentity));

  const promotion = structuredClone(report);
  promotion.promotionRecords.push({sha256: "a".repeat(64)});
  assert.throws(() => validateResolutionPlanV2(promotion));

  const acceptance = structuredClone(report);
  acceptance.acceptanceEffects.ownerAcceptance = true;
  assert.throws(() => validateResolutionPlanV2(acceptance));
});

test("no-clobber output creates mode 0444 once and refuses reuse", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-keyterm-v2-output-"),
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
  assert.equal(report.inputSetSha256,
    "50dd35bfc7f21d4bccde8dc21350cc9084e7752902d56141a5db57b6c0122a91");
  assert.equal(report.reportFingerprintSha256,
    "f9093f610dd4992d71390e39f7dbbcdf17d730a1f47a5ced12f974b71d59f720");
});

test("check mode repeats v1, canonical, quarantine, and complete ledger validation", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.outputs, [
    `${OUTPUT_PREFIX}.json`,
    `${OUTPUT_PREFIX}.md`,
  ]);
});
