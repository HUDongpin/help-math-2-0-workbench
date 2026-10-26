import assert from 'node:assert/strict';
import test from 'node:test';

import module, {SHARED_ALG001_L12_P002_SOURCE,
  SHARED_ALG001_L12_P002_SOURCE_CONTRACT} from
  '../src/modules/shared-alg001-l12-p002';
import {SHARED_ALG001_L12_P002_CONFIG} from
  '../src/timelines/shared-alg001-l12-p002';

const context = {frameDomain: 'sprite-454', scenario: 'source-static-frame',
  lang: 'en', seed: 0, frame: 1} as const;

test('P002 retains root and composed main domains with explicitly silent playback', () => {
  assert.equal(module.key, 'shared-alg001-l12-p002');
  assert.equal(module.maturity, 'private-current-js');
  assert.equal(module.runtime?.frameCount, 10);
  assert.equal(module.runtime?.defaultFrameDomain, 'sprite-454');
  assert.equal(module.movie.frameCount, 1951);
  assert.equal(module.playbackEndFrameByDomain?.['sprite-454'], 1951);
  assert.equal(SHARED_ALG001_L12_P002_CONFIG.assetSha256,
    '993722d3cf0c30601805005fe8b750cecf50620a9b6692f5628f342184b4a3e4');
  assert.deepEqual(SHARED_ALG001_L12_P002_SOURCE.composition,
    {rootFrame: 6, mainSprite: 454, titleSprite: 458, frameShape: 459});
  assert.equal(SHARED_ALG001_L12_P002_SOURCE.audioPlaybackEnabled, false);
  assert.equal(module.audioCues.length, 0);
  assert.equal(SHARED_ALG001_L12_P002_SOURCE_CONTRACT.audioStatus,
    'inventoried-unmapped-disabled');
});

test('P002 source-static frame state is deterministic through the terminal stop', () => {
  for (const frame of [1, 415, 435, 1115, 1121, 1951]) {
    const state = module.getFrameState(frame, {...context, frame});
    assert.equal(state.status, 'ready');
    assert.equal(state.frame, frame);
    assert.equal(state.audioRendered, false);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.deepEqual(module.getFrameState(frame, {...context, frame}), state);
  }
  assert.equal(module.getFrameState(1952, context).frame, 1951);
  assert.equal(module.getFrameState(0, context).frame, 1);
  assert.equal(module.getFrameState(1, {
    frameDomain: 'root', scenario: 'root-unavailable', lang: 'en', seed: 0, frame: 1,
  }).blocker, 'root-baseline-unavailable');
  assert.equal(module.getFrameState(1, {...context, lang: 'es'}).blocker,
    'spanish-visual-and-audio-unvalidated');
});
