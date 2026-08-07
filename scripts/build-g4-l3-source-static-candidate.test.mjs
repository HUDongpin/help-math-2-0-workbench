import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  generateG4L3SourceStaticCandidate,
  parseArguments,
  validateSourceStaticCandidateReport,
  validateSourceStaticCandidateSpec,
} from "./build-g4-l3-source-static-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_RELATIVE =
  "migrations/course-g04-l03-vb-002/audit/source-static-current-js-candidate-spec.json";
const SPEC = path.join(ROOT, SPEC_RELATIVE);
const VB003_SPEC_RELATIVE =
  "migrations/course-g04-l03-vb-003/audit/source-static-current-js-candidate-spec.json";
const VB003_SPEC = path.join(ROOT, VB003_SPEC_RELATIVE);
const TS003_SPEC_RELATIVE =
  "migrations/course-g04-l03-ts-003/audit/source-static-current-js-candidate-spec.json";
const TS003_SPEC = path.join(ROOT, TS003_SPEC_RELATIVE);
const REPORT = path.join(ROOT,
  "reports/g4-l3-vb002-current-javascript-candidate.json");
const MANIFEST = path.join(ROOT,
  "public/flash-assets/courses/course-g04-l03-vb-002/manifest.json");
const RUNTIME = path.join(ROOT,
  "public/flash-assets/courses/course-g04-l03-vb-002/canvas-renderer.js");
const VB003_REPORT = path.join(ROOT,
  "reports/g4-l3-vb003-current-javascript-candidate.json");
const TS003_REPORT = path.join(ROOT,
  "reports/g4-l3-ts003-current-javascript-candidate.json");
