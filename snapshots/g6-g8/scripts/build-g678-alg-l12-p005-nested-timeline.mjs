#!/usr/bin/env node
/** Source-derived display-list intervals for P005. No Flash execution or visual claim. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const AUDIT = resolve(HERE, '../migrations/shared-alg001-l12-p005/audit');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
const OUTPUT = resolve(AUDIT, 'nested-timeline-v1.json');
const CHILD_IDS = [78, 147, 258, 289, 306, 346];
const SHA = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';

// ElementTree reads only the audited XML path. Emit bounded direct-tag metadata;
// no bitmap, sound, action, or shape payload is sent through the subprocess.
const ELEMENTTREE_EXTRACT = String.raw`
import json
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
tags = root.find('tags')
if tags is None:
    raise ValueError('FFDec XML has no root tags')
ids = ('spriteId', 'shapeId', 'characterID', 'characterId', 'fontID', 'buttonId', 'soundId')
definitions = []
sprites = {}
for item in tags:
    kind = item.get('type', '')
    if kind == 'DefineSpriteTag':
        sid = int(item.get('spriteId'))
        if sid in sprites:
            raise ValueError(f'duplicate sprite {sid}')
        sprites[sid] = item
    if kind.startswith('Define') and kind != 'DefineFontNameTag':
        raw_id = next((item.get(key) for key in ids if item.get(key) is not None), None)
        if raw_id is not None:
            definitions.append({'id': int(raw_id), 'type': kind})
timelines = {}
for sid in (391, 78, 147, 258, 289, 306, 346):
    sprite = sprites.get(sid)
    if sprite is None:
        raise ValueError(f'missing sprite {sid}')
    sub_tags = sprite.find('subTags')
    if sub_tags is None:
        raise ValueError(f'sprite {sid} has no subTags')
    direct = []
    for item in sub_tags:
        kind = item.get('type')
        record = {'type': kind}
        if kind in ('PlaceObject2Tag', 'RemoveObject2Tag'):
            record.update(item.attrib)
            matrix = item.find('matrix')
            if matrix is not None:
                record['matrix'] = {key: value for key, value in matrix.attrib.items() if key != 'type'}
        direct.append(record)
    timelines[str(sid)] = {'frameCount': int(sprite.get('frameCount')), 'tags': direct}
print(json.dumps({
    'generator': root.get('_generator'),
    'xmlExportMajor': root.get('_xmlExportMajor'),
    'xmlExportMinor': root.get('_xmlExportMinor'),
    'definitions': definitions,
    'timelines': timelines,
}, ensure_ascii=False, separators=(',', ':')))
`;

/** Parse the audited FFDec XML with Python's standard XML library, read-only. */
export function loadSourceMetadata(xmlPath) {
  const before = sha256(readFileSync(xmlPath));
  const result = spawnSync('python3', ['-', xmlPath], {
    input: ELEMENTTREE_EXTRACT,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    timeout: 30_000,
  });
  assert(!result.error && result.status === 0, `ElementTree extraction failed: ${result.error?.message ?? result.stderr?.trim() ?? result.status}`);
  assert.equal(sha256(readFileSync(xmlPath)), before, 'FFDec XML changed during extraction');
  return { ...JSON.parse(result.stdout), xmlSha256: before };
}

/** Convert ElementTree direct-tag metadata into source frame events. */
export function parseTimelineTags(directTags, declaredFrameCount) {
  let frame = 1;
  let ordinal = 0;
  const events = [];
  const counts = {};
  for (const item of directTags) {
    const kind = item.type;
    counts[kind] = (counts[kind] ?? 0) + 1;
    if (kind === 'ShowFrameTag') { frame += 1; continue; }
    if (kind !== 'PlaceObject2Tag' && kind !== 'RemoveObject2Tag') continue;
    const event = {
      frame,
      tagOrdinal: ordinal++,
      kind: kind === 'PlaceObject2Tag' ? 'place' : 'remove',
      depth: Number(item.depth),
    };
    if (event.kind === 'place') {
      event.characterId = item.characterId === undefined ? null : Number(item.characterId);
      event.move = item.placeFlagMove === 'true';
      event.hasCharacter = item.placeFlagHasCharacter === 'true';
      event.matrix = item.matrix ?? null;
      event.ratio = item.ratio === undefined ? null : Number(item.ratio);
      event.name = item.name ?? null;
      event.clipDepth = item.clipDepth === undefined ? null : Number(item.clipDepth);
      event.hasColorTransform = item.placeFlagHasColorTransform === 'true';
      assert.equal(event.hasCharacter, event.characterId !== null, `frame ${frame}: character flag mismatch`);
    }
    events.push(event);
  }
  assert.equal(frame - 1, declaredFrameCount, 'ShowFrame count differs from declaration');
  return { events, tagCounts: counts };
}

