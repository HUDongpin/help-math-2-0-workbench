import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {PNG} from "pngjs";

import {adoptCourseImplementationCaptures, parseArguments} from "./adopt-course-implementation-captures.mjs";
import {buildCaptureUrl} from "./capture-animation-keyframes.mjs";
import {captureCoverageV2Requirements} from "./capture-coverage-v2-requirements.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";
import {canonicalJson, sha256Text} from "./sync-pilot-frame-domains.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeJson(candidate, value) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(candidate, bytes);
  return digest(bytes);
}

async function fixture() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-adopt-captures-"));
  const animationId = "course-fixture";
  const workspace = path.join(projectRoot, "migrations", animationId);
  const captureDirectory = path.join(projectRoot, "output", "playwright", animationId, "implementation", "req-root");
  await mkdir(captureDirectory, {recursive: true});
  const entryState = {kind: "original-root-frame-accurate-entry", rootTimelineId: "root", rootEntryFrame: 1, scenario: "root-standalone", language: "en", seed: "0"};
  const requirement = {
    requirementId: "req:root:root-standalone:en",
    scenario: "root-standalone",
    frameDomainId: "root",
    traceId: "trace:root:root-standalone:en:seed-0",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 1},
    entryState,
    entryStateSha256: sha256Text(canonicalJson(entryState)),
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason: "baseline pending",
    blockingEvidence: [{file: "audit/scenario-inventory.json", sha256: "a".repeat(64)}],
    capturedFrameCount: 0,
    missingFrames: [1],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  };
  const manifest = {
    schemaVersion: 2,
    animationId,
    status: "preserved",
    runtime: {stage: {width: 2, height: 2}, frameCount: 1},
    implementation: {
      component: `migrations/${animationId}/renderer.ts`,
    },
    evidence: {keyframeCsv: "keyframes.csv", fullFrameCoverageFile: "evidence/full-frame-coverage.json", candidateCaptureManifests: []},
    acceptance: {knownExceptions: [{id: "full-frame-and-human-review-pending", status: "blocking", reason: "pending"}]},
  };
  await mkdir(workspace, {recursive: true});
  await writeFile(path.join(workspace, "renderer.ts"), "export const frame = 1;\n");
  await writeJson(path.join(workspace, "migration.json"), manifest);
  await writeJson(path.join(workspace, "evidence", "full-frame-coverage.json"), {schemaVersion: 2, animationId, requirements: [requirement]});
  const header = "frame,requirement_id,frame_domain_id,trace_id,entry_state_sha256,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes";
  await writeFile(path.join(workspace, "keyframes.csv"), `${header}\n1,${requirement.requirementId},root,${requirement.traceId},${requirement.entryStateSha256},0.001,root-standalone,en,static,fixture,load,,,,,,,,,,trace.json,,pending\n`);
  const png = new PNG({width: 2, height: 2});
  const pngBytes = PNG.sync.write(png);
  const imageSha256 = digest(pngBytes);
  await writeFile(path.join(captureDirectory, "frame-001.png"), pngBytes);
  const identity = {
    animationId,
    requirementId: requirement.requirementId,
    frameDomainId: "root",
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: "root-standalone",
    language: "en",
    seed: "0",
  };
  const implementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot,
    workspace,
    manifest,
  });
  const capture = {
    schemaVersion: 4,
    status: "complete",
    sourceUrl: `http://127.0.0.1:3213/animations/${animationId}`,
    generatorProvenance: testCaptureGeneratorProvenance(),
    implementationArtifactClosure,
    ...identity,
    requestedFrameDomain: "root",
    reportedAnimationIdAttribute: "data-animation-id",
    reportedFrameAttribute: "data-flash-frame",
    reportedFrameDomainAttribute: "data-flash-frame-domain",
    reportedRequirementIdAttribute: "data-flash-requirement-id",
    reportedTraceAttribute: "data-flash-trace-id",
    reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
    reportedFlashScenarioAttribute: "data-flash-scenario",
    reportedFlashLanguageAttribute: "data-flash-lang",
    reportedFlashSeedAttribute: "data-flash-seed",
    reportedScenarioAttribute: "data-runtime-scenario",
    reportedLanguageAttribute: "data-runtime-language",
    reportedSeedAttribute: "data-runtime-seed",
    flashContextIdentityComplete: true,
    captureStageAttribute: "data-capture-stage",
    reportedRenderStateAttribute: "data-render-state",
    reportedVisualTargetAttribute: "data-render-visual",
    requiredRenderState: "ready",
    viewport: {width: 2, height: 2, deviceScaleFactor: 1},
    error: null,
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    captured: [{
      ...identity,
      frame: 1,
      reportedFrame: 1,
      reportedFrameDomainId: "root",
      rootFrame: 1,
      reportedRenderState: "ready",
      flashContextIdentityComplete: true,
      visualTarget: {...identity, tagName: "svg", reportedFrame: 1, rootFrame: 1, reportedRenderState: "ready", flashContextIdentityComplete: true},
      file: "frame-001.png",
      sha256: imageSha256,
      width: 2,
      height: 2,
    }],
  };
  await writeJson(path.join(captureDirectory, "capture-manifest.json"), capture);
  return {projectRoot, id: animationId, captureRoot: path.join(projectRoot, "output", "playwright", animationId, "implementation"), workspace};
}

function captureContract() {
  return {
    frameParameter: "frame",
    frameDomainParameter: "frameDomain",
    requirementIdParameter: "requirementId",
    traceParameter: "trace",
    entryStateSha256Parameter: "entryStateSha256",
    scenarioParameter: "scenario",
    languageParameter: "lang",
    seedParameter: "seed",
  };
}

