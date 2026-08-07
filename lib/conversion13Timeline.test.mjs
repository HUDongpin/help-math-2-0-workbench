import assert from "node:assert/strict";
import test from "node:test";

import {
  QUART_GALLON_FLASH_MOVIE,
  QUART_GALLON_FORMULAS,
  getQuartGallonFrameState,
  getQuartGallonFrameStateAtFrame,
  restartQuartGallonTimeline,
} from "./conversion13Timeline.js";

const elapsedAtFrame = (frame) =>
  ((frame - 1) * 1000) / QUART_GALLON_FLASH_MOVIE.fps + 0.001;

test("Conversion_1_3 preserves shipped SWF metadata pending an independent cold-start FLA audit", () => {
  assert.deepEqual(QUART_GALLON_FLASH_MOVIE.stage, { width: 780, height: 379 });
  assert.equal(QUART_GALLON_FLASH_MOVIE.fps, 12);
  assert.equal(QUART_GALLON_FLASH_MOVIE.frameCount, 170);
  assert.equal(QUART_GALLON_FLASH_MOVIE.durationMs, 14167);
});

test("Conversion_1_3 maps elapsed time to exact one-indexed Flash frames", () => {
  for (const frame of [1, 8, 16, 34, 35, 43, 44, 62, 74, 92, 104, 122, 148, 160, 162, 170]) {
    assert.equal(getQuartGallonFrameState(elapsedAtFrame(frame)).frame, frame);
  }
});

test("Conversion_1_3 reproduces all four independently timed quart cycles", () => {
  const phases = (frame) =>
    getQuartGallonFrameStateAtFrame(frame).bottles.map((bottle) => bottle.phase);

  assert.deepEqual(phases(1), ["full", "full", "full", "full"]);
  assert.equal(phases(9)[0], "moving");
  assert.equal(phases(17)[0], "pouring");
  assert.equal(phases(36)[0], "returning");
  assert.equal(phases(45)[0], "empty");

  assert.equal(phases(37)[1], "moving");
  assert.equal(phases(45)[1], "pouring");
  assert.equal(phases(64)[1], "returning");
  assert.equal(phases(75)[1], "empty");

  assert.equal(phases(67)[2], "moving");
  assert.equal(phases(75)[2], "pouring");
  assert.equal(phases(94)[2], "returning");
  assert.equal(phases(106)[2], "empty");

  assert.equal(phases(94)[3], "moving");
  assert.equal(phases(105)[3], "pouring");
  assert.equal(phases(124)[3], "returning");
  assert.equal(phases(137)[3], "empty");
});

test("Conversion_1_3 retains recovered movement and settle matrices", () => {
  assert.deepEqual(getQuartGallonFrameStateAtFrame(9).bottles[0].matrix, [
    0.97706604, 0.207962036, -0.207962036, 0.97706604, 92.2, 113.7,
  ]);
  assert.deepEqual(getQuartGallonFrameStateAtFrame(104).bottles[3].matrix, [
    -0.00929260254, 0.998001099, -0.998001099, -0.00929260254, 501.55, 24.85,
  ]);
  assert.equal(getQuartGallonFrameStateAtFrame(129).bottles[3].opacity, 0);
  assert.equal(getQuartGallonFrameStateAtFrame(136).bottles[3].opacity, 1);
  assert.equal(getQuartGallonFrameStateAtFrame(1).sourceFrame, 1);
  assert.equal(getQuartGallonFrameStateAtFrame(170).sourceFrame, 169);
});

test("Conversion_1_3 fills the gallon in four source-timed quarters", () => {
  assert.equal(getQuartGallonFrameStateAtFrame(16).gallonProgress, 0);
  assert.equal(getQuartGallonFrameStateAtFrame(35).gallonProgress, 0.25);
  assert.equal(getQuartGallonFrameStateAtFrame(63).gallonProgress, 0.5);
  assert.equal(getQuartGallonFrameStateAtFrame(93).gallonProgress, 0.75);
  assert.equal(getQuartGallonFrameStateAtFrame(123).gallonProgress, 1);
});

test("Conversion_1_3 reproduces final formula and Replay alpha values", () => {
  assert.equal(getQuartGallonFrameStateAtFrame(149).finalFormulaOpacity, 0);
  assert.equal(getQuartGallonFrameStateAtFrame(150).finalFormulaOpacity, 21 / 256);
  assert.equal(getQuartGallonFrameStateAtFrame(161).finalFormulaOpacity, 1);
  assert.equal(getQuartGallonFrameStateAtFrame(163).replayOpacity, 0);
  assert.equal(getQuartGallonFrameStateAtFrame(164).replayOpacity, 32 / 256);
  assert.equal(getQuartGallonFrameStateAtFrame(170).replayOpacity, 224 / 256);
  assert.equal(getQuartGallonFrameStateAtFrame(170).isComplete, true);
});

test("Conversion_1_3 keeps English visible while host Spanish mode adds Mc_SD", () => {
  const english = getQuartGallonFrameStateAtFrame(170, { spanishFormulaFlag: "off" });
  const spanish = getQuartGallonFrameStateAtFrame(170, { spanishFormulaFlag: "ON" });
  assert.equal(english.formulaText, QUART_GALLON_FORMULAS.en);
  assert.equal(english.spanishFormulaVisible, false);
  assert.equal(spanish.formulaText, QUART_GALLON_FORMULAS.es);
  assert.equal(spanish.spanishFormulaVisible, true);
});

test("Conversion_1_3 keeps source Mc_SD enabled across every Spanish root frame", () => {
  for (let frame = 1; frame <= QUART_GALLON_FLASH_MOVIE.frameCount; frame += 1) {
    const state = getQuartGallonFrameStateAtFrame(frame, { spanishFormulaFlag: "ON" });
    assert.equal(state.spanishFormulaVisible, true, `frame ${frame}`);
    assert.equal(state.formulaText, QUART_GALLON_FORMULAS.es, `frame ${frame}`);
  }
});

test("Conversion_1_3 Replay resets deterministically", () => {
  const state = restartQuartGallonTimeline({ spanishFormulaFlag: "ON" });
  assert.equal(state.frame, 1);
  assert.equal(state.isComplete, false);
  assert.equal(state.spanishFormulaVisible, true);
  assert.deepEqual(state.bottles.map((bottle) => bottle.phase), [
    "full", "full", "full", "full",
  ]);
});
