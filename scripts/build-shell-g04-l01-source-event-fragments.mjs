#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const ANIMATION_ID = "shell-course-g04-l01-index-local";
export const OUTPUT_RELATIVE_PATH = `migrations/${ANIMATION_ID}/audit/source-event-fragments.json`;

const WORKSPACE_RELATIVE_PATH = `migrations/${ANIMATION_ID}`;
const SOURCE_SWF_RELATIVE_PATH = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index_local.swf";
const COURSE_XML_RELATIVE_PATH = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index.xml";
const SHELL_EXCLUSION_RELATIVE_PATH = `work/adobe-course-host-fixtures/shell-exclusion/${ANIMATION_ID}.json`;
const SAME_LESSON_BINDING_RELATIVE_PATH = "migrations/course-g04-l01-ir-001/audit/same-lesson-shell-host-entry-binding.json";
const SOURCE_SWF_SHA256 = "ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e";
const COURSE_XML_SHA256 = "b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const EXPECTED_SCENARIOS = Object.freeze([
  "default",
  "section-ir",
  "section-rw",
  "section-vb",
  "section-in",
  "section-ti",
  "section-gs",
  "section-ts",
  "section-fq",
  "quit-confirmation",
]);
const EXPECTED_REQUIREMENT_COUNT = EXPECTED_SCENARIOS.length * 2;

const MAP_RELEASE = Object.freeze({
  id: "M1",
  event: "release",
  handlerScript: "DefineButton2_1211/BUTTONCONDACTION on(release).as",
  handlerBodySha256: "8cd4e614f0ab338368b68d85db6877f40ca20b28fe06cdcb81ab327e0f0f92fe",
  buttonObjectId: "1211",
  hitShapeObjectId: "1204",
  placementChain: Object.freeze([
    Object.freeze({timelineId: "root", frame: 50, depth: "406", objectId: "1211", name: "map"}),
  ]),
});

const SECTION_HOVERS = Object.freeze([
  Object.freeze({
    id: "M2-RW",
    scenario: "section-rw",
    section: "RW",
    event: "rollOver",
    handlerScript: "DefineButton2_796/BUTTONCONDACTION on(rollOver).as",
    handlerBodySha256: "98bc544068ec75536ab5b6f00d0932ca2a076e05b3bf2d563a226e9e2664e536",
    eventTarget: {kind: "button-definition", objectId: "796"},
    buttonObjectId: "796",
    hitShapeObjectId: "777",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "15", objectId: "797", name: "L1RW02"},
      {timelineId: "sprite-797", frame: 1, depth: "1", objectId: "796", name: ""},
    ],
    moverLabel: "RW01",
    mapLabel: "m1_l1_sub",
    mapFrame: 9,
  }),
  Object.freeze({
    id: "M2-VB",
    scenario: "section-vb",
    section: "VB",
    event: "rollOver",
    handlerScript: "DefineSprite_1177/frame_9/PlaceObject2_816_17/CLIPACTIONRECORD on(rollOver).as",
    handlerBodySha256: "1cfe7ee3882b6f9d41618bf93461921b39215e31997d0fc48e7815ef8b359146",
    eventTarget: {kind: "placed-clip", timelineId: "sprite-1177", frame: 9, depth: "17", objectId: "816", name: "L1VB01"},
    buttonObjectId: "815",
    hitShapeObjectId: "798",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "17", objectId: "816", name: "L1VB01"},
      {timelineId: "sprite-816", frame: 1, depth: "1", objectId: "815", name: ""},
    ],
    moverLabel: "VB01",
    mapLabel: "m1_l1_sub_1",
    mapFrame: 18,
  }),
  Object.freeze({
    id: "M2-IN",
    scenario: "section-in",
    section: "IN",
    event: "rollOver",
    handlerScript: "DefineSprite_1177/frame_9/PlaceObject2_830_19/CLIPACTIONRECORD on(rollOver).as",
    handlerBodySha256: "ed3a5608bf17201e504acdc1934ecfd8c320749b71594b577c7fb074a81cb9e7",
    eventTarget: {kind: "placed-clip", timelineId: "sprite-1177", frame: 9, depth: "19", objectId: "830", name: "L1IN01"},
    buttonObjectId: "829",
    hitShapeObjectId: "817",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "19", objectId: "830", name: "L1IN01"},
      {timelineId: "sprite-830", frame: 1, depth: "1", objectId: "829", name: ""},
    ],
    moverLabel: "IN01",
    mapLabel: "m1_l1_sub_2",
    mapFrame: 28,
  }),
  Object.freeze({
    id: "M2-TI",
    scenario: "section-ti",
    section: "TI",
    event: "rollOver",
    handlerScript: "DefineButton2_840/BUTTONCONDACTION on(rollOver).as",
    handlerBodySha256: "9c226cacf54d97e718530969ff72659f8e11ed0706f4405d9a82b78d6628c4ab",
    eventTarget: {kind: "button-definition", objectId: "840"},
    buttonObjectId: "840",
    hitShapeObjectId: "777",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "21", objectId: "841", name: "L1TI01"},
      {timelineId: "sprite-841", frame: 1, depth: "1", objectId: "840", name: ""},
    ],
    moverLabel: "TI01",
    mapLabel: "m1_l1_sub",
    mapFrame: 9,
  }),
  Object.freeze({
    id: "M2-GS",
    scenario: "section-gs",
    section: "GS",
    event: "rollOver",
    handlerScript: "DefineButton2_850/BUTTONCONDACTION on(rollOver).as",
    handlerBodySha256: "d3812f73fb9517142773379e02a799af19b62ad0dec8e09b23d5e713499edf9e",
    eventTarget: {kind: "button-definition", objectId: "850"},
    buttonObjectId: "850",
    hitShapeObjectId: "777",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "23", objectId: "851", name: "L1GS01"},
      {timelineId: "sprite-851", frame: 1, depth: "1", objectId: "850", name: ""},
    ],
    moverLabel: "GS01",
    mapLabel: "m1_l1_sub",
    mapFrame: 9,
  }),
  Object.freeze({
    id: "M2-TS",
    scenario: "section-ts",
    section: "TS",
    event: "rollOver",
    handlerScript: "DefineSprite_1177/frame_9/PlaceObject2_864_25/CLIPACTIONRECORD on(rollOver).as",
    handlerBodySha256: "1c53498cea52055ba2c2821b83a090e342975ba1da10c61373104d6da226d4ac",
    eventTarget: {kind: "placed-clip", timelineId: "sprite-1177", frame: 9, depth: "25", objectId: "864", name: "L1TS01"},
    buttonObjectId: "863",
    hitShapeObjectId: "852",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "25", objectId: "864", name: "L1TS01"},
      {timelineId: "sprite-864", frame: 1, depth: "1", objectId: "863", name: ""},
    ],
    moverLabel: "TS01",
    mapLabel: "m1_l1_sub_3",
    mapFrame: 38,
  }),
  Object.freeze({
    id: "M2-FQ",
    scenario: "section-fq",
    section: "FQ",
    event: "rollOver",
    handlerScript: "DefineButton2_871/BUTTONCONDACTION on(rollOver).as",
    handlerBodySha256: "ecbb873953761294275eb22a1ef83fdd47bf3f7e5b0360eb1c8f28e22f17ee16",
    eventTarget: {kind: "button-definition", objectId: "871"},
    buttonObjectId: "871",
    hitShapeObjectId: "777",
    placementChain: [
      {timelineId: "root", frame: 50, depth: "263", objectId: "1177", name: "m1_l1"},
      {timelineId: "sprite-1177", frame: 9, depth: "27", objectId: "872", name: "L1FQ01"},
      {timelineId: "sprite-872", frame: 1, depth: "1", objectId: "871", name: ""},
    ],
    moverLabel: "FQ01",
    mapLabel: "m1_l1_sub",
    mapFrame: 9,
  }),
]);

