import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
const TRIAGE = 'output/p011-source-triage-20260927-v1';
const OUTPUT = 'packages/demos/src/generated/alg-l12-p012-text-data.ts';
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB07.swf';
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
const CATALOG_SHA = '5248516cb310f7422d293903dbad5a7eef098bddf52bdbe305e167c59b50bcad';
const STRUCTURE_SHA = 'bcbcf2b389f5c937ff4d021704a4105cb4436f4c11211b9cd6208b8f6dfab13a';
const ACTIONS = [
  ['raw/actionscript/as/scripts/DefineSprite_86/frame_119/DoAction.as', '5d55a14ffb57ca75a46eba918557c28254e057c1bf3c32a0e52ed37932156773'],
  ['raw/actionscript/pcode/scripts/DefineSprite_86/frame_119/DoAction.pcode', '8cc8e6a885ce40296380f323a83ee3d07c4f54ae1c28ff5efb9dcff48df1ae8a'],
  ['raw/actionscript/as/scripts/DefineSprite_74/frame_1/DoAction.as', '225ce70da8c7289a00833009b73b66f22586f234d40bfa2a68cfc9d8609551ae'],
  ['raw/actionscript/as/scripts/DefineSprite_76/frame_2/DoAction.as', '8ce47ab8e286b7de15213df8000f92d7533e6a541f10c304c4d42fe770a5b5cb'],
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const identity = () => [1, 0, 0, 1, 0, 0];
const defaultColor = () => ({multiply: [256, 256, 256, 256], add: [0, 0, 0, 0], divisor: 256});
const copy = value => structuredClone(value);
const expectInstance = (timeline, characterId, firstFrame) => {
  const matches = timeline.instances.filter(instance => instance.characterId === characterId && instance.firstFrame === firstFrame);
  assert.equal(matches.length, 1, `expected one ${characterId} placement at ${timeline.timelineId}:${firstFrame}`);
  return matches[0];
};
const eventFor = (timeline, id) => {
  const event = timeline.events.find(item => item.eventId === id);
  assert(event, `missing source placement event ${id}`);
  return event;
};

// Replay PlaceObject2 inheritance for every frame, including moves that omit
// matrix/color/visibility. Segments below remain in local authored twips.
export function p012TextSourcePoses(timeline) {
  const active = new Map();
  const frames = [];
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
        const pose = event.move ? copy(active.get(event.depth) ?? {}) : {};
        pose.matrix ??= identity();
        pose.colorTransform ??= defaultColor();
        for (const key of ['instanceId', 'depth', 'characterId', 'matrix', 'colorTransform', 'ratio', 'name', 'clipDepth', 'visible'])
          if (Object.hasOwn(event, key)) pose[key] = copy(event[key]);
        active.set(event.depth, pose);
      }
    }
    frames.push(new Map([...active].map(([depth, pose]) => [depth, copy(pose)])));
  }
  return frames;
}

const ROLES = new Map([
  [30, 'x-axis-label'], [31, 'y-axis-label'], [34, 'coordinate-value'],
  [37, 'control-up-3'], [38, 'control-up-1'], [39, 'control-right-1'], [40, 'control-left-1'],
  [41, 'control-down-1'], [42, 'control-down-3'], [43, 'control-right-3'], [44, 'control-left-3'],
  [51, 'intro-instruction'], [55, 'intro-next-continuation'], [66, 'feedback-close'],
  [73, 'feedback-instruction'], [75, 'coach-audio-marker'],
]);
const roleFor = id => ROLES.get(id) ?? (id >= 4 && id <= 26 ? 'axis-number' : 'unclassified-source-text');

function compactDefinition(definition) {
  const common = {
    sourceTextId: definition.sourceTextId, characterId: definition.characterId,
    sourceTagOffset: definition.sourceTagOffset, sourceTagSha256: definition.sourceTagSha256,
    kind: definition.kind, role: roleFor(definition.characterId), boundsTwips: definition.boundsTwips,
  };
  if (definition.kind === 'dynamic-field') return {
    ...common, flags: definition.flags, fontId: definition.fontId,
    fontHeightTwips: definition.fontHeightTwips, colorRgba: definition.colorRgba,
    layout: definition.layout, variableName: definition.variableName, initialText: definition.initialText,
    runtimeValueResolvedByStructuralParser: false,
  };
  let penX = 0, penY = 0;
  return {...common, matrix: definition.matrix, runs: definition.runs.map(run => {
    if (run.changed.xOffset) penX = run.xOffsetTwips;
    if (run.changed.yOffset) penY = run.yOffsetTwips;
    const baselineTwips = [penX, penY];
    const glyphs = run.glyphs.map(glyph => {
      const result = {index: glyph.index, unicode: glyph.unicode, advanceTwips: glyph.advanceTwips};
      penX += glyph.advanceTwips;
      return result;
    });
    return {sourceTextId: run.sourceTextId, runIndex: run.runIndex, text: run.text,
      decodeStatus: run.decodeStatus, fontId: run.fontId, fontHeightTwips: run.fontHeightTwips,
      colorRgba: run.colorRgba, changed: run.changed, xOffsetTwips: run.xOffsetTwips,
      yOffsetTwips: run.yOffsetTwips, baselineTwips, glyphs};
  })};
}

