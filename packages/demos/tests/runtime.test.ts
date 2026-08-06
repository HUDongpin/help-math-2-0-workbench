import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampFrame,
  createRuntimeContext,
  frameToElapsedMs,
  parseFrame,
  parseLanguage,
  parseScenario,
  parseSeed
} from '../src/runtime';

const movie = {stage: {width: 780, height: 379}, fps: 12, frameCount: 109, durationMs: 9083};
const scenarios = [{id: 'default', label: 'Default'}, {id: 'success', label: 'Success'}];

test('Flash frames are one-indexed and clamped to the movie', () => {
  assert.equal(clampFrame(0, 109), 1);
  assert.equal(clampFrame(110, 109), 109);
  assert.equal(parseFrame('17', 109), 17);
  assert.equal(parseFrame('999', 109), 109);
  assert.equal(parseFrame('1.5', 109), undefined);
  assert.equal(parseFrame('-1', 109), undefined);
});

test('runtime query values have deterministic safe defaults', () => {
  assert.equal(parseLanguage('es'), 'es');
  assert.equal(parseLanguage('fr'), 'en');
  assert.equal(parseScenario('success', scenarios), 'success');
  assert.equal(parseScenario('missing', scenarios), 'default');
  assert.equal(parseSeed('-1'), 4_294_967_295);
  assert.equal(parseSeed('noise'), 0);
});

test('frame elapsed time lands just inside the requested Flash frame', () => {
  assert.equal(frameToElapsedMs(1, movie), 0.001);
  assert.ok(frameToElapsedMs(2, movie) > 1000 / 12);
  assert.ok(frameToElapsedMs(109, movie) < movie.durationMs);
});

test('createRuntimeContext keeps capture intent separate from normal playback', () => {
  const live = createRuntimeContext({lang: 'es'}, movie, scenarios);
  assert.equal(live.frame, 1);
  assert.equal(live.captureFrame, undefined);
  assert.equal(live.lang, 'es');

  const captured = createRuntimeContext(
    {frame: ['42', '8'], scenario: 'success', seed: '7'},
    movie,
    scenarios
  );
  assert.equal(captured.captureFrame, 42);
  assert.equal(captured.scenario, 'success');
  assert.equal(captured.seed, 7);
});
