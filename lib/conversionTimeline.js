export const FLASH_MOVIE = Object.freeze({
  stage: Object.freeze({ width: 780, height: 379 }),
  fps: 12,
  frameCount: 94,
  durationMs: 7833,
});

export const LITER_FLASH_MOVIE = Object.freeze({
  stage: Object.freeze({ width: 780, height: 379 }),
  fps: 12,
  frameCount: 67,
  durationMs: 5583,
});

export const GALLON_FLASH_MOVIE = Object.freeze({
  stage: Object.freeze({ width: 780, height: 379 }),
  fps: 12,
  frameCount: 109,
  durationMs: 9083,
});

const FORMULAS = Object.freeze({
  en: "1 cup = 8 fluid ounces",
  es: "1 taza = 8 onzas líquidas",
});

export const LITER_FORMULAS = Object.freeze({
  en: "1 liter = 1000 milliliters",
  es: "1 litro = 1000 mililitros",
});

export const GALLON_FORMULAS = Object.freeze({
  en: "1 gallon = 128 fluid ounces",
  es: "1 galón = 128 onzas líquidas",
});

const GALLON_BOTTLE_WINDOWS = Object.freeze([
  Object.freeze({ move: [6, 10], pour: [11, 20], return: [21, 25] }),
  Object.freeze({ move: [20, 25], pour: [26, 36], return: [37, 41] }),
  Object.freeze({ move: [36, 41], pour: [42, 50], return: [51, 56] }),
  Object.freeze({ move: [50, 55], pour: [56, 69], return: [69, 76] }),
]);

const GALLON_MOVE_MATRICES = Object.freeze([
  Object.freeze([
    [0.863403, 0.499786, -0.499786, 0.863403, 147.1, 72.5],
    [0.496841, 0.865601, -0.865601, 0.496841, 237.55, 18.1],
    [0.23793, 0.968826, -0.968826, 0.23793, 342.8, 22.45],
    [-0.035141, 0.997955, -0.997955, -0.035141, 444.25, 30.15],
    [-0.309174, 0.949982, -0.949982, -0.309174, 541.15, 40.55],
  ]),
  Object.freeze([
    [0.937759, 0.342346, -0.342346, 0.937759, 174.8, 97.55],
    [0.760056, 0.64534, -0.64534, 0.760056, 222.45, 58.55],
    [0.492828, 0.867859, -0.867859, 0.492828, 268.65, 27.45],
    [0.233231, 0.969955, -0.969955, 0.233231, 360.85, 30.45],
    [-0.04364, 0.997559, -0.997559, -0.04364, 449.35, 36.9],
    [-0.318253, 0.946915, -0.946915, -0.318253, 533.3, 46.05],
  ]),
  Object.freeze([
    [0.908981, 0.411011, -0.411011, 0.908981, 262.6, 91.1],
    [0.655899, 0.751694, -0.751694, 0.655899, 325.95, 49.3],
    [0.433777, 0.897125, -0.897125, 0.433777, 384.6, 42.7],
    [0.182053, 0.980621, -0.980621, 0.182053, 440.6, 40.05],
    [-0.079361, 0.994705, -0.994705, -0.079361, 493.2, 40.2],
    [-0.341797, 0.937973, -0.937973, -0.341797, 541.7, 42.95],
  ]),
  Object.freeze([
    [0.964661, 0.259125, -0.259125, 0.964661, 311.55, 113.85],
    [0.863449, 0.500351, -0.500351, 0.863449, 351.7, 87.35],
    [0.700958, 0.709549, -0.709549, 0.700958, 392.1, 65.55],
    [0.492325, 0.867294, -0.867294, 0.492325, 431.15, 48.25],
    [0.250198, 0.965683, -0.965683, 0.250198, 467.95, 34.9],
    [-0.009293, 0.998001, -0.998001, -0.009293, 501.55, 24.85],
  ]),
]);

