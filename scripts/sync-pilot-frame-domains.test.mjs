import assert from "node:assert/strict";
import test from "node:test";

import {
  PILOT_FRAME_DOMAIN_SPECS,
  canonicalJson,
  derivePilotFrameDomainOutputs,
  parseArguments,
  parseCsv,
  sha256Text,
} from "./sync-pilot-frame-domains.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  GS002_SUPPLEMENTAL_REQUIREMENT_ID,
  buildGs002SupplementalRequirement,
} from "./build-gs002-partial-current-js-requirement.mjs";

const OLD_KEYFRAME_HEADER = "frame,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes";

function manifestFixture({
  id = "course-g03-l01-ts-008",
  rootFrameCount = 10,
  scenarios = ["default", "answer-correct-unavailable"],
} = {}) {
  return {
    schemaVersion: 2,
    id,
    animationId: id,
    status: "preserved",
    source: {swf: "source-assets/fixture.swf", swfSha256: "a".repeat(64)},
    runtime: {
      stage: {width: 800, height: 600},
      fps: 12,
      frameCount: rootFrameCount,
      durationMs: rootFrameCount / 12 * 1000,
    },
    localization: {bilingualRequired: true, languages: ["en", "es"]},
    scenarios: scenarios.map((scenario) => ({id: scenario, kind: "interactive", description: scenario, reachable: true})),
    implementation: {
      rendering: "fixture",
      captureContract: {
        frameParameter: "frame",
        scenarioParameter: "scenario",
        languageParameter: "lang",
        seedParameter: "seed",
        frameAttribute: "data-flash-frame",
      },
    },
    acceptance: {
      engineeringReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      humanVisualReview: {decision: "pending", reviewer: "", reviewedAt: "", scope: "all-keyframe-and-full-frame-diffs"},
      ownerReview: {decision: "pending", reviewer: "", reviewedAt: "", reason: ""},
      knownExceptions: [],
    },
  };
}

function inventoryFixture({manifest, objectId = "348", localFrameCount = 747, entryFrame = 6, includeLocal = true}) {
  const timelineInventory = [{
    timelineId: "root",
    objectId: null,
    frameCount: manifest.runtime.frameCount,
    structuralReachability: "root",
    namedPlacements: includeLocal ? [{
      depth: "1",
      frame: entryFrame,
      name: "animation",
      objectId,
      tag: "PlaceObject2",
    }] : [],
  }];
  if (includeLocal) timelineInventory.push({
    timelineId: `sprite-${objectId}`,
    objectId,
    frameCount: localFrameCount,
    structuralReachability: "reachable-from-root-placement-graph",
  });
  return {
    schemaVersion: 1,
    animationId: manifest.animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
    },
    evidenceIndex: [{
      artifactId: "migration-technical-contract",
      path: "migration.json",
      sha256: technicalManifestSha256(manifest),
      hashMode: "canonical-json-v1",
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    }],
    timelineInventory,
  };
}

