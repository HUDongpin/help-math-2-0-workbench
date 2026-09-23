import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExpectedPendingCoverageDocuments,
  buildPendingRootRequirement,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";
import {
  parseArguments,
  validateExpected,
  validateRootOnlyPreimage,
} from "./materialize-g4-l3-ts006-pending-domain-coverage.mjs";

function fixture() {
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
  const coverage = {
    schemaVersion: 2,
    animationId: item.animationId,
    requirements: ["en", "es"].map((language) => buildPendingRootRequirement({item, language})),
  };
  return {item, manifest, coverage};
}

test("TS006 upgrader accepts only the exact two-requirement root-only preimage", () => {
  const input = fixture();
  assert.doesNotThrow(() => validateRootOnlyPreimage(input));

  const withNestedDomain = structuredClone(input);
  withNestedDomain.manifest.implementation.frameDomains.push({id: "sprite-23", frameCount: 128});
  assert.throws(() => validateRootOnlyPreimage(withNestedDomain), /root-only planning state/);

  const withAuthorityClaim = structuredClone(input);
  withAuthorityClaim.coverage.requirements[0].baselineAuthority = "original-runtime-natural-trace";
  assert.throws(() => validateRootOnlyPreimage(withAuthorityClaim), /exact two-requirement root-only preimage/);
});

test("TS006 expected state remains four pending requirements with sprite-3 source-dispositioned", () => {
  const input = fixture();
  const expected = buildExpectedPendingCoverageDocuments({item: input.item, manifest: input.manifest});
  assert.doesNotThrow(() => validateExpected({item: input.item, ...expected}));

  const promoted = structuredClone(expected);
  promoted.coverage.requirements[2].status = "complete";
  assert.throws(() => validateExpected({item: input.item, ...promoted}), /non-capture requirement fields drifted|differs from the pending-domain plan/);

  assert.equal(expected.manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished, true);
  assert.deepEqual(expected.manifest.implementation.capturePlanning.staticCompositeTimelineIds, ["sprite-3"]);
  assert.deepEqual(expected.manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds, []);
  assert.deepEqual(expected.manifest.scenarios.map(({id}) => id), ["root-unavailable", "source-static-frame"]);
  assert.deepEqual(expected.coverage.requirements.map(({scenario}) => scenario), [
    "root-unavailable",
    "root-unavailable",
    "source-static-frame",
    "source-static-frame",
  ]);

  const reopenedDisposition = structuredClone(expected);
  reopenedDisposition.manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished = false;
  assert.throws(() => validateExpected({item: input.item, ...reopenedDisposition}), /differs from the pending-domain plan/);
});

test("TS006 upgrader CLI has no acceptance-promotion mode and refresh is receipt-only", () => {
  assert.deepEqual(parseArguments([]), {check: false, refresh: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, refresh: false});
  assert.deepEqual(parseArguments(["--refresh"]), {check: false, refresh: true});
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
