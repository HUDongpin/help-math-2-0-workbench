import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const P010_TEXT_SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB05.swf';
export const P010_TEXT_SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
export const P010_GEOMETRY_PATH = 'migrations/shared-alg001-l12-p010/audit/typography-source-geometry-v1.json';
export const P010_GEOMETRY_SHA = '2fb18d047c60819c8508e4414a7d4a193b62cd1f40df1cbf19cb56b2d43b1bcd';
export const P010_TEXT_OUTPUT = 'packages/demos/src/generated/alg-l12-p010-text-data.ts';
const hash = value => createHash('sha256').update(value).digest('hex');
const ID = 'shared-alg001-l12-p010';
const clone = value => structuredClone(value);
const identity = () => [1, 0, 0, 1, 0, 0];
const defaultColor = () => ({multiply: [256, 256, 256, 256], add: [0, 0, 0, 0], divisor: 256});

/** Whole-run prose reveal is a maintained typography choice, checked against
 * every exact source glyph/mask run-instance pair. It does not accept pixels. */
export const REVEAL = Object.freeze({
  20: Object.freeze([12, 17, 25, 40, 50, 58, 69]),
  26: Object.freeze([86, 90, 96, 97]),
  32: Object.freeze([118, 134, 154, 165, 173]),
  36: Object.freeze([181, 190, 195, 195]),
});

/** A new identity at a Move+Character depth inherits unspecified properties.
 * Replay source placement order; generation number alone never resets a pose. */
export function p010SourcePoses(timeline) {
  const active = new Map(), states = [];
  const byFrame = new Map();
  for (const event of timeline.events) {
    assert(Number.isSafeInteger(event.frame) && event.frame >= 1 && event.frame <= timeline.declaredFrameCount);
    if (!byFrame.has(event.frame)) byFrame.set(event.frame, []);
    byFrame.get(event.frame).push(event);
  }
  for (let frame = 1; frame <= timeline.declaredFrameCount; frame++) {
    for (const event of byFrame.get(frame) ?? []) {
      if (event.kind === 'remove') active.delete(event.depth);
      else if (event.kind === 'place') {
        const pose = event.move ? clone(active.get(event.depth) ?? {}) : {};
        pose.matrix ??= identity(); pose.colorTransform ??= defaultColor();
        for (const key of ['instanceId', 'depth', 'characterId', 'matrix', 'colorTransform', 'ratio', 'name', 'clipDepth', 'visible'])
          if (Object.hasOwn(event, key)) pose[key] = clone(event[key]);
        active.set(event.depth, pose);
      }
    }
    states.push(new Map([...active].map(([depth, pose]) => [depth, clone(pose)])));
  }
  return states;
}

function point(matrix, [x, y]) {
  const [a, b, c, d, tx, ty] = matrix;
  return [a * x + c * y + tx, b * x + d * y + ty];
}
function bounds(matrix, [x0, y0, x1, y1]) {
  const corners = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]].map(p => point(matrix, p));
  return [Math.min(...corners.map(p => p[0])), Math.min(...corners.map(p => p[1])),
    Math.max(...corners.map(p => p[0])), Math.max(...corners.map(p => p[1]))];
}
function alpha(pose, sourceAlpha) {
  const color = pose.colorTransform;
  return Math.max(0, Math.min(255, sourceAlpha * color.multiply[3] / color.divisor + color.add[3])) / 255;
}
function glyphStatus(box, masks, opacity, visible) {
  if (opacity <= 0 || !visible) return 'Z';
  if (box === null) return 'E';
  if (masks.some(m => box[2] <= m[0] || box[0] >= m[2] || box[3] <= m[1] || box[1] >= m[3])) return 'O';
  return masks.every(m => box[0] >= m[0] && box[1] >= m[1] && box[2] <= m[2] && box[3] <= m[3]) ? 'F' : 'P';
}

const MASKS = [
  {characterId: 18, boundsTwips: [-2375, -270, 2375, 270],
    verifiedClosedRectangleVerticesTwips: [[2375, -270], [-2375, -270], [-2375, 270], [2375, 270], [2375, -270]],
    authoredFillAlpha: 164, maskSemantics: 'filled geometry; authored fill alpha is not a visibility multiplier'},
  {characterId: 30, boundsTwips: [-3469, -270, 3470, 270],
    verifiedClosedRectangleVerticesTwips: [[3470, -270], [-3469, -270], [-3469, 270], [3470, 270], [3470, -270]],
    authoredFillAlpha: 184, maskSemantics: 'filled geometry; authored fill alpha is not a visibility multiplier'},
];

