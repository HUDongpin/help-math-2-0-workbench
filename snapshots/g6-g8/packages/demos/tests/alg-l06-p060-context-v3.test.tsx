import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../src/contract';
import {stateSupportsRuntimeContext} from '../src/runtime';
import {p060SourceState} from '../src/alg-l06-p060-state-v1';
import {getP060InitialFrameState as priorState} from '../src/timelines/shared-alg001-l06-p060';
import {getP060InitialFrameState} from '../src/timelines/shared-alg001-l06-context-v3-p060';
import animationModule from '../src/modules/shared-alg001-l06-context-v3-p060';

const context = (frameDomain = 'sprite-973', lang: 'en' | 'es' = 'en'): RuntimeContext =>
  ({frame: 1, frameDomain, scenario: 'source-quiz', lang, seed: 7, replay: 2});

test('the retained baseline reproduces the host context rejection', () => {
  const input = context();
  assert.equal(stateSupportsRuntimeContext(priorState(1, input), {
    frameDomain: 'sprite-973', scenario: input.scenario, lang: input.lang,
  }, animationModule.runtime!), false);
});

test('the implemented quiz identity matches its real source state and preserves seed/replay selection', () => {
  for (const seed of [0, 7, 42]) for (const replay of [0, 2]) {
    const input = {...context(), seed, replay};
    const state = getP060InitialFrameState(1, input);
    const {frameDomain, scenario, language: actualLanguage, ...quiz} = state;
    assert.deepEqual(quiz, priorState(1, input));
    assert.deepEqual({frameDomain, scenario, language: actualLanguage},
      {frameDomain: 'sprite-973', scenario: 'source-quiz', language: 'en'});
    assert.equal(frameDomain, p060SourceState(quiz).frameDomain);
    assert.equal('frame' in state, false, 'host frame must not replace the quiz source frame');
    assert.equal(stateSupportsRuntimeContext(state, {
      frameDomain: 'sprite-973', scenario: input.scenario, lang: input.lang,
    }, animationModule.runtime!), true);
  }
});

test('root, incorrect scenario and source language requests cannot pass by echoing their labels', () => {
  for (const input of [context('root'), {...context(), scenario: 'invented-scenario'}, context('sprite-973', 'es')]) {
    const state = getP060InitialFrameState(1, input);
    assert.deepEqual({frameDomain: state.frameDomain, scenario: state.scenario, language: state.language},
      {frameDomain: 'sprite-973', scenario: 'source-quiz', language: 'en'});
    assert.equal(stateSupportsRuntimeContext(state, {
      frameDomain: input.frameDomain!, scenario: input.scenario, lang: input.lang,
    }, animationModule.runtime!), false);
  }
});

test('unknown domains and frames outside each source domain still fail closed', () => {
  assert.throws(() => getP060InitialFrameState(1, context('invented-domain')), /P060_FRAME_DOMAIN/);
  for (const domain of ['root', 'sprite-973']) {
    const limit = domain === 'root' ? 10 : 69;
    for (const frame of [0, -1, 1.5, limit + 1]) {
      assert.throws(() => getP060InitialFrameState(frame, context(domain)), /P060_FRAME_DOMAIN/);
    }
    assert.doesNotThrow(() => getP060InitialFrameState(limit, context(domain)));
  }
});

test('the versioned module retains the existing scoped-audio guard', () => {
  const Renderer = animationModule.Renderer!;
  const loud = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" seed={0} audioEnabled={true}/>);
  assert.match(loud, /The quiz is unavailable in this view/);
  const silent = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" seed={0} audioEnabled={false}/>);
  assert.match(silent, /Loading quiz/);
  assert.doesNotMatch(silent, /role="alert"/);
});
