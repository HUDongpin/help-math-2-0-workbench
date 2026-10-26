import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import animationModule from '../src/modules/shared-alg001-l06-p004';
import {ALG_L06_P004_DRAWING} from '../src/timelines/shared-alg001-l06-p004';
import {buildCanvasAssetRequest} from '../src/source-static-canvas-candidate';
import {P004_HIT_REGIONS} from '../src/alg-l06-p004-hit-regions.generated';

const root = new URL('../../../', import.meta.url);
const digest = (path: string) => createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
const mainContext = (frame: number, lang: 'en' | 'es' = 'en') =>
  ({frame, frameDomain: 'sprite-95', scenario: 'source-static-frame', lang, seed: 0});

test('P004 module binds the audited source, Canvas, separate audio and source text inventory', () => {
  const audit = JSON.parse(readFileSync(new URL('migrations/shared-alg001-l06-p004/audit/source-audit-v1.json', root), 'utf8'));
  const drawing = ALG_L06_P004_DRAWING;
  assert.equal(animationModule.key, audit.animationId);
  assert.equal(drawing.sourceSwfSha256, audit.source.sha256);
  assert.equal(drawing.rootFrameCount, audit.header.rootFrameCount);
  assert.equal(drawing.rootBeginFrame, 6);
  assert.equal(drawing.mainFrameCount, audit.frameDomains.longestStaticallyRootReachableDomain.declaredFrameCount);
  assert.equal(drawing.mainFrameDomain, audit.frameDomains.longestStaticallyRootReachableDomain.domainId);
  assert.equal(drawing.fps, audit.header.fps);
  assert.equal(digest('output/alg-l06-p004-canvas-candidate-v1/canvas-renderer.js'), drawing.assetSha256);
  assert.equal(buildCanvasAssetRequest(drawing).src,
    `${drawing.assetSource}?sha256=${drawing.assetSha256}`);
  assert.equal(animationModule.privateAlgL06P004.sourceAudio.sourceSha256,
    digest('migrations/shared-alg001-l06-p004/audit/continuous-source-v1.mp3'));
  assert.notEqual(animationModule.privateAlgL06P004.optionalSpanishAudio.sourceSha256,
    animationModule.privateAlgL06P004.sourceAudio.sourceSha256);
  assert.equal(animationModule.privateAlgL06P004.sourceTextInventory.sourceSwfSha256,
    drawing.sourceSwfSha256);
  assert.equal(P004_HIT_REGIONS.length, 9);
  assert.equal(P004_HIT_REGIONS.filter(hit => hit.buttonId === 79).length, 2);
});

test('P004 frame module exposes drawing only; maintained host controls and acceptance remain separate', () => {
  assert.equal(animationModule.maturity, 'private-current-js');
  const runtime = animationModule.runtime;
  assert(runtime);
  assert.equal(runtime.frameCount, 10);
  assert.equal(animationModule.movie.frameCount, 831);
  assert.equal(animationModule.playbackEndFrameByDomain?.['sprite-95'], 831);
  assert.deepEqual(animationModule.audioCues, []);
  assert.equal(animationModule.transport?.audioDisposition, 'disabled-while-inspecting');
  for (const frame of [1, 127, 195, 508, 614, 831]) {
    const state = animationModule.getFrameState(frame, mainContext(frame));
    assert.equal(state.status, 'ready');
    assert.equal(state.rootFrame, 6);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
  const rootState = animationModule.getFrameState(6,
    {frame: 6, frameDomain: 'root', scenario: 'root-unavailable', lang: 'en', seed: 0});
  assert.equal(rootState.status, 'blocked');
  assert.equal(rootState.blocker, 'root-baseline-unavailable');
  const companion = animationModule.getFrameState(1,
    {frame: 1, frameDomain: 'sprite-98', scenario: 'sprite-98-unavailable', lang: 'en', seed: 0});
  assert.equal(companion.status, 'blocked');
  assert.equal(companion.blocker, 'companion-domain-unrendered');
  const spanish = animationModule.getFrameState(831, mainContext(831, 'es'));
  assert.equal(spanish.status, 'blocked');
  assert.equal(spanish.blocker, 'spanish-visual-and-audio-unvalidated');
});
