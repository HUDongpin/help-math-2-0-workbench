import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import IR from '../src/generated/geo001-l06-p002-display-ir-v1.json';
import {GEO_L06_P002_SOURCE, GEO_L06_P002_REDUCED_MOTION_FRAME,
  geoL06P002MainState, geoL06P002RootState} from '../src/geo-l06-p002-display-state-v1';

const context = {frame: 1, frameDomain: 'sprite-230', scenario: 'default',
  lang: 'en' as const, seed: 0, replay: 0};

test('root contract is bound to the source XML, including both stops and the placed child', () => {
  const xml = readFileSync(new URL('../../../migrations/shared-geo001-l06-p002/audit/movie.xml', import.meta.url));
  assert.equal(createHash('sha256').update(xml).digest('hex'), IR.swfmillXmlSha256);
  const start = xml.toString('utf8', 0, 2500);
  const end = xml.toString('utf8', xml.length - 1500);
  assert.match(start, /<StackString value="jump_check"\/>[\s\S]*?<StackString value="InternalPreloader"\/>[\s\S]*?<StackString value="gotoAndPlay"\/>[\s\S]*?<Stop\/>/);
  assert.match(start, /<ShowFrame\/>\s*<ShowFrame\/>\s*<ShowFrame\/>\s*<ShowFrame\/>\s*<ShowFrame\/>\s*<FrameLabel label="begin">[\s\S]*?<Stop\/>/);
  assert.match(end, /<PlaceObject2 replace="0" depth="4" objectID="230" morph="5" name="animation">\s*<transform>\s*<Transform transX="8248" transY="6066"\/>/);
  assert.equal(GEO_L06_P002_SOURCE.rootFrameCount, 10);
  assert.equal(GEO_L06_P002_SOURCE.rootEntryFrame, 6);
});

test('root direct seeks expose placement without inventing a child clock or host trace', () => {
  const at = (frame: number) => geoL06P002RootState(frame, {...context, frame, frameDomain: 'root'});
  for (let frame = 1; frame <= 10; frame++) {
    const state = at(frame);
    assert.equal(state.frameDomain, 'root');
    assert.equal(state.frame, frame);
    assert.equal(state.mainSpriteFrame, null);
    assert.equal(state.originalHostTraceEstablished, false);
    assert.equal(state.mainSprite === null, frame < 6);
  }
  assert.equal(at(1).sourceAction, 'external-preloader-jump-check-and-stop');
  assert.equal(at(2).sourceAction, null);
  assert.equal(at(6).sourceAction, 'begin-stop');
  assert.deepEqual(at(6).mainSprite, {
    characterId: 230, depth: 4, name: 'animation', translateX: 412.4, translateY: 303.3,
  });
  assert.deepEqual(at(10).mainSprite, at(6).mainSprite);
  for (const frame of [0, 11, 1.5, NaN, Infinity]) {
    assert.throws(() => at(frame), /INVALID_FRAME_IDENTITY/);
  }
  assert.throws(() => geoL06P002RootState(1, context), /INVALID_FRAME_IDENTITY/);
  assert.equal(at(6).mainSpriteFrame, null);
});

test('all 1,216 main-domain frames can be addressed without display-list drift', () => {
  assert.equal(IR.mainFrameCount, 1216);
  assert.equal(IR.displayEvents.length, 1763);
  assert.equal(IR.soundBlocks.length, 1200);
  assert.equal(GEO_L06_P002_SOURCE.sourceSwfSha256, IR.sourceSwfSha256);
  let samples = 0;
  for (let frame = 1; frame <= IR.mainFrameCount; frame++) {
    const state = geoL06P002MainState(frame, {...context, frame});
    const block = IR.soundBlocks.find(item => item.frame === frame);
    samples += block?.sampleCount ?? 0;
    assert.equal(state.frame, frame);
    assert.equal(state.sourceDeclaredSamplesThroughFrame, samples);
    assert.equal(state.audioBlock?.payloadSha256, block?.payloadSha256);
    assert.deepEqual(state.objects.map(object => object.depth),
      [...new Set(state.objects.map(object => object.depth))].sort((a, b) => a - b));
  }
  assert.equal(samples, 2200320);
});

test('source mask, audio gaps, and four glossary controls have exact frame boundaries', () => {
  const at = (frame: number) => geoL06P002MainState(frame, {...context, frame});
  const mask = at(1).objects.find(object => object.depth === 1);
  assert.equal(mask?.characterId, 4);
  assert.equal(mask?.clipDepth, 668);
  assert.equal(at(6).audioBlock, null);
  assert.equal(at(7).audioBlock?.sampleCount, 3456);
  for (const frame of [418, 422, 464, 468]) assert.equal(at(frame).audioBlock, null);
  assert.equal(at(423).audioBlock?.sampleCount, 1728);
  assert.equal(at(469).audioBlock?.sampleCount, 1728);
  assert.deepEqual(at(986).sourceGlossaryButtonIds, []);
  assert.deepEqual(at(987).sourceGlossaryButtonIds, [211, 212, 213, 214]);
  assert.equal(GEO_L06_P002_REDUCED_MOTION_FRAME, 987);
  assert.deepEqual(at(GEO_L06_P002_REDUCED_MOTION_FRAME).sourceGlossaryButtonIds,
    [211, 212, 213, 214]);
  assert.deepEqual(at(1216).sourceGlossaryButtonIds, [211, 212, 213, 214]);
  assert.equal(at(1216).sourceDeclaredSamplesThroughFrame, 2200320);
});

test('locale and Replay change identity only; unsupported domains and frames fail closed', () => {
  const en = geoL06P002MainState(987, {...context, frame: 987});
  const es = geoL06P002MainState(987, {...context, frame: 987, lang: 'es', replay: 3});
  assert.deepEqual(es.objects, en.objects);
  assert.equal(es.language, 'es');
  assert.equal(es.replay, 3);
  assert.equal(geoL06P002MainState(1, {...context, replay: 4}).sourceGlossaryButtonIds.length, 0);
  for (const frame of [0, 1217, 1.5, NaN, Infinity]) {
    assert.throws(() => geoL06P002MainState(frame, {...context, frame}), /INVALID_FRAME_IDENTITY/);
  }
  assert.throws(() => geoL06P002MainState(1, {...context, frameDomain: 'root'}), /INVALID_FRAME_IDENTITY/);
  assert.throws(() => geoL06P002MainState(1, {...context, scenario: 'unknown'}), /INVALID_FRAME_IDENTITY/);
  assert.equal(GEO_L06_P002_SOURCE.currentJsRegistered, false);
  assert.equal(GEO_L06_P002_SOURCE.audioSynchronizationAccepted, false);
});
