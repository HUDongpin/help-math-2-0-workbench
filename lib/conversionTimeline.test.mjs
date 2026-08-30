import assert from "node:assert/strict";
import test from "node:test";

import {
  FLASH_MOVIE,
  GALLON_FLASH_MOVIE,
  LITER_FLASH_MOVIE,
  getConversionFrameState,
  getFormulaText,
  getGallonFormulaText,
  getGallonFrameState,
  getGraduatedCylinderMarks,
  getCupMeasureMarks,
  getLiterFormulaText,
  getLiterFrameState,
  restartTimeline,
  restartGallonTimeline,
  restartLiterTimeline,
} from "./conversionTimeline.js";

const elapsedAtFrame = (frame) =>
  ((frame - 1) * 1000) / LITER_FLASH_MOVIE.fps + 0.001;

test("preserves the original Flash movie timing and stage metadata", () => {
  assert.deepEqual(FLASH_MOVIE.stage, { width: 780, height: 379 });
  assert.equal(FLASH_MOVIE.fps, 12);
  assert.equal(FLASH_MOVIE.frameCount, 94);
  assert.equal(FLASH_MOVIE.durationMs, 7833);
});

test("selects the Spanish formula when the old Flash flag is ON", () => {
  assert.equal(
    getFormulaText({ spanishFormulaFlag: "ON" }),
    "1 taza = 8 onzas líquidas",
  );
  assert.equal(
    getFormulaText({ spanishFormulaFlag: "off" }),
    "1 cup = 8 fluid ounces",
  );
});

test("maps elapsed time to the observed conversion animation beats", () => {
  const intro = getConversionFrameState(0, { spanishFormulaFlag: "off" });
  assert.equal(intro.frame, 1);
  assert.equal(intro.formulaText, "1 cup = 8 fluid ounces");
  assert.equal(intro.milkCartonVisible, true);
  assert.equal(intro.ouncesLabelVisible, false);
  assert.equal(intro.replayVisible, false);
  assert.equal(intro.pourProgress, 0);

  const ouncesBeat = getConversionFrameState(3750, {
    spanishFormulaFlag: "off",
  });
  assert.equal(ouncesBeat.frame, 45);
  assert.equal(ouncesBeat.ouncesLabelVisible, true);
  assert.ok(ouncesBeat.pourProgress > 0.35);

  const formulaBeat = getConversionFrameState(6083, {
    spanishFormulaFlag: "off",
  });
  assert.equal(formulaBeat.frame, 73);
  assert.equal(formulaBeat.finalFormulaVisible, true);

  const ending = getConversionFrameState(9000, { spanishFormulaFlag: "ON" });
  assert.equal(ending.frame, 94);
  assert.equal(ending.isComplete, true);
  assert.equal(ending.replayVisible, true);
  assert.equal(ending.formulaText, "1 taza = 8 onzas líquidas");
});

test("restartTimeline models the Replay button returning to frame 1", () => {
  const state = restartTimeline({ spanishFormulaFlag: "ON" });
  assert.equal(state.frame, 1);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.isComplete, false);
  assert.equal(state.formulaText, "1 taza = 8 onzas líquidas");
});

test("keeps measuring cup labels inside the slanted cup wall", () => {
  for (const mark of getCupMeasureMarks()) {
    assert.ok(
      mark.labelX >= mark.leftWallX + 12,
      `${mark.value} label should sit inside the cup instead of crossing the left wall`,
    );
    assert.ok(
      mark.lineX1 >= mark.labelX + 18,
      `${mark.value} tick should begin after the label`,
    );
    assert.ok(
      mark.lineX2 <= mark.rightWallX - 12,
      `${mark.value} tick should stay inside the cup`,
    );
  }
});

test("preserves the Conversion_1_4 Flash timing and stage metadata", () => {
  assert.deepEqual(LITER_FLASH_MOVIE.stage, { width: 780, height: 379 });
  assert.equal(LITER_FLASH_MOVIE.fps, 12);
  assert.equal(LITER_FLASH_MOVIE.frameCount, 67);
  assert.equal(LITER_FLASH_MOVIE.durationMs, 5583);
});

test("maps elapsed time to Flash's one-indexed 12 fps frames", () => {
  for (const frame of [1, 2, 8, 39, 43, 51, 59, 67]) {
    assert.equal(getLiterFrameState(elapsedAtFrame(frame)).frame, frame);
  }
});