const GALLON_RETURN_MATRICES = Object.freeze([
  Object.freeze([
    [-0.069611, -0.995499, 0.995499, -0.069611, 112.4, 163.6, 0],
    [-0.143585, -0.987335, 0.987335, -0.143585, 108.45, 173.55, 64],
    [-0.216797, -0.973862, 0.973862, -0.216797, 104.45, 183.6, 128],
    [-0.288849, -0.954987, 0.954987, -0.288849, 100.4, 193.65, 192],
    [-0.363312, -0.93045, 0.93045, -0.363312, 96.4, 203.6, 256],
  ]),
  Object.freeze([
    [-0.230194, -0.971344, 0.971344, -0.230194, 179.6, 195.6, 0],
    [-0.26741, -0.961044, 0.961044, -0.26741, 177.6, 197.6, 64],
    [-0.305298, -0.949707, 0.949707, -0.305298, 175.7, 199.6, 128],
    [-0.345749, -0.93576, 0.93576, -0.345749, 173.55, 201.6, 192],
    [-0.383728, -0.922119, 0.922119, -0.383728, 171.6, 203.6, 256],
  ]),
  Object.freeze([
    [-0.190887, -0.979706, 0.979706, -0.190887, 239.6, 187.6, 0],
    [-0.229202, -0.970856, 0.970856, -0.229202, 239.6, 190.75, 51],
    [-0.267471, -0.961029, 0.961029, -0.267471, 239.55, 193.95, 102],
    [-0.305328, -0.949692, 0.949692, -0.305328, 239.65, 197.2, 154],
    [-0.345779, -0.93573, 0.93573, -0.345779, 239.6, 200.4, 205],
    [-0.383728, -0.922119, 0.922119, -0.383728, 239.6, 203.6, 256],
  ]),
  Object.freeze([
    [0.09935, -0.992264, 0.992264, 0.09935, 335.6, 131.6, 0],
    [0.026886, -0.996994, 0.996994, 0.026886, 332.2, 141.9, 37],
    [-0.039688, -0.996735, 0.996735, -0.039688, 328.7, 152.2, 73],
    [-0.109344, -0.991516, 0.991516, -0.109344, 325.3, 162.45, 110],
    [-0.178513, -0.98143, 0.98143, -0.178513, 321.9, 172.75, 146],
    [-0.249985, -0.965698, 0.965698, -0.249985, 318.4, 183.05, 183],
    [-0.317047, -0.945847, 0.945847, -0.317047, 315.05, 193.35, 219],
    [-0.383728, -0.922119, 0.922119, -0.383728, 311.6, 203.6, 256],
  ]),
]);

const GALLON_FULL_LABEL_MATRICES = Object.freeze(
  [0, 1, 2, 3].map((index) =>
    Object.freeze([
      0.5454559326171875,
      0.0160064697265625,
      -0.021148681640625,
      0.5448455810546875,
      90.35 + index * 72,
      204.5,
    ]),
  ),
);

const GALLON_MOVE_LABEL_MATRICES = Object.freeze([
  Object.freeze([
    [0.46295166015625, 0.28643798828125, -0.2905731201171875, 0.4598541259765625, 146.15, 140.9],
    [0.2571563720703125, 0.4801025390625, -0.4821319580078125, 0.2523956298828125, 202.4, 76.9],
    [0.1142730712890625, 0.5322723388671875, -0.53289794921875, 0.1091461181640625, 292.8, 69.2],
    [-0.0351409912109375, 0.5437774658203125, -0.5429840087890625, -0.040252685546875, 383.3, 61.55],
    [-0.1838531494140625, 0.5132293701171875, -0.51104736328125, -0.1885528564453125, 473.95, 53.9],
  ]),
  Object.freeze([
    [0.5060272216796875, 0.201751708984375, -0.20635986328125, 0.5037078857421875, 185.75, 165.15],
    [0.4042510986328125, 0.364166259765625, -0.36767578125, 0.4004669189453125, 209.35, 125.7],
    [0.2549285888671875, 0.48126220703125, -0.4832763671875, 0.250152587890625, 233.25, 86.05],
    [0.1116943359375, 0.532806396484375, -0.5334014892578125, 0.1065673828125, 310.6, 76.95],
    [-0.039764404296875, 0.543426513671875, -0.5426025390625, -0.0448760986328125, 388.2, 67.75],
    [-0.188751220703125, 0.5113983154296875, -0.509185791015625, -0.19342041015625, 465.95, 58.75],
  ]),
  Object.freeze([
    [0.489227294921875, 0.238739013671875, -0.2431640625, 0.4865570068359375, 268.5, 159.3],
    [0.3457183837890625, 0.4205169677734375, -0.423431396484375, 0.341461181640625, 302.95, 113.75],
    [0.2222442626953125, 0.4962921142578125, -0.4979705810546875, 0.217376708984375, 345.45, 98.75],
    [0.0836029052734375, 0.5377960205078125, -0.5381317138671875, 0.078460693359375, 388, 83.85],
    [-0.0592041015625, 0.5413055419921875, -0.540283203125, -0.0642852783203125, 431, 68.8],
    [-0.201446533203125, 0.5061492919921875, -0.503814697265625, -0.2060699462890625, 474.1, 53.95],
  ]),
  Object.freeze([
    [0.52203369140625, 0.1567840576171875, -0.161590576171875, 0.520111083984375, 328.4, 180.3],
    [0.4629669189453125, 0.2867431640625, -0.2908782958984375, 0.459869384765625, 350.7, 155.85],
    [0.3709869384765625, 0.3982391357421875, -0.40142822265625, 0.366912841796875, 373.15, 131.3],
    [0.2546539306640625, 0.4809417724609375, -0.482940673828125, 0.2498931884765625, 395.75, 106.8],
    [0.1210174560546875, 0.530731201171875, -0.5314483642578125, 0.11590576171875, 418.55, 82.25],
    [-0.0210418701171875, 0.544219970703125, -0.5435638427734375, -0.0261688232421875, 441.5, 57.8],
  ]),
]);

