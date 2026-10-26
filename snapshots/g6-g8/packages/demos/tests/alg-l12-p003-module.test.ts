import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  P003_CLOSE_POLICY,
  P003_GLOSSARY_BUTTONS,
  initialP003GlossaryState,
  replayP003Glossary,
  setP003Paused,
} from '../src/alg-l12-p003-glossary-state';
import animationModule, {
  P003_COMPANION_SUFFIX,
  SHARED_ALG001_L12_P003_MOVIE,
  SHARED_ALG001_L12_P003_RENDERER,
  SHARED_ALG001_L12_P003_RUNTIME,
  SHARED_ALG001_L12_P003_SOURCE,
} from '../src/modules/shared-alg001-l12-p003';
import {
  SHARED_ALG001_L12_P003_CONFIG,
  SHARED_ALG001_L12_P003_GLOSSARY_ENTRIES,
  closeP003GlossaryForHost,
  prepareP003GlossaryRequest,
  sourceFrameForP003Host,
  syncP003HostTransport,
} from '../src/timelines/shared-alg001-l12-p003';
import {buildCanvasAssetRequest} from '../src/source-static-canvas-candidate';

test('P003 binds the physical source, exact Canvas asset, and four separate frame domains', () => {
  assert.equal(animationModule.key, 'shared-alg001-l12-p003');
  assert.equal(SHARED_ALG001_L12_P003_SOURCE.source.sha256,
    '384f7e8e269768063d8e6ca410350ccbd5c321596fd6f55d68903cc1b6d2bccb');
  assert.equal(SHARED_ALG001_L12_P003_CONFIG.assetSha256,
    'f42b2edc01881c3ec3d60a8de36da436883e6befa8d066fb673592c4c7e6874c');
  assert.equal(SHARED_ALG001_L12_P003_CONFIG.assetSource,
    '/flash-assets/g678-local/shared-alg001-l12-p003/canvas-renderer.js');
  assert.equal(buildCanvasAssetRequest(SHARED_ALG001_L12_P003_CONFIG).src,
    '/flash-assets/g678-local/shared-alg001-l12-p003/canvas-renderer.js?sha256=f42b2edc01881c3ec3d60a8de36da436883e6befa8d066fb673592c4c7e6874c');
  assert.deepEqual(SHARED_ALG001_L12_P003_SOURCE.composition.rootLayers.map(layer =>
    [layer.characterId, layer.depth]), [[2, 1], [164, 2], [166, 146], [167, 148]]);
  assert.deepEqual(SHARED_ALG001_L12_P003_SOURCE.composition.nestedSprite,
    {characterId: 22, parentSprite: 164, firstFrame: 124, depth: 8});
  assert.deepEqual(SHARED_ALG001_L12_P003_MOVIE.stage, {width: 800, height: 600});
  assert.equal(SHARED_ALG001_L12_P003_MOVIE.fps, 12);
  assert.equal(SHARED_ALG001_L12_P003_MOVIE.frameCount, 1008);
  assert.equal(SHARED_ALG001_L12_P003_RUNTIME.frameCount, 10);
  assert.deepEqual(SHARED_ALG001_L12_P003_RUNTIME.frameDomains?.map(domain =>
    [domain.id, domain.frameCount, domain.rootFrame]), [
    ['sprite-164', 1008, 6], ['sprite-22', 1, 6], ['sprite-166', 1, 6],
  ]);
  assert.deepEqual(animationModule.audioCues, []);
  assert.deepEqual(animationModule.lessonHost.capabilities, ['glossary']);
  assert.equal(SHARED_ALG001_L12_P003_SOURCE.deploymentScope, 'local-only');
  assert.equal(SHARED_ALG001_L12_P003_SOURCE.currentJavaScriptRegistered, false);
});

