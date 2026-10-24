#!/usr/bin/env node
/** Source-bound native teaching text for the two ALG L12 glossary pages. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'output/alg-l12-next-glossary-20260927';
const GENERATED = 'packages/demos/src/generated/alg-l12-p013-p015-native-text-data.ts';
const NATIVE = `${BASE}/native-text`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB';
const PAGES = Object.freeze({
  p013: {id: 'shared-alg001-l12-p013', file: 'L12VB08.swf', sha: '056fb04850a10cd8888112e4c4fe5730bf475e559f0904b7841545c099536424', bytes: 145346,
    catalogSha: 'a2652f4d89d7849c1cf63b8424add60dfcba7da3e685015d747016ea35f54185', canvasSha: '560b7fc82bacc85dfc5f853bd15deebb9bb028611fcd6dd989e896f89e630221',
    sprite: 63, frames: 372, companion: 64, prose: [4, 30], masks: [[4, 1, 1, 3, 10, [-2555, -311, 2555, 310]], [30, 1, 11, 13, 16, [-2555, -311, 2555, 310]]],
    roles: {4: 'body', 30: 'body', 26: 'axis-label', 27: 'axis-label', 34: 'quadrant-callout', 35: 'quadrant-callout', 36: 'quadrant-callout', 37: 'quadrant-callout'},
    terms: {'character-4/run-1': 'x-axis', 'character-4/run-3': 'y-axis', 'character-4/run-5': 'coordinate-plane', 'character-30/run-1': 'quadrant'}},
  p015: {id: 'shared-alg001-l12-p015', file: 'L12VB10.swf', sha: 'b14f5cec27090f38053e46ea7ef90beaeabab75a6aabe278955477e34bcc68c4', bytes: 187238,
    catalogSha: 'b614ee7302e29bae973c9d32a26dec5b85d4f45bd997208934e7f1815982a3a4', canvasSha: '2fa76e779d143e9e64039e82582eae0c75856579cb24ef3767d91b1e8976146c',
    sprite: 76, frames: 474, companion: 77, prose: [21, 30], masks: [[21, 19, 108, 110, 121, [-1590, -272, 1590, 273]], [30, 19, 122, 124, 127, [-1590, -272, 1590, 273]]],
    roles: {21: 'body', 30: 'body', 3: 'axis-label', 6: 'axis-label', 47: 'axis-label', 54: 'axis-label', 15: 'coordinate-label', 33: 'coordinate-label', 56: 'coordinate-label', 57: 'coordinate-label'},
    terms: {'character-21/run-1': 'ordered-pair', 'character-21/run-3': 'locate', 'character-21/run-5': 'point', 'character-21/run-7': 'grid', 'character-30/run-1': 'coordinate'}},
});

const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const readPinned = async (absolute, hash, bytes) => {
  const before = await lstat(absolute, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink(), `${absolute}: ordinary file required`);
  const value = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) assert.equal(after[key], before[key], `${absolute}: changed during read`);
  if (bytes !== undefined) assert.equal(value.length, bytes, `${absolute}: byte count drift`);
  assert.equal(sha(value), hash, `${absolute}: SHA-256 drift`);
  return value;
};
const identity = () => [1, 0, 0, 1, 0, 0];
const defaultColor = () => ({multiply: [256, 256, 256, 256], add: [0, 0, 0, 0], divisor: 256});

/** Replay each PlaceObject2 move with inherited properties, then coalesce identical poses. */
export function sourcePoseSegments(timeline, selectedInstances) {
  const byFrame = new Map();
  for (const event of timeline.events) {
    if (!byFrame.has(event.frame)) byFrame.set(event.frame, []);
    byFrame.get(event.frame).push(event);
  }
  const wanted = new Set(selectedInstances.map(item => item.instanceId));
  const segments = new Map(selectedInstances.map(item => [item.instanceId, []]));
  const active = new Map();
  for (let frame = 1; frame <= timeline.declaredFrameCount; frame++) {
    for (const event of byFrame.get(frame) ?? []) {
      if (event.kind === 'remove') active.delete(event.depth);
      else if (event.kind === 'place') {
        const pose = event.move ? structuredClone(active.get(event.depth) ?? {}) : {};
        pose.matrix ??= identity(); pose.colorTransform ??= defaultColor();
        for (const key of ['instanceId', 'characterId', 'matrix', 'colorTransform', 'visible', 'clipDepth', 'name'])
          if (Object.hasOwn(event, key)) pose[key] = structuredClone(event[key]);
        active.set(event.depth, pose);
      }
    }
    for (const [depth, pose] of active) {
      if (!wanted.has(pose.instanceId)) continue;
      const list = segments.get(pose.instanceId);
      const value = {matrix: pose.matrix, colorTransform: pose.colorTransform,
        visible: pose.visible ?? true, clipDepth: pose.clipDepth ?? null};
      const prior = list.at(-1);
      if (prior && prior.lastFrameExclusive === frame && JSON.stringify(prior.pose) === JSON.stringify(value)) prior.lastFrameExclusive++;
      else list.push({firstFrame: frame, lastFrameExclusive: frame + 1, pose: value});
    }
  }
  for (const item of selectedInstances) {
    const list = segments.get(item.instanceId);
    assert(list.length && list[0].firstFrame === item.firstFrame && list.at(-1).lastFrameExclusive === item.lastFrameExclusive,
      `${item.instanceId}: pose lifetime drift`);
  }
  return segments;
}