const GALLON_RETURN_LABEL_MATRICES = Object.freeze([
  Object.freeze([
    [0.510284423828125, 0.188323974609375, -0.1930084228515625, 0.508056640625, 104.3, 163.25],
    [0.522796630859375, 0.1497344970703125, -0.1545562744140625, 0.52093505859375, 100.3, 173.8],
    [0.5324859619140625, 0.1103363037109375, -0.11529541015625, 0.5309906005859375, 96.35, 184.45],
    [0.53924560546875, 0.0702972412109375, -0.075347900390625, 0.538116455078125, 92.4, 195.15],
    [0.543731689453125, 0.027801513671875, -0.0329437255859375, 0.542999267578125, 88.5, 205.7],
  ]),
  Object.freeze([
    [0.53424072265625, 0.1031036376953125, -0.10809326171875, 0.532806396484375, 171.55, 196.6],
    [0.537445068359375, 0.082305908203125, -0.08734130859375, 0.5362091064453125, 169.55, 198.9],
    [0.5402984619140625, 0.060943603515625, -0.066009521484375, 0.539276123046875, 167.75, 201.2],
    [0.5424346923828125, 0.0377197265625, -0.0428314208984375, 0.5416107177734375, 165.65, 203.55],
    [0.544158935546875, 0.0157928466796875, -0.02093505859375, 0.543548583984375, 163.8, 205.85],
  ]),
  Object.freeze([
    [0.5295867919921875, 0.12451171875, -0.129425048828125, 0.5279541015625, 231.5, 188.25],
    [0.533782958984375, 0.1035003662109375, -0.1084747314453125, 0.5323333740234375, 231.55, 191.75],
    [0.5374603271484375, 0.082275390625, -0.087310791015625, 0.5362091064453125, 231.5, 195.25],
    [0.540313720703125, 0.0609283447265625, -0.0659942626953125, 0.5392608642578125, 231.7, 198.8],
    [0.54241943359375, 0.0377044677734375, -0.042816162109375, 0.5416107177734375, 231.7, 202.35],
    [0.544158935546875, 0.0157928466796875, -0.02093505859375, 0.543548583984375, 231.8, 205.85],
  ]),
  Object.freeze([
    [0.4708404541015625, 0.2715606689453125, -0.275787353515625, 0.467864990234375, 327.65, 129.9],
    [0.489410400390625, 0.2366180419921875, -0.2410430908203125, 0.48675537109375, 324.1, 140.8],
    [0.5041961669921875, 0.203460693359375, -0.20806884765625, 0.5018310546875, 320.6, 151.6],
    [0.5172119140625, 0.1676788330078125, -0.1724395751953125, 0.515167236328125, 317.15, 162.45],
    [0.527679443359375, 0.13104248046875, -0.1359405517578125, 0.5259857177734375, 313.8, 173.3],
    [0.5358734130859375, 0.0920257568359375, -0.0970001220703125, 0.5345458984375, 310.4, 184.2],
    [0.541015625, 0.0542449951171875, -0.059326171875, 0.5400390625, 307.1, 195.05],
    [0.544158935546875, 0.0157928466796875, -0.02093505859375, 0.543548583984375, 303.8, 205.85],
  ]),
]);

const GALLON_POUR_EXIT_MATRICES = Object.freeze([
  [1, 0, 0, 1, 481, 61.75],
  [0.97772216796875, -0.2037353515625, 0.2037353515625, 0.97772216796875, 458.35, 61.7],
  [0.9144287109375, -0.3986663818359375, 0.3986663818359375, 0.9144287109375, 435.6, 61.75],
]);

