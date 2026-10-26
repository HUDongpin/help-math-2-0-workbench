import assert from "node:assert/strict";
import test from "node:test";

import {
  ALG_L09_VB06_DRAG_BEHAVIOR_V1,
  algL09Vb06CorrectTarget,
  createAlgL09Vb06State,
  reduceAlgL09Vb06,
} from "../src/g678-alg-l09-vb06-drag";

test("ALG L9 VB06 binds the exact two source groups and four-target domain", () => {
  assert.deepEqual(ALG_L09_VB06_DRAG_BEHAVIOR_V1.sourceGroups, {
    proportional: ["drag-2", "drag-4"],
    nonProportional: ["drag-1", "drag-3"],
  });
  assert.equal(algL09Vb06CorrectTarget("drag-2", "drop-1"), true);
  assert.equal(algL09Vb06CorrectTarget("drag-4", "drop-2"), true);
  assert.equal(algL09Vb06CorrectTarget("drag-1", "drop-3"), true);
  assert.equal(algL09Vb06CorrectTarget("drag-3", "drop-4"), true);
  assert.equal(algL09Vb06CorrectTarget("drag-1", "drop-1"), false);
  assert.equal(algL09Vb06CorrectTarget("drag-2", "drop-3"), false);
});

test("wrong placement restores the source and preserves the exact explanation class", () => {
  let state = reduceAlgL09Vb06(createAlgL09Vb06State(),
    {type: "observe-frame", frame: 129});
  state = reduceAlgL09Vb06(state,
    {type: "pick-source", sourceId: "drag-1", input: "enter"});
  state = reduceAlgL09Vb06(state, {
    type: "drop-source",
    sourceId: "drag-1",
    targetId: "drop-1",
    input: "space",
  });
  assert.equal(state.phase, "interacting");
  assert.equal(state.quizDragCount, 0);
  assert.equal(state.placements["drag-1"], undefined);
  assert.equal(state.wrongFeedback, "proportional");
  state = reduceAlgL09Vb06(state,
    {type: "dismiss-feedback", input: "mouse"});
  assert.equal(state.wrongFeedback, null);
});

test("four correct drops resolve the authored stop and resume only at frame 130", () => {
  let state = reduceAlgL09Vb06(createAlgL09Vb06State(),
    {type: "observe-frame", frame: 129});
  for (const [sourceId, targetId] of [
    ["drag-1", "drop-3"],
    ["drag-2", "drop-1"],
    ["drag-3", "drop-4"],
    ["drag-4", "drop-2"],
  ] as const) {
    state = reduceAlgL09Vb06(state, {
      type: "drop-source",
      sourceId,
      targetId,
      input: "mouse",
    });
  }
  assert.equal(state.phase, "resolved");
  assert.equal(state.quizDragCount, 4);
  assert.equal(Object.keys(state.placements).length, 4);
  state = reduceAlgL09Vb06(state, {type: "observe-frame", frame: 129});
  assert.equal(state.phase, "resolved");
  state = reduceAlgL09Vb06(state, {type: "observe-frame", frame: 130});
  assert.equal(state.phase, "resumed");
});

test("Replay resets the complete interaction vector for mouse, Enter, and Space", () => {
  for (const input of ["mouse", "enter", "space"] as const) {
    let state = reduceAlgL09Vb06(createAlgL09Vb06State(),
      {type: "observe-frame", frame: 129});
    state = reduceAlgL09Vb06(state, {
      type: "drop-source", sourceId: "drag-2", targetId: "drop-1", input,
    });
    state = reduceAlgL09Vb06(state, {type: "replay", input});
    assert.equal(state.phase, "playing");
    assert.equal(state.quizDragCount, 0);
    assert.deepEqual(state.placements, {});
    assert.equal(state.replay, 1);
  }
});
