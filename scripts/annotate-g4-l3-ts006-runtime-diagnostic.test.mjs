import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArguments,
  validateObservationSpec,
} from "./annotate-g4-l3-ts006-runtime-diagnostic.mjs";

test("TS006 diagnostic observation parser requires a bounded session root", () => {
  assert.deepEqual(parseArguments(["--session-root", "artifacts/full-frame/g4-l3/session", "--check"]), {
    sessionRoot: "artifacts/full-frame/g4-l3/session",
    check: true,
  });
  assert.throws(() => parseArguments([]), /session-root is required/u);
  assert.throws(() => parseArguments(["--session-root", "x", "--promote"]), /Unknown option/u);
});

test("TS006 diagnostic observations encode three repeated reveal runs", () => {
  assert.equal(validateObservationSpec(), true);
});

test("TS006 observation validation rejects timing drift or reordered phases", () => {
  const makeRun = (id, kind, baseFrame, offset = 0) => ({
    id,
    kind,
    baseFrame,
    boundaryFrames: {},
    phases: {
      checkYourWork: {firstVisible: baseFrame + 13 + offset, fullyVisible: baseFrame + 22},
      strategiesHeading: {firstVisible: baseFrame + 103, fullyVisible: baseFrame + 109},
      strategyList: {firstVisible: baseFrame + 139, fullyVisible: baseFrame + 145},
      showYourWorkPulse: {firstVisible: baseFrame + 236, firstPulseVariantA: baseFrame + 240, firstPulseVariantB: baseFrame + 241},
    },
  });
  const runs = [
    makeRun("first", "natural-navigation", 100),
    makeRun("replay", "replay", 500),
    makeRun("reentry", "navigation-reentry", 900, 1),
  ];
  assert.throws(() => validateObservationSpec(runs), /check-your-work first-visible offset/u);
});
