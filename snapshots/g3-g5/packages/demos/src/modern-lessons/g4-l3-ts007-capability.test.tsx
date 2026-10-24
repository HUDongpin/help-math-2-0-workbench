import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03Ts007FrameState} from '../modules/course-g04-l03-ts-007';
import {createCourseG04L03Ts007InteractionState as initial,
  reduceCourseG04L03Ts007Interaction as reduce} from '../timelines/course-g04-l03-ts-007-practice-question-interaction';
import {getTs007TextSnapshot, TS007_BINDING, TS007_NATIVE_WALKTHROUGH,
  TS007_GUESS_LOCATIONS, TS007_INTRO_OPACITY, TS007_INTRO_SOURCE_ALPHA,
  TS007_INTRO_CHOICES_OPACITY, TS007_INTRO_CHOICES_SOURCE_ALPHA} from './g4-l3-ts007-text';
import {Ts007NativeRenderer, TS007_PRESENTATION} from './g4-l3-ts007-capability';

const context: RuntimeContext = {frame: 235, frameDomain: 'sprite-441', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0};
const state = () => getCourseG04L03Ts007FrameState(235, context);
const advance = (count: number) => {
  let interaction = initial(0);
  for (let index = 0; index < count; index++) interaction = reduce(interaction, {type: 'continue-walkthrough'});
  return interaction;
};
const visible = (interaction = initial(0)) => getTs007TextSnapshot(state(), context, interaction)
  .blocks.filter(block => block.visible);

test('TS007 new binding uses exact existing runs and shape IDs without forged mathematical glyphs', () => {
  const asset = JSON.parse(gunzipSync(readFileSync('catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz')).toString());
  const sourceRuns = new Set(asset.textDefinitions.flatMap((definition: {runs: {sourceTextId: string}[]}) =>
    definition.runs.map(run => run.sourceTextId)));
  const sourceShapes = new Set(asset.shapeDefinitions.map((shape: {characterId: number}) => shape.characterId));
  assert.equal(TS007_BINDING.placementId, 'g04-l03-placement-035');
  assert.equal(TS007_BINDING.sourceSwfSha256, asset.sourceSha256);
  for (const block of TS007_BINDING.blocks) {
    assert(block.sourceTextIds.every(id => sourceRuns.has(id)), `Unknown source run in ${block.id}`);
    assert(block.sourceShapeIds?.every(id => sourceShapes.has(id)) ?? true, `Unknown source shape in ${block.id}`);
  }
  assert.deepEqual(TS007_GUESS_LOCATIONS.map(location => [location.choiceId, location.value]),
    [['A',-4],['B',-2],['C',2],['D',4]]);
  assert.deepEqual(TS007_GUESS_LOCATIONS.slice(0, 2).map(location =>
    'sourceShapeIds' in location ? location.sourceShapeIds : []), [[19],[19]]);
  assert(TS007_BINDING.blocks.find(block => block.id === 'help-example')?.sourceShapeIds?.includes(142));
  assert.equal(TS007_BINDING.blocks.find(block => block.id === 'feedback-assistive')?.sourceTextIds.length, 0);
  assert.equal(TS007_BINDING.blocks.find(block => block.id === 'terminal')?.sourceTextIds.length, 0);
});

test('TS007 Draw500 and Guess617 expose different source teaching relationships and main label scope', () => {
  assert.equal(TS007_NATIVE_WALKTHROUGH[2].sourceFrame, 500);
  assert(TS007_NATIVE_WALKTHROUGH[2].paragraphs.includes('Use strategy: Draw a picture.'));
  assert.equal(TS007_NATIVE_WALKTHROUGH[3].sourceFrame, 617);
  assert(TS007_NATIVE_WALKTHROUGH[3].paragraphs.includes('Use strategy: Guess and Check'));
  const axes = (count: number) => visible(advance(count)).filter(block => block.id.startsWith('main-tick-'));
  assert.deepEqual(axes(0).map(block => block.text), ['−5','0','5']);
  assert.deepEqual(axes(2).map(block => block.text), ['−5','−4','−3','−2','−1','0','1','2','3','4','5']);
  assert.deepEqual(axes(3).map(block => block.text), ['−5','0','5']);
  assert.deepEqual(visible(advance(3)).filter(block => /^guess-[ABCD]$/.test(block.id)).map(block => block.text),
    ['A: −4','B: −2','C: 2','D: 4']);
  assert(!visible(advance(3)).some(block => block.id === 'draw-strategy'));
  assert(!visible(advance(2)).some(block => block.id === 'question'));
});

test('TS007 snapshot follows actual Help, feedback and terminal visibility rather than default host state', () => {
  const quiz = advance(4);
  const help = reduce(quiz, {type: 'open-need-more-help'});
  assert.equal(visible(help).filter(block => block.id.startsWith('help-tick-')).length, 21);
  assert(!visible(help).some(block => block.id.startsWith('main-tick-')));
  assert(!visible(help).some(block => block.id === 'question'));
  const feedback = reduce(quiz, {type: 'choose', choiceId: 'B'});
  assert(visible(feedback).some(block => block.id === 'feedback-heading' && block.text === feedback.feedback?.sourceWindow.sourceHeading));
  assert(!visible(feedback).some(block => block.id === 'question' || block.id.startsWith('main-tick-')));
  const terminal = reduce(feedback, {type: 'feedback-complete'});
  assert.deepEqual(visible(terminal).map(block => [block.id, block.text]), [
    ['terminal','Question complete\nUse Replay to restart the complete walkthrough and quiz state.'], ['replay','Replay'],
  ]);
  assert.deepEqual(visible(reduce(terminal, {type: 'replay', seed: 0})), visible(initial(0)));
});

