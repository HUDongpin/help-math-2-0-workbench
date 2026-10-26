import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {P052PageView,p052ViewPhase} from '../src/nms-l02-p052-page-view-v1';
import {P052_CAPTURE_SCENARIOS,p052CaptureState,type P052CaptureScenario} from '../src/nms-l02-p052-capture-state-v1';
import {createP052State,reduceP052,type P052State} from '../src/nms-l02-p052-state-v1';
test('every scenario boundary in both languages renders the matching state/domain/frame',()=>{
 for(const scenario of Object.keys(P052_CAPTURE_SCENARIOS) as P052CaptureScenario[]){
  const range=P052_CAPTURE_SCENARIOS[scenario];for(const frame of new Set([range.first,range.last]))for(const language of ['en','es'] as const){
   const result=p052CaptureState({scenario,frame,language,seed:0,frameDomain:'sprite-350'});
   const html=renderToStaticMarkup(<P052PageView state={result.state} language={language} interactive={false} onEvent={()=>{throw Error('No render-time dispatch');}}/>);
   assert.ok(html.includes(`data-flash-frame="${frame}"`));assert.match(html,/data-flash-frame-domain="sprite-350"/);
   assert.ok(html.includes(`data-p052-state-phase="${result.state.phase}"`));
  }
 }
});
test('visual arrival115 cannot enable practice before controller intro-ready',()=>{
 const hold=reduceP052(createP052State(),{epoch:0,type:'frame',frame:115});
 assert.equal(p052ViewPhase(hold),'intro-hold');assert.equal(hold.phase,'intro');
 const html=renderToStaticMarkup(<P052PageView state={hold} language="en" onEvent={()=>{throw Error('Must not dispatch');}}/>);
 assert.match(html,/type="range"[^>]*disabled=""/);assert.match(html,/000<span/);
 assert.equal(reduceP052(hold,{epoch:0,type:'submit'}),hold);
 const ready=reduceP052(hold,{epoch:0,type:'intro-ready'});assert.equal(p052ViewPhase(ready),'exercise');
 const active=renderToStaticMarkup(<P052PageView state={ready} language="en" onEvent={()=>{}}/>);
 assert.doesNotMatch(active,/type="range"[^>]*disabled=""/);
});
test('both outro paths retain75 without controls or premature completion',()=>{
 for(const scenario of ['outro-correct','outro-revealed'] as const){
  const state=p052CaptureState({scenario,frame:156,language:'en',seed:0,frameDomain:'sprite-350'}).state;
  const html=renderToStaticMarkup(<P052PageView state={state} language="en" onEvent={()=>{}}/>);
  assert.match(html,/075<span/);assert.doesNotMatch(html,/type="range"/);assert.equal(state.phase,'outro');
  const answer=html.split('data-p052-grid="answer"')[1]!.split('</svg>')[0]!;
  assert.equal((answer.match(/data-p052-shaded="true"/g)||[]).length,75);
 }
});
test('contradictory phase/frame identities fail instead of relabeling child frames',()=>{
 for(const state of [{...createP052State(),frame:116},{...createP052State(),phase:'practice',frame:1},
  {...createP052State(),phase:'complete',frame:155},{...createP052State(),frame:NaN}])assert.throws(()=>p052ViewPhase(state as P052State));
});