function definition(def, config) {
  assert.equal(def.kind, 'static-text');
  let penX = 0, penY = 0;
  return {characterId: def.characterId, sourceTextId: def.sourceTextId,
    sourceTagSha256: def.sourceTagSha256, sourceTagOffset: def.sourceTagOffset,
    role: config.roles[def.characterId] ?? 'diagram-number-or-label',
    nativeReplacement: config.prose.includes(def.characterId),
    boundsTwips: def.boundsTwips, matrix: def.matrix,
    runs: def.runs.map(run => {
      if (run.changed.xOffset) penX = run.xOffsetTwips;
      if (run.changed.yOffset) penY = run.yOffsetTwips;
      const baselineTwips = [penX, penY];
      const glyphs = run.glyphs.map(glyph => {
        penX += glyph.advanceTwips;
        return {unicode: glyph.unicode, advanceTwips: glyph.advanceTwips, index: glyph.index};
      });
      return {sourceTextId: run.sourceTextId, text: run.text,
        sourceGlossaryEntryId: config.terms[run.sourceTextId] ?? null,
        baselineTwips, fontId: run.fontId, fontHeightTwips: run.fontHeightTwips,
        colorRgba: run.colorRgba, decodeStatus: run.decodeStatus, glyphs};
    })};
}

function canvasCallForFrame(canvas, sprite, frame, object) {
  const start = canvas.indexOf(`function sprite${sprite}(`);
  assert(start >= 0, 'source sprite function absent');
  const open = canvas.indexOf(`\n\t\tcase ${frame - 1}:`, start);
  assert(open >= 0, `source Canvas case ${frame - 1} absent`);
  const next = canvas.indexOf('\n\t\tcase ', open + 1);
  const part = canvas.slice(open, next < 0 ? canvas.indexOf('\n\t\tdefault:', open) : next);
  const matches = [...part.matchAll(new RegExp(`place\\("${object}",canvas,ctx,(\\[[^\\]]+\\])`, 'g'))];
  assert.equal(matches.length, 1, `${object} call count on source frame ${frame}`);
  return JSON.parse(matches[0][1]);
}