const ADDITIONAL_SOURCE_STATIC_CANDIDATES = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-ir-001-341242cc",
    specPath:
      "migrations/course-g04-l03-ir-001-341242cc/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ir001-341242cc-current-javascript-candidate.json",
    frameDomain: "sprite-27",
    frameCount: 136,
    uniqueVisualFrameCount: 136,
    negativeProbeCount: 7,
  }),
  Object.freeze({
    animationId: "course-g04-l03-rw-002",
    specPath:
      "migrations/course-g04-l03-rw-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-rw002-current-javascript-candidate.json",
    frameDomain: "sprite-421",
    frameCount: 1289,
    uniqueVisualFrameCount: 635,
    negativeProbeCount: 6,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-002",
    specPath:
      "migrations/course-g04-l03-in-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in002-current-javascript-candidate.json",
    frameDomain: "sprite-88",
    frameCount: 492,
    uniqueVisualFrameCount: 114,
    negativeProbeCount: 6,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-004",
    specPath:
      "migrations/course-g04-l03-in-004/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in004-current-javascript-candidate.json",
    frameDomain: "sprite-160",
    frameCount: 169,
    uniqueVisualFrameCount: 81,
    negativeProbeCount: 27,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-005",
    specPath:
      "migrations/course-g04-l03-in-005/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in005-current-javascript-candidate.json",
    frameDomain: "sprite-80",
    frameCount: 186,
    uniqueVisualFrameCount: 56,
    negativeProbeCount: 23,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-006",
    specPath:
      "migrations/course-g04-l03-in-006/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in006-current-javascript-candidate.json",
    frameDomain: "sprite-151",
    frameCount: 1057,
    uniqueVisualFrameCount: 246,
    negativeProbeCount: 17,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-007",
    specPath:
      "migrations/course-g04-l03-in-007/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in007-current-javascript-candidate.json",
    frameDomain: "sprite-98",
    frameCount: 555,
    uniqueVisualFrameCount: 149,
    negativeProbeCount: 6,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-008",
    specPath:
      "migrations/course-g04-l03-in-008/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in008-current-javascript-candidate.json",
    frameDomain: "sprite-57",
    frameCount: 217,
    uniqueVisualFrameCount: 131,
    negativeProbeCount: 9,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-010",
    specPath:
      "migrations/course-g04-l03-in-010/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in010-current-javascript-candidate.json",
    frameDomain: "sprite-90",
    frameCount: 264,
    uniqueVisualFrameCount: 48,
    negativeProbeCount: 22,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-011",
    specPath:
      "migrations/course-g04-l03-in-011/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in011-current-javascript-candidate.json",
    frameDomain: "sprite-51",
    frameCount: 441,
    uniqueVisualFrameCount: 38,
    negativeProbeCount: 5,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    specPath:
      "migrations/course-g04-l03-in-012/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-in012-current-javascript-candidate.json",
    frameDomain: "sprite-228",
    frameCount: 215,
    uniqueVisualFrameCount: 88,
    negativeProbeCount: 27,
  }),
  Object.freeze({
    animationId: "course-g04-l03-gs-002",
    specPath:
      "migrations/course-g04-l03-gs-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-gs002-current-javascript-candidate.json",
    frameDomain: "sprite-321",
    frameCount: 428,
    uniqueVisualFrameCount: 170,
    negativeProbeCount: 20,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-002",
    specPath:
      "migrations/course-g04-l03-ti-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti002-current-javascript-candidate.json",
    frameDomain: "sprite-272",
    frameCount: 254,
    uniqueVisualFrameCount: 65,
    negativeProbeCount: 38,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-003",
    specPath:
      "migrations/course-g04-l03-ti-003/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti003-current-javascript-candidate.json",
    frameDomain: "sprite-126",
    frameCount: 140,
    uniqueVisualFrameCount: 37,
    negativeProbeCount: 24,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-004",
    specPath:
      "migrations/course-g04-l03-ti-004/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti004-current-javascript-candidate.json",
    frameDomain: "sprite-274",
    frameCount: 125,
    uniqueVisualFrameCount: 50,
    negativeProbeCount: 29,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-005",
    specPath:
      "migrations/course-g04-l03-ti-005/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti005-current-javascript-candidate.json",
    frameDomain: "sprite-208",
    frameCount: 210,
    uniqueVisualFrameCount: 129,
    negativeProbeCount: 11,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ti-006",
    specPath:
      "migrations/course-g04-l03-ti-006/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ti006-current-javascript-candidate.json",
    frameDomain: "sprite-269",
    frameCount: 167,
    uniqueVisualFrameCount: 74,
    negativeProbeCount: 23,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    specPath:
      "migrations/course-g04-l03-ts-007/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ts007-current-javascript-candidate.json",
    frameDomain: "sprite-441",
    frameCount: 696,
    uniqueVisualFrameCount: 91,
    negativeProbeCount: 26,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-008",
    specPath:
      "migrations/course-g04-l03-ts-008/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ts008-current-javascript-candidate.json",
    frameDomain: "sprite-350",
    frameCount: 789,
    uniqueVisualFrameCount: 149,
    negativeProbeCount: 24,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-002",
    specPath:
      "migrations/course-g04-l03-ts-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-ts002-current-javascript-candidate.json",
    frameDomain: "sprite-27",
    frameCount: 355,
    uniqueVisualFrameCount: 31,
    negativeProbeCount: 6,
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-004",
    specPath:
      "migrations/course-g04-l03-vb-004/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-vb004-current-javascript-candidate.json",
    frameDomain: "sprite-53",
    frameCount: 245,
    uniqueVisualFrameCount: 82,
    negativeProbeCount: 6,
  }),
  Object.freeze({
    animationId: "course-g04-l03-fq-001",
    specPath:
      "migrations/course-g04-l03-fq-001/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-fq001-current-javascript-candidate.json",
    frameDomain: "sprite-41",
    frameCount: 52,
    uniqueVisualFrameCount: 20,
    negativeProbeCount: 6,
  }),
  Object.freeze({
    animationId: "course-g04-l03-fq-002",
    specPath:
      "migrations/course-g04-l03-fq-002/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-fq002-current-javascript-candidate.json",
    frameDomain: "sprite-899",
    frameCount: 68,
    uniqueVisualFrameCount: 52,
    negativeProbeCount: 8,
  }),
  Object.freeze({
    animationId: "course-g04-l03-fq-003",
    specPath:
      "migrations/course-g04-l03-fq-003/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-fq003-current-javascript-candidate.json",
    frameDomain: "sprite-899",
    frameCount: 68,
    uniqueVisualFrameCount: 52,
    negativeProbeCount: 8,
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    specPath:
      "migrations/course-g04-l03-vb-007/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-vb007-current-javascript-candidate.json",
    frameDomain: "sprite-271",
    frameCount: 69,
    uniqueVisualFrameCount: 34,
    negativeProbeCount: 20,
  }),
  Object.freeze({
    animationId: "course-g04-l03-vb-008",
    specPath:
      "migrations/course-g04-l03-vb-008/audit/source-static-current-js-candidate-spec.json",
    reportPath: "reports/g4-l3-vb008-current-javascript-candidate.json",
    frameDomain: "sprite-195",
    frameCount: 62,
    uniqueVisualFrameCount: 34,
    negativeProbeCount: 18,
  }),
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function readSpec() {
  return JSON.parse(await readFile(SPEC, "utf8"));
}

