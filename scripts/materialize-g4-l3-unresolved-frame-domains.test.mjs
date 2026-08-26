import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  buildExpandedDocuments,
  buildPendingRequirement,
  canonicalJson,
  derivePendingDomain,
} from "./materialize-g4-l3-unresolved-frame-domains.mjs";

function fixture({frameCount = 5, placementStatus = "proven-named-placement-chain"} = {}) {
  const animationId = "course-g04-l03-fixture";
  const timeline = {
    timelineId: "sprite-9",
    sourceTimelineId: "sprite-9",
    sourceObjectId: "9",
    frameCount,
    structuralReachability: "reachable-from-root-placement-graph",
    rootPlacement: placementStatus === "proven-named-placement-chain" ? {
      status: placementStatus,
      namedPlacementPath: [
        {parentTimelineId: "root", childTimelineId: "sprite-27", frame: 6, instanceName: "animation"},
        {parentTimelineId: "sprite-27", childTimelineId: "sprite-9", frame: 2, instanceName: "sound"},
      ],
    } : {status: placementStatus, namedPlacementPath: []},
    knownNamedParentPlacements: [],
    declaredFrameDomains: [],
    disposition: "unresolved",
  };
  const manifest = {
    animationId,
    runtime: {frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "source-static-frame", kind: "linear", reachable: true}],
    implementation: {
      defaultFrameDomainId: "sprite-27",
      frameDomains: [
        {id: "root", kind: "root", sourceTimelineId: "root", parentFrameDomainId: null, frameCount: 10, scenarioIds: ["root-unavailable"]},
        {id: "sprite-27", kind: "nested", sourceTimelineId: "sprite-27", parentFrameDomainId: "root", frameCount: 20, scenarioIds: ["source-static-frame"]},
      ],
      capturePlanning: {unresolvedTimelineCandidateIds: ["sprite-9"], strictAcceptanceEffect: "none"},
    },
  };
  const coverage = {
    schemaVersion: 2,
    animationId,
    planningState: "pending",
    requirements: [{requirementId: "existing", frameDomainId: "sprite-27", traceId: "existing", status: "pending"}],
    limitations: ["existing limitation"],
  };
  const disposition = {
    schemaVersion: 1,
    animationId,
    status: "structurally-enumerated-dispositions-unresolved",
    timelines: [
      {timelineId: "root", sourceTimelineId: "root", frameCount: 10, disposition: "declared-frame-domain"},
      {timelineId: "sprite-27", sourceTimelineId: "sprite-27", frameCount: 20, disposition: "declared-frame-domain"},
      timeline,
      {timelineId: "sprite-3", sourceTimelineId: "sprite-3", frameCount: 1, disposition: "composite-child-with-parent"},
    ],
    strictAcceptanceEffect: "none; fixture",
  };
  const singleMember = {
    animationId,
    disqualifiedOneFrameTimelines: frameCount === 1 ? [{
      timelineId: "sprite-9", frameCount: 1, eligible: false, disqualifiers: ["swfmill-do-action-present", "ffdec-frame-script-present"],
    }] : [],
  };
  const multiMember = {
    animationId,
    excludedCandidates: frameCount > 1 ? [{
      timelineId: "sprite-9", frameCount, eligible: false, disqualifiers: ["ffdec-frame-script-present"],
    }] : [],
  };
  return {animationId, timeline, manifest, coverage, disposition, singleMember, multiMember};
}

test("derivePendingDomain binds a proven direct parent domain without claiming runtime reachability", () => {
  const {animationId, timeline} = fixture();
  const domain = derivePendingDomain({
    animationId,
    timeline,
    finalDomainBySource: new Map([["root", "root"], ["sprite-27", "sprite-27"], ["sprite-9", "sprite-9"]]),
  });
  assert.equal(domain.parentFrameDomainId, "sprite-27");
  assert.equal(domain.parentEntryFrame, 2);
  assert.equal(domain.sourceInstanceId, "sound");
  assert.equal(domain.sourceStaticReachability.runtimeReachabilityEstablished, false);
});

test("derivePendingDomain falls back to root when the named source path is unresolved", () => {
  const {animationId, timeline} = fixture({placementStatus: "structurally-reachable-but-named-root-path-unresolved"});
  const domain = derivePendingDomain({
    animationId,
    timeline,
    finalDomainBySource: new Map([["root", "root"], ["sprite-9", "sprite-9"]]),
  });
  assert.equal(domain.parentFrameDomainId, "root");
  assert.equal(domain.sourceStaticReachability.parentBinding, "nearest-declared-ancestor-or-root");
  assert.equal(Object.hasOwn(domain, "parentEntryFrame"), false);
});

test("buildPendingRequirement provides complete one-indexed EN identity and remains empty/pending", () => {
  const requirement = buildPendingRequirement({
    animationId: "course-g04-l03-fixture",
    sequence: 1,
    domain: {id: "sprite-9", sourceTimelineId: "sprite-9", parentFrameDomainId: "root", frameCount: 3},
    language: "en",
    classification: "source-static-reachable-multi-frame-domain-candidate",
    disqualifiers: ["ffdec-frame-script-present"],
  });
  assert.deepEqual(requirement.requiredRange, {firstFrame: 1, lastFrame: 3});
  assert.deepEqual(requirement.missingFrames, [1, 2, 3]);
  assert.match(requirement.entryStateSha256, /^[a-f0-9]{64}$/);
  assert.equal(requirement.entryStateSha256,
    createHash("sha256").update(canonicalJson(requirement.entryState)).digest("hex"));
  assert.equal(requirement.status, "pending");
  assert.equal(requirement.baselineAuthority, "unresolved");
  assert.equal(requirement.captureManifest, "");
});

test("buildExpandedDocuments preserves existing requirements and adds two pending requirements per domain", () => {
  const input = fixture();
  const result = buildExpandedDocuments({sequence: 1, ...input});
  assert.deepEqual(result.coverage.requirements[0], input.coverage.requirements[0]);
  assert.equal(result.domains.length, 1);
  assert.equal(result.newRequirements.length, 2);
  assert.deepEqual(result.newRequirements.map(({language}) => language), ["en", "es"]);
  assert.equal(result.manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds.length, 0);
  assert.equal(result.manifest.implementation.capturePlanning.authoritativeRuntimeFrameDomainDispositionEstablished, false);
  assert.equal(result.manifest.implementation.capturePlanning.strictAcceptanceEffect, "none");
});

test("one-frame source timeline requires an explicit script/action exclusion", () => {
  const input = fixture({frameCount: 1});
  const result = buildExpandedDocuments({sequence: 1, ...input});
  assert.equal(result.classifications[0].classification, "source-static-reachable-one-frame-scripted-domain-candidate");
  input.singleMember.disqualifiedOneFrameTimelines[0].disqualifiers = ["unrelated"];
  assert.throws(() => buildExpandedDocuments({sequence: 1, ...input}), /one-frame scripted exclusion is not exact/);
});