/** Each explicit character tag starts an epoch; matrix-only moves retain that epoch. */
export function deriveDepthIntervals(events, frameCount, definitions = new Map()) {
  const active = new Map();
  const intervals = [];
  const finish = (interval, frame, reason, event = null) => {
    interval.endFrameExclusive = frame;
    interval.end = { reason, frame, tagOrdinal: event?.tagOrdinal ?? null, replacementCharacterId: event?.characterId ?? null };
  };
  for (const event of events) {
    if (event.kind === 'remove') {
      const prior = active.get(event.depth);
      assert(prior, `remove on empty depth ${event.depth} at frame ${event.frame}`);
      finish(prior, event.frame, 'remove', event);
      active.delete(event.depth);
      continue;
    }
    const prior = active.get(event.depth);
    if (event.characterId === null) {
      assert(prior && event.move, `move-only tag on empty depth ${event.depth} at frame ${event.frame}`);
      prior.updates.push({ frame: event.frame, tagOrdinal: event.tagOrdinal, matrix: event.matrix, ratio: event.ratio, hasColorTransform: event.hasColorTransform });
      continue;
    }
    const entryKind = !prior ? 'place-on-empty-depth' : prior.characterId === event.characterId ? 'replace-same-character' : 'replace-other-character';
    if (prior) finish(prior, event.frame, entryKind, event);
    const priorMatrix = prior?.updates.reduce((matrix, update) => update.matrix ?? matrix, prior.entry.effectiveMatrixAtEntry) ?? null;
    const priorRatio = prior?.updates.reduce((ratio, update) => update.ratio ?? ratio, prior.entry.effectiveRatioAtEntry) ?? null;
    const interval = {
      depth: event.depth,
      characterId: event.characterId,
      characterKind: definitions.get(event.characterId)?.characterKind ?? 'unknown',
      definitionTag: definitions.get(event.characterId)?.definitionTag ?? null,
      entryFrame: event.frame,
      entryKind,
      priorCharacterId: prior?.characterId ?? null,
      entry: {
        tagOrdinal: event.tagOrdinal,
        move: event.move,
        matrix: event.matrix,
        ratio: event.ratio,
        effectiveMatrixAtEntry: event.matrix ?? (event.move ? priorMatrix : null),
        effectiveRatioAtEntry: event.ratio ?? (event.move ? priorRatio : null),
        name: event.name,
        clipDepth: event.clipDepth,
        hasColorTransform: event.hasColorTransform,
      },
      updates: [],
      endFrameExclusive: null,
      end: null,
    };
    intervals.push(interval);
    active.set(event.depth, interval);
  }
  for (const interval of active.values()) finish(interval, frameCount + 1, 'timeline-end');
  return intervals;
}

function characterDefinitions(entries) {
  const definitions = new Map();
  for (const data of entries) {
    const id = data.id;
    assert(Number.isInteger(id) && !definitions.has(id), 'invalid or duplicate character definition');
    const characterKind = data.type === 'DefineSpriteTag' ? 'sprite'
      : data.type === 'DefineMorphShapeTag' ? 'morph-shape'
      : data.type.startsWith('DefineShape') ? 'shape'
      : data.type.startsWith('DefineBits') ? 'bitmap'
      : data.type.startsWith('DefineText') ? 'text'
      : data.type.startsWith('DefineFont') ? 'font'
      : data.type.startsWith('DefineButton') ? 'button' : 'other-defined';
    definitions.set(id, { characterKind, definitionTag: data.type });
  }
  return definitions;
}

