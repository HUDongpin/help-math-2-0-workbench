import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {TI002_SOURCE as SOURCE,TI002_ROWS,TI002_MODULE,TI002_ACTIVITIES,TI002_BINDING,createTi002Match,reduceTi002Match,ti002Snapshot,ti002Feedback,type Ti002MatchState} from './g4-l5-ti002-state';
import {G4_L5_TI002_TEXT_PRESENTATION as CAP,G4L5Ti002ModernRenderer,Ti002Figure} from './g4-l5-ti002';
const ctx=(frame:number):RuntimeContext=>({frame,frameDomain:'sprite-303',rootFrame:1,scenario:'product-candidate',lang:'en',seed:7,replay:0});
const clock=(id:string,revision=10)=>{const d=TI002_ACTIVITIES.find(a=>a.id===id)!;return{id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:d.endFrame,revision,status:'completed' as const};};
const initial=()=>reduceTi002Match(createTi002Match(7),{type:'activate'}).state;
function matchAll(seed=7){let s=reduceTi002Match(createTi002Match(seed),{type:'activate'}).state;for(const term of SOURCE.bankOrder){const r=reduceTi002Match(s,{type:'match',term,target:term,revisionFloor:term});assert.deepEqual(r.activities,['ti002-correct-coach']);s=r.state;}return s;}
test('TI002 five source terms map to exact definitions, figures and twelve authored glossary buttons',()=>{
 assert.deepEqual(TI002_ROWS.map(r=>[r.termNumber,r.term]),[[3,'array'],[1,'lattice method'],[5,'factors'],[2,'multiple'],[4,'product']]);assert.deepEqual(SOURCE.bankOrder,[1,2,3,4,5]);assert.equal(TI002_ROWS.flatMap(r=>r.terms).length,12);assert.equal(new Set(TI002_ROWS.flatMap(r=>r.terms.map(t=>t.entryId))).size,9);assert.equal(SOURCE.instruction.firstVisibleFrame,3);assert.equal(SOURCE.table.firstVisibleFrame,12);
 assert.equal(SOURCE.inactiveSource.offstageEnlarge.sourceButtonId,136);assert(SOURCE.inactiveSource.offstageEnlarge.stageBounds.left>800);assert.equal(SOURCE.inactiveSource.offstageEnlarge.targetPlaced,false);assert.deepEqual(SOURCE.popups.map(p=>p.id),['array','lattice','multiple']);
});
test('TI002 wrong drop resets the drag without losing matches and source Close cancels the wrong child',()=>{
 let s=initial();s=reduceTi002Match(s,{type:'match',term:3,target:3,revisionFloor:0}).state;const wrong=reduceTi002Match(s,{type:'match',term:1,target:5,revisionFloor:4});assert.equal(wrong.state.phase,'wrong');assert.deepEqual(wrong.state.matched,[3]);assert.deepEqual(wrong.activities,['ti002-wrong']);
 assert.equal(reduceTi002Match(wrong.state,{type:'match',term:1,target:1,revisionFloor:5}).state,wrong.state);const a=clock('ti002-wrong',5);
 for(const stale of [{...a,revision:4},{...a,frame:1},{...a,frame:18},{...a,frameDomain:'sprite-1'}])assert.equal(reduceTi002Match(wrong.state,{type:'close-wrong',activity:stale}).state,wrong.state);
 const close=reduceTi002Match(wrong.state,{type:'close-wrong',activity:a});assert.equal(close.state.phase,'matching');assert.deepEqual(close.state.matched,[3]);assert.deepEqual(close.activities,['ti002-wrong-reset']);assert.equal(TI002_ACTIVITIES.find(a=>a.id==='ti002-wrong-reset')!.audio,undefined);
});
test('TI002 repeated matches cannot inflate count; five accepted matches wait for the exact last coach revision',()=>{
 let s=initial();for(let i=1;i<=5;i++){const r=reduceTi002Match(s,{type:'match',term:i,target:i,revisionFloor:i});s=r.state;assert.equal(s.matched.length,i);assert.equal(s.phase,i===5?'awaiting-coach':'matching');assert.equal(reduceTi002Match(s,{type:'match',term:i,target:i,revisionFloor:20}).state,s);}const a=clock('ti002-correct-coach',6);
 for(const stale of[{...a,revision:5},{...a,frame:19},{...a,status:'playing' as const}])assert.equal(reduceTi002Match(s,{type:'coach-complete',activity:stale,revisionFloor:8}).state,s);
 const r=reduceTi002Match(s,{type:'coach-complete',activity:a,revisionFloor:8});assert.equal(r.state.phase,'correct-feedback');assert.match(r.activities[0]!,/^ti002-correct-[1-4]$/);assert.equal(r.frameRequest,null);
});
test('TI002 exact source feedback ends continue parent262..286 and never complete before five matches',()=>{
 let s=matchAll();s=reduceTi002Match(s,{type:'coach-complete',activity:clock('ti002-correct-coach',6),revisionFloor:8}).state;const a=clock(s.feedback!.id,9);
 for(const stale of[{...a,revision:8},{...a,frame:a.frame-1},{...a,status:'playing' as const}])assert.equal(reduceTi002Match(s,{type:'feedback-complete',activity:stale}).state,s);
 const done=reduceTi002Match(s,{type:'feedback-complete',activity:a});assert.deepEqual(done.frameRequest,{fromFrame:261,toFrame:262,stopFrame:286});assert.equal(done.state.phase,'outro');assert.equal(CAP.completion,undefined);assert.equal(CAP.frameControl!.completionFrame,286);assert.deepEqual(CAP.frameControl!.transitions,[done.frameRequest]);
});
test('TI002 source enlargements keep independent coach timing and remain closable in the outro',()=>{
 let s=matchAll();s=reduceTi002Match(s,{type:'open-picture',id:'lattice'}).state;assert.equal(s.popup,'lattice');const r=reduceTi002Match(s,{type:'coach-complete',activity:clock('ti002-correct-coach',6),revisionFloor:8});assert.equal(r.state.phase,'correct-feedback');assert.equal(r.state.popup,'lattice');const done=reduceTi002Match(r.state,{type:'feedback-complete',activity:clock(r.state.feedback!.id,9)});assert.equal(done.state.phase,'outro');assert.equal(done.state.popup,'lattice');assert.equal(reduceTi002Match(done.state,{type:'close-picture'}).state.popup,null);
 validateLessonTextActivities(TI002_ACTIVITIES,286,12);validateLessonTextFrameControl(CAP.frameControl!,286);assert.equal(TI002_ACTIVITIES.length,11);for(const popup of SOURCE.popups){const button=TI002_ACTIVITIES.find(a=>a.id===popup.closeButton.id)!;assert.equal(button.parentFrames.length,26);assert(button.parentFrames.includes(286));assert.equal(button.buttonPress!.sourceButtonId,148);assert.match(button.sourceInstanceId!,/button-148\/record-10$/);}
});
test('TI002 source demonstration follows every authored array position and returns it to the bank',()=>{
 assert.equal(SOURCE.demo.frames.length,27);assert.equal(SOURCE.demo.frames[0]!.frame,152);assert.equal(SOURCE.demo.frames.at(-1)!.frame,178);assert.equal(SOURCE.demo.frames[0]!.xProgress,0);assert.equal(SOURCE.demo.frames.at(-1)!.xProgress,0);assert(Math.max(...SOURCE.demo.frames.map(f=>f.xProgress))>.95);
 for(const f of SOURCE.demo.frames){assert(Math.abs((-6069+2082*f.xProgress)-f.sourceMatrix[4])<1e-7);assert(Math.abs((1238-2492*f.yProgress)-f.sourceMatrix[5])<1e-7);}
});
test('TI002 native mathematical figures preserve source dimensions, highlights and lattice products',()=>{
 assert.deepEqual(SOURCE.figures.lattice.cells,[[1,2],[2,4],[1,6],[3,2]]);assert.deepEqual(SOURCE.figures.lattice.result,[1,6,3,2]);assert.deepEqual(SOURCE.figures.multiples.values,[6,12,18,24,30,36]);
 const array=renderToStaticMarkup(<Ti002Figure kind="array"/>);assert.equal((array.match(/<circle/g)??[]).length,15);assert.match(array,/5 columns/);assert.match(array,/3 rows/);
 const lattice=renderToStaticMarkup(<Ti002Figure kind="lattice"/>);assert.match(lattice,/<mn>1,632<\/mn>/);assert.equal((lattice.match(/class="ti002-modern__lattice-cell"/g)??[]).length,4);
 const factors=renderToStaticMarkup(<Ti002Figure kind="factors"/>),product=renderToStaticMarkup(<Ti002Figure kind="product"/>);assert.equal((factors.match(/background-color/g)??[]).length,2);assert.equal((product.match(/background-color/g)??[]).length,1);
});
test('TI002 projection verifies its real existing product host identity and uses native instructional text',()=>{
 const context=ctx(12),state=TI002_MODULE.getFrameState(12,context),snapshot=ti002Snapshot(state,context);assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.find(b=>b.id==='definition-3')!.visible,true);assert.equal(ti002Snapshot(TI002_MODULE.getFrameState(11,ctx(11)),ctx(11)).blocks.find(b=>b.id==='definition-3')!.visible,false);
 for(const bad of[{...context,lang:'es' as const},{...context,rootFrame:6},{...context,scenario:'source-static-frame'},{...context,seed:8},{...context,replay:1}])assert.equal(ti002Snapshot(state,bad).status,'blocked');assert.equal(ti002Snapshot({...state,animationId:'other'},context).status,'blocked');
 const html=renderToStaticMarkup(<G4L5Ti002ModernRenderer {...context}/>);assert(!/<(?:canvas|img|image)\b/.test(html));assert.equal((html.match(/<circle/g)??[]).length,15);assert.equal((html.match(/<math/g)??[]).length,9);assert.equal(TI002_BINDING.blocks.length,30);
});


