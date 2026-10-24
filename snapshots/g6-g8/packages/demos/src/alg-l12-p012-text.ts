import {P012_TEXT_DATA} from './generated/alg-l12-p012-text-data';

type Matrix = readonly [number, number, number, number, number, number];
type Rect = readonly [number, number, number, number];
type SourceRun = {readonly sourceTextId: string; readonly text: string;
  readonly baselineTwips: readonly [number, number]; readonly fontHeightTwips: number;
  readonly glyphs: readonly {readonly index: number; readonly unicode: string; readonly advanceTwips: number}[]};
type Definition = {readonly characterId: number; readonly sourceTextId: string; readonly kind: string;
  readonly role: string; readonly sourceTagSha256: string; readonly matrix?: Matrix;
  readonly runs?: readonly SourceRun[]};
type Pose = {readonly matrix: Matrix; readonly colorTransform: {readonly multiply: readonly number[];
  readonly add: readonly number[]; readonly divisor: number}; readonly visible: boolean};
type Instance = {readonly instanceId: string; readonly timelineId: string; readonly characterId: number;
  readonly depth: number; readonly generation: number; readonly firstFrame: number;
  readonly lastFrameExclusive: number; readonly poseSegments: readonly {readonly firstFrame: number;
    readonly lastFrameExclusive: number; readonly pose: Pose}[]};
type ParentPlacement = {readonly childTimelineId: string; readonly matrix: Matrix};

const definitions = P012_TEXT_DATA.definitions as unknown as readonly Definition[];
const instances = P012_TEXT_DATA.instances as unknown as readonly Instance[];
const parentPlacements = P012_TEXT_DATA.parentPlacements as unknown as readonly ParentPlacement[];
const definition = (characterId: number): Definition => {
  const found = definitions.find(item => item.characterId === characterId);
  if (!found) throw new Error(`P012 missing source text character ${characterId}`);
  return found;
};
const instance = (instanceId: string): Instance => {
  const found = instances.find(item => item.instanceId === instanceId);
  if (!found) throw new Error(`P012 missing source text instance ${instanceId}`);
  return found;
};
const poseAt = (item: Instance, frame: number): Pose | null =>
  item.poseSegments.find(segment => segment.firstFrame <= frame && frame < segment.lastFrameExclusive)?.pose ?? null;
const rootMatrix = parentPlacements.find(item => item.childTimelineId === 'sprite-86')?.matrix;
if (!rootMatrix) throw new Error('P012 missing source root-to-main placement');
const point = (matrix: Matrix, x: number, y: number): readonly [number, number] =>
  [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]];
const box = (matrix: Matrix, bounds: Rect): Rect => {
  const points = [[bounds[0], bounds[1]], [bounds[0], bounds[3]],
    [bounds[2], bounds[1]], [bounds[2], bounds[3]]].map(([x, y]) => point(matrix, x, y));
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])),
    Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
};
const inside = (inner: Rect, outer: Rect): boolean =>
  inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3];
const stagePoint = (x: number, y: number): readonly [number, number] => {
  const [sx, sy] = point(rootMatrix, x, y);
  return [sx / 20, sy / 20];
};

// Exact quadratic-curve ink bounds in font units, reconstructed from the
// hash-bound FFDec XML's DefineFont2 character 29 glyphShapeTable. Null is
// the source's empty space glyph. The mask rectangles below have closed,
// filled source paths; other source vectors remain unclassified.
const FONT29_INK: readonly (Rect | null)[] = [
  null, [56,-292,282,-201], [80,-110,199,7], [126,-716,353,0],
  [48,-716,516,0], [34,-716,479,0], [66,-724,580,10], [17,-716,478,0],
  [0,170,512,242], [32,-499,524,8], [31,-490,363,0], [33,-716,526,9],
  [31,-500,526,10], [61,-716,321,0], [32,-499,524,229], [61,-716,477,0],
  [51,-683,158,0], [61,-716,465,0], [61,-716,149,0], [53,-499,742,0],
  [53,-499,470,0], [31,-499,527,9], [52,-499,545,218], [60,-499,332,0],
  [36,-490,408,0], [55,-620,291,0], [53,-490,470,9], [0,-490,461,10],
  [53,-490,742,9], [12,-490,439,0], [53,-490,470,218],
];
const MASK49_TX = [
  -7175,-7056,-6937,-6817,-6698,-6579,-6460,-6341,-6222,-6103,-5983,-5864,
  -5746,-5626,-5507,-5387,-5268,-5150,-5030,-4911,-4792,-4672,-4554,-4434,
  -4315,-4196,-4077,-3957,-3838,-3719,-3600,-3482,-3361,-3242,-3123,-3004,
  -2886,-2766,-2646,-2527,-2408,-2290,-2170,-2051,-1931,-1812,-1694,-1574,
  -1455,-1336,-1217,-1098,-978,-859,-740,-622,-502,-382,-263,
] as const;
const MASK54_SCALE = [3256,8918,14580,20241,25903,31565,37227,42889,48551,54212,59874,65536] as const;
const MASK54_TX = [-7117,-6966,-6815,-6664,-6513,-6362,-6212,-6061,-5910,-5759,-5608,-5457] as const;

