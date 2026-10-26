import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import animation, {SHARED_ALG001_L12_P006_RUNTIME as runtime, SHARED_ALG001_L12_P006_SOURCE as source} from '../src/modules/shared-alg001-l12-p006';
import {SHARED_ALG001_L12_P006_CONFIG as config} from '../src/timelines/shared-alg001-l12-p006';

test('P006 module pins actual v2 bytes and keeps acceptance gates closed', () => {
  const bytes = readFileSync(new URL('../../../migrations/shared-alg001-l12-p006/candidate-v2/canvas-renderer.js', import.meta.url));
  assert.equal(bytes.length, 11507597);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), config.assetSha256);
  assert.equal(animation.key, 'shared-alg001-l12-p006');
  assert.equal(source.currentJavaScriptRegistered, false);
  assert.equal(source.productCalibrationPassed, false);
  assert.equal(source.audioPlaybackEnabled, false);
  assert.equal(source.strictAcceptanceEffect, 'none');
  assert.deepEqual(animation.audioCues, []);
  assert.equal(runtime.frameCount, 10);
  assert.equal(runtime.defaultFrameDomain, 'sprite-53');
  assert.deepEqual(runtime.frameDomains?.map(domain => [domain.id, domain.frameCount, domain.rootFrame]), [['sprite-53', 342, 6], ['sprite-56', 1, 6]]);
});

function state(frame: number, lang: 'en' | 'es' = 'en') {
  return animation.getFrameState(frame, {frame, frameDomain: 'sprite-53', scenario: 'source-static-frame', lang, seed: 0,
    requirementId: 'p006-main-drawing', traceId: 'source-static-inspection', entryStateSha256: 'a'.repeat(64)});
}

test('all 342 static candidate states preserve domain identity and reverse seek determinism', () => {
  const forward = Array.from({length: 342}, (_, i) => state(i + 1));
  for (let frame = 342; frame >= 1; frame--) {
    const actual = state(frame);
    assert.deepEqual(actual, forward[frame - 1]);
    assert.equal(actual.status, 'ready');
    assert.equal(actual.frame, frame);
    assert.equal(actual.exportFrame, frame - 1);
    assert.equal(actual.frameDomain, 'sprite-53');
    assert.equal(actual.rootFrame, 6);
    assert.equal(actual.audioRendered, false);
    assert.equal(actual.naturalRuntimeEstablished, false);
    assert.equal(actual.sourceHostBehaviorResolved, false);
    assert.equal(actual.interactiveControlsEnabled, false);
  }
  assert.deepEqual(state(1), forward[0]);
});

test('unvalidated Spanish drawing and root/title captures stay blocked', () => {
  assert.equal(state(342, 'es').blocker, 'spanish-visual-and-audio-unvalidated');
  for (const [frameDomain, scenario, blocker] of [
    ['root', 'root-unavailable', 'root-baseline-unavailable'],
    ['sprite-56', 'sprite-56-unavailable', 'companion-domain-unrendered'],
  ]) {
    const result = animation.getFrameState(1, {frame: 1, frameDomain, scenario, lang: 'en', seed: 0});
    assert.equal(result.status, 'blocked');
    assert.equal(result.blocker, blocker);
  }
});