test("source-static candidate CLI requires an explicit hash-bound spec", () => {
  assert.deepEqual(parseArguments(["--spec", SPEC_RELATIVE, "--check"]), {
    check: true,
    ffdec: "ffdec",
    specPath: SPEC_RELATIVE,
  });
  assert.equal(parseArguments([
    "--spec", SPEC_RELATIVE, "--ffdec", "/opt/homebrew/bin/ffdec",
  ]).ffdec, "/opt/homebrew/bin/ffdec");
  assert.throws(() => parseArguments([]), /--spec is required/);
  assert.throws(() => parseArguments(["--spec"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("IR001 requires its acceptance-neutral muted-random visual disposition", async () => {
  const spec = await readFile(path.join(ROOT,
    ADDITIONAL_SOURCE_STATIC_CANDIDATES[0].specPath), "utf8").then(JSON.parse);
  assert.equal(validateSourceStaticCandidateSpec(spec), spec);
  assert.equal(spec.sourceBehaviorBoundary.mainFrameBehaviorDependentRanges.length, 0);
  assert.ok(spec.evidence.mutedRandomVisualDisposition);

  const withoutEvidence = structuredClone(spec);
  delete withoutEvidence.evidence.mutedRandomVisualDisposition;
  assert.throws(() => validateSourceStaticCandidateSpec(withoutEvidence),
    /unblocked dynamic-source disposition/);
});

test("FQ002 requires its acceptance-neutral source-local quiz contract", async () => {
  const expected = ADDITIONAL_SOURCE_STATIC_CANDIDATES.find(({animationId}) =>
    animationId === "course-g04-l03-fq-002");
  const spec = await readFile(path.join(ROOT, expected.specPath), "utf8")
    .then(JSON.parse);
  assert.equal(validateSourceStaticCandidateSpec(spec), spec);
  assert.equal(spec.sourceBehaviorBoundary.mainFrameBehaviorDependentRanges.length, 0);
  assert.equal(spec.sourceBehaviorBoundary.mainFrameDisposition,
    "source-local-random-quiz-static-branch-atlas-main-drawing-only");
  assert.ok(spec.evidence.sourceLocalQuizContract);

  const withoutEvidence = structuredClone(spec);
  delete withoutEvidence.evidence.sourceLocalQuizContract;
  assert.throws(() => validateSourceStaticCandidateSpec(withoutEvidence),
    /unblocked dynamic-source disposition/);
});

test("IN006 requires its acceptance-neutral source-local number-line contract", async () => {
  const expected = ADDITIONAL_SOURCE_STATIC_CANDIDATES.find(({animationId}) =>
    animationId === "course-g04-l03-in-006");
  const spec = await readFile(path.join(ROOT, expected.specPath), "utf8")
    .then(JSON.parse);
  assert.equal(validateSourceStaticCandidateSpec(spec), spec);
  assert.equal(spec.sourceBehaviorBoundary.mainFrameBehaviorDependentRanges.length, 0);
  assert.equal(spec.sourceBehaviorBoundary.mainFrameDisposition,
    "source-local-random-number-line-quiz-initial-state-main-drawing-only");
  assert.ok(spec.evidence.sourceLocalNumberLineQuizContract);

  const withoutEvidence = structuredClone(spec);
  delete withoutEvidence.evidence.sourceLocalNumberLineQuizContract;
  assert.throws(() => validateSourceStaticCandidateSpec(withoutEvidence),
    /unblocked dynamic-source disposition/);
});

test("VB002 source-static specification is structurally bounded", async () => {
  const spec = await readSpec();
  assert.equal(validateSourceStaticCandidateSpec(spec), spec);
  assert.equal(spec.animationId, "course-g04-l03-vb-002");
  assert.equal(spec.timeline.root.frameCount, 10);
  assert.equal(spec.timeline.local.frameDomain, "sprite-52");
  assert.equal(spec.timeline.local.frameCount, 193);
  assert.deepEqual(spec.timeline.companionDomains.map(({id}) => id), ["sprite-5"]);
  assert.equal(spec.source.embeddedAudio.rendered, false);
});

test("VB002 checked-in candidate report remains acceptance-neutral", async () => {
  const [spec, report] = await Promise.all([
    readSpec(),
    readFile(REPORT, "utf8").then(JSON.parse),
  ]);
  assert.equal(validateSourceStaticCandidateReport(report, spec), report);
  assert.equal(report.disposition.currentJavaScriptCandidate, true);
  assert.equal(report.disposition.candidateRenderabilityOnly, true);
  assert.equal(report.disposition.prototypeRegistryOnly, true);
  assert.ok(Object.values(report.authorization).every((value) => value === false));
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
});

test("source-static reports monitor the ledger without serializing a cyclic ledger hash", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  assert.equal(report.writeScope.ledgerWritten, false);
  assert.equal(
    report.writeScope.protectedBefore.files.some(
      (entry) => entry.path === "catalog/completion-ledger.json",
    ),
    false,
  );
});

test("VB002 executes 193 source-static frames and blocks unsupported behavior", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  const evidence = report.candidateRenderability;
  assert.equal(evidence.executedFrameCount, 193);
  assert.equal(evidence.pngEncodedFrameCount, 193);
  assert.equal(evidence.uniqueVisualFrameCount, 105);
  assert.deepEqual(evidence.negativeProbes.map(({name, blocked}) => [name, blocked]), [
    ["spanish", true],
    ["root", true],
    ["sprite-5", true],
    ["audio", true],
    ["replay", true],
    ["out-of-range", true],
  ]);
  assert.equal(evidence.unexpectedNetworkRequestCount, 0);
  assert.equal(evidence.consoleErrorCount, 0);
  assert.equal(evidence.pageErrorCount, 0);
  assert.equal(evidence.originalRuntimeBaselineUsed, false);
  assert.equal(evidence.rmseComputed, false);
  assert.equal(evidence.visualParityClaimed, false);
  assert.equal(evidence.behaviorParityClaimed, false);
});

test("VB002 manifest binds the safe runtime and disabled source behavior", async () => {
  const [report, manifest, runtimeBytes, manifestBytes] = await Promise.all([
    readFile(REPORT, "utf8").then(JSON.parse),
    readFile(MANIFEST, "utf8").then(JSON.parse),
    readFile(RUNTIME),
    readFile(MANIFEST),
  ]);
  assert.equal(sha256(runtimeBytes), report.outputs.canvasRuntime.sha256);
  assert.equal(runtimeBytes.length, report.outputs.canvasRuntime.bytes);
  assert.equal(sha256(manifestBytes), report.outputs.canvasManifest.sha256);
  assert.equal(manifest.runtime.boundedScope.frameDomain, "sprite-52");
  assert.deepEqual(manifest.runtime.boundedScope.frames,
    {first: 1, lastInclusive: 193});
  assert.equal(manifest.runtime.blocked.root, true);
  assert.equal(manifest.runtime.blocked["sprite-5"], true);
  assert.equal(manifest.runtime.blocked.spanish, true);
  assert.equal(manifest.runtime.blocked.embeddedAudio, true);
  assert.equal(manifest.runtime.blocked.associatedAudio, true);
  assert.equal(manifest.safety.pointerEventsEnabled, false);
  assert.equal(manifest.safety.audioRendered, false);
  assert.ok(Object.values(manifest.authorization).every((value) => value === false));
  assert.ok(Object.values(manifest.acceptance).every((value) => value === false));
  const runtime = runtimeBytes.toString("utf8");
  assert.doesNotMatch(runtime, /\beval\s*\(/);
  assert.doesNotMatch(runtime,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
  assert.doesNotMatch(runtime,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.match(runtime, /unsupported source-proven language/);
  assert.match(runtime, /HELP_MATH_CANVAS_ASSETS/);
});

test("VB002 checked-in outputs reproduce from a fresh SWF extraction", async () => {
  const result = await generateG4L3SourceStaticCandidate({
    check: true,
    specPath: SPEC_RELATIVE,
  });
  assert.equal(result.animationId, "course-g04-l03-vb-002");
  assert.equal(result.candidateRenderability.executedFrameCount, 193);
  assert.equal(result.candidateRenderability.uniqueVisualFrameCount, 105);
  assert.equal(result.candidateRenderability.negativeProbeCount, 6);
  assert.equal(result.candidateRenderability.originalRuntimeBaselineUsed, false);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("VB003 source-static report binds 160 acceptance-neutral drawing frames", async () => {
  const [spec, report] = await Promise.all([
    readFile(VB003_SPEC, "utf8").then(JSON.parse),
    readFile(VB003_REPORT, "utf8").then(JSON.parse),
  ]);
  assert.equal(validateSourceStaticCandidateSpec(spec), spec);
  assert.equal(validateSourceStaticCandidateReport(report, spec), report);
  assert.equal(spec.timeline.local.frameDomain, "sprite-106");
  assert.equal(report.candidateRenderability.executedFrameCount, 160);
  assert.equal(report.candidateRenderability.uniqueVisualFrameCount, 50);
  assert.equal(report.source.embeddedAudio.streamCount, 4);
  assert.ok(Object.values(report.authorization).every((value) => value === false));
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
  assert.equal(report.strictAcceptanceEffect, "none");
});

test("VB003 checked-in outputs reproduce from a fresh SWF extraction", async () => {
  const result = await generateG4L3SourceStaticCandidate({
    check: true,
    specPath: VB003_SPEC_RELATIVE,
  });
  assert.equal(result.animationId, "course-g04-l03-vb-003");
  assert.equal(result.candidateRenderability.executedFrameCount, 160);
  assert.equal(result.candidateRenderability.uniqueVisualFrameCount, 50);
  assert.equal(result.candidateRenderability.negativeProbeCount, 6);
  assert.equal(result.candidateRenderability.originalRuntimeBaselineUsed, false);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("TS003 SWF-only report binds 241 acceptance-neutral drawing frames", async () => {
  const [spec, report] = await Promise.all([
    readFile(TS003_SPEC, "utf8").then(JSON.parse),
    readFile(TS003_REPORT, "utf8").then(JSON.parse),
  ]);
  assert.equal(validateSourceStaticCandidateSpec(spec), spec);
  assert.equal(validateSourceStaticCandidateReport(report, spec), report);
  assert.equal(spec.source.fla, null);
  assert.equal(spec.evidence.authoringAudit, null);
  assert.equal(spec.timeline.local.frameDomain, "sprite-25");
  assert.equal(report.candidateRenderability.executedFrameCount, 241);
  assert.equal(report.candidateRenderability.uniqueVisualFrameCount, 29);
  assert.equal(report.source.embeddedAudio.streamCount, 1);
  assert.ok(Object.values(report.authorization).every((value) => value === false));
  assert.ok(Object.values(report.acceptance).every((value) => value === false));
});

test("TS003 checked-in outputs reproduce from a fresh SWF extraction", async () => {
  const result = await generateG4L3SourceStaticCandidate({
    check: true,
    specPath: TS003_SPEC_RELATIVE,
  });
  assert.equal(result.animationId, "course-g04-l03-ts-003");
  assert.equal(result.candidateRenderability.executedFrameCount, 241);
  assert.equal(result.candidateRenderability.uniqueVisualFrameCount, 29);
  assert.equal(result.candidateRenderability.negativeProbeCount, 6);
  assert.equal(result.candidateRenderability.originalRuntimeBaselineUsed, false);
  assert.equal(result.strictAcceptanceEffect, "none");
});

test("all later source-static candidates validate and reproduce from fresh SWF extraction", async () => {
  for (const expected of ADDITIONAL_SOURCE_STATIC_CANDIDATES) {
    const [spec, report] = await Promise.all([
      readFile(path.join(ROOT, expected.specPath), "utf8").then(JSON.parse),
      readFile(path.join(ROOT, expected.reportPath), "utf8").then(JSON.parse),
    ]);
    assert.equal(validateSourceStaticCandidateSpec(spec), spec);
    assert.equal(validateSourceStaticCandidateReport(report, spec), report);
    assert.equal(spec.animationId, expected.animationId);
    assert.equal(spec.timeline.local.frameDomain, expected.frameDomain);
    assert.equal(report.candidateRenderability.executedFrameCount,
      expected.frameCount);
    assert.equal(report.candidateRenderability.uniqueVisualFrameCount,
      expected.uniqueVisualFrameCount);
    assert.equal(report.candidateRenderability.frameBatchSize, 32);
    assert.equal(report.candidateRenderability.frameDigestMethod,
      "node-crypto-sha256-over-batched-canvas-toDataURL-png-bytes");
    assert.ok(Object.values(report.authorization).every((value) => value === false));
    assert.ok(Object.values(report.acceptance).every((value) => value === false));

    const result = await generateG4L3SourceStaticCandidate({
      check: true,
      specPath: expected.specPath,
    });
    assert.equal(result.animationId, expected.animationId);
    assert.equal(result.candidateRenderability.executedFrameCount,
      expected.frameCount);
    assert.equal(result.candidateRenderability.uniqueVisualFrameCount,
      expected.uniqueVisualFrameCount);
    assert.equal(result.candidateRenderability.negativeProbeCount,
      expected.negativeProbeCount);
    assert.equal(result.candidateRenderability.originalRuntimeBaselineUsed,
      false);
    assert.equal(result.strictAcceptanceEffect, "none");
  }
});
