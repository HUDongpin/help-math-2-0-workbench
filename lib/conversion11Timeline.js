// Animate 2021 can display stale content from the first legacy document when
// several FLAs are opened in one session. A cold-start inspection confirmed
// this FLA's cup/milk authoring content; the shipped SWF remains authoritative
// for the exact 94-frame runtime behavior modeled below.
export const CUP_FLASH_MOVIE = Object.freeze({
  stage: Object.freeze({ width: 780, height: 379 }),
  fps: 12,
  frameCount: 94,
  durationMs: 7833,
});

export const CUP_FORMULAS = Object.freeze({
  en: "1 cup = 8 fluid ounces",
  es: "1 taza = 8 onzas líquidas",
});

export const CUP_CARTON_SOURCE_MATRIX = Object.freeze([
  1, 0, 0, 1, 171.4, 95.7,
]);

// Root-timeline matrices for character 138, recovered from the shipped SWF.
// FFDec root frame 10 is authoritative Adobe runtime frame 11: the corrected
// one-indexed standalone capture is one frame later than FFDec's root export.
// Array index 0 is therefore runtime frame 11; frames 1-10 and 46-94 use the
// source matrix.
const CARTON_TWEEN_MATRICES = Object.freeze([
  Object.freeze([0.951049805, -0.305908203, 0.305908203, 0.951049805, 235, 67.95]),
  Object.freeze([0.809020996, -0.585128784, 0.585128784, 0.809020996, 301.75, 50.6]),
  Object.freeze([0.585128784, -0.809020996, 0.809020996, 0.585128784, 368.3, 44.55]),
  Object.freeze([0.305908203, -0.951049805, 0.951049805, 0.305908203, 430.35, 48.7]),
  Object.freeze([0, -1, 1, 0, 440.2, 47.85]),
  Object.freeze([0, -1, 1, 0, 455.35, 40.7]),
  Object.freeze([-0.00498962402, -0.999954224, 0.999954224, -0.00498962402, 455.7, 40.95]),
  Object.freeze([-0.0132598877, -0.999816895, 0.999816895, -0.0132598877, 456.25, 41.4]),
  Object.freeze([-0.0182495117, -0.999710083, 0.999710083, -0.0182495117, 456.65, 41.65]),
  Object.freeze([-0.0265045166, -0.999465942, 0.999465942, -0.0265045166, 457.3, 42.05]),
  Object.freeze([-0.0314941406, -0.999282837, 0.999282837, -0.0314941406, 457.6, 42.3]),
  Object.freeze([-0.0397491455, -0.998931885, 0.998931885, -0.0397491455, 458.25, 42.75]),
  Object.freeze([-0.0480041504, -0.998535156, 0.998535156, -0.0480041504, 458.85, 43.2]),
  Object.freeze([-0.0529785156, -0.998245239, 0.998245239, -0.0529785156, 459.2, 43.5]),
  Object.freeze([-0.0612182617, -0.997711182, 0.997711182, -0.0612182617, 459.8, 43.95]),
  Object.freeze([-0.0662078857, -0.997375488, 0.997375488, -0.0662078857, 460.15, 44.25]),
  Object.freeze([-0.0744476318, -0.996734619, 0.996734619, -0.0744476318, 460.65, 44.7]),
  Object.freeze([-0.0794219971, -0.996307373, 0.996307373, -0.0794219971, 461, 45]),
  Object.freeze([-0.0876464844, -0.995559692, 0.995559692, -0.0876464844, 461.65, 45.45]),
  Object.freeze([-0.0958709717, -0.994766235, 0.994766235, -0.0958709717, 462.15, 45.9]),
  Object.freeze([-0.100830078, -0.994232178, 0.994232178, -0.100830078, 462.5, 46.15]),
  Object.freeze([-0.109039307, -0.99331665, 0.99331665, -0.109039307, 463.05, 46.75]),
  Object.freeze([-0.113998413, -0.992736816, 0.992736816, -0.113998413, 463.45, 46.95]),
  Object.freeze([-0.122207642, -0.991699219, 0.991699219, -0.122207642, 464, 47.45]),
  Object.freeze([-0.127151489, -0.991043091, 0.991043091, -0.127151489, 464.25, 47.8]),
  Object.freeze([-0.1353302, -0.989898682, 0.989898682, -0.1353302, 464.9, 48.25]),
  Object.freeze([-0.143508911, -0.988708496, 0.988708496, -0.143508911, 465.4, 48.75]),
  Object.freeze([-0.1484375, -0.987930298, 0.987930298, -0.1484375, 465.75, 49.05]),
  Object.freeze([-0.157333374, -0.987030029, 0.987030029, -0.157333374, 466.35, 49.55]),
  Object.freeze([0, -1, 1, 0, 440.2, 47.85]),
  Object.freeze([0.305908203, -0.951049805, 0.951049805, 0.305908203, 390.3, 46.9]),
  Object.freeze([0.585128784, -0.809020996, 0.809020996, 0.585128784, 336.55, 50.45]),
  Object.freeze([0.809020996, -0.585128784, 0.585128784, 0.809020996, 280.7, 59.65]),
  Object.freeze([0.951049805, -0.305908203, 0.305908203, 0.951049805, 224.85, 74.9]),
  CUP_CARTON_SOURCE_MATRIX,
]);

