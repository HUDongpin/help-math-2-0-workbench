import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  initialP004GlossaryState,
  closeP004Glossary,
  replayP004Glossary,
  resumeP004Glossary,
} from '../src/alg-l12-p004-glossary-state';
import animationModule, {
  SHARED_ALG001_L12_P004_MOVIE,
  SHARED_ALG001_L12_P004_RUNTIME,
  SHARED_ALG001_L12_P004_SOURCE,
  SHARED_ALG001_L12_P004_RENDERER,
} from '../src/modules/shared-alg001-l12-p004';
import {
  P004_MODERN_HOST_CLOSE_POLICY,
  SHARED_ALG001_L12_P004_CONFIG,
  closeP004GlossaryForHost,
  prepareP004GlossaryRequest,
  resumeP004GlossaryAfterHostPlay,
} from '../src/timelines/shared-alg001-l12-p004';

test('P004 metadata binds source, exact asset, and separate root/main/title domains', () => {
  assert.equal(animationModule.key, 'shared-alg001-l12-p004');
  assert.equal(SHARED_ALG001_L12_P004_SOURCE.source.sha256,
    '4d7aa78bd955aa52d476f31548c97135da989daf9d106986ff06a954c6d8b334');
  assert.equal(SHARED_ALG001_L12_P004_CONFIG.assetSha256,
    'd4cd5a861761c4548793b8f94468b5284d5a1c98a68bc99ff5267344df124d13');
  assert.deepEqual(SHARED_ALG001_L12_P004_SOURCE.composition,
    {rootFrame: 6, mainSprite: 90, titleSprite: 92, frameShape: 93});
  assert.deepEqual(SHARED_ALG001_L12_P004_MOVIE.stage, {width: 800, height: 600});
  assert.equal(SHARED_ALG001_L12_P004_MOVIE.fps, 12);
  assert.equal(SHARED_ALG001_L12_P004_MOVIE.frameCount, 969);
  assert.equal(SHARED_ALG001_L12_P004_RUNTIME.frameCount, 10);
  assert.deepEqual(SHARED_ALG001_L12_P004_RUNTIME.frameDomains?.map(domain =>
    [domain.id, domain.frameCount, domain.rootFrame]), [
    ['sprite-90', 969, 6], ['sprite-92', 1, 6],
  ]);
  assert.deepEqual(animationModule.audioCues, []);
  assert.deepEqual(animationModule.lessonHost?.capabilities, ['glossary']);
  assert.equal(SHARED_ALG001_L12_P004_SOURCE.currentJavaScriptRegistered, false);
});

test('pure frame state keeps root and title obligations separate from the English main drawing', () => {
  const main = animationModule.getFrameState(969, {
    frame: 969, frameDomain: 'sprite-90', scenario: 'source-static-frame', lang: 'en', seed: 0,
  });
  assert.equal(main.status, 'ready');
  assert.equal(main.frame, 969);
  assert.equal(main.rootFrame, 6);
  const root = animationModule.getFrameState(6, {
    frame: 6, frameDomain: 'root', scenario: 'root-unavailable', lang: 'en', seed: 0,
  });
  assert.equal(root.status, 'blocked');
  assert.equal(root.frameDomain, 'root');
  const title = animationModule.getFrameState(1, {
    frame: 1, frameDomain: 'sprite-92', scenario: 'sprite-92-unavailable', lang: 'en', seed: 0,
  });
  assert.equal(title.status, 'blocked');
  const spanish = animationModule.getFrameState(203, {
    frame: 203, frameDomain: 'sprite-90', scenario: 'source-static-frame', lang: 'es', seed: 0,
  });
  assert.equal(spanish.status, 'blocked');
  assert.equal(spanish.blocker, 'spanish-visual-and-audio-unvalidated');
});

