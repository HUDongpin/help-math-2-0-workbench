import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../src/contract';
import {CourseG04L03Gs002NativeRenderer,CourseG04L03Gs002Renderer,getCourseG04L03Gs002FrameState} from '../src/modules/course-g04-l03-gs-002';

const context=(frame:number):AnimationRendererProps=>{
  const c={frame,frameDomain:'sprite-321',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0,paused:true};
  return {...c,state:getCourseG04L03Gs002FrameState(frame,c)};
};
const render=(p:AnimationRendererProps)=>renderToStaticMarkup(<CourseG04L03Gs002NativeRenderer {...p}/>);
test('GS002 native entry composes source title, intro and actual game without a Canvas',()=>{
  for(const frame of [1,91,200,426,427]){
    const html=render(context(frame));
    assert.match(html,/data-gs002-native-page="true"/);
    assert.match(html,/Negative Numbers: Play It/);
    assert.doesNotMatch(html,/<canvas/);
    if(frame<427){assert.match(html,/data-gs002-intro-host/);assert.match(html,/00:00:00/);assert.doesNotMatch(html,/data-gs002-native-activity/);
      assert.match(html,/<p[^>]*data-source-text="character-96"[^>]*>Need More Help<\/p>/);
      assert.doesNotMatch(html,/<button[^>]*>Need More Help<\/button>/);}
    else{assert.match(html,/data-gs002-native-activity/);assert.match(html,/00:04:00/);assert.doesNotMatch(html,/data-gs002-intro-host/);}
  }
});
test('GS002 native entry rejects mismatched identity/context and retains legacy default',()=>{
  const p=context(200),state=p.state as Record<string,unknown>;
  for(const field of ['animationId','sourceSwfSha256','status','frame','frameDomain','rootFrame','scenario','language','seed'])
    assert.doesNotMatch(render({...p,state:{...state,[field]:'invalid'}}),/data-gs002-native-page/);
  for(const extra of [{state:undefined},{state:{...state,blocker:'blocked'}},{entryStateSha256:'capture'},
    {frame:428},{frame:1.5},{frameDomain:'root'},{rootFrame:7},{lang:'es' as const},{scenario:'other'}])
    assert.doesNotMatch(render({...p,...extra}),/data-gs002-native-page/);
  assert.doesNotMatch(renderToStaticMarkup(<CourseG04L03Gs002Renderer {...p}/>),/data-gs002-native-page/);
});
test('GS002 native title and glossary buttons retain source language independently of UI locale',()=>{
  const html=render({...context(200),uiLanguage:'es',onLessonHostRequest:()=>{}});
  assert.match(html,/lang="en"/);
  assert.equal((html.match(/data-gs002-keyterm=/g)??[]).length,2);
  assert.match(html,/data-source-text="character-27"/);
});