/** Mask 49 has a deliberate source hold on frames 83–93. */
export function p012InstructionMask(frame: number, characterId: 49 | 54): Rect | null {
  if (characterId === 49) {
    if (frame < 32) return null;
    const index = frame <= 82 ? frame - 32 : frame <= 93 ? 50 : Math.min(frame - 43, 58);
    return box([(98 + 1151 * index) / 65536, 0, 0, 1, MASK49_TX[index], -3765],
      [-6689,-346,7121,345]);
  }
  if (frame < 101) return null;
  const index = Math.min(frame - 101, 11);
  return box([MASK54_SCALE[index] / 65536, 0, 0, 1, MASK54_TX[index], -3186],
    [-1610,-260,1610,260]);
}

function sourceAnchor(run: SourceRun, textMatrix: Matrix, placement: Matrix): readonly [number, number] {
  const [tx, ty] = point(textMatrix, ...run.baselineTwips);
  return stagePoint(...point(placement, tx, ty));
}
function glyphInk(run: SourceRun, glyphIndex: number, penX: number, penY: number,
  textMatrix: Matrix, placement: Matrix): Rect | null {
  const ink = FONT29_INK[glyphIndex];
  if (!ink) return null;
  const scale = run.fontHeightTwips / 1024;
  return box(placement, box(textMatrix, [penX + ink[0] * scale, penY + ink[1] * scale,
    penX + ink[2] * scale, penY + ink[3] * scale]));
}

export interface P012TextItem {
  readonly sourceTextId: string;
  readonly instanceId: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly role: string;
}

function instructionAt(frame: number, characterId: 51 | 55, maskId: 49 | 54): readonly P012TextItem[] {
  const source = definition(characterId);
  const item = instances.find(value => value.timelineId === 'sprite-86' && value.characterId === characterId);
  if (!item || !source.runs || !source.matrix) throw new Error(`P012 missing instruction ${characterId}`);
  const pose = poseAt(item, frame), mask = p012InstructionMask(frame, maskId);
  if (!pose || !mask || !pose.visible) return [];
  const visible: P012TextItem[] = [];
  let blocked = false;
  for (const run of source.runs) {
    let penX = run.baselineTwips[0];
    const penY = run.baselineTwips[1];
    let prefix = '';
    for (const glyph of run.glyphs) {
      const ink = glyphInk(run, glyph.index, penX, penY, source.matrix, pose.matrix);
      if (!blocked && (ink === null || inside(ink, mask))) prefix += glyph.unicode;
      else blocked = true;
      penX += glyph.advanceTwips;
    }
    if (prefix && !blocked || prefix.trim()) {
      const [x, y] = sourceAnchor(run, source.matrix, pose.matrix);
      visible.push({sourceTextId: run.sourceTextId, instanceId: item.instanceId,
        text: prefix, x, y, role: source.role});
    }
  }
  return visible;
}

const CONTROL_SOURCE = {
  MoveBtn1: 38, MoveBtn2: 37, MoveBtn3: 41, MoveBtn4: 42,
  MoveBtn5: 40, MoveBtn6: 44, MoveBtn7: 39, MoveBtn8: 43,
} as const;
export type P012ControlName = keyof typeof CONTROL_SOURCE;
export const P012_CONTROL_TEXT: Readonly<Record<P012ControlName, Readonly<{
  characterId: number; sourceTextId: string; text: string; instanceId: string
}>>> = Object.freeze(Object.fromEntries(Object.entries(CONTROL_SOURCE).map(([name, characterId]) => {
  const source = definition(characterId);
  const item = instances.find(value => value.timelineId === 'sprite-86' && value.characterId === characterId);
  if (!source.runs?.[0] || !item) throw new Error(`P012 missing control text ${name}`);
  return [name, Object.freeze({characterId, sourceTextId: source.runs[0].sourceTextId,
    text: source.runs[0].text, instanceId: item.instanceId})];
})) as Record<P012ControlName, {characterId: number; sourceTextId: string; text: string; instanceId: string}>);

