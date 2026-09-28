import assert from "node:assert/strict";
import test from "node:test";

import {projectionSha256} from "./evidence-projections.mjs";
import {normalizeRequirementSelection} from
  "./lib/trace-frame-selection.mjs";
import {
  buildAlternatePlacementRequirement,
  parseArguments,
} from "./materialize-g4-l3-alternate-placement-coverage.mjs";

function fixture() {
  const entryState = {
    authoritativeTraceExecuted: false,
    frameDomainId: "sprite-166",
    kind: "lesson-shell-natural-entry-to-source-static-reachable-domain",
    language: "en",
    rootEntryFrame: 6,
    scenario: "source-static-reachable-domain",
    seed: "0",
  };
  return {
    canonicalRequirement: {
      requirementId: "req:sprite-166:lesson-shell-natural-entry:en",
      scenario: "source-static-reachable-domain",
      frameDomainId: "sprite-166",
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: 19},
      entryState,
      entryStateSha256: projectionSha256(entryState),
    },
    config: {
      animationId: "course-g04-l03-vb-007",
      canonicalRequirementId:
        "req:sprite-166:lesson-shell-natural-entry:en",
      requirementId:
        "req:sprite-166:lesson-shell-natural-entry-path-2:en",
      traceId:
        "trace:sprite-166:lesson-shell-natural-entry-path-2:en:seed-0",
      frameDomainId: "sprite-166",
      frameCount: 19,
      pathIndex: 2,
      contractId: "test-parent-composite-v1",
      behaviorCompositeStatePrefix: "sprite166-p02-target-frame-",
    },
    pathIdentity: {
      rootEntryFrame: 6,
      placementPath: [
        {parentTimelineId: "root", childTimelineId: "sprite-271", parentFrame: 6},
        {parentTimelineId: "sprite-271", childTimelineId: "sprite-176", parentFrame: 31},
        {parentTimelineId: "sprite-176", childTimelineId: "sprite-166", parentFrame: 9},
      ],
      mainFrameDomainId: "sprite-271",
      mainFrame: 31,
      intermediateFrameOverrides: {sprite176: 8},
      uniqueTargetVisualCount: 19,
    },
    rootAuditBinding: {path: "reports/root.json", bytes: 1, sha256: "a".repeat(64)},
    observabilityBinding: {path: "reports/observable.json", bytes: 2, sha256: "b".repeat(64)},
    assetReportBinding: {path: "reports/assets.json", bytes: 3, sha256: "c".repeat(64)},
  };
}

test("builds one complete alternate placement identity without strict authority", () => {
  const requirement = buildAlternatePlacementRequirement(fixture());
  const selection = normalizeRequirementSelection(requirement, 19);
  assert.equal(requirement.requirementSchemaVersion, 2);
  assert.equal(requirement.coverageRole, "placement-path");
  assert.equal(selection.coverageRole, "placement-path");
  assert.deepEqual(selection.selectedPhysicalFrames,
    Array.from({length: 19}, (_, index) => index + 1));
  assert.equal(requirement.status, "blocked");
  assert.equal(requirement.strictAcceptanceEffect, "none");
  assert.equal(requirement.authority.currentJavascriptImplementationCaptureOnly,
    true);
  for (const key of [
    "originalRuntimeBaseline",
    "rmseAcceptance",
    "humanVisualReview",
    "ownerAcceptance",
    "strictAcceptance",
  ]) assert.equal(requirement.authority[key], false, key);
  assert.equal(
    requirement.entryState.placementPathIdentity.pathIndex,
    2,
  );
  assert.equal(
    projectionSha256(requirement.entryState),
    requirement.entryStateSha256,
  );
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--apply"]), /Unknown option/);
});
