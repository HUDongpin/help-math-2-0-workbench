import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import IR from '../src/generated/geo001-l07-p003-display-ir-v2.json';
import {GEO_L07_P003_SOURCE, geoL07P003MainState, geoL07P003RootState} from
  '../src/geo-l07-p003-display-state-v1';

const context = {frame: 1, frameDomain: 'sprite-140', scenario: 'default',
  lang: 'en' as const, seed: 0, replay: 0};
const at = (frame: number) => geoL07P003MainState(frame, {...context, frame});

test('source XML and generated IR retain exact root/child identities', () => {
  const xml = readFileSync(new URL('../../../migrations/shared-geo001-l07-p003/audit/movie.xml', import.meta.url));
  assert.equal(createHash('sha256').update(xml).digest('hex'), IR.swfmillXmlSha256);
  assert.equal(GEO_L07_P003_SOURCE.sourceSwfSha256, IR.sourceSwfSha256);
  assert.equal(IR.rootFrameCount, 10);
  assert.equal(IR.mainFrameCount, 1274);
  assert.equal(IR.rootEntry.frame, 6);
  assert.equal(IR.rootEntry.objectID, '140');
  assert.match(xml.toString(), /<PlaceObject2 replace="0" depth="4" objectID="140" morph="5" name="animation">\s*<transform>\s*<Transform transX="8248" transY="6066"\/>/);
  assert.equal((xml.toString().match(/<DefineText objectID="\d+"/g) ?? []).length, 41);
  assert.equal(IR.glossaryButtons.length, 7);
  assert.deepEqual(IR.glossaryButtons.map(button => button.sourceKeyAttribute), [
    'Measurement', 'Three dimensional', 'Figure', 'Cubic unit',
    'Cubic foot', 'Unit', 'volume',
  ]);
});

test('root direct seeks do not invent original-host progression or a child clock', () => {
  const root = (frame: number) => geoL07P003RootState(frame,
    {...context, frame, frameDomain: 'root'});
  for (let frame = 1; frame <= 10; frame++) {
    const state = root(frame);
    assert.equal(state.mainSprite === null, frame < 6);
    assert.equal(state.mainSpriteFrame, null);
    assert.equal(state.originalHostTraceEstablished, false);
  }
  assert.equal(root(1).sourceAction, 'external-preloader-jump-check-and-stop');
  assert.equal(root(6).sourceAction, 'begin-stop');
  assert.deepEqual(root(6).mainSprite, {
    characterId: 140, depth: 4, name: 'animation', translateX: 412.4, translateY: 303.3,
  });
  assert.throws(() => geoL07P003RootState(6, context), /INVALID_FRAME_IDENTITY/);
});

test('every source main frame is addressable with ordered display and audio state', () => {
  assert.equal(IR.displayEvents.length, 621);
  assert.equal(IR.soundBlocks.length, 1126);
  let samples = 0;
  const encounteredTextIds = new Set<number>();
  const blocks = new Map(IR.soundBlocks.map(block => [block.frame, block]));
  for (let frame = 1; frame <= 1274; frame++) {
    const state = at(frame);
    const block = blocks.get(frame);
    samples += block?.sampleCount ?? 0;
    assert.equal(state.frame, frame);
    assert.equal(state.sourceDeclaredSamplesThroughFrame, samples);
    assert.equal(state.audioBlock?.payloadSha256, block?.payloadSha256);
    for (const id of state.sourceTextIds) encounteredTextIds.add(id);
    const depths = state.objects.map(object => object.depth);
    assert.deepEqual(depths, [...new Set(depths)].sort((a, b) => a - b));
  }
  assert.equal(samples, 2061504);
  const xml = readFileSync(new URL('../../../migrations/shared-geo001-l07-p003/audit/movie.xml', import.meta.url), 'utf8');
  const sourceTextIds = [...xml.matchAll(/<DefineText objectID="(\d+)"/g)]
    .map(match => Number(match[1])).sort((a, b) => a - b);
  assert.deepEqual([...encounteredTextIds].sort((a, b) => a - b), sourceTextIds);
});

test('mask and glossary button depth residency have source frame boundaries only', () => {
  assert.equal(at(1).objects.find(object => object.depth === 1)?.characterId, 4);
  assert.equal(at(1).objects.find(object => object.depth === 1)?.clipDepth, 3);
  assert.deepEqual(at(421).depthResidentGlossaryButtonIds, []);
  assert.deepEqual(at(422).depthResidentGlossaryButtonIds, [46]);
  assert.deepEqual(at(456).depthResidentGlossaryButtonIds, [47, 46]);
  assert.deepEqual(at(460).depthResidentGlossaryButtonIds, [48, 46, 47]);
  assert.deepEqual(at(943).depthResidentGlossaryButtonIds, [120, 48, 46, 47, 120]);
  assert.deepEqual(at(1168).depthResidentGlossaryButtonIds,
    [134, 135, 136, 120, 120, 120, 48, 46, 47, 120]);
  assert.deepEqual(at(1274).depthResidentGlossaryButtonIds,
    at(1168).depthResidentGlossaryButtonIds);
  assert.equal(GEO_L07_P003_SOURCE.glossaryHostResolved, false);
  assert.equal(GEO_L07_P003_SOURCE.currentJsRegistered, false);
});

test('identity changes do not change source display and invalid frames fail closed', () => {
  const en = at(943);
  const es = geoL07P003MainState(943, {...context, frame: 943, lang: 'es', replay: 2});
  assert.deepEqual(es.objects, en.objects);
  assert.equal(es.language, 'es');
  assert.equal(es.replay, 2);
  for (const frame of [0, 1275, 1.5, NaN, Infinity]) {
    assert.throws(() => at(frame), /INVALID_FRAME_IDENTITY/);
  }
  assert.throws(() => geoL07P003MainState(1,
    {...context, frameDomain: 'root'}), /INVALID_FRAME_IDENTITY/);
  assert.throws(() => geoL07P003MainState(1,
    {...context, scenario: 'unverified-interaction'}), /INVALID_FRAME_IDENTITY/);
});
