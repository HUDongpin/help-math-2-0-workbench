import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  deriveRootEntryFrame,
  parseArguments,
  repairCoverageDocument,
} from "./repair-g4-l3-materialized-root-entry-identities.mjs";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function hashEntryState(entryState) {
  return createHash("sha256").update(JSON.stringify(stable(entryState))).digest("hex");
}

function requirement({id, domain}) {
  const entryState = {
    authoritativeTraceExecuted: false,
    frameDomainId: domain,
    kind: "lesson-shell-natural-entry-to-source-static-reachable-domain",
    language: id.endsWith(":es") ? "es" : "en",
    localEntryFrameCandidate: 1,
    parentFrameDomainId: domain === "sprite-9" ? "sprite-27" : "root",
    releaseId: "lesson-g04-l03-negative-numbers",
    runtimeReachabilityEstablished: false,
    scenario: "source-static-reachable-domain",
    seed: "0",
    sourceScenarioCandidateId: "source-static-reachable-domain-natural-entry",
    sourceTimelineId: domain,
    targetAnimationId: "course-g04-l03-fixture",
    targetSequence: 1,
  };
  return {
    requirementId: id,
    scenario: "source-static-reachable-domain",
    frameDomainId: domain,
    traceId: `trace:${domain}:lesson-shell-natural-entry:${entryState.language}:seed-0`,
    language: entryState.language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 3},
    entryState,
    entryStateSha256: hashEntryState(entryState),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    planningAuthority: "source-static-reachable-domain-candidate-not-executed-original-runtime-evidence",
    blockingReason: "pending",
  };
}

function fixture() {
  const animationId = "course-g04-l03-fixture";
  const manifest = {
    animationId,
    implementation: {
      frameDomains: [
        {id: "root", kind: "root", parentFrameDomainId: null, frameCount: 10},
        {id: "sprite-27", kind: "nested", parentFrameDomainId: "root", parentEntryFrame: 6, frameCount: 20},
        {id: "sprite-9", kind: "nested", parentFrameDomainId: "sprite-27", parentEntryFrame: 2, frameCount: 3},
        {id: "sprite-11", kind: "nested", parentFrameDomainId: "root", frameCount: 3},
      ],
    },
  };
  const coverage = {
    schemaVersion: 2,
    animationId,
    requirements: [
      {requirementId: "existing", frameDomainId: "sprite-27"},
      requirement({id: "req:sprite-9:lesson-shell-natural-entry:en", domain: "sprite-9"}),
      requirement({id: "req:sprite-9:lesson-shell-natural-entry:es", domain: "sprite-9"}),
      requirement({id: "req:sprite-11:lesson-shell-natural-entry:en", domain: "sprite-11"}),
      requirement({id: "req:sprite-11:lesson-shell-natural-entry:es", domain: "sprite-11"}),
    ],
  };
  const sourceItem = {animationId, newPendingRequirements: 4};
  const sourceRequirements = structuredClone(coverage.requirements.slice(1));
  return {sourceItem, sourceRequirements, manifest, coverage};
}

test("derives the root frame from the first proven edge below root, not the immediate nested parent", () => {
  const {manifest} = fixture();
  assert.equal(deriveRootEntryFrame("sprite-9", manifest.implementation.frameDomains), 6);
  assert.equal(deriveRootEntryFrame("sprite-11", manifest.implementation.frameDomains), null);
});

test("repairs only source-resolvable materialized requirements and exactly reconstructs the preimage", () => {
  const input = fixture();
  const result = repairCoverageDocument(input);
  assert.equal(result.repairs.length, 2);
  assert.equal(result.unresolved.length, 2);
  assert.deepEqual(result.repairs.map(({rootEntryFrame}) => rootEntryFrame), [6, 6]);
  assert.equal(result.coverage.requirements[1].entryState.rootEntryFrame, 6);
  assert.equal(Object.hasOwn(result.coverage.requirements[3].entryState, "rootEntryFrame"), false);
  assert.deepEqual(result.preimageCoverage, input.coverage);
  const checked = repairCoverageDocument({...input, coverage: result.coverage, allowRepaired: true});
  assert.deepEqual(checked.coverage, result.coverage);
  assert.deepEqual(checked.preimageCoverage, input.coverage);
});

test("rejects invented or conflicting root entry frames", () => {
  const input = fixture();
  input.coverage.requirements[1].entryState.rootEntryFrame = 116;
  input.coverage.requirements[1].entryStateSha256 = hashEntryState(input.coverage.requirements[1].entryState);
  assert.throws(() => repairCoverageDocument({...input, allowRepaired: true}), /not the exact repair preimage or successor value/);
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
