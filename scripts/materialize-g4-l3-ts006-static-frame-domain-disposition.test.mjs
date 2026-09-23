import assert from "node:assert/strict";
import test from "node:test";

import {
  materializeTs006StaticDisposition,
  validateDispositionChain,
  validateOldPlanningState,
} from "./materialize-g4-l3-ts006-static-frame-domain-disposition.mjs";

test("checked-in TS006 static frame-domain disposition closure is reproducible and acceptance-neutral", async () => {
  const report = await materializeTs006StaticDisposition({check: true});
  assert.equal(report.summary.enumeratedRootReachableTimelines, 3);
  assert.equal(report.summary.declaredFrameDomains, 2);
  assert.equal(report.summary.staticCompositeTimelines, 1);
  assert.equal(report.summary.unresolvedTimelineCandidatesAfter, 0);
  assert.equal(report.summary.pendingRequirements, 4);
  assert.equal(report.acceptance.frameDomainDispositionEstablished, true);
  assert.equal(report.acceptance.strictMigrationComplete, false);
});

test("old TS006 planning precondition rejects premature disposition claims", () => {
  const manifest = {
    animationId: "course-g04-l03-ts-006",
    implementation: {capturePlanning: {
      nestedFrameDomainDispositionEstablished: false,
      unresolvedTimelineCandidateIds: ["sprite-3"],
    }},
  };
  const coverage = {
    animationId: "course-g04-l03-ts-006",
    requirements: Array.from({length: 4}, () => ({status: "pending", baselineAuthority: "unresolved"})),
  };
  assert.doesNotThrow(() => validateOldPlanningState({manifest, coverage}));
  manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished = true;
  assert.throws(() => validateOldPlanningState({manifest, coverage}), /must retain an unresolved disposition/);
});

test("TS006 disposition-chain validator rejects a forged accepted obligation", async () => {
  const report = await materializeTs006StaticDisposition({check: true});
  assert.equal(report.acceptance.strictMigrationComplete, false);
  const scenario = {animationId: "course-g04-l03-ts-006", inventoryStatus: "static-exhaustive-runtime-unverified"};
  const staticEvidence = {
    animationId: "course-g04-l03-ts-006",
    status: "verified-static-composite-claims",
    claims: [{
      timelineId: "sprite-3",
      frameCount: 1,
      role: "single-frame-scriptless-structural-child",
      disposition: "composite-child-with-parent",
      claimScope: "independent-local-playhead-only",
      preservedObligations: {visual: {satisfiedByDisposition: true}},
    }],
  };
  const disposition = {
    animationId: "course-g04-l03-ts-006",
    status: "structurally-enumerated",
    summary: {enumeratedTimelineCount: 3, dispositionCounts: {"declared-frame-domain": 2, "composite-child-with-parent": 1, unresolved: 0}},
    timelines: [{timelineId: "sprite-3", disposition: "composite-child-with-parent", staticCompositeEvidence: {role: "single-frame-scriptless-structural-child"}}],
    strictAcceptanceEffect: "none; fixture",
  };
  assert.throws(() => validateDispositionChain({scenario, staticEvidence, disposition}), /incorrectly satisfies/);
});
