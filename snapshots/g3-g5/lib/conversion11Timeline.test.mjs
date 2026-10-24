import assert from "node:assert/strict";
import test from "node:test";

import {
  CUP_CARTON_SOURCE_MATRIX,
  CUP_FLASH_MOVIE,
  CUP_FORMULAS,
  getCupFrameState,
  getCupFrameStateAtFrame,
  restartCupTimeline,
} from "./conversion11Timeline.js";

const elapsedAtFrame = (frame) =>
  ((frame - 1) * 1000) / CUP_FLASH_MOVIE.fps + 0.001;

test("Conversion_1_1 preserves shipped SWF metadata after a cold-start FLA audit", () => {
  assert.deepEqual(CUP_FLASH_MOVIE.stage, { width: 780, height: 379 });
  assert.equal(CUP_FLASH_MOVIE.fps, 12);
  assert.equal(CUP_FLASH_MOVIE.frameCount, 94);
  assert.equal(CUP_FLASH_MOVIE.durationMs, 7833);
});

test("Conversion_1_1 maps elapsed time to exact one-indexed Flash frames", () => {
  for (const frame of [1, 9, 10, 15, 38, 39, 44, 45, 57, 73, 84, 86, 94]) {
    assert.equal(getCupFrameState(elapsedAtFrame(frame)).frame, frame);
  }
});

test("Conversion_1_1 maps corrected Adobe frames to recovered root matrices", () => {
  assert.equal(getCupFrameStateAtFrame(10).cartonPhase, "resting");
  assert.equal(getCupFrameStateAtFrame(11).cartonPhase, "moving-to-cup");
  assert.deepEqual(getCupFrameStateAtFrame(11).cartonMatrix, [
    0.951049805, -0.305908203, 0.305908203, 0.951049805, 235, 67.95,
  ]);
  assert.equal(getCupFrameStateAtFrame(16).cartonPhase, "pouring");
  assert.equal(getCupFrameStateAtFrame(39).pourVisible, true);
  assert.equal(getCupFrameStateAtFrame(40).cartonPhase, "returning");
  assert.equal(getCupFrameStateAtFrame(45).cartonPhase, "returning");
  assert.deepEqual(getCupFrameStateAtFrame(45).cartonMatrix, CUP_CARTON_SOURCE_MATRIX);
  assert.equal(getCupFrameStateAtFrame(46).cartonPhase, "resting");
  assert.equal(getCupFrameStateAtFrame(1).sourceFrame, 1);
  assert.equal(getCupFrameStateAtFrame(10).sourceFrame, 9);
  assert.equal(getCupFrameStateAtFrame(94).sourceFrame, 93);
});

test("Conversion_1_1 reproduces callout, emphasis, formula, and Replay beats", () => {
  assert.equal(getCupFrameStateAtFrame(46).ouncesCalloutOpacity, 0);
  assert.equal(getCupFrameStateAtFrame(47).ouncesCalloutOpacity, 37 / 256);
  assert.equal(getCupFrameStateAtFrame(53).ouncesCalloutOpacity, 1);
  assert.equal(getCupFrameStateAtFrame(66).ouncesCalloutOpacity, 224 / 256);
  assert.equal(getCupFrameStateAtFrame(73).ouncesCalloutOpacity, 0);
  assert.equal(getCupFrameStateAtFrame(58).cupHighlightVisible, true);
  assert.equal(getCupFrameStateAtFrame(59).cupHighlightVisible, false);
  assert.equal(getCupFrameStateAtFrame(51).stageVisible, true);
  assert.equal(getCupFrameStateAtFrame(52).stageVisible, false);
  assert.equal(getCupFrameStateAtFrame(53).stageVisible, false);
  assert.equal(getCupFrameStateAtFrame(54).stageVisible, true);

  assert.equal(getCupFrameStateAtFrame(74).finalFormulaOpacity, 0);
  assert.equal(getCupFrameStateAtFrame(75).finalFormulaOpacity, 23 / 256);
  assert.equal(getCupFrameStateAtFrame(85).finalFormulaOpacity, 1);
  assert.equal(getCupFrameStateAtFrame(87).replayOpacity, 0);
  assert.equal(getCupFrameStateAtFrame(88).replayOpacity, 32 / 256);
  assert.equal(getCupFrameStateAtFrame(94).replayOpacity, 224 / 256);
  assert.equal(getCupFrameStateAtFrame(94).isComplete, true);
});

test("Conversion_1_1 preserves host-controlled bilingual panel semantics", () => {
  const english = getCupFrameStateAtFrame(94, { spanishFormulaFlag: "off" });
  const spanish = getCupFrameStateAtFrame(94, { spanishFormulaFlag: "ON" });
  assert.equal(english.formulaText, CUP_FORMULAS.en);
  assert.equal(english.spanishFormulaVisible, false);
  assert.equal(spanish.formulaText, CUP_FORMULAS.es);
  assert.equal(spanish.spanishFormulaVisible, true);
});

test("Conversion_1_1 keeps source Mc_SD enabled across every Spanish root frame, including blank dynamic beats", () => {
  for (let frame = 1; frame <= CUP_FLASH_MOVIE.frameCount; frame += 1) {
    const state = getCupFrameStateAtFrame(frame, { spanishFormulaFlag: "ON" });
    assert.equal(state.spanishFormulaVisible, true, `frame ${frame}`);
    assert.equal(state.formulaText, CUP_FORMULAS.es, `frame ${frame}`);
  }
  assert.equal(getCupFrameStateAtFrame(52, { spanishFormulaFlag: "ON" }).stageVisible, false);
  assert.equal(getCupFrameStateAtFrame(53, { spanishFormulaFlag: "ON" }).stageVisible, false);
});

test("Conversion_1_1 Replay resets to frame 1 without changing language context", () => {
  const state = restartCupTimeline({ spanishFormulaFlag: "ON" });
  assert.equal(state.frame, 1);
  assert.equal(state.isComplete, false);
  assert.equal(state.spanishFormulaVisible, true);
  assert.equal(state.replayVisible, false);
});
