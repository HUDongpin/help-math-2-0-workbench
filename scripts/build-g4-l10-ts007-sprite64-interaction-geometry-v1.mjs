#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const ANIMATION_ID = "course-g04-l10-ts-007";
export const RELEASE_ID = "lesson-g04-l10-perimeter-area";
export const GENERATOR_PATH =
  "scripts/build-g4-l10-ts007-sprite64-interaction-geometry-v1.mjs";
export const REPORT_JSON =
  "reports/g4-l10-ts007-sprite64-interaction-geometry-v1.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-ts007-sprite64-interaction-geometry-v1.md";

const STATUS =
  "SOURCE_STATIC_HIT_GEOMETRY_AND_COORDINATE_CANDIDATES_FROZEN_RUNTIME_TRACE_UNRESOLVED";
const DECISION =
  "PRESERVE_GEOMETRY_PREDECLARE_CANDIDATES_DO_NOT_EXECUTE_DO_NOT_CLASSIFY";
const TWIPS_PER_PIXEL = 20;

const EXPECTED_INPUTS = Object.freeze({
  readiness: {
    path: "reports/g4-l10-ts007-sprite64-interactive-disposition-readiness-v1.json",
    bytes: 29331,
    sha256: "4ea042c833cb50061a9dc9067938dc49b751e3103917fdf9cb1a878de4cb4207",
    mode: "0444",
  },
  manifest: {
    path: "migrations/course-g04-l10-ts-007/migration.json",
    bytes: 28936,
    sha256: "62a981ef41d274f5ec9b3ad69852d3e7b860db4270cb895085387ca395cc8337",
    mode: "0644",
  },
  disposition: {
    path: "migrations/course-g04-l10-ts-007/audit/frame-domain-disposition.json",
    bytes: 100597,
    sha256: "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da",
    mode: "0644",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l10-ts-007/audit/scenario-inventory.json",
    bytes: 1030575,
    sha256: "a7601f0e9a1508f446ccb630d182d3004316b52ef3cd38dc2734115c292430f6",
    mode: "0644",
  },
  swfmill: {
    path: "migrations/course-g04-l10-ts-007/audit/machine/swfmill.xml.gz",
    bytes: 987643,
    sha256: "a2cdc609431c5a6571383828e2a180b9034137ebe9275f19e9da107330873183",
    mode: "0644",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l10-ts-007/audit/machine/ffdec-scripts.txt.gz",
    bytes: 1475,
    sha256: "37ae1f45789624e1bbc68937074eaf7c59818877692701a71ab4f82b6bafc447",
    mode: "0644",
  },
  sourceSwf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
    bytes: 585839,
    sha256: "64070bdec0badb3cb009a741fe1b5e9c96bd98e68b92c4dfe125db3b43617eff",
    mode: "0500",
  },
  templateV9: {
    path: "reports/g4-l10-complete-migration-template-contract-v9-2026-08-07.json",
    bytes: 257172,
    sha256: "4d108fbb92e63d4c921bde0d6f50588ce2d28f7e69d1bf9fd5d6bca011507190",
    mode: "0444",
  },
  failedSecurityBatch: {
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-4d05187e-failed-v1.json",
    bytes: 9999,
    sha256: "de1bfbf4323a44360932851772bf35db09f8bc3e4310f65eac28b976aa002ea2",
    mode: "0444",
  },
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "workspaceModified",
  "frameDomainDispositionChanged",
  "coverageRegenerated",
  "formalTraceSpecificationCreated",
  "captureKitCreated",
  "mouseInputExecuted",
  "helperExecuted",
  "originalRuntimeExecuted",
  "originalRuntimeBaselineEstablished",
  "runtimeReachabilityEstablished",
  "interactionCausalityEstablished",
  "rendererImplemented",
  "behaviorAccepted",
  "visualRmseAccepted",
  "audioAccepted",
  "humanReviewAccepted",
  "ownerAcceptanceAccepted",
  "strictCompletionAccepted",
  "wholeLessonIntegrationAccepted",
  "remainingGrade4BatchStarted",
  "wholeCourseIntegrationAccepted",
  "promotionAccepted",
  "publicationAccepted",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, canonicalize(value[key])]));
  }
  return value;
}

function reportFingerprint(report) {
  const {reportFingerprintSha256: ignored, ...payload} = report;
  return sha256(Buffer.from(JSON.stringify(canonicalize(payload)), "utf8"));
}

function modeString(stat) {
  return (Number(stat.mode) & 0o7777).toString(8).padStart(4, "0");
}

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs,
    stat.mode, stat.nlink].map(String).join(":");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveInside(root, relativePath) {
  assert.ok(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath));
  const absolute = path.resolve(root, relativePath);
  const relative = portable(path.relative(root, absolute));
  assert.ok(relative && !relative.startsWith("../") &&
    !path.isAbsolute(relative), `${relativePath} escapes the project root`);
  return absolute;
}

async function canonicalRoot(root) {
  return realpath(path.resolve(root));
}

async function readStable(root, label, expected) {
  const rootReal = await canonicalRoot(root);
  const absolute = resolveInside(root, expected.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${label} is not an ordinary non-symlink file`);
  const resolved = await realpath(absolute);
  assert.ok(resolved.startsWith(`${rootReal}${path.sep}`),
    `${label} resolves outside the project root`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${label} changed during the snapshot`);
  const descriptor = {
    path: expected.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(after),
  };
  assert.deepEqual(descriptor, expected, `${label} descriptor drifted`);
  return {descriptor, bytes, statIdentity: statIdentity(after)};
}

