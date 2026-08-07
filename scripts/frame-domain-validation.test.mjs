import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import {
  validateFrameDomainDisposition,
  validateFullFrameCoverage,
  validateTraceEvidenceForCoverageV2,
} from "../skills/flash-to-js/scripts/validate_migration.mjs";
import { buildDispositionReport } from "./build-frame-domain-dispositions.mjs";
import { COURSE_PILOT_IDS } from "./build-course-scenario-inventories.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

const checkedProjectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function writeJson(filePath, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, bytes);
  return digest(bytes);
}

function frameRange(firstFrame, lastFrame, omittedFrame) {
  const frames = [];
  for (let frame = firstFrame; frame <= lastFrame; frame += 1) if (frame !== omittedFrame) frames.push(frame);
  return frames;
}

async function buildRequirement({
  root,
  animationId,
  pngPath,
  pngSha256,
  sourceSwf,
  sourceSwfSha256,
  domain,
  implementationArtifactClosure,
  rangeLastFrame = domain.frameCount,
  omittedCaptureFrame,
}) {
  const traceId = `default-${domain.id}-en`;
  const requirementId = `req-${traceId}`;
  const entryState = domain.kind === "root"
    ? { kind: "initial-load" }
    : { kind: "natural-runtime-entry", parentFrame: 1, parentFrameDomainId: domain.parentFrameDomainId };
  const entryStateHash = digest(canonicalJson(entryState));
  const evidenceRoot = path.join(root, "evidence", domain.id);
  const captured = frameRange(1, rangeLastFrame, omittedCaptureFrame).map((frame) => ({
    animationId,
    frame,
    reportedFrame: frame,
    requirementId,
    frameDomainId: domain.id,
    reportedFrameDomainId: domain.id,
    traceId,
    entryStateSha256: entryStateHash,
    scenario: "default",
    language: "en",
    seed: "0",
    reportedRenderState: "ready",
    visualTarget: {
      tagName: "svg",
      reportedRenderState: "ready",
      animationId,
      reportedFrame: frame,
      requirementId,
      frameDomainId: domain.id,
      traceId,
      entryStateSha256: entryStateHash,
      scenario: "default",
      language: "en",
      seed: "0",
    },
    file: pngPath,
    sha256: pngSha256,
    width: 1,
    height: 1,
  }));
  const capture = {
    schemaVersion: 4,
    status: "complete",
    sourceUrl: `http://127.0.0.1:3213/animations/${animationId}`,
    generatorProvenance: testCaptureGeneratorProvenance(),
    implementationArtifactClosure,
    animationId,
    requirementId,
    frameDomainId: domain.id,
    traceId,
    entryStateSha256: entryStateHash,
    scenario: "default",
    language: "en",
    seed: "0",
    reportedFrameAttribute: "data-flash-frame",
    reportedAnimationIdAttribute: "data-animation-id",
    reportedFrameDomainAttribute: "data-flash-frame-domain",
    reportedRequirementIdAttribute: "data-flash-requirement-id",
    reportedTraceAttribute: "data-flash-trace-id",
    reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
    captureStageAttribute: "data-capture-stage",
    reportedRenderStateAttribute: "data-render-state",
    reportedVisualTargetAttribute: "data-render-visual",
    requiredRenderState: "ready",
    viewport: { width: 1, height: 1, deviceScaleFactor: 1 },
    captured,
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
  };
  const capturePath = path.join(evidenceRoot, "capture-manifest.json");
  const captureManifestSha256 = await writeJson(capturePath, capture);
  const baseline = {
    schemaVersion: 2,
    evidenceType: "original-runtime-frame-domain-baseline",
    status: "complete",
    animationId,
    requirementId,
    frameDomainId: domain.id,
    traceId,
    entryStateSha256: entryStateHash,
    scenario: "default",
    language: "en",
    seed: "0",
    baselineAuthority: "original-runtime-natural-trace",
    capturedAt: "2026-07-21T00:00:00.000Z",
    source: { swf: sourceSwf, swfSha256: sourceSwfSha256 },
    runtime: {
      stage: { width: 1, height: 1 },
      fps: 12,
      frameCount: rangeLastFrame,
      frameNumbering: "one-indexed",
    },
    capture: {
      operator: "validator-test-fixture",
      tool: "authorized-original-runtime",
      toolVersion: "fixture-1",
      traceEntryMode: "natural-runtime-navigation",
      frameCaptureMode: "deterministic-sequential-step",
      entryProtocol: "Enter the declared trace through the original runtime.",
      frameControlProtocol: "Step one original-runtime frame before each capture after frame 1.",
      entryTrace: [{ order: 1, action: "enter declared trace", resultingFrameDomainId: domain.id }],
    },
    frames: frameRange(1, rangeLastFrame).map((frame) => ({
      animationId,
      frame,
      requirementId,
      frameDomainId: domain.id,
      traceId,
      entryStateSha256: entryStateHash,
      file: pngPath,
      sha256: pngSha256,
      width: 1,
      height: 1,
    })),
  };
  const baselinePath = path.join(evidenceRoot, "baseline-capture-manifest.json");
  const baselineCaptureManifestSha256 = await writeJson(baselinePath, baseline);
  const metrics = {
    schemaVersion: 2,
    status: "complete",
    animationId,
    requirementId,
    scenario: "default",
    language: "en",
    seed: "0",
    frameDomainId: domain.id,
    traceId,
    entryStateSha256: entryStateHash,
    baselineAuthority: "original-runtime-natural-trace",
    baselineFrameDomainId: domain.id,
    baselineTraceId: traceId,
    baselineEntryStateSha256: entryStateHash,
    baselineCaptureManifestSha256,
    implementationCaptureManifestSha256: captureManifestSha256,
    frames: frameRange(1, rangeLastFrame).map((frame) => ({
      frame,
      requirementId,
      frameDomainId: domain.id,
      traceId,
      entryStateSha256: entryStateHash,
      kind: "static",
      baselineSha256: pngSha256,
      implementationSha256: pngSha256,
      normalizedRmse: 0,
      result: "pass",
    })),
  };
  const metricsPath = path.join(evidenceRoot, "metrics.json");
  const metricsSha256 = await writeJson(metricsPath, metrics);
  return {
    requirementId,
    status: "complete",
    scenario: "default",
    frameDomainId: domain.id,
    traceId,
    language: "en",
    seed: "0",
    requiredRange: { firstFrame: 1, lastFrame: rangeLastFrame },
    entryState,
    entryStateSha256: entryStateHash,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "original-runtime-natural-trace",
    baselineCaptureManifest: path.relative(root, baselinePath),
    baselineCaptureManifestSha256,
    capturedFrameCount: rangeLastFrame,
    missingFrames: [],
    captureManifest: path.relative(root, capturePath),
    captureManifestSha256,
    metricsFile: path.relative(root, metricsPath),
    metricsSha256,
  };
}

