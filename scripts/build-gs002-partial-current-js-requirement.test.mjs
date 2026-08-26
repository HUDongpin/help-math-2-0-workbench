import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {projectionSha256} from "./evidence-projections.mjs";
import {
  GS002_ANIMATION_ID,
  GS002_CANONICAL_REQUIREMENT_ID,
  GS002_COVERAGE_GROUP_ID,
  GS002_FRAME_COUNT,
  GS002_INVENTORY_ASSET_ID,
  GS002_SUPPLEMENTAL_REQUIREMENT_ID,
  buildGs002SupplementalRequirement,
  deriveGs002PartialRequirementOutputs,
  preserveLegalSupplementalRequirements,
  validateGs002SupplementalRequirement,
} from "./build-gs002-partial-current-js-requirement.mjs";

const INVENTORY_HEADER =
  "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,dimensions_or_bounds,font_glyphs,transformation,confidence,license_or_provenance,notes";

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalRequirement() {
  const entryState = {
    kind: "natural-root-placement-entry",
    rootTimelineId: "root",
    rootEntryFrame: 6,
    instanceId: "main-animation",
    frameDomainId: "sprite-787",
    localEntryFrame: 1,
    scenario: "source-drawing-lead-in",
    language: "en",
    seed: "0",
  };
  return {
    requirementId: GS002_CANONICAL_REQUIREMENT_ID,
    scenario: "source-drawing-lead-in",
    frameDomainId: "sprite-787",
    traceId: "trace:sprite-787:source-drawing-lead-in:en:seed-0",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 653},
    entryState,
    entryStateSha256: projectionSha256(entryState),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason: "canonical remains blocked",
    blockingEvidence: [{file: "audit/scenario-inventory.json", sha256: "a".repeat(64)}],
    capturedFrameCount: 0,
    missingFrames: Array.from({length: 653}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  };
}

function fixture() {
  const sourceSwfBytes = Buffer.from("GS002 fixture SWF bytes");
  const swfSha256 = hash(sourceSwfBytes);
  const canonical = canonicalRequirement();
  const manifest = {
    animationId: GS002_ANIMATION_ID,
    source: {
      swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf",
      swfSha256,
    },
    runtime: {frameCount: 10, fps: 12},
    implementation: {
      frameDomains: [{id: "root", frameCount: 10}, {id: "sprite-787", frameCount: 653}],
    },
  };
  return {
    manifest,
    coverage: {
      schemaVersion: 2,
      animationId: GS002_ANIMATION_ID,
      requirements: [canonical],
    },
    scenarioInventory: {
      animationId: GS002_ANIMATION_ID,
      source: {swfSha256},
      timelineInventory: [{timelineId: "sprite-787", frameCount: 653}],
    },
    canvasSpec: {
      animationId: GS002_ANIMATION_ID,
      source: {swfSha256},
      runtimeContract: {
        supportedLanguages: ["en"],
        unresolved: ["Frames 1 through 641 are source drawings; frames 642 through 653 require AVM1."],
      },
    },
    canvasManifest: {
      animationId: GS002_ANIMATION_ID,
      timeline: {
        deterministicContentTimeline: {frameCount: 653},
        supportedLanguages: ["en"],
      },
      strictAcceptanceEffect: "none",
      unresolved: ["Frames 1 through 641 are source drawings; frames 642 through 653 require AVM1."],
    },
    rendererAudit: {
      animationId: GS002_ANIMATION_ID,
      strictAcceptanceEffect: "none; fixture",
      probes: [
        {
          request: {frameDomain: "sprite-787", scenario: "source-drawing-lead-in", language: "en", frame: 1},
          outcome: "renderable-exact",
        },
        {
          request: {frameDomain: "sprite-787", scenario: "source-drawing-lead-in", language: "en", frame: 653},
          outcome: "blocked-not-renderable",
          actual: {blocker: "question-final-avm1-state-unresolved"},
        },
      ],
    },
    timelineText: [
      "staticDrawingReadyEndFrame: 641,",
      "gameBeginStopFrame: 642,",
      "if (frame > COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame) {}",
    ].join("\n"),
    moduleText: "playbackEndFrameByDomain: { 'sprite-787': COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame }",
    testText: [
      "assert.equal(COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame, 641);",
      "assert.equal(animationModule.playbackEndFrame, 641);",
      "for (const frame of [642, 643, 644, 652, 653]) {}",
    ].join("\n"),
    sourceSwfBytes,
    inputDescriptors: [{file: "fixture", sha256: "c".repeat(64)}],
    scriptSha256: "d".repeat(64),
    briefText: "# GS002\n",
    inventoryText: `${INVENTORY_HEADER}\n`,
  };
}

