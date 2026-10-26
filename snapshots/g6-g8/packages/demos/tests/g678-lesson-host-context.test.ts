import assert from 'node:assert/strict';
import test from 'node:test';
import type {RuntimeContext} from '../src/contract';
import p001 from '../src/modules/g678-alg-l06-source-title-p001';
import {p052ModuleCapture} from '../src/timelines/g678-nms-l02-percent-practice-p052';
import {getP060InitialFrameState} from '../src/timelines/shared-alg001-l06-p060';

function host(overrides: Partial<RuntimeContext> & Pick<RuntimeContext, 'frameDomain' | 'scenario' | 'lang'>): RuntimeContext {
  const frame = overrides.frame ?? 1;
  return {
    frame,
    rootFrame: overrides.rootFrame ?? 6,
    seed: overrides.seed ?? 0,
    replay: overrides.replay ?? 0,
    traceId: overrides.traceId ?? `${overrides.scenario}-${overrides.frameDomain}-${overrides.lang}`,
    requirementId: overrides.requirementId ?? `runtime-${overrides.scenario}-${overrides.frameDomain}-${overrides.lang}`,
    entryStateSha256: overrides.entryStateSha256 ?? '',
    ...overrides,
    frame,
  };
}

test('algebra 6 page 1 accepts the lesson route language and still rejects the root domain', () => {
  for (const lang of ['en', 'es'] as const) {
    const state = p001.getFrameState(1, host({frameDomain: 'sprite-142', scenario: 'source-static-frame', lang}));
    assert.equal(state.frame, 1);
    assert.equal(state.language, lang);
  }
  assert.throws(() => p001.getFrameState(1, host({
    frameDomain: 'root', rootFrame: 1, scenario: 'source-static-frame', lang: 'es',
  })), /P001 requires the exact nested source context/u);
});

test('numbers lesson 2 page 52 accepts the lesson host in both languages and still rejects the root domain', () => {
  for (const lang of ['en', 'es'] as const) {
    const state = p052ModuleCapture(1, host({frameDomain: 'sprite-350', scenario: 'intro', lang}));
    assert.equal(state.frame, 1);
    assert.equal(state.language, lang);
    const late = p052ModuleCapture(150, host({frame: 150, frameDomain: 'sprite-350', scenario: 'intro', lang}));
    assert.equal(late.scenario, 'intro');
    assert.equal(late.frame, 114);
  }
  assert.throws(() => p052ModuleCapture(1, host({
    frameDomain: 'root', rootFrame: 1, scenario: 'intro', lang: 'en',
  })), /P052_MODULE_CAPTURE_CONTEXT/u);
  assert.throws(() => p052ModuleCapture(1, host({
    frameDomain: 'sprite-350', scenario: 'intro', lang: 'en', traceId: 'candidate-intro-en-seed-0',
    requirementId: 'req-candidate-intro-en-seed-0', entryStateSha256: '0'.repeat(64),
  })), /P052_CAPTURE_IDENTITY/u);
});

test('algebra 6 page 60 reports the host domain so the lesson stage can draw a frame', () => {
  for (const lang of ['en', 'es'] as const) {
    const state = getP060InitialFrameState(1, host({frameDomain: 'sprite-973', scenario: 'source-quiz', lang}));
    assert.equal(state.frameDomain, 'sprite-973');
    assert.equal(state.scenario, 'source-quiz');
    assert.equal(state.language, lang);
  }
  const root = getP060InitialFrameState(1, host({frameDomain: 'root', rootFrame: 1, scenario: 'source-quiz', lang: 'en'}));
  assert.equal(root.frameDomain, 'root');
  assert.throws(() => getP060InitialFrameState(11, host({
    frame: 11, frameDomain: 'root', rootFrame: 1, scenario: 'source-quiz', lang: 'en',
  })), /P060_FRAME_DOMAIN/u);
});