test("course output separates the root standalone trace from the source sprite frame domain", () => {
  const manifest = manifestFixture();
  manifest.scenarios[1].kind = "blocked-branch";
  const inventory = inventoryFixture({manifest});
  const keyframesText = `${OLD_KEYFRAME_HEADER}\n1,0,default,en,static,"source, drawing",load,,,,,,,,pending,pending,scenario inventory,,not accepted\n`;
  const output = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });

  assert.equal(output.manifest.runtime.frameCount, 10, "the shipped root frame count is immutable");
  assert.equal(output.manifest.runtime.rootTimelineId, "root");
  assert.deepEqual(output.manifest.runtime.timelineDefinitions.map(({id}) => id), ["root", "sprite-348"]);
  assert.equal(output.manifest.runtime.instances[1].placement.frame, 6);
  assert.equal(output.manifest.implementation.defaultFrameDomainId, "sprite-348");
  assert.deepEqual(output.manifest.implementation.frameDomains.map(({id}) => id), ["root", "sprite-348"]);
  assert.deepEqual(output.manifest.implementation.frameDomains[0].scenarioIds, ["root-standalone"]);
  assert.deepEqual(output.manifest.implementation.frameDomains[1].scenarioIds, ["default", "answer-correct-unavailable"]);
  assert.equal(output.manifest.scenarios.find(({id}) => id === "answer-correct-unavailable").kind, "interactive");
  assert.equal(output.manifest.scenarios.find(({id}) => id === "answer-correct-unavailable").sourceScenarioKind, "blocked-branch");
  assert.equal(output.manifest.implementation.captureContract.requirementIdAttribute, "data-flash-requirement-id");
  assert.equal(output.coverage.requirements.length, 6);
  assert.equal(new Set(output.coverage.requirements.map(({requirementId}) => requirementId)).size, 6);
  assert.ok(output.coverage.requirements.every(({status}) => status === "blocked"));
  assert.ok(output.coverage.requirements.filter(({frameDomainId}) => frameDomainId === "sprite-348")
    .every(({baselineAuthorityRequirement, requiredRange}) =>
      baselineAuthorityRequirement === "original-runtime-natural-trace" && requiredRange.firstFrame === 1 && requiredRange.lastFrame === 747));
  assert.ok(output.coverage.requirements.filter(({frameDomainId}) => frameDomainId === "root")
    .every(({baselineAuthorityRequirement, entryState, blockingReason}) =>
      baselineAuthorityRequirement === "original-runtime-frame-accurate"
      && entryState.kind === "original-root-frame-accurate-entry"
      && /direct-seek baseline/.test(blockingReason)));
  assert.ok(output.coverage.requirements.every(({entryState, entryStateSha256}) =>
    sha256Text(canonicalJson(entryState)) === entryStateSha256));
  const migratedKeyframes = parseCsv(output.keyframesText);
  assert.ok(migratedKeyframes.headers.includes("frame_domain_id"));
  assert.equal(migratedKeyframes.rows[0].frame_domain_id, "sprite-348");
  assert.equal(migratedKeyframes.rows[0].scenario, "default");
  assert.match(migratedKeyframes.rows[0].entry_state_sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(output.manifest.acceptance, manifest.acceptance);
  assert.equal(output.inventory.evidenceIndex[0].sha256, technicalManifestSha256(output.manifest));
});

test("signing and status promotion preserve generated inventory and coverage technical identity", () => {
  const manifest = manifestFixture();
  const inventory = inventoryFixture({manifest});
  const input = {manifest, inventory, keyframesText: `${OLD_KEYFRAME_HEADER}\n`, spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId]};
  const before = derivePilotFrameDomainOutputs(input);
  const signed = structuredClone(manifest);
  signed.status = "complete";
  signed.acceptance.humanVisualReview = {decision: "accepted", reviewer: "Named human", reviewedAt: "2026-07-22T00:00:00.000Z", scope: "all-keyframe-and-full-frame-diffs"};
  signed.acceptance.ownerReview = {decision: "accepted", reviewer: "Named owner", reviewedAt: "2026-07-22T01:00:00.000Z", reason: "Accepted reviewed scope"};
  const after = derivePilotFrameDomainOutputs({...input, manifest: signed});
  assert.equal(technicalManifestSha256(after.manifest), technicalManifestSha256(before.manifest));
  assert.equal(after.inventoryText, before.inventoryText);
  assert.equal(after.coverageText, before.coverageText);
});

test("structural resync preserves evidence fields when the trace requirement identity is unchanged", () => {
  const manifest = manifestFixture();
  const inventory = inventoryFixture({manifest});
  const input = {manifest, inventory, keyframesText: `${OLD_KEYFRAME_HEADER}\n`, spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId]};
  const initial = derivePilotFrameDomainOutputs(input);
  const existingCoverage = structuredClone(initial.coverage);
  const requirement = existingCoverage.requirements[0];
  requirement.status = "blocked";
  requirement.blockingReason = "Current JavaScript frames are captured; the original-runtime baseline and metrics remain pending.";
  requirement.blockingEvidence.push({file: "output/playwright/fixture/capture-manifest.json", sha256: "b".repeat(64)});
  requirement.capturedFrameCount = requirement.requiredRange.lastFrame;
  requirement.missingFrames = [];
  requirement.captureManifest = "output/playwright/fixture/capture-manifest.json";
  requirement.captureManifestSha256 = "b".repeat(64);

  const resynced = derivePilotFrameDomainOutputs({...input, existingCoverage});
  const preserved = resynced.coverage.requirements[0];
  assert.equal(preserved.blockingReason, requirement.blockingReason);
  assert.equal(preserved.capturedFrameCount, requirement.capturedFrameCount);
  assert.deepEqual(preserved.missingFrames, []);
  assert.equal(preserved.captureManifest, requirement.captureManifest);
  assert.equal(preserved.captureManifestSha256, requirement.captureManifestSha256);
  assert.equal(preserved.blockingEvidence[0].file, "audit/scenario-inventory.json");
  assert.equal(preserved.blockingEvidence[1].file, requirement.captureManifest);
});