test('main drawing is queryable; root, nested, title, and Spanish requests fail closed', () => {
  for (const frame of [1, 123, 124, 824, 825, 843, 844, 859, 860, 906, 907, 908,
    984, 985, 1001, 1002, 1008]) {
    const main = animationModule.getFrameState(frame, {
      frame, frameDomain: 'sprite-164', scenario: 'source-static-frame', lang: 'en', seed: 0,
    });
    assert.equal(main.status, 'ready', `main frame ${frame}`);
    assert.equal(main.frame, frame);
    assert.equal(main.rootFrame, 6);
    assert.equal(main.audioRendered, false);
  }
  for (const [domain, frame, scenario] of [
    ['root', 1, 'root-unavailable'],
    ['root', 6, 'root-unavailable'],
    ['root', 10, 'root-unavailable'],
    ['sprite-22', 1, 'sprite-22-unavailable'],
    ['sprite-166', 1, 'sprite-166-unavailable'],
  ] as const) {
    const state = animationModule.getFrameState(frame, {
      frame, frameDomain: domain, scenario, lang: 'en', seed: 0,
    });
    assert.equal(state.status, 'blocked', domain);
    assert.equal(state.frameDomain, domain);
  }
  const spanish = animationModule.getFrameState(825, {
    frame: 825, frameDomain: 'sprite-164', scenario: 'source-static-frame', lang: 'es', seed: 0,
  });
  assert.equal(spanish.blocker, 'spanish-visual-and-audio-unvalidated');
});

test('all six source keys map to exact host entries at their own first frames', () => {
  const auditBytes = readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p003/audit/source-glossary-v1.json', import.meta.url,
  ));
  assert.equal(auditBytes.byteLength, 10609);
  assert.equal(createHash('sha256').update(auditBytes).digest('hex'),
    'a102009648afcbf4b9f2f81d8bbec1a5b9468329212da44056a9aec5bdce6b0b');
  const audit = JSON.parse(auditBytes.toString('utf8')) as {
    entries: {characterId: number; id: string; requestedSourceKey: string}[];
  };
  assert.equal(P003_GLOSSARY_BUTTONS.length, 6);
  for (const button of P003_GLOSSARY_BUTTONS) {
    const entry = audit.entries.find(item => item.characterId === button.characterId);
    if (!entry) throw new Error(`Missing source glossary entry for ${button.characterId}`);
    assert.equal(entry.requestedSourceKey, button.term);
    assert.equal(SHARED_ALG001_L12_P003_GLOSSARY_ENTRIES.find(item =>
      item.characterId === button.characterId)?.entryId, entry.id);
    assert.equal(prepareP003GlossaryRequest(
      {...initialP003GlossaryState(), frame: button.firstFrame - 1}, button.characterId), null);
    const prepared = prepareP003GlossaryRequest(
      {...initialP003GlossaryState(), frame: button.firstFrame}, button.characterId);
    assert.deepEqual(prepared?.request, {type: 'open-glossary', entryId: entry.id});
    assert.equal(prepared?.state.transport, 'paused');
    assert.deepEqual(prepared?.state.pendingGlossary, {
      term: button.term, sourceCharacterId: button.characterId,
      requestedAtFrame: button.firstFrame, priorTransport: 'playing',
    });
    assert.equal(prepareP003GlossaryRequest(prepared!.state, button.characterId), null);
  }
  assert.equal(prepareP003GlossaryRequest(initialP003GlossaryState(), 999), null);
});

test('matching dialog close restores prior transport; denial holds and terminal terms reopen', () => {
  const playing = {...initialP003GlossaryState(), frame: 860};
  const requested = prepareP003GlossaryRequest(playing, 157)!.state;
  assert.equal(requested.transport, 'paused');
  assert.equal(requested.pendingGlossary?.term, 'Equation');
  // A denied request has no matching dialog closure, so it remains pending.
  assert.equal(requested.pendingGlossary?.requestedAtFrame, 860);
  assert.deepEqual(closeP003GlossaryForHost(requested), playing);
  const paused = setP003Paused(playing, true);
  assert.deepEqual(closeP003GlossaryForHost(
    prepareP003GlossaryRequest(paused, 157)!.state), paused);
  const terminal = {...initialP003GlossaryState(), frame: 1008, transport: 'stopped' as const};
  const closed = closeP003GlossaryForHost(prepareP003GlossaryRequest(terminal, 161)!.state);
  assert.equal(closed.transport, 'stopped');
  assert.deepEqual(prepareP003GlossaryRequest(closed, 162)?.request,
    {type: 'open-glossary', entryId: 'linear-function'});
  assert.deepEqual(replayP003Glossary(), initialP003GlossaryState());
  assert.match(P003_CLOSE_POLICY, /original-host-parity-unverified/);
});

