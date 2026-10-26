import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {
  nmsL02P064ProductModuleV1, P064_PRODUCT_SCENARIO, P064_SOURCE,
  p064ProductFrameState,
} from '../src/nms-l02-p064-product-module-v1';
import {createP064CandidateSession} from '../src/nms-l02-p064-quiz-candidate';
import sourceContract from '../../../migrations/shared-nms002-l02-p064/audit/source-quiz-contract-v1.json';

const context = (frame = 1, overrides: Partial<RuntimeContext> = {}): RuntimeContext => ({
  frame, frameDomain: 'sprite-1258', rootFrame: 6, scenario: P064_PRODUCT_SCENARIO,
  lang: 'en', seed: 9713, replay: 0, ...overrides,
});

test('P064 product candidate pins the physical source and correct nested domain', () => {
  assert.equal(P064_SOURCE.sha256, sourceContract.source.sha256);
  assert.equal(P064_SOURCE.bytes, sourceContract.source.bytes);
  assert.equal(P064_SOURCE.mainSpriteId, sourceContract.scripts.mainSpriteId);
  assert.equal(nmsL02P064ProductModuleV1.key, sourceContract.animationId);
  assert.deepEqual(nmsL02P064ProductModuleV1.movie.stage, {width: 800, height: 600});
  assert.equal(nmsL02P064ProductModuleV1.movie.fps, 12);
  assert.equal(nmsL02P064ProductModuleV1.movie.frameCount, 90);
  assert.equal(nmsL02P064ProductModuleV1.runtime?.frameCount, 10);
  assert.deepEqual(nmsL02P064ProductModuleV1.runtime?.frameDomains,
    [{id: 'sprite-1258', frameCount: 90, fps: 12, rootFrame: 6}]);
  assert.deepEqual(nmsL02P064ProductModuleV1.lessonHost?.capabilities, ['fq-scoring']);
  assert.equal(nmsL02P064ProductModuleV1.maturity, 'legacy-prototype');
  assert.equal(nmsL02P064ProductModuleV1.transport, undefined);
});

test('only an initial source context can mount the seeded quiz; other frame requests fail closed', () => {
  assert.equal(p064ProductFrameState(1, context()).status, 'contextual-candidate');
  assert.equal(p064ProductFrameState(2, context(2)).blocker,
    'source-frame-inspection-unavailable');
  for (const drift of [
    {frameDomain: 'root'}, {rootFrame: 5}, {scenario: 'source-static-frame'},
    {lang: 'es'}, {seed: -1}, {seed: 0x1_0000_0000}, {replay: -1},
  ] as const) {
    assert.equal(p064ProductFrameState(1, context(1, drift)).status, 'blocked');
  }
  assert.equal(p064ProductFrameState(0, context(0)).status, 'blocked');
  assert.equal(p064ProductFrameState(91, context(91)).status, 'blocked');
  assert.notEqual(createP064CandidateSession(9713).quiz.currentQuestionId,
    createP064CandidateSession(9714).quiz.currentQuestionId);
});

test('rendering requires actual typed lesson host, while Spanish UI keeps source English', () => {
  const base = {...context(), uiLanguage: 'es' as const};
  const blocked = renderToStaticMarkup(React.createElement(nmsL02P064ProductModuleV1.Renderer,
    base));
  assert.match(blocked, /data-p064-product-status="blocked"/);
  assert.match(blocked, /fq-scoring-host-required/);
  const hosted = renderToStaticMarkup(React.createElement(nmsL02P064ProductModuleV1.Renderer,
    {...base, onLessonHostRequest: () => undefined}));
  assert.match(hosted, /data-p064-host-score-gate="initializing"/);
  assert.match(hosted, /Las preguntas conservan el texto original en inglés/);
  assert.match(hosted, /data-p064-question="[0-9]+"/);
  assert.doesNotMatch(hosted, /data-p064-host-score-gate="local-only"/);
});