const QUIT_RELEASE = Object.freeze({
  id: "Q1",
  event: "release",
  handlerScript: "DefineButton2_229/BUTTONCONDACTION on(release).as",
  handlerBodySha256: "6e9d6277e9c500c916981a9acdae3c61dc6520b9cb9c45bcdd510050583fe22c",
  buttonObjectId: "229",
  hitShapeObjectId: "228",
  placementChain: Object.freeze([
    Object.freeze({timelineId: "root", frame: 49, depth: "216", objectId: "229", name: "closer"}),
  ]),
});

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

export function canonicalJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(value, label) {
  invariant(SHA256_PATTERN.test(value || ""), `${label} must be a lowercase SHA-256 digest`);
}

async function readArtifact(root, relativePath, label = relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `${label} escapes the project root`);
  const bytes = await readFile(absolutePath);
  return {absolutePath, bytes, path: portable(relative), sha256: sha256(bytes)};
}

async function readJsonArtifact(root, relativePath, label = relativePath) {
  const artifact = await readArtifact(root, relativePath, label);
  try {
    artifact.value = JSON.parse(artifact.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return artifact;
}

function publicArtifact(artifact, extra = {}) {
  return {
    path: artifact.path,
    sha256: artifact.sha256,
    bytes: artifact.bytes.length,
    ...extra,
  };
}

function publicProjectionArtifact(artifact, projection, projectedSha256) {
  return {
    path: artifact.path,
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection,
    sha256: projectedSha256,
  };
}

function parseAttributes(source) {
  const attributes = {};
  for (const match of source.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) attributes[match[1]] = match[2];
  return attributes;
}

function identityMatrixSource() {
  return {scaleX: "1", skewX: "0", skewY: "0", scaleY: "1", transX: "0", transY: "0"};
}

function directTimeline(stack) {
  const parent = stack.at(-1);
  const owner = stack.at(-2);
  return parent?.name === "tags" && (owner?.name === "Header" || owner?.name === "DefineSprite")
    ? owner.timeline
    : null;
}

function nearestTransformTarget(stack) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].placement) return stack[index].placement;
    if (stack[index].hitRecord) return stack[index].hitRecord;
  }
  return null;
}

/** Parse only the structural swfmill facts used by this evidence artifact. */
export function parseSwfmillShellStructure(xml) {
  const stack = [];
  const timelines = new Map();
  const shapes = new Map();
  const buttons = new Map();
  let stageBoundsTwips = null;
  let frameRate = null;
  const tokenPattern = /<\/?([A-Za-z_][\w:.-]*)([^>]*)>/g;
  for (const match of xml.matchAll(tokenPattern)) {
    const raw = match[0];
    if (raw.startsWith("<?") || raw.startsWith("<!")) continue;
    const name = match[1];
    const closing = raw.startsWith("</");
    if (closing) {
      const node = stack.pop();
      invariant(node?.name === name, `swfmill XML nesting mismatch: expected ${node?.name || "none"}, received ${name}`);
      continue;
    }
    const attributes = parseAttributes(match[2]);
    const selfClosing = /\/\s*>$/.test(raw);
    const parent = stack.at(-1);
    const grandparent = stack.at(-2);
    const timeline = directTimeline(stack);
    const node = {name, attributes};

    if (name === "Header") {
      const root = {
        timelineId: "root",
        objectId: null,
        declaredFrames: Number.parseInt(attributes.frames, 10),
        currentFrame: 1,
        observedShowFrames: 0,
        placements: [],
        labels: [],
      };
      invariant(Number.isInteger(root.declaredFrames) && root.declaredFrames > 0, "invalid root frame count");
      frameRate = Number(attributes.framerate);
      timelines.set("root", root);
      node.timeline = root;
    } else if (name === "DefineSprite") {
      const objectId = attributes.objectID;
      invariant(objectId, "DefineSprite objectID is missing");
      const sprite = {
        timelineId: `sprite-${objectId}`,
        objectId,
        declaredFrames: Number.parseInt(attributes.frames, 10),
        currentFrame: 1,
        observedShowFrames: 0,
        placements: [],
        labels: [],
      };
      invariant(Number.isInteger(sprite.declaredFrames) && sprite.declaredFrames > 0, `${sprite.timelineId}: invalid frame count`);
      invariant(!timelines.has(sprite.timelineId), `${sprite.timelineId}: duplicate definition`);
      timelines.set(sprite.timelineId, sprite);
      node.timeline = sprite;
    } else if (/^DefineShape(?:2|3|4)?$/.test(name)) {
      const objectId = attributes.objectID;
      invariant(objectId, `${name} objectID is missing`);
      const shape = {objectId, definitionTag: name, boundsTwips: null};
      shapes.set(objectId, shape);
      node.shape = shape;
    } else if (name === "DefineButton2") {
      const objectId = attributes.objectID;
      invariant(objectId, "DefineButton2 objectID is missing");
      const button = {objectId, hitRecords: []};
      buttons.set(objectId, button);
      node.button = button;
    }

    if (name === "Rectangle" && parent?.name === "size" && grandparent?.name === "Header") {
      stageBoundsTwips = Object.fromEntries(["left", "right", "top", "bottom"].map((key) => [key, attributes[key] ?? "0"]));
    } else if (name === "Rectangle" && parent?.name === "bounds" && grandparent?.shape) {
      grandparent.shape.boundsTwips = Object.fromEntries(["left", "right", "top", "bottom"].map((key) => [key, attributes[key] ?? "0"]));
    }

    if (name === "Button" && parent?.name === "buttons" && grandparent?.button && attributes.hitTest === "1" && attributes.objectID) {
      const hitRecord = {
        shapeObjectId: attributes.objectID,
        depth: attributes.depth || "",
        matrixSourceDecimals: identityMatrixSource(),
      };
      grandparent.button.hitRecords.push(hitRecord);
      node.hitRecord = hitRecord;
    }

    if (timeline) {
      if (name === "ShowFrame") {
        timeline.observedShowFrames += 1;
        timeline.currentFrame += 1;
      } else if (name === "FrameLabel") {
        timeline.labels.push({frame: timeline.currentFrame, label: attributes.label || attributes.name || ""});
      } else if (name === "PlaceObject" || name === "PlaceObject2" || name === "PlaceObject3") {
        const placement = {
          tag: name,
          timelineId: timeline.timelineId,
          frame: timeline.currentFrame,
          depth: String(attributes.depth ?? ""),
          objectId: attributes.objectID ?? null,
          name: attributes.name || "",
          matrixSourceDecimals: identityMatrixSource(),
        };
        timeline.placements.push(placement);
        node.placement = placement;
      }
    }

    if (name === "Transform") {
      const target = nearestTransformTarget(stack);
      if (target) {
        target.matrixSourceDecimals = {
          scaleX: attributes.scaleX ?? "1",
          skewX: attributes.skewX ?? "0",
          skewY: attributes.skewY ?? "0",
          scaleY: attributes.scaleY ?? "1",
          transX: attributes.transX ?? "0",
          transY: attributes.transY ?? "0",
        };
      }
    }

    if (!selfClosing) stack.push(node);
  }
  invariant(stack.length === 0, "swfmill XML ended with unclosed elements");
  invariant(stageBoundsTwips, "swfmill stage bounds are missing");
  invariant(frameRate === 12, `expected 12 FPS, observed ${frameRate}`);
  for (const timeline of timelines.values()) {
    invariant(timeline.observedShowFrames === timeline.declaredFrames,
      `${timeline.timelineId}: observed ${timeline.observedShowFrames} ShowFrame tags, expected ${timeline.declaredFrames}`);
  }
  return {frameRate, stageBoundsTwips, timelines, shapes, buttons};
}

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b) [a, b] = [b, a % b];
  return a;
}