async function createFixture({ localFrameCount = 142, localRangeLastFrame = localFrameCount, omittedCaptureFrame } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "frame-domain-contract-"));
  const animationId = "course-root-10-local-timeline";
  const png = new PNG({ width: 1, height: 1 });
  png.data.fill(255);
  const pngBytes = PNG.sync.write(png);
  const pngPath = path.join(root, "shared-frame.png");
  await writeFile(pngPath, pngBytes);
  const pngSha256 = digest(pngBytes);
  const sourceSwf = "source.swf";
  const sourceBytes = Buffer.from("fixture source swf identity");
  await writeFile(path.join(root, sourceSwf), sourceBytes);
  const sourceSwfSha256 = digest(sourceBytes);
  const domains = [
    {
      id: "root",
      kind: "root",
      sourceTimelineId: "root",
      parentFrameDomainId: null,
      frameCount: 10,
      scenarioIds: ["default"],
    },
    {
      id: "sprite-58",
      kind: "nested",
      sourceTimelineId: "sprite-58",
      parentFrameDomainId: "root",
      frameCount: localFrameCount,
      scenarioIds: ["default"],
    },
  ];
  const implementation = {
    component: "implementation.ts",
    defaultFrameDomainId: "sprite-58",
    frameDomains: domains,
    captureContract: {
      animationIdAttribute: "data-animation-id",
      frameDomainParameter: "frameDomain",
      requirementIdParameter: "requirementId",
      traceParameter: "trace",
      entryStateSha256Parameter: "entryStateSha256",
      frameDomainAttribute: "data-flash-frame-domain",
      requirementIdAttribute: "data-flash-requirement-id",
      traceAttribute: "data-flash-trace-id",
      entryStateSha256Attribute: "data-flash-entry-state-sha256",
    },
  };
  await writeFile(path.join(root, implementation.component), "export const frame = 1;\n");
  const implementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot: root,
    workspace: root,
    manifest: {animationId, implementation, evidence: {}},
  });
  const requirements = [];
  requirements.push(await buildRequirement({
    root,
    animationId,
    pngPath,
    pngSha256,
    sourceSwf,
    sourceSwfSha256,
    domain: domains[0],
    implementationArtifactClosure,
  }));
  requirements.push(await buildRequirement({
    root,
    animationId,
    pngPath,
    pngSha256,
    sourceSwf,
    sourceSwfSha256,
    domain: domains[1],
    implementationArtifactClosure,
    rangeLastFrame: localRangeLastFrame,
    omittedCaptureFrame,
  }));
  const coverage = { schemaVersion: 2, animationId, requirements };
  const coveragePath = path.join(root, "evidence", "full-frame-coverage.json");
  await writeJson(coveragePath, coverage);
  const manifest = {
    animationId,
    source: { swf: sourceSwf, swfSha256: sourceSwfSha256 },
    runtime: { stage: { width: 1, height: 1 }, fps: 12, frameCount: 10 },
    scenarios: [{ id: "default" }],
    localization: { languages: ["en"] },
    implementation,
    evidence: { fullFrameCoverageFile: path.relative(root, coveragePath) },
    fidelity: { staticFrameMaxNormalizedRmse: 0.05, transitionFrameMaxNormalizedRmse: 0.08 },
    acceptance: { knownExceptions: [] },
  };
  return { root, manifest, coverage, coveragePath };
}

async function validateFixture(fixture) {
  const errors = [];
  await validateFullFrameCoverage({
    root: fixture.root,
    manifest: fixture.manifest,
    errors,
    traceEvidenceInspection: {
      applicable: true,
      failures: [],
      requirements: (fixture.coverage.requirements || []).map((requirement) => ({
        requirementId: requirement.requirementId,
        disposition: "complete-evidence-verified",
        traceSpecReadiness: "ready",
        executionReportSha256: "a".repeat(64),
        evidence: { originalRuntimeCaptureManifest: { file: "fixture", sha256: "b".repeat(64) } },
      })),
    },
  });
  return errors;
}

test("trace-evidence admission accepts only a ready spec with a re-hashed execution report and exact baseline binding", () => {
  const coverage = { requirements: [{ requirementId: "req-root-en", status: "complete" }] };
  const passing = [];
  validateTraceEvidenceForCoverageV2({
    coverage,
    inspection: {
      applicable: true,
      failures: [],
      requirements: [{
        requirementId: "req-root-en",
        disposition: "complete-evidence-verified",
        traceSpecReadiness: "ready",
        executionReportSha256: "a".repeat(64),
        evidence: { originalRuntimeCaptureManifest: { file: "baseline.json", sha256: "b".repeat(64) } },
      }],
    },
    errors: passing,
  });
  assert.deepEqual(passing, []);

  for (const [name, inspection] of [
    ["stale spec", { applicable: true, failures: [{ requirementId: "req-root-en", message: "indexed trace spec SHA-256 mismatch" }], requirements: [] }],
    ["missing report", { applicable: true, failures: [{ requirementId: "req-root-en", message: "complete coverage requirement is missing its execution report" }], requirements: [] }],
    ["hash echo", { applicable: true, failures: [{ requirementId: "req-root-en", message: "dispatchedAction differs from the schedule" }], requirements: [] }],
    ["wrong baseline", { applicable: true, failures: [{ requirementId: "req-root-en", message: "originalRuntimeCaptureManifest must exactly match coverage path/hash" }], requirements: [] }],
  ]) {
    const errors = [];
    validateTraceEvidenceForCoverageV2({ coverage, inspection, errors });
    assert.equal(errors.length, 1, name);
    assert.match(errors[0], /current ready trace spec plus a complete re-hashed execution report/);
  }
});

