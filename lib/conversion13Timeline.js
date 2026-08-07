// Animate 2021 has a same-session stale-document hazard for these legacy FLAs,
// so this FLA must be inspected in an independent cold-start session before
// drawing authoring conclusions. This timeline follows the shipped SWF's
// authoritative 170-frame runtime behavior.
export const QUART_GALLON_FLASH_MOVIE = Object.freeze({
  stage: Object.freeze({ width: 780, height: 379 }),
  fps: 12,
  frameCount: 170,
  durationMs: 14167,
});

export const QUART_GALLON_FORMULAS = Object.freeze({
  en: "1 gallon = 4 quarts",
  es: "1 galón =  4 cuartos",
});

export const QUART_FULL_SOURCE_MATRIX = Object.freeze([
  1, 0, 0, 1, 56.8, 144.65,
]);

export const QUART_EMPTY_SOURCE_MATRIX = Object.freeze([
  -0.363312, -0.93045, 0.93045, -0.363312, 96.4, 203.6,
]);

const MOVE_MATRICES = Object.freeze([
  Object.freeze([
    Object.freeze([0.97706604, -0.207962036, 0.207962036, 0.97706604, 92.2, 113.7]),
    Object.freeze([0.911392212, -0.406646729, 0.406646729, 0.911392212, 128.65, 85.4]),
    Object.freeze([0.805938721, -0.587402344, 0.587402344, 0.805938721, 165.45, 60.15]),
    Object.freeze([0.665283203, -0.742324829, 0.742324829, 0.665283203, 202, 37.75]),
    Object.freeze([0.496841431, -0.865600586, 0.865600586, 0.496841431, 237.55, 18.1]),
    Object.freeze([0.237930298, -0.968826294, 0.968826294, 0.237930298, 342.8, 22.45]),
    Object.freeze([-0.0351409912, -0.997955322, 0.997955322, -0.0351409912, 444.25, 30.15]),
    Object.freeze([-0.309173584, -0.949981689, 0.949981689, -0.309173584, 541.15, 40.55]),
  ]),
  Object.freeze([
    Object.freeze([0.977005005, -0.208190918, 0.208190918, 0.977005005, 156.05, 115.45]),
    Object.freeze([0.911193848, -0.407058716, 0.407058716, 0.911193848, 184.2, 89.1]),
    Object.freeze([0.805511475, -0.587966919, 0.587966919, 0.805511475, 212.8, 65.7]),
    Object.freeze([0.662139893, -0.745101929, 0.745101929, 0.662139893, 241.25, 45.2]),
    Object.freeze([0.492828369, -0.867858887, 0.867858887, 0.492828369, 268.65, 27.45]),
    Object.freeze([0.233230591, -0.969955444, 0.969955444, 0.233230591, 360.85, 30.45]),
    Object.freeze([-0.0436401367, -0.997558594, 0.997558594, -0.0436401367, 449.35, 36.9]),
    Object.freeze([-0.318252563, -0.946914673, 0.946914673, -0.318252563, 533.3, 46.05]),
  ]),
  Object.freeze([
    Object.freeze([0.976669312, -0.208740234, 0.208740234, 0.976669312, 231.1, 116.45]),
    Object.freeze([0.908981323, -0.411010742, 0.411010742, 0.908981323, 262.55, 91.1]),
    Object.freeze([0.800033569, -0.594345093, 0.594345093, 0.800033569, 294.45, 68.7]),
    Object.freeze([0.655899048, -0.751693726, 0.751693726, 0.655899048, 325.95, 49.3]),
    Object.freeze([0.433776855, -0.897125244, 0.897125244, 0.433776855, 384.6, 42.7]),
    Object.freeze([0.182052612, -0.980621338, 0.980621338, 0.182052612, 440.6, 40.05]),
    Object.freeze([-0.0793609619, -0.9947052, 0.9947052, -0.0793609619, 493.2, 40.2]),
    Object.freeze([-0.341796875, -0.937973022, 0.937973022, -0.341796875, 541.7, 42.95]),
  ]),
  Object.freeze([
    Object.freeze([0.989486694, -0.140136719, 0.140136719, 0.989486694, 293.65, 127.45]),
    Object.freeze([0.958526611, -0.28062439, 0.28062439, 0.958526611, 315.15, 111.15]),
    Object.freeze([0.90776062, -0.415222168, 0.415222168, 0.90776062, 337.05, 96.4]),
    Object.freeze([0.838256836, -0.541213989, 0.541213989, 0.838256836, 359.1, 83.1]),
    Object.freeze([0.751449585, -0.655975342, 0.655975342, 0.751449585, 381.05, 71]),
    Object.freeze([0.649154663, -0.757141113, 0.757141113, 0.649154663, 402.9, 60.35]),
    Object.freeze([0.533462524, -0.84262085, 0.84262085, 0.533462524, 424.2, 51.05]),
    Object.freeze([0.406799316, -0.910644531, 0.910644531, 0.406799316, 444.85, 42.95]),
    Object.freeze([0.271759033, -0.959823608, 0.959823608, 0.271759033, 464.8, 36]),
    Object.freeze([0.131149292, -0.989151001, 0.989151001, 0.131149292, 483.75, 30.05]),
    Object.freeze([-0.00929260254, -0.998001099, 0.998001099, -0.00929260254, 501.55, 24.85]),
  ]),
]);