async function partialPipelineFixture() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-partial-pipeline-"));
  const id = "course-partial-pipeline";
  const workspace = path.join(projectRoot, "migrations", id);
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  const entry = (language) => ({
    kind: "original-root-frame-accurate-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario: "root-standalone",
    language,
    seed: "0",
  });
  const canonical = (language) => {
    const entryState = entry(language);
    return {
      requirementId: `req:root:root-standalone:${language}`,
      scenario: "root-standalone",
      frameDomainId: "root",
      traceId: `trace:root:root-standalone:${language}:seed-0`,
      language,
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: 3},
      entryState,
      entryStateSha256: sha256Text(canonicalJson(entryState)),
      baselineAuthorityRequirement: "original-runtime-frame-accurate",
      baselineAuthority: "unresolved",
      status: "blocked",
      blockingReason: "canonical baseline pending",
      blockingEvidence: [],
      capturedFrameCount: 0,
      missingFrames: [1, 2, 3],
      baselineCaptureManifest: "",
      baselineCaptureManifestSha256: "",
      captureManifest: "",
      captureManifestSha256: "",
      metricsFile: "baseline-metrics-stays-unmodified.json",
      metricsSha256: "a".repeat(64),
    };
  };
  const canonicalEnglish = canonical("en");
  const canonicalSpanish = canonical("es");
  const supplemental = {
    ...structuredClone(canonicalEnglish),
    requirementId: "req:root:root-standalone:en:partial-frames-1-2",
    traceId: "trace:root:root-standalone:en:seed-0:partial-frames-1-2",
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "coverage-group:root:root-standalone:en:seed-0",
    requiredRange: {firstFrame: 1, lastFrame: 2},
    strictAcceptanceEffect: "none",
    blockingReason: "supplemental current-JavaScript capture pending",
    missingFrames: [1, 2],
    metricsFile: "",
    metricsSha256: "",
  };
  supplemental.selectionSha256 = selectionSha256(supplemental, 3);
  const manifest = {
    schemaVersion: 2,
    animationId: id,
    status: "preserved",
    runtime: {
      stage: {width: 2, height: 2},
      frameCount: 3,
      timelineDefinitions: [{id: "root", frameCount: 3}],
    },
    implementation: {
      route: `/animations/${id}`,
      captureContract: captureContract(),
      frameDomains: [{id: "root", frameCount: 3, scenarioIds: ["root-standalone"]}],
      component: `migrations/${id}/renderer.ts`,
    },
    evidence: {
      keyframeCsv: "keyframes.csv",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
      candidateCaptureManifests: [],
    },
    acceptance: {
      knownExceptions: [{id: "full-frame-and-human-review-pending", status: "blocking", reason: "must stay unchanged"}],
      humanVisualReview: {decision: "pending", reviewer: ""},
      ownerReview: {decision: "pending", reviewer: ""},
    },
  };
  const coverage = {
    schemaVersion: 2,
    animationId: id,
    requirements: [canonicalEnglish, canonicalSpanish, supplemental],
  };
  await writeFile(path.join(workspace, "renderer.ts"), "export const partialFrames = [1, 2];\n");
  await writeJson(path.join(workspace, "migration.json"), manifest);
  await writeJson(path.join(workspace, "evidence", "full-frame-coverage.json"), coverage);
  const header = "frame,requirement_id,frame_domain_id,trace_id,entry_state_sha256,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes";
  await writeFile(
    path.join(workspace, "keyframes.csv"),
    `${header}\n1,${supplemental.requirementId},root,${supplemental.traceId},${supplemental.entryStateSha256},0.001,root-standalone,en,static,fixture,load,,,,,,,,,,trace.json,,pending\n2,${supplemental.requirementId},root,${supplemental.traceId},${supplemental.entryStateSha256},83.334,root-standalone,en,static,fixture,play,,,,,,,,,,trace.json,,pending\n`,
  );
  const implementationArtifactClosure = await collectImplementationArtifactClosure({
    projectRoot,
    workspace,
    manifest,
  });
  return {
    projectRoot,
    id,
    workspace,
    manifest,
    coverage,
    supplemental,
    implementationArtifactClosure,
  };
}