test('ordinary host pause and seek keep the displayed and requested source frame', () => {
  const playing = initialP003GlossaryState();
  assert.equal(sourceFrameForP003Host(playing, 850), 850);
  const paused = syncP003HostTransport(playing, 850, true);
  assert.equal(paused.frame, 850);
  assert.equal(paused.transport, 'paused');
  assert.equal(sourceFrameForP003Host(paused, 850), 850);
  const sought = syncP003HostTransport(paused, 900, true);
  assert.equal(sought.frame, 900);
  assert.equal(sourceFrameForP003Host(sought, 900), 900);
  const requested = prepareP003GlossaryRequest(sought, 157)!.state;
  assert.equal(requested.pendingGlossary?.requestedAtFrame, 900);
  assert.equal(requested.pendingGlossary?.priorTransport, 'paused');
  assert.equal(sourceFrameForP003Host(requested, 901), 900);
  assert.equal(syncP003HostTransport(requested, 901, false), requested);
  const closed = closeP003GlossaryForHost(requested);
  assert.equal(closed.transport, 'paused');
  assert.equal(sourceFrameForP003Host(closed, 900), 900);
  const resumed = syncP003HostTransport(closed, 900, false);
  assert.equal(resumed.transport, 'playing');
  assert.equal(sourceFrameForP003Host(resumed, 901), 901);
  const terminal = syncP003HostTransport(resumed, 1008, false);
  assert.equal(terminal.transport, 'stopped');
  assert.equal(terminal.frame, 1008);
  const ssr = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P003_RENDERER, {
    frame: 850, frameDomain: 'sprite-164', scenario: 'source-static-frame', lang: 'en',
    paused: true, seed: 0,
  }));
  assert.match(ssr, /data-flash-frame="850"/);
});

test('companion exposes keyboard controls, exact suffix, and pending gates', () => {
  assert.equal(P003_COMPANION_SUFFIX, 'p003-glossary-controls');
  const early = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P003_RENDERER, {
    frame: 824, frameDomain: 'sprite-164', scenario: 'source-static-frame', lang: 'en', seed: 0,
  }));
  assert.doesNotMatch(early, /data-source-character-id="150"/);
  const en = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P003_RENDERER, {
    frame: 908, frameDomain: 'sprite-164', scenario: 'source-static-frame', lang: 'en', seed: 0,
  }));
  for (const button of P003_GLOSSARY_BUTTONS) {
    assert.match(en, new RegExp(`data-source-character-id="${button.characterId}"`));
  }
  assert.match(en, /data-page-interaction-companion-suffix="p003-glossary-controls"/);
  assert.match(en, /data-page-interaction-companion-surface="shared-alg001-l12-p003-glossary"/);
  assert.match(en, /data-animation-id="shared-alg001-l12-p003"/);
  assert.match(en, /data-audio-playback="disabled"/);
  assert.match(en, /data-current-js-controls-ready="false"/);
  assert.match(en, /type="button"/);
  const es = renderToStaticMarkup(React.createElement(SHARED_ALG001_L12_P003_RENDERER, {
    frame: 908, frameDomain: 'sprite-164', scenario: 'source-static-frame', lang: 'es',
    uiLanguage: 'es', seed: 0,
  }));
  assert.match(es, /data-spanish-text="english-source-fallback-translation-pending"/);
  assert.match(es, /lang="en"/);
  assert.match(es, /Spanish mathematical text and translation have not been verified/);
});