function compactInstance(timeline, instance, poses) {
  const events = instance.updates.map(id => eventFor(timeline, id));
  const segments = [];
  for (let frame = instance.firstFrame; frame < instance.lastFrameExclusive; frame++) {
    const pose = poses[frame - 1].get(instance.depth);
    assert.equal(pose?.instanceId, instance.instanceId, `${instance.instanceId} missing at ${frame}`);
    const value = {matrix: pose.matrix, colorTransform: pose.colorTransform,
      visible: pose.visible ?? true, ratio: pose.ratio ?? null, clipDepth: pose.clipDepth ?? null,
      name: pose.name?.text ?? null};
    const previous = segments.at(-1);
    if (previous && JSON.stringify(previous.pose) === JSON.stringify(value)) previous.lastFrameExclusive = frame + 1;
    else segments.push({firstFrame: frame, lastFrameExclusive: frame + 1, pose: value});
  }
  return {instanceId: instance.instanceId, timelineId: timeline.timelineId,
    characterId: instance.characterId, depth: instance.depth, generation: instance.generation,
    firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive,
    createdByEventId: instance.createdByEventId, removedByEventId: instance.removedByEventId ?? null,
    events: events.map(event => ({eventId: event.eventId, frame: event.frame,
      sourceTagOffset: event.sourceTagOffset, sourceTagSha256: event.sourceTagSha256,
      move: event.move, matrix: event.matrix ?? null, colorTransform: event.colorTransform ?? null,
      visible: event.visible ?? null, name: event.name?.text ?? null})), poseSegments: segments};
}

