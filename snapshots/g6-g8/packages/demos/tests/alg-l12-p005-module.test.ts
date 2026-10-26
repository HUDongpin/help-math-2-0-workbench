import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import animationModule, {
  SHARED_ALG001_L12_P005_MOVIE,
  SHARED_ALG001_L12_P005_RENDERER,
  SHARED_ALG001_L12_P005_RUNTIME,
  SHARED_ALG001_L12_P005_SOURCE,
} from '../src/modules/shared-alg001-l12-p005';
import {buildCanvasAssetRequest} from '../src/source-static-canvas-candidate';
import {SHARED_ALG001_L12_P005_CONFIG} from '../src/timelines/shared-alg001-l12-p005';

const SOURCE_SHA = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const ASSET_SHA = '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';
const ENTRY_SHA = 'a'.repeat(64);
const MAIN_DOMAIN = 'sprite-391';
const MAIN_SCENARIO = 'source-static-frame';
const COMPANIONS = [
  ['sprite-78', 36],
  ['sprite-147', 22],
  ['sprite-258', 63],
  ['sprite-289', 63],
  ['sprite-306', 54],
  ['sprite-346', 20],
  ['sprite-395', 1],
] as const;

function mainState(frame: number, lang: 'en' | 'es' = 'en') {
  return animationModule.getFrameState(frame, {
    frame,
    frameDomain: MAIN_DOMAIN,
    scenario: MAIN_SCENARIO,
    lang,
    seed: 0,
    requirementId: 'p005-main-drawing',
    traceId: 'source-static-inspection',
    entryStateSha256: ENTRY_SHA,
  });
}

test('P005 pins source, v1 composition, v2 mask correction, and exact asset request', () => {
  const spec = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p005/candidate-v1/adapter-spec.json', import.meta.url,
  ), 'utf8'));
  const mask = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p005/candidate-v2/mask-manifest.json', import.meta.url,
  ), 'utf8'));
  const asset = readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p005/candidate-v2/canvas-renderer.js', import.meta.url,
  ));

  assert.equal(animationModule.key, 'shared-alg001-l12-p005');
  assert.equal(spec.finalAnimationId, animationModule.key);
  assert.equal(spec.source.swfSha256, SOURCE_SHA);
  assert.equal(spec.source.swfBytes, 1950595);
  assert.equal(mask.animationId, animationModule.key);
  assert.equal(mask.sourceSha256, SOURCE_SHA);
  assert.equal(mask.predecessorRuntimeSha256,
    '3dbbe2b2448530f9c531b3de9609e6f3167e0803a7c1e7d38899fd422d51713c');
  assert.equal(mask.runtimeSha256, ASSET_SHA);
  assert.equal(asset.byteLength, mask.runtimeBytes);
  assert.equal(createHash('sha256').update(asset).digest('hex'), ASSET_SHA);
  assert.deepEqual(mask.maskAudit.uses.map((use: {characterId: string; depth: string; clipDepth: string}) =>
    [use.characterId, use.depth, use.clipDepth]), [['1', '1', '132'], ['203', '2', '56']]);
  assert.deepEqual(mask.maskAudit.definitions.map((definition: {id: string; alpha: string}) =>
    [definition.id, definition.alpha]), [['1', '90'], ['203', '118']]);
  assert.equal(mask.acceptanceEffects.currentJavaScriptRegistered, false);
  assert.equal(mask.acceptanceEffects.audioAccepted, false);

  assert.equal(SHARED_ALG001_L12_P005_SOURCE.source.path, 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf');
  assert.equal(SHARED_ALG001_L12_P005_SOURCE.source.sha256, SOURCE_SHA);
  assert.equal(SHARED_ALG001_L12_P005_SOURCE.deploymentScope, 'local-only');
  assert.equal(SHARED_ALG001_L12_P005_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_ALG001_L12_P005_SOURCE.strictAcceptanceEffect, 'none');
  assert.equal(SHARED_ALG001_L12_P005_CONFIG.sourceSwfSha256, SOURCE_SHA);
  assert.equal(SHARED_ALG001_L12_P005_CONFIG.assetSha256, ASSET_SHA);
  assert.deepEqual(spec.sourceComposition.layers.map((layer: {characterId: number; depth: number}) =>
    [layer.characterId, layer.depth]), [[391, 1], [395, 135], [396, 138]]);
  assert.deepEqual(spec.sourceComposition.nestedDomains, COMPANIONS.slice(0, 6).map(([id]) => id));
  assert.equal(SHARED_ALG001_L12_P005_CONFIG.assetSource,
    '/flash-assets/g678-local/shared-alg001-l12-p005/canvas-renderer.js');
  const request = buildCanvasAssetRequest(SHARED_ALG001_L12_P005_CONFIG);
  assert.equal(request.src,
    `/flash-assets/g678-local/shared-alg001-l12-p005/canvas-renderer.js?sha256=${ASSET_SHA}`);
  assert.equal(request.integrity, `sha256-${Buffer.from(ASSET_SHA, 'hex').toString('base64')}`);
  assert.equal(request.crossOrigin, 'anonymous');
});