test('TS007 native intro follows source1..7 opacity and remains noninteractive through234', () => {
  const asset = JSON.parse(gunzipSync(readFileSync('catalog/typography-v1/source-catalog/assets/f29b6880fea6e2316d1916bec26dc58050a8dad78a4b082efc19c85720128daf.json.gz')).toString());
  const timeline = asset.timelines.find((item: {timelineId: string}) => item.timelineId === 'sprite-441');
  const alpha = timeline.events.filter((event: {instanceId: string; frame: number}) =>
    event.instanceId === 'sprite-441/depth-40/generation-1' && event.frame <= 7)
    .map((event: {colorTransform: {multiply: number[]; divisor: number}}) =>
      event.colorTransform.multiply[3] / event.colorTransform.divisor);
  assert.deepEqual(alpha, TS007_INTRO_SOURCE_ALPHA.map(value => value / 256));
  const cardsAlpha = timeline.events.filter((event: {instanceId: string; frame: number}) =>
    event.instanceId === 'sprite-441/depth-11/generation-1' && event.frame >= 8 && event.frame <= 12)
    .map((event: {colorTransform: {multiply: number[]; divisor: number}}) =>
      event.colorTransform.multiply[3] / event.colorTransform.divisor);
  assert.deepEqual(cardsAlpha, TS007_INTRO_CHOICES_SOURCE_ALPHA.map(value => value / 256));
  for (const frame of [1,2,7,8,9,12,234,235]) {
    const request = {...context, frame};
    const source = getCourseG04L03Ts007FrameState(frame, request);
    const snapshot = getTs007TextSnapshot(source, request);
    assert.equal(snapshot.status, 'ready', `Native source frame ${frame}`);
    const shown = snapshot.blocks.filter(block => block.visible);
    if (frame === 1) assert.deepEqual(shown, []);
    if (frame > 1 && frame < 235) {
      assert(shown.some(block => block.id === 'question'));
      assert.deepEqual(shown.filter(block => block.id.startsWith('main-tick-')).map(block => block.text), ['−5','0','5']);
      assert.equal(shown.filter(block => block.id.startsWith('choice-')).length, frame >= 9 ? 4 : 0);
      assert(!shown.some(block => ['continue','walkthrough-progress','need-more-help','guess-strategy'].includes(block.id)));
    }
    if (frame === 235) assert(shown.some(block => block.id === 'continue'));
    const html = renderToStaticMarkup(<Ts007NativeRenderer {...request} state={source}/>);
    assert(html.includes('data-ts007-native-binding='), `Native DOM at ${frame}`);
    assert(!html.includes('<canvas'), `No source canvas at ${frame}`);
    if (frame === 234) assert(!html.includes('data-ts007-focus-control="walkthrough-continue"'));
  }
  assert.equal(TS007_INTRO_OPACITY(1), 0);
  assert.equal(TS007_INTRO_OPACITY(2), 43 / 256);
  assert.equal(TS007_INTRO_OPACITY(7), 1);
  assert.equal(TS007_INTRO_OPACITY(234), 1);
  assert.equal(TS007_INTRO_CHOICES_OPACITY(8), 0);
  assert.equal(TS007_INTRO_CHOICES_OPACITY(9), 64 / 256);
  assert.equal(TS007_INTRO_CHOICES_OPACITY(12), 1);
  const cardDefinitions = timeline.instances.filter((instance: {characterId: number}) =>
    [35,37,39,42].includes(instance.characterId));
  assert.equal(cardDefinitions.length, 4);
  assert(cardDefinitions.every((instance: {firstFrame: number}) => instance.firstFrame === 8));
});

test('TS007 capability accepts only own ready1..235 source context and preserves legacy fallback', () => {
  assert.equal(getTs007TextSnapshot(state(), context).status, 'ready');
  const wrong = (override: Partial<RuntimeContext>, expected: string) => {
    const snapshot = getTs007TextSnapshot(state(), {...context, ...override});
    assert.equal(snapshot.status, 'blocked'); assert(snapshot.blockers.includes(expected));
  };
  wrong({frame: 236}, 'unsupported-native-frame');
  wrong({frameDomain: 'root'}, 'unsupported-frame-domain');
  wrong({rootFrame: 1}, 'unsupported-root-context');
  wrong({lang: 'es'}, 'spanish-text-not-source-verified');
  wrong({seed: 1}, 'source-seed-mismatch');
  wrong({scenario: 'other'}, 'unsupported-scenario');
  wrong({entryStateSha256: 'original-trace'}, 'capture-uses-source-canvas');
  assert(getTs007TextSnapshot({...state(), sourceSwfSha256: 'wrong'}, context).blockers.includes('source-identity-mismatch'));
  assert.equal(getTs007TextSnapshot(null, context).status, 'blocked');
  const markup = renderToStaticMarkup(<Ts007NativeRenderer {...context} state={state()}/>);
  assert(markup.includes('data-ts007-native-binding='));
  assert(!markup.includes('<canvas'));
  assert(!markup.includes('Modern reconstruction'));
  const fallback = renderToStaticMarkup(<Ts007NativeRenderer {...context} lang="es" state={state()}/>);
  assert(!fallback.includes('data-ts007-native-binding='));
  assert.deepEqual(TS007_PRESENTATION.playbackEndFrameByDomain, {'sprite-441': 235});
  assert.deepEqual(TS007_PRESENTATION.reducedMotionFrameByDomain, {'sprite-441': 235});
  assert.deepEqual(TS007_PRESENTATION.completion, {id: 'g4-l3-ts007-terminal', frameDomain: 'sprite-441', frames: [235]});
  assert.equal(TS007_PRESENTATION.frameControl, undefined);
  assert.equal(TS007_PRESENTATION.activityTimelines, undefined);
  assert.equal(TS007_PRESENTATION.keyTerms, undefined);
});