export function buildNestedTimeline(metadata, sourceStructureText) {
  const structure = JSON.parse(sourceStructureText);
  assert.equal(structure.sourceSwfSha256, SHA);
  assert.equal(structure.ffdecXmlSha256, metadata.xmlSha256);
  assert.equal(metadata.generator, 'JPEXS Free Flash Decompiler v.26.2.1', 'FFDec version drift');
  assert.equal(metadata.xmlExportMajor, structure.ffdecXmlVersion.major);
  assert.equal(metadata.xmlExportMinor, structure.ffdecXmlVersion.minor);
  const definitions = characterDefinitions(metadata.definitions);
  assert.equal(definitions.size, structure.definedCharacterCount);
  assert.equal([...definitions.values()].filter((item) => item.characterKind === 'morph-shape').length, structure.definitionCounts.DefineMorphShapeTag);
  const timelineIds = [391, ...CHILD_IDS];
  const parsed = new Map();
  for (const id of timelineIds) {
    const { tags, frameCount } = metadata.timelines[id] ?? {};
    assert(Array.isArray(tags) && Number.isInteger(frameCount), `sprite ${id}: missing parsed XML timeline`);
    const result = parseTimelineTags(tags, frameCount);
    const expected = structure.timelines[`sprite-${id}`];
    assert.equal(frameCount, expected.frameCount, `sprite ${id}: frame count drift`);
    for (const type of ['PlaceObject2Tag', 'RemoveObject2Tag', 'ShowFrameTag']) {
      assert.equal(result.tagCounts[type] ?? 0, expected.tagCounts[type] ?? 0, `sprite ${id}: ${type} drift`);
    }
    parsed.set(id, { ...result, frameCount });
  }
  const main = parsed.get(391);
  const allMainIntervals = deriveDepthIntervals(main.events, main.frameCount, definitions);
  const childSet = new Set(CHILD_IDS);
  const placements = allMainIntervals.filter((interval) => childSet.has(interval.characterId));
  assert.equal(placements.length, 7, 'expected seven child placement epochs');
  for (const expected of structure.timelines['sprite-391'].childSpritePlacements) {
    const interval = placements.find((item) => item.characterId === Number(expected.childTimelineId.slice(7)) && item.depth === expected.depth && item.entryFrame === expected.parentFrame);
    assert(interval, `structure child placement missing: ${expected.childTimelineId} frame ${expected.parentFrame}`);
    assert.equal(interval.endFrameExclusive - 1, expected.retainedThroughFrame);
    assert.deepEqual(interval.entry.matrix, expected.matrix);
    assert.equal(interval.entry.ratio, Number(expected.ratio));
  }
  const children = CHILD_IDS.map((id) => {
    const local = parsed.get(id);
    const localIntervals = deriveDepthIntervals(local.events, local.frameCount, definitions);
    return {
      spriteId: id,
      timelineId: `sprite-${id}`,
      localFrameCount: local.frameCount,
      parentPlacements: placements.filter((item) => item.characterId === id),
      localDisplayListIntervals: localIntervals,
      localMorphCharacterIds: [...new Set(localIntervals.filter((item) => item.characterKind === 'morph-shape').map((item) => item.characterId))].sort((a, b) => a - b),
      localTagCounts: Object.fromEntries(Object.entries(local.tagCounts).sort(([a], [b]) => a.localeCompare(b))),
    };
  });
  return {
    schemaVersion: 1,
    animationId: structure.animationId,
    evidenceKind: 'FFDec static tags; no original-runtime playback authority',
    sourceSwfSha256: SHA,
    ffdecXmlSha256: structure.ffdecXmlSha256,
    sourceStructureSha256: createHash('sha256').update(sourceStructureText).digest('hex'),
    parentTimelineId: 'sprite-391',
    parentFrameCount: main.frameCount,
    fps: structure.header.fps,
    clockContract: {
      epoch: 'Each explicit character placement starts a structural placement epoch, including same-character replacement; move-only tags retain the epoch. Removal ends it.',
      localFrameCandidate: 'If an independent child advances once per parent frame and loops at its declared frame count, frame = 1 + ((parentFrame - entryFrame) mod localFrameCount). This is a query model only.',
      ratio: 'Source ratio fields are retained literally. A ratio on a sprite placement is not by itself evidence of morph interpolation.',
      unresolved: 'Original-runtime child advancement, loop, restart on explicit same-character replacement, stop behavior, parent seek, and one-frame sprite-258 visibility are unverified. Do not claim parity from this IR.',
    },
    children,
  };
}

