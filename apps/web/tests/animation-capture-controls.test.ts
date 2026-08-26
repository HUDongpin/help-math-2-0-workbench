import assert from "node:assert/strict";
import test from "node:test";

import {buildCaptureFrameLinks} from "../lib/animation-capture-controls";

test("capture frame links stay unique for one- and two-frame domains", () => {
  assert.deepEqual(buildCaptureFrameLinks(1), [1]);
  assert.deepEqual(buildCaptureFrameLinks(2), [1, 2]);
  assert.deepEqual(buildCaptureFrameLinks(3), [1, 2, 3]);
  assert.deepEqual(buildCaptureFrameLinks(278), [1, 139, 278]);
});

test("capture frame links reject invalid source frame counts", () => {
  for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildCaptureFrameLinks(value),
      /frameCount must be a positive safe integer/,
    );
  }
});