function parseJson(input, label) {
  try {
    return JSON.parse(input.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const inputs = {};
  const records = [];
  for (const [key, expected] of Object.entries(EXPECTED_INPUTS)) {
    const record = await readStable(root, key, expected);
    records.push(record);
    inputs[key] = record;
  }
  const generatorAbsolute = resolveInside(root, GENERATOR_PATH);
  const generatorStat = await lstat(generatorAbsolute, {bigint: true});
  const generatorExpected = {
    path: GENERATOR_PATH,
    bytes: Number(generatorStat.size),
    sha256: sha256(await readFile(generatorAbsolute)),
    mode: modeString(generatorStat),
  };
  const generator = await readStable(root, "generator", generatorExpected);
  records.push(generator);
  return {projectRoot: root, inputs, generator, records};
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const current = await lstat(resolveInside(snapshot.projectRoot,
      record.descriptor.path), {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.descriptor.path} changed after the snapshot`);
  }
}

function attributes(text) {
  return Object.fromEntries([...text.matchAll(/([A-Za-z0-9]+)="([^"]*)"/g)]
    .map((match) => [match[1], match[2]]));
}

function exactBlock(xml, openPattern, closingTag, label) {
  const matches = [...xml.matchAll(openPattern)];
  assert.equal(matches.length, 1, `${label} block count drifted`);
  const start = matches[0].index;
  const end = xml.indexOf(`</${closingTag}>`, start);
  assert.notEqual(end, -1, `${label} closing tag is missing`);
  return xml.slice(start, end + closingTag.length + 3);
}

function definitionBlock(xml, objectId) {
  const pattern = new RegExp(
    `<(DefineShape|DefineShape2|DefineShape3|DefineShape4|DefineText|DefineText2)\\b[^>]*objectID="${objectId}"[^>]*>`,
    "g");
  const matches = [...xml.matchAll(pattern)];
  assert.equal(matches.length, 1, `definition ${objectId} count drifted`);
  const tag = matches[0][1];
  const end = xml.indexOf(`</${tag}>`, matches[0].index);
  assert.notEqual(end, -1, `definition ${objectId} closing tag is missing`);
  return xml.slice(matches[0].index, end + tag.length + 3);
}

function spriteBlock(xml, objectId) {
  return exactBlock(xml,
    new RegExp(`<DefineSprite\\b[^>]*objectID="${objectId}"[^>]*>`, "g"),
    "DefineSprite", `sprite ${objectId}`);
}

function placementBlocks(container) {
  return [...container.matchAll(/<PlaceObject2\b[^>]*>[\s\S]*?<\/PlaceObject2>/g)]
    .map((match) => match[0]);
}

function placement(container, objectId, depth, label, name = null) {
  const matches = placementBlocks(container).filter((block) => {
    const open = block.match(/<PlaceObject2\b([^>]*)>/);
    const attr = attributes(open[1]);
    return attr.objectID === String(objectId) && attr.depth === String(depth) &&
      (name === null || attr.name === name);
  });
  assert.equal(matches.length, 1, `${label} placement count drifted`);
  const open = matches[0].match(/<PlaceObject2\b([^>]*)>/);
  return {block: matches[0], attributes: attributes(open[1]),
    matrix: parseMatrix(matches[0])};
}

function parseMatrix(block) {
  const match = block.match(/<Transform\b([^>]*)\/>/);
  assert.ok(match, "placement transform is missing");
  const attr = attributes(match[1]);
  return {
    a: Number(attr.scaleX ?? 1),
    b: Number(attr.skewY ?? 0),
    c: Number(attr.skewX ?? 0),
    d: Number(attr.scaleY ?? 1),
    tx: Number(attr.transX ?? 0),
    ty: Number(attr.transY ?? 0),
  };
}

function parseBounds(block, label) {
  const match = block.match(/<Rectangle\b([^>]*)\/>/);
  assert.ok(match, `${label} bounds are missing`);
  const attr = attributes(match[1]);
  const bounds = Object.fromEntries(["left", "right", "top", "bottom"]
    .map((key) => [key, Number(attr[key])]));
  assert.ok(Object.values(bounds).every(Number.isFinite),
    `${label} bounds are invalid`);
  return bounds;
}

function compose(parent, child) {
  return Object.fromEntries(Object.entries({
    a: parent.a * child.a + parent.c * child.b,
    b: parent.b * child.a + parent.d * child.b,
    c: parent.a * child.c + parent.c * child.d,
    d: parent.b * child.c + parent.d * child.d,
    tx: parent.a * child.tx + parent.c * child.ty + parent.tx,
    ty: parent.b * child.tx + parent.d * child.ty + parent.ty,
  }).map(([key, value]) => [key, Object.is(value, -0) ? 0 : value]));
}

function composeChain(matrices) {
  return matrices.reduce((result, matrix) => compose(matrix, result),
    {a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0});
}

function transformPoint(point, matrix) {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.tx,
    y: matrix.b * point.x + matrix.d * point.y + matrix.ty,
  };
}

function inverseMatrix(matrix) {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  assert.notEqual(determinant, 0, "matrix is not invertible");
  return {
    a: matrix.d / determinant,
    b: -matrix.b / determinant,
    c: -matrix.c / determinant,
    d: matrix.a / determinant,
    tx: (matrix.c * matrix.ty - matrix.d * matrix.tx) / determinant,
    ty: (matrix.b * matrix.tx - matrix.a * matrix.ty) / determinant,
  };
}

function transformBounds(bounds, matrix) {
  const points = [
    [bounds.left, bounds.top],
    [bounds.right, bounds.top],
    [bounds.right, bounds.bottom],
    [bounds.left, bounds.bottom],
  ].map(([x, y]) => transformPoint({x, y}, matrix));
  return {
    left: Math.min(...points.map(({x}) => x)),
    right: Math.max(...points.map(({x}) => x)),
    top: Math.min(...points.map(({y}) => y)),
    bottom: Math.max(...points.map(({y}) => y)),
  };
}

function unionBounds(bounds) {
  return {
    left: Math.min(...bounds.map((row) => row.left)),
    right: Math.max(...bounds.map((row) => row.right)),
    top: Math.min(...bounds.map((row) => row.top)),
    bottom: Math.max(...bounds.map((row) => row.bottom)),
  };
}

function toPixels(value) {
  if (typeof value === "number") return round(value / TWIPS_PER_PIXEL);
  return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, toPixels(item)]));
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function linePath(block, startPattern, endPattern, label) {
  const start = block.search(startPattern);
  assert.notEqual(start, -1, `${label} filled path start is missing`);
  const endRelative = block.slice(start).search(endPattern);
  assert.notEqual(endRelative, -1, `${label} filled path end is missing`);
  const section = block.slice(start, start + endRelative);
  const setup = section.match(/<ShapeSetup\b([^>]*)\/>/);
  const setupAttr = attributes(setup[1]);
  let current = {x: Number(setupAttr.x), y: Number(setupAttr.y)};
  const points = [{...current}];
  for (const match of section.matchAll(/<LineTo\b([^>]*)\/>/g)) {
    const attr = attributes(match[1]);
    current = {
      x: current.x + Number(attr.x),
      y: current.y + Number(attr.y),
    };
    points.push({...current});
  }
  assert.ok(points.length >= 4, `${label} filled path is too short`);
  return points;
}

function sampledCurvePath(block, startPattern, endPattern, label) {
  const start = block.search(startPattern);
  assert.notEqual(start, -1, `${label} filled path start is missing`);
  const endRelative = block.slice(start).search(endPattern);
  assert.notEqual(endRelative, -1, `${label} filled path end is missing`);
  const section = block.slice(start, start + endRelative);
  const setup = section.match(/<ShapeSetup\b([^>]*)\/>/);
  const setupAttr = attributes(setup[1]);
  let current = {x: Number(setupAttr.x), y: Number(setupAttr.y)};
  const points = [{...current}];
  const edgePattern = /<(CurveTo|LineTo)\b([^>]*)\/>/g;
  for (const match of section.matchAll(edgePattern)) {
    const attr = attributes(match[2]);
    if (match[1] === "LineTo") {
      current = {x: current.x + Number(attr.x),
        y: current.y + Number(attr.y)};
      points.push({...current});
      continue;
    }
    const startPoint = {...current};
    const control = {x: current.x + Number(attr.x1),
      y: current.y + Number(attr.y1)};
    const endPoint = {x: control.x + Number(attr.x2),
      y: control.y + Number(attr.y2)};
    for (let index = 1; index <= 32; index += 1) {
      const t = index / 32;
      const u = 1 - t;
      points.push({
        x: u * u * startPoint.x + 2 * u * t * control.x +
          t * t * endPoint.x,
        y: u * u * startPoint.y + 2 * u * t * control.y +
          t * t * endPoint.y,
      });
    }
    current = endPoint;
  }
  assert.ok(points.length >= 32, `${label} sampled path is too short`);
  return points;
}

function polygonCentroid(points) {
  let twiceArea = 0;
  let xTotal = 0;
  let yTotal = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    twiceArea += cross;
    xTotal += (current.x + next.x) * cross;
    yTotal += (current.y + next.y) * cross;
  }
  assert.notEqual(twiceArea, 0, "filled polygon area is zero");
  return {x: xTotal / (3 * twiceArea), y: yTotal / (3 * twiceArea)};
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1;
    current < polygon.length; previous = current, current += 1) {
    const a = polygon[current];
    const b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y) &&
      point.x < (b.x - a.x) * (point.y - a.y) /
      (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function stagePointToDefinition(integerStagePoint, definitionToStage) {
  return transformPoint({
    x: integerStagePoint.x * TWIPS_PER_PIXEL,
    y: integerStagePoint.y * TWIPS_PER_PIXEL,
  }, inverseMatrix(definitionToStage));
}

function pointOutsideBounds(point, bounds) {
  return point.x < bounds.left || point.x > bounds.right ||
    point.y < bounds.top || point.y > bounds.bottom;
}

function evaluateAnglePoint(stagePoint, stageFromSprite64, anchor) {
  const localTwips = transformPoint({
    x: stagePoint.x * TWIPS_PER_PIXEL,
    y: stagePoint.y * TWIPS_PER_PIXEL,
  }, inverseMatrix(stageFromSprite64));
  const local = {x: localTwips.x / TWIPS_PER_PIXEL,
    y: localTwips.y / TWIPS_PER_PIXEL};
  const dx = local.x - anchor.x;
  const dy = local.y - anchor.y;
  const alpha = Math.atan2(dy, dx);
  const mirrored = (Math.PI + alpha) * 180 / Math.PI;
  let branch;
  let degrees;
  if (mirrored > 180 && mirrored < 360) {
    branch = "degrees_Mirrored_gt_180_lt_360";
    degrees = mirrored - 180;
  } else if (mirrored > 0 && mirrored < 180) {
    branch = "degrees_Mirrored_gt_0_lt_180";
    degrees = mirrored + 180;
  } else if (mirrored === 360 || mirrored === 0) {
    branch = "degrees_Mirrored_eq_360_or_0";
    degrees = 180;
  } else if (mirrored === 180) {
    branch = "degrees_Mirrored_eq_180";
    degrees = 0;
  } else {
    throw new Error(`unclassified angle ${mirrored}`);
  }
  const rotation = degrees - 85;
  return {
    stagePixel: {x: round(stagePoint.x), y: round(stagePoint.y)},
    sprite64LocalPixel: {x: round(local.x), y: round(local.y)},
    dx: round(dx),
    dy: round(dy),
    alphaDegrees: round(alpha * 180 / Math.PI),
    degreesMirrored: round(mirrored),
    sourceBranch: branch,
    degrees: round(degrees),
    degreesRotation: round(rotation),
    expectedFlooredRotationCandidate: Math.floor(rotation),
  };
}

function deriveReport(snapshot) {
  const readiness = parseJson(snapshot.inputs.readiness, "readiness");
  const manifest = parseJson(snapshot.inputs.manifest, "manifest");
  const disposition = parseJson(snapshot.inputs.disposition, "disposition");
  const inventory = parseJson(snapshot.inputs.scenarioInventory,
    "scenarioInventory");
  const template = parseJson(snapshot.inputs.templateV9, "templateV9");
  const security = parseJson(snapshot.inputs.failedSecurityBatch,
    "failedSecurityBatch");
  const xmlBytes = gunzipSync(snapshot.inputs.swfmill.bytes);
  const ffdecBytes = gunzipSync(snapshot.inputs.ffdecScripts.bytes);
  const xml = xmlBytes.toString("utf8");
  const ffdec = ffdecBytes.toString("utf8");

  assert.equal(readiness.animationId, ANIMATION_ID);
  assert.equal(readiness.status,
    "source-static-interactive-gap-frozen-disposition-unresolved");
  assert.equal(readiness.decision,
    "KEEP_UNRESOLVED_DO_NOT_CLASSIFY_DO_NOT_APPLY");
  assert.equal(readiness.requiredFutureOriginalRuntimeObservationMatrix
    .exactMouseCoordinatesPredeclared, false);
  assert.equal(manifest.source.swfSha256,
    EXPECTED_INPUTS.sourceSwf.sha256);
  assert.equal(manifest.source.pairedFlaStatus, "missing");
  assert.equal(disposition.status,
    "structurally-enumerated-dispositions-unresolved");
  const sprite64Disposition = disposition.timelines.find((row) =>
    row.timelineId === "sprite-64");
  assert.equal(sprite64Disposition.disposition, "unresolved");
  assert.deepEqual(sprite64Disposition.rootPlacement.namedPlacementPath
    .map((row) => ({parent: row.parentTimelineId, child: row.childTimelineId,
      frame: row.frame, depth: row.depth, name: row.instanceName})), [
    {parent: "root", child: "sprite-415", frame: 6, depth: "1",
      name: "animation"},
    {parent: "sprite-415", child: "sprite-64", frame: 23,
      depth: "57", name: "scale"},
  ]);
  assert.equal(inventory.animationId, ANIMATION_ID);
  assert.equal(template.schemaVersion, 9);
  assert.equal(template.status, "fail-closed-template-not-stable");
  assert.equal(template.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(template.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(security.batchResult.reusable, false);
  assert.equal(security.batchResult.productionHelperImplementationEligible,
    false);

  const sprite60 = spriteBlock(xml, "60");
  const sprite62 = spriteBlock(xml, "62");
  const sprite63 = spriteBlock(xml, "63");
  const sprite64 = spriteBlock(xml, "64");
  const sprite415 = spriteBlock(xml, "415");
  const shape51 = definitionBlock(xml, "51");
  const shape61 = definitionBlock(xml, "61");
  const shape51Polygon = linePath(shape51,
    /<ShapeSetup\b[^>]*x="56"[^>]*y="-2521"[^>]*fillStyle0="1"[^>]*\/>/,
    /<ShapeSetup\b[^>]*x="0"[^>]*y="0"[^>]*fillStyle0="0"[^>]*fillStyle1="0"[^>]*>/,
    "shape 51");
  assert.deepEqual(shape51Polygon.map(({x, y}) => [x, y]), [
    [56, -2521], [55, -2312], [569, -2309], [570, -2502],
    [570, -2510], [570, -2521], [587, -6151], [74, -6154],
    [57, -2521], [56, -2521],
  ]);
  const shape61Polygon = sampledCurvePath(shape61,
    /<ShapeSetup\b[^>]*x="131"[^>]*y="131"[^>]*fillStyle1="1"[^>]*\/>/,
    /<ShapeSetup\/>/, "shape 61");
  assert.equal(pointInPolygon({x: 0, y: 0}, shape61Polygon), true);

  const child60Bounds = unionBounds([
    ["51", 2], ["52", 3], ["53", 4], ["54", 5], ["55", 6],
    ["56", 7], ["57", 8], ["58", 9], ["59", 10],
  ].map(([objectId, depth]) => transformBounds(
    parseBounds(definitionBlock(xml, objectId), `definition ${objectId}`),
    placement(sprite60, objectId, depth, `sprite60-${objectId}`).matrix)));
  const child62Bounds = transformBounds(parseBounds(shape61, "shape 61"),
    placement(sprite62, "61", 1, "sprite62-shape61").matrix);
  assert.deepEqual(child60Bounds,
    {left: 55, right: 587, top: -6154, bottom: -2309});
  assert.deepEqual(child62Bounds,
    {left: -195, right: 195, top: -195, bottom: 195});

  const matrix60To63 = placement(sprite63, "60", 1,
    "sprite63-object60").matrix;
  const matrix62To63 = placement(sprite63, "62", 12,
    "sprite63-object62", "scale_mc").matrix;
  const matrix63To64 = placement(sprite64, "63", 1,
    "sprite64-object63", "scale_mc").matrix;
  const matrix64To415 = placement(sprite415, "64", 57,
    "sprite415-object64", "scale").matrix;
  const matrix415ToStage = placement(xml, "415", 1,
    "root-object415", "animation").matrix;
  assert.deepEqual(matrix60To63,
    {a: 1, b: 0, c: 0, d: 1, tx: 4, ty: 5986});
  assert.deepEqual(matrix62To63,
    {a: 1, b: 0, c: 0, d: 1, tx: 318, ty: 3736});
  assert.deepEqual(matrix63To64,
    {a: 0, b: 1, c: -1, d: 0, tx: -1, ty: -1});
  assert.deepEqual(matrix64To415,
    {a: 1, b: 0, c: 0, d: -1, tx: 2539, ty: -529});
  assert.deepEqual(matrix415ToStage,
    {a: 1, b: 0, c: 0, d: 1, tx: 8247, ty: 5658});

  const matrix60ToStage = composeChain([matrix60To63, matrix63To64,
    matrix64To415, matrix415ToStage]);
  const matrix62ToStage = composeChain([matrix62To63, matrix63To64,
    matrix64To415, matrix415ToStage]);
  const matrixShape51ToStage = composeChain([
    placement(sprite60, "51", 2, "sprite60-shape51").matrix,
    matrix60To63, matrix63To64, matrix64To415, matrix415ToStage,
  ]);
  const matrixShape61ToStage = composeChain([
    placement(sprite62, "61", 1, "sprite62-shape61").matrix,
    matrix62To63, matrix63To64, matrix64To415, matrix415ToStage,
  ]);
  const matrix64ToStage = composeChain([matrix64To415,
    matrix415ToStage]);
  assert.deepEqual(matrix60ToStage,
    {a: 0, b: -1, c: -1, d: 0, tx: 4799, ty: 5126});
  assert.deepEqual(matrix62ToStage,
    {a: 0, b: -1, c: -1, d: 0, tx: 7049, ty: 4812});
  assert.deepEqual(matrix64ToStage,
    {a: 1, b: 0, c: 0, d: -1, tx: 10786, ty: 5129});

  const target60StageBoundsTwips = transformBounds(child60Bounds,
    matrix60ToStage);
  const target62StageBoundsTwips = transformBounds(child62Bounds,
    matrix62ToStage);
  assert.deepEqual(target60StageBoundsTwips,
    {left: 7108, right: 10953, top: 4539, bottom: 5071});
  assert.deepEqual(target62StageBoundsTwips,
    {left: 6854, right: 7244, top: 4617, bottom: 5007});
  const target60StageBounds = toPixels(target60StageBoundsTwips);
  const target62StageBounds = toPixels(target62StageBoundsTwips);

  const shape51Centroid = polygonCentroid(shape51Polygon);
  assert.equal(pointInPolygon(shape51Centroid, shape51Polygon), true);
  const target60CentroidStage = toPixels(transformPoint(shape51Centroid,
    matrixShape51ToStage));
  const target60SafePoint = {x: Math.round(target60CentroidStage.x),
    y: Math.round(target60CentroidStage.y)};
  const target60SafeDefinitionPoint = stagePointToDefinition(
    target60SafePoint, matrixShape51ToStage);
  assert.equal(pointInPolygon(target60SafeDefinitionPoint,
    shape51Polygon), true);

  const target62CenterStage = toPixels(transformPoint({x: 0, y: 0},
    matrixShape61ToStage));
  const target62SafePoint = {x: Math.round(target62CenterStage.x),
    y: Math.round(target62CenterStage.y)};
  const target62SafeDefinitionPoint = stagePointToDefinition(
    target62SafePoint, matrixShape61ToStage);
  assert.equal(pointInPolygon(target62SafeDefinitionPoint,
    shape61Polygon), true);
  assert.deepEqual(target60SafePoint, {x: 452, y: 240});
  assert.deepEqual(target62SafePoint, {x: 352, y: 241});

  const handlers = inventory.interactions.handlers.filter((handler) =>
    ["60", "62"].includes(String(handler.hitTarget?.objectId)) &&
    handler.scope?.objectId === "63");
  assert.deepEqual(handlers.map(({id}) => id),
    ["script-0083", "script-0084", "script-0085", "script-0086"]);
  assert.ok(ffdec.includes("_parent.startDrag();") &&
    ffdec.includes("_parent.stopDrag();") &&
    ffdec.includes("_global.mcMovement = true;") &&
    ffdec.includes("_global.mcMovement = false;") &&
    ffdec.includes("alpha = Math.atan2(dy,dx);") &&
    ffdec.includes("this._rotation = Math.floor(_global.degreesRotation);"));

  const anchorLocal = {x: matrix63To64.tx / TWIPS_PER_PIXEL,
    y: matrix63To64.ty / TWIPS_PER_PIXEL};
  const anchorStage = toPixels(transformPoint(
    {x: matrix63To64.tx, y: matrix63To64.ty}, matrix64ToStage));
  assert.deepEqual(anchorLocal, {x: -0.05, y: -0.05});
  assert.deepEqual(anchorStage, {x: 539.25, y: 256.5});

  const integerProbePoints = [
    {id: "strict-positive-alpha-east", x: 599, y: 197},
    {id: "strict-positive-alpha-west", x: 479, y: 197},
    {id: "strict-negative-alpha-east", x: 599, y: 317},
    {id: "strict-negative-alpha-west", x: 479, y: 317},
    {id: "positive-axis-upper-bracket", x: 599, y: 256},
    {id: "positive-axis-lower-bracket", x: 599, y: 257},
    {id: "negative-axis-upper-bracket", x: 479, y: 256},
    {id: "negative-axis-lower-bracket", x: 479, y: 257},
  ].map(({id, x, y}) => ({id, integerNativeStageCandidate: true,
    operatorExecutableByThisReport: false,
    ...evaluateAnglePoint({x, y}, matrix64ToStage, anchorLocal)}));
  assert.deepEqual([...new Set(integerProbePoints.map((row) =>
    row.sourceBranch))].sort(), [
    "degrees_Mirrored_gt_0_lt_180",
    "degrees_Mirrored_gt_180_lt_360",
  ]);
  const exactAxisCandidates = [
    {id: "exact-positive-horizontal-axis", x: 599.25, y: 256.5},
    {id: "exact-negative-horizontal-axis", x: 479.25, y: 256.5},
  ].map(({id, x, y}) => ({id, integerNativeStageCandidate: false,
    subpixelPointerPrecisionRequired: true,
    operatorExecutableByThisReport: false,
    unresolvedExecutionReason:
      "No approved input layer or runtime observation establishes half-pixel pointer injection and identical native-stage coordinate mapping.",
    ...evaluateAnglePoint({x, y}, matrix64ToStage, anchorLocal)}));
  assert.deepEqual(exactAxisCandidates.map((row) => row.sourceBranch), [
    "degrees_Mirrored_eq_180",
    "degrees_Mirrored_eq_360_or_0",
  ]);

  const releaseOutsidePoint = {x: 700, y: 500};
  assert.equal(pointOutsideBounds(releaseOutsidePoint,
    target60StageBounds), true);
  assert.equal(pointOutsideBounds(releaseOutsidePoint,
    target62StageBounds), true);
  assert.ok(releaseOutsidePoint.x >= 0 && releaseOutsidePoint.x <= 800 &&
    releaseOutsidePoint.y >= 0 && releaseOutsidePoint.y <= 600);

  const sourceBindings = Object.fromEntries(Object.entries(snapshot.inputs)
    .map(([key, value]) => [key, value.descriptor]));
  const report = {
    schemaVersion: 1,
    artifactType: "g4-l10-ts007-sprite64-interaction-geometry-v1",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    status: STATUS,
    decision: DECISION,
    scope:
      "exact-source-static-vector-bounds-transform-chain-filled-interior-point-and-coordinate-candidate-derivation-only",
    authorityStatement: [
      "This report derives source-static native-stage geometry and candidate coordinates from the exact TS007 SWF exports; it executes no pointer input or runtime.",
      "Axis-aligned bounds are not equivalent to Flash hit-test pixels. Each press candidate is separately verified inside a nonzero-alpha filled vector path.",
      "Integer angle probes cover the two strict source branches. The two equality branches require a half-pixel axis line whose executable transport and runtime mapping are unresolved.",
      "No candidate is a formal natural trace, runtime observation, capture kit, behavior result, or disposition authority.",
    ],
    generator: snapshot.generator.descriptor,
    sourceBindings,
    expandedEvidence: {
      swfmillXml: {bytes: xmlBytes.length, sha256: sha256(xmlBytes)},
      ffdecScripts: {bytes: ffdecBytes.length, sha256: sha256(ffdecBytes)},
    },
    naturalEntryBinding: {
      rootFrame: 6,
      path: [
        {parentTimelineId: "root", childTimelineId: "sprite-415",
          sourceObjectId: "415", depth: 1, instanceName: "animation"},
        {parentTimelineId: "sprite-415", childTimelineId: "sprite-64",
          sourceObjectId: "64", localFrame: 23, depth: 57,
          instanceName: "scale"},
      ],
      authoritativeRuntimeEntryObserved: false,
      entryStateSha256Established: false,
    },
    transformChain: {
      units: "twips-unless-pixel-suffix",
      twipsPerPixel: TWIPS_PER_PIXEL,
      object60ToSprite63: matrix60To63,
      object62ToSprite63: matrix62To63,
      sprite63ToSprite64: matrix63To64,
      sprite64ToSprite415: matrix64To415,
      sprite415ToNativeStage: matrix415ToStage,
      object60ToNativeStage: matrix60ToStage,
      object62ToNativeStage: matrix62ToStage,
      sprite64ToNativeStage: matrix64ToStage,
    },
    interactionTargets: [
      {
        targetId: "object-60-drag-control",
        objectId: "60",
        parentTimelineId: "sprite-63",
        depth: 1,
        sourceEvents: ["press", "release", "releaseOutside"],
        sourceEffect: "press calls _parent.startDrag; release or releaseOutside calls _parent.stopDrag",
        localCompositeBoundsTwips: child60Bounds,
        nativeStageAxisAlignedBoundsTwips: target60StageBoundsTwips,
        nativeStageAxisAlignedBoundsPixels: target60StageBounds,
        filledPathEvidence: {
          definitionObjectId: "51",
          fillAlpha: 255,
          polygonVertexCount: shape51Polygon.length,
          centroidDefinitionTwips: {x: round(shape51Centroid.x),
            y: round(shape51Centroid.y)},
          centroidNativeStagePixels: target60CentroidStage,
        },
        safeIntegerNativeStagePoint: target60SafePoint,
        roundedPointMappedBackToDefinitionTwips: {
          x: round(target60SafeDefinitionPoint.x),
          y: round(target60SafeDefinitionPoint.y),
        },
        roundedPointInsideNonzeroAlphaFill: true,
        inputExecuted: false,
      },
      {
        targetId: "object-62-movement-control",
        objectId: "62",
        parentTimelineId: "sprite-63",
        depth: 12,
        instanceName: "scale_mc",
        sourceEvents: ["press", "release", "releaseOutside"],
        sourceEffect: "press writes _global.mcMovement=true; release or releaseOutside writes false",
        localCompositeBoundsTwips: child62Bounds,
        nativeStageAxisAlignedBoundsTwips: target62StageBoundsTwips,
        nativeStageAxisAlignedBoundsPixels: target62StageBounds,
        filledPathEvidence: {
          definitionObjectId: "61",
          fillAlpha: 133,
          sampledPolygonPointCount: shape61Polygon.length,
          centerDefinitionTwips: {x: 0, y: 0},
          centerNativeStagePixels: target62CenterStage,
        },
        safeIntegerNativeStagePoint: target62SafePoint,
        roundedPointMappedBackToDefinitionTwips: {
          x: round(target62SafeDefinitionPoint.x),
          y: round(target62SafeDefinitionPoint.y),
        },
        roundedPointInsideNonzeroAlphaFill: true,
        inputExecuted: false,
      },
    ],
    rotationAnchor: {
      sourceExpression: [
        "Cx = scale_mc._x",
        "Cy = scale_mc._y",
        "dx = this._xmouse - Cx",
        "dy = this._ymouse - Cy",
      ],
      sprite64LocalPixels: anchorLocal,
      nativeStagePixels: anchorStage,
      exactHorizontalAxisNativeStageY: 256.5,
      exactHorizontalAxisIsIntegerPixelRow: false,
    },
    integerAngleProbeCandidates: integerProbePoints,
    exactEqualityBranchCandidates: exactAxisCandidates,
    releaseOutsideCandidate: {
      nativeStagePixel: releaseOutsidePoint,
      insideNativeStage: true,
      outsideBothTargetAxisAlignedBounds: true,
      inputExecuted: false,
    },
    futureTraceCandidate: {
      status: "SOURCE_STATIC_CANDIDATE_ONLY_NOT_ADOPTED_NOT_EXECUTED",
      languages: ["en", "es"],
      scenarios: [
        {
          id: "movement-press-hold-strict-branch-probes-release",
          orderedActions: [
            {action: "natural-entry", target: "root-6/sprite-415-23/sprite-64"},
            {action: "pointer-down-hold", target: "object-62-movement-control",
              coordinate: target62SafePoint},
            {action: "move-and-observe", candidateIds:
              integerProbePoints.slice(0, 4).map(({id}) => id)},
            {action: "pointer-up", target: "object-62-movement-control",
              coordinate: target62SafePoint},
          ],
        },
        {
          id: "movement-press-hold-near-axis-brackets-release-outside",
          orderedActions: [
            {action: "natural-entry", target: "root-6/sprite-415-23/sprite-64"},
            {action: "pointer-down-hold", target: "object-62-movement-control",
              coordinate: target62SafePoint},
            {action: "move-and-observe", candidateIds:
              integerProbePoints.slice(4).map(({id}) => id)},
            {action: "pointer-up-outside", coordinate: releaseOutsidePoint},
          ],
        },
        {
          id: "drag-control-press-move-release-and-release-outside",
          orderedActions: [
            {action: "natural-entry", target: "root-6/sprite-415-23/sprite-64"},
            {action: "pointer-down-hold", target: "object-60-drag-control",
              coordinate: target60SafePoint},
            {action: "drag-path", coordinates: [target60SafePoint,
              {x: 500, y: 240}, {x: 520, y: 260}]},
            {action: "separate-release-and-releaseOutside-traces-required"},
          ],
        },
      ],
      exactEqualityBranchExecutionPending: true,
      entryValuesObserved: false,
      callbackOrderingObserved: false,
      tickScheduleEstablished: false,
      stageToWindowCoordinateMappingEstablished: false,
      inputTransportPrecisionEstablished: false,
      formalTraceSpecification: false,
      captureKit: false,
      adopted: false,
      executed: false,
    },
    dispositionBoundary: {
      currentDisposition: "unresolved",
      successorDispositionAuthorized: false,
      compositeChildWithParentEstablished: false,
      independentRequiredEstablished: false,
      nonvisualEstablished: false,
      reason:
        "Static geometry and coordinate candidates do not prove runtime entry, callback ordering, state persistence, interaction causality, or frame-domain exhaustiveness.",
    },
    predecessorGapEffect: {
      predecessorExactMouseCoordinatesPredeclared: false,
      sourceStaticIntegerCandidateMatrixNowDerived: true,
      equalityBranchIntegerCoordinateCandidateCount: 0,
      equalityBranchSubpixelMathematicalCandidateCount: 2,
      formalNaturalScheduleReadyCountChange: 0,
      workspaceMutation: false,
      acceptanceEffect: "none",
    },
    securityAndRuntimeBoundary: {
      latestSecurityStatus: security.status,
      securityBatchReusable: false,
      productionHelperImplementationEligible: false,
      originalRuntimeLaunchAuthorizedByThisArtifact: false,
      PeterHuOperatorActivated: false,
      launchReceiptCreated: false,
    },
    review: {
      independentReviewTaskAuthorizedByThisArtifact: false,
      reviewTaskIds: [],
      reviewVerdictPresent: false,
      coordinateCandidateAdopted: false,
    },
    authorityEffects: Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
      [key, false])),
    nextPermittedAction:
      "Independently review this geometry report and retain sprite-64 as unresolved. A future separately authorized runtime-kit successor must resolve input precision, native-stage-to-window mapping, timing, entry values, and equality-branch reachability before any launch.",
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.status, STATUS);
  assert.equal(report.decision, DECISION);
  assert.equal(report.animationId, ANIMATION_ID);
  assert.equal(report.interactionTargets.length, 2);
  const drag = report.interactionTargets.find((row) => row.objectId === "60");
  const movement = report.interactionTargets.find((row) => row.objectId === "62");
  assert.deepEqual(drag.nativeStageAxisAlignedBoundsPixels,
    {left: 355.4, right: 547.65, top: 226.95, bottom: 253.55});
  assert.deepEqual(movement.nativeStageAxisAlignedBoundsPixels,
    {left: 342.7, right: 362.2, top: 230.85, bottom: 250.35});
  assert.deepEqual(drag.safeIntegerNativeStagePoint, {x: 452, y: 240});
  assert.deepEqual(movement.safeIntegerNativeStagePoint, {x: 352, y: 241});
  assert.equal(drag.roundedPointInsideNonzeroAlphaFill, true);
  assert.equal(movement.roundedPointInsideNonzeroAlphaFill, true);
  assert.deepEqual(report.rotationAnchor.nativeStagePixels,
    {x: 539.25, y: 256.5});
  assert.equal(report.integerAngleProbeCandidates.length, 8);
  assert.deepEqual([...new Set(report.integerAngleProbeCandidates.map((row) =>
    row.sourceBranch))].sort(), [
    "degrees_Mirrored_gt_0_lt_180",
    "degrees_Mirrored_gt_180_lt_360",
  ]);
  assert.equal(report.exactEqualityBranchCandidates.length, 2);
  assert.deepEqual(report.exactEqualityBranchCandidates.map((row) =>
    row.sourceBranch), [
    "degrees_Mirrored_eq_180",
    "degrees_Mirrored_eq_360_or_0",
  ]);
  assert.ok(report.exactEqualityBranchCandidates.every((row) =>
    row.integerNativeStageCandidate === false &&
    row.subpixelPointerPrecisionRequired === true &&
    row.operatorExecutableByThisReport === false));
  assert.equal(report.futureTraceCandidate.formalTraceSpecification, false);
  assert.equal(report.futureTraceCandidate.captureKit, false);
  assert.equal(report.futureTraceCandidate.executed, false);
  assert.equal(report.dispositionBoundary.currentDisposition, "unresolved");
  assert.equal(report.dispositionBoundary.successorDispositionAuthorized, false);
  assert.equal(report.predecessorGapEffect
    .sourceStaticIntegerCandidateMatrixNowDerived, true);
  assert.equal(report.predecessorGapEffect
    .formalNaturalScheduleReadyCountChange, 0);
  assert.equal(report.securityAndRuntimeBoundary
    .productionHelperImplementationEligible, false);
  assert.equal(report.securityAndRuntimeBoundary
    .originalRuntimeLaunchAuthorizedByThisArtifact, false);
  assert.ok(Object.values(report.authorityEffects).every((value) =>
    value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return report;
}

export function renderMarkdown(report) {
  const drag = report.interactionTargets.find((row) => row.objectId === "60");
  const movement = report.interactionTargets.find((row) => row.objectId === "62");
  return `# G4 L10 TS007 sprite-64 interaction geometry v1\n\n` +
    `Status: **${report.status}**\n\n` +
    `Decision: **${report.decision}**\n\n` +
    `This acceptance-neutral report derives native-stage geometry from the ` +
    `exact SWF display list. It executes no runtime or pointer input and leaves ` +
    `sprite-64 unresolved.\n\n` +
    `## Source-static target candidates\n\n` +
    `- Object 60 drag control: stage bounds ` +
    `\`${JSON.stringify(drag.nativeStageAxisAlignedBoundsPixels)}\`; safe ` +
    `integer point \`${JSON.stringify(drag.safeIntegerNativeStagePoint)}\`.\n` +
    `- Object 62 movement control: stage bounds ` +
    `\`${JSON.stringify(movement.nativeStageAxisAlignedBoundsPixels)}\`; safe ` +
    `integer point \`${JSON.stringify(movement.safeIntegerNativeStagePoint)}\`.\n` +
    `- Both points map back inside nonzero-alpha source vector fills. Bounds ` +
    `alone are not treated as Flash hit-test proof.\n\n` +
    `## Angle boundary\n\n` +
    `The rotation anchor maps to native-stage ` +
    `\`${JSON.stringify(report.rotationAnchor.nativeStagePixels)}\`. Eight ` +
    `integer candidates cover the two strict range branches. The equality ` +
    `branches require the half-pixel line \`y=256.5\`; two mathematical ` +
    `candidates are recorded but are not executable authority because input ` +
    `precision and stage-to-window mapping are unresolved.\n\n` +
    `## Boundary\n\n` +
    `No workspace, coverage, disposition, trace, capture kit, helper, runtime, ` +
    `renderer, comparison, review, acceptance, integration, promotion, release, ` +
    `or publication state changed.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function outputState(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

export async function checkReport(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expectedContent] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    const absolute = resolveInside(root, relativePath);
    const stat = await lstat(absolute);
    assert.ok(stat.isFile() && !stat.isSymbolicLink());
    assert.equal(modeString(stat), "0444", `${relativePath} mode changed`);
    const observed = await readFile(absolute);
    assert.equal(observed.length, Buffer.byteLength(expectedContent),
      `${relativePath} byte count changed`);
    assert.equal(sha256(observed), sha256(Buffer.from(expectedContent)),
      `${relativePath} SHA-256 changed`);
  }
  if (options.skipInputCheck !== true) await assertSnapshotUnchanged(bundle.snapshot);
  return {
    disposition: "checked",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    safeIntegerTargetPointCount: 2,
    integerAngleProbeCandidateCount: 8,
    equalityBranchExecutableCandidateCount: 0,
    formalNaturalScheduleReadyCountChange: 0,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

export async function publishNoClobber(bundle, options = {}) {
  const root = await canonicalRoot(options.outputRoot ??
    bundle.snapshot.projectRoot);
  const jsonState = await outputState(root, REPORT_JSON);
  const markdownState = await outputState(root, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkReport(bundle, root, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkReport(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    safeIntegerTargetPointCount: 2,
    integerAngleProbeCandidateCount: 8,
    equalityBranchExecutableCandidateCount: 0,
    formalNaturalScheduleReadyCountChange: 0,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