export async function preparePairNativeText() {
  const records = {}, manifests = {};
  for (const [short, config] of Object.entries(PAGES)) {
    const absolute = `${SOURCE_ROOT}/${config.file}`;
    assert.equal(await realpath(absolute), absolute, 'source must be a real physical AWS file');
    const swf = await readPinned(absolute, config.sha, config.bytes);
    const catalogBytes = await readPinned(path.join(ROOT, BASE, short, 'text-catalog.json'), config.catalogSha);
    const catalog = JSON.parse(catalogBytes);
    assert.deepEqual(catalog, collectSwfTextSourceCatalog(swf), `${short}: catalog differs from current physical parser`);
    const canvasBytes = await readPinned(path.join(ROOT, BASE, 'candidates', short, 'canvas-renderer.js'), config.canvasSha);
    const canvas = canvasBytes.toString('utf8');
    assert.equal(catalog.sourceSha256, config.sha);
    assert.equal(catalog.header.frameCount, 10);
    assert.equal(catalog.header.frameRate, 12);
    assert.equal(catalog.summary.unresolvedRuns, 0);
    assert.equal(catalog.summary.unparsedTags, 0);
    const child = catalog.timelines.find(t => t.timelineId === `sprite-${config.sprite}`);
    const root = catalog.timelines.find(t => t.timelineId === 'root');
    assert(child && root && child.declaredFrameCount === config.frames);
    const rootPlacement = root.instances.find(i => i.characterId === config.sprite && i.firstFrame === 6);
    const rootEvent = root.events.find(e => e.eventId === rootPlacement?.createdByEventId);
    assert.deepEqual(rootEvent?.matrix, [1, 0, 0, 1, 8248, 5666]);
    const titleShape = root.instances.find(i => i.characterId === config.companion && i.firstFrame === 6);
    const titleEvent = root.events.find(e => e.eventId === titleShape?.createdByEventId);
    assert(titleShape && titleEvent);
    assert.deepEqual(titleEvent.matrix, identity());
    const titlePathData = canvas.match(new RegExp(`function shape${config.companion}\\([^]*?var pathData="([^"]+)"`))?.[1];
    assert.equal(sha(titlePathData ?? ''), 'a423140f7c29dfd35850885bb62d367f8176a95a3ddfe12f400df7c63ae4480b',
      'source title outline differs from reviewed pair shape');
    assert(canvas.includes(`place("shape${config.companion}",canvas,ctx,[0.05,0,0,0.05,0,0]`),
      'source root title rendering call absent');
    const defs = catalog.textDefinitions.map(item => definition(item, config));
    const byChar = new Map(defs.map(item => [item.characterId, item]));
    const textInstances = child.instances.filter(item => byChar.has(item.characterId));
    const maskInstances = config.masks.map(([textChar, maskChar, maskDepth, textDepth, clipDepth, rect]) => {
      const text = textInstances.find(item => item.characterId === textChar && item.depth === textDepth);
      const mask = child.instances.find(item => item.characterId === maskChar && item.depth === maskDepth);
      const event = child.events.find(e => e.eventId === mask?.createdByEventId);
      assert(text && mask && event?.clipDepth === clipDepth && mask.depth < text.depth && text.depth <= clipDepth);
      assert.equal(catalog.shapeDefinitions.find(shape => shape.characterId === maskChar)?.tagName, 'DefineShape3');
      return {textCharacterId: textChar, textInstanceId: text.instanceId,
        maskCharacterId: maskChar, maskInstanceId: mask.instanceId, depth: maskDepth,
        clipDepth, localBoundsTwips: rect,
        sourceShapeTagSha256: catalog.shapeDefinitions.find(shape => shape.characterId === maskChar).sourceTagSha256};
    });
    const selected = [...textInstances, ...maskInstances.map(mask => child.instances.find(i => i.instanceId === mask.maskInstanceId))];
    const poses = sourcePoseSegments(child, selected);
    const instances = textInstances.map(item => ({instanceId: item.instanceId, timelineId: item.timelineId,
      depth: item.depth, generation: item.generation, characterId: item.characterId,
      firstFrame: item.firstFrame, lastFrameExclusive: item.lastFrameExclusive,
      createdByEventId: item.createdByEventId,
      events: item.updates.map(id => {
        const event = child.events.find(e => e.eventId === id); assert(event);
        return {eventId: id, frame: event.frame, sourceTagOffset: event.sourceTagOffset,
          sourceTagSha256: event.sourceTagSha256, matrix: event.matrix ?? null,
          colorTransform: event.colorTransform ?? null, visible: event.visible ?? null};
      }), poseSegments: poses.get(item.instanceId)}));
    const masks = maskInstances.map(mask => ({...mask,
      poseSegments: poses.get(mask.maskInstanceId),
      events: child.instances.find(i => i.instanceId === mask.maskInstanceId).updates.map(id => {
        const event = child.events.find(e => e.eventId === id); assert(event);
        return {eventId: id, frame: event.frame, sourceTagOffset: event.sourceTagOffset,
          sourceTagSha256: event.sourceTagSha256, matrix: event.matrix ?? null,
          clipDepth: event.clipDepth ?? null};
      })}));
    const rules = config.prose.map(characterId => {
      const item = instances.find(i => i.characterId === characterId); assert(item);
      const source = byChar.get(characterId);
      const object = `text${characterId}`;
      const sourceMatrix = item.events[0].matrix;
      const callMatrix = [sourceMatrix[0]/20, sourceMatrix[1]/20,
        sourceMatrix[2]/20, sourceMatrix[3]/20, sourceMatrix[4]/20, sourceMatrix[5]/20];
      for (let frame = item.firstFrame; frame < item.lastFrameExclusive; frame++) {
        assert.deepEqual(canvasCallForFrame(canvas, config.sprite, frame, object), callMatrix,
          `${short} ${object} call matrix drift at ${frame}`);
      }
      return {id: item.instanceId, object, sourceTextIds: source.runs.map(run => run.sourceTextId),
        nativeReplacementId: item.instanceId, firstFrame: item.firstFrame,
        lastFrameExclusive: item.lastFrameExclusive, sourcePlacementEvents: item.events,
        sourceMatrix, canvasCallMatrix: callMatrix, callOrdinalWithinFrameObject: 0,
        maskInstanceId: masks.find(mask => mask.textCharacterId === characterId).maskInstanceId};
    });
    records[short] = {schemaVersion: 1, kind: 'alg-l12-glossary-pair-native-text-data-v1',
      animationId: config.id, source: {swfPath: absolute, swfSha256: config.sha,
        swfBytes: config.bytes, textCatalogSha256: config.catalogSha,
        sourceCanvasSha256: config.canvasSha},
      stage: {width: 800, height: 600, fps: 12},
      frameDomain: `sprite-${config.sprite}`, frameCount: config.frames, rootFrame: 6,
      rootPlacement: {instanceId: rootPlacement.instanceId, matrix: rootEvent.matrix,
        sourceTagSha256: rootEvent.sourceTagSha256},
      title: {text: 'Graphing in the Coordinate Plane: Vocabulary',
        role: 'title', characterId: config.companion, instanceId: titleShape.instanceId,
        depth: titleShape.depth, generation: titleShape.generation,
        sourceShapeTagSha256: catalog.shapeDefinitions.find(shape => shape.characterId === config.companion)?.sourceTagSha256,
        sourcePlacementTagSha256: titleEvent.sourceTagSha256,
        sourcePathDataSha256: sha(titlePathData),
        transcriptionBasis: 'source-canvas-outline-and-local-generated-render-review'},
      definitions: defs, instances, masks,
      roles: {nativeProseCharacterIds: config.prose,
        canvasRetainedTextInstanceIds: instances.filter(item => !config.prose.includes(item.characterId)).map(item => item.instanceId),
        possibleOutlinedTextInOtherShapes: true},
      claimBoundary: {structuralSourceAndCandidateOnly: true, nativeTextBrowserVerified: false,
        originalRuntimeAccepted: false, audioAccepted: false, humanAccepted: false,
        ownerAccepted: false, strictComplete: false, published: false}};
    manifests[short] = {schemaVersion: 1, kind: 'alg-l12-glossary-pair-native-text-suppression-v1',
      animationId: config.id, sourceSwfSha256: config.sha, sourceCanvasSha256: config.canvasSha,
      frameDomain: `sprite-${config.sprite}`, rootFrame: 6, frameCount: config.frames,
      rules, rootCompanionShapeSuppression: [{id: titleShape.instanceId,
        placementScope: 'render-root-companion', object: `shape${config.companion}`,
        sourceShapeId: config.companion, nativeReplacementId: 'title',
        firstFrame: 1, lastFrameExclusive: config.frames + 1, sourceRootFrame: 6,
        sourcePlacementEvents: [{eventId: titleEvent.eventId, frame: titleEvent.frame,
          sourceTagOffset: titleEvent.sourceTagOffset, sourceTagSha256: titleEvent.sourceTagSha256,
          matrix: titleEvent.matrix}], sourceMatrix: titleEvent.matrix,
        canvasCallMatrix: [0.05, 0, 0, 0.05, 0, 0], callOrdinalWithinFrameObject: 0,
        sourcePathDataSha256: sha(titlePathData)}],
      retainedTextInstanceIds: records[short].roles.canvasRetainedTextInstanceIds,
      claimBoundary: {proseAndTitleOnly: true, diagramLabelsRetainedInCanvas: true,
        titleOutlineReplacedByNativeText: true}};
  }
  return {records, manifests};
}

