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
} from "./build-g4-l10-ts007-frame-domain-disposition-currentness-v2.mjs";

const bundle = await buildBundle();

function undefinedPaths(value) {
  const paths = [];
  function walk(current, prefix) {
    if (!current || typeof current !== "object") return;
    for (const key of Reflect.ownKeys(current)) {
      const next = current[key];
      const nextPath = [...prefix, String(key)];
      if (next === undefined) paths.push(nextPath.join("."));
      else walk(next, nextPath);
    }
  }
  walk(value, []);
  return paths;
}

test("v2 freezes the exact v1 serialization defect without changing facts", () => {
  const report = bundle.report;
  assert.equal(report.successorOf.sha256,
    "4e0d8b649828734d838b5e4073db9e671da9cdb8a458fb80017b4c5c722cfa19");
  assert.equal(report.predecessorSerializationDefect
    .predecessorFingerprintSha256,
  "204a874c088e7121a8df457644b498e3b46c02cb837a3b91f19ab931c5adc5ed");
  assert.equal(report.predecessorSerializationDefect
    .parsedPredecessorRecomputedFingerprintSha256,
  "a6b7416d26f68e0e59080d1bb8e8f34a4c8834235df9e07918b760b8ba59dedd");
  assert.deepEqual(report.predecessorSerializationDefect
    .exactInMemoryUndefinedPaths, [
    "independentStaticRecomputation.sprite64.directFfdecFrameScriptCount",
  ]);
  assert.equal(report.predecessorSerializationDefect.authorityEffect, "none");
  assert.equal(report.predecessorSerializationDefect.factualEffect,
    "none; the bound source recomputation already established one direct FFDec frame script and kept sprite-64 unresolved");
});

test("v2 stores the exact direct FFDec frame-script count", () => {
  assert.equal(bundle.report.independentStaticRecomputation.sprite64
    .directFfdecFrameScriptCount, 1);
  assert.deepEqual(bundle.report.independentStaticRecomputation.sprite64
    .disqualifiers, [
    "swfmill-do-action-present",
    "ffdec-frame-script-present",
  ]);
  assert.equal(bundle.report.currentDisposition.dispositionCounts.unresolved, 1);
  assert.deepEqual(bundle.report.currentDisposition.unresolvedTimelineIds,
    ["sprite-64"]);
  assert.deepEqual(bundle.report.currentDisposition
    .newlyCompositeRelativeToCoverageTimelineIds,
  ["sprite-355", "sprite-379"]);
});

test("v2 is JSON-round-trip and parsed-file fingerprint stable", () => {
  validateReport(bundle.report);
  assert.deepEqual(undefinedPaths(bundle.report), []);
  const parsed = JSON.parse(bundle.json);
  assert.deepEqual(parsed, bundle.report);
  assert.doesNotThrow(() => validateReport(parsed));
  assert.equal(parsed.fingerprintSerializationContract.undefinedValueCount, 0);
  assert.equal(parsed.fingerprintSerializationContract.jsonRoundTripDeepEqual,
    true);
  assert.equal(parsed.fingerprintSerializationContract
    .jsonRoundTripFingerprintEqual, true);
});

test("v2 keeps coverage stale and raw/formal state unchanged", () => {
  const report = bundle.report;
  assert.equal(report.coverageCurrentness.currentAgainstDisposition, false);
  assert.equal(report.coverageCurrentness.boundPredecessorDisposition
    .dispositionCounts.unresolved, 3);
  assert.equal(report.coverageCurrentness.currentDisposition
    .dispositionCounts.unresolved, 1);
  assert.equal(report.coverageCurrentness.capturedFrameCount, 0);
  assert.equal(report.coverageCurrentness.baselineAuthority, "unresolved");
  assert.equal(report.aggregateProjectionBoundary.rawDispositionResidualCount,
    70);
  assert.equal(report.aggregateProjectionBoundary
    .formalRequirementProjectionResidualCount, 74);
  assert.equal(report.aggregateProjectionBoundary.changeCreatedByThisReport, 0);
});

test("v2 creates no reviewer, helper, runtime, renderer, or acceptance authority", () => {
  const report = bundle.report;
  assert.deepEqual(report.downstreamBoundary.prohibitedModes,
    ["--apply", "--dry-run", "--check"]);
  assert.equal(report.securityAndRuntimeBoundary.reviewSetManifestBound, false);
  assert.equal(report.securityAndRuntimeBoundary.reviewerTaskCount, 0);
  assert.equal(report.securityAndRuntimeBoundary.phaseAExecuted, false);
  assert.equal(report.securityAndRuntimeBoundary.phaseBExecuted, false);
  assert.equal(report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorized, false);
  assert.ok(Object.values(report.authorityEffects).every((value) =>
    value === false));
  assert.equal(report.review.reviewTaskAuthorized, false);
  assert.deepEqual(report.review.reviewTaskIds, []);
});

test("v2 publication is exact no-clobber, immutable, and tamper-evident", async () => {
  const tempRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    "g4-l10-ts007-frame-domain-currentness-v2-")));
  try {
    await mkdir(path.join(tempRoot, "reports"));
    const published = await publishNoClobber(bundle, {outputRoot: tempRoot});
    assert.equal(published.disposition, "checked");
    assert.equal(published.parseStable, true);
    assert.equal(published.undefinedValueCount, 0);
    assert.equal(published.directFfdecFrameScriptCount, 1);
    await assert.rejects(() => publishNoClobber(bundle,
      {outputRoot: tempRoot}), /refusing overwrite/);
    const jsonPath = path.join(tempRoot, REPORT_JSON);
    const markdownPath = path.join(tempRoot, REPORT_MARKDOWN);
    await chmod(jsonPath, 0o644);
    await writeFile(jsonPath, `${bundle.json} `);
    await assert.rejects(() => checkReport(bundle, tempRoot),
      /byte count changed|SHA-256 changed/);
    await chmod(markdownPath, 0o644);
  } finally {
    await rm(tempRoot, {recursive: true, force: true});
  }
});

test("v2 validator rejects restored undefined, count, runtime, or authority drift", () => {
  for (const mutate of [
    (copy) => { copy.independentStaticRecomputation.sprite64
      .directFfdecFrameScriptCount = undefined; },
    (copy) => { copy.independentStaticRecomputation.sprite64
      .directFfdecFrameScriptCount = 0; },
    (copy) => { copy.currentDisposition.unresolvedTimelineIds = []; },
    (copy) => { copy.aggregateProjectionBoundary.rawDispositionResidualCount = 69; },
    (copy) => { copy.securityAndRuntimeBoundary.phaseAExecuted = true; },
    (copy) => { copy.authorityEffects.originalRuntimeLaunch = true; },
  ]) {
    const copy = structuredClone(bundle.report);
    mutate(copy);
    assert.throws(() => validateReport(copy));
  }
});

test("v2 CLI accepts only explicit non-overwriting modes", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--apply"]));
  assert.throws(() => parseCliArgs(["--check", "extra"]));
});