test('P005 keeps the 10-frame root distinct from 968 main frames and seven companions', () => {
  assert.deepEqual(SHARED_ALG001_L12_P005_MOVIE.stage, {width: 800, height: 600});
  assert.equal(SHARED_ALG001_L12_P005_MOVIE.fps, 12);
  assert.equal(SHARED_ALG001_L12_P005_MOVIE.frameCount, 968);
  assert.equal(SHARED_ALG001_L12_P005_RUNTIME.frameCount, 10);
  assert.equal(SHARED_ALG001_L12_P005_RUNTIME.defaultFrameDomain, MAIN_DOMAIN);
  assert.deepEqual(SHARED_ALG001_L12_P005_RUNTIME.frameDomains?.map(domain =>
    [domain.id, domain.frameCount, domain.rootFrame]), [
    [MAIN_DOMAIN, 968, 6], ...COMPANIONS.map(([id, count]) => [id, count, 6]),
  ]);
  assert.equal(animationModule.playbackMode, 'once');
  assert.equal(animationModule.playbackEndFrameByDomain?.root, 1);
  assert.equal(animationModule.playbackEndFrameByDomain?.[MAIN_DOMAIN], 968);
  for (const [domain] of COMPANIONS) {
    assert.equal(animationModule.playbackEndFrameByDomain?.[domain], 1, domain);
  }
  assert.deepEqual(animationModule.transport?.frameDomains, [MAIN_DOMAIN]);
  assert.equal(animationModule.transport?.audioDisposition, 'disabled-while-inspecting');
  assert.equal(animationModule.transport?.strictAcceptanceEffect, 'none');
});

test('every main frame is a pure English static drawing, including reverse and terminal seeks', () => {
  const forward = Array.from({length: 968}, (_, index) => mainState(index + 1));
  for (const [index, state] of forward.entries()) {
    const frame = index + 1;
    assert.equal(state.status, 'ready', `main frame ${frame}`);
    assert.equal(state.blocker, null, `main frame ${frame}`);
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, index);
    assert.equal(state.frameDomain, MAIN_DOMAIN);
    assert.equal(state.rootFrame, 6);
    assert.equal(state.rootState, 'stopped-at-begin-while-child-static-frame-is-inspected');
    assert.equal(state.scenario, MAIN_SCENARIO);
    assert.equal(state.language, 'en');
    assert.equal(state.seed, 0);
    assert.equal(state.requirementId, 'p005-main-drawing');
    assert.equal(state.traceId, 'source-static-inspection');
    assert.equal(state.entryStateSha256, ENTRY_SHA);
    assert.equal(state.sourceSwfSha256, SOURCE_SHA);
    assert.equal(state.sourceStaticVisualReady, true);
    assert.equal(state.audioRendered, false);
    assert.equal(state.interactiveControlsEnabled, false);
    assert.equal(state.sourceHostBehaviorResolved, false);
    assert.equal(state.naturalRuntimeEstablished, false);
    assert.deepEqual(state.visibleSourceMarkers,
      ['sprite391-root-title-border-opaque-clipping']);
  }
  for (let frame = 968; frame >= 1; frame -= 1) {
    assert.deepEqual(mainState(frame), forward[frame - 1], `reverse frame ${frame}`);
  }
  assert.deepEqual(mainState(0), forward[0]);
  assert.deepEqual(mainState(969), forward[967]);
  assert.deepEqual(mainState(968), mainState(968), 'terminal frame is deterministic');
  assert.deepEqual(mainState(1), forward[0], 'replay starts from the same first-frame state');
});