test("resync preserves an explicit root-domain keyframe in a nested-domain migration", () => {
  const manifest = manifestFixture();
  const inventory = inventoryFixture({manifest});
  const initial = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText: `${OLD_KEYFRAME_HEADER}\n1,0,default,en,static,fixture,load,,,,,,,,pending,pending,trace.json,,pending\n`,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });
  const parsed = parseCsv(initial.keyframesText);
  const row = parsed.rows[0];
  row.frame_domain_id = "root";
  row.scenario = "root-standalone";
  const rootKeyframeText = `${parsed.headers.join(",")}\n${parsed.headers.map((header) => row[header]).join(",")}\n`;
  const resynced = derivePilotFrameDomainOutputs({
    manifest: initial.manifest,
    inventory: initial.inventory,
    existingCoverage: initial.coverage,
    keyframesText: rootKeyframeText,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });
  const [preserved] = parseCsv(resynced.keyframesText).rows;
  assert.equal(preserved.frame_domain_id, "root");
  assert.equal(preserved.scenario, "root-standalone");
  assert.equal(preserved.requirement_id, "req:root:root-standalone:en");
});

test("RE keeps root as the implementation default while declaring sprite-621 blocked coverage", () => {
  const manifest = manifestFixture({id: "course-g03-l08-re-001", rootFrameCount: 55, scenarios: ["default", "host-review-unavailable"]});
  const inventory = inventoryFixture({manifest, objectId: "621", localFrameCount: 27, entryFrame: 51});
  const keyframesText = `${OLD_KEYFRAME_HEADER}\n51,4166.667,default,en,static,root stop,root-label,,,,,,,,pending,pending,Adobe runtime,,pending\n`;
  const output = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });

  assert.equal(output.manifest.implementation.defaultFrameDomainId, "root");
  assert.equal(output.manifest.implementation.frameDomains[1].id, "sprite-621");
  assert.equal(output.manifest.implementation.frameDomains[1].frameCount, 27);
  assert.equal(output.coverage.requirements.length, 6);
  assert.ok(output.coverage.requirements.filter(({frameDomainId}) => frameDomainId === "sprite-621").every(({status}) => status === "blocked"));
  const [row] = parseCsv(output.keyframesText).rows;
  assert.equal(row.frame_domain_id, "root");
  assert.equal(row.scenario, "root-standalone");
  assert.match(row.notes, /no acceptance claim is added/);
});

test("shell remains a root-only domain with explicit blocked host-replacement requirements", () => {
  const manifest = manifestFixture({
    id: "shell-course-g04-l01-index-local",
    rootFrameCount: 50,
    scenarios: ["default", "section-ir", "quit-confirmation"],
  });
  const inventory = inventoryFixture({manifest, includeLocal: false});
  const output = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText: `${OLD_KEYFRAME_HEADER}\n`,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });

  assert.deepEqual(output.manifest.implementation.frameDomains.map(({id}) => id), ["root"]);
  assert.deepEqual(output.manifest.scenarios.map(({id}) => id), ["default", "section-ir", "quit-confirmation"]);
  assert.equal(output.coverage.requirements.length, 6);
  assert.ok(output.coverage.requirements.every(({blockingReason}) => /native host replacement/.test(blockingReason)));
  assert.ok(output.coverage.requirements.every(({baselineAuthorityRequirement, entryState}) =>
    baselineAuthorityRequirement === "original-runtime-natural-trace"
    && entryState.kind === "original-shell-natural-entry"));
});