const RETURN_LEAD_MATRICES = Object.freeze([
  Object.freeze([1, 0, 0, 1, 481, 61.75, 256]),
  Object.freeze([0.991714478, 0.122177124, -0.122177124, 0.991714478, 467.35, 61.7, 205]),
  Object.freeze([0.968612671, 0.242431641, -0.242431641, 0.968612671, 453.8, 61.8, 154]),
  Object.freeze([0.930969238, 0.358947754, -0.358947754, 0.930969238, 440.2, 61.75, 102]),
  Object.freeze([0.877868652, 0.472900391, -0.472900391, 0.877868652, 426.65, 61.75, 51]),
  Object.freeze([0.813537598, 0.578277588, -0.578277588, 0.813537598, 413, 61.75, 0]),
]);

const RETURN_SETTLE_MATRICES = Object.freeze([
  Object.freeze([
    Object.freeze([-0.069611, 0.995499, -0.995499, -0.069611, 112.4, 163.6, 0]),
    Object.freeze([-0.143585, 0.987335, -0.987335, -0.143585, 108.45, 173.55, 64]),
    Object.freeze([-0.216797, 0.973862, -0.973862, -0.216797, 104.45, 183.6, 128]),
    Object.freeze([-0.288849, 0.954987, -0.954987, -0.288849, 100.4, 193.65, 192]),
    Object.freeze([-0.363312, 0.93045, -0.93045, -0.363312, 96.4, 203.6, 256]),
  ]),
  Object.freeze([
    Object.freeze([-0.230194, 0.971344, -0.971344, -0.230194, 179.6, 195.6, 0]),
    Object.freeze([-0.26741, 0.961044, -0.961044, -0.26741, 177.6, 197.6, 64]),
    Object.freeze([-0.305298, 0.949707, -0.949707, -0.305298, 175.7, 199.6, 128]),
    Object.freeze([-0.345749, 0.93576, -0.93576, -0.345749, 173.55, 201.6, 192]),
    Object.freeze([-0.383728, 0.922119, -0.922119, -0.383728, 171.6, 203.6, 256]),
  ]),
  Object.freeze([
    Object.freeze([-0.190887, 0.979706, -0.979706, -0.190887, 239.6, 187.6, 0]),
    Object.freeze([-0.229202, 0.970856, -0.970856, -0.229202, 239.6, 190.75, 51]),
    Object.freeze([-0.267471, 0.961029, -0.961029, -0.267471, 239.55, 193.95, 102]),
    Object.freeze([-0.305328, 0.949692, -0.949692, -0.305328, 239.65, 197.2, 154]),
    Object.freeze([-0.345779, 0.93573, -0.93573, -0.345779, 239.6, 200.4, 205]),
    Object.freeze([-0.383728, 0.922119, -0.922119, -0.383728, 239.6, 203.6, 256]),
  ]),
  Object.freeze([
    Object.freeze([0.09935, 0.992264, -0.992264, 0.09935, 335.6, 131.6, 0]),
    Object.freeze([0.026886, 0.996994, -0.996994, 0.026886, 332.2, 141.9, 37]),
    Object.freeze([-0.039688, 0.996735, -0.996735, -0.039688, 328.7, 152.2, 73]),
    Object.freeze([-0.109344, 0.991516, -0.991516, -0.109344, 325.3, 162.45, 110]),
    Object.freeze([-0.178513, 0.98143, -0.98143, -0.178513, 321.9, 172.75, 146]),
    Object.freeze([-0.249985, 0.965698, -0.965698, -0.249985, 318.4, 183.05, 183]),
    Object.freeze([-0.317047, 0.945847, -0.945847, -0.317047, 315.05, 193.35, 219]),
    Object.freeze([-0.383728, 0.922119, -0.922119, -0.383728, 311.6, 203.6, 256]),
  ]),
]);

const BOTTLE_WINDOWS = Object.freeze([
  // Corrected Adobe runtime frame N corresponds to FFDec root frame N - 1.
  Object.freeze({ move: [9, 16], pour: [17, 35], lead: [36, 39], settle: [40, 44] }),
  Object.freeze({ move: [37, 44], pour: [45, 63], lead: [64, 69], settle: [70, 74] }),
  Object.freeze({ move: [67, 74], pour: [75, 93], lead: [94, 99], settle: [100, 105] }),
  Object.freeze({ move: [94, 104], pour: [105, 123], lead: [124, 128], settle: [129, 136] }),
]);