const GALLON_POUR_EXIT_LABEL_MATRICES = Object.freeze([
  [-0.2239227294921875, 0.4969329833984375, -0.494384765625, -0.2284393310546875, 481.9, 53.65],
  [-0.1176910400390625, 0.5314788818359375, -0.5299072265625, -0.12261962890625, 457.6, 53.6],
  [-0.00665283203125, 0.543670654296875, -0.5431365966796875, -0.0117950439453125, 433.15, 54],
]);

const GALLON_POUR_EXIT_ALPHA = Object.freeze([256, 171, 85]);

const GALLON_COUNTER_FLASH_FRAMES = new Set([
  18, 20, 22, 35, 37, 39, 52, 54, 56, 67, 69, 71,
]);

const CUP_WALLS = Object.freeze({
  topY: 148,
  bottomY: 270,
  leftTopX: 462,
  leftBottomX: 486,
  rightTopX: 582,
  rightBottomX: 558,
});

const LITER_CYLINDER = Object.freeze({
  x: 72,
  y: 66,
  width: 72,
  height: 174,
  bottomY: 236.55,
  emptySurfaceY: 233.95,
  fullSurfaceY: 77.45,
});

const LITER_SURFACE_TWIPS = Object.freeze([
  4679, 4576, 4473, 4369, 4266, 4163, 4060, 3957, 3853, 3750, 3647,
  3544, 3440, 3337, 3234, 3131, 3028, 2924, 2821, 2718, 2615, 2512,
  2408, 2305, 2202, 2099, 1995, 1892, 1789, 1709, 1629, 1549,
]);

const LITER_MARKS = Object.freeze([
  ["100", 225.05, 228.6],
  ["200", 208.05, 212.05],
  ["300", 191.55, 195.55],
  ["400", 175.05, 179.05],
  ["500", 158.55, 162.55],
  ["600", 142.05, 146.05],
  ["700", 125.55, 129.55],
  ["800", 109.0, 113.05],
  ["900", 93.0, 96.55],
  ["1,000", 76.5, 80.05],
]);

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function flashAlpha(value) {
  return Math.round(clamp(value) * 256) / 256;
}

function literPitcherOpacity(frame) {
  if (frame <= 6) return flashAlpha((frame - 1) / 5);
  if (frame < 55) return 1;
  if (frame <= 59) return flashAlpha((59 - frame) / 5);
  return 0;
}

function literPourOpacity(frame) {
  if (frame < 5 || frame > 42) return 0;
  if (frame <= 39) return 1;
  return flashAlpha((42 - frame) / 3);
}

function literFormulaOpacity(frame) {
  if (frame < 43) return 0;
  return flashAlpha((frame - 43) / 8);
}

function literReplayOpacity(frame) {
  if (frame < 59) return 0;
  return flashAlpha((frame - 59) / 8);
}

function literSurfaceY(frame) {
  if (frame < 8) return LITER_CYLINDER.emptySurfaceY;
  if (frame > 39) return LITER_CYLINDER.fullSurfaceY;
  return LITER_SURFACE_TWIPS[frame - 8] / 20;
}

function interpolateAtY(startX, startY, endX, endY, y) {
  return startX + ((y - startY) / (endY - startY)) * (endX - startX);
}

export function getFormulaText({ spanishFormulaFlag } = {}) {
  return String(spanishFormulaFlag ?? "").toUpperCase() === "ON"
    ? FORMULAS.es
    : FORMULAS.en;
}

export function getLiterFormulaText({ spanishFormulaFlag } = {}) {
  return String(spanishFormulaFlag ?? "").toUpperCase() === "ON"
    ? LITER_FORMULAS.es
    : LITER_FORMULAS.en;
}

export function getGallonFormulaText({ spanishFormulaFlag } = {}) {
  return String(spanishFormulaFlag ?? "").toUpperCase() === "ON"
    ? GALLON_FORMULAS.es
    : GALLON_FORMULAS.en;
}

function frameFromElapsedForMovie(elapsedMs, movie) {
  const frameDurationMs = 1000 / movie.fps;
  return Math.min(
    movie.frameCount,
    Math.max(1, Math.round(Math.max(0, elapsedMs) / frameDurationMs)),
  );
}