test("GS002 sync preserves only the legal supplemental partial path and keeps keyframes canonical", () => {
  const manifest = manifestFixture({
    id: "course-g04-l09-gs-002",
    rootFrameCount: 10,
    scenarios: ["source-drawing-lead-in"],
  });
  const inventory = inventoryFixture({
    manifest,
    objectId: "787",
    localFrameCount: 653,
    entryFrame: 6,
  });
  const initial = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText: `${OLD_KEYFRAME_HEADER}\n1,0,source-drawing-lead-in,en,static,fixture,load,,,,,,,,pending,pending,source audit,,pending\n`,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });
  const canonical = initial.coverage.requirements.find(
    ({requirementId}) => requirementId === "req:sprite-787:source-drawing-lead-in:en",
  );
  const supplemental = buildGs002SupplementalRequirement(canonical);
  supplemental.capturedFrameCount = 641;
  supplemental.missingFrames = [];
  supplemental.captureManifest = "output/playwright/gs002-partial/capture-manifest.json";
  supplemental.captureManifestSha256 = "d".repeat(64);
  supplemental.blockingReason = "Current-JavaScript selection captured; every authority gate remains unresolved.";
  supplemental.blockingEvidence.push({
    file: supplemental.captureManifest,
    sha256: supplemental.captureManifestSha256,
  });
  const resynced = derivePilotFrameDomainOutputs({
    manifest: initial.manifest,
    inventory: initial.inventory,
    existingCoverage: {
      ...initial.coverage,
      requirements: [...initial.coverage.requirements, supplemental],
    },
    keyframesText: initial.keyframesText,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });

  assert.equal(resynced.summary.requirementCount, 4, "canonical denominator remains four");
  assert.equal(resynced.summary.canonicalRequirementCount, 4);
  assert.equal(resynced.summary.supplementalRequirementCount, 1);
  assert.equal(resynced.coverage.requirements.length, 5);
  assert.deepEqual(
    resynced.coverage.requirements.find(
      ({requirementId}) => requirementId === GS002_SUPPLEMENTAL_REQUIREMENT_ID,
    ),
    supplemental,
  );
  const [keyframe] = parseCsv(resynced.keyframesText).rows;
  assert.equal(keyframe.requirement_id, canonical.requirementId);
  assert.notEqual(keyframe.requirement_id, GS002_SUPPLEMENTAL_REQUIREMENT_ID);
});

test("frame-domain sync rejects unknown, forged, and duplicate supplemental rows", () => {
  const manifest = manifestFixture({
    id: "course-g04-l09-gs-002",
    rootFrameCount: 10,
    scenarios: ["source-drawing-lead-in"],
  });
  const inventory = inventoryFixture({
    manifest,
    objectId: "787",
    localFrameCount: 653,
    entryFrame: 6,
  });
  const initial = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText: `${OLD_KEYFRAME_HEADER}\n`,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });
  const canonical = initial.coverage.requirements.find(
    ({requirementId}) => requirementId === "req:sprite-787:source-drawing-lead-in:en",
  );
  const supplemental = buildGs002SupplementalRequirement(canonical);
  const run = (extraRequirements) => derivePilotFrameDomainOutputs({
    manifest: initial.manifest,
    inventory: initial.inventory,
    existingCoverage: {
      ...initial.coverage,
      requirements: [...initial.coverage.requirements, ...extraRequirements],
    },
    keyframesText: initial.keyframesText,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });

  assert.throws(
    () => run([{...supplemental, requirementId: "req:unknown"}]),
    /unknown or conflicting supplemental/,
  );
  assert.throws(
    () => run([{...supplemental, selectionSha256: "0".repeat(64)}]),
    /forged, stale, or conflicting|selectionSha256/,
  );
  assert.throws(
    () => run([supplemental, supplemental]),
    /duplicate coverage requirementId/,
  );
});

test("reviewed placement mappings fail closed when the inventory differs", () => {
  const manifest = manifestFixture();
  const inventory = inventoryFixture({manifest});
  inventory.timelineInventory[0].namedPlacements[0].frame = 7;
  assert.throws(() => derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText: `${OLD_KEYFRAME_HEADER}\n`,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  }), /reviewed root entry frame 6 differs/);
});

test("non-runtime scenario records are preserved outside the reachable frame-domain cartesian product", () => {
  const manifest = manifestFixture();
  manifest.scenarios.push({
    id: "authoring-inspection-only",
    kind: "interactive",
    description: "not a runtime path",
    reachable: false,
  });
  const inventory = inventoryFixture({manifest});
  const output = derivePilotFrameDomainOutputs({
    manifest,
    inventory,
    keyframesText: `${OLD_KEYFRAME_HEADER}\n`,
    spec: PILOT_FRAME_DOMAIN_SPECS[manifest.animationId],
  });
  assert.ok(!output.manifest.scenarios.some(({id}) => id === "authoring-inspection-only"));
  assert.equal(output.manifest.audit.unreachableScenarioRecords[0].id, "authoring-inspection-only");
  assert.ok(!output.coverage.requirements.some(({scenario}) => scenario === "authoring-inspection-only"));
});

test("CLI parsing supports repeatable IDs and check mode", () => {
  const options = parseArguments(["--id", "course-g03-l01-ts-008", "--id", "course-g04-l01-ir-001", "--check", "--json"]);
  assert.deepEqual(options.ids, ["course-g03-l01-ts-008", "course-g04-l01-ir-001"]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
});
