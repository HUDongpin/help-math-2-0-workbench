import assert from "node:assert/strict";
import test from "node:test";

import {
  buildClosedManifest,
  parseArguments,
} from "./materialize-g4-l3-frame-domain-planning-closure.mjs";

function fixture() {
  const manifest = {
    animationId: "course-g04-l03-fixture",
    implementation: {
      candidateState: {status: "current-javascript-engineering-candidate-only"},
      frameDomains: [
        {id: "root", sourceTimelineId: "root"},
        {id: "sprite-2", sourceTimelineId: "sprite-2"},
      ],
      capturePlanning: {
        nestedFrameDomainDispositionEstablished: false,
        staticCompositeTimelineIds: ["sprite-3"],
        sourceStaticCompositeCandidateTimelineIds: ["sprite-3"],
        unresolvedTimelineCandidateIds: ["sprite-3"],
        strictAcceptanceEffect: "none",
      },
    },
  };
  const disposition = {
    animationId: manifest.animationId,
    status: "structurally-enumerated",
    summary: {dispositionCounts: {"declared-frame-domain": 2, "composite-child-with-parent": 2, "independent-required": 0, nonvisual: 0, unresolved: 0}},
    timelines: [
      {timelineId: "root", sourceTimelineId: "root", disposition: "declared-frame-domain"},
      {timelineId: "sprite-2", sourceTimelineId: "sprite-2", disposition: "declared-frame-domain"},
      {timelineId: "sprite-10", sourceTimelineId: "sprite-10", disposition: "composite-child-with-parent"},
      {timelineId: "sprite-3", sourceTimelineId: "sprite-3", disposition: "composite-child-with-parent"},
    ],
    strictAcceptanceEffect: "none; fixture",
  };
  return {manifest, disposition};
}

test("planning closure replaces stale unresolved candidates with exact sorted composite IDs", () => {
  const {manifest, disposition} = fixture();
  const result = buildClosedManifest({manifest, disposition});
  assert.deepEqual(result.compositeIds, ["sprite-3", "sprite-10"]);
  assert.deepEqual(result.manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds, []);
  assert.equal(result.manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished, true);
  assert.equal(result.manifest.implementation.capturePlanning.authoritativeRuntimeFrameDomainDispositionEstablished, false);
  assert.equal(result.manifest.implementation.capturePlanning.runtimeReachabilityEstablished, false);
  assert.equal(result.manifest.implementation.capturePlanning.strictAcceptanceEffect, "none");
});

test("planning closure rejects a disposition with any unresolved timeline", () => {
  const {manifest, disposition} = fixture();
  disposition.status = "structurally-enumerated-dispositions-unresolved";
  disposition.summary.dispositionCounts.unresolved = 1;
  assert.throws(() => buildClosedManifest({manifest, disposition}), /not a zero-unresolved/);
});

test("planning closure rejects a manifest whose declared domain set is incomplete", () => {
  const {manifest, disposition} = fixture();
  manifest.implementation.frameDomains.pop();
  assert.throws(() => buildClosedManifest({manifest, disposition}), /do not exactly match/);
});

test("planning closure CLI separates verification from receipt-only refresh", () => {
  assert.deepEqual(parseArguments([]), {check: false, refresh: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, refresh: false});
  assert.deepEqual(parseArguments(["--refresh"]), {check: false, refresh: true});
  assert.throws(() => parseArguments(["--check", "--refresh"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