function syntheticCapture(implementationArtifactClosure) {
  return async (options) => {
    await mkdir(options.output, {recursive: true});
    const captured = [];
    for (const frame of options.frameList) {
      const png = new PNG({width: options.width, height: options.height});
      png.data.fill(frame);
      const bytes = PNG.sync.write(png);
      const file = `frame-${String(frame).padStart(3, "0")}.png`;
      await writeFile(path.join(options.output, file), bytes);
      const identity = {
        animationId: options.id,
        requirementId: options.requirementId,
        frameDomainId: options.frameDomain,
        traceId: options.trace,
        entryStateSha256: options.entryStateSha256,
        scenario: options.scenario,
        language: options.lang,
        seed: String(options.seed),
      };
      captured.push({
        ...identity,
        reportedAnimationId: options.id,
        frame,
        reportedFrame: frame,
        frameDomain: options.frameDomain,
        reportedFrameDomainId: options.frameDomain,
        rootFrame: frame,
        reportedRenderState: "ready",
        flashContextIdentityComplete: true,
        visualTarget: {
          ...identity,
          tagName: "svg",
          reportedFrame: frame,
          rootFrame: frame,
          reportedRenderState: "ready",
          flashContextIdentityComplete: true,
        },
        file,
        sha256: digest(bytes),
        width: options.width,
        height: options.height,
        url: buildCaptureUrl(options, frame).href,
      });
    }
    const capture = {
      schemaVersion: 4,
      status: "complete",
      animationId: options.id,
      sourceUrl: options.url,
      selector: options.selector,
      reportedAnimationIdAttribute: "data-animation-id",
      reportedFrameAttribute: "data-flash-frame",
      reportedFrameDomainAttribute: "data-flash-frame-domain",
      reportedRequirementIdAttribute: "data-flash-requirement-id",
      reportedTraceAttribute: "data-flash-trace-id",
      reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
      reportedFlashScenarioAttribute: "data-flash-scenario",
      reportedFlashLanguageAttribute: "data-flash-lang",
      reportedFlashSeedAttribute: "data-flash-seed",
      reportedScenarioAttribute: "data-runtime-scenario",
      reportedLanguageAttribute: "data-runtime-language",
      reportedSeedAttribute: "data-runtime-seed",
      flashContextIdentityComplete: true,
      captureStageAttribute: "data-capture-stage",
      reportedRenderStateAttribute: "data-render-state",
      reportedVisualTargetAttribute: "data-render-visual",
      requiredRenderState: "ready",
      frameDomainId: options.frameDomain,
      requestedFrameDomain: options.frameDomain,
      requirementId: options.requirementId,
      traceId: options.trace,
      entryStateSha256: options.entryStateSha256,
      scenario: options.scenario,
      language: options.lang,
      seed: String(options.seed),
      viewport: {width: options.width, height: options.height, deviceScaleFactor: options.deviceScale},
      queryParameters: {
        frame: options.frameParam,
        frameDomain: options.frameDomainParam,
        requirementId: options.requirementIdParam,
        trace: options.traceParam,
        entryStateSha256: options.entryStateSha256Param,
        scenario: options.scenarioParam,
        language: options.langParam,
        seed: options.seedParam,
      },
      generatorProvenance: testCaptureGeneratorProvenance(),
      implementationArtifactClosure,
      captured,
      consoleErrors: [],
      failedRequests: [],
      httpErrors: [],
      unexpectedRequests: [],
      error: null,
    };
    await writeJson(path.join(options.output, "capture-manifest.json"), capture);
    return {output: options.output, manifest: capture};
  };
}

async function capturePartialFixtureRequirements(input, suffix, requirementIds) {
  const outputRoot = `output/playwright/${suffix}`;
  const captureRoot = path.join(input.projectRoot, outputRoot);
  const result = await captureCoverageV2Requirements({
    id: input.id,
    projectRoot: input.projectRoot,
    baseUrl: "http://localhost:3213",
    outputRoot,
    requirements: requirementIds,
    check: false,
  }, {
    capture: syntheticCapture(input.implementationArtifactClosure),
    logger: () => {},
  });
  return {captureRoot, result};
}

