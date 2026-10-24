import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03Ts006FrameState} from '../modules/course-g04-l03-ts-006';
import {loadAnimationModuleForPresentation} from '../animation-registry';
import source from './generated/g4-l3-ts006-text.json';
import {getTs006TextSnapshot, TS006_BINDING, TS006_PRESENTATION, Ts006NativeRenderer} from './g4-l3-ts006-capability';

const context = (frame: number): RuntimeContext => ({frame, frameDomain: 'sprite-23', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0});
const sourceState = (frame: number) => getCourseG04L03Ts006FrameState(frame, context(frame));

test('TS006 binding classifies every learner-facing source text and no shape as a glyph', () => {
  assert.equal(TS006_BINDING.placementId, 'g04-l03-placement-034');
  assert.equal(TS006_BINDING.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(TS006_BINDING.blocks.length, 5);
  const bound = new Set(TS006_BINDING.blocks.flatMap(block => block.sourceTextIds));
  const unbound = Object.entries(source.texts).flatMap(([character, item]) => item.runs
    .map((_, index) => `character-${character}/run-${index}`)).filter(id => !bound.has(id));
  assert.deepEqual(unbound, ['character-17/run-0']);
  assert(TS006_BINDING.blocks.every(block => !block.sourceShapeIds?.length));
});

test('TS006 source clock and stream audio stay bound to sprite-23, without glossary chrome', () => {
  assert.equal(TS006_PRESENTATION.playbackEndFrameByDomain?.['sprite-23'], 128);
  assert.equal(TS006_PRESENTATION.reducedMotionFrameByDomain?.['sprite-23'], 128);
  assert.deepEqual(TS006_PRESENTATION.sourceTimelineAudioCues?.map(cue =>
    [cue.frameDomain, cue.frame, cue.endFrame, cue.sha256]),
  [['sprite-23', 1, 129, '4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122']]);
  assert.equal(TS006_PRESENTATION.keyTerms, undefined);
});

test('TS006 native snapshot accepts only exact English source state and falls back otherwise', () => {
  const first = getTs006TextSnapshot(sourceState(1), context(1));
  assert.equal(first.status, 'ready');
  assert.equal(first.blocks.length, 5);
  assert.deepEqual(first.blocks.map(block => block.visible), [true, true, true, true, true]);
  assert.equal(first.blocks.find(block => block.id === 'step-4')?.text, '4. Check your answer.');
  const last = getTs006TextSnapshot(sourceState(128), context(128));
  assert.deepEqual(last.blocks.map(block => block.text), first.blocks.map(block => block.text));
  for (const override of [{lang: 'es' as const}, {frameDomain: 'root'},
    {entryStateSha256: 'capture'}, {rootFrame: 1}, {scenario: 'other'}, {frame: 1}]) {
    assert.equal(getTs006TextSnapshot(sourceState(128), {...context(128), ...override}).status,
      'blocked');
  }
  const html = renderToStaticMarkup(<Ts006NativeRenderer {...context(128)} state={sourceState(128)}/>);
  assert(html.includes('data-modern-text-page="course-g04-l03-ts-006"'));
  assert(!html.includes('<canvas'));
  const fallback = renderToStaticMarkup(<Ts006NativeRenderer {...context(128)} lang="es"
    state={sourceState(128)}/>);
  assert(!fallback.includes('data-modern-text-page="course-g04-l03-ts-006"'));
});

test('modern My Lesson loader selects TS006 text without changing default module', async () => {
  const baseline = await loadAnimationModuleForPresentation('course-g04-l03-ts-006');
  const modern = await loadAnimationModuleForPresentation('course-g04-l03-ts-006', {modernText: true});
  assert(baseline && modern);
  assert.equal(baseline.textPresentation, undefined);
  assert.equal(modern.textPresentation?.binding.version, TS006_BINDING.version);
  assert.equal(modern.playbackEndFrameByDomain?.['sprite-23'], 128);
  assert.equal(baseline.Renderer, modern.Renderer);
});
