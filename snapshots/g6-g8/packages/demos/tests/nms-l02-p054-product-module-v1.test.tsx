import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {P054_CARD_SOURCE, P054_CARDS} from '../src/generated/nms-l02-p054-cards-v1';
import {nmsL02P054ProductModuleV1, P054_PRODUCT_SCENARIOS, P054_SOURCE,
  p054ProductFrameState} from '../src/nms-l02-p054-product-module-v1';
import interactionContract from '../../../migrations/shared-nms002-l02-p054/audit/interaction-contract-v1.json';

const context = (frame = 1, overrides: Partial<RuntimeContext> = {}): RuntimeContext => ({
  frame, frameDomain: 'sprite-731', rootFrame: 6,
  scenario: P054_PRODUCT_SCENARIOS.level1, lang: 'en', seed: 0, replay: 0,
  ...overrides,
});

test('P054 module binds the physical source and both 12-card levels without automatic audio', () => {
  assert.equal(P054_SOURCE.sha256, interactionContract.sources.swf.sha256);
  assert.equal(P054_SOURCE.sha256, P054_CARD_SOURCE.sourceSwfSha256);
  assert.equal(P054_SOURCE.bytes, 2077270);
  assert.equal(P054_SOURCE.mainSpriteId, interactionContract.gameSpriteId);
  assert.equal(P054_CARDS.filter(card => card.level === 1).length, 12);
  assert.equal(P054_CARDS.filter(card => card.level === 2).length, 12);
  assert.equal(nmsL02P054ProductModuleV1.key, 'shared-nms002-l02-p054');
  assert.deepEqual(nmsL02P054ProductModuleV1.movie.stage, {width: 800, height: 600});
  assert.equal(nmsL02P054ProductModuleV1.movie.fps, 12);
  assert.equal(nmsL02P054ProductModuleV1.movie.frameCount, 5);
  assert.equal(nmsL02P054ProductModuleV1.runtime?.frameCount, 10);
  assert.deepEqual(nmsL02P054ProductModuleV1.runtime?.frameDomains,
    [{id: 'sprite-731', frameCount: 5, fps: 12, rootFrame: 6}]);
  assert.deepEqual(nmsL02P054ProductModuleV1.scenarios.map(item => item.id),
    [P054_PRODUCT_SCENARIOS.level1, P054_PRODUCT_SCENARIOS.level2]);
  assert.equal(nmsL02P054ProductModuleV1.defaultScenarioByFrameDomain?.['sprite-731'],
    P054_PRODUCT_SCENARIOS.level1);
  assert.deepEqual(nmsL02P054ProductModuleV1.audioCues, []);
  assert.equal(nmsL02P054ProductModuleV1.transport, undefined);
  assert.equal(nmsL02P054ProductModuleV1.lessonHost, undefined);
  assert.equal(nmsL02P054ProductModuleV1.maturity, 'legacy-prototype');
});

test('only the initial source context mounts a board; branch frames cannot masquerade as seek or completion', () => {
  assert.equal(p054ProductFrameState(1, context()).status, 'contextual-candidate');
  assert.equal(p054ProductFrameState(1, context()).level, 1);
  assert.equal(p054ProductFrameState(1, context(1,
    {scenario: P054_PRODUCT_SCENARIOS.level2})).level, 2);
  for (const frame of [2, 3, 4, 5]) {
    const state = p054ProductFrameState(frame, context(frame));
    assert.equal(state.status, 'blocked');
    assert.equal(state.blocker, 'source-frame-inspection-unavailable');
    assert.equal(state.sourceTimelineSeekAvailable, false);
    assert.equal(state.sourceTerminalResolved, false);
  }
  for (const drift of [
    {frameDomain: 'root'}, {rootFrame: 5}, {scenario: 'source-static-frame'},
    {lang: 'es'}, {seed: 1}, {seed: -1}, {replay: -1}, {frame: 2},
  ] as const) {
    assert.equal(p054ProductFrameState(1, context(1, drift)).blocker, 'invalid-context');
  }
  assert.equal(p054ProductFrameState(0, context(0)).status, 'blocked');
  assert.equal(p054ProductFrameState(6, context(6)).status, 'blocked');
});

test('renderer mounts the maintained board at entry with English math in both UI languages', () => {
  for (const [scenario, level] of [
    [P054_PRODUCT_SCENARIOS.level1, 1], [P054_PRODUCT_SCENARIOS.level2, 2],
  ] as const) {
    const markup = renderToStaticMarkup(React.createElement(nmsL02P054ProductModuleV1.Renderer,
      {...context(1, {scenario}), uiLanguage: 'es'}));
    assert.match(markup, /data-p054-product-status="contextual-candidate"/);
    assert.match(markup, new RegExp(`data-p054-level="${level}"`));
    assert.equal((markup.match(/data-source-instance=/g) ?? []).length, 12);
    assert.match(markup, /data-p054-terminal-resolved="false"/);
    assert.match(markup, /data-source-text-id="97"/);
    assert.match(markup, /Instrucciones originales \(en inglés\)/);
    assert.doesNotMatch(markup, /\sdata-p054-terminal=/);
  }
  const blocked = renderToStaticMarkup(React.createElement(nmsL02P054ProductModuleV1.Renderer,
    {...context(5), frame: 5}));
  assert.match(blocked, /data-p054-product-status="blocked"/);
  assert.match(blocked, /source-frame-inspection-unavailable/);
  assert.doesNotMatch(blocked, /data-source-instance=/);
});
