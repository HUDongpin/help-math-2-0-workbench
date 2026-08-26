import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildReport,
  deriveRouteMatrix,
  expectedFqAudioPaths,
  parseArguments,
  stableJson,
  writeOrCheck,
} from "./build-fq002-audio-route-resolution-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const reportRelative = "migrations/course-g03-l06-fq-002-review/audit/fq002-audio-route-resolution-candidates.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function record(candidatePath, language = "en", digest = "a".repeat(64), bytes = 1234) {
  return {path: candidatePath, language, sha256: digest, bytes, extension: "mp3"};
}

test("argument parser exposes only deterministic build/check controls", () => {
  assert.deepEqual(parseArguments([]), {check: false, root});
  assert.deepEqual(parseArguments(["--check", "--root", "/tmp/fq-root"]), {
    check: true,
    root: "/tmp/fq-root",
  });
  assert.throws(() => parseArguments(["--root"]), /requires a value/);
  assert.throws(() => parseArguments(["--admit-route", "active-course-xml-url"]), /Unknown option/);
  assert.throws(() => parseArguments(["--promote-cues"]), /Unknown option/);
});

test("expected FQ URL matrix is exhaustive and keeps route identity outside cue identity", () => {
  const rows = expectedFqAudioPaths("HELP_COURSES/ELMGR3/L6/FQ");
  assert.equal(rows.length, 310);
  assert.equal(new Set(rows.map(({expectedPathId}) => expectedPathId)).size, 310);
  assert.equal(new Set(rows.map(({path: candidatePath}) => candidatePath)).size, 310);
  assert.deepEqual(rows[0], {
    expectedPathId: "fq-q01-question-en",
    language: "en",
    languageDirectory: "EA",
    questionNumber: 1,
    kind: "question",
    option: null,
    path: "HELP_COURSES/ELMGR3/L6/FQ/EA/Q1.mp3",
  });
  assert.equal(rows.at(-1).expectedPathId, "fq-q31-answer-d-es");
  assert.equal(rows.filter(({language}) => language === "en").length, 155);
  assert.equal(rows.filter(({language}) => language === "es").length, 155);
});

test("route matrix reconciles canonical, missing, and unmatched candidates without cue promotion", () => {
  const base = "HELP_COURSES/ELMGR3/L6/FQ";
  const canonical = record(`${base}/EA/Q1.mp3`);
  const anomaly = record(`${base}/EA/Q20B_.mp3`);
  const sourceByPath = new Map([[canonical.path, canonical], [anomaly.path, anomaly]]);
  const groupByPath = new Map([[canonical.path, canonical], [anomaly.path, anomaly]]);
  const matrix = deriveRouteMatrix({routeId: "fixture", baseDirectory: base, sourceByPath, groupByPath});
  assert.equal(matrix.expectedPathCount, 310);
  assert.equal(matrix.canonicalPathCandidateCount, 1);
  assert.equal(matrix.missingSourceCount, 309);
  assert.equal(matrix.unmatchedCandidateCount, 1);
  assert.equal(matrix.groupCandidateCount, 2);
  assert.equal(matrix.expectedPaths.find(({path: candidatePath}) => candidatePath === canonical.path).cuePromoted, false);
  assert.deepEqual(matrix.unmatchedCandidates.map(({path: candidatePath, cuePromoted}) => ({path: candidatePath, cuePromoted})), [
    {path: anomaly.path, cuePromoted: false},
  ]);

  const missingGroup = new Map();
  assert.throws(() => deriveRouteMatrix({routeId: "fixture", baseDirectory: base, sourceByPath, groupByPath: missingGroup}),
    /catalog\/audio-group presence differs/);
  const mismatchedAnomaly = new Map([[anomaly.path, {...anomaly, sha256: "b".repeat(64)}]]);
  assert.throws(() => deriveRouteMatrix({routeId: "fixture", baseDirectory: base, sourceByPath, groupByPath: mismatchedAnomaly}),
    /differs from the source catalog/);
});

