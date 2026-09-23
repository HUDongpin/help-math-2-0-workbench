import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, stat} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_JSON,
  REPORT_MARKDOWN,
  buildBundle,
  parseCliArgs,
  publishNoClobber,
  runCli,
  validateContract,
} from "./build-g4-l10-complete-migration-template-contract-v11.mjs";

test("v11 binds v10 and the exact v2.15 review infrastructure without authority expansion", async () => {
  const bundle = await buildBundle(PROJECT_ROOT);
  const report = validateContract(bundle.report);
  assert.equal(report.schemaVersion, 11);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.latestSecurityReviewBoundary.protocolStatus,
    "active-review-procedure-successor");
  assert.equal(report.latestSecurityReviewBoundary
    .deterministicInputStructureReadyForReviewerPreflight, true);
  assert.equal(report.latestSecurityReviewBoundary
    .reviewerPreflightReceiptCountBound, 0);
  assert.equal(report.latestSecurityReviewBoundary
    .reviewerEvidenceReceiptCountBound, 0);
  assert.equal(report.latestSecurityReviewBoundary
    .reviewerHumanConclusionCountBound, 0);
  assert.equal(report.latestSecurityReviewBoundary.specReviewQualified, false);
  assert.equal(report.latestSecurityReviewBoundary.newHMG4RB4Allowed, false);
  assert.equal(report.latestSecurityReviewBoundary
    .productionHelperImplementationAuthorized, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.match(bundle.markdown, /creates no task, reviewer receipt or conclusion/);
});

test("v11 dry-run is deterministic and acceptance-neutral", async () => {
  const first = await buildBundle(PROJECT_ROOT);
  const second = await buildBundle(PROJECT_ROOT);
  assert.equal(first.json, second.json);
  assert.equal(first.markdown, second.markdown);
  const result = await runCli(["--dry-run"], PROJECT_ROOT);
  assert.deepEqual(result, {
    disposition: "dry-run",
    status: "fail-closed-template-not-stable",
    reportFingerprintSha256: first.report.reportFingerprintSha256,
    templateStable: false,
    activeReviewProtocol: "v2.15",
    reviewerConclusionCountBound: 0,
    specReviewQualified: false,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    productionHelperAuthorized: false,
    acceptanceEffect: false,
  });
});

test("v11 no-clobber publication writes immutable outputs and rejects reuse", async () => {
  const bundle = await buildBundle(PROJECT_ROOT);
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l10-v11-"));
  await mkdir(path.join(outputRoot, "reports"));
  const result = await publishNoClobber(bundle, {outputRoot});
  assert.equal(result.disposition, "checked");
  assert.equal(result.specReviewQualified, false);
  for (const relativePath of [REPORT_JSON, REPORT_MARKDOWN]) {
    const absolute = path.join(outputRoot, relativePath);
    assert.equal((await stat(absolute)).mode & 0o777, 0o444);
    assert.ok((await readFile(absolute)).length > 0);
  }
  await assert.rejects(() => publishNoClobber(bundle, {outputRoot}),
    /Output already exists; refusing overwrite/);
});

test("v11 validator fails closed on review or authority drift", async () => {
  const {report} = await buildBundle(PROJECT_ROOT);
  for (const mutate of [
    (copy) => { copy.latestSecurityReviewBoundary.newHMG4RB4Allowed = true; },
    (copy) => { copy.latestSecurityReviewBoundary.reviewerHumanConclusionCountBound = 3; },
    (copy) => { copy.latestSecurityReviewBoundary.specReviewQualified = true; },
    (copy) => { copy.authorityBoundary.mayLaunchOriginalRuntime = true; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateContract(copy));
  }
});

test("v11 CLI accepts exactly one explicit non-overwriting mode", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--write"]));
  assert.throws(() => parseCliArgs(["--check", "--dry-run"]));
});
