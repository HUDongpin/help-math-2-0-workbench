import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import animation from '../src/modules/shared-alg001-l12-p012';
import {p012FrameState, P012_TYPOGRAPHY_ASSETS} from '../src/timelines/shared-alg001-l12-p012';
import {reduceP012Lesson} from '../src/alg-l12-p012-lesson';
import {resolveInteractivePlaybackPolicy} from '../src/runtime';

const context = (frame: number) => ({frame, frameDomain: 'sprite-86', rootFrame: 6,
  scenario: 'ordered-pairs-interaction', lang: 'en' as const, seed: 0});
test('canonical P012 metadata keeps root and interactive child separate and pins actual native runtime', () => {
  const bytes = readFileSync(new URL('../../../migrations/shared-alg001-l12-p012/typography-v1/renderer.js', import.meta.url));
  assert.equal(bytes.length, P012_TYPOGRAPHY_ASSETS[0].bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), P012_TYPOGRAPHY_ASSETS[0].sha256);
  assert.equal(animation.runtime?.frameCount, 10);
  assert.deepEqual(animation.runtime?.frameDomains, [{id: 'sprite-86', frameCount: 119, fps: 12, rootFrame: 6}]);
  assert.equal(animation.transport, undefined);
  assert.deepEqual(animation.audioCues, []);
});
test('every source intro frame is queryable in reverse order without fabricated action history', () => {
  const frames = Array.from({length: 119}, (_, i) => p012FrameState(i + 1, context(i + 1)));
  for (let frame = 119; frame >= 1; frame--) {
    assert.deepEqual(p012FrameState(frame, context(frame)), frames[frame - 1]);
    assert.equal(frames[frame - 1].status, 'ready');
    assert.equal(frames[frame - 1].lesson?.interaction.coordinateText, '(0,0)');
  }
  assert.equal(frames[117].lesson?.phase, 'intro');
  assert.equal(frames[118].lesson?.phase, 'interaction');
});
test('stopped frame retains the real shared movement reducer and blocks generic completion', () => {
  let state = p012FrameState(119, context(119)).lesson!;
  for (const kind of ['press', 'release'] as const)
    state = reduceP012Lesson(state, {kind: 'interaction', action: {kind, button: 'MoveBtn8'}});
  for (let tick = 0; tick < 23; tick++) state = reduceP012Lesson(state, {kind: 'tick'});
  assert.equal(state.frame, 119); assert.equal(state.interaction.coordinateText, '(3,0)');
  const held = resolveInteractivePlaybackPolicy(animation.interactiveStops!, {frameDomain: 'sprite-86', requestedFrame: 119});
  assert.equal(held.held, true); assert.equal(held.completionAllowed, false);
});
test('unsupported language, domain, source root and inconsistent frame fail closed', () => {
  for (const changed of [{lang: 'es' as const}, {frameDomain: 'root'}, {rootFrame: 7}, {frame: 118}, {seed: NaN}])
    assert.equal(p012FrameState(119, {...context(119), ...changed}).status, 'blocked');
});