async function bindAcceptedSchemaV3AdoptionArtifact(input) {
  await adoptCourseImplementationCaptures(input);
  const adoptionPath = path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json");
  const adoption = JSON.parse(await readFile(adoptionPath, "utf8"));
  adoption.approvedSnapshotMarker = "schema-v3-approved-evidence-before-generator-refresh";
  const approvedAdoptionSha256 = await writeJson(adoptionPath, adoption);
  const approvedAdoptionText = await readFile(adoptionPath, "utf8");

  const manifestPath = path.join(input.workspace, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.evidence.currentJavaScriptImplementationCaptureAdoption.sha256 = approvedAdoptionSha256;

  const reportRelativePath = "reports/current-javascript-output-human-approval.json";
  const reportPath = path.join(input.projectRoot, reportRelativePath);
  const artifactBindingSha256 = "b".repeat(64);
  const artifactPath = path.relative(input.projectRoot, adoptionPath).split(path.sep).join("/");
  const report = {
    schemaVersion: 3,
    evidenceType: "human-current-javascript-output-approval",
    decision: "accepted",
    reviewer: "Fixture reviewer",
    reviewedAt: "2026-07-23T11:05:10+08:00",
    sourceMessage: "Fixture approval covers only the hash-bound current JavaScript output.",
    scope: "currently-generated-javascript-based-animations-at-review-time",
    animations: [{
      animationId: input.id,
      artifactBindingSha256,
      artifacts: [{
        path: artifactPath,
        bytes: Buffer.byteLength(approvedAdoptionText),
        sha256: approvedAdoptionSha256,
      }],
    }],
  };
  const reportSha256 = await writeJson(reportPath, report);
  manifest.acceptance.currentJavaScriptOutputApproval = {
    decision: "accepted",
    reviewer: report.reviewer,
    reviewedAt: report.reviewedAt,
    sourceMessage: report.sourceMessage,
    scope: report.scope,
    approvalRecord: reportRelativePath,
    approvalRecordSha256: reportSha256,
    artifactBindingSha256,
    strictHumanReviewEffect: "none",
    history: [],
  };
  await writeJson(manifestPath, manifest);
  return {
    adoptionPath,
    approvedAdoptionSha256,
    artifactBindingSha256,
    manifestPath,
    report,
    reportPath,
    reportSha256,
  };
}

test("adopts exact current-JavaScript frames without promoting any acceptance authority", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const result = await adoptCourseImplementationCaptures(input);
  assert.equal(result.capturedFrameCount, 1);
  assert.equal(result.strictAcceptanceChanged, false);
  const manifest = JSON.parse(await readFile(path.join(input.workspace, "migration.json"), "utf8"));
  const coverage = JSON.parse(await readFile(path.join(input.workspace, "evidence", "full-frame-coverage.json"), "utf8"));
  const keyframes = await readFile(path.join(input.workspace, "keyframes.csv"), "utf8");
  assert.equal(manifest.status, "preserved");
  assert.equal(manifest.evidence.candidateCaptureManifests[0].authority, "non-authoritative-current-javascript-output");
  assert.equal(manifest.evidence.currentJavaScriptImplementationCaptureAdoption.strictAcceptanceEffect, "none");
  assert.equal(coverage.requirements[0].status, "blocked");
  assert.equal(coverage.requirements[0].baselineAuthority, "unresolved");
  assert.equal(coverage.requirements[0].capturedFrameCount, 1);
  assert.deepEqual(coverage.requirements[0].missingFrames, []);
  assert.match(keyframes, /output\/playwright\/course-fixture\/implementation\/req-root\/frame-001\.png/);
  assert.match(keyframes, /no original-runtime baseline/);
  const adoption = JSON.parse(await readFile(path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json"), "utf8"));
  assert.equal(adoption.status, "complete-non-authoritative-implementation-capture");
  assert.equal(adoption.summary.capturedFrameCount, 1);
  assert.equal(adoption.strictAcceptanceEffect, "none");
  await adoptCourseImplementationCaptures({...input, check: true});
});

test("captures and adopts a schema-v2 supplemental selection end to end without changing strict or review gates", async (t) => {
  const input = await partialPipelineFixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const captureRoot = path.join(input.projectRoot, "output", "playwright", "partial-pipeline");
  const captureResult = await captureCoverageV2Requirements({
    id: input.id,
    projectRoot: input.projectRoot,
    baseUrl: "http://localhost:3213",
    outputRoot: "output/playwright/partial-pipeline",
    requirements: [input.supplemental.requirementId],
    check: false,
  }, {
    capture: syntheticCapture(input.implementationArtifactClosure),
    logger: () => {},
  });
  assert.equal(captureResult.manifest.selection.totalFrameCount, 2);
  assert.deepEqual(captureResult.manifest.selection.requirements[0].selectedPhysicalFrames, [1, 2]);

  const result = await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot,
    allowPartial: true,
  });
  assert.equal(result.strictAcceptanceChanged, false);
  assert.equal(result.capturedFrameCount, 2);
  const manifest = JSON.parse(await readFile(path.join(input.workspace, "migration.json"), "utf8"));
  const coverage = JSON.parse(await readFile(path.join(input.workspace, "evidence", "full-frame-coverage.json"), "utf8"));
  assert.equal(manifest.status, "preserved");
  assert.deepEqual(manifest.acceptance.humanVisualReview, input.manifest.acceptance.humanVisualReview);
  assert.deepEqual(manifest.acceptance.ownerReview, input.manifest.acceptance.ownerReview);
  assert.equal(manifest.acceptance.knownExceptions[0].reason, "must stay unchanged");
  const canonicalEnglish = coverage.requirements[0];
  const supplemental = coverage.requirements[2];
  assert.equal(canonicalEnglish.status, "blocked");
  assert.equal(canonicalEnglish.capturedFrameCount, 0);
  assert.deepEqual(canonicalEnglish.missingFrames, [1, 2, 3]);
  assert.equal(canonicalEnglish.metricsFile, "baseline-metrics-stays-unmodified.json");
  assert.equal(canonicalEnglish.metricsSha256, "a".repeat(64));
  assert.equal(supplemental.status, "blocked");
  assert.equal(supplemental.baselineAuthority, "unresolved");
  assert.equal(supplemental.capturedFrameCount, 2);
  assert.deepEqual(supplemental.missingFrames, []);
  assert.equal(supplemental.metricsFile, "");
  assert.equal(supplemental.metricsSha256, "");
  assert.equal(supplemental.strictAcceptanceEffect, "none");

  const candidate = manifest.evidence.candidateCaptureManifests.find(
    ({requirementId}) => requirementId === input.supplemental.requirementId,
  );
  assert.equal(candidate.requirementSchemaVersion, 2);
  assert.equal(candidate.coverageRole, "partial-path");
  assert.equal(candidate.coverageGroupId, input.supplemental.coverageGroupId);
  assert.equal(candidate.selectionSha256, input.supplemental.selectionSha256);
  assert.deepEqual(candidate.selectedPhysicalFrames, [1, 2]);
  assert.equal(candidate.strictAcceptanceEffect, "none");
  assert.match(candidate.orchestration.path, /capture-orchestration\.json$/);

  const adoption = JSON.parse(await readFile(
    path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json"),
    "utf8",
  ));
  assert.equal(adoption.schemaVersion, 2);
  assert.equal(adoption.strictAcceptanceEffect, "none");
  assert.equal(adoption.captureOrchestration.sha256, captureResult.manifestDescriptor.sha256);
  assert.equal(adoption.currentJavascriptPhysicalFrameAggregate.strictAcceptanceEffect, "none");
  assert.equal(adoption.currentJavascriptPhysicalFrameAggregate.groups.length, 1);
  const aggregate = adoption.currentJavascriptPhysicalFrameAggregate.groups[0];
  assert.equal(aggregate.coverageGroupId, input.supplemental.coverageGroupId);
  assert.deepEqual(aggregate.coveredFrames, [1, 2]);
  assert.deepEqual(aggregate.missingFrames, [3]);
  assert.equal(aggregate.status, "incomplete");
  assert.equal(adoption.summary.currentJavascriptPhysicalCoveredFrameCount, 2);
  assert.equal(adoption.summary.currentJavascriptPhysicalMissingFrameCount, 1);
  await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot,
    allowPartial: true,
    check: true,
  });
});