test('TI002 onstage dynamic initial title stays visible from the introduction through completion and Replay',()=>{
 assert.equal(SOURCE.sourceSwfSha256,'d587a89fad1f6bf989308f6999b7047c52bfe4a7c00e330f3b0b23d55dbbf0ea');
 assert.equal(SOURCE.rootTitle.text,'Multiplication: Try It!');assert.equal(SOURCE.rootTitle.sourceInitialText,'Multiplication: Try It!\r');
 assert.deepEqual(SOURCE.rootTitle.sourceTextIds,['character-54']);assert.equal(SOURCE.rootTitle.sourceCharacterId,54);
 assert.equal(SOURCE.rootTitle.sourceFontId,24);assert.equal(SOURCE.rootTitle.sourceUseOutlines,false);
 assert.equal(SOURCE.rootTitle.sourceRuntimeValueResolved,false);assert.equal(SOURCE.rootTitle.originalDeviceFontRenderingResolved,false);
 assert.deepEqual([SOURCE.rootTitle.sourcePlacement.rootFrame,SOURCE.rootTitle.sourcePlacement.rootInstanceId,SOURCE.rootTitle.sourcePlacement.frameDomain,SOURCE.rootTitle.sourcePlacement.childFrame,SOURCE.rootTitle.sourcePlacement.childInstanceId],[6,'root/depth-2/generation-1','sprite-55',1,'sprite-55/depth-1/generation-1']);
 assert.equal(SOURCE.hostRootFrame,1);assert.equal(TI002_BINDING.blocks.length,30);
 assert.deepEqual(TI002_BINDING.blocks.find(b=>b.id==='root-title')!.sourceTextIds,['character-54']);
 for(const frame of [1,2,3,11,12,152,178,260,261,262,286]){
  const context=ctx(frame),state=TI002_MODULE.getFrameState(frame,context),snapshot=ti002Snapshot(state,context);
  assert.equal(snapshot.status,'ready');const title=snapshot.blocks.find(b=>b.id==='root-title')!;
  assert.equal(title.text,'Multiplication: Try It!');assert.equal(title.visible,true);
  const html=renderToStaticMarkup(<G4L5Ti002ModernRenderer {...context}/>);
  assert.equal((html.match(/data-lesson-text-block="root-title"/g)??[]).length,1);assert.equal((html.match(/<h2\b/g)??[]).length,1);
  assert.match(html,/<h2 class="ti002-modern__title" data-lesson-text-block="root-title">Multiplication: Try It!<\/h2>/);
  assert.equal(html.includes('<h3 data-lesson-text-block="table-headings">Key Term</h3>'),frame>=12);
  if(frame===1)assert(!html.includes('data-lesson-text-block="instruction"'));
 }
 const replayContext={...ctx(1),replay:1},replayState=TI002_MODULE.getFrameState(1,replayContext);
 assert.equal(ti002Snapshot(replayState,replayContext).blocks.find(b=>b.id==='root-title')!.visible,true);
 assert.match(renderToStaticMarkup(<G4L5Ti002ModernRenderer {...replayContext}/>),/data-lesson-text-block="root-title">Multiplication: Try It!<\/h2>/);
 const wrong=reduceTi002Match(initial(),{type:'match',term:1,target:5,revisionFloor:0}).state,awaiting=matchAll();
 const correct=reduceTi002Match(awaiting,{type:'coach-complete',activity:clock('ti002-correct-coach',6),revisionFloor:8}).state;
 for(const match of [initial(),wrong,awaiting,correct])assert.equal(ti002Snapshot(TI002_MODULE.getFrameState(261,ctx(261)),ctx(261),match).blocks.find(b=>b.id==='root-title')!.visible,true);
});
test('TI002 restored title remains hidden when the existing product host or replay identity mismatches',()=>{
 const context=ctx(261),state=TI002_MODULE.getFrameState(261,context);
 const invalidContexts:RuntimeContext[]=[
  {...context,lang:'es'},{...context,rootFrame:6},{...context,frameDomain:'sprite-55'},
  {...context,scenario:'source-static-frame'},{...context,seed:8},{...context,replay:1},{...context,frame:262},
 ];
 for(const bad of invalidContexts){
  const snapshot=ti002Snapshot(state,bad);assert.equal(snapshot.status,'blocked');assert(snapshot.blocks.every(b=>!b.visible));
  assert(!renderToStaticMarkup(<G4L5Ti002ModernRenderer {...bad} state={state}/>).includes('data-lesson-text-block="root-title"'));
 }
 const invalidStates=[
  {...state,animationId:'course-g04-l05-ti-003'},{...state,rootFrame:6},{...state,frameDomain:'sprite-55'},
  {...state,scenario:'source-static-frame'},{...state,language:'es' as const},{...state,seed:8},{...state,replay:1},{...state,frame:262},
 ];
 for(const bad of invalidStates){
  const snapshot=ti002Snapshot(bad,context);assert.equal(snapshot.status,'blocked');assert(snapshot.blocks.every(b=>!b.visible));
  assert(!renderToStaticMarkup(<G4L5Ti002ModernRenderer {...context} state={bad}/>).includes('data-lesson-text-block="root-title"'));
 }
});