const OUNCES_FADE_IN = Object.freeze([0, 37, 73, 110, 146, 183, 219, 256]);
const FINAL_FORMULA_FADE = Object.freeze([0, 23, 47, 70, 93, 116, 140, 163, 186, 209, 233, 256]);
const REPLAY_FADE = Object.freeze([0, 32, 64, 96, 128, 160, 192, 224, 256]);

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeFrame(frame) {
  const numeric = Number.isFinite(frame) ? Math.trunc(frame) : 1;
  return Math.min(CUP_FLASH_MOVIE.frameCount, Math.max(1, numeric));
}

function frameFromElapsed(elapsedMs) {
  const safe = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  return normalizeFrame(Math.floor(safe / (1000 / CUP_FLASH_MOVIE.fps)) + 1);
}

function spanishFormulaVisible(options) {
  return String(options?.spanishFormulaFlag ?? "").toUpperCase() === "ON";
}

function cartonMatrix(frame) {
  if (frame < 11 || frame > 45) return CUP_CARTON_SOURCE_MATRIX;
  return CARTON_TWEEN_MATRICES[frame - 11];
}

function cartonPhase(frame) {
  if (frame < 11 || frame > 45) return "resting";
  if (frame < 16) return "moving-to-cup";
  if (frame < 40) return "pouring";
  return "returning";
}

function ouncesOpacity(frame) {
  if (frame < 46 || frame > 73) return 0;
  if (frame <= 53) return OUNCES_FADE_IN[frame - 46] / 256;
  if (frame <= 65) return 1;
  return Math.max(0, (73 - frame) * 32) / 256;
}

function ouncesOffsetX(frame) {
  if (frame <= 46) return 0;
  if (frame >= 53) return 20;
  return ((frame - 46) * 20) / 7;
}

function finalFormulaOpacity(frame) {
  if (frame < 74) return 0;
  if (frame >= 85) return 1;
  return FINAL_FORMULA_FADE[frame - 74] / 256;
}

function replayOpacity(frame) {
  if (frame < 87) return 0;
  return REPLAY_FADE[Math.min(REPLAY_FADE.length - 1, frame - 87)] / 256;
}

export function getCupFrameStateAtFrame(frame, options = {}) {
  const normalized = normalizeFrame(frame);
  const isSpanishVisible = spanishFormulaVisible(options);
  const fillProgress = clamp((normalized - 16) / 23);
  const finalOpacity = finalFormulaOpacity(normalized);
  const replayAlpha = replayOpacity(normalized);
  const calloutAlpha = ouncesOpacity(normalized);

  return {
    frame: normalized,
    elapsedMs: ((normalized - 1) * 1000) / CUP_FLASH_MOVIE.fps,
    progress: (normalized - 1) / (CUP_FLASH_MOVIE.frameCount - 1),
    isComplete: normalized >= CUP_FLASH_MOVIE.frameCount,
    formulaText: isSpanishVisible ? CUP_FORMULAS.es : CUP_FORMULAS.en,
    spanishFormulaVisible: isSpanishVisible,
    sourceFrame: normalized === 1 ? 1 : normalized - 1,
    stageVisible: normalized !== 52 && normalized !== 53,
    cartonMatrix: cartonMatrix(normalized),
    cartonPhase: cartonPhase(normalized),
    pourVisible: normalized >= 16 && normalized <= 39,
    milkFillVisible: normalized >= 17,
    milkFillProgress: normalized >= 40 ? 1 : fillProgress,
    ouncesCalloutOpacity: calloutAlpha,
    ouncesCalloutOffsetX: ouncesOffsetX(normalized),
    ouncesCalloutVisible: calloutAlpha > 0,
    cupHighlightVisible: [58, 60, 62, 64].includes(normalized),
    finalFormulaOpacity: finalOpacity,
    finalFormulaVisible: finalOpacity > 0,
    replayOpacity: replayAlpha,
    replayVisible: replayAlpha > 0,
  };
}

export function getCupFrameState(elapsedMs, options = {}) {
  const safe = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const state = getCupFrameStateAtFrame(frameFromElapsed(safe), options);
  return {
    ...state,
    elapsedMs: state.isComplete ? CUP_FLASH_MOVIE.durationMs : safe,
  };
}

export function restartCupTimeline(options = {}) {
  return getCupFrameStateAtFrame(1, options);
}
