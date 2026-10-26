import assert from "node:assert/strict";
import test from "node:test";

import {createNmsL09P003Clock, NMS_L09_P003_AUTHORITY,
  NMS_L09_P003_SOURCE, reduceNmsL09P003Clock} from
  "./shared-nms002-l09-p003-source-clock";

test("binds the direct root placement, terminal, and nested domains", () => {
  assert.equal(NMS_L09_P003_SOURCE.rootBeginFrame, 6);
  assert.equal(NMS_L09_P003_SOURCE.mainFrameDomain, "sprite-246");
  assert.equal(NMS_L09_P003_SOURCE.mainFrameCount, 635);
  assert.deepEqual(NMS_L09_P003_SOURCE.rootPlacedCharacterIds,
    [246, 247, 249, 250]);
  assert.deepEqual(NMS_L09_P003_SOURCE.nestedSpriteIds,
    [10, 23, 28, 55, 74, 88, 101, 241]);
  assert.equal(NMS_L09_P003_SOURCE.rootSiblingSpriteId, 249);
});

test("source terminal holds, replay resets, and host resume stays deterministic", () => {
  let clock = createNmsL09P003Clock(634);
  clock = reduceNmsL09P003Clock(clock,
    {type: "synchronize-frame", frame: 635});
  assert.equal(clock.playing, false);
  assert.equal(reduceNmsL09P003Clock(clock,
    {type: "synchronize-frame", frame: 1}), clock);
  clock = reduceNmsL09P003Clock(clock, {type: "replay"});
  assert.deepEqual({frame: clock.frame, playing: clock.playing,
    revision: clock.revision, control: clock.modernLessonControl},
  {frame: 1, playing: true, revision: 1, control: "replay"});
  clock = reduceNmsL09P003Clock(clock, {type: "pause"});
  assert.equal(clock.playing, false);
  clock = reduceNmsL09P003Clock(clock, {type: "resume", frame: 300});
  assert.equal(clock.frame, 300);
  assert.equal(clock.playing, true);
  assert.equal(clock.audioEnabled, false);
});

test("invalid frames and mutated states fail closed", () => {
  for (const frame of [0, 636, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => createNmsL09P003Clock(frame), /invalid.*frame/u);
  }
  assert.throws(() => reduceNmsL09P003Clock(createNmsL09P003Clock(),
    {type: "resume", frame: 0}), /invalid.*frame/u);
  assert.throws(() => reduceNmsL09P003Clock({...createNmsL09P003Clock(),
    audioEnabled: false}, {type: "replay"}), /invalid.*state/u);
});

test("clock implementation does not expand acceptance", () => {
  assert.equal(NMS_L09_P003_AUTHORITY.currentJavaScriptRegistered, false);
  assert.equal(NMS_L09_P003_AUTHORITY.rootAndNestedVisualCompositingEstablished,
    false);
  assert.equal(NMS_L09_P003_AUTHORITY.sourceAudioAccepted, false);
  assert.equal(NMS_L09_P003_AUTHORITY.strictComplete, false);
});
