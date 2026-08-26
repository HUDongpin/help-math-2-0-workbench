#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile} from "node:fs/promises";
import test from "node:test";

import {
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle as buildHistoricalBundle,
  parseCliArgs,
  validateReport,
} from "./build-g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.mjs";
import {
  buildBundle as buildRelocationBundle,
  checkReport as checkRelocationReport,
} from "./build-g4-l10-vb003-candidate-asset-relocation-successor-v1.mjs";

const historicalJsonBytes = await readFile(REPORT_JSON);
const historicalMarkdownBytes = await readFile(REPORT_MARKDOWN);
const bundle = {report: JSON.parse(historicalJsonBytes.toString("utf8"))};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function modeOf(metadata) {
  return Number(metadata.mode & 0o777).toString(8).padStart(4, "0");
}

test("CLI is restricted to dry-run, no-clobber write, or read-only check", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});

test("all 203 predecessor PNGs are decoded, rehashed, and reproduce the sequence", () => {
  const closure = bundle.report.predecessor.captureClosure;
  assert.equal(closure.captureCount, 203);
  assert.equal(closure.fileCountIncludingManifest, 204);
  assert.equal(closure.decodedAndRehashedPngCount, 203);
  assert.equal(closure.totalPngBytes, 5148744);
  assert.equal(closure.comparedConsecutivePairCount, 202);
  assert.equal(closure.byteIdenticalToPreviousFrameCount, 55);
  assert.equal(closure.changedFromPreviousFrameCount, 147);
  assert.equal(closure.uniqueRgbaRasterCount, 148);
  assert.equal(closure.byteIdenticalToFrameOneCount, 3);
  assert.equal(closure.transitionStartFrames.length, 147);
  assert.equal(closure.predecessorSequenceReproducedExactly, true);
  assert.match(closure.captureSetSha256, /^[0-9a-f]{64}$/);
  assert.equal(bundle.report.predecessor.captures.length, 203);
});

test("currentness drift is exactly two declared ledger hashes", () => {
  assert.deepEqual(bundle.report.currentness.exactChangedBindingKeys,
    ["completionLedger", "lessonReleaseLedger"]);
  assert.equal(bundle.report.currentness.exactChangedBindingCount, 2);
  assert.equal(bundle.report.currentness
    .allNonLedgerBindingsByteIdenticalToPredecessor, true);
  assert.deepEqual(bundle.report.currentness.changes.map((change) => ({
    key: change.key,
    old: change.predecessor.sha256,
    current: change.current.sha256,
  })), [
    {
      key: "completionLedger",
      old: "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
      current: "3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db",
    },
    {
      key: "lessonReleaseLedger",
      old: "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
      current: "1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc",
    },
  ]);
});

test("current formal state remains fail-closed", () => {
  const state = bundle.report.formalState;
  assert.equal(state.formalCapturedFrameCountEffect, 0);
  assert.equal(state.registryPresenceCount, 0);
  assert.equal(state.completionLedgerEntryPresent, false);
  assert.equal(state.completionLedgerStatus, "preserved");
  assert.equal(state.completionLedgerErrorCount, 93);
  assert.equal(state.releaseMemberStatus, "missing");
  assert.equal(state.releaseStrictCompleteCount, 0);
  assert.equal(state.releaseMissingCount, 47);
  assert.equal(state.releasePublished, false);
  assert.equal(state.releaseGateOpen, false);
  assert.deepEqual(state.nestedRequirements.map((entry) => [
    entry.language, entry.status, entry.capturedFrameCount,
    entry.missingFrameCount, entry.baselineAuthority,
  ]), [
    ["en", "blocked", 0, 203, "unresolved"],
    ["es", "blocked", 0, 203, "unresolved"],
  ]);
});

test("successor creates no helper, runtime, review, or acceptance authority", () => {
  validateReport(bundle.report);
  assert.ok(Object.values(bundle.report.authority).every((value) =>
    value === false));
  assert.equal(bundle.report.scope.browserRecapturePerformed, false);
  assert.equal(bundle.report.scope.originalRuntimeReadOrLaunchPerformed, false);
  assert.equal(bundle.report.scope.helperReadOrExecutionPerformed, false);
  assert.equal(bundle.report.independentReview.taskAuthorized, false);
  assert.deepEqual(bundle.report.independentReview.taskIds, []);
  assert.equal(bundle.report.independentReview.reviewerVerdictPresent, false);
  assert.equal(bundle.report.acceptanceEffect, "none");
});

test("the v1 successor remains frozen historical evidence and the relocation successor owns currentness", async () => {
  assert.equal(historicalJsonBytes.length, 71333);
  assert.equal(sha256(historicalJsonBytes),
    "3a77a67fd1acff1f673352da59bd5bb8187bdc3a33c416836c2c1d6e5a1a77cd");
  assert.equal(historicalMarkdownBytes.length, 1449);
  assert.equal(sha256(historicalMarkdownBytes),
    "a4010f5bee509bfed42252ed10f65f3cff095bf18cc453069d334c215f246a5c");
  assert.equal(modeOf(await lstat(REPORT_JSON)), "0444");
  assert.equal(modeOf(await lstat(REPORT_MARKDOWN)), "0444");
  await assert.rejects(
    () => buildHistoricalBundle(),
    /public\/flash-assets\/courses\/course-g04-l10-vb-003/u,
  );
  const current = await buildRelocationBundle();
  const checked = await checkRelocationReport(current);
  assert.equal(checked.vb003ErrorCount, 93);
  assert.equal(checked.strictComplete, 0);
  assert.equal(checked.publishedReleaseCount, 0);
  assert.equal(checked.acceptanceEffect, false);
});
