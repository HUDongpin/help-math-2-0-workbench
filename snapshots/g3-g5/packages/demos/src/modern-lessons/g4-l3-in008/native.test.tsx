import React from 'react';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {createCourseG04L03In008InteractionState as create, reduceCourseG04L03In008Interaction as reduce} from '../../timelines/course-g04-l03-in-008-interaction';
import source from './source.generated.json';
import {In008NativeSurface, type In008SourceState} from './NativeSurface';
function render(frame: number, interaction = create(0)) {
 return renderToStaticMarkup(<In008NativeSurface title={source.title} source={source.states[frame - 1] as In008SourceState} interaction={interaction} dispatch={() => {}} onKeyTerm={() => {}}/>);
}
test('source demo is read only, preserves compound negative and caret/question transitions', () => {
 const start = render(1);
 assert.match(start, /−5<\/span>/);
 assert.equal((start.match(/readOnly=""/g) ?? []).length, 2);
 assert.equal((start.match(/value=""/g) ?? []).length, 2);
 assert.match(render(63), /in008-native-quiz__caret/);
 assert.doesNotMatch(render(64), /in008-native-quiz__caret/);
 assert.match(render(68), /value="\?"/);
 assert.match(render(185), /value="\?"/);
 assert.doesNotMatch(render(186), /value="\?"/);
 assert.equal((render(217).match(/readOnly=""/g) ?? []).length, 2);
 assert.match(render(217), /Check Answer/);
 assert.doesNotMatch(render(217), /beyond the stopped/);
});
test('all five actual source tuples render locked wrong, retry, correct and no replacement progression', () => {
 for (let seed = 0; seed < 5; seed++) {
  const initial = create(seed);
  let wrong = reduce(initial, {type: 'check'});
  const wrongHtml = render(216, wrong);
  assert.match(wrongHtml, /role="alertdialog"/);
  assert.match(wrongHtml, /disabled="">Check Answer/);
  assert.match(wrongHtml, /disabled="">New Problem/);
  const retry = reduce(wrong, {type: 'close-feedback'});
  assert.equal(retry.currentQuestionIndex, initial.currentQuestionIndex);
  assert.equal(retry.answerFirst, '');
  let correct = reduce(retry, {type:'set-input', field:'first', value:retry.currentQuestion.firstAnswer});
  correct = reduce(correct, {type:'set-input', field:'second', value:retry.currentQuestion.secondAnswer});
  correct = reduce(correct, {type:'check'});
  const correctHtml = render(216, correct);
  assert.equal((correctHtml.match(/readOnly=""/g) ?? []).length, 2);
  assert.doesNotMatch(correctHtml, /disabled=""/);
  assert.match(correctHtml, /Correct\. Choose New Problem/);
  assert.notEqual(reduce(correct, {type:'new-problem'}).currentQuestionIndex, correct.currentQuestionIndex);
  wrong = reduce(retry, {type:'set-input',field:'first',value:` ${retry.currentQuestion.firstAnswer}`});
  wrong = reduce(wrong, {type:'set-input',field:'second',value:retry.currentQuestion.secondAnswer});
  assert.equal(reduce(wrong,{type:'check'}).outcome, 'wrong');
 }
});

import {mapIn008Pointer, SOURCE_ANCHORS, type Triangle} from './NativePointer';
test('three source control anchors round-trip to responsive DOM anchors; degenerate layouts fail closed', () => {
 const targets: Triangle = [{x:80,y:120},{x:90,y:250},{x:220,y:250}];
 for(let index=0;index<3;index++) {
  const mapped=mapIn008Pointer(SOURCE_ANCHORS[index],targets)!;
  assert.ok(Math.abs(mapped.x-targets[index].x)<1e-9);
  assert.ok(Math.abs(mapped.y-targets[index].y)<1e-9);
 }
 assert.equal(mapIn008Pointer({x:0,y:0},[{x:1,y:0},{x:1,y:1},{x:1,y:2}]),null);
 assert.equal(mapIn008Pointer({x:NaN,y:0},targets),null);
});

test('source character22 flash targets the Pattern word and never the numeric prefix', () => {
 const flashes = new Set([26,28,30,32]);
 for (let frame=26;frame<=33;frame++) {
  assert.equal(source.states[frame-1].demonstration.patternEmphasis,flashes.has(frame));
  const html=render(frame);
  const button=html.match(/<button[^>]*class="in008-native-surface__keyterm"[^>]*>pattern<\/button>/)?.[0];
  assert.ok(button, `frame ${frame} retains the Pattern button`);
  assert.equal(button.includes('data-demo-emphasis="true"'),flashes.has(frame),`frame ${frame} Pattern flash`);
  const prefix=html.match(/<p[^>]*data-lesson-text-block="demonstration-prefix"[^>]*>/)?.[0];
  assert.ok(prefix);
  assert.doesNotMatch(prefix,/data-demo-emphasis/);
 }
});