const FORMULA_FADE = Object.freeze([0, 21, 43, 64, 85, 107, 128, 149, 171, 192, 213, 235, 256]);
const REPLAY_FADE = Object.freeze([0, 32, 64, 96, 128, 160, 192, 224, 256]);

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeFrame(frame) {
  const numeric = Number.isFinite(frame) ? Math.trunc(frame) : 1;
  return Math.min(QUART_GALLON_FLASH_MOVIE.frameCount, Math.max(1, numeric));
}

function frameFromElapsed(elapsedMs) {
  const safe = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  return normalizeFrame(
    Math.floor(safe / (1000 / QUART_GALLON_FLASH_MOVIE.fps)) + 1,
  );
}

function spanishFormulaVisible(options) {
  return String(options?.spanishFormulaFlag ?? "").toUpperCase() === "ON";
}

// swfmill writes matrix skew fields as [scaleX, skewX, skewY, scaleY].
// SVG matrix() expects [a, b, c, d], so b and c must be exchanged.
function swfMatrixToSvg(matrix) {
  return [matrix[0], matrix[2], matrix[1], matrix[3], ...matrix.slice(4)];
}

function bottleState(frame, index) {
  const windows = BOTTLE_WINDOWS[index];
  if (frame < windows.move[0]) {
    return Object.freeze({ index, phase: "full", matrix: null, opacity: 1, pourProgress: 0 });
  }
  if (frame <= windows.move[1]) {
    return Object.freeze({
      index,
      phase: "moving",
      matrix: swfMatrixToSvg(MOVE_MATRICES[index][frame - windows.move[0]]),
      opacity: 1,
      pourProgress: 0,
    });
  }
  if (frame <= windows.pour[1]) {
    return Object.freeze({
      index,
      phase: "pouring",
      matrix: null,
      opacity: 1,
      pourProgress: clamp(
        (frame - windows.pour[0]) / (windows.pour[1] - windows.pour[0]),
      ),
    });
  }
  if (frame <= windows.lead[1]) {
    const lead = swfMatrixToSvg(RETURN_LEAD_MATRICES[frame - windows.lead[0]]);
    return Object.freeze({
      index,
      phase: "returning",
      matrix: lead.slice(0, 6),
      opacity: lead[6] / 256,
      pourProgress: 1,
    });
  }
  if (frame <= windows.settle[1]) {
    const settle = swfMatrixToSvg(
      RETURN_SETTLE_MATRICES[index][frame - windows.settle[0]],
    );
    return Object.freeze({
      index,
      phase: "returning",
      matrix: settle.slice(0, 6),
      opacity: settle[6] / 256,
      pourProgress: 1,
    });
  }
  return Object.freeze({ index, phase: "empty", matrix: null, opacity: 1, pourProgress: 1 });
}

function gallonProgress(frame) {
  return BOTTLE_WINDOWS.reduce((total, windows) => {
    const contribution = clamp(
      (frame - windows.pour[0]) / (windows.pour[1] - windows.pour[0]),
    );
    return total + contribution * 0.25;
  }, 0);
}

function finalFormulaOpacity(frame) {
  if (frame < 149) return 0;
  if (frame >= 161) return 1;
  return FORMULA_FADE[frame - 149] / 256;
}

function replayOpacity(frame) {
  if (frame < 163) return 0;
  return REPLAY_FADE[Math.min(REPLAY_FADE.length - 1, frame - 163)] / 256;
}

export function getQuartGallonFrameStateAtFrame(frame, options = {}) {
  const normalized = normalizeFrame(frame);
  const isSpanishVisible = spanishFormulaVisible(options);
  const formulaOpacity = finalFormulaOpacity(normalized);
  const replayAlpha = replayOpacity(normalized);
  return {
    frame: normalized,
    elapsedMs: ((normalized - 1) * 1000) / QUART_GALLON_FLASH_MOVIE.fps,
    progress: (normalized - 1) / (QUART_GALLON_FLASH_MOVIE.frameCount - 1),
    isComplete: normalized >= QUART_GALLON_FLASH_MOVIE.frameCount,
    formulaText: isSpanishVisible
      ? QUART_GALLON_FORMULAS.es
      : QUART_GALLON_FORMULAS.en,
    spanishFormulaVisible: isSpanishVisible,
    sourceFrame: normalized === 1 ? 1 : normalized - 1,
    bottles: [0, 1, 2, 3].map((index) => bottleState(normalized, index)),
    gallonProgress: gallonProgress(normalized),
    finalFormulaOpacity: formulaOpacity,
    finalFormulaVisible: formulaOpacity > 0,
    replayOpacity: replayAlpha,
    replayVisible: replayAlpha > 0,
  };
}

export function getQuartGallonFrameState(elapsedMs, options = {}) {
  const safe = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const state = getQuartGallonFrameStateAtFrame(frameFromElapsed(safe), options);
  return {
    ...state,
    elapsedMs: state.isComplete ? QUART_GALLON_FLASH_MOVIE.durationMs : safe,
  };
}

export function restartQuartGallonTimeline(options = {}) {
  return getQuartGallonFrameStateAtFrame(1, options);
}