test("sequential partial adoptions cumulatively retain and revalidate prior schema-v4 requirements", async (t) => {
  const input = await partialPipelineFixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const coveragePath = path.join(input.workspace, "evidence", "full-frame-coverage.json");
  const adoptionPath = path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json");
  const first = await capturePartialFixtureRequirements(
    input,
    "sequential-partial-first",
    [input.supplemental.requirementId],
  );
  await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot: first.captureRoot,
    allowPartial: true,
  });
  const coverageAfterFirst = JSON.parse(await readFile(coveragePath, "utf8"));
  const supplementalAfterFirst = coverageAfterFirst.requirements.find(
    ({requirementId}) => requirementId === input.supplemental.requirementId,
  );
  const retainedPath = supplementalAfterFirst.captureManifest;
  const retainedSha256 = supplementalAfterFirst.captureManifestSha256;

  const canonicalEnglishId = input.coverage.requirements[0].requirementId;
  const second = await capturePartialFixtureRequirements(
    input,
    "sequential-partial-second",
    [canonicalEnglishId],
  );
  const result = await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot: second.captureRoot,
    allowPartial: true,
  });
  assert.equal(result.requirementCount, 2);
  assert.equal(result.capturedFrameCount, 5);
  assert.equal(result.missingRequirementCount, 1);

  const coverageAfterSecond = JSON.parse(await readFile(coveragePath, "utf8"));
  const canonicalAfterSecond = coverageAfterSecond.requirements.find(
    ({requirementId}) => requirementId === canonicalEnglishId,
  );
  const supplementalAfterSecond = coverageAfterSecond.requirements.find(
    ({requirementId}) => requirementId === input.supplemental.requirementId,
  );
  assert.equal(canonicalAfterSecond.capturedFrameCount, 3);
  assert.equal(supplementalAfterSecond.capturedFrameCount, 2);
  assert.equal(supplementalAfterSecond.captureManifest, retainedPath);
  assert.equal(supplementalAfterSecond.captureManifestSha256, retainedSha256);

  const adoption = JSON.parse(await readFile(adoptionPath, "utf8"));
  assert.equal(adoption.requirements.length, 2);
  assert.equal(adoption.summary.capturedFrameCount, 5);
  assert.deepEqual(
    adoption.requirements.map(({requirementId}) => requirementId).sort(),
    [canonicalEnglishId, input.supplemental.requirementId].sort(),
  );
  assert.equal(
    adoption.requirements.find(({requirementId}) => requirementId === input.supplemental.requirementId)
      .captureManifest.path,
    retainedPath,
  );
  await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot: second.captureRoot,
    allowPartial: true,
    check: true,
  });
});

test("stale or missing retained captures fail before every adoption write", async (t) => {
  async function prepared(suffix) {
    const input = await partialPipelineFixture();
    const first = await capturePartialFixtureRequirements(
      input,
      `${suffix}-first`,
      [input.supplemental.requirementId],
    );
    await adoptCourseImplementationCaptures({
      projectRoot: input.projectRoot,
      id: input.id,
      captureRoot: first.captureRoot,
      allowPartial: true,
    });
    const second = await capturePartialFixtureRequirements(
      input,
      `${suffix}-second`,
      [input.coverage.requirements[0].requirementId],
    );
    const retainedDirectory = path.join(
      first.captureRoot,
      `req-root-root-standalone-en-partial-frames-1-2`,
    );
    const trackedPaths = [
      path.join(input.workspace, "migration.json"),
      path.join(input.workspace, "evidence", "full-frame-coverage.json"),
      path.join(input.workspace, "keyframes.csv"),
      path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json"),
    ];
    return {input, second, retainedDirectory, trackedPaths};
  }

  await t.test("retained PNG hash drift", async (subtest) => {
    const fixtureInput = await prepared("retained-stale");
    subtest.after(() => rm(fixtureInput.input.projectRoot, {recursive: true, force: true}));
    const before = await Promise.all(fixtureInput.trackedPaths.map((candidate) => readFile(candidate)));
    await writeFile(path.join(fixtureInput.retainedDirectory, "frame-001.png"), Buffer.from("corrupt retained PNG"));
    await assert.rejects(
      adoptCourseImplementationCaptures({
        projectRoot: fixtureInput.input.projectRoot,
        id: fixtureInput.input.id,
        captureRoot: fixtureInput.second.captureRoot,
        allowPartial: true,
      }),
      /PNG SHA-256 differs/,
    );
    assert.deepEqual(
      await Promise.all(fixtureInput.trackedPaths.map((candidate) => readFile(candidate))),
      before,
    );
  });

  await t.test("retained manifest missing", async (subtest) => {
    const fixtureInput = await prepared("retained-missing");
    subtest.after(() => rm(fixtureInput.input.projectRoot, {recursive: true, force: true}));
    const before = await Promise.all(fixtureInput.trackedPaths.map((candidate) => readFile(candidate)));
    await rm(path.join(fixtureInput.retainedDirectory, "capture-manifest.json"));
    await assert.rejects(
      adoptCourseImplementationCaptures({
        projectRoot: fixtureInput.input.projectRoot,
        id: fixtureInput.input.id,
        captureRoot: fixtureInput.second.captureRoot,
        allowPartial: true,
      }),
      /retained capture .* is missing or unreadable/,
    );
    assert.deepEqual(
      await Promise.all(fixtureInput.trackedPaths.map((candidate) => readFile(candidate))),
      before,
    );
  });
});

test("a fresh capture overrides the same retained requirement without consulting stale superseded bytes", async (t) => {
  const input = await partialPipelineFixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const first = await capturePartialFixtureRequirements(
    input,
    "override-retained-first",
    [input.supplemental.requirementId],
  );
  await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot: first.captureRoot,
    allowPartial: true,
  });
  const replacement = await capturePartialFixtureRequirements(
    input,
    "override-retained-replacement",
    [input.supplemental.requirementId],
  );
  await writeFile(
    path.join(first.captureRoot, "req-root-root-standalone-en-partial-frames-1-2", "frame-001.png"),
    Buffer.from("superseded bytes may be stale"),
  );
  const result = await adoptCourseImplementationCaptures({
    projectRoot: input.projectRoot,
    id: input.id,
    captureRoot: replacement.captureRoot,
    allowPartial: true,
  });
  assert.equal(result.requirementCount, 1);
  assert.equal(result.capturedFrameCount, 2);
  const coverage = JSON.parse(await readFile(
    path.join(input.workspace, "evidence", "full-frame-coverage.json"),
    "utf8",
  ));
  const supplemental = coverage.requirements.find(
    ({requirementId}) => requirementId === input.supplemental.requirementId,
  );
  assert.match(supplemental.captureManifest, /override-retained-replacement/);
});