test("reproduces the original SWF fades and liquid keyframes", () => {
  const at = (frame) => getLiterFrameState(elapsedAtFrame(frame));

  assert.equal(at(1).pitcherOpacity, 0);
  assert.equal(at(6).pitcherOpacity, 1);
  assert.equal(at(55).pitcherOpacity, 205 / 256);
  assert.equal(at(59).pitcherOpacity, 0);

  assert.equal(at(8).surfaceY, 233.95);
  assert.equal(at(9).surfaceY, 228.8);
  assert.equal(at(39).surfaceY, 77.45);
  assert.equal(at(39).pourOpacity, 1);
  assert.equal(at(40).pourOpacity, 171 / 256);
  assert.equal(at(42).pourOpacity, 0);

  assert.equal(at(43).formulaOpacity, 0);
  assert.equal(at(44).formulaOpacity, 32 / 256);
  assert.equal(at(51).formulaOpacity, 1);

  assert.equal(at(59).replayOpacity, 0);
  assert.equal(at(60).replayOpacity, 32 / 256);
  assert.equal(at(67).replayOpacity, 1);
});

test("selects the Spanish liter formula when the old Flash flag is ON", () => {
  assert.equal(
    getLiterFormulaText({ spanishFormulaFlag: "ON" }),
    "1 litro = 1000 mililitros",
  );
  assert.equal(
    getLiterFormulaText({ spanishFormulaFlag: "off" }),
    "1 liter = 1000 milliliters",
  );
});

test("maps elapsed time to the observed liter conversion animation beats", () => {
  const intro = getLiterFrameState(0, { spanishFormulaFlag: "off" });
  assert.equal(intro.frame, 1);
  assert.equal(intro.formulaText, "1 liter = 1000 milliliters");
  assert.equal(intro.fillVisible, false);
  assert.equal(intro.finalFormulaVisible, false);
  assert.equal(intro.replayVisible, false);
  assert.equal(intro.fillProgress, 0);

  const fillBeat = getLiterFrameState(1500, { spanishFormulaFlag: "off" });
  assert.equal(fillBeat.frame, 19);
  assert.equal(fillBeat.fillVisible, true);
  assert.ok(fillBeat.fillProgress > 0.3);
  assert.ok(fillBeat.surfaceY < fillBeat.emptySurfaceY);

  const formulaBeat = getLiterFrameState(elapsedAtFrame(44), {
    spanishFormulaFlag: "off",
  });
  assert.equal(formulaBeat.frame, 44);
  assert.equal(formulaBeat.finalFormulaVisible, true);
  assert.equal(formulaBeat.fillProgress, 1);

  const ending = getLiterFrameState(7000, { spanishFormulaFlag: "ON" });
  assert.equal(ending.frame, 67);
  assert.equal(ending.isComplete, true);
  assert.equal(ending.replayVisible, true);
  assert.equal(ending.formulaText, "1 litro = 1000 mililitros");
});

test("keeps graduated cylinder labels ordered and inside the stage", () => {
  const marks = getGraduatedCylinderMarks();
  assert.equal(marks.length, 10);
  assert.equal(marks[0].label, "100");
  assert.equal(marks.at(-1).label, "1,000");
  assert.deepEqual(marks[0], {
    value: 100,
    label: "100",
    y: 225.05,
    textY: 233.05,
    labelX: 105.75,
    tickY: 228.6,
    tickX1: 84.35,
    tickX2: 128.15,
  });

  for (let index = 1; index < marks.length; index += 1) {
    assert.ok(
      marks[index].y < marks[index - 1].y,
      `${marks[index].label} should appear above ${marks[index - 1].label}`,
    );
  }

  for (const mark of marks) {
    assert.ok(mark.labelX >= 96, `${mark.label} label should not overflow left`);
    assert.ok(mark.labelX <= 150, `${mark.label} label should not overflow right`);
    assert.ok(mark.tickX2 <= 146, `${mark.label} tick should stay near cylinder`);
  }
});

test("restartLiterTimeline models the Replay button returning to frame 1", () => {
  const state = restartLiterTimeline({ spanishFormulaFlag: "ON" });
  assert.equal(state.frame, 1);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.isComplete, false);
  assert.equal(state.formulaText, "1 litro = 1000 mililitros");
});

