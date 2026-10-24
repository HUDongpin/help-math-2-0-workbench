import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03Ts005FrameState} from '../modules/course-g04-l03-ts-005';
import {loadAnimationModuleForPresentation} from '../animation-registry';
import source from './generated/g4-l3-ts005-text.json';
import {getTs005TextSnapshot, TS005_BINDING, TS005_PRESENTATION, Ts005NativeRenderer} from './g4-l3-ts005-capability';

const context = (frame: number): RuntimeContext => ({frame, frameDomain: 'sprite-40', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0});
const sourceState = (frame: number) => getCourseG04L03Ts005FrameState(frame, context(frame));

test('TS005 binding covers every learner-facing source text run without classifying layout art as glyphs', () => {
  assert.equal(TS005_BINDING.placementId, 'g04-l03-placement-033');
  assert.equal(TS005_BINDING.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(TS005_BINDING.blocks.length, 20);
  const bound = new Set(TS005_BINDING.blocks.flatMap(block => block.sourceTextIds));
  const unbound = Object.entries(source.texts).flatMap(([character, text]) => text.runs
    .map((_, index) => `character-${character}/run-${index}`)).filter(id => !bound.has(id));
  assert.deepEqual(unbound, ['character-12/run-0']);
  assert(TS005_BINDING.blocks.every(block => !block.sourceShapeIds?.length));
  assert.deepEqual(TS005_BINDING.blocks.filter(block => block.id.startsWith('left-'))
    .map(block => block.sourceTextIds.length), [4, 1, 2, 3]);
  assert.deepEqual(TS005_BINDING.blocks.filter(block => block.id.startsWith('right-'))
    .map(block => block.sourceTextIds.length), [1, 3, 3, 1]);
});

test('TS005 source clock, audio and six exact dictionary entries are bound independently', () => {
  assert.equal(TS005_PRESENTATION.playbackEndFrameByDomain?.['sprite-40'], 275);
  assert.equal(TS005_PRESENTATION.reducedMotionFrameByDomain?.['sprite-40'], 275);
  assert.deepEqual(TS005_PRESENTATION.sourceTimelineAudioCues?.map(cue =>
    [cue.frameDomain, cue.frame, cue.endFrame, cue.sha256]),
  [['sprite-40', 1, 276, 'b3f26fee8a0ee5be53bbbdf8a000ae7056e1f26fd44f6409a462ada99cf2aebb']]);
  assert.equal(TS005_PRESENTATION.keyTerms?.entryIds.length, 6);
  assert.deepEqual(TS005_PRESENTATION.keyTerms?.entryIds,
    [...new Set(source.glossary.map(item => item.entryId))]);
});

test('TS005 snapshots use source visibility and fail closed outside the exact English frame state', () => {
  const first = getTs005TextSnapshot(sourceState(1), context(1));
  assert.equal(first.status, 'ready');
  assert.equal(first.blocks.find(block => block.id === 'strategies-heading')?.visible, false);
  assert.equal(first.blocks.find(block => block.id === 'show-work')?.visible, false);
  const final = getTs005TextSnapshot(sourceState(275), context(275));
  assert.equal(final.status, 'ready');
  assert.equal(final.blocks.filter(block => block.visible).length, 20);
  assert.equal(final.blocks.find(block => block.id === 'show-work')?.text, 'Show your work.');
  assert.deepEqual(final.blocks.filter(block => block.id.endsWith('-number')).map(block => block.text),
    ['1.', '2.', '3.', '4.']);
  for (const override of [{lang: 'es' as const}, {frameDomain: 'root'},
    {entryStateSha256: 'capture'}, {rootFrame: 1}, {scenario: 'other'}, {frame: 1}]) {
    assert.equal(getTs005TextSnapshot(sourceState(275), {...context(275), ...override}).status,
      'blocked');
  }
  const html = renderToStaticMarkup(<Ts005NativeRenderer {...context(275)} state={sourceState(275)}/>);
  assert(html.includes('data-modern-text-page="course-g04-l03-ts-005"'));
  assert(!html.includes('<canvas'));
  const fallback = renderToStaticMarkup(<Ts005NativeRenderer {...context(275)} lang="es"
    state={sourceState(275)}/>);
  assert(!fallback.includes('data-modern-text-page="course-g04-l03-ts-005"'));
});

test('modern My Lesson loader selects TS005 native text without changing the default Canvas module', async () => {
  const baseline = await loadAnimationModuleForPresentation('course-g04-l03-ts-005');
  const modern = await loadAnimationModuleForPresentation('course-g04-l03-ts-005', {modernText: true});
  assert(baseline && modern);
  assert.equal(baseline.textPresentation, undefined);
  assert.equal(modern.textPresentation?.binding.version, TS005_BINDING.version);
  assert.equal(modern.playbackEndFrameByDomain?.['sprite-40'], 275);
  assert.equal(baseline.Renderer, modern.Renderer);
});