test("schema-v2 supplemental adoption rejects missing, extra, or stale capture orchestration", async (t) => {
  async function capturedFixture(suffix) {
    const input = await partialPipelineFixture();
    const captureRoot = path.join(input.projectRoot, "output", "playwright", suffix);
    await captureCoverageV2Requirements({
      id: input.id,
      projectRoot: input.projectRoot,
      baseUrl: "http://localhost:3213",
      outputRoot: `output/playwright/${suffix}`,
      requirements: [input.supplemental.requirementId],
      check: false,
    }, {
      capture: syntheticCapture(input.implementationArtifactClosure),
      logger: () => {},
    });
    return {...input, captureRoot};
  }

  await t.test("missing orchestration", async (subtest) => {
    const input = await capturedFixture("missing-orchestration");
    subtest.after(() => rm(input.projectRoot, {recursive: true, force: true}));
    await rm(path.join(input.captureRoot, "capture-orchestration.json"));
    await assert.rejects(
      adoptCourseImplementationCaptures({...input, allowPartial: true}),
      /requires exactly one complete capture-orchestration\.json/,
    );
  });

  await t.test("extra orchestration", async (subtest) => {
    const input = await capturedFixture("extra-orchestration");
    subtest.after(() => rm(input.projectRoot, {recursive: true, force: true}));
    const orchestration = await readFile(path.join(input.captureRoot, "capture-orchestration.json"));
    await mkdir(path.join(input.captureRoot, "extra"), {recursive: true});
    await writeFile(path.join(input.captureRoot, "extra", "capture-orchestration.json"), orchestration);
    await assert.rejects(
      adoptCourseImplementationCaptures({...input, allowPartial: true}),
      /requires exactly one complete capture-orchestration\.json/,
    );
  });

  await t.test("stale normalized selection", async (subtest) => {
    const input = await capturedFixture("stale-orchestration");
    subtest.after(() => rm(input.projectRoot, {recursive: true, force: true}));
    const orchestrationPath = path.join(input.captureRoot, "capture-orchestration.json");
    const orchestration = JSON.parse(await readFile(orchestrationPath, "utf8"));
    orchestration.selection.requirements[0].selectionSha256 = "0".repeat(64);
    await writeJson(orchestrationPath, orchestration);
    await assert.rejects(
      adoptCourseImplementationCaptures({...input, allowPartial: true}),
      /selection\.requirements differs from the normalized requirement selection/,
    );
  });
});

test("fails closed when a capture reports an unexpected request", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const capturePath = path.join(input.captureRoot, "req-root", "capture-manifest.json");
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  capture.unexpectedRequests.push("https://example.invalid/");
  await writeJson(capturePath, capture);
  await assert.rejects(adoptCourseImplementationCaptures(input), /unexpectedRequests must be an empty array/);
});

test("fails closed when a schema-v4 capture lacks complete data-flash context identity", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const capturePath = path.join(input.captureRoot, "req-root", "capture-manifest.json");
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  capture.captured[0].visualTarget.flashContextIdentityComplete = false;
  await writeJson(capturePath, capture);
  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    /does not bind an exact ready visual target/,
  );
});

test("treats legacy schema-v3 implementation captures as prereview-only", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const capturePath = path.join(input.captureRoot, "req-root", "capture-manifest.json");
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  capture.schemaVersion = 3;
  delete capture.implementationArtifactClosure;
  await writeJson(capturePath, capture);
  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    /schemaVersion 3 captures are prereview-only/,
  );
});

test("rejects schema-v4 capture generator provenance with a missing or non-exact shape", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const capturePath = path.join(input.captureRoot, "req-root", "capture-manifest.json");
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  delete capture.generatorProvenance.browser.version;
  capture.generatorProvenance.unreviewed = true;
  await writeJson(capturePath, capture);
  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    /capture generator provenance is invalid/,
  );
});

test("rejects a schema-v4 capture after its direct renderer module changes", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  await writeFile(path.join(input.workspace, "renderer.ts"), "export const frame = 2;\n");
  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    /implementation artifact closure is missing or stale/,
  );
});

test("rejects a non-loopback capture origin even when the frame hashes are valid", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const capturePath = path.join(input.captureRoot, "req-root", "capture-manifest.json");
  const capture = JSON.parse(await readFile(capturePath, "utf8"));
  capture.sourceUrl = "https://example.test/animations/course-fixture";
  await writeJson(capturePath, capture);
  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    /sourceUrl must be an unambiguous credential-free loopback http URL/,
  );
});

