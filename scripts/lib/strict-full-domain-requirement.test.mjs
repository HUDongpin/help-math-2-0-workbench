import assert from "node:assert/strict";
import test from "node:test";

import {selectionSha256} from "./trace-frame-selection.mjs";
import {
  assertStrictFullDomainRequirement,
  classifyStrictFullDomainRequirement,
  validateSupplementalPartialRequirementBoundary,
} from "./strict-full-domain-requirement.mjs";

function placementPathRequirement() {
  const unsigned = {
    requirementSchemaVersion: 2,
    coverageRole: "placement-path",
    coverageGroupId: "coverage-group:alternate-placement",
    requiredRange: {firstFrame: 1, lastFrame: 3},
    strictAcceptanceEffect: "none",
    status: "blocked",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3],
    baselineAuthority: "unresolved",
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    authority: {
      currentJavascriptImplementationCaptureOnly: true,
      originalRuntimeBaseline: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
    },
  };
  return {...unsigned, selectionSha256: selectionSha256(unsigned, 3)};
}

test("a complete placement path remains supplemental and cannot enter strict authority", () => {
  const requirement = placementPathRequirement();
  const classification = classifyStrictFullDomainRequirement(requirement, 3);
  assert.equal(classification.eligible, false);
  assert.equal(classification.selection.coverageRole, "placement-path");
  assert.doesNotThrow(() => validateSupplementalPartialRequirementBoundary(
    requirement,
    classification.selection,
  ));
  assert.throws(
    () => assertStrictFullDomainRequirement(requirement, 3),
    /placement-path requirements cannot enter strict acceptance/,
  );
});

test("placement-path authority rejects baseline, review, and strict promotion", () => {
  const requirement = placementPathRequirement();
  const classification = classifyStrictFullDomainRequirement(requirement, 3);
  for (const authorityKey of [
    "originalRuntimeBaseline",
    "humanVisualReview",
    "ownerAcceptance",
    "strictAcceptance",
  ]) {
    const promoted = structuredClone(requirement);
    promoted.authority[authorityKey] = true;
    assert.throws(
      () => validateSupplementalPartialRequirementBoundary(
        promoted,
        classification.selection,
      ),
      new RegExp(`authority\\.${authorityKey} must not be true`),
    );
  }
});
