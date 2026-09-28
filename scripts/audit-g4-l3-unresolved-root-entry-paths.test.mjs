import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArguments,
  summarizeRootEntryPaths,
} from "./audit-g4-l3-unresolved-root-entry-paths.mjs";

const edge = (parentTimelineId, childTimelineId, parentFrame, instanceName = "") => ({
  parentTimelineId,
  childTimelineId,
  parentFrame,
  instanceName,
});

test("accepts multiple complete paths only when they prove one lesson-host root frame", () => {
  const result = summarizeRootEntryPaths([
    [edge("root", "sprite-10", 6, "animation"), edge("sprite-10", "sprite-20", 2)],
    [edge("root", "sprite-10", 6, "animation"), edge("sprite-10", "sprite-20", 12)],
  ], "sprite-20");
  assert.deepEqual(result, {pathCount: 2, rootEntryFrame: 6, rootInstanceName: "animation"});
});

test("fails closed on conflicting root frames, wrong hosts, and discontinuous paths", () => {
  assert.throws(() => summarizeRootEntryPaths([
    [edge("root", "sprite-20", 6, "animation")],
    [edge("root", "sprite-20", 8, "animation")],
  ], "sprite-20"), /ambiguous/);
  assert.throws(() => summarizeRootEntryPaths([
    [edge("root", "sprite-20", 6, "other")],
  ], "sprite-20"), /lesson animation host/);
  assert.throws(() => summarizeRootEntryPaths([
    [edge("root", "sprite-10", 6, "animation"), edge("sprite-11", "sprite-20", 2)],
  ], "sprite-20"), /discontinuous/);
});

test("fails closed when the target is unreachable", () => {
  assert.throws(() => summarizeRootEntryPaths([], "sprite-20"), /no root placement path/);
});

test("CLI is check-by-default and write is explicit", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});