function exactFlashFrameFromElapsed(elapsedMs, movie) {
  const frameDurationMs = 1000 / movie.fps;
  return Math.min(
    movie.frameCount,
    Math.max(1, Math.floor(Math.max(0, elapsedMs) / frameDurationMs) + 1),
  );
}

export function frameFromElapsed(elapsedMs) {
  return frameFromElapsedForMovie(elapsedMs, FLASH_MOVIE);
}

export function getConversionFrameState(elapsedMs, options = {}) {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const frame = frameFromElapsed(safeElapsed);
  const isComplete = safeElapsed >= FLASH_MOVIE.durationMs || frame >= 94;
  const pourProgress = clamp((frame - 15) / 40);

  return {
    elapsedMs: isComplete ? FLASH_MOVIE.durationMs : safeElapsed,
    frame,
    progress: clamp(safeElapsed / FLASH_MOVIE.durationMs),
    isComplete,
    formulaText: getFormulaText(options),
    milkCartonVisible: frame < 86,
    formulaVisible: frame >= 1,
    pourVisible: frame >= 15 && frame < 67,
    pourProgress,
    cupFillLevel: pourProgress,
    ouncesLabelVisible: frame >= 45,
    finalFormulaVisible: frame >= 73,
    replayVisible: frame >= 86 || isComplete,
    cupHighlight: frame >= 57,
  };
}

export function getLiterFrameState(elapsedMs, options = {}) {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const frame = exactFlashFrameFromElapsed(safeElapsed, LITER_FLASH_MOVIE);
  const isComplete =
    safeElapsed >= LITER_FLASH_MOVIE.durationMs ||
    frame >= LITER_FLASH_MOVIE.frameCount;
  const surfaceY = literSurfaceY(frame);
  const fillProgress = clamp(
    (LITER_CYLINDER.emptySurfaceY - surfaceY) /
      (LITER_CYLINDER.emptySurfaceY - LITER_CYLINDER.fullSurfaceY),
  );
  const pitcherOpacity = literPitcherOpacity(frame);
  const pourOpacity = literPourOpacity(frame);
  const formulaOpacity = literFormulaOpacity(frame);
  const replayOpacity = literReplayOpacity(frame);

  return {
    elapsedMs: isComplete ? LITER_FLASH_MOVIE.durationMs : safeElapsed,
    frame,
    progress: clamp(safeElapsed / LITER_FLASH_MOVIE.durationMs),
    isComplete,
    formulaText: getLiterFormulaText(options),
    fillVisible: frame >= 8,
    fillProgress,
    surfaceY,
    emptySurfaceY: LITER_CYLINDER.emptySurfaceY,
    fullSurfaceY: LITER_CYLINDER.fullSurfaceY,
    cylinderBottomY: LITER_CYLINDER.bottomY,
    pitcherOpacity,
    pourOpacity,
    formulaOpacity,
    replayOpacity,
    finalFormulaVisible: formulaOpacity > 0,
    replayVisible: replayOpacity > 0 || isComplete,
    scaleHighlightVisible: false,
  };
}

function gallonBottlePhase(frame, index) {
  const window = GALLON_BOTTLE_WINDOWS[index];
  if (frame < window.move[0]) return "full";
  if (frame <= window.move[1]) return "moving";
  if (frame <= window.return[1] && frame >= window.return[0]) return "returning";
  if (frame <= window.pour[1] && frame >= window.pour[0]) return "pouring";
  return "empty";
}

function gallonBottleState(frame, index) {
  const window = GALLON_BOTTLE_WINDOWS[index];
  const phase = gallonBottlePhase(frame, index);
  let matrix = null;
  let labelMatrix = GALLON_FULL_LABEL_MATRICES[index];
  let opacity = 1;
  let pourProgress = 0;
  let pourExit = false;

  if (phase === "moving") {
    matrix = GALLON_MOVE_MATRICES[index][frame - window.move[0]];
    labelMatrix = GALLON_MOVE_LABEL_MATRICES[index][frame - window.move[0]];
  } else if (phase === "pouring") {
    labelMatrix = null;
    pourProgress = clamp(
      (frame - window.pour[0]) / (window.pour[1] - window.pour[0]),
    );
    if (index === 3 && frame >= 66) {
      const exitIndex = frame - 66;
      matrix = GALLON_POUR_EXIT_MATRICES[exitIndex];
      labelMatrix = GALLON_POUR_EXIT_LABEL_MATRICES[exitIndex];
      opacity = GALLON_POUR_EXIT_ALPHA[exitIndex] / 256;
      pourExit = true;
    }
  } else if (phase === "returning") {
    matrix = GALLON_RETURN_MATRICES[index][frame - window.return[0]];
    labelMatrix =
      GALLON_RETURN_LABEL_MATRICES[index][frame - window.return[0]];
    opacity = (matrix?.[6] ?? 256) / 256;
  } else if (phase === "empty") {
    matrix = GALLON_RETURN_MATRICES[index].at(-1);
    labelMatrix = GALLON_RETURN_LABEL_MATRICES[index].at(-1);
  }

  return Object.freeze({
    index,
    phase,
    matrix,
    labelMatrix,
    opacity,
    pourProgress,
    pourExit,
  });
}