test("trace-evidence admission does not require the bounded pilot index for unrelated coverage-v2 migrations", () => {
  const errors = [];
  validateTraceEvidenceForCoverageV2({
    coverage: { requirements: [{ requirementId: "req-root-en", status: "complete" }] },
    inspection: { applicable: false, failures: [], requirements: [] },
    errors,
  });
  assert.deepEqual(errors, []);
});

async function updateCoverage(fixture) {
  await writeJson(fixture.coveragePath, fixture.coverage);
}

async function updateLocalMetrics(fixture, update) {
  const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "sprite-58");
  const metricsPath = path.join(fixture.root, requirement.metricsFile);
  const metrics = JSON.parse(await readFile(metricsPath, "utf8"));
  update(metrics, requirement);
  requirement.metricsSha256 = await writeJson(metricsPath, metrics);
  await updateCoverage(fixture);
}

async function updateLocalCapture(fixture, update) {
  const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "sprite-58");
  const capturePath = path.join(fixture.root, requirement.captureManifest);
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  update(capture, requirement);
  requirement.captureManifestSha256 = await writeJson(capturePath, capture);
  await updateCoverage(fixture);
}

async function updateLocalBaseline(fixture, update) {
  const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "sprite-58");
  const baselinePath = path.join(fixture.root, requirement.baselineCaptureManifest);
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  update(baseline, requirement);
  requirement.baselineCaptureManifestSha256 = await writeJson(baselinePath, baseline);
  await updateCoverage(fixture);
}