export function collectP012TextData(bytes, source, structure, actions) {
  assert.equal(bytes.length, 81069, 'P012 physical SWF size drift');
  assert.equal(sha(bytes), SOURCE_SHA, 'P012 physical SWF hash drift');
  assert.deepEqual(source, collectSwfTextSourceCatalog(bytes), 'text catalog differs from physical source parser');
  assert.equal(source.sourceSha256, SOURCE_SHA);
  assert.equal(source.summary.textDefinitions, 37);
  assert.equal(source.summary.staticTextDefinitions, 36);
  assert.equal(source.summary.textRuns, 38);
  assert.equal(source.summary.unresolvedRuns, 0);
  assert.equal(source.summary.unparsedTags, 0);
  assert.equal(structure.frameDomains.rootFrameCount, 10);
  assert(structure.frameDomains.domains.some(domain => domain.domainId === 'sprite-86' && domain.declaredFrameCount === 119));
  assert.match(actions[0], /mcOP\.txtOP\.text = "\(" \+ _global\.x \+ "," \+ _global\.y \+ "\)";/);
  assert.match(actions[0], /mcOP\._y = McSpider\._y - 29;/);
  assert.match(actions[1], /"mcOP"/);
  assert.match(actions[1], /"txtOP"/);
  assert.match(actions[2], /txtFeed\.text = _global\.WrongFeed;/);
  for (const label of ['S1', 'S2', 'S3', 'S4']) assert(actions[3].includes(`"${label}"`));

  const timelines = new Map(source.timelines.map(timeline => [timeline.timelineId, timeline]));
  const main = timelines.get('sprite-86');
  const root = timelines.get('root');
  const nested = timelines.get('sprite-61');
  const popup = timelines.get('sprite-74');
  const coach = timelines.get('sprite-76');
  assert(main && root && nested && popup && coach);
  const definitions = source.textDefinitions.map(compactDefinition);
  const definitionById = new Map(definitions.map(definition => [definition.characterId, definition]));
  const poses = new Map(source.timelines.map(timeline => [timeline.timelineId, p012TextSourcePoses(timeline)]));
  const instances = source.timelines.flatMap(timeline => timeline.instances
    .filter(instance => definitionById.has(instance.characterId))
    .map(instance => compactInstance(timeline, instance, poses.get(timeline.timelineId))));
  assert.equal(instances.length, 57);
  const buttonStateTextInstances = source.buttonDefinitions.flatMap(button => button.statePlacements
    .filter(placement => definitionById.has(placement.characterId))
    .map(placement => ({instanceId: placement.instanceId, buttonCharacterId: button.characterId,
      buttonSourceTagSha256: button.sourceTagSha256, characterId: placement.characterId,
      depth: placement.depth, matrix: placement.matrix, colorTransform: placement.colorTransform,
      states: placement.states})));
  assert.equal(buttonStateTextInstances.length, 1);
  assert.equal(buttonStateTextInstances[0].characterId, 66);
  const runInstances = instances.flatMap(instance => {
    const definition = definitionById.get(instance.characterId);
    return definition.kind === 'dynamic-field'
      ? [{sourceTextId: definition.sourceTextId, instanceId: instance.instanceId,
          timelineId: instance.timelineId, firstFrame: instance.firstFrame,
          lastFrameExclusive: instance.lastFrameExclusive, kind: 'dynamic-field'}]
      : definition.runs.map(run => ({sourceTextId: run.sourceTextId, instanceId: instance.instanceId,
          timelineId: instance.timelineId, firstFrame: instance.firstFrame,
          lastFrameExclusive: instance.lastFrameExclusive, kind: 'static-run'}));
  }).concat(buttonStateTextInstances.flatMap(instance => definitionById.get(instance.characterId).runs.map(run => ({
    sourceTextId: run.sourceTextId, instanceId: instance.instanceId,
    timelineId: `button-${instance.buttonCharacterId}`, firstFrame: null,
    lastFrameExclusive: null, kind: 'button-state-static-run', states: instance.states,
  }))));
  assert.equal(new Set(runInstances.map(item => `${item.instanceId}|${item.sourceTextId}`)).size, runInstances.length);

  const entry = expectInstance(root, 86, 6);
  const direct = expectInstance(main, 34, 1);
  const bubble = expectInstance(main, 61, 119);
  const nestedField = expectInstance(nested, 34, 1);
  assert.equal(direct.lastFrameExclusive, 119);
  assert.equal(eventFor(main, direct.createdByEventId).name.text, 'txtOP');
  assert.equal(eventFor(main, bubble.createdByEventId).name.text, 'mcOP');
  assert.equal(eventFor(nested, nestedField.createdByEventId).name.text, 'txtOP');
  assert.deepEqual(eventFor(root, entry.createdByEventId).matrix, [1, 0, 0, 1, 8248, 5666]);
  assert.equal(definitionById.get(34).initialText.text, '(0,0)');
  const parentPlacements = [entry, bubble, expectInstance(main, 74, 119), expectInstance(main, 76, 119),
    expectInstance(popup, 71, 1)]
    .map(instance => {
      const timeline = timelines.get(instance.timelineId);
      const event = eventFor(timeline, instance.createdByEventId);
      return {instanceId: instance.instanceId, parentTimelineId: instance.timelineId,
        childTimelineId: instance.characterId === 71 ? 'button-71' : `sprite-${instance.characterId}`,
        firstFrame: instance.firstFrame,
        lastFrameExclusive: instance.lastFrameExclusive, matrix: event.matrix,
        sourceTagSha256: event.sourceTagSha256, name: event.name?.text ?? null};
    });
  const coachLabels = coach.events.filter(event => event.tagName === 'FrameLabel').map(event => ({
    label: event.name?.text ?? event.label?.text, frame: event.frame,
    sourceTagSha256: event.sourceTagSha256,
  }));
  assert.deepEqual(coachLabels.map(item => [item.label, item.frame]), [['S1', 3], ['S2', 18], ['S3', 31], ['S4', 40]]);
  const controls = [37, 38, 39, 40, 41, 42, 43, 44].map(characterId => ({
    characterId, sourceTextId: `character-${characterId}/run-0`,
    text: definitionById.get(characterId).runs[0].text,
    instanceId: expectInstance(main, characterId, 10).instanceId,
  }));
  return {
    schemaVersion: 1, kind: 'alg-l12-p012-native-teaching-text-data', animationId: 'shared-alg001-l12-p012',
    source: {swfSha256: SOURCE_SHA, swfBytes: bytes.length, sourceTextCatalogSha256: CATALOG_SHA,
      sourceStructureSha256: STRUCTURE_SHA, actionExportSha256: Object.fromEntries(ACTIONS)},
    stage: {width: 800, height: 600, fps: 12, rootFrameCount: 10},
    frameDomains: source.timelines.map(timeline => ({timelineId: timeline.timelineId,
      declaredFrameCount: timeline.declaredFrameCount})), parentPlacements,
    fonts: source.fonts.map(font => ({characterId: font.characterId, sourceTagSha256: font.sourceTagSha256,
      name: font.name, glyphCount: font.glyphCount, codes: font.codes})),
    definitions, instances, buttonStateTextInstances, runInstances,
    teachingText: {
      intro: [...definitionById.get(51).runs.map(run => run.sourceTextId),
        ...definitionById.get(55).runs.map(run => run.sourceTextId)], controls,
      feedback: ['character-66/run-0', 'character-73/run-0'],
      coach: {markerSourceTextId: 'character-75/run-0', labels: coachLabels,
        note: 'Only Coach_audio_1 is a source text run; S1–S4 are frame labels, not additional displayed prose.'},
    },
    dynamicCoordinate: {sourceTextId: 'character-34', initialText: '(0,0)',
      introInstanceId: direct.instanceId, bubbleParentInstanceId: bubble.instanceId,
      bubbleFieldInstanceId: nestedField.instanceId, targetPath: 'mcOP.txtOP.text',
      expression: '"(" + _global.x + "," + _global.y + ")"', bubbleYFromSpiderPx: -29,
      evidence: {mainActionSha256: ACTIONS[0][1], mainPcodeSha256: ACTIONS[1][1]},
      runtimeValuesRequireInteractionState: true},
    unresolved: {vectorDefinitionCount: 30, bitmapDefinitionCount: 1,
      possibleOutlinedText: true, maskVisibility: true, animatedParentTransforms: true,
      popupTxtFeedPlacementAbsent: true, popupWrongFeedValuePageLocalAbsent: true,
      sourceSpanishAnimationTextAbsent: true},
    claimBoundary: {sourceRunAndPlacementDataOnly: true, nativeRendererVerified: false,
      originalRuntimeAccepted: false, audioAccepted: false, humanAccepted: false,
      ownerAccepted: false, strictComplete: false, published: false},
  };
}