function gallonFillProgress(frame) {
  if (frame < 11) return 0;
  if (frame <= 18) return 0.25 * clamp((frame - 11) / 7);
  if (frame < 26) return 0.25;
  if (frame <= 34) return 0.25 + 0.25 * clamp((frame - 26) / 8);
  if (frame < 42) return 0.5;
  if (frame <= 50) return 0.5 + 0.25 * clamp((frame - 42) / 8);
  if (frame < 56) return 0.75;
  if (frame <= 66) return 0.75 + 0.25 * clamp((frame - 56) / 10);
  return 1;
}

function gallonFluidOunces(frame) {
  if (frame < 18) return null;
  if (frame < 35) return 32;
  if (frame < 52) return 64;
  if (frame < 67) return 96;
  return 128;
}

export function getGallonFrameState(elapsedMs, options = {}) {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const frame = exactFlashFrameFromElapsed(safeElapsed, GALLON_FLASH_MOVIE);
  const isComplete =
    safeElapsed >= GALLON_FLASH_MOVIE.durationMs ||
    frame >= GALLON_FLASH_MOVIE.frameCount;

  return {
    elapsedMs: isComplete ? GALLON_FLASH_MOVIE.durationMs : safeElapsed,
    frame,
    progress: clamp(safeElapsed / GALLON_FLASH_MOVIE.durationMs),
    isComplete,
    formulaText: getGallonFormulaText(options),
    bottles: [0, 1, 2, 3].map((index) => gallonBottleState(frame, index)),
    quartShadowsVisible: frame <= 5,
    gallonProgress: gallonFillProgress(frame),
    fluidOunces: gallonFluidOunces(frame),
    counterOpacity:
      frame < 8 ? 0 : frame >= 15 ? 1 : flashAlpha((frame - 8) / 7),
    counterFlash: GALLON_COUNTER_FLASH_FRAMES.has(frame),
    formulaOpacity:
      frame < 89 ? 0 : frame >= 101 ? 1 : flashAlpha((frame - 89) / 12),
    replayOpacity:
      frame < 102
        ? 0
        : frame >= GALLON_FLASH_MOVIE.frameCount
          ? 1
          : flashAlpha((frame - 102) / 8),
  };
}

export function getCupMeasureMarks() {
  return [1, 2, 3].map((value) => {
    const y = 248 - value * 30;
    const leftWallX = interpolateAtY(
      CUP_WALLS.leftTopX,
      CUP_WALLS.topY,
      CUP_WALLS.leftBottomX,
      CUP_WALLS.bottomY,
      y,
    );
    const rightWallX = interpolateAtY(
      CUP_WALLS.rightTopX,
      CUP_WALLS.topY,
      CUP_WALLS.rightBottomX,
      CUP_WALLS.bottomY,
      y,
    );
    const labelX = Math.round(leftWallX + 17);
    const lineX1 = Math.round(leftWallX + 42);
    const preferredLineX2 = lineX1 + (value === 3 ? 54 : 46);

    return {
      value,
      y,
      labelX,
      leftWallX,
      rightWallX,
      lineX1,
      lineX2: Math.round(Math.min(rightWallX - 16, preferredLineX2)),
    };
  });
}

export function getGraduatedCylinderMarks() {
  return LITER_MARKS.map(([label, y, tickY], index) => ({
    value: (index + 1) * 100,
    label,
    y,
    textY: y + 8,
    labelX: 105.75,
    tickY,
    tickX1: 84.35,
    tickX2: 128.15,
  }));
}

export function restartTimeline(options = {}) {
  return getConversionFrameState(0, options);
}

export function restartLiterTimeline(options = {}) {
  return getLiterFrameState(0, options);
}

export function restartGallonTimeline(options = {}) {
  return getGallonFrameState(0, options);
}