function fraction(numerator, denominator = 1n) {
  invariant(denominator !== 0n, "zero denominator");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return {n: sign * numerator / divisor, d: sign * denominator / divisor};
}

function decimalFraction(source) {
  invariant(/^-?\d+(?:\.\d+)?$/.test(source), `invalid source decimal ${source}`);
  const negative = source.startsWith("-");
  const unsigned = negative ? source.slice(1) : source;
  const [whole, fractional = ""] = unsigned.split(".");
  const denominator = 10n ** BigInt(fractional.length);
  const numerator = BigInt(`${whole}${fractional}` || "0") * (negative ? -1n : 1n);
  return fraction(numerator, denominator);
}

function add(left, right) {
  return fraction(left.n * right.d + right.n * left.d, left.d * right.d);
}

function multiply(left, right) {
  return fraction(left.n * right.n, left.d * right.d);
}

function divide(left, right) {
  return fraction(left.n * right.d, left.d * right.n);
}

function compareFraction(left, right) {
  const difference = left.n * right.d - right.n * left.d;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function exactDecimal(value) {
  let denominator = value.d;
  let twos = 0;
  let fives = 0;
  while (denominator % 2n === 0n) {
    denominator /= 2n;
    twos += 1;
  }
  while (denominator % 5n === 0n) {
    denominator /= 5n;
    fives += 1;
  }
  invariant(denominator === 1n, "fraction does not have a terminating decimal representation");
  const places = Math.max(twos, fives);
  const scaled = value.n * (2n ** BigInt(places - twos)) * (5n ** BigInt(places - fives));
  const negative = scaled < 0n;
  const digits = (negative ? -scaled : scaled).toString().padStart(places + 1, "0");
  if (places === 0) return `${negative ? "-" : ""}${digits}`;
  const whole = digits.slice(0, -places) || "0";
  const fractionDigits = digits.slice(-places).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fractionDigits ? `.${fractionDigits}` : ""}`;
}

function numeric(value) {
  return Number(value.n) / Number(value.d);
}

function matrixFromSource(source) {
  return {
    a: decimalFraction(source.scaleX),
    b: decimalFraction(source.skewY),
    c: decimalFraction(source.skewX),
    d: decimalFraction(source.scaleY),
    tx: decimalFraction(source.transX),
    ty: decimalFraction(source.transY),
  };
}

function identityMatrix() {
  return matrixFromSource(identityMatrixSource());
}

function composeMatrices(outer, inner) {
  return {
    a: add(multiply(outer.a, inner.a), multiply(outer.c, inner.b)),
    b: add(multiply(outer.b, inner.a), multiply(outer.d, inner.b)),
    c: add(multiply(outer.a, inner.c), multiply(outer.c, inner.d)),
    d: add(multiply(outer.b, inner.c), multiply(outer.d, inner.d)),
    tx: add(add(multiply(outer.a, inner.tx), multiply(outer.c, inner.ty)), outer.tx),
    ty: add(add(multiply(outer.b, inner.tx), multiply(outer.d, inner.ty)), outer.ty),
  };
}

function applyMatrix(matrix, x, y) {
  return {
    x: add(add(multiply(matrix.a, x), multiply(matrix.c, y)), matrix.tx),
    y: add(add(multiply(matrix.b, x), multiply(matrix.d, y)), matrix.ty),
  };
}

function findExactlyOne(items, predicate, label) {
  const matches = items.filter(predicate);
  invariant(matches.length === 1, `expected exactly one ${label}, observed ${matches.length}`);
  return matches[0];
}

export function deriveHitGeometry(structure, specification) {
  let composite = identityMatrix();
  const resolvedPlacements = [];
  for (const expected of specification.placementChain) {
    const timeline = structure.timelines.get(expected.timelineId);
    invariant(timeline, `${specification.id}: missing ${expected.timelineId}`);
    const placement = findExactlyOne(
      timeline.placements,
      (candidate) => candidate.frame === expected.frame
        && candidate.depth === expected.depth
        && candidate.objectId === expected.objectId
        && candidate.name === expected.name,
      `${specification.id} ${expected.timelineId} placement`,
    );
    composite = composeMatrices(composite, matrixFromSource(placement.matrixSourceDecimals));
    resolvedPlacements.push({...placement});
  }
  const finalPlacement = resolvedPlacements.at(-1);
  invariant(finalPlacement.objectId === specification.buttonObjectId,
    `${specification.id}: final placement does not resolve button ${specification.buttonObjectId}`);
  const button = structure.buttons.get(specification.buttonObjectId);
  invariant(button, `${specification.id}: missing DefineButton2 ${specification.buttonObjectId}`);
  const hitRecord = findExactlyOne(
    button.hitRecords,
    (candidate) => candidate.shapeObjectId === specification.hitShapeObjectId,
    `${specification.id} button ${specification.buttonObjectId} hit record for shape ${specification.hitShapeObjectId}`,
  );
  const shape = structure.shapes.get(specification.hitShapeObjectId);
  invariant(shape?.boundsTwips, `${specification.id}: missing hit shape bounds ${specification.hitShapeObjectId}`);
  composite = composeMatrices(composite, matrixFromSource(hitRecord.matrixSourceDecimals));
  const sourceBounds = Object.fromEntries(Object.entries(shape.boundsTwips).map(([key, value]) => [key, decimalFraction(value)]));
  const corners = [
    applyMatrix(composite, sourceBounds.left, sourceBounds.top),
    applyMatrix(composite, sourceBounds.right, sourceBounds.top),
    applyMatrix(composite, sourceBounds.right, sourceBounds.bottom),
    applyMatrix(composite, sourceBounds.left, sourceBounds.bottom),
  ];
  const twips = {
    left: corners.map(({x}) => x).reduce((left, right) => compareFraction(left, right) <= 0 ? left : right),
    right: corners.map(({x}) => x).reduce((left, right) => compareFraction(left, right) >= 0 ? left : right),
    top: corners.map(({y}) => y).reduce((left, right) => compareFraction(left, right) <= 0 ? left : right),
    bottom: corners.map(({y}) => y).reduce((left, right) => compareFraction(left, right) >= 0 ? left : right),
  };
  const twenty = decimalFraction("20");
  const two = decimalFraction("2");
  const pixels = Object.fromEntries(Object.entries(twips).map(([key, value]) => [key, divide(value, twenty)]));
  pixels.width = add(pixels.right, fraction(-pixels.left.n, pixels.left.d));
  pixels.height = add(pixels.bottom, fraction(-pixels.top.n, pixels.top.d));
  const center = {
    x: divide(add(pixels.left, pixels.right), two),
    y: divide(add(pixels.top, pixels.bottom), two),
  };
  const stage = {
    left: divide(decimalFraction(structure.stageBoundsTwips.left), twenty),
    right: divide(decimalFraction(structure.stageBoundsTwips.right), twenty),
    top: divide(decimalFraction(structure.stageBoundsTwips.top), twenty),
    bottom: divide(decimalFraction(structure.stageBoundsTwips.bottom), twenty),
  };
  invariant(compareFraction(center.x, stage.left) >= 0 && compareFraction(center.x, stage.right) <= 0
    && compareFraction(center.y, stage.top) >= 0 && compareFraction(center.y, stage.bottom) <= 0,
  `${specification.id}: selected hit-record center lies outside the native stage`);
  const exactObject = (value) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, exactDecimal(item)]));
  const numericObject = (value) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, numeric(item)]));
  return {
    coordinateSpace: "native-stage-pixels",
    selectedHitRecord: {
      buttonObjectId: Number(specification.buttonObjectId),
      hitShapeObjectId: Number(specification.hitShapeObjectId),
      depth: Number(hitRecord.depth),
      buttonHitRecordCount: button.hitRecords.length,
      transformSourceDecimals: hitRecord.matrixSourceDecimals,
    },
    sourceShape: {
      objectId: Number(shape.objectId),
      definitionTag: shape.definitionTag,
      boundsTwips: Object.fromEntries(Object.entries(shape.boundsTwips).map(([key, value]) => [key, Number(value)])),
    },
    placementChain: resolvedPlacements.map((placement) => ({
      timelineId: placement.timelineId,
      frame: placement.frame,
      depth: Number(placement.depth),
      objectId: Number(placement.objectId),
      name: placement.name,
      tag: placement.tag,
      transformSourceDecimals: placement.matrixSourceDecimals,
    })),
    bounds: {exactDecimals: exactObject(pixels), numeric: numericObject(pixels)},
    interiorPoint: {exactDecimals: exactObject(center), numeric: numericObject(center)},
    derivationOrder: [...resolvedPlacements.map(({timelineId}) => `${timelineId}-placement`), "button-hit-record", "shape-bounds", "twips-to-pixels"],
  };
}

export function parseFfdecScriptBlocks(source) {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^===== (.+) =====$/);
    if (match) headings.push({index, script: match[1]});
  }
  const blocks = headings.map((heading, position) => {
    const end = headings[position + 1]?.index ?? lines.length;
    let first = heading.index + 1;
    let last = end - 1;
    while (first < end && lines[first] === "") first += 1;
    while (last >= first && lines[last] === "") last -= 1;
    const body = first <= last ? lines.slice(first, last + 1).join("\n") : "";
    return {
      script: heading.script,
      headingLine: heading.index + 1,
      bodyLineStart: first + 1,
      bodyLineEnd: last + 1,
      lineStart: heading.index + 1,
      lineEnd: last + 1,
      body,
      bodySha256: sha256(body),
    };
  });
  return {blocks, lines};
}

function requiredScript(parsed, script, expectedSha256, requiredStatements = []) {
  const block = findExactlyOne(parsed.blocks, (candidate) => candidate.script === script, `FFDec script ${script}`);
  if (expectedSha256) invariant(block.bodySha256 === expectedSha256,
    `${script}: body SHA-256 differs (${block.bodySha256})`);
  for (const statement of requiredStatements) invariant(block.body.includes(statement), `${script}: missing ${statement}`);
  return block;
}

function scriptEvidence(block) {
  return {
    artifactId: "ffdec-scripts",
    script: block.script,
    lineStart: block.lineStart,
    lineEnd: block.lineEnd,
    bodySha256: block.bodySha256,
  };
}

function exactLineExcerpt(parsed, firstLine, lastLine, requiredStatements = []) {
  invariant(Number.isInteger(firstLine) && Number.isInteger(lastLine) && firstLine > 0 && lastLine >= firstLine,
    "invalid FFDec line excerpt");
  const text = parsed.lines.slice(firstLine - 1, lastLine).join("\n");
  for (const statement of requiredStatements) invariant(text.includes(statement), `FFDec lines ${firstLine}-${lastLine}: missing ${statement}`);
  return {
    artifactId: "ffdec-scripts",
    lineStart: firstLine,
    lineEnd: lastLine,
    excerptSha256: sha256(text),
  };
}

function requireMapState(structure, label, frame) {
  const timeline = structure.timelines.get("sprite-1177");
  invariant(timeline?.declaredFrames === 48, "sprite-1177 frame count differs");
  const labelRecord = findExactlyOne(timeline.labels, (candidate) => candidate.label === label, `sprite-1177 label ${label}`);
  invariant(labelRecord.frame === frame, `sprite-1177 ${label} frame differs`);
  return {timelineId: "sprite-1177", label, frame, playState: "stopped"};
}

function sourceEventAction(event, geometry) {
  return {
    sourceEvent: event,
    pointer: geometry.interiorPoint,
    selectedHitBounds: geometry.bounds,
    executorGestureCandidate: event === "release"
      ? {kind: "primary-pointer-click", sequence: ["pointerMove", "pointerDown", "pointerUp"]}
      : {kind: "pointer-entry", sequence: ["pointerMove-from-outside-target-to-interior"]},
    executorGestureAuthority: "deterministic-translation-only-not-original-runtime-executed",
  };
}

function requirementIdFor(scenario, language) {
  return `req:root:${scenario}:${language}`;
}

export function deriveAuthorityBoundary({coverage, traceSpecs}) {
  invariant(coverage.schemaVersion === 2, "full-frame coverage schema must be 2");
  invariant(coverage.animationId === ANIMATION_ID, "coverage animation identity differs");
  invariant(Array.isArray(coverage.requirements) && coverage.requirements.length === EXPECTED_REQUIREMENT_COUNT,
    `expected ${EXPECTED_REQUIREMENT_COUNT} coverage requirements`);
  const expectedIds = EXPECTED_SCENARIOS.flatMap((scenario) => ["en", "es"].map((language) => requirementIdFor(scenario, language)));
  const observedIds = coverage.requirements.map(({requirementId}) => requirementId);
  invariant(JSON.stringify(observedIds) === JSON.stringify(expectedIds), "coverage requirement order or identity differs");
  invariant(traceSpecs.size === EXPECTED_REQUIREMENT_COUNT, `expected ${EXPECTED_REQUIREMENT_COUNT} trace specs`);
  const disposition = [];
  let implementationCapturedRequirementCount = 0;
  let implementationCapturedFrameCount = 0;
  for (const requirement of coverage.requirements) {
    const label = requirement.requirementId;
    invariant(requirement.frameDomainId === "root", `${label}: frame domain must remain root`);
    invariant(requirement.seed === "0", `${label}: seed must remain 0`);
    invariant(requirement.requiredRange?.firstFrame === 1 && requirement.requiredRange?.lastFrame === 50,
      `${label}: required range differs from 1..50`);
    invariant(requirement.status === "blocked", `${label}: coverage must remain blocked`);
    invariant(requirement.baselineAuthority === "unresolved", `${label}: baseline authority must remain unresolved`);
    invariant(!requirement.baselineCaptureManifest && !requirement.baselineCaptureManifestSha256,
      `${label}: original-runtime baseline capture binding must remain absent`);
    invariant(!requirement.metricsFile && !requirement.metricsSha256,
      `${label}: paired baseline/implementation metrics must remain absent`);
    invariant(Number.isInteger(requirement.capturedFrameCount)
      && (requirement.capturedFrameCount === 0 || requirement.capturedFrameCount === 50),
    `${label}: implementation captured frame count must be either 0 or the complete 50-frame requirement`);
    invariant(Array.isArray(requirement.missingFrames), `${label}: missing frames must be an array`);
    const hasImplementationCapture = requirement.capturedFrameCount === 50;
    if (hasImplementationCapture) {
      invariant(requirement.missingFrames.length === 0, `${label}: complete implementation capture must have no missing frames`);
      invariant(typeof requirement.captureManifest === "string"
        && requirement.captureManifest.startsWith("output/playwright/")
        && requirement.captureManifest.endsWith("/capture-manifest.json")
        && !requirement.captureManifest.includes("..")
        && !path.isAbsolute(requirement.captureManifest),
      `${label}: complete implementation capture requires a project-relative Playwright capture manifest`);
      invariant(typeof requirement.captureManifestSha256 === "string"
        && /^[0-9a-f]{64}$/.test(requirement.captureManifestSha256),
      `${label}: complete implementation capture requires a lowercase SHA-256 manifest binding`);
      implementationCapturedRequirementCount += 1;
      implementationCapturedFrameCount += requirement.capturedFrameCount;
    } else {
      invariant(requirement.missingFrames.length === 50
        && requirement.missingFrames.every((frame, index) => frame === index + 1),
      `${label}: absent implementation capture must retain missing frames 1..50`);
      invariant(!requirement.captureManifest && !requirement.captureManifestSha256,
        `${label}: absent implementation capture must not claim a capture manifest binding`);
    }
    const spec = traceSpecs.get(label);
    invariant(spec, `${label}: trace spec is missing`);
    invariant(spec.value.animationId === ANIMATION_ID && spec.value.requirementId === label, `${label}: trace spec identity differs`);
    invariant(spec.value.traceSpecStatus === "unresolved", `${label}: trace spec must remain unresolved`);
    invariant(spec.value.schedule?.status === "unresolved-no-complete-source-event-schedule", `${label}: schedule status differs`);
    invariant(Array.isArray(spec.value.schedule?.orderedSteps) && spec.value.schedule.orderedSteps.length === 0,
      `${label}: orderedSteps must remain empty`);
    invariant(spec.value.schedule?.terminalSemantics?.status === "unresolved", `${label}: terminal semantics must remain unresolved`);
    disposition.push({
      requirementId: label,
      scenario: requirement.scenario,
      language: requirement.language,
      seed: requirement.seed,
      entryStateSha256: requirement.entryStateSha256,
      coverageStatus: requirement.status,
      baselineAuthority: requirement.baselineAuthority,
      capturedFrameCount: requirement.capturedFrameCount,
      missingFrameCount: requirement.missingFrames.length,
      implementationCaptureAuthority: hasImplementationCapture
        ? "non-authoritative-current-javascript-output-only"
        : "none",
      traceSpec: {path: spec.path, sha256: spec.sha256, status: spec.value.traceSpecStatus, orderedStepCount: 0},
      sourceEventFragmentEligibility: "unresolved-complete-schedule-not-proven",
    });
  }
  return {
    acceptanceNeutral: true,
    requirementCount: disposition.length,
    sourceEvidencedExecutableRequirementCount: 0,
    unresolvedRequirementCount: disposition.length,
    implementationCapturedRequirementCount,
    implementationCapturedFrameCount,
    implementationCaptureAuthority: implementationCapturedRequirementCount > 0
      ? "non-authoritative-current-javascript-output-only"
      : "none",
    allRequirementsRemainUnresolved: true,
    mayPopulateTraceSpecOrderedSteps: false,
    mayChangeCoverageOrMigrationStatus: false,
    originalRuntimeExecutedByThisArtifact: false,
    baselineFramesCapturedByThisArtifact: 0,
    visualOrRmseAcceptanceGranted: false,
    audioAcceptanceGranted: false,
    humanOrOwnerAcceptanceGranted: false,
    strictAcceptanceEffect: "none",
    requirements: disposition,
  };
}

function validateSourceBindings({manifest, inventory, sourceSwf, courseXml, ffdecScripts, swfmillXml}) {
  invariant(manifest.animationId === ANIMATION_ID && inventory.animationId === ANIMATION_ID, "shell animation identity differs");
  invariant(manifest.source?.swf === SOURCE_SWF_RELATIVE_PATH, "manifest source SWF path differs");
  invariant(manifest.source?.swfSha256 === SOURCE_SWF_SHA256, "manifest source SWF hash differs");
  invariant(sourceSwf.sha256 === SOURCE_SWF_SHA256, "preserved source SWF hash differs");
  invariant(courseXml.sha256 === COURSE_XML_SHA256, "course XML hash differs");
  const evidence = new Map((inventory.evidenceIndex || []).map((item) => [item.artifactId, item]));
  for (const [artifactId, artifact] of [["source-swf", sourceSwf], ["ffdec-scripts", ffdecScripts], ["swfmill-xml", swfmillXml], ["course-xml", courseXml]]) {
    const binding = evidence.get(artifactId);
    invariant(binding, `scenario inventory lacks ${artifactId}`);
    const boundProjectPath = binding.path.startsWith("source-assets/")
      ? binding.path
      : `${WORKSPACE_RELATIVE_PATH}/${binding.path}`;
    invariant(boundProjectPath === artifact.path && binding.sha256 === artifact.sha256, `${artifactId} inventory binding is stale`);
  }
}

async function loadTraceSpecs(root, requirements) {
  const result = new Map();
  for (const requirement of requirements) {
    const fileName = `${requirement.requirementId.replaceAll(":", "-")}.json`;
    const relativePath = `${WORKSPACE_RELATIVE_PATH}/audit/trace-specs/${fileName}`;
    const artifact = await readJsonArtifact(root, relativePath, requirement.requirementId);
    invariant(!result.has(requirement.requirementId), `duplicate requirement ${requirement.requirementId}`);
    result.set(requirement.requirementId, artifact);
  }
  return result;
}

function lineRecord(source, lineNumber, requiredText) {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const text = lines[lineNumber - 1];
  invariant(text?.includes(requiredText), `course XML line ${lineNumber} does not contain ${requiredText}`);
  return {line: lineNumber, text, lineSha256: sha256(text)};
}

function makeMapReleaseFragment({geometry, script, stopEvidence}) {
  return {
    fragmentId: MAP_RELEASE.id,
    name: "open-source-course-map",
    fragmentStatus: "source-evidenced-immediate-transition-runtime-unverified",
    executableRequirementEffect: "none",
    prerequisite: {checkpointId: "P0", status: "blocked-unresolved"},
    action: sourceEventAction(MAP_RELEASE.event, geometry),
    sourceTarget: {
      kind: "root-button",
      timelineId: "root",
      rootFrame: 50,
      instanceName: "map",
      buttonObjectId: 1211,
      selectedHitShapeObjectId: 1204,
      geometry,
    },
    script: scriptEvidence(script),
    immediatePostState: {
      root: {frame: 50, playState: "stopped", qualification: "conditional-on-P0"},
      globals: {quizSection: false, CompClick: "Map", Pause: true, Play: false, spanSound: false},
      display: {
        popupFrame: 1,
        moverMcLabel: "inactive",
        nextaniFrame: 1,
        glossaryVisible: false,
        mCVisible: false,
        calculatorVisible: false,
        mapTimeline: requireMapState(stopEvidence.structure, "m1_l1_content", 9),
        mapVisible: true,
        spanishAudioButtonVisible: true,
        englishAudioButtonVisible: false,
      },
      audio: {globalSoundCommand: "stop"},
    },
    terminalSemantics: {
      status: "not-claimed",
      reason: "This handler proves an immediate map-open transition only; it does not prove natural entry, stable mover/audio/child state, scenario completion, navigation completion, or Replay.",
    },
    requirementIds: SECTION_HOVERS.flatMap(({scenario}) => ["en", "es"].map((language) => requirementIdFor(scenario, language))),
  };
}

function makeSectionHoverFragment({specification, geometry, script, structure, stopScript}) {
  return {
    fragmentId: specification.id,
    name: `hover-source-map-${specification.section.toLowerCase()}`,
    fragmentStatus: "source-evidenced-immediate-transition-runtime-unverified",
    executableRequirementEffect: "none",
    prerequisites: [
      {checkpointId: "P0", status: "blocked-unresolved"},
      {fragmentId: "M1", requiredImmediatePostState: "source-map-open-at-sprite-1177-frame-9"},
    ],
    action: sourceEventAction(specification.event, geometry),
    sourceTarget: {
      ...specification.eventTarget,
      selectedButtonObjectId: Number(specification.buttonObjectId),
      selectedHitShapeObjectId: Number(specification.hitShapeObjectId),
      geometry,
    },
    script: scriptEvidence(script),
    immediatePostState: {
      root: {frame: 50, playState: "stopped", qualification: "conditional-on-P0"},
      mapTimeline: requireMapState(structure, specification.mapLabel, specification.mapFrame),
      moverMc: {
        command: "startDrag(_root.mover_mc, lockCenter=true)",
        transition: {method: "gotoAndPlay", label: specification.moverLabel},
        stableTerminalFrame: "unresolved",
      },
      mapStopScript: scriptEvidence(stopScript),
    },
    terminalSemantics: {
      status: "unresolved",
      sourceMapTimelineStopped: true,
      fullStateTerminalProven: false,
      blockers: [
        "mover_mc uses gotoAndPlay and its stable local state is not established by this fragment",
        "the modern section-view scenario has no owner-approved one-to-one mapping to this legacy hover state",
        "child load, audio, language, random state, navigation completion, and Replay are outside this fragment",
      ],
    },
    requirementIds: ["en", "es"].map((language) => requirementIdFor(specification.scenario, language)),
  };
}

function makeQuitFragment({geometry, script, quitFrameOne, quitFrameTwo}) {
  return {
    fragmentId: QUIT_RELEASE.id,
    name: "open-source-quit-confirmation",
    fragmentStatus: "source-evidenced-immediate-transition-runtime-unverified",
    executableRequirementEffect: "none",
    prerequisite: {checkpointId: "P0", status: "blocked-unresolved"},
    action: sourceEventAction(QUIT_RELEASE.event, geometry),
    sourceTarget: {
      kind: "root-button",
      timelineId: "root",
      placementFrame: 49,
      activeAtConditionalRootFrame: 50,
      instanceName: "closer",
      buttonObjectId: 229,
      selectedHitShapeObjectId: 228,
      geometry,
    },
    script: scriptEvidence(script),
    immediatePostState: {
      root: {frame: 50, playState: "stopped", qualification: "conditional-on-P0"},
      popupFrame: 1,
      quitTimeline: {
        timelineId: "sprite-562",
        requestedFrame: 2,
        playState: "stopped",
        frameOneScript: scriptEvidence(quitFrameOne),
        frameTwoScript: scriptEvidence(quitFrameTwo),
      },
      audio: {newSoundVolume: 0, childAnimationCommand: "stop"},
      depthOperation: {method: "swapDepths", argument: 2, observedOutcome: "runtime-unverified"},
    },
    terminalSemantics: {
      status: "unresolved",
      quitTimelineStopped: true,
      affirmativeCloseDispatched: false,
      fullStateTerminalProven: false,
      blockers: [
        "swapDepths outcome and full display-list state have not been observed in an authorized runtime",
        "the affirmative close action is intentionally not dispatched because legacy getURL/fscommand/JavaScript side effects remain denied",
        "language, audio, child, navigation, host, and Replay state remain unresolved",
      ],
    },
    requirementIds: ["en", "es"].map((language) => requirementIdFor("quit-confirmation", language)),
  };
}

export async function buildShellSourceEventFragments(options = {}) {
  const root = path.resolve(options.root || projectRoot);
  const output = path.resolve(root, options.output || OUTPUT_RELATIVE_PATH);
  const outputRelative = path.relative(root, output);
  invariant(outputRelative && !outputRelative.startsWith("..") && !path.isAbsolute(outputRelative), "output escapes project root");

  const [
    generator,
    sourceSwf,
    courseXml,
    manifest,
    inventory,
    coverage,
    strictReadiness,
    audioRuntime,
    shellExclusion,
    sameLessonBinding,
    migrationBrief,
    ffdecScripts,
    swfmillXml,
  ] = await Promise.all([
    readArtifact(root, portable(path.relative(projectRoot, scriptPath)), "generator"),
    readArtifact(root, SOURCE_SWF_RELATIVE_PATH, "source SWF"),
    readArtifact(root, COURSE_XML_RELATIVE_PATH, "course XML"),
    readJsonArtifact(root, `${WORKSPACE_RELATIVE_PATH}/migration.json`, "migration manifest"),
    readJsonArtifact(root, `${WORKSPACE_RELATIVE_PATH}/audit/scenario-inventory.json`, "scenario inventory"),
    readJsonArtifact(root, `${WORKSPACE_RELATIVE_PATH}/evidence/full-frame-coverage.json`, "full-frame coverage"),
    readJsonArtifact(root, `${WORKSPACE_RELATIVE_PATH}/audit/strict-readiness.json`, "strict readiness"),
    readJsonArtifact(root, `${WORKSPACE_RELATIVE_PATH}/audit/audio-runtime-evidence.json`, "audio runtime evidence"),
    readJsonArtifact(root, SHELL_EXCLUSION_RELATIVE_PATH, "shell exclusion"),
    readJsonArtifact(root, SAME_LESSON_BINDING_RELATIVE_PATH, "same-lesson binding"),
    readArtifact(root, `${WORKSPACE_RELATIVE_PATH}/MIGRATION_BRIEF.md`, "migration brief"),
    readArtifact(root, `${WORKSPACE_RELATIVE_PATH}/audit/machine/ffdec-scripts.txt.gz`, "FFDec scripts"),
    readArtifact(root, `${WORKSPACE_RELATIVE_PATH}/audit/machine/swfmill.xml.gz`, "swfmill XML"),
  ]);

  validateSourceBindings({
    manifest: manifest.value,
    inventory: inventory.value,
    sourceSwf,
    courseXml,
    ffdecScripts,
    swfmillXml,
  });
  invariant(shellExclusion.value.disposition === "excluded-never-execute-original-shell", "shell execution exclusion differs");
  invariant(shellExclusion.value.permittedUse.includes("static"), "shell exclusion no longer limits use to static evidence");
  invariant(shellExclusion.value.sideEffectCount === 37, "shell side-effect count differs");
  invariant(inventory.value.inventoryStatus === "static-exhaustive-runtime-unverified", "scenario inventory authority differs");
  invariant(Array.isArray(inventory.value.authoritativeRuntimeEvidence) && inventory.value.authoritativeRuntimeEvidence.length === 0,
    "authoritative runtime evidence is no longer empty; this artifact must be reviewed before regeneration");
  invariant(strictReadiness.value?.status !== "complete", "strict readiness unexpectedly became complete");
  invariant(audioRuntime.value?.acceptance?.strictAudioAcceptance === "pending"
    && audioRuntime.value?.acceptance?.authoritativeListeningComplete === false
    && audioRuntime.value?.acceptance?.hostStateTraversalComplete === false
    && audioRuntime.value?.acceptance?.synchronizationComplete === false,
  "audio evidence authority boundary differs");

  const courseXmlText = courseXml.bytes.toString("utf8");
  const irSectionLine = lineRecord(courseXmlText, 20, 'SName="IR"');
  invariant(irSectionLine.text.includes('SecButtonLocX="-2000"') && irSectionLine.text.includes('SecButtonLocY="-2000"'),
    "IR hidden section target coordinates differ");
  const irPageLine = lineRecord(courseXmlText, 25, "IR/L1RW01.swf");
  invariant(irPageLine.text.includes('RandomAudio="Yes"'), "IR natural page RandomAudio evidence differs");

  const traceSpecs = await loadTraceSpecs(root, coverage.value.requirements);
  const authorityBoundary = deriveAuthorityBoundary({coverage: coverage.value, traceSpecs});
  const ffdecText = gunzipSync(ffdecScripts.bytes).toString("utf8");
  const swfmillText = gunzipSync(swfmillXml.bytes).toString("utf8");
  const parsedScripts = parseFfdecScriptBlocks(ffdecText);
  const structure = parseSwfmillShellStructure(swfmillText);
  invariant(structure.timelines.get("root")?.declaredFrames === 50, "root frame count differs");

  const mapScript = requiredScript(parsedScripts, MAP_RELEASE.handlerScript, MAP_RELEASE.handlerBodySha256, [
    '_global.CompClick = "Map";',
    '_root.m1_l1.gotoAndStop("m1_l1_content");',
    "_global.gSound.stop();",
  ]);
  const setSpanishPopupEvidence = exactLineExcerpt(parsedScripts, 4308, 4315, [
    "function setSpanishPopUp(mcTarget, frameLbl)",
    "startDrag(mcTarget,1);",
    "eval(mcTarget).gotoAndPlay(frameLbl);",
  ]);
  const stopScripts = new Map();
  for (const frame of [9, 18, 28, 38]) {
    stopScripts.set(frame, requiredScript(parsedScripts, `DefineSprite_1177/frame_${frame}/DoAction.as`, null, ["stop();"]));
    invariant(stopScripts.get(frame).body === "stop();", `sprite-1177 frame ${frame} must contain only stop()`);
  }

  const sectionFragments = SECTION_HOVERS.map((specification) => {
    const geometry = deriveHitGeometry(structure, specification);
    const handler = requiredScript(parsedScripts, specification.handlerScript, specification.handlerBodySha256, [
      `_root.setSpanishPopUp("_root.mover_mc","${specification.moverLabel}");`,
      `_root.m1_l1.gotoAndStop("${specification.mapLabel}");`,
    ]);
    return makeSectionHoverFragment({
      specification,
      geometry,
      script: handler,
      structure,
      stopScript: stopScripts.get(specification.mapFrame),
    });
  });

  const quitScript = requiredScript(parsedScripts, QUIT_RELEASE.handlerScript, QUIT_RELEASE.handlerBodySha256, [
    "_root.popup.gotoAndStop(1);",
    "_root.quit.gotoAndStop(2);",
    "_root.quit.swapDepths(2);",
  ]);
  const quitFrameOne = requiredScript(parsedScripts, "DefineSprite_562/frame_1/DoAction.as", null, ["stop();"]);
  invariant(quitFrameOne.body === "stop();", "sprite-562 frame 1 must contain only stop()");
  const quitFrameTwo = requiredScript(parsedScripts, "DefineSprite_562/frame_2/DoAction.as", null, [
    "ss.setVolume(0);",
    "_root.animation_mc.animation.stop();",
    "stop();",
  ]);

  const p0Evidence = {
    checkpointId: "P0",
    name: "authorized-natural-root-entry-at-main",
    status: "blocked-unresolved",
    requiredState: {
      rootFrame: 50,
      rootLabel: "Main",
      rootPlayState: "stopped",
      completeParentRootGlobalStateObserved: true,
      childLoadStateObserved: true,
      audioStateObserved: true,
      randomStateObserved: true,
      languageStateObserved: true,
      deniedSideEffectsRecorded: true,
      unexpectedEvents: [],
    },
    staticFacts: {
      sourceInitializes: {
        sectionNumber: 0,
        slideNumber: 0,
        LngFlag: "English",
        Play: true,
        Pause: false,
        quizSection: false,
        randomAudio: false,
        spanAudio: false,
        closeApp: "no",
      },
      loadGate: "frame 35 conditionally jumps to start/frame 49 only when root bytes loaded >= total bytes",
      retryLoop: "frame 37 executes gotoAndPlay(1), so natural entry loop count depends on host/load timing",
      naturalDefault: "frame 49 selects section 1, slide 2 and IR/L1RW01.swf when no bookmark/default section exists",
      mainFrame: "frame 50 executes stop(), builds navigation, and calls loadSWFMovie()",
      sourceLanguageInitialization: "English only",
      seedInterface: "no source-proven mapping from requirement seed=0 to the AS1/2 PRNG state",
      irMapTarget: "course XML places IR section button at (-2000,-2000); no visible IR map hit target is proven",
      irRandomAudio: true,
    },
    evidence: {
      initialization: exactLineExcerpt(parsedScripts, 6703, 6752, [
        "_global.sectionNumber = 0;",
        '_global.LngFlag = "English";',
        "_global.randomAudio = false;",
      ]),
      loadGate: exactLineExcerpt(parsedScripts, 6756, 6766, [
        "if(_root.getBytesLoaded() >= _root.getBytesTotal())",
        'gotoAndStop("start");',
      ]),
      retryLoop: scriptEvidence(requiredScript(parsedScripts, "frame_37/DoAction.as", null, ["gotoAndPlay(1);"])),
      defaultSelection: exactLineExcerpt(parsedScripts, 6861, 6871, [
        "_global.sectionNumber = 1;",
        "_global.slideNumber = 2;",
      ]),
      mainFrame: scriptEvidence(requiredScript(parsedScripts, "frame_50/DoAction.as", null, [
        "stop();",
        "_root.loadSWFMovie();",
      ])),
      courseXml: {irSectionLine, irPageLine},
      shellExclusion: publicArtifact(shellExclusion),
      sameLessonBinding: publicArtifact(sameLessonBinding),
    },
    blockers: [
      "authorized source-hash-bound natural root trace is absent",
      "deterministic parent/root/global fixture with all legacy side effects denied and logged is absent",
      "host/load timing makes the frame 1/35/37 preloader-loop count non-unique from static evidence",
      "frame 50 loads the default IR child, whose complete host/audio/random state is not observed",
      "requirement seed=0 is not mapped to the legacy PRNG state",
      "no source-proven whole-shell Spanish natural-entry route exists",
      "current execution policy forbids opening or executing the original shell until a separately reviewed instrumented-shell plan exists",
    ],
  };

  const mapFragment = makeMapReleaseFragment({
    geometry: deriveHitGeometry(structure, MAP_RELEASE),
    script: mapScript,
    stopEvidence: {structure},
  });
  const quitFragment = makeQuitFragment({
    geometry: deriveHitGeometry(structure, QUIT_RELEASE),
    script: quitScript,
    quitFrameOne,
    quitFrameTwo,
  });

  const document = {
    schemaVersion: 1,
    artifactType: "help-math-shell-static-source-event-fragments",
    animationId: ANIMATION_ID,
    evidenceStatus: "static-source-event-fragments-runtime-unverified",
    authorityStatement: [
      "This artifact records deterministic static source-event fragments and exact selected hit geometry only.",
      "It is not an ordered original-runtime trace, execution log, baseline capture, frame comparison, RMSE result, audio acceptance, human review, owner approval, or strict-completion record.",
      "P0 remains unresolved; therefore M1, M2-RW/VB/IN/TI/GS/TS/FQ, and Q1 must not be promoted into executable trace schedules from this artifact alone.",
      "The JavaScript candidate and product behavior are not evidence for legacy source event order, terminal semantics, language state, seed state, or original-runtime reachability.",
    ],
    nativeMovie: {stage: {width: 800, height: 600}, fps: 12, rootFrameCount: 50, actionScript: "AS1/2"},
    sourceBindings: {
      sourceSwf: publicArtifact(sourceSwf),
      courseXml: publicArtifact(courseXml),
      migrationManifest: publicProjectionArtifact(
        manifest,
        TECHNICAL_MANIFEST_PROJECTION.id,
        technicalManifestSha256(manifest.value),
      ),
      migrationBrief: publicArtifact(migrationBrief),
      scenarioInventory: publicArtifact(inventory),
      fullFrameCoverage: publicProjectionArtifact(
        coverage,
        TRACE_COVERAGE_PROJECTION.id,
        traceCoverageSha256(coverage.value),
      ),
      strictReadiness: publicArtifact(strictReadiness),
      audioRuntimeEvidence: publicArtifact(audioRuntime),
      shellExecutionExclusion: publicArtifact(shellExclusion),
      sameLessonHostEntryBinding: publicArtifact(sameLessonBinding),
      ffdecScripts: publicArtifact(ffdecScripts, {
        compression: "gzip",
        uncompressedSha256: sha256(Buffer.from(ffdecText)),
        uncompressedBytes: Buffer.byteLength(ffdecText),
      }),
      swfmillXml: publicArtifact(swfmillXml, {
        compression: "gzip",
        uncompressedSha256: sha256(Buffer.from(swfmillText)),
        uncompressedBytes: Buffer.byteLength(swfmillText),
      }),
    },
    precondition: p0Evidence,
    sharedFunctionEvidence: {setSpanishPopUp: setSpanishPopupEvidence},
    fragments: [mapFragment, ...sectionFragments, quitFragment],
    authorityBoundary,
    languageAndSeedBoundary: {
      englishInitializationProven: true,
      englishInitializationValue: "English",
      spanishWholeShellEntryProven: false,
      spanishRequirementsRemainUnresolved: 10,
      seedValueInRequirements: "0",
      seedToLegacyPrngMappingProven: false,
      defaultIrRandomAudioDeclaredByCourseXml: true,
      strictAcceptanceEffect: "none",
    },
    generatedBy: {
      script: portable(path.relative(root, scriptPath)),
      scriptSha256: generator.sha256,
      deterministic: true,
      generatedAtIncluded: false,
    },
    strictAcceptanceEffect: "none",
  };
  const serialized = canonicalJson(document);
  if (options.check) {
    const current = await readFile(output, "utf8").catch((error) => {
      if (error.code === "ENOENT") throw new Error(`${portable(outputRelative)} is missing; run the generator without --check`);
      throw error;
    });
    invariant(current === serialized, `${portable(outputRelative)} is stale; run the generator without --check`);
  } else {
    const temporary = `${output}.tmp-${process.pid}`;
    await writeFile(temporary, serialized);
    await rename(temporary, output);
  }
  return {document, output: portable(outputRelative), sha256: sha256(serialized)};
}

export function parseArguments(argumentsList) {
  const options = {check: false, root: projectRoot, output: OUTPUT_RELATIVE_PATH};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--root" || value === "--output") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--root") options.root = path.resolve(next);
      else options.output = next;
      index += 1;
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-shell-g04-l01-source-event-fragments.mjs [--check] [--root PATH] [--output PATH]

Builds acceptance-neutral static source-event fragments for the Grade 4 Lesson 1
course shell. It never executes Flash, captures a baseline, edits trace specs,
changes coverage/status, or grants human/owner/strict acceptance.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await buildShellSourceEventFragments(options);
  process.stdout.write(`${options.check ? "verified" : "wrote"} ${result.output} (${result.sha256})\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`error: ${error.message}\n`);
    process.exitCode = 1;
  });
}