async function readPinned(file, expectedHash, expectedBytes) {
  const before = await lstat(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink(), `${file}: ordinary file required`);
  const bytes = await readFile(file);
  const after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) assert.equal(after[key], before[key], `${file}: changed during read`);
  if (expectedBytes !== undefined) assert.equal(bytes.length, expectedBytes, `${file}: byte count drift`);
  assert.equal(sha(bytes), expectedHash, `${file}: SHA-256 drift`);
  return bytes;
}

export async function prepareP012TextData() {
  assert.equal(await realpath(SOURCE), SOURCE, 'source path must be the real AWS physical path');
  const bytes = await readPinned(SOURCE, SOURCE_SHA, 81069);
  const catalogBytes = await readPinned(path.join(ROOT, TRIAGE, 'source-text-catalog.json'), CATALOG_SHA, 479292);
  const structureBytes = await readPinned(path.join(ROOT, TRIAGE, 'source-structure.json'), STRUCTURE_SHA, 27280);
  const actions = await Promise.all(ACTIONS.map(async ([relative, digest]) =>
    (await readPinned(path.join(ROOT, TRIAGE, relative), digest)).toString()));
  const data = collectP012TextData(bytes, JSON.parse(catalogBytes), JSON.parse(structureBytes), actions);
  const result = '// Generated from the physical P012 SWF and hash-bound source triage; do not edit.\n' +
    `// SWF SHA-256: ${SOURCE_SHA}\n` +
    `export const P012_TEXT_DATA = ${JSON.stringify(data, null, 2)} as const;\n`;
  return {data, result};
}

async function main() {
  assert(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'use --write or --check');
  const {data, result} = await prepareP012TextData();
  if (process.argv[2] === '--check') assert.equal((await readFile(path.join(ROOT, OUTPUT))).toString(), result,
    'P012 generated text data drift');
  else await writeFile(path.join(ROOT, OUTPUT), result, {flag: 'wx'});
  console.log(JSON.stringify({state: process.argv[2] === '--check' ? 'P012_TEXT_DATA_VERIFIED' : 'P012_TEXT_DATA_CREATED',
    file: OUTPUT, sha256: sha(result), definitions: data.definitions.length,
    staticRuns: data.definitions.reduce((total, definition) => total + (definition.runs?.length ?? 0), 0),
    instances: data.instances.length, runInstancePairs: data.runInstances.length}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main().catch(error => {console.error(error); process.exitCode = 1;});
