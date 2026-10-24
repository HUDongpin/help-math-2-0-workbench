import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Gs002Activity} from '../src/modern-lessons/g4-l3-gs002-activity';
import {CourseG04L03Gs002InteractionOverlay,CourseG04L03Gs002Renderer} from '../src/modules/course-g04-l03-gs-002';
import {createCourseG04L03Gs002InteractionState,reduceCourseG04L03Gs002Interaction} from '../src/timelines/course-g04-l03-gs-002-interaction';
const initial=createCourseG04L03Gs002InteractionState(0);
const render=(state=initial)=>renderToStaticMarkup(<Gs002Activity state={state} dispatch={()=>{}}
  art={{ship:'data:image/png;base64,c2hpcA==',virus:'data:image/png;base64,dmlydXM='}} help={<p>Injected help fixture</p>}/>);

test('GS002 native activity has one sign group, one source input and complete board',()=>{
  const html=render();
  assert.equal((html.match(/type="radio"/g)??[]).length,2);
  assert.equal((html.match(/aria-label="Number of spaces"/g)??[]).length,1);
  assert.equal((html.match(/data-lesson-text-block="game-tick-/g)??[]).length,15);
  assert.match(html,/data-source-text="character-138"/);
  assert.doesNotMatch(html,/role="dialog"|<canvas|requestAnimationFrame/);
});

test('GS002 popup and expiry controls follow the actual reducer states',()=>{
  const feedback=reduceCourseG04L03Gs002Interaction(initial,{type:'submit-move'});
  assert.match(render(feedback),/You need to choose whether the number is positive or negative/);
  assert.match(render(feedback),/fieldset disabled/);
  assert.equal((render(feedback).match(/role="dialog"/g)??[]).length,1);
  const help=reduceCourseG04L03Gs002Interaction(initial,{type:'open-help'});
  assert.match(render(help),/Injected help fixture/);
  assert.doesNotMatch(render(initial),/Injected help fixture/);
  const expired=reduceCourseG04L03Gs002Interaction(initial,{type:'advance-time',elapsedMs:240000});
  assert.match(render(expired),/Time&#x27;s up/);
  assert.match(render(expired),/Final score: 0/);
});

test('GS002 native surface opts into the existing controller but public renderer is unchanged',()=>{
  const native=renderToStaticMarkup(<CourseG04L03Gs002InteractionOverlay seed={0} nativeHelp={<p>Help fixture</p>}/>);
  assert.match(native,/data-gs002-native-activity="true"/);
  assert.doesNotMatch(native,/<canvas|gs002-mobile/);
  const existing=renderToStaticMarkup(<CourseG04L03Gs002Renderer frame={427} frameDomain="sprite-321"
    scenario="source-static-frame" lang="en" seed={0}/>);
  assert.doesNotMatch(existing,/data-gs002-native-activity="true"/);
  assert.match(existing,/data-current-js-controls-enabled="true"/);
});
