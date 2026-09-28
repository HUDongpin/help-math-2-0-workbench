import assert from "node:assert/strict";
import test from "node:test";

import {
  NATURAL_PARENT_COMPOSITE_CONFIGS,
  parseArguments,
  run,
} from "./build-g4-l3-natural-parent-composite-assets.mjs";

test("natural parent-composite batch fixes 30 visible and two nonvisual domains", () => {
  const timelineIds = NATURAL_PARENT_COMPOSITE_CONFIGS.flatMap(({paths}) =>
    paths.map(({targetTimelineId}) => targetTimelineId));
  assert.equal(timelineIds.length, 32);
  assert.equal(timelineIds.includes("sprite-42"), true);
  assert.equal(timelineIds.includes("sprite-37"), true);
  assert.deepEqual(timelineIds.slice(0, 6),
    ["sprite-136", "sprite-176", "sprite-68", "sprite-108", "sprite-284", "sprite-324"]);
  assert.deepEqual(timelineIds.slice(-4),
    ["sprite-350", "sprite-382", "sprite-415", "sprite-439"]);
  assert.equal(
    NATURAL_PARENT_COMPOSITE_CONFIGS.flatMap(({paths}) => paths)
      .reduce((sum, {targetFrameCount}) => sum + targetFrameCount, 0),
    1037,
  );
});

test("natural parent-composite assets rebuild deterministically", async () => {
  const report = await run();
  assert.equal(report.summary.assetCount, 9);
  assert.equal(report.summary.domainCount, 32);
  assert.equal(report.summary.sourceVisibleDomainCount, 30);
  assert.equal(report.summary.nonvisualDomainCount, 2);
  assert.equal(report.summary.frameIdentityCount, 1037);
  assert.equal(report.summary.authoritativeRuntimeSessions, 0);
  assert.equal(report.acceptance.fidelityAccepted, false);
  assert.equal(report.acceptance.audioAccepted, false);
  assert.equal(report.acceptance.humanVisualAccepted, false);
  assert.equal(report.acceptance.ownerAccepted, false);
  assert.equal(report.acceptance.strictComplete, false);
});

test("natural parent-composite CLI is fail closed", () => {
  assert.deepEqual(parseArguments([]), {write: false});
  assert.deepEqual(parseArguments(["--write"]), {write: true});
  assert.throws(() => parseArguments(["--publish"]), /Unknown option/);
  assert.throws(() => parseArguments(["--write", "extra"]), /zero arguments/);
});