test('root, all companion domains, Spanish, and mismatched requests fail closed', () => {
  for (const frame of [1, 6, 10]) {
    const state = animationModule.getFrameState(frame, {
      frame, frameDomain: 'root', scenario: 'root-unavailable', lang: 'en', seed: 0,
    });
    assert.equal(state.status, 'blocked');
    assert.equal(state.blocker, 'root-baseline-unavailable');
    assert.equal(state.frameDomain, 'root');
    assert.equal(state.frame, frame);
    assert.equal(state.rootFrame, frame);
    assert.equal(state.exportFrame, null);
    assert.equal(state.sourceStaticVisualReady, false);
  }
  for (const [domain, lastFrame] of COMPANIONS) {
    for (const frame of new Set([1, lastFrame])) {
      const state = animationModule.getFrameState(frame, {
        frame, frameDomain: domain, scenario: `${domain}-unavailable`, lang: 'en', seed: 0,
      });
      assert.equal(state.status, 'blocked', `${domain}:${frame}`);
      assert.equal(state.blocker, 'companion-domain-unrendered', `${domain}:${frame}`);
      assert.equal(state.frameDomain, domain);
      assert.equal(state.frame, frame);
      assert.equal(state.rootFrame, 6);
      assert.equal(state.exportFrame, null);
      assert.deepEqual(state.visibleSourceMarkers, []);
    }
  }
  for (const frame of [1, 340, 383, 384, 968]) {
    const state = mainState(frame, 'es');
    assert.equal(state.status, 'blocked', `Spanish frame ${frame}`);
    assert.equal(state.blocker, 'spanish-visual-and-audio-unvalidated');
    assert.equal(state.audioRendered, false);
  }
  const mismatched = animationModule.getFrameState(1, {
    frame: 1, frameDomain: MAIN_DOMAIN, scenario: 'root-unavailable', lang: 'en', seed: 0,
  });
  assert.equal(mismatched.blocker, 'frame-domain-scenario-mismatch');
  const unknown = animationModule.getFrameState(1, {
    frame: 1, frameDomain: 'sprite-999', scenario: MAIN_SCENARIO, lang: 'en', seed: 0,
  });
  assert.equal(unknown.blocker, 'unsupported-runtime-request');
});

test('audio and listening remain unclaimed; SSR exposes trace identity and blocked gates', () => {
  assert.equal(SHARED_ALG001_L12_P005_SOURCE.audioPlaybackEnabled, false);
  assert.match(SHARED_ALG001_L12_P005_SOURCE.audioHold, /gap340-383/);
  assert.match(SHARED_ALG001_L12_P005_SOURCE.audioHold, /validated clock/);
  assert.deepEqual(animationModule.audioCues, []);
  assert.equal(animationModule.audioTracks, undefined);

  const en = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P005_RENDERER, {
    frame: 968, frameDomain: MAIN_DOMAIN, scenario: MAIN_SCENARIO, lang: 'en', seed: 0,
    requirementId: 'p005-main-drawing', traceId: 'source-static-inspection',
    entryStateSha256: ENTRY_SHA,
  }));
  assert.match(en, /data-animation-id="shared-alg001-l12-p005"/);
  assert.match(en, /data-flash-frame="968"/);
  assert.match(en, /data-flash-frame-domain="sprite-391"/);
  assert.match(en, /data-flash-root-frame="6"/);
  assert.match(en, /data-flash-requirement-id="p005-main-drawing"/);
  assert.match(en, /data-flash-trace-id="source-static-inspection"/);
  assert.match(en, new RegExp(`data-flash-entry-state-sha256="${ENTRY_SHA}"`));
  assert.match(en, /data-capture-identity-status="verified"/);
  assert.match(en, /data-audio-rendered="false"/);
  assert.match(en, /data-authoritative-runtime-validated="false"/);
  assert.match(en, /data-human-visual-review-accepted="false"/);
  assert.match(en, /data-owner-accepted="false"/);
  assert.match(en, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(en, /data-capture-stage="true"/, 'SSR has no painted canvas');
  assert.doesNotMatch(en, /<audio\b/);

  const root = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P005_RENDERER, {
    frame: 6, frameDomain: 'root', scenario: 'root-unavailable', lang: 'en', seed: 0,
  }));
  assert.match(root, /data-fail-closed-reason="root-baseline-unavailable"/);
  assert.doesNotMatch(root, /<canvas\b/);
  const spanish = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P005_RENDERER, {
    frame: 968, frameDomain: MAIN_DOMAIN, scenario: MAIN_SCENARIO, lang: 'es', seed: 0,
  }));
  assert.match(spanish, /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/);
  assert.doesNotMatch(spanish, /<canvas\b/);
});
