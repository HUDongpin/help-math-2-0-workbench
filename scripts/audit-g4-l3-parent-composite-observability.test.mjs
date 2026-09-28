import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPathProbePlan,
  classifyProbeHashes,
  parseArguments,
} from "./audit-g4-l3-parent-composite-observability.mjs";

const edge = (parentTimelineId, childTimelineId, parentFrame) => ({
  parentTimelineId,
  childTimelineId,
  parentFrame,
});

test("derives the exact main frame and intermediate zero-indexed overrides", () => {
  assert.deepEqual(buildPathProbePlan({
    placementPath: [
      edge("root", "sprite-272", 6),
      edge("sprite-272", "sprite-175", 238),
      edge("sprite-175", "sprite-174", 2),
    ],
    targetTimelineId: "sprite-174",
    targetFrameCount: 10,
    pathIndex: 0,
  }), {
    prefix: "p01",
    mainFrameDomainId: "sprite-272",
    mainFrame: 238,
    targetTimelineId: "sprite-174",
    targetFunction: "sprite174",
    targetFrameCount: 10,
    intermediateFrameOverrides: {sprite175: 1},
  });
});

test("classifies dispatch, source-position visibility, and multiframe output independently", () => {
  const hashes = ["a", "b", "c", "d"].map((value) => value.repeat(64));
  assert.equal(classifyProbeHashes({
    frameHashes: [hashes[0], hashes[1]],
    hiddenHash: hashes[2],
    translatedHash: hashes[3],
  }).classification, "source-static-parent-composite-multiframe-candidate");
  assert.equal(classifyProbeHashes({
    frameHashes: [hashes[0], hashes[1]],
    hiddenHash: hashes[0],
    translatedHash: hashes[3],
  }).classification, "source-position-not-observable-in-static-parent-composite");
  assert.equal(classifyProbeHashes({
    frameHashes: [hashes[0]],
    hiddenHash: hashes[2],
    translatedHash: hashes[0],
  }).classification, "inconclusive-target-dispatch-not-observable");
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
