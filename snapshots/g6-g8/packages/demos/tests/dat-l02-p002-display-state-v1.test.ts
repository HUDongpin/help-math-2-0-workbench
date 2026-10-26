import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import IR from '../src/generated/dat001-l02-p002-display-ir-v1.json';
import {DAT_L02_P002_SOURCE, datL02P002SourceState,
  type DatL02P002FrameDomain} from '../src/dat-l02-p002-display-state-v1';

const frame = (domain: DatL02P002FrameDomain, n: number, lang: 'en' | 'es' = 'en') =>
  datL02P002SourceState(domain, n, {
    frame: n, frameDomain: domain, scenario: 'default', lang, seed: 0, replay: 0,
  });

test('source identity and all six frame domains are pinned independently', () => {
  const xml = readFileSync(new URL(
    '../../../migrations/shared-dat001-l02-p002/audit/movie.xml', import.meta.url));
  assert.equal(createHash('sha256').update(xml).digest('hex'), IR.sourceXmlSha256);
  assert.equal(DAT_L02_P002_SOURCE.sourceSwfSha256, IR.sourceSwfSha256);
  assert.deepEqual(Object.fromEntries(Object.entries(IR.domains).map(([id, domain]) =>
    [id, domain.frames])), {
    root: 10, 'sprite-113': 276, 'sprite-41': 279,
    'sprite-49': 22, 'sprite-53': 151, 'sprite-116': 1,
  });
  assert.equal(IR.nestedInstances.length, 6);
  assert.equal(IR.domains['sprite-113'].soundBlocks.length, 276);
  assert.equal(DAT_L02_P002_SOURCE.currentJsRegistered, false);
});

test('root entry and independent parent Stop never imply an original-host clock', () => {
  assert.equal(frame('root', 1).sourceActionStopsPlayhead, true);
  assert.equal(frame('root', 6).sourceActionStopsPlayhead, true);
  assert.equal(frame('root', 5).objects.some(object => object.characterId === 113), false);
  assert.equal(frame('root', 6).objects.find(object => object.depth === 1)?.characterId, 113);
  assert.equal(frame('root', 6).childProjections.length, 0);
  assert.equal(frame('sprite-113', 276).sourceActionStopsPlayhead, true);
  assert.equal(frame('sprite-113', 275).sourceActionStopsPlayhead, false);
});

test('child instance replacement, re-entry and terminal projection are exact', () => {
  const at = (n: number) => frame('sprite-113', n).childProjections
    .map(item => [item.characterId, item.depth, item.synchronousChildFrame]);
  assert.deepEqual(at(1), [[41, 108, 1], [49, 199, 1], [53, 240, 1]]);
  assert.deepEqual(at(42), [[41, 108, 42], [49, 199, 20], [53, 240, 42]]);
  assert.deepEqual(at(43), [[49, 253, 1]]);
  assert.deepEqual(at(59), [[49, 253, 17]]);
  assert.deepEqual(at(60), [[49, 253, 18], [41, 162, 1], [53, 325, 1]]);
  assert.deepEqual(at(276), [[49, 253, 14], [41, 162, 217], [53, 325, 66]]);
  assert.deepEqual(frame('sprite-113', 276).childProjections.map(item =>
    item.presentAtParentStop), [true, true, true]);
});

test('source masks, morph fields and move-only matrices survive state projection', () => {
  const first = frame('sprite-113', 1);
  const second = frame('sprite-113', 2);
  assert.equal(first.objects.find(object => object.depth === 1)?.clipDepth, 408);
  assert.equal(first.objects.find(object => object.depth === 108)?.transform.transX, '-4302');
  assert.equal(second.objects.find(object => object.depth === 108)?.transform.transX, '-4321');
  assert.equal(second.objects.find(object => object.depth === 108)?.characterId, 41);
  const terminal = frame('sprite-113', 276);
  assert.deepEqual(terminal.objects.filter(object => object.clipDepth !== null)
    .map(object => [object.depth, object.clipDepth]),
  [[1, 408], [396, 398], [399, 401], [402, 404], [405, 407]]);
  assert.deepEqual(terminal.objects.filter(object => object.morphRatio !== null)
    .map(object => [object.depth, object.morphRatio]),
  [[162, 59], [253, 42], [325, 59]]);
});

test('every source frame yields ordered display and correctly indexed audio', () => {
  let samples = 0;
  const domains = Object.entries(IR.domains) as [DatL02P002FrameDomain, {frames: number}][];
  for (const [domain, source] of domains) {
    for (let n = 1; n <= source.frames; n++) {
      const state = frame(domain, n);
      const depths = state.objects.map(object => object.depth);
      assert.deepEqual(depths, [...new Set(depths)].sort((a, b) => a - b));
      assert.equal(state.originalHostTraceEstablished, false);
      if (domain === 'sprite-113') {
        assert.equal(state.audioBlock?.frame, n);
        samples += state.audioBlock?.sampleCount ?? 0;
        assert.equal(state.sourceDeclaredSamplesThroughFrame, samples);
      } else {
        assert.equal(state.audioBlock, null);
        assert.equal(state.sourceDeclaredSamplesThroughFrame, 0);
      }
    }
  }
  assert.equal(samples, IR.domains['sprite-113'].soundBlocks.reduce(
    (total, block) => total + block.sampleCount, 0));
  assert.ok(samples > 0);
});

test('language and Replay identity do not invent alternate source visuals', () => {
  const en = frame('sprite-113', 60);
  const es = datL02P002SourceState('sprite-113', 60, {
    frame: 60, frameDomain: 'sprite-113', scenario: 'default',
    lang: 'es', seed: 1, replay: 2,
  });
  assert.deepEqual(es.objects, en.objects);
  assert.equal(es.language, 'es');
  assert.equal(es.replay, 2);
  for (const invalid of [0, 277, 1.5, NaN, Infinity]) {
    assert.throws(() => frame('sprite-113', invalid), /INVALID_FRAME_IDENTITY/);
  }
  assert.throws(() => datL02P002SourceState('sprite-41', 1, {
    frame: 1, frameDomain: 'root', scenario: 'default', lang: 'en', seed: 0, replay: 0,
  }), /INVALID_FRAME_IDENTITY/);
});