export async function buildPairNativeText({check = false} = {}) {
  const result = await preparePairNativeText();
  // A narrow public type avoids expanding 900K of source pose literals into a
  // type-level union every time a product module imports this data.
  const generated = `/** Generated by scripts/build-g678-alg-l12-glossary-pair-native-text.mjs; do not edit. */\nexport const PAIR_NATIVE_TEXT_DATA = ${json(result.records).trimEnd()} as unknown as Readonly<Record<'p013' | 'p015', {readonly source: {readonly swfSha256: string}}>>;\n`;
  const outputs = [[GENERATED, generated],
    ...Object.entries(result.manifests).map(([short, value]) => [`${NATIVE}/${short}-suppression-manifest.json`, json(value)]),
    [`${NATIVE}/source-role-review.json`, json({schemaVersion: 1, kind: 'alg-l12-glossary-pair-source-role-review-v1',
      pages: Object.fromEntries(Object.entries(result.records).map(([short, value]) => [short, {
        animationId: value.animationId, sourceSwfSha256: value.source.swfSha256,
        sourceTextCount: value.definitions.length, textInstanceCount: value.instances.length,
        nativeProseInstanceIds: result.manifests[short].rules.map(rule => rule.id),
        canvasRetainedTextInstanceIds: value.roles.canvasRetainedTextInstanceIds,
        sourceTitleShapeId: value.title.characterId,
        unresolved: ['other-vector-text-unclassified',
          'source-mask-glyph-ink-edge-not-fully-reviewed', 'source-Spanish-animation-copy-absent'],
      }]))})]];
  for (const [relative, content] of outputs) {
    const absolute = path.join(ROOT, relative);
    if (check) assert.equal(await readFile(absolute, 'utf8'), content, `${relative}: generated output drift`);
    else { await mkdir(path.dirname(absolute), {recursive: true}); await writeFile(absolute, content); }
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPairNativeText({check: process.argv.includes('--check')}).then(result =>
    console.log(json({pages: Object.fromEntries(Object.entries(result.records).map(([short, value]) =>
      [short, {sourceSha256: value.source.swfSha256, textDefinitions: value.definitions.length,
        textInstances: value.instances.length, suppressedProse: result.manifests[short].rules.length}]))}).trimEnd())
  ).catch(error => {console.error(error); process.exitCode = 1;});
}
