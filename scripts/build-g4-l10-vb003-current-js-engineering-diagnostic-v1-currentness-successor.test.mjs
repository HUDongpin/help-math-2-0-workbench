#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle,
  checkReport,
  parseCliArgs,
  publishNoClobber,
  validateReport,
} from "./build-g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.mjs";

const bundle = await buildBundle();

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

test("publication is exact no-clobber, read-only, checkable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-vb003-currentness-successor-")));
  try {
    await mkdir(path.join(tempRoot, "reports"));
    const published = await publishNoClobber(bundle, {outputRoot: tempRoot});
    assert.equal(published.disposition, "checked");
    await assert.rejects(() => publishNoClobber(bundle,
      {outputRoot: tempRoot}), /refusing overwrite/);
    const jsonPath = path.join(tempRoot, REPORT_JSON);
    const markdownPath = path.join(tempRoot, REPORT_MARKDOWN);
    await chmod(jsonPath, 0o644);
    await writeFile(jsonPath, `${bundle.json} `);
    await assert.rejects(() => checkReport(bundle, tempRoot),
      /bytes changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});
