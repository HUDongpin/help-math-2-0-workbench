import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExpectedPendingCoverageDocuments,
  buildPendingNestedRequirement,
  buildPendingRootRequirement,
  canonicalAcceptanceNeutralBlockingEvidence,
  canonicalJson,
  parseArguments,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";

test("pending root requirement binds the complete capture identity and a valid one-indexed range", () => {
  const item = {animationId: "course-g04-l03-fixture", sequence: 7, nativeRuntimeFacts: {rootFrameCount: 10}};
  const requirement = buildPendingRootRequirement({item, language: "es"});
  assert.deepEqual(requirement.requiredRange, {firstFrame: 1, lastFrame: 10});
  assert.equal(requirement.frameDomainId, "root");
  assert.equal(requirement.language, "es");
  assert.equal(requirement.scenario, "default");
  assert.equal(requirement.seed, "0");
  assert.equal(requirement.entryState.frameDomainId, "root");
  assert.equal(requirement.entryState.rootEntryFrame, 1);
  assert.equal(requirement.entryState.scenario, "default");
  assert.equal(requirement.entryState.seed, "0");
  assert.match(requirement.requirementId, /^req:/);
  assert.match(requirement.traceId, /^trace:/);
  assert.match(requirement.entryStateSha256, /^[a-f0-9]{64}$/);
  assert.equal(requirement.baselineAuthorityRequirement, "original-runtime-natural-trace");
  assert.equal(requirement.status, "pending");
  assert.equal(requirement.baselineAuthority, "unresolved");
  assert.equal(requirement.missingFrames.length, 10);
});

test("TS006 nested requirement is a conservative, natural-trace-only 1..128 obligation", () => {
  const item = {
    animationId: "course-g04-l03-ts-006",
    sequence: 34,
    nativeRuntimeFacts: {rootFrameCount: 10},
  };
  const requirement = buildPendingNestedRequirement({item, language: "en"});
  assert.equal(requirement.frameDomainId, "sprite-23");
  assert.equal(requirement.scenario, "source-static-frame");
  assert.deepEqual(requirement.requiredRange, {firstFrame: 1, lastFrame: 128});
  assert.equal(requirement.entryState.runtimeReachabilityEstablished, false);
  assert.equal(requirement.entryState.authoritativeTraceExecuted, false);
  assert.equal(requirement.entryState.parentFrameDomainId, "root");
  assert.equal(requirement.entryState.parentEntryFrameCandidate, 6);
  assert.equal(requirement.entryState.rootEntryFrame, 6);
  assert.equal(requirement.entryState.scenario, "source-static-frame");
  assert.equal(requirement.entryState.seed, "0");
  assert.equal(requirement.baselineAuthorityRequirement, "original-runtime-natural-trace");
  assert.equal(requirement.baselineAuthority, "unresolved");
  assert.equal(requirement.status, "pending");
  assert.equal(requirement.missingFrames.length, 128);
});

test("TS006 planning keeps root separate, declares sprite-23, and binds the source-proven sprite-3 disposition", () => {
  const item = {
    animationId: "course-g04-l03-ts-006",
    sequence: 34,
    nativeRuntimeFacts: {rootFrameCount: 10},
  };
  const manifest = {
    animationId: item.animationId,
    runtime: {frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default"}],
    implementation: {
      frameDomains: [{
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        parentFrameDomainId: null,
        frameCount: 10,
        scenarioIds: ["default"],
      }],
    },
  };
  const result = buildExpectedPendingCoverageDocuments({item, manifest});
  assert.deepEqual(result.manifest.implementation.frameDomains.map(({id, frameCount}) => ({id, frameCount})), [
    {id: "root", frameCount: 10},
    {id: "sprite-23", frameCount: 128},
  ]);
  assert.deepEqual(result.manifest.implementation.capturePlanning.staticCompositeTimelineIds, ["sprite-3"]);
  assert.deepEqual(result.manifest.implementation.frameDomains.map(({scenarioIds}) => scenarioIds), [
    ["root-unavailable"],
    ["source-static-frame"],
  ]);
  assert.deepEqual(result.manifest.scenarios.map(({id}) => id), ["root-unavailable", "source-static-frame"]);
  assert.deepEqual(result.manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds, []);
  assert.equal(result.manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished, true);
  assert.equal(result.coverage.requirements.length, 4);
  assert.equal(result.coverage.requirements.filter(({frameDomainId}) => frameDomainId === "sprite-23").length, 2);
  assert.deepEqual([...new Set(result.coverage.requirements.map(({scenario}) => scenario))], [
    "root-unavailable",
    "source-static-frame",
  ]);
});

test("canonical entry-state projection is independent of object insertion order", () => {
  assert.equal(canonicalJson({b: 2, a: {d: 4, c: 3}}), canonicalJson({a: {c: 3, d: 4}, b: 2}));
});

test("acceptance-neutral blocking evidence preserves only one scenario binding and the exact current-JS capture", () => {
  const scenario = {file: "audit/scenario-inventory.json", sha256: "a".repeat(64)};
  const capture = {
    file: "output/playwright/example/capture-manifest.json",
    sha256: "b".repeat(64),
  };
  assert.deepEqual(canonicalAcceptanceNeutralBlockingEvidence({
    requirementId: "req:fixture",
    captureManifest: capture.file,
    captureManifestSha256: capture.sha256,
    blockingEvidence: [capture, scenario],
  }), [scenario, capture]);
  assert.throws(() => canonicalAcceptanceNeutralBlockingEvidence({
    requirementId: "req:fixture",
    captureManifest: "",
    captureManifestSha256: "",
    blockingEvidence: [scenario, {file: "evidence/authority.json", sha256: "c".repeat(64)}],
  }), /unrecognized blocking evidence/);
});

test("CLI separates verification from receipt-only refresh", () => {
  assert.deepEqual(parseArguments(["--check"]), {check: true, refresh: false});
  assert.deepEqual(parseArguments(["--refresh"]), {check: false, refresh: true});
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
