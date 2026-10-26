import assert from 'node:assert/strict';
import test from 'node:test';
import type {RuntimeContext} from '../src/contract';
import {P005_TEXT_BINDING, P005_TITLE, P005_TITLE_INSTANCE, p005TextSnapshot} from '../src/alg-l12-p005-typography';
import {shouldSuppressLessonTextInstance} from '../src/lesson-text-snapshot';

const context = (frame: number, replay = 0): RuntimeContext => ({frame, frameDomain: 'sprite-391',
  rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0, replay});

test('the native title remains coherent throughout forward/backward main frames and Replay', () => {
  for (const frame of [...Array.from({length: 968}, (_, index) => index + 1),
    ...Array.from({length: 968}, (_, index) => 968 - index)]) {
    const state = p005TextSnapshot(context(frame));
    assert.equal(state.status, 'ready');
    assert.equal(state.identity.frame, frame);
    assert.equal(state.blocks.length, 1);
    assert.equal(state.blocks[0].text, P005_TITLE);
    assert.equal(state.blocks[0].language, 'en');
    assert.equal(state.blocks[0].role, 'title');
    assert.equal(state.blocks[0].visible, true);
    assert.deepEqual(state.suppressedInstances, [P005_TITLE_INSTANCE]);
  }
  const replay = p005TextSnapshot(context(1, 7));
  assert.equal(replay.identity.replay, 7);
  assert.equal(replay.identity.frame, 1);
  assert.equal(replay.blocks[0].text, P005_TITLE);
});

test('only the exact visible title shape instance is replaced; the offstage text survives', () => {
  assert.equal(P005_TEXT_BINDING.sourceSwfSha256,
    'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  const state = p005TextSnapshot(context(500));
  assert.equal(shouldSuppressLessonTextInstance(state, P005_TITLE_INSTANCE.path), true);
  assert.equal(shouldSuppressLessonTextInstance(state, [
    P005_TITLE_INSTANCE.path[0], {timelineId: 'sprite-395', depth: 1, generation: 1, characterId: 393},
  ]), false);
  for (const field of ['depth', 'generation', 'characterId'] as const) {
    const path = P005_TITLE_INSTANCE.path.map((segment, index) => index === 1
      ? {...segment, [field]: segment[field] + 1} : segment);
    assert.equal(shouldSuppressLessonTextInstance(state, path), false, field);
  }
});

test('unsupported teaching contexts cannot hide source text or claim a ready native state', () => {
  for (const request of [context(0), context(969), context(3.5), context(Number.NaN),
    {...context(1), rootFrame: 1}, {...context(1), frameDomain: 'sprite-395'},
    {...context(1), lang: 'es' as const}, {...context(1), scenario: 'other'}, {...context(1), seed: 1}]) {
    const state = p005TextSnapshot(request);
    assert.equal(state.status, 'blocked');
    assert.deepEqual(state.blocks, []);
    assert.deepEqual(state.suppressedInstances, []);
  }
});