test("explicit partial mode updates only present captures and leaves omitted requirements blocked", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const coveragePath = path.join(input.workspace, "evidence", "full-frame-coverage.json");
  const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  const omittedEntryState = {
    kind: "original-root-frame-accurate-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario: "root-standalone",
    language: "es",
    seed: "0",
  };
  coverage.requirements.push({
    ...structuredClone(coverage.requirements[0]),
    requirementId: "req:root:root-standalone:es",
    traceId: "trace:root:root-standalone:es:seed-0",
    language: "es",
    entryState: omittedEntryState,
    entryStateSha256: sha256Text(canonicalJson(omittedEntryState)),
    capturedFrameCount: 0,
    missingFrames: [1],
    captureManifest: "",
    captureManifestSha256: "",
  });
  await writeJson(coveragePath, coverage);
  const migrationPath = path.join(input.workspace, "migration.json");
  const migration = JSON.parse(await readFile(migrationPath, "utf8"));
  migration.evidence.candidateCaptureManifests = [{
    requirementId: "req:root:root-standalone:es",
    frameDomainId: "root",
    traceId: "trace:root:root-standalone:es:seed-0",
    entryStateSha256: sha256Text(canonicalJson(omittedEntryState)),
    scenario: "root-standalone",
    language: "es",
    seed: "0",
    path: "output/captures/prior-es/capture-manifest.json",
    sha256: "f".repeat(64),
    frames: 1,
    authority: "non-authoritative-current-javascript-output",
    strictAcceptanceEffect: "implementation-capture-only",
  }];
  await writeJson(migrationPath, migration);

  const result = await adoptCourseImplementationCaptures({...input, allowPartial: true});
  assert.equal(result.requirementCount, 1);
  assert.equal(result.declaredRequirementCount, 2);
  assert.equal(result.missingRequirementCount, 1);
  const updated = JSON.parse(await readFile(coveragePath, "utf8"));
  assert.equal(updated.requirements[0].capturedFrameCount, 1);
  assert.deepEqual(updated.requirements[0].missingFrames, []);
  assert.equal(updated.requirements[1].status, "blocked");
  assert.equal(updated.requirements[1].capturedFrameCount, 0);
  assert.deepEqual(updated.requirements[1].missingFrames, [1]);
  const updatedMigration = JSON.parse(await readFile(migrationPath, "utf8"));
  const retained = updatedMigration.evidence.candidateCaptureManifests.find(
    ({requirementId}) => requirementId === "req:root:root-standalone:es",
  );
  assert.equal(retained.path, "output/captures/prior-es/capture-manifest.json");
  assert.equal(retained.sha256, "f".repeat(64));
  const adoption = JSON.parse(
    await readFile(
      path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json"),
      "utf8",
    ),
  );
  assert.equal(adoption.status, "partial-non-authoritative-implementation-capture");
  assert.equal(adoption.summary.declaredRequirementCount, 2);
  assert.equal(adoption.summary.missingRequirementCount, 1);
  assert.deepEqual(adoption.summary.missingRequirementIds, ["req:root:root-standalone:es"]);
  assert.equal(adoption.summary.missingFrameCount, 1);
  await adoptCourseImplementationCaptures({...input, allowPartial: true, check: true});
});

test("fails closed when any declared requirement has a non-canonical entry-state hash", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const coveragePath = path.join(input.workspace, "evidence", "full-frame-coverage.json");
  const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  coverage.requirements.push({
    ...structuredClone(coverage.requirements[0]),
    requirementId: "req:root:root-standalone:es",
    language: "es",
    entryState: {...coverage.requirements[0].entryState, language: "es"},
    entryStateSha256: "0".repeat(64),
  });
  await writeJson(coveragePath, coverage);
  await assert.rejects(
    adoptCourseImplementationCaptures({...input, allowPartial: true}),
    /entryStateSha256 does not match the canonical entryState/,
  );
});

test("write mode refuses before any write when a proposed evidence artifact is bound by accepted schema-v3 approval", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const approved = await bindAcceptedSchemaV3AdoptionArtifact(input);
  const trackedPaths = [
    approved.manifestPath,
    path.join(input.workspace, "evidence", "full-frame-coverage.json"),
    path.join(input.workspace, "keyframes.csv"),
    approved.adoptionPath,
    approved.reportPath,
  ];
  const before = await Promise.all(trackedPaths.map((candidate) => readFile(candidate)));

  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    (error) => {
      assert.match(error.message, /currently hash-bound by accepted schema-v3 current-JavaScript approval/);
      assert.match(error.message, /current-javascript-implementation-capture-adoption\.json/);
      assert.match(error.message, /Refusing before any writes/);
      assert.match(error.message, /--invalidate-current-js-approval/);
      assert.match(error.message, /does not edit or renew the approval report/);
      return true;
    },
  );
  const after = await Promise.all(trackedPaths.map((candidate) => readFile(candidate)));
  assert.deepEqual(after, before);

  await assert.rejects(
    adoptCourseImplementationCaptures({...input, check: true}),
    /implementation capture adoption is stale/,
  );
  assert.deepEqual(await Promise.all(trackedPaths.map((candidate) => readFile(candidate))), before);
});