/** Stateless structural lookup; a returned local frame is explicitly a candidate clock. */
export function childAtParentFrame(ir, spriteId, parentFrame) {
  assert(Number.isInteger(parentFrame) && parentFrame >= 1 && parentFrame <= ir.parentFrameCount, 'parent frame outside source domain');
  const child = ir.children.find((item) => item.spriteId === spriteId);
  assert(child, `unknown child sprite ${spriteId}`);
  const interval = child.parentPlacements.find((item) => item.entryFrame <= parentFrame && parentFrame < item.endFrameExclusive);
  if (!interval) return null;
  const elapsedParentFrames = parentFrame - interval.entryFrame;
  let matrix = interval.entry.effectiveMatrixAtEntry;
  let ratio = interval.entry.effectiveRatioAtEntry;
  for (const update of interval.updates) {
    if (update.frame > parentFrame) break;
    if (update.matrix !== null) matrix = update.matrix;
    if (update.ratio !== null) ratio = update.ratio;
  }
  return {
    spriteId,
    depth: interval.depth,
    entryFrame: interval.entryFrame,
    endFrameExclusive: interval.endFrameExclusive,
    entryKind: interval.entryKind,
    matrix,
    ratio,
    elapsedParentFrames,
    localFrameCandidate: 1 + (elapsedParentFrames % child.localFrameCount),
    candidateLoopCount: Math.floor(elapsedParentFrames / child.localFrameCount),
    clockAuthority: 'static-query-model-only',
  };
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

export function parseCliMode(args) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--write')) return 'write';
  if (args.length === 1 && args[0] === '--check') return 'check';
  throw new Error('Usage: build-g678-alg-l12-p005-nested-timeline.mjs [--write|--check]');
}

export function assertPhysicalSource(path, expectedSha256) {
  const sourceStat = lstatSync(path);
  assert(sourceStat.isFile() && !sourceStat.isSymbolicLink(), 'P005 source must be a physical regular file');
  assert.equal(realpathSync(path), path, 'P005 source path must not contain a symlink');
  assert.equal(sha256(readFileSync(path)), expectedSha256, 'physical source SWF identity drift');
}

export function writeIfAbsentOrIdentical(path, rendered) {
  if (existsSync(path)) {
    assert.equal(readFileSync(path, 'utf8'), rendered, 'existing nested IR differs; refusing to overwrite retained draft');
    return false;
  }
  writeFileSync(path, rendered, { flag: 'wx' });
  return true;
}

function main() {
  const mode = parseCliMode(process.argv.slice(2));
  assertPhysicalSource(SOURCE, SHA);
  const metadata = loadSourceMetadata(resolve(AUDIT, 'movie.xml'));
  const sourceStructureText = readFileSync(resolve(AUDIT, 'source-structure.json'), 'utf8');
  const built = buildNestedTimeline(metadata, sourceStructureText);
  const rendered = JSON.stringify(built, null, 2) + '\n';
  if (mode === 'check') {
    assert.equal(readFileSync(OUTPUT, 'utf8'), rendered, 'nested timeline IR differs from source rebuild');
    console.log(`P005 nested timeline verified: ${built.children.length} sprites, 7 placement epochs, SHA-256 ${sha256(Buffer.from(rendered))}`);
    return;
  }
  // --write is create-only. An identical draft is a no-op; a changed one needs
  // a reviewed correction rather than silently replacing retained evidence.
  if (!writeIfAbsentOrIdentical(OUTPUT, rendered)) {
    console.log(`P005 nested timeline already identical; no write: SHA-256 ${sha256(Buffer.from(rendered))}`);
    return;
  }
  console.log(`Wrote ${OUTPUT}: SHA-256 ${sha256(Buffer.from(rendered))}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
