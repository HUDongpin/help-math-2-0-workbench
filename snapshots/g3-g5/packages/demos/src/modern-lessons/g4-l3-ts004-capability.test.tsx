import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03Ts004FrameState} from '../modules/course-g04-l03-ts-004';
import {loadAnimationModuleForPresentation} from '../animation-registry';
import source from './generated/g4-l3-ts004-text.json';
import {getTs004KeyTermRequest, getTs004TextSnapshot, TS004_BINDING, TS004_PRESENTATION, Ts004NativeRenderer} from './g4-l3-ts004-capability';

const context = (frame: number): RuntimeContext => ({frame, frameDomain: 'sprite-70', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0});
const sourceState = (frame: number) => getCourseG04L03Ts004FrameState(frame, context(frame));

test('exceptional source keys retain the authored trigger and cannot escape frames 85–110', () => {
  assert.deepEqual(TS004_PRESENTATION.keyTerms?.sourceKeyBindings, [
    {sourceButtonId: 27, sourceKey: 'Data tables', frameDomain: 'sprite-70', startFrame: 85, endFrame: 110},
    {sourceButtonId: 28, sourceKey: 'strategies', frameDomain: 'sprite-70', startFrame: 85, endFrame: 110},
  ]);
  for (const frame of [85, 110]) {
    for (const [buttonId, sourceKey] of [[27, 'Data tables'], [28, 'strategies']] as const) {
      assert.deepEqual(getTs004KeyTermRequest(buttonId, frame), {
        type: 'open-keyterm-by-source-key', sourceButtonId: buttonId, sourceKey,
        frameDomain: 'sprite-70', frame, sourceAnimationId: TS004_BINDING.animationId,
        playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume',
      });
    }
  }
  for (const frame of [84, 111, 336]) for (const buttonId of [27, 28]) {
    assert.throws(() => getTs004KeyTermRequest(buttonId, frame), /not active/);
  }
  for (const frame of [84, 111]) for (const buttonId of [19, 20]) {
    assert.equal(getTs004KeyTermRequest(buttonId, frame).type, 'open-keyterm');
  }
});

test('TS004 candidate binding retains distinct source text instances and all eight strategy blocks', () => {
  assert.equal(TS004_BINDING.placementId, 'g04-l03-placement-032');
  assert.equal(TS004_BINDING.sourceSwfSha256, source.sourceSwfSha256);
  assert.equal(TS004_BINDING.blocks.length, 19);
  const block = (id: string) => TS004_BINDING.blocks.find(item => item.id === id);
  assert(block('active-step')?.sourceTextIds.includes('character-15/run-0'));
  assert(block('active-step')?.sourceTextIds.includes('character-16/run-0'));
  assert(block('active-step')?.sourceTextIds.includes('character-21/run-0'));
  assert(block('active-step')?.sourceTextIds.includes('character-22/run-0'));
  assert.deepEqual(block('step-3')?.sourceTextIds, ['character-17/run-0']);
  assert.deepEqual(['write-equation', 'draw-picture', 'look-pattern', 'guess-check',
    'right-380', 'right-900', 'right-1420', 'right-1940'].map(id => Boolean(block(id))),
  Array(8).fill(true));
  assert(block('write-equation')?.sourceTextIds.length === 25);
  assert(block('final-instruction')?.sourceTextIds.includes('character-68/run-0'));
  const bound = new Set(TS004_BINDING.blocks.flatMap(item => item.sourceTextIds));
  assert.deepEqual(Object.entries(source.texts).flatMap(([character, text]) => text.runs
    .map((_, index) => `character-${character}/run-${index}`)).filter(id => !bound.has(id)),
  ['character-12/run-0']);
});

test('TS004 source clock and audio stay on sprite-70 while fallback fails closed', () => {
  assert.equal(TS004_PRESENTATION.playbackEndFrameByDomain?.['sprite-70'], 336);
  assert.equal(TS004_PRESENTATION.reducedMotionFrameByDomain?.['sprite-70'], 336);
  assert.deepEqual(TS004_PRESENTATION.sourceTimelineAudioCues?.map(cue =>
    [cue.frameDomain, cue.frame, cue.endFrame, cue.sha256]),
  [['sprite-70', 6, 337, '391c37eb6f1d942a14c02150e9dc6b54dfc186a81caebd3e6f126b9dd8313ce2']]);
  assert.equal(TS004_PRESENTATION.keyTerms?.entryIds.length, 7);
  for (const override of [{lang: 'es' as const}, {frameDomain: 'root'},
    {entryStateSha256: 'capture'}, {rootFrame: 1}, {scenario: 'other'}]) {
    assert.equal(getTs004TextSnapshot(sourceState(336), {...context(336), ...override}).status, 'blocked');
  }
});

test('TS004 native snapshot follows source frames and renderer stays native only for exact English state', () => {
  const early = getTs004TextSnapshot(sourceState(104), context(104));
  assert.equal(early.status, 'ready');
  assert.equal(early.blocks.find(block => block.id === 'strategies-heading')?.visible, true);
  assert.equal(early.blocks.find(block => block.id === 'write-equation')?.visible, false);
  assert.equal(early.blocks.find(block => block.id === 'final-instruction')?.visible, false);
  const final = getTs004TextSnapshot(sourceState(336), context(336));
  assert.equal(final.status, 'ready');
  assert.equal(final.blocks.filter(block => block.visible).length, 19);
  assert.deepEqual(final.blocks.filter(block => block.id.endsWith('-number')).map(block => block.text),
    ['1.', '2.', '3.', '4.']);
  const html = renderToStaticMarkup(<Ts004NativeRenderer {...context(336)} state={sourceState(336)}/>);
  assert(html.includes('data-modern-text-page="course-g04-l03-ts-004"'));
  assert(!html.includes('<canvas'));
  const fallback = renderToStaticMarkup(<Ts004NativeRenderer {...context(336)} lang="es" state={sourceState(336)}/>);
  assert(!fallback.includes('data-modern-text-page="course-g04-l03-ts-004"'));
});

test('modern My Lesson loader selects TS004 native text without changing the default Canvas module', async () => {
  const legacy = await loadAnimationModuleForPresentation('course-g04-l03-ts-004');
  const modern = await loadAnimationModuleForPresentation('course-g04-l03-ts-004', {modernText: true});
  assert(legacy && modern);
  assert.equal(legacy.textPresentation, undefined);
  assert.equal(modern.textPresentation?.binding.version, TS004_BINDING.version);
  assert.equal(modern.playbackEndFrameByDomain?.['sprite-70'], 336);
  assert.equal(legacy.Renderer, modern.Renderer);
});