test("checked report binds both routes, all 129 source candidates, and zero authority effects", async () => {
  const reportRaw = await readFile(path.join(root, reportRelative));
  const report = JSON.parse(reportRaw);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.artifactType, "help-math-fq002-audio-route-resolution-candidates");
  assert.equal(report.animationId, "course-g03-l06-fq-002-review");
  assert.equal(report.status, "machine-route-matrices-complete-historical-route-unresolved");
  assert.equal(report.generator.path, "scripts/build-fq002-audio-route-resolution-candidates.mjs");
  assert.equal(sha256(await readFile(path.join(root, report.generator.path))), report.generator.sha256);

  for (const binding of [
    report.bindings.audioAudit,
    report.bindings.variantBinding,
    report.bindings.sourceCatalog,
    report.bindings.audioGroupsCatalog,
    report.bindings.courseXml,
    report.bindings.hostSwf,
    report.bindings.selectedReviewSwf,
    report.bindings.activeCourseSwf,
  ]) {
    assert.equal(sha256(await readFile(path.join(root, binding.path))), binding.sha256, binding.path);
  }

  assert.deepEqual(report.candidateReconciliation, {
    canonicalActiveRouteCandidateCount: 128,
    catalogAudioGroupCandidateCount: 129,
    cueCountPromoted: 0,
    equation: "128 canonical active-route candidates + 1 unmatched Q20B_.mp3 candidate = 129 catalog audio-group candidates",
    reconciled: true,
    unmatchedActiveRouteCandidateCount: 1,
  });
  assert.equal(report.sourceVerification.groupSourceFilesRehashed, 129);
  assert.equal(report.sourceVerification.distinctMissingPathsCheckedOnDisk, 492);
  assert.equal(report.sourceVerification.audioPlaybackPerformed, false);
  assert.equal(report.sourceVerification.metadataProbePerformedByThisGenerator, false);
  assert.equal(report.routeResolution.admittedRouteId, null);
  assert.equal(report.routeResolution.admittedRouteCount, 0);

  const routes = new Map(report.routeResolution.routeCandidates.map((route) => [route.routeId, route]));
  const review = routes.get("preserved-review-url");
  const active = routes.get("active-course-xml-url");
  assert.deepEqual([
    review.matrix.canonicalPathCandidateCount,
    review.matrix.missingSourceCount,
    review.matrix.unmatchedCandidateCount,
  ], [0, 310, 0]);
  assert.deepEqual([
    active.matrix.canonicalPathCandidateCount,
    active.matrix.missingSourceCount,
    active.matrix.unmatchedCandidateCount,
  ], [128, 182, 1]);
  assert.equal(review.pathBinaryMatchesSelectedPilot, true);
  assert.equal(review.activeCourseXmlExactPlacement, false);
  assert.equal(active.pathBinaryMatchesSelectedPilot, false);
  assert.equal(active.activeCourseXmlExactPlacement, true);
  assert.equal(new Set(report.routeResolution.routeCandidates.map(({selectedPilotBinarySha256}) => selectedPilotBinarySha256)).size, 1);
  assert.ok(report.routeResolution.routeCandidates.every(({routeAdmitted, cuePromotionPerformed}) => !routeAdmitted && !cuePromotionPerformed));
  assert.deepEqual(report.authorityEffects, {
    audioInventoryChanged: false,
    completionLedgerChanged: false,
    currentJavascriptApprovalChanged: false,
    humanReviewChanged: false,
    migrationStatusChanged: false,
    ownerReviewChanged: false,
    strictAcceptanceEffect: "none",
    strictReportChanged: false,
  });

  const current = await buildReport({root});
  assert.equal(stableJson(current), reportRaw.toString("utf8"));
  const check = await writeOrCheck({root, check: true});
  assert.equal(check.mode, "CHECK");
  assert.equal(check.sha256, sha256(reportRaw));
});
