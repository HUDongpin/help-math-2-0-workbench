import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, stat} from "node:fs/promises";
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
} from "./build-g4-l10-complete-migration-template-contract-v12.mjs";

test("v12 binds exact v11 and v2.16 authoring without review or authority expansion", async () => {
  const bundle = await buildBundle(PROJECT_ROOT);
  const report = validateContract(bundle.report);
  const security = report.latestSecurityReviewBoundary;
  assert.equal(report.schemaVersion, 12);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(security.activeProtocolVersion, "v2.16");
  assert.equal(security.protocolStatus,
    "authored-unreviewed-review-infrastructure-successor");
  assert.equal(security.addressedV215Findings.length, 4);
  assert.equal(security.addressedFindingClosureClaim, false);
  assert.equal(security.reviewSetManifestBound, false);
  assert.equal(security.freshUserOwnedReviewerTaskCountBound, 0);
  assert.equal(security.phaseAPreflightReceiptCountBound, 0);
  assert.equal(security.phaseBEvidenceReceiptCountBound, 0);
  assert.equal(security.reviewerHumanConclusionCountBound, 0);
  assert.deepEqual(security.independentFindingCounts, {
    p0: null,
    p1: null,
    p2: null,
    disposition: "UNEVALUATED_NOT_ZERO",
  });
  assert.equal(security.specReviewQualified, false);
  assert.equal(report.authorityBoundary.mayCreateUserOwnedTask, false);
  assert.equal(report.authorityBoundary.mayRunPhaseAOrPhaseB, false);
  assert.equal(report.authorityBoundary.mayLaunchOriginalRuntime, false);
  assert.match(bundle.markdown, /UNEVALUATED — not zero/);
  assert.match(bundle.markdown, /creates no reviewer task, review-set manifest/);
});

test("v12 dry-run is deterministic and acceptance-neutral", async () => {
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
    activeReviewProtocol: "v2.16-unreviewed",
    reviewSetManifestBound: false,
    freshUserOwnedReviewerTaskCountBound: 0,
    phaseAPreflightReceiptCountBound: 0,
    phaseBEvidenceReceiptCountBound: 0,
    reviewerConclusionCountBound: 0,
    independentFindingDisposition: "UNEVALUATED_NOT_ZERO",
    specReviewQualified: false,
    naturalScheduleReady: 0,
    originalRuntimeAuthorized: false,
    productionHelperAuthorized: false,
    acceptanceEffect: false,
  });
});

test("v12 no-clobber publication writes immutable outputs and rejects reuse", async () => {
  const bundle = await buildBundle(PROJECT_ROOT);
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l10-v12-"));
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

test("v12 validator fails closed on review, runtime, or acceptance drift", async () => {
  const {report} = await buildBundle(PROJECT_ROOT);
  for (const mutate of [
    (copy) => { copy.latestSecurityReviewBoundary.reviewSetManifestBound = true; },
    (copy) => { copy.latestSecurityReviewBoundary.freshUserOwnedReviewerTaskCountBound = 3; },
    (copy) => { copy.latestSecurityReviewBoundary.independentFindingCounts.p0 = 0; },
    (copy) => { copy.latestSecurityReviewBoundary.specReviewQualified = true; },
    (copy) => { copy.authorityBoundary.mayRunPhaseAOrPhaseB = true; },
    (copy) => { copy.authorityBoundary.mayLaunchOriginalRuntime = true; },
    (copy) => { copy.acceptanceEffects.audioAcceptance = true; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateContract(copy));
  }
});

test("v12 CLI accepts exactly one explicit non-overwriting mode", () => {
  assert.equal(parseCliArgs(["--dry-run"]), "--dry-run");
  assert.equal(parseCliArgs(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs([]));
  assert.throws(() => parseCliArgs(["--write"]));
  assert.throws(() => parseCliArgs(["--check", "--dry-run"]));
});