function positionedText(frame: number, roles: readonly string[]): readonly P012TextItem[] {
  return instances.filter(item => item.timelineId === 'sprite-86' &&
    item.firstFrame <= frame && frame < item.lastFrameExclusive && roles.includes(definition(item.characterId).role))
    .flatMap(item => {
      const source = definition(item.characterId), pose = poseAt(item, frame);
      if (!source.runs || !source.matrix || !pose || !pose.visible) return [];
      const alpha = pose.colorTransform.multiply[3] / pose.colorTransform.divisor + pose.colorTransform.add[3] / 255;
      if (alpha <= 0) return [];
      return source.runs.map(run => {
        const [x, y] = sourceAnchor(run, source.matrix!, pose.matrix);
        return {sourceTextId: run.sourceTextId, instanceId: item.instanceId,
          text: run.text, x, y, role: source.role};
      });
    });
}

export interface P012TextSnapshot {
  readonly frame: number;
  readonly sourceSwfSha256: string;
  readonly introText: string;
  readonly introRuns: readonly P012TextItem[];
  readonly labels: readonly P012TextItem[];
  readonly controlLabels: readonly P012TextItem[];
  readonly coordinate: Readonly<{sourceTextId: 'character-34'; instanceId: string;
    text: string; x: number; y: number; runtimePositionRequired: boolean}>;
  readonly feedbackText: Readonly<{sourceTextId: 'character-73/run-0'; text: string}>;
  readonly coachMarker: Readonly<{sourceTextId: 'character-75/run-0'; text: string;
    studentFacing: false}>;
}

/** The held frame 119 supplies the interaction reducer's coordinate value.
 * Parent bubble motion after that frame must come from the same reducer. */
export function p012TextSnapshot(frame: number, coordinateText = '(0,0)'): P012TextSnapshot {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 119) throw new RangeError('P012 main frame must be 1–119');
  if (!/^\(-?(?:10|[0-9]),-?(?:10|[0-9])\)$/.test(coordinateText))
    throw new RangeError('P012 coordinate text must be a bounded source-format ordered pair');
  const introRuns = [...instructionAt(frame, 51, 49), ...instructionAt(frame, 55, 54)];
  const direct = instance(P012_TEXT_DATA.dynamicCoordinate.introInstanceId);
  const nested = instance(P012_TEXT_DATA.dynamicCoordinate.bubbleFieldInstanceId);
  const coordinateInstance = frame < 119 ? direct : nested;
  const coordinatePose = poseAt(coordinateInstance, frame < 119 ? frame : 1);
  if (!coordinatePose) throw new Error('P012 missing coordinate source pose');
  const bubbleParent = parentPlacements.find(item => item.childTimelineId === 'sprite-61');
  if (!bubbleParent) throw new Error('P012 missing coordinate bubble placement');
  const local = point(coordinatePose.matrix, -40, -40);
  const mainPoint = frame < 119 ? local : point(bubbleParent.matrix, ...local);
  const [x, y] = stagePoint(...mainPoint);
  const feedback = definition(73).runs?.[0], coach = definition(75).runs?.[0];
  if (!feedback || !coach) throw new Error('P012 missing feedback/coach source text');
  return {frame, sourceSwfSha256: P012_TEXT_DATA.source.swfSha256,
    introText: introRuns.map(run => run.text).join(''), introRuns,
    labels: positionedText(frame, ['axis-number', 'x-axis-label', 'y-axis-label']),
    controlLabels: positionedText(frame, [
      'control-up-3','control-up-1','control-right-1','control-left-1',
      'control-down-1','control-down-3','control-right-3','control-left-3']),
    coordinate: {sourceTextId: 'character-34', instanceId: coordinateInstance.instanceId,
      text: coordinateText, x, y, runtimePositionRequired: frame === 119},
    feedbackText: {sourceTextId: 'character-73/run-0', text: feedback.text},
    coachMarker: {sourceTextId: 'character-75/run-0', text: coach.text, studentFacing: false}};
}