test("accepts a root-10/local-142 model only with explicit complete natural traces", async () => {
  const fixture = await createFixture();
  try {
    assert.deepEqual(await validateFixture(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("strict validation excludes supplemental partial paths, and their union cannot fill a canonical slot", async () => {
  const fixture = await createFixture();
  const partial = (requirementId, frames) => {
    const selection = {
      requirementSchemaVersion: 2,
      coverageRole: "partial-path",
      coverageGroupId: "sprite-58-supplemental-paths",
      requiredFrameSet: {frames},
    };
    const entryState = {kind: "supplemental-path"};
    return {
      requirementId,
      status: "blocked",
      scenario: "default",
      frameDomainId: "sprite-58",
      traceId: `trace-${requirementId}`,
      language: "en",
      seed: "0",
      entryState,
      entryStateSha256: digest(canonicalJson(entryState)),
      baselineAuthorityRequirement: "original-runtime-natural-trace",
      baselineAuthority: "unresolved",
      capturedFrameCount: 0,
      missingFrames: [...frames],
      strictAcceptanceEffect: "none",
      authority: {
        currentJavascriptImplementationCaptureOnly: true,
        originalRuntimeBaseline: false,
        rmseAcceptance: false,
        humanVisualReview: false,
        ownerAcceptance: false,
        strictAcceptance: false,
      },
      ...selection,
      selectionSha256: selectionSha256(selection, 142),
    };
  };
  try {
    fixture.coverage.requirements.push(partial("partial-a", [1, 2]));
    await updateCoverage(fixture);
    assert.deepEqual(await validateFixture(fixture), []);

    fixture.coverage.requirements = fixture.coverage.requirements
      .filter(({frameDomainId}) => frameDomainId !== "sprite-58");
    fixture.coverage.requirements.push(
      partial("partial-first-half", frameRange(1, 71)),
      partial("partial-second-half", frameRange(72, 142)),
    );
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(
      errors.some((error) => error.includes("missing a trace requirement for sprite-58/default/en")),
      errors.join("\n"),
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("strict validation rejects malformed supplemental partial evidence before excluding it", async (t) => {
  const cases = [
    ["status", {status: "accepted"}, /status must be complete, blocked, or pending/],
    ["captured frame count", {capturedFrameCount: 1}, /capturedFrameCount must equal selected physical frames minus missingFrames/],
    ["strict acceptance effect", {strictAcceptanceEffect: "promote"}, /strictAcceptanceEffect must be exactly none/],
    ["authority", {authority: {strictAcceptance: true}}, /authority\.strictAcceptance must not be true/],
    ["missing capture", {captureManifest: "evidence/missing-partial-capture.json", captureManifestSha256: "a".repeat(64)}, /supplemental captureManifest does not exist/],
  ];
  for (const [name, overrides, expected] of cases) {
    await t.test(name, async () => {
      const fixture = await createFixture();
      try {
        const selection = {
          requirementSchemaVersion: 2,
          coverageRole: "partial-path",
          coverageGroupId: "sprite-58-supplemental-paths",
          requiredFrameSet: {frames: [1, 2]},
        };
        const entryState = {kind: "supplemental-path"};
        fixture.coverage.requirements.push({
          requirementId: "partial-malformed",
          status: "blocked",
          scenario: "default",
          frameDomainId: "sprite-58",
          traceId: "trace-partial-malformed",
          language: "en",
          seed: "0",
          entryState,
          entryStateSha256: digest(canonicalJson(entryState)),
          baselineAuthorityRequirement: "original-runtime-natural-trace",
          baselineAuthority: "unresolved",
          capturedFrameCount: 0,
          missingFrames: [1, 2],
          strictAcceptanceEffect: "none",
          ...selection,
          selectionSha256: selectionSha256(selection, 142),
          ...overrides,
        });
        await updateCoverage(fixture);
        const errors = await validateFixture(fixture);
        assert.match(errors.join("\n"), expected);
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
});

test("keeps legacy root-only schemaVersion 1 coverage compatible when no frame domains are declared", async () => {
  const fixture = await createFixture();
  try {
    const rootRequirement = fixture.coverage.requirements[0];
    delete fixture.manifest.implementation.defaultFrameDomainId;
    delete fixture.manifest.implementation.frameDomains;
    fixture.coverage = {
      schemaVersion: 1,
      animationId: fixture.manifest.animationId,
      frameCount: 10,
      scenarios: ["default"],
      languages: ["en"],
      combinations: [{
        status: "complete",
        scenario: "default",
        language: "en",
        seed: "0",
        firstFrame: 1,
        lastFrame: 10,
        capturedFrameCount: 10,
        missingFrames: [],
        captureManifest: rootRequirement.captureManifest,
        captureManifestSha256: rootRequirement.captureManifestSha256,
        metricsFile: rootRequirement.metricsFile,
        metricsSha256: rootRequirement.metricsSha256,
      }],
    };
    await updateCoverage(fixture);
    assert.deepEqual(await validateFixture(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a legacy coverage-v1 capture that predates the schema-v4 artifact closure", async () => {
  const fixture = await createFixture();
  try {
    const rootRequirement = fixture.coverage.requirements[0];
    const rootCapturePath = path.join(fixture.root, rootRequirement.captureManifest);
    const rootCapture = JSON.parse(await readFile(rootCapturePath, "utf8"));
    rootCapture.schemaVersion = 2;
    delete rootCapture.sourceUrl;
    delete rootCapture.implementationArtifactClosure;
    rootRequirement.captureManifestSha256 = await writeJson(rootCapturePath, rootCapture);
    delete fixture.manifest.implementation.defaultFrameDomainId;
    delete fixture.manifest.implementation.frameDomains;
    fixture.coverage = {
      schemaVersion: 1,
      animationId: fixture.manifest.animationId,
      frameCount: 10,
      scenarios: ["default"],
      languages: ["en"],
      combinations: [{
        status: "complete",
        scenario: "default",
        language: "en",
        seed: "0",
        firstFrame: 1,
        lastFrame: 10,
        capturedFrameCount: 10,
        missingFrames: [],
        captureManifest: rootRequirement.captureManifest,
        captureManifestSha256: rootRequirement.captureManifestSha256,
        metricsFile: rootRequirement.metricsFile,
        metricsSha256: rootRequirement.metricsSha256,
      }],
    };
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(
      errors.some((error) => error.includes("prereview-only") && error.includes("capture-time implementation artifact closure")),
      errors.join("\n"),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("validator rejects schema-v4 capture generator provenance with a non-exact shape", async () => {
  const fixture = await createFixture();
  try {
    const requirement = fixture.coverage.requirements[0];
    const capturePath = path.join(fixture.root, requirement.captureManifest);
    const capture = JSON.parse(await readFile(capturePath, "utf8"));
    delete capture.generatorProvenance.playwright.packageJsonSha256;
    capture.generatorProvenance.browser.unbound = true;
    requirement.captureManifestSha256 = await writeJson(capturePath, capture);
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("generatorProvenance")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a local-142 domain whose declared coverage stops at frame 10", async () => {
  const fixture = await createFixture({ localRangeLastFrame: 10 });
  try {
    const errors = await validateFixture(fixture);
    assert.ok(
      errors.some((error) => error.includes("invalid canonical frame selection")),
      errors.join("\n"),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects unknown domains and duplicate trace requirements", async () => {
  const fixture = await createFixture();
  try {
    const local = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "sprite-58");
    fixture.coverage.requirements.push(structuredClone(fixture.coverage.requirements[0]));
    local.frameDomainId = "sprite-missing";
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("unknown frameDomainId sprite-missing")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("duplicate frameDomainId/traceId/language requirement")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects missing and duplicate stable requirement IDs", async () => {
  const fixture = await createFixture();
  try {
    fixture.coverage.requirements[1].requirementId = "";
    fixture.coverage.requirements.push(structuredClone(fixture.coverage.requirements[0]));
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("requirementId must be a stable non-empty identifier")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("duplicate requirementId req-default-root-en")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a missing captured frame even when the requirement claims no gaps", async () => {
  const fixture = await createFixture({ omittedCaptureFrame: 72 });
  try {
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("missing captured frame 72")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects entry-state hash drift", async () => {
  const fixture = await createFixture();
  try {
    fixture.coverage.requirements[1].entryStateSha256 = "0".repeat(64);
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("entryStateSha256 does not match canonical entryState JSON")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects metrics whose domain, trace, or state hash drift from the requirement", async () => {
  const fixture = await createFixture();
  try {
    await updateLocalMetrics(fixture, (metrics) => {
      metrics.frameDomainId = "root";
      metrics.frames[0].traceId = "wrong-trace";
      metrics.frames[0].entryStateSha256 = "0".repeat(64);
    });
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("metrics requirementId/frameDomainId/traceId/entryStateSha256 do not match")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("metric requirement/domain/trace/state pairing mismatch")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects capture and metrics evidence that omit the bound requirement ID", async () => {
  const fixture = await createFixture();
  try {
    await updateLocalCapture(fixture, (capture) => {
      delete capture.requirementId;
      delete capture.captured[0].requirementId;
    });
    await updateLocalMetrics(fixture, (metrics) => {
      delete metrics.requirementId;
      delete metrics.frames[0].requirementId;
    });
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("capture requirementId/frameDomainId/traceId/entryStateSha256 do not match")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("metrics requirementId/frameDomainId/traceId/entryStateSha256 do not match")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a root baseline paired to a nested trace", async () => {
  const fixture = await createFixture();
  try {
    await updateLocalMetrics(fixture, (metrics) => {
      metrics.baselineFrameDomainId = "root";
    });
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("metrics baseline authority/domain/trace/state pairing mismatch")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("allows a frame-accurate direct-seek baseline for the root domain only", async () => {
  const fixture = await createFixture();
  try {
    const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "root");
    requirement.baselineAuthorityRequirement = "original-runtime-frame-accurate";
    requirement.baselineAuthority = "original-runtime-direct-seek";
    const baselinePath = path.join(fixture.root, requirement.baselineCaptureManifest);
    const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
    baseline.baselineAuthority = "original-runtime-direct-seek";
    baseline.capture.traceEntryMode = "original-runtime-direct-seek";
    baseline.capture.frameCaptureMode = "deterministic-direct-seek";
    requirement.baselineCaptureManifestSha256 = await writeJson(baselinePath, baseline);
    const metricsPath = path.join(fixture.root, requirement.metricsFile);
    const metrics = JSON.parse(await readFile(metricsPath, "utf8"));
    metrics.baselineAuthority = "original-runtime-direct-seek";
    metrics.baselineCaptureManifestSha256 = requirement.baselineCaptureManifestSha256;
    requirement.metricsSha256 = await writeJson(metricsPath, metrics);
    await updateCoverage(fixture);
    assert.deepEqual(await validateFixture(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("allows a root-entry sequential frame-step baseline for a non-interactive root domain", async () => {
  const fixture = await createFixture();
  try {
    const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "root");
    requirement.baselineAuthorityRequirement = "original-runtime-frame-accurate";
    requirement.baselineAuthority = "original-runtime-frame-step";
    const baselinePath = path.join(fixture.root, requirement.baselineCaptureManifest);
    const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
    baseline.baselineAuthority = "original-runtime-frame-step";
    baseline.capture.traceEntryMode = "original-runtime-root-entry";
    baseline.capture.frameCaptureMode = "deterministic-sequential-step";
    requirement.baselineCaptureManifestSha256 = await writeJson(baselinePath, baseline);
    const metricsPath = path.join(fixture.root, requirement.metricsFile);
    const metrics = JSON.parse(await readFile(metricsPath, "utf8"));
    metrics.baselineAuthority = "original-runtime-frame-step";
    metrics.baselineCaptureManifestSha256 = requirement.baselineCaptureManifestSha256;
    requirement.metricsSha256 = await writeJson(metricsPath, metrics);
    await updateCoverage(fixture);
    assert.deepEqual(await validateFixture(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("requires a hash-bound original-runtime baseline manifest for every complete requirement", async () => {
  const fixture = await createFixture();
  try {
    const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "sprite-58");
    requirement.baselineCaptureManifest = "";
    requirement.baselineCaptureManifestSha256 = "";
    await updateCoverage(fixture);
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("baselineCaptureManifest does not exist")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("baselineSha256 is not bound to its baseline capture frame")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects baseline identity drift and a non-natural entry protocol", async () => {
  const fixture = await createFixture();
  try {
    await updateLocalBaseline(fixture, (baseline) => {
      baseline.requirementId = "another-requirement";
      baseline.capture.traceEntryMode = "direct-seek";
      baseline.capture.entryTrace.at(-1).resultingFrameDomainId = "root";
    });
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("baseline requirement/domain/trace/state/scenario/language/seed pairing mismatch")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("traceEntryMode must be natural-runtime-navigation")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("entry trace must terminate in the required frame domain")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects metrics that are not bound to both capture manifests and their exact frame hashes", async () => {
  const fixture = await createFixture();
  try {
    await updateLocalMetrics(fixture, (metrics) => {
      metrics.baselineCaptureManifestSha256 = "0".repeat(64);
      metrics.implementationCaptureManifestSha256 = "1".repeat(64);
      metrics.frames[0].baselineSha256 = "2".repeat(64);
      metrics.frames[0].implementationSha256 = "3".repeat(64);
    });
    const errors = await validateFixture(fixture);
    assert.ok(errors.some((error) => error.includes("metrics baseline/implementation capture manifest hashes do not match")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("baselineSha256 is not bound to its baseline capture frame")), errors.join("\n"));
    assert.ok(errors.some((error) => error.includes("implementationSha256 is not bound to its implementation capture frame")), errors.join("\n"));
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("candidate, direct-seek, frame-step, and root-only baselines cannot satisfy a nested natural trace", async (t) => {
  for (const authority of ["implementation-candidate", "original-runtime-direct-seek", "original-runtime-frame-step", "original-runtime-root-only"]) {
    await t.test(authority, async () => {
      const fixture = await createFixture();
      try {
        await updateLocalMetrics(fixture, (metrics, requirement) => {
          metrics.baselineAuthority = authority;
          requirement.baselineAuthority = authority;
        });
        const errors = await validateFixture(fixture);
        assert.ok(errors.some((error) => error.includes(`does not satisfy original-runtime-natural-trace`)), errors.join("\n"));
      } finally {
        await rm(fixture.root, { recursive: true, force: true });
      }
    });
  }
});

test("validates a 1,873-frame nested natural trace without using runtime.frameCount as its bound", async () => {
  const fixture = await createFixture({ localFrameCount: 1873 });
  try {
    assert.deepEqual(await validateFixture(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects direct-seek and frame-step authority for an interactive root scenario", async (t) => {
  for (const authority of ["original-runtime-direct-seek", "original-runtime-frame-step"]) await t.test(authority, async () => {
    const fixture = await createFixture();
    try {
      fixture.manifest.scenarios[0].kind = "interactive";
      const requirement = fixture.coverage.requirements.find(({ frameDomainId }) => frameDomainId === "root");
      requirement.baselineAuthorityRequirement = "original-runtime-frame-accurate";
      requirement.baselineAuthority = authority;
      const baselinePath = path.join(fixture.root, requirement.baselineCaptureManifest);
      const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
      baseline.baselineAuthority = authority;
      baseline.capture.traceEntryMode = authority === "original-runtime-direct-seek"
        ? "original-runtime-direct-seek"
        : "original-runtime-root-entry";
      baseline.capture.frameCaptureMode = authority === "original-runtime-direct-seek"
        ? "deterministic-direct-seek"
        : "deterministic-sequential-step";
      requirement.baselineCaptureManifestSha256 = await writeJson(baselinePath, baseline);
      const metricsPath = path.join(fixture.root, requirement.metricsFile);
      const metrics = JSON.parse(await readFile(metricsPath, "utf8"));
      metrics.baselineAuthority = authority;
      metrics.baselineCaptureManifestSha256 = requirement.baselineCaptureManifestSha256;
      requirement.metricsSha256 = await writeJson(metricsPath, metrics);
      await updateCoverage(fixture);
      const errors = await validateFixture(fixture);
      assert.ok(errors.some((error) => error.includes("interactive scenarios require an original-runtime-natural-trace baseline")), errors.join("\n"));
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });
});

async function createDispositionFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "frame-domain-disposition-validator-"));
  const animationId = "course-disposition-fixture";
  const sourceBytes = Buffer.from("source swf fixture\n");
  const swfmillBytes = Buffer.from("hash-bound swfmill fixture\n");
  await writeFile(path.join(root, "source.swf"), sourceBytes);
  await mkdir(path.join(root, "audit", "machine"), { recursive: true });
  await writeFile(path.join(root, "audit", "machine", "swfmill.xml.gz"), swfmillBytes);
  const manifest = {
    animationId,
    status: "complete",
    source: { swf: "source.swf", swfSha256: digest(sourceBytes) },
    runtime: { frameCount: 10 },
    implementation: {
      defaultFrameDomainId: "sprite-58",
      frameDomains: [
        {
          id: "root",
          kind: "root",
          sourceTimelineId: "root",
          sourceInstanceId: "root",
          parentFrameDomainId: null,
          frameCount: 10,
          scenarioIds: ["default"],
          role: "root-shell-placement",
        },
        {
          id: "sprite-58",
          kind: "nested",
          sourceTimelineId: "sprite-58",
          sourceInstanceId: "main-animation",
          parentFrameDomainId: "root",
          parentEntryFrame: 6,
          localEntryFrame: 1,
          frameCount: 142,
          scenarioIds: ["default"],
          role: "main-animation",
        },
      ],
    },
  };
  await writeJson(path.join(root, "migration.json"), manifest);
  const manifestSha256 = technicalManifestSha256(manifest);
  const inventory = {
    schemaVersion: 1,
    animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    evidenceIndex: [
      { artifactId: "source-swf", path: "source.swf", sha256: digest(sourceBytes) },
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: manifestSha256,
        hashMode: "canonical-json-v1",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      { artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: digest(swfmillBytes) },
    ],
    timelineInventory: [
      {
        timelineId: "root",
        objectId: null,
        frameCount: 10,
        structuralReachability: "root",
        controlStates: [{ frame: 1 }, { frame: 10 }],
        frameLabels: [],
        namedPlacements: [{ objectId: "58", frame: 6, depth: "1", name: "animation", tag: "PlaceObject2", replace: "0", hasClipActions: false }],
      },
      {
        timelineId: "sprite-58",
        objectId: "58",
        frameCount: 142,
        structuralReachability: "reachable-from-root-placement-graph",
        controlStates: [{ frame: 1 }, { frame: 142 }],
        frameLabels: [],
        namedPlacements: [],
      },
    ],
  };
  const inventoryPath = path.join(root, "audit", "scenario-inventory.json");
  const inventorySha256 = await writeJson(inventoryPath, inventory);
  const report = buildDispositionReport({ animationId, inventory, inventorySha256, manifest, manifestSha256 });
  const reportPath = path.join(root, "audit", "frame-domain-disposition.json");
  await writeJson(reportPath, report);
  return { root, manifest, report, reportPath };
}

async function dispositionErrors(fixture) {
  const errors = [];
  await validateFrameDomainDisposition({
    root: fixture.root,
    manifest: fixture.manifest,
    errors,
    evidenceProjectRoot: fixture.root,
  });
  return errors;
}

const conversion14MigrationRoot = path.join(
  checkedProjectRoot,
  "migrations",
  "formula-elementary-conversion-01-04",
);
const in009MigrationRoot = path.join(
  checkedProjectRoot,
  "migrations",
  "course-g04-l03-in-009",
);

async function createConversion14DispositionFixture() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "conversion-01-04-disposition-validator-"));
  const root = path.join(temporaryRoot, "migration");
  await cp(conversion14MigrationRoot, root, {recursive: true});
  const manifest = JSON.parse(await readFile(path.join(root, "migration.json"), "utf8"));
  return {temporaryRoot, root, manifest};
}

async function createIn009DispositionFixture() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "course-g04-l03-in-009-disposition-validator-"));
  const root = path.join(temporaryRoot, "migration");
  await cp(in009MigrationRoot, root, {recursive: true});
  const manifest = JSON.parse(await readFile(path.join(root, "migration.json"), "utf8"));
  return {temporaryRoot, root, manifest};
}

async function mutateConversion14StaticEvidence(fixture, mutate) {
  const evidencePath = path.join(fixture.root, "audit", "static-frame-domain-disposition-evidence.json");
  const reportPath = path.join(fixture.root, "audit", "frame-domain-disposition.json");
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const claim = evidence.claims.find(({timelineId}) => timelineId === "sprite-156");
  assert.ok(claim, "Conversion_1_4 fixture must contain the pinned sprite-156 claim");
  mutate(claim);
  const evidenceSha256 = await writeJson(evidencePath, evidence);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  report.generatedFrom.staticDispositionEvidence.sha256 = evidenceSha256;
  const timeline = report.timelines.find(({timelineId}) => timelineId === "sprite-156");
  assert.ok(timeline, "Conversion_1_4 disposition must contain sprite-156");
  timeline.staticCompositeEvidence.evidenceSha256 = evidenceSha256;
  await writeJson(reportPath, report);
}

async function mutateIn009StaticEvidence(fixture, timelineId, mutate) {
  const evidencePath = path.join(fixture.root, "audit", "static-frame-domain-disposition-evidence.json");
  const reportPath = path.join(fixture.root, "audit", "frame-domain-disposition.json");
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const claim = evidence.claims.find((candidate) => candidate.timelineId === timelineId);
  assert.ok(claim, `IN009 fixture must contain the pinned ${timelineId} claim`);
  mutate(claim);
  const evidenceSha256 = await writeJson(evidencePath, evidence);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  report.generatedFrom.staticDispositionEvidence.sha256 = evidenceSha256;
  for (const timeline of report.timelines.filter(({staticCompositeEvidence}) => staticCompositeEvidence)) {
    timeline.staticCompositeEvidence.evidenceSha256 = evidenceSha256;
  }
  await writeJson(reportPath, report);
}

async function conversion14DispositionErrors(fixture) {
  const errors = [];
  await validateFrameDomainDisposition({
    root: fixture.root,
    manifest: fixture.manifest,
    errors,
    evidenceProjectRoot: checkedProjectRoot,
  });
  return errors;
}

async function in009DispositionErrors(fixture) {
  const errors = [];
  await validateFrameDomainDisposition({
    root: fixture.root,
    manifest: fixture.manifest,
    errors,
    evidenceProjectRoot: checkedProjectRoot,
  });
  return errors;
}

test("accepts an exhaustive hash-bound frame-domain disposition", async () => {
  const fixture = await createDispositionFixture();
  try {
    assert.deepEqual(await dispositionErrors(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("frame-domain disposition stays valid across named reviews and status promotion", async () => {
  const fixture = await createDispositionFixture();
  try {
    fixture.manifest.status = "complete";
    fixture.manifest.acceptance = {
      humanVisualReview: {decision: "accepted", reviewer: "Named human", reviewedAt: "2026-07-22T00:00:00.000Z"},
      ownerReview: {decision: "accepted", reviewer: "Named owner", reviewedAt: "2026-07-22T01:00:00.000Z"},
    };
    await writeJson(path.join(fixture.root, "migration.json"), fixture.manifest);
    assert.deepEqual(await dispositionErrors(fixture), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("frame-domain disposition validation fails closed on stale, unresolved, omitted, and fake declarations", async (t) => {
  const cases = [
    {
      name: "stale scenario inventory hash",
      mutate(report) { report.generatedFrom.scenarioInventory.sha256 = "0".repeat(64); },
      expected: "scenario inventory SHA-256 is stale",
    },
    {
      name: "unresolved reachable timeline",
      mutate(report) {
        const timeline = report.timelines.find(({ timelineId }) => timelineId === "sprite-58");
        timeline.disposition = "unresolved";
        report.status = "structurally-enumerated-dispositions-unresolved";
        report.summary.dispositionCounts["declared-frame-domain"] -= 1;
        report.summary.dispositionCounts.unresolved += 1;
      },
      expected: "unresolved structurally reachable timeline",
    },
    {
      name: "omitted reachable timeline",
      mutate(report) {
        report.timelines = report.timelines.filter(({ timelineId }) => timelineId !== "sprite-58");
        report.summary.enumeratedTimelineCount -= 1;
        report.summary.reachableChildTimelineCount -= 1;
        report.summary.dispositionCounts["declared-frame-domain"] -= 1;
      },
      expected: "omits 1 structurally root-reachable timeline",
    },
    {
      name: "fake declared frame domain",
      mutate(report) {
        report.timelines[0].declaredFrameDomains[0].frameDomainId = "fake-root";
      },
      expected: "declaredFrameDomains do not exactly match migration.json",
    },
  ];
  for (const item of cases) await t.test(item.name, async () => {
    const fixture = await createDispositionFixture();
    try {
      item.mutate(fixture.report);
      await writeJson(fixture.reportPath, fixture.report);
      const errors = await dispositionErrors(fixture);
      assert.ok(errors.some((error) => error.includes(item.expected)), errors.join("\n"));
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });
});

test("accepts only the pinned Conversion_1_4 root-parent multi-frame binding", async () => {
  const manifest = JSON.parse(await readFile(path.join(conversion14MigrationRoot, "migration.json"), "utf8"));
  const errors = [];
  await validateFrameDomainDisposition({
    root: conversion14MigrationRoot,
    manifest,
    errors,
    evidenceProjectRoot: checkedProjectRoot,
  });
  assert.deepEqual(errors, []);
});

test("Conversion_1_4 root-parent validation rejects forged root and global DoInitAction bindings", async (t) => {
  const cases = [
    {
      name: "forged root placement",
      mutate(claim) {
        claim.parentBinding.rootPlacement = {
          frame: 1,
          depth: "1",
          tag: "PlaceObject2",
          declaredSourceObjectId: "156",
          instanceName: "forged",
          replace: "0",
          hasClipActions: false,
        };
      },
      expected: "lacks exact source/declared-parent/root-placement proof",
    },
    {
      name: "forged root object identity",
      mutate(claim) {
        claim.parentBinding.parentSourceObjectId = "156";
      },
      expected: "lacks exact source/declared-parent/root-placement proof",
    },
    {
      name: "forged observed global DoInitAction ID array",
      mutate(claim) {
        claim.scriptAudit.globalDoInitActionSpriteObjectIds = claim.scriptAudit.globalDoInitActionSpriteObjectIds.slice(0, -1);
        claim.scriptAudit.globalDoInitActionCount = claim.scriptAudit.globalDoInitActionSpriteObjectIds.length;
      },
      expected: "lacks no-script/init/clip/dynamic/external-target-control proof",
    },
    {
      name: "forged expected global DoInitAction ID array",
      mutate(claim) {
        claim.scriptAudit.expectedGlobalDoInitActionSpriteObjectIds = claim.scriptAudit.expectedGlobalDoInitActionSpriteObjectIds.slice(1);
      },
      expected: "lacks no-script/init/clip/dynamic/external-target-control proof",
    },
    {
      name: "matching but forged global DoInitAction ID arrays",
      mutate(claim) {
        const forged = claim.scriptAudit.globalDoInitActionSpriteObjectIds.slice(0, -1);
        claim.scriptAudit.globalDoInitActionSpriteObjectIds = forged;
        claim.scriptAudit.expectedGlobalDoInitActionSpriteObjectIds = [...forged];
        claim.scriptAudit.globalDoInitActionCount = forged.length;
      },
      expected: "lacks no-script/init/clip/dynamic/external-target-control proof",
    },
    {
      name: "forged global DoInitAction exact-match flag",
      mutate(claim) {
        claim.scriptAudit.globalDoInitActionSetExactMatch = false;
      },
      expected: "lacks no-script/init/clip/dynamic/external-target-control proof",
    },
    {
      name: "overbroad parent-terminal count on a legacy removal-only claim",
      mutate(claim) {
        claim.placementLifecycleAudit.parentTerminalTerminationCount = 0;
      },
      expected: "lacks exhaustive placement/update/termination proof",
    },
    {
      name: "overbroad zero-wrap permission on a wrapped legacy lifetime",
      mutate(claim) {
        claim.placementLifecycleAudit.lifetimes[0].localPlayhead.zeroWrapPermittedByPinnedSpec = true;
      },
      expected: "lacks exhaustive placement/update/termination proof",
    },
  ];
  for (const item of cases) await t.test(item.name, async () => {
    const fixture = await createConversion14DispositionFixture();
    try {
      await mutateConversion14StaticEvidence(fixture, item.mutate);
      const errors = await conversion14DispositionErrors(fixture);
      assert.ok(errors.some((error) => error.includes(item.expected)), errors.join("\n"));
    } finally {
      await rm(fixture.temporaryRoot, {recursive: true, force: true});
    }
  });
});

test("accepts only the pinned IN009 parent-terminal and zero-wrap lifetime contracts", async () => {
  const manifest = JSON.parse(await readFile(path.join(in009MigrationRoot, "migration.json"), "utf8"));
  const errors = [];
  await validateFrameDomainDisposition({
    root: in009MigrationRoot,
    manifest,
    errors,
    evidenceProjectRoot: checkedProjectRoot,
  });
  assert.deepEqual(errors, []);
});

test("IN009 lifecycle validation rejects implicit, overbroad, and forged terminal/zero-wrap variants", async (t) => {
  const cases = [
    {
      name: "forged explicit-removal count",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.explicitRemovalCount = 2;
      },
      expected: "lacks exhaustive placement/update/termination proof",
    },
    {
      name: "forged parent-terminal count",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.parentTerminalTerminationCount = 0;
      },
      expected: "lacks exhaustive placement/update/termination proof",
    },
    {
      name: "forged replacement count",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.replacementTerminationCount = 1;
      },
      expected: "lacks exhaustive placement/update/termination proof",
    },
    {
      name: "forged zero-wrap count",
      timelineId: "sprite-150",
      mutate(claim) {
        claim.placementLifecycleAudit.zeroWrapLifetimeCount = 2;
      },
      expected: "lacks exhaustive placement/update/termination proof",
    },
    {
      name: "implicit terminal without pinned marker",
      timelineId: "sprite-123",
      mutate(claim) {
        delete claim.placementLifecycleAudit.lifetimes[1].terminalAtParentEndPermittedByPinnedSpec;
      },
      expected: "lifetime 2 lacks exact one-indexed/reset mapping",
    },
    {
      name: "forged terminal tag",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.lifetimes[1].termination.tag = "RemoveObject2";
      },
      expected: "lifetime 2 lacks exact one-indexed/reset mapping",
    },
    {
      name: "forged terminal frame",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.lifetimes[1].termination.frame = 638;
      },
      expected: "lifetime 2 lacks exact one-indexed/reset mapping",
    },
    {
      name: "forged terminal depth",
      timelineId: "sprite-146",
      mutate(claim) {
        claim.placementLifecycleAudit.lifetimes[1].termination.depth = "999";
      },
      expected: "lifetime 2 lacks exact one-indexed/reset mapping",
    },
    {
      name: "overbroad terminal marker on an explicit removal",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.lifetimes[0].terminalAtParentEndPermittedByPinnedSpec = true;
      },
      expected: "lifetime 1 lacks exact one-indexed/reset mapping",
    },
    {
      name: "implicit zero-wrap without pinned marker",
      timelineId: "sprite-150",
      mutate(claim) {
        delete claim.placementLifecycleAudit.lifetimes[0].localPlayhead.zeroWrapPermittedByPinnedSpec;
      },
      expected: "lifetime 1 lacks exact one-indexed/reset mapping",
    },
    {
      name: "overbroad zero-wrap marker on a wrapped lifetime",
      timelineId: "sprite-123",
      mutate(claim) {
        claim.placementLifecycleAudit.lifetimes[0].localPlayhead.zeroWrapPermittedByPinnedSpec = true;
      },
      expected: "lifetime 1 lacks exact one-indexed/reset mapping",
    },
    {
      name: "forged second zero-wrap segment",
      timelineId: "sprite-150",
      mutate(claim) {
        const playhead = claim.placementLifecycleAudit.lifetimes[0].localPlayhead;
        playhead.segments.push({
          kind: "scriptless-wrap",
          parentStartFrame: 505,
          parentEndFrame: 505,
          localStartFrame: 1,
          localEndFrame: 1,
        });
      },
      expected: "lifetime 1 lacks exact one-indexed/reset mapping",
    },
  ];
  for (const item of cases) await t.test(item.name, async () => {
    const fixture = await createIn009DispositionFixture();
    try {
      await mutateIn009StaticEvidence(fixture, item.timelineId, item.mutate);
      const errors = await in009DispositionErrors(fixture);
      assert.ok(errors.some((error) => error.includes(item.expected)), errors.join("\n"));
    } finally {
      await rm(fixture.temporaryRoot, {recursive: true, force: true});
    }
  });
});

test("validator exhaustively reconciles all 557 checked-in course and shell timeline identities", async () => {
  let timelineCount = 0;
  for (const animationId of COURSE_PILOT_IDS) {
    const root = path.join(checkedProjectRoot, "migrations", animationId);
    const manifest = JSON.parse(await readFile(path.join(root, "migration.json"), "utf8"));
    const errors = [];
    const result = await validateFrameDomainDisposition({ root, manifest, errors, evidenceProjectRoot: checkedProjectRoot });
    timelineCount += result.report.summary.enumeratedTimelineCount;
    const structuralErrors = errors.filter((error) => !(
      error.includes("status is not strict-ready")
      || error.includes("unresolved structurally reachable timeline")
      || error.includes("independent-required timeline")
    ));
    assert.deepEqual(structuralErrors, [], `${animationId}: ${structuralErrors.join("\n")}`);
  }
  assert.equal(timelineCount, 557);
});