test('every retained source button makes an exact typed host request and stops at its frame', () => {
  for (const [characterId, firstFrame, entryId, term] of [
    [63, 19, 'vertical-line-test', 'Vertical-line test'],
    [66, 29, 'vertical', 'Vertical'],
    [67, 29, 'graph', 'Graph'],
    [71, 203, 'point', 'Point'],
    [72, 203, 'function', 'Function'],
  ] as const) {
    const early = prepareP004GlossaryRequest(
      {...initialP004GlossaryState(), frame: firstFrame - 1}, characterId);
    assert.equal(early, null);
    const prepared = prepareP004GlossaryRequest(
      {...initialP004GlossaryState(), frame: firstFrame}, characterId);
    assert.deepEqual(prepared?.request, {type: 'open-glossary', entryId});
    assert.equal(prepared?.state.transport, 'paused');
    assert.deepEqual(prepared?.state.pendingGlossary, {
      term, sourceCharacterId: characterId, requestedAtFrame: firstFrame,
    });
    assert.equal(prepareP004GlossaryRequest(prepared!.state, characterId), null);
  }
  assert.equal(prepareP004GlossaryRequest(initialP004GlossaryState(), 999), null);
  const terminal = prepareP004GlossaryRequest(
    {...initialP004GlossaryState(), frame: 969}, 72);
  assert.equal(terminal?.state.transport, 'stopped');
  const terminalClosed = closeP004GlossaryForHost(terminal!.state, false);
  assert.equal(prepareP004GlossaryRequest(terminalClosed, 71)?.request.entryId, 'point');
  const pausedClosed = closeP004GlossaryForHost(prepareP004GlossaryRequest(
    {...initialP004GlossaryState(), frame: 203}, 71)!.state, true);
  assert.equal(prepareP004GlossaryRequest(pausedClosed, 72)?.request.entryId, 'function');
});

test('close retains the stop; explicit resume and Replay have distinct state transitions', () => {
  const requested = prepareP004GlossaryRequest(
    {...initialP004GlossaryState(), frame: 203}, 71)!.state;
  const closed = closeP004Glossary(requested);
  assert.equal(closed.pendingGlossary, null);
  assert.equal(closed.transport, 'paused');
  assert.equal(closed.frame, 203);
  assert.deepEqual(resumeP004Glossary(closed), {...closed, transport: 'playing'});
  assert.deepEqual(replayP004Glossary(), initialP004GlossaryState());
});

test('page-local close adapter restores the host pause state without claiming source parity', () => {
  const requested = prepareP004GlossaryRequest(
    {...initialP004GlossaryState(), frame: 203}, 71)!.state;
  const priorPlaying = closeP004GlossaryForHost(requested, false);
  assert.equal(priorPlaying.pendingGlossary, null);
  assert.equal(priorPlaying.transport, 'playing');
  assert.equal(priorPlaying.frame, 203);
  const priorPaused = closeP004GlossaryForHost(requested, true);
  assert.equal(priorPaused.pendingGlossary, null);
  assert.equal(priorPaused.transport, 'paused');
  const terminal = prepareP004GlossaryRequest(
    {...initialP004GlossaryState(), frame: 969}, 72)!.state;
  assert.equal(closeP004GlossaryForHost(terminal, false).transport, 'stopped');
  assert.match(P004_MODERN_HOST_CLOSE_POLICY, /original-host-parity-pending/);
});

test('host Play releases a closed prior pause, but cannot release a pending or denied request', () => {
  const pending = prepareP004GlossaryRequest(
    {...initialP004GlossaryState(), frame: 29}, 66)!.state;
  assert.equal(resumeP004GlossaryAfterHostPlay(pending, true, false), pending);
  const closed = closeP004GlossaryForHost(pending, true);
  assert.equal(resumeP004GlossaryAfterHostPlay(closed, false, false), closed);
  assert.equal(resumeP004GlossaryAfterHostPlay(closed, true, true), closed);
  const resumed = resumeP004GlossaryAfterHostPlay(closed, true, false);
  assert.equal(resumed.transport, 'playing');
  assert.equal(resumed.frame, 29);
  assert.equal(resumeP004GlossaryAfterHostPlay(resumed, true, false), resumed);
});

test('renderer exposes keyboard-native source controls and English-on-Spanish disclosure', () => {
  const en = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P004_RENDERER, {
    frame: 29, frameDomain: 'sprite-90', scenario: 'source-static-frame', lang: 'en', seed: 0,
  }));
  assert.match(en, /data-source-character-id="63"/);
  assert.match(en, /data-source-character-id="66"/);
  assert.match(en, /data-source-character-id="67"/);
  assert.doesNotMatch(en, /data-source-character-id="71"/);
  assert.match(en, /data-audio-playback="disabled"/);
  assert.match(en, /data-page-interaction-companion-surface="shared-alg001-l12-p004-glossary"/);
  assert.match(en, /data-glossary-close-policy="restore-pre-request-pause-on-dialog-close/);
  assert.match(en, /type="button"/);
  const es = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P004_RENDERER, {
    frame: 203, frameDomain: 'sprite-90', scenario: 'source-static-frame', lang: 'es',
    uiLanguage: 'es', seed: 0,
  }));
  assert.match(es, /data-spanish-text="english-source-fallback-translation-pending"/);
  assert.match(es, /lang="en"/);
  assert.match(es, /Spanish mathematical text and translation have not been verified/);
  assert.match(es, /data-current-js-controls-ready="false"/);
});
