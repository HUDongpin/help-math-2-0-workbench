import type {G4L12VB036WrongVariant} from './g4-l12-vb036-source-controller';

type Point = Readonly<{x: number; y: number}>;
type Matrix = readonly [number, number, number, number, number, number];

export const G4_L12_VB036_CLOSE_HIT_SOURCE = Object.freeze({
  sourceSwfSha256: '08c76350118e13f0e423692a57881fec48506aed533c780e2662503b08e96f3b',
  sourceXmlSha256: '5ad69306d727906b07b8653cb0e7091e7cf7abd6265e222bb86fabb1d1b15567',
  sourceButtonCharacterId: 52,
  sourceHitAreaObjectId: 44,
  otherContainedHitObjects: Object.freeze([45, 49]),
  offstageHitObjectId: 50,
  geometry: 'source-derived-static-quadrilateral',
  originalHitParityEstablished: false,
  buttonDownAudioEstablished: false,
  avm1EventTargetScope: 'unresolved-original-runtime-required',
} as const);

// Source twips and XML matrix values, not a browser-measured bounding box.
// Shape44 is filled; text45's glyph control hulls and shape49 lie inside it.
// The fourth hit object, shape50 at (-14907,-30), is left of the stage in
// every placed frame. Independent raw-XML tests prove both reductions.
const SHAPE_44_CORNERS = [[-964, -262], [965, -262], [965, 268], [-964, 268]] as const;
const ROOT_PLACEMENT: Matrix = [1, 0, 0, 1, 8248, 5666];
const BUTTON_PLACEMENT: Matrix = [1, 0, 0, 1, 4126, -1178];
const WRONG_PLACEMENTS: Readonly<Record<G4L12VB036WrongVariant, Matrix>> = {
  1: [1, 0, 0, 1, -221, 205],
  2: [1.044097900390625, 0, 0, 1.044097900390625, -239, 51],
  3: [1, 0, 0, 1, -235, -203],
};

function multiply(p: Matrix, q: Matrix): Matrix {
  const [a, b, c, d, x, y] = p;
  const [e, f, g, h, u, v] = q;
  return [a * e + c * f, b * e + d * f, a * g + c * h, b * g + d * h,
    a * u + c * v + x, b * u + d * v + y];
}

export function resolveG4L12Vb036CloseHitRegion(variant: G4L12VB036WrongVariant, frame: number) {
  if (![1, 2, 3].includes(variant) || !Number.isInteger(frame) || frame < 1 || frame > (variant === 3 ? 31 : 28)) {
    throw new RangeError('VB036 Close geometry requires a source wrong variant and one-indexed local frame.');
  }
  const first = variant === 2 ? 16 : 13;
  if (frame < first || frame >= 23) return null;
  const endpoint = frame === first || frame === 22;
  const popup: Matrix = endpoint
    ? [1.004913330078125, 0.0011138916015625, -0.001129150390625,
      1.004776000976562, variant === 2 ? -78 : -221,
      variant === 1 ? -2477 : variant === 2 ? -2151 : -1997]
    : [1.0048828125, 0.0002899169921875, -0.00030517578125,
      1.0047607421875, variant === 1 ? -221 : variant === 2 ? -79 : -222,
      variant === 1 ? -2477 : variant === 2 ? -2151 : -1997];
  const matrix = multiply(multiply(multiply(ROOT_PLACEMENT, WRONG_PLACEMENTS[variant]), popup), BUTTON_PLACEMENT);
  const [a, b, c, d, x, y] = matrix;
  const alpha = variant === 2 ? [0, 43, 85, 128, 171, 213, 256]
    : [0, 28, 57, 85, 114, 142, 171, 199, 228, 256];
  return Object.freeze({
    ...G4_L12_VB036_CLOSE_HIT_SOURCE,
    variant, localFrame: frame,
    sourceAlpha: alpha[frame - first]! / 256,
    points: Object.freeze(SHAPE_44_CORNERS.map(([u, v]) => Object.freeze({
      x: (a * u + c * v + x) / 20,
      y: (b * u + d * v + y) / 20,
    }))),
  });
}

// Recheck the actual pointer coordinate as well as CSS clip-path. In
// particular, the tiny corners of the axis-aligned box are not source hits.
export function g4L12Vb036CloseHitContainsPoint(
  region: NonNullable<ReturnType<typeof resolveG4L12Vb036CloseHitRegion>>,
  point: Point,
) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  let sign = 0;
  for (let index = 0; index < region.points.length; index += 1) {
    const a = region.points[index]!;
    const b = region.points[(index + 1) % region.points.length]!;
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross === 0) continue;
    const next = Math.sign(cross);
    if (sign !== 0 && sign !== next) return false;
    sign = next;
  }
  return true;
}