test("explicit invalidation authorization requires reason and ISO time, changes evidence only, and never rewrites or renews approval", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const approved = await bindAcceptedSchemaV3AdoptionArtifact(input);
  const reportBefore = await readFile(approved.reportPath);
  const manifestBefore = await readFile(approved.manifestPath);
  const adoptionBefore = await readFile(approved.adoptionPath);

  await assert.rejects(
    adoptCourseImplementationCaptures({...input, invalidateCurrentJsApproval: true}),
    /--invalidation-reason must be a non-empty string/,
  );
  await assert.rejects(
    adoptCourseImplementationCaptures({
      ...input,
      invalidateCurrentJsApproval: true,
      invalidationReason: "Refresh the non-authoritative generator receipt without claiming renewed approval.",
      invalidatedAt: "2026-07-23 13:30:00",
    }),
    /--invalidated-at must be a valid ISO timestamp with an explicit timezone/,
  );
  await assert.rejects(
    adoptCourseImplementationCaptures({
      ...input,
      invalidateCurrentJsApproval: true,
      invalidationReason: "Refresh the non-authoritative generator receipt without claiming renewed approval.",
      invalidatedAt: "2026-02-30T13:30:00+08:00",
    }),
    /--invalidated-at must be a valid ISO timestamp with an explicit timezone/,
  );
  assert.deepEqual(await readFile(approved.reportPath), reportBefore);
  assert.deepEqual(await readFile(approved.manifestPath), manifestBefore);
  assert.deepEqual(await readFile(approved.adoptionPath), adoptionBefore);

  const invalidationReason = "Refresh the non-authoritative generator receipt without claiming renewed approval.";
  const invalidatedAt = "2026-07-23T13:30:00+08:00";
  const result = await adoptCourseImplementationCaptures({
    ...input,
    invalidateCurrentJsApproval: true,
    invalidationReason,
    invalidatedAt,
  });
  const impact = result.currentJavaScriptApprovalBinding;
  assert.equal(impact.acceptedSchemaV3Report, true);
  assert.equal(impact.reportSha256, approved.reportSha256);
  assert.equal(impact.artifactBindingSha256, approved.artifactBindingSha256);
  assert.equal(impact.changedBoundArtifacts.length, 1);
  assert.equal(impact.changedBoundArtifacts[0].approvedSha256, approved.approvedAdoptionSha256);
  assert.equal(impact.invalidationAuthorized, true);
  assert.equal(impact.invalidationReason, invalidationReason);
  assert.equal(impact.invalidatedAt, invalidatedAt);
  assert.equal(impact.currentBindingWillBeStale, true);
  assert.equal(impact.approvalReportChanged, false);
  assert.equal(impact.approvalRenewed, false);

  assert.deepEqual(await readFile(approved.reportPath), reportBefore);
  const reportAfter = JSON.parse(await readFile(approved.reportPath, "utf8"));
  assert.equal(reportAfter.decision, "accepted");
  assert.equal(reportAfter.animations[0].artifacts[0].sha256, approved.approvedAdoptionSha256);
  const adoptionAfter = await readFile(approved.adoptionPath);
  assert.notEqual(digest(adoptionAfter), approved.approvedAdoptionSha256);
  const manifestAfter = JSON.parse(await readFile(approved.manifestPath, "utf8"));
  assert.equal(manifestAfter.acceptance.currentJavaScriptOutputApproval.decision, "accepted");
  assert.equal(manifestAfter.acceptance.currentJavaScriptOutputApproval.approvalRecordSha256, approved.reportSha256);
  assert.equal(manifestAfter.acceptance.currentJavaScriptOutputApproval.artifactBindingSha256, approved.artifactBindingSha256);
  assert.equal(
    manifestAfter.evidence.currentJavaScriptImplementationCaptureAdoption.sha256,
    digest(adoptionAfter),
  );
  assert.notEqual(
    reportAfter.animations[0].artifacts[0].sha256,
    manifestAfter.evidence.currentJavaScriptImplementationCaptureAdoption.sha256,
  );
  await adoptCourseImplementationCaptures({...input, check: true});
});

test("multi-file adoption rolls back all target bytes when a commit step fails", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  await adoptCourseImplementationCaptures(input);

  const capturePath = path.join(input.captureRoot, "req-root", "capture-manifest.json");
  const captureText = await readFile(capturePath, "utf8");
  await writeFile(capturePath, `${captureText}\n`);
  const trackedPaths = [
    path.join(input.workspace, "migration.json"),
    path.join(input.workspace, "evidence", "full-frame-coverage.json"),
    path.join(input.workspace, "keyframes.csv"),
    path.join(input.workspace, "evidence", "current-javascript-implementation-capture-adoption.json"),
  ];
  const before = await Promise.all(trackedPaths.map((candidate) => readFile(candidate)));

  await assert.rejects(
    adoptCourseImplementationCaptures(input, {
      writeTransactionHooks: {
        beforeCommitEntry(_entry, index) {
          if (index === 2) throw new Error("fixture mid-commit failure");
        },
      },
    }),
    /fixture mid-commit failure/,
  );
  assert.deepEqual(await Promise.all(trackedPaths.map((candidate) => readFile(candidate))), before);
});

test("rejects path traversal IDs and symbolic-link migration workspaces before evidence reads", async (t) => {
  const input = await fixture();
  const externalRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-adopt-external-"));
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  t.after(() => rm(externalRoot, {recursive: true, force: true}));

  await assert.rejects(
    adoptCourseImplementationCaptures({...input, id: "../outside"}),
    /path-safe animation ID/,
  );

  const externalWorkspace = path.join(externalRoot, input.id);
  await rename(input.workspace, externalWorkspace);
  await symlink(externalWorkspace, input.workspace);
  await assert.rejects(
    adoptCourseImplementationCaptures(input),
    /migration workspace must not be a symbolic link/,
  );
});

test("parses the explicit fail-closed CLI", () => {
  const options = parseArguments(["--id", "course-id", "--capture-root", "output/captures", "--allow-partial", "--check", "--json"]);
  assert.equal(options.id, "course-id");
  assert.equal(options.captureRoot, "output/captures");
  assert.equal(options.allowPartial, true);
  assert.equal(options.check, true);
  assert.equal(options.json, true);

  const invalidation = parseArguments([
    "--id",
    "course-id",
    "--capture-root",
    "output/captures",
    "--invalidate-current-js-approval",
    "--invalidation-reason",
    "The accepted evidence artifact must be refreshed without claiming renewed approval.",
    "--invalidated-at",
    "2026-07-23T13:30:00+08:00",
  ]);
  assert.equal(invalidation.invalidateCurrentJsApproval, true);
  assert.equal(invalidation.invalidationReason, "The accepted evidence artifact must be refreshed without claiming renewed approval.");
  assert.equal(invalidation.invalidatedAt, "2026-07-23T13:30:00+08:00");
  assert.throws(
    () => parseArguments([
      "--id",
      "course-id",
      "--capture-root",
      "output/captures",
      "--check",
      "--invalidate-current-js-approval",
      "--invalidation-reason",
      "Invalidation must never be performed by check mode.",
      "--invalidated-at",
      "2026-07-23T13:30:00+08:00",
    ]),
    /forbidden with --check/,
  );
  assert.throws(
    () => parseArguments(["--id", "../outside", "--capture-root", "output/captures"]),
    /path-safe animation ID/,
  );
});