test("preserves the Conversion_1_2 Flash timing and stage metadata", () => {
  assert.deepEqual(GALLON_FLASH_MOVIE.stage, { width: 780, height: 379 });
  assert.equal(GALLON_FLASH_MOVIE.fps, 12);
  assert.equal(GALLON_FLASH_MOVIE.frameCount, 109);
  assert.equal(GALLON_FLASH_MOVIE.durationMs, 9083);
});

test("maps Conversion_1_2 elapsed time to exact one-indexed frames", () => {
  const at = (frame) =>
    getGallonFrameState(((frame - 1) * 1000) / GALLON_FLASH_MOVIE.fps + 0.001);

  for (const frame of [1, 5, 10, 17, 25, 41, 55, 66, 88, 100, 101, 109]) {
    assert.equal(at(frame).frame, frame);
  }
});

test("reproduces all four quart bottle phases", () => {
  const at = (frame) =>
    getGallonFrameState(((frame - 1) * 1000) / GALLON_FLASH_MOVIE.fps + 0.001);

  assert.deepEqual(at(1).bottles.map((bottle) => bottle.phase), [
    "full",
    "full",
    "full",
    "full",
  ]);
  assert.equal(at(5).bottles[0].phase, "moving");
  assert.equal(at(10).bottles[0].phase, "pouring");
  assert.equal(at(20).bottles[0].phase, "returning");
  assert.equal(at(25).bottles[0].phase, "empty");

  assert.equal(at(19).bottles[1].phase, "moving");
  assert.equal(at(25).bottles[1].phase, "pouring");
  assert.equal(at(36).bottles[1].phase, "returning");
  assert.equal(at(41).bottles[1].phase, "empty");

  assert.equal(at(35).bottles[2].phase, "moving");
  assert.equal(at(41).bottles[2].phase, "pouring");
  assert.equal(at(50).bottles[2].phase, "returning");
  assert.equal(at(56).bottles[2].phase, "empty");

  assert.equal(at(49).bottles[3].phase, "moving");
  assert.equal(at(55).bottles[3].phase, "pouring");
  assert.equal(at(68).bottles[3].phase, "returning");
  assert.equal(at(76).bottles[3].phase, "empty");
});

test("updates the fluid-ounce counter and gallon fill on original beats", () => {
  const at = (frame) =>
    getGallonFrameState(((frame - 1) * 1000) / GALLON_FLASH_MOVIE.fps + 0.001);

  assert.equal(at(7).counterOpacity, 0);
  assert.equal(at(8).counterOpacity, 37 / 256);
  assert.equal(at(14).counterOpacity, 1);
  assert.equal(at(16).fluidOunces, null);
  assert.equal(at(17).fluidOunces, 32);
  assert.equal(at(34).fluidOunces, 64);
  assert.equal(at(51).fluidOunces, 96);
  assert.equal(at(66).fluidOunces, 128);

  assert.equal(at(9).gallonProgress, 0);
  assert.equal(at(17).gallonProgress, 0.25);
  assert.equal(at(33).gallonProgress, 0.5);
  assert.equal(at(49).gallonProgress, 0.75);
  assert.equal(at(65).gallonProgress, 1);
});

test("reproduces the final formula and Replay fades", () => {
  const at = (frame) =>
    getGallonFrameState(((frame - 1) * 1000) / GALLON_FLASH_MOVIE.fps + 0.001);

  assert.equal(at(88).formulaOpacity, 0);
  assert.equal(at(89).formulaOpacity, 21 / 256);
  assert.equal(at(100).formulaOpacity, 1);
  assert.equal(at(101).replayOpacity, 0);
  assert.equal(at(102).replayOpacity, 32 / 256);
  assert.equal(at(109).replayOpacity, 1);
  assert.equal(at(109).isComplete, true);
});

test("preserves the English and Spanish gallon conversion strings", () => {
  assert.equal(
    getGallonFormulaText({ spanishFormulaFlag: "off" }),
    "1 gallon = 128 fluid ounces",
  );
  assert.equal(
    getGallonFormulaText({ spanishFormulaFlag: "ON" }),
    "1 galón = 128 onzas líquidas",
  );
});

test("restartGallonTimeline returns Conversion_1_2 to frame 1", () => {
  const state = restartGallonTimeline({ spanishFormulaFlag: "off" });
  assert.equal(state.frame, 1);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.isComplete, false);
  assert.deepEqual(state.bottles.map((bottle) => bottle.phase), [
    "full",
    "full",
    "full",
    "full",
  ]);
});