test("factory creates one exact schema-v2 partial path without weakening canonical authority", () => {
  const canonical = canonicalRequirement();
  const supplemental = buildGs002SupplementalRequirement(canonical);

  assert.equal(supplemental.requirementSchemaVersion, 2);
  assert.equal(supplemental.coverageRole, "partial-path");
  assert.equal(supplemental.coverageGroupId, GS002_COVERAGE_GROUP_ID);
  assert.equal(supplemental.requirementId, GS002_SUPPLEMENTAL_REQUIREMENT_ID);
  assert.notEqual(supplemental.requirementId, canonical.requirementId);
  assert.notEqual(supplemental.traceId, canonical.traceId);
  for (const field of ["frameDomainId", "scenario", "language", "seed", "entryState", "entryStateSha256"]) {
    assert.deepEqual(supplemental[field], canonical[field], field);
  }
  assert.deepEqual(supplemental.requiredRange, {firstFrame: 1, lastFrame: 641});
  assert.match(supplemental.selectionSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(supplemental.unresolvedFrames, {
    firstFrame: 642,
    lastFrame: 653,
    status: "unresolved",
    reason: supplemental.unresolvedFrames.reason,
  });
  assert.equal(supplemental.strictAcceptanceEffect, "none");
  assert.deepEqual(supplemental.authority, {
    currentJavascriptImplementationCaptureOnly: true,
    originalRuntimeBaseline: false,
    rmseAcceptance: false,
    humanVisualReview: false,
    ownerAcceptance: false,
    strictAcceptance: false,
  });
  assert.equal(supplemental.status, "blocked");
  assert.equal(supplemental.baselineAuthority, "unresolved");
  assert.equal(supplemental.metricsFile, "");
});

test("derivation appends the supplemental row while leaving every canonical row byte-equivalent", () => {
  const input = fixture();
  const canonicalBefore = structuredClone(input.coverage.requirements);
  const output = deriveGs002PartialRequirementOutputs(input);

  assert.deepEqual(output.coverage.requirements.slice(0, -1), canonicalBefore);
  assert.equal(output.coverage.requirements.length, 2);
  assert.equal(output.summary.canonicalRequirementCount, 1);
  assert.equal(output.summary.supplementalRequirementCount, 1);
  assert.equal(output.summary.selectedFrameCount, 641);
  assert.equal(output.summary.unresolvedFrameCount, 12);
  assert.equal(output.summary.pngCapturePerformed, false);
  assert.equal(output.report.authority.originalRuntimeBaseline, false);
  assert.equal(output.report.authority.rmseAcceptance, false);
  assert.equal(output.report.authority.humanVisualReview, false);
  assert.equal(output.report.authority.ownerAcceptance, false);
  assert.equal(output.report.authority.strictAcceptance, false);
  assert.equal(output.report.canonicalStrictDenominatorChanged, false);
  assert.equal(output.report.keyframeMappingEligible, false);
  assert.equal(output.report.pngCapturePerformedByGenerator, false);
  assert.match(output.briefText, /canonical 1–653 source-drawing requirement remains separate, unchanged, blocked/);
  assert.match(output.inventoryText, new RegExp(`^${GS002_INVENTORY_ASSET_ID},`, "m"));
  assert.match(output.reportSha256, /^[a-f0-9]{64}$/);
});

test("only adopted current-JavaScript capture bookkeeping may survive regeneration", () => {
  const canonical = canonicalRequirement();
  const supplemental = buildGs002SupplementalRequirement(canonical);
  supplemental.blockingEvidence.push({
    file: "output/playwright/gs002-partial-v1/capture-manifest.json",
    sha256: "f".repeat(64),
  });
  supplemental.capturedFrameCount = 641;
  supplemental.missingFrames = [];
  supplemental.captureManifest = "output/playwright/gs002-partial/capture-manifest.json";
  supplemental.captureManifestSha256 = "e".repeat(64);
  supplemental.blockingReason = "Complete implementation frames captured; baseline and RMSE remain unresolved.";
  supplemental.blockingEvidence.push({
    file: supplemental.captureManifest,
    sha256: supplemental.captureManifestSha256,
  });

  assert.deepEqual(validateGs002SupplementalRequirement(supplemental, canonical), supplemental);
  assert.deepEqual(
    preserveLegalSupplementalRequirements({
      animationId: GS002_ANIMATION_ID,
      existingRequirements: [canonical, supplemental],
      canonicalRequirements: [canonical],
    }),
    [supplemental],
  );

  const forged = structuredClone(supplemental);
  forged.coverageGroupId = "forged";
  assert.throws(
    () => validateGs002SupplementalRequirement(forged, canonical),
    /forged, stale, or conflicting/,
  );

  const extraField = {...supplemental, ownerOverride: true};
  assert.throws(
    () => validateGs002SupplementalRequirement(extraField, canonical),
    /unexpected field set/,
  );

  const duplicateHistory = structuredClone(supplemental);
  duplicateHistory.blockingEvidence.splice(
    -1,
    0,
    structuredClone(duplicateHistory.blockingEvidence[1]),
  );
  assert.throws(
    () => validateGs002SupplementalRequirement(duplicateHistory, canonical),
    /paths must be unique/,
  );

  const forgedHistory = structuredClone(supplemental);
  forgedHistory.blockingEvidence[1].file = "migrations/forged.json";
  assert.throws(
    () => validateGs002SupplementalRequirement(forgedHistory, canonical),
    /must reference an output\/playwright capture manifest/,
  );
});

test("supplemental preservation rejects unknown, duplicate, and non-GS rows", () => {
  const canonical = canonicalRequirement();
  const supplemental = buildGs002SupplementalRequirement(canonical);
  assert.throws(
    () => preserveLegalSupplementalRequirements({
      animationId: GS002_ANIMATION_ID,
      existingRequirements: [canonical, {...supplemental, requirementId: "req:forged"}],
      canonicalRequirements: [canonical],
    }),
    /unknown or conflicting supplemental/,
  );
  assert.throws(
    () => preserveLegalSupplementalRequirements({
      animationId: GS002_ANIMATION_ID,
      existingRequirements: [canonical, supplemental, supplemental],
      canonicalRequirements: [canonical],
    }),
    /duplicate coverage requirementId/,
  );
  assert.throws(
    () => preserveLegalSupplementalRequirements({
      animationId: "course-other",
      existingRequirements: [{...canonical, requirementId: "req:canonical"}, supplemental],
      canonicalRequirements: [{...canonical, requirementId: "req:canonical"}],
    }),
    /unknown supplemental coverage/,
  );
});

test("canonical contract itself fails closed if the original 1..653 row is weakened", () => {
  const shortened = canonicalRequirement();
  shortened.requiredRange.lastFrame = 641;
  assert.throws(() => buildGs002SupplementalRequirement(shortened), /complete physical 1..653/);

  const promoted = canonicalRequirement();
  promoted.status = "complete";
  assert.throws(() => buildGs002SupplementalRequirement(promoted), /must remain blocked/);

  const changedEntry = canonicalRequirement();
  changedEntry.entryState.localEntryFrame = 2;
  assert.throws(() => buildGs002SupplementalRequirement(changedEntry), /entryStateSha256 differs/);
});