export function collectP010TextData(bytes, audit) {
  assert.equal(bytes.length, 183770, 'exact P010 source length required');
  assert.equal(hash(bytes), P010_TEXT_SOURCE_SHA, 'exact P010 source hash required');
  assert.equal(audit.schemaVersion, 1); assert.equal(audit.kind, 'p010-native-typography-source-geometry');
  assert.equal(audit.animationId, ID); assert.equal(audit.sourceSha256, P010_TEXT_SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(bytes);
  assert.equal(source.textDefinitions.length, 28); assert.equal(source.summary.textRuns, 52);
  assert.equal(source.summary.unresolvedRuns, 0); assert.equal(source.summary.unparsedTags, 0);
  assert.deepEqual(audit.summary, {...source.summary, textPlacementGenerations: 53, runInstancePairs: 77, verifiedRectangularMaskDefinitions: 2});
  assert.deepEqual(audit.maskDefinitions, MASKS, 'reviewed rectangular mask geometry changed');
  const main = source.timelines.find(t => t.timelineId === 'sprite-96');
  const root = source.timelines.find(t => t.timelineId === 'root');
  assert.equal(main.declaredFrameCount, 465); assert.equal(root.declaredFrameCount, 10);
  const poses = p010SourcePoses(main), rootPose = p010SourcePoses(root)[5].get(1);
  assert.equal(rootPose.characterId, 96); assert.deepEqual(rootPose.matrix, [1, 0, 0, 1, 8248, 5666]);
  assert.deepEqual(audit.sourceEntryCondition, {rootFrame: 6, mainCharacterId: 96, mainFrameCount: 465,
    matrixTwips: rootPose.matrix, sourceTimelinePlaybackNotExecuted: true});
  assert.equal(source.fonts.length, 1); const font = source.fonts[0];
  assert.equal(font.characterId, 3); assert.equal(font.unitsPerEm, 1024); assert.equal(font.glyphCount, 41);
  assert.equal(audit.fontGlyphInkBounds.length, 41);
  for (const [index, glyph] of audit.fontGlyphInkBounds.entries()) {
    assert.equal(glyph.fontId, 3); assert.equal(glyph.glyphIndex, index);
    assert.equal(glyph.code, font.codes[index]); assert.equal(glyph.unicode, String.fromCodePoint(glyph.code));
    assert.equal(glyph.unitsPerEm, 1024);
    assert(glyph.boundsFontUnits === null || glyph.boundsFontUnits.length === 4 && glyph.boundsFontUnits.every(Number.isFinite));
  }
  assert.equal(audit.textDefinitions.length, 28);
  const definitions = source.textDefinitions.map((definition, ordinal) => {
    assert.equal(definition.kind, 'static-text'); const reviewed = audit.textDefinitions[ordinal];
    const {runs: reviewedRuns, literalText, ...reviewedMetadata} = reviewed;
    const {runs: sourceRuns, ...sourceMetadata} = definition;
    assert.deepEqual(reviewedMetadata, sourceMetadata, 'text definition identity/geometry drift');
    assert.equal(literalText, sourceRuns.map(r => r.text).join('')); assert.equal(reviewedRuns.length, sourceRuns.length);
    let penX = 0, penY = 0;
    const runs = sourceRuns.map((run, runIndex) => {
      assert.equal(typeof run.text, 'string'); assert.equal(run.fontId, 3);
      if (run.changed.xOffset) penX = run.xOffsetTwips;
      if (run.changed.yOffset) penY = run.yOffsetTwips;
      const baselineTwips = [penX, penY];
      const {glyphs: reviewedGlyphs, ...reviewedRunMetadata} = reviewedRuns[runIndex];
      const {glyphs: sourceGlyphs, ...sourceRunMetadata} = run;
      assert.deepEqual(reviewedRunMetadata, sourceRunMetadata, 'literal/color/font/run identity drift');
      assert.equal(reviewedGlyphs.length, sourceGlyphs.length);
      const glyphs = sourceGlyphs.map((glyph, glyphOrdinalInRun) => {
        const box = audit.fontGlyphInkBounds[glyph.index].boundsFontUnits, scale = run.fontHeightTwips / 1024;
        const ink = box === null ? null : bounds(definition.matrix,
          [penX + box[0] * scale, penY + box[1] * scale, penX + box[2] * scale, penY + box[3] * scale]);
        const result = {sourceTextId: run.sourceTextId, glyphOrdinalInRun, unicode: glyph.unicode,
          fontGlyphIndex: glyph.index, advanceTwips: glyph.advanceTwips, penTwips: [penX, penY],
          inkBoundsInTextDefinitionTwips: ink, sourceColorAlpha: run.colorRgba[3]};
        assert.deepEqual(reviewedGlyphs[glyphOrdinalInRun], result, 'source pen/glyph geometry drift');
        penX += glyph.advanceTwips; return result;
      });
      return {id: run.sourceTextId, text: run.text, color: run.colorRgba,
        fontHeightTwips: run.fontHeightTwips, baselineTwips, advanceTwips: sourceGlyphs.reduce((sum, g) => sum + g.advanceTwips, 0),
        revealFrame: REVEAL[definition.characterId]?.[run.runIndex] ?? null, glyphs};
    });
    return {characterId: definition.characterId, sourceTagSha256: definition.sourceTagSha256,
      matrix: definition.matrix, boundsTwips: definition.boundsTwips, runs};
  });
  const textDefinitions = new Map(definitions.map(d => [d.characterId, d]));
  const sourceInstances = main.instances.filter(i => textDefinitions.has(i.characterId));
  assert.equal(sourceInstances.length, 53); assert.equal(audit.textInstances.length, 53);
  const expectedPairs = [], pairKeys = new Set();
  const instances = sourceInstances.map((instance, ordinal) => {
    const reviewed = audit.textInstances[ordinal];
    const {firstPose, events: reviewedEvents, visibilitySegments, ...identityMetadata} = reviewed;
    assert.deepEqual(identityMetadata, instance, 'source text placement generation drift');
    assert.deepEqual(firstPose, poses[instance.firstFrame - 1].get(instance.depth), 'inherited first pose drift');
    const events = instance.updates.map(id => main.events.find(e => e.eventId === id));
    assert(events.every(Boolean));
    const serializeEvent = event => Object.fromEntries(['eventId', 'frame', 'kind', 'sourceTagOffset', 'sourceTagSha256',
      'depth', 'instanceId', 'move', 'characterId', 'matrix', 'colorTransform', 'ratio', 'name', 'clipDepth', 'visible']
      .filter(k => Object.hasOwn(event, k)).map(k => [k, event[k]]));
    assert.deepEqual(reviewedEvents, events.map(serializeEvent), 'source placement event drift');
    const definition = textDefinitions.get(instance.characterId), allGlyphs = definition.runs.flatMap(r => r.glyphs), frames = [];
    for (let frame = instance.firstFrame; frame < instance.lastFrameExclusive; frame++) {
      const display = poses[frame - 1], pose = display.get(instance.depth);
      assert.equal(pose.instanceId, instance.instanceId);
      const masks = [...display].filter(([depth, m]) => m.clipDepth !== undefined && depth < instance.depth && instance.depth <= m.clipDepth)
        .map(([, m]) => {const mask = MASKS.find(d => d.characterId === m.characterId); assert(mask, 'unreviewed clip mask');
          assert.deepEqual(m.matrix.slice(1, 3), [0, 0], 'mask must be axis aligned'); return bounds(m.matrix, mask.boundsTwips);});
      const alphas = allGlyphs.map(g => alpha(pose, g.sourceColorAlpha));
      const codes = allGlyphs.map((g, i) => glyphStatus(g.inkBoundsInTextDefinitionTwips === null ? null :
        bounds(pose.matrix, g.inkBoundsInTextDefinitionTwips), masks, alphas[i], pose.visible ?? true)).join('');
      frames.push({frame, alpha: alphas, codes});
    }
    const segments = [];
    for (const frame of frames) {
      const previous = segments.at(-1);
      if (previous && previous.codes === frame.codes && JSON.stringify(previous.alpha) === JSON.stringify(frame.alpha)) previous.lastFrame = frame.frame;
      else segments.push({firstFrame: frame.frame, lastFrame: frame.frame, codes: frame.codes, alpha: frame.alpha});
    }
    assert.deepEqual(visibilitySegments, segments, 'source per-frame glyph/mask visibility drift');
    let start = 0;
    for (const run of definition.runs) {
      const ink = run.glyphs.flatMap((g, ordinal) => g.inkBoundsInTextDefinitionTwips === null ? [] : [start + ordinal]);
      const first = predicate => frames.find(predicate)?.frame ?? null;
      const pair = {instanceId: instance.instanceId, sourceTextId: run.id, literalText: run.text,
        firstPossibleInkFrame: first(v => ink.some(i => ['F', 'P'].includes(v.codes[i]))),
        firstAllInkBoundsContainedFrame: first(v => ink.length && ink.every(i => v.codes[i] === 'F')),
        firstAllInkBoundsContainedAndFullOpacityFrame: first(v => ink.length && ink.every(i => v.codes[i] === 'F' && v.alpha[i] === 1))};
      if (run.revealFrame !== null) assert.equal(pair.firstAllInkBoundsContainedFrame, run.revealFrame, 'whole-run prose reveal differs from glyph/mask audit');
      const key = `${pair.instanceId}|${pair.sourceTextId}`; assert(!pairKeys.has(key)); pairKeys.add(key);
      expectedPairs.push(pair); start += run.glyphs.length;
    }
    const nativeEvents = events.map((event, index) => ({frame: event.frame, sourceEventId: event.eventId,
      sourceTagSha256: event.sourceTagSha256,
      ...(index === 0 || event.matrix ? {matrix: index === 0 ? firstPose.matrix : event.matrix} : {}),
      ...(index === 0 || event.colorTransform ? {colorTransform: index === 0 ? firstPose.colorTransform : event.colorTransform} : {}),
      ...(Object.hasOwn(event, 'visible') || index === 0 && Object.hasOwn(firstPose, 'visible') ? {visible: index === 0 ? firstPose.visible : event.visible} : {})}));
    return {instanceId: instance.instanceId, characterId: instance.characterId, depth: instance.depth,
      generation: instance.generation, firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive,
      firstPose, events: nativeEvents};
  });
  assert.equal(expectedPairs.length, 77); assert.deepEqual(audit.runInstanceVisibilitySummary, expectedPairs, 'all 77 run-instance visibility pairs must match');
  const runInstances = expectedPairs.map(pair => ({...pair, baselineTwips: textDefinitions.get(sourceInstances.find(i => i.instanceId === pair.instanceId).characterId)
    .runs.find(r => r.id === pair.sourceTextId).baselineTwips,
    revealFrame: REVEAL[Number(pair.sourceTextId.split('/')[0].slice('character-'.length))]?.[Number(pair.sourceTextId.split('/run-')[1])] ?? null}));
  // Glyph shapes support validation only; compact native text data carries the
  // complete per-run baseline and pair receipts without shipping font paths.
  const compactDefinitions = definitions.map(d => ({...d, runs: d.runs.map(({glyphs, ...run}) => run)}));
  return {animationId: ID, sourceSha256: P010_TEXT_SOURCE_SHA, sourceGeometrySha256: P010_GEOMETRY_SHA,
    frameDomain: 'sprite-96', frameCount: 465, rootFrame: 6, rootTranslationTwips: [8248, 5666],
    definitions: compactDefinitions, instances, runInstances,
    claimBoundary: {sourceGeometryOnly: true, sourceLiteralsUnedited: true, semanticRolesAssigned: false,
      naturalEntryEstablished: false, registered: false, originalRuntimeAccepted: false, audioAccepted: false,
      humanAccepted: false, ownerAccepted: false, strictComplete: false, published: false}};
}

export async function readP010TextPhysicalFile(file, expected) {
  assert.equal(await realpath(file), file, 'source input must use its physical path');
  const before = await lstat(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, 'ordinary single-link physical file required');
  const bytes = await readFile(file), after = await lstat(file, {bigint: true});
  for (const field of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink']) assert.equal(after[field], before[field], 'source input changed while reading');
  if (expected?.bytes !== undefined) assert.equal(bytes.length, expected.bytes, 'source input size drift');
  if (expected?.sha256) assert.equal(hash(bytes), expected.sha256, 'source input hash drift');
  return bytes;
}
export async function prepareP010TextData() {
  const bytes = await readP010TextPhysicalFile(P010_TEXT_SOURCE, {bytes: 183770, sha256: P010_TEXT_SOURCE_SHA});
  const auditBytes = await readP010TextPhysicalFile(path.join(ROOT, P010_GEOMETRY_PATH), {bytes: 1066116, sha256: P010_GEOMETRY_SHA});
  const audit = JSON.parse(auditBytes);
  for (const pin of audit.inputs) await readP010TextPhysicalFile(path.isAbsolute(pin.path) ? pin.path : path.join(ROOT, pin.path), pin);
  const data = collectP010TextData(bytes, audit);
  const result = '// Generated from the hash-bound P010 source; do not edit.\n' +
    `// Glyph/mask source geometry SHA-256: ${P010_GEOMETRY_SHA}\n` +
    `export const P010_TEXT_DATA = ${JSON.stringify(data, null, 2)} as const;\n`;
  return {data, result};
}
async function main() {
  assert(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'use --write or --check');
  const {data, result} = await prepareP010TextData();
  if (process.argv[2] === '--check') assert.equal((await readP010TextPhysicalFile(path.join(ROOT, P010_TEXT_OUTPUT))).toString(), result, 'native text data reproducibility drift');
  else await writeFile(path.join(ROOT, P010_TEXT_OUTPUT), result, {flag: 'wx'});
  console.log(JSON.stringify({state: process.argv[2] === '--check' ? 'P010_TEXT_DATA_VERIFIED_READ_ONLY' : 'P010_TEXT_DATA_CREATED',
    file: P010_TEXT_OUTPUT, bytes: Buffer.byteLength(result), sha256: hash(result), definitions: data.definitions.length,
    runs: data.definitions.reduce((n, d) => n + d.runs.length, 0), instances: data.instances.length, runInstancePairs: data.runInstances.length,
    perRunBaselines: true, firstPosesValidated: true, claimBoundary: data.claimBoundary}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main().catch(error => {console.error(error); process.exitCode = 1;});
