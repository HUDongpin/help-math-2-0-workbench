import assert from "node:assert/strict";
import test from "node:test";

import {
  FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION,
  canonicalProjectionJson,
  fqAudioSourceStructureSha256,
  projectFqAudioSourceStructure,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";

test("canonical projection encoding follows JSON semantics for undefined object and array values", () => {
  assert.equal(canonicalProjectionJson({b: undefined, a: 1}), '{"a":1}');
  assert.equal(canonicalProjectionJson([1, undefined, 3]), "[1,null,3]");
});

function manifest() {
  return {
    schemaVersion: 2,
    id: "course-one",
    animationId: "course-one",
    assetId: `swf-${"a".repeat(64)}`,
    status: "validating",
    created: "2026-07-21",
    confidence: "medium",
    classification: { titleDisplay: "Lesson" },
    source: { swf: "source.swf", swfSha256: "a".repeat(64) },
    runtime: { fps: 12, frameCount: 10, stage: { width: 550, height: 400 } },
    audit: { networkCalls: [] },
    localization: { languages: ["en", "es"] },
    scenarios: [{ id: "default", kind: "linear", reachable: true }],
    audio: { required: false, reasonNotRequired: "source-bound no-audio proof", languages: [], inventoryFile: "audio-inventory.csv", cues: [], missingRequired: [], startSemantics: null },
    toolVersions: { ffdec: "22" },
    baseline: { authority: "undecided", route: "/reference/course-one", viewport: { width: 550, height: 400 } },
    implementation: { rendering: "svg", frameDomains: [{ id: "root", frameCount: 10 }] },
    evidence: { fullFrameCoverageFile: "evidence/full-frame-coverage.json" },
    fidelity: { staticFrameMaxNormalizedRmse: 0.05 },
    accessibility: { keyboardReplay: false },
    acceptance: { ownerReview: { decision: "pending" } },
    catalogEvidence: { migrationStatusImported: "preserved" },
  };
}

test("technical manifest projection is stable across signing/status receipts but changes on source/runtime/scenario/implementation facts", () => {
  const base = manifest();
  const expected = technicalManifestSha256(base);
  const signed = structuredClone(base);
  signed.status = "complete";
  signed.acceptance.ownerReview = { decision: "accepted", reviewer: "Owner", reviewedAt: "2026-07-22" };
  signed.accessibility.keyboardReplay = true;
  signed.baseline.authority = "original-runtime-frame-step";
  signed.toolVersions.ffdec = "23";
  signed.evidence.verificationFile = "evidence/verification.json";
  signed.audio.authoritativeListeningComplete = true;
  signed.audio.originalHostSynchronizationComplete = true;
  signed.audio.strictAcceptance = "accepted";
  signed.audio.structuralAuditComplete = true;
  assert.equal(technicalManifestSha256(signed), expected);

  for (const mutate of [
    (value) => { value.source.swfSha256 = "b".repeat(64); },
    (value) => { value.runtime.frameCount = 11; },
    (value) => { value.scenarios[0].kind = "interactive"; },
    (value) => { value.implementation.frameDomains[0].frameCount = 11; },
    (value) => { value.implementation.component = "components/ChangedRenderer.tsx"; },
    (value) => { value.audio.required = true; },
    (value) => { value.audio.reasonNotRequired = "different negative-proof rationale"; },
    (value) => { value.audio.languages = ["en", "es"]; },
    (value) => { value.audio.inventoryFile = "changed-audio.csv"; },
    (value) => { value.audio.cues = [{ id: "narration-en", language: "en", sha256: "d".repeat(64) }]; },
    (value) => { value.audio.missingRequired = [{ language: "es", sourceFile: "missing/spanish.mp3", status: "missing-source" }]; },
    (value) => { value.audio.startSemantics = { kind: "host-user-activated", childTimelineCue: false }; },
  ]) {
    const changed = structuredClone(base);
    mutate(changed);
    assert.notEqual(technicalManifestSha256(changed), expected);
  }
});

test("trace coverage projection ignores evidence adoption fields but binds exact trace identity", () => {
  const requirement = {
    requirementId: "req-root-en",
    scenario: "default",
    frameDomainId: "root",
    traceId: "trace-root-en",
    language: "en",
    seed: "0",
    requiredRange: { firstFrame: 1, lastFrame: 10 },
    entryState: { kind: "initial-load" },
    entryStateSha256: "c".repeat(64),
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    status: "blocked",
    baselineAuthority: "unresolved",
    blockingReason: "not executed",
  };
  const coverage = { schemaVersion: 2, animationId: "course-one", requirements: [requirement] };
  const expected = traceCoverageSha256(coverage);
  const complete = structuredClone(coverage);
  Object.assign(complete.requirements[0], {
    status: "complete",
    baselineAuthority: "original-runtime-frame-step",
    baselineCaptureManifest: "baseline.json",
    baselineCaptureManifestSha256: "d".repeat(64),
    captureManifest: "capture.json",
    captureManifestSha256: "e".repeat(64),
    metricsFile: "metrics.json",
    metricsSha256: "f".repeat(64),
    capturedFrameCount: 10,
    missingFrames: [],
  });
  delete complete.requirements[0].blockingReason;
  assert.equal(traceCoverageSha256(complete), expected);
  complete.requirements[0].traceId = "different-trace";
  assert.notEqual(traceCoverageSha256(complete), expected);
});

test("trace coverage projection binds supplemental selection schema, role, group, frames, hash, and strict-neutral scope", () => {
  const requirement = {
    requirementId: "req-root-en-partial",
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "coverage-group:root:default:en:seed-0",
    scenario: "default",
    frameDomainId: "root",
    traceId: "trace-root-en-partial",
    language: "en",
    seed: "0",
    requiredFrameSet: {frames: [1, 3, 5]},
    selectionSha256: "a".repeat(64),
    entryState: {kind: "initial-load", scenario: "default", language: "en", seed: "0"},
    entryStateSha256: "b".repeat(64),
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    strictAcceptanceEffect: "none",
  };
  const coverage = {schemaVersion: 2, animationId: "course-one", requirements: [requirement]};
  const expected = traceCoverageSha256(coverage);
  for (const mutate of [
    (value) => { value.requirementSchemaVersion = 1; },
    (value) => { value.coverageRole = "full-domain"; },
    (value) => { value.coverageGroupId = "coverage-group:other"; },
    (value) => { value.requiredFrameSet.frames = [1, 2, 5]; },
    (value) => { value.selectionSha256 = "c".repeat(64); },
    (value) => { value.strictAcceptanceEffect = "implementation-capture-only"; },
  ]) {
    const changed = structuredClone(requirement);
    mutate(changed);
    assert.notEqual(
      traceCoverageSha256({schemaVersion: 2, animationId: "course-one", requirements: [changed]}),
      expected,
    );
  }
});

test("scenario inventory projection ignores manifest/status receipts but binds audit structure and schedules", () => {
  const inventory = {
    schemaVersion: 1,
    animationId: "course-one",
    migrationStatusAtGeneration: "preserved",
    migrationStatusChanged: false,
    evidenceIndex: [
      { artifactId: "migration-manifest", path: "migration.json", sha256: "a".repeat(64) },
      { artifactId: "source-swf", path: "source.swf", sha256: "b".repeat(64) },
    ],
    timelineInventory: [{ timelineId: "root", frameCount: 10 }],
    coverage: { executableTraceSchedules: [] },
  };
  const expected = scenarioInventorySha256(inventory);
  const receiptOnly = structuredClone(inventory);
  receiptOnly.migrationStatusAtGeneration = "complete";
  receiptOnly.evidenceIndex[0].sha256 = "c".repeat(64);
  assert.equal(scenarioInventorySha256(receiptOnly), expected);
  receiptOnly.timelineInventory[0].frameCount = 11;
  assert.notEqual(scenarioInventorySha256(receiptOnly), expected);
});

function fqScenarioInventory() {
  return {
    schemaVersion: 1,
    animationId: "course-g03-l06-fq-002-review",
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authorityStatement: ["generated inventory"],
    source: {
      swf: "source-assets/fq.swf",
      swfSha256: "a".repeat(64),
      fla: null,
      stage: {width: 800, height: 600},
    },
    courseXml: {
      artifact: {artifactId: "course-xml", path: "source-assets/index.xml", sha256: "b".repeat(64)},
      parseMethod: "fixture parser",
      currentPlacement: {
        sourceRelativePath: "FQ/Review/L6FQ02.swf",
        matchStatus: "basename-only-conflict",
        exactPlacement: null,
        basenameMatches: [{path: "FQ/L6FQ02.swf", section: "FQ", attributes: {Title: "Page 1"}}],
      },
    },
    evidenceIndex: [
      {artifactId: "strict-readiness", path: "audit/strict-readiness.json", sha256: "c".repeat(64)},
      {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: "d".repeat(64)},
    ],
    timelineInventory: [{
      timelineId: "root",
      frameCount: 10,
    }, {
      timelineId: "sprite-1168",
      frameCount: 82,
      frameLabels: [{frame: 1, label: "FirstSection"}, {frame: 2, label: "Q1"}, {frame: 34, label: "Review"}],
      controlStates: [{
        frame: 2,
        reasons: ["event-handler:release", "frame-label:Q1"],
        evidence: [
          {artifactId: "swfmill-xml", timelineId: "sprite-1168"},
          {artifactId: "ffdec-scripts", script: "DefineSprite_1168/frame_2/A/CLIPACTIONRECORD on(release).as", lineStart: 10, lineEnd: 15},
        ],
      }],
      evidence: {artifactId: "swfmill-xml"},
    }],
    authoritativeRuntimeEvidence: [{status: "missing"}],
    staticExtraction: {indexedScriptBlockCount: 1},
    interactions: {handlers: []},
    dependencies: {bindings: []},
    coverage: {acceptanceObligationsFromReadiness: [{statement: "pending"}]},
    conflicts: [],
    unknowns: [{id: "pending"}],
    strictAcceptanceEffect: "none",
  };
}

test("FQ audio source-structure projection excludes readiness/generated receipts and binds every consumed source fact", () => {
  const base = fqScenarioInventory();
  const expected = fqAudioSourceStructureSha256(base);
  const projection = projectFqAudioSourceStructure(base);
  assert.equal(projection.projection, FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.id);
  assert.equal(Object.hasOwn(projection, "evidenceIndex"), false);
  assert.equal(Object.hasOwn(projection, "coverage"), false);
  assert.equal(Object.hasOwn(projection, "dependencies"), false);

  const generatedOnly = structuredClone(base);
  generatedOnly.inventoryStatus = "changed-generated-status";
  generatedOnly.migrationStatusChanged = true;
  generatedOnly.authorityStatement = ["changed"];
  generatedOnly.evidenceIndex[0].sha256 = "e".repeat(64);
  generatedOnly.authoritativeRuntimeEvidence = [{status: "complete"}];
  generatedOnly.staticExtraction.indexedScriptBlockCount = 999;
  generatedOnly.interactions.handlers.push({id: "generated"});
  generatedOnly.dependencies.bindings.push({binding: "generated"});
  generatedOnly.coverage.acceptanceObligationsFromReadiness[0].statement = "changed readiness";
  generatedOnly.conflicts.push({id: "generated"});
  generatedOnly.unknowns[0].id = "changed";
  generatedOnly.strictAcceptanceEffect = "changed";
  generatedOnly.source.stage.width = 123;
  generatedOnly.courseXml.parseMethod = "changed parser";
  generatedOnly.courseXml.currentPlacement.basenameMatches[0].attributes.Title = "Changed";
  generatedOnly.timelineInventory[1].frameLabels[0].label = "ChangedNonQuestionLabel";
  generatedOnly.timelineInventory[1].controlStates[0].reasons = ["changed"];
  generatedOnly.timelineInventory[1].controlStates[0].evidence[0].timelineId = "changed";
  generatedOnly.timelineInventory[1].evidence = {artifactId: "changed"};
  assert.equal(fqAudioSourceStructureSha256(generatedOnly), expected);

  const consumedMutations = [
    (value) => { value.schemaVersion = 2; },
    (value) => { value.animationId = "different"; },
    (value) => { value.source.swf = "source-assets/other.swf"; },
    (value) => { value.source.swfSha256 = "f".repeat(64); },
    (value) => { value.courseXml.artifact.path = "source-assets/other.xml"; },
    (value) => { value.courseXml.artifact.sha256 = "1".repeat(64); },
    (value) => { value.courseXml.currentPlacement.sourceRelativePath = "FQ/L6FQ02.swf"; },
    (value) => { value.courseXml.currentPlacement.matchStatus = "exact-active-page"; },
    (value) => { value.courseXml.currentPlacement.exactPlacement = {path: "FQ/L6FQ02.swf"}; },
    (value) => { value.courseXml.currentPlacement.basenameMatches[0].path = "FQ/other.swf"; },
    (value) => { value.timelineInventory[1].timelineId = "sprite-other"; },
    (value) => { value.timelineInventory[1].frameCount = 83; },
    (value) => { value.timelineInventory[1].frameLabels[1].frame = 3; },
    (value) => { value.timelineInventory[1].frameLabels[1].label = "Q2"; },
    (value) => { value.timelineInventory[1].frameLabels.push({frame: 33, label: "Q32"}); },
    (value) => { value.timelineInventory[1].controlStates[0].frame = 3; },
    (value) => { value.timelineInventory[1].controlStates[0].evidence[1].artifactId = "other"; },
    (value) => { value.timelineInventory[1].controlStates[0].evidence[1].script = "DefineSprite_1168/frame_2/B/CLIPACTIONRECORD on(release).as"; },
    (value) => { value.timelineInventory[1].controlStates[0].evidence[1].lineStart = 11; },
    (value) => { value.timelineInventory[1].controlStates[0].evidence[1].lineEnd = 16; },
  ];
  for (const mutate of consumedMutations) {
    const changed = structuredClone(base);
    mutate(changed);
    assert.notEqual(fqAudioSourceStructureSha256(changed), expected);
  }
});
