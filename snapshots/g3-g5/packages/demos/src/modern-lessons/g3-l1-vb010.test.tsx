import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath}from'node:url';
import {createHash}from'node:crypto';
import React from'react';
import {renderToStaticMarkup}from'react-dom/server';
import type{AnimationRendererProps}from'../contract';
import type{LessonTextActivitySnapshot}from'../lesson-text-contract';
import {VB010_CONFIG as c}from'./generated/g3-l1-vb010-source';
import {G3_L1_VB010_TEXT_PRESENTATION as P}from'./g3-l1-vb010-capability';
import Original from '../modules/course-g03-l01-vb-010';
const M={...Original,textPresentation:P};
import {Vb010Scene,getVb010Snapshot}from'./g3-l1-vb010';
import {createVb010Session as create,synchronizeVb010Session as sync,chooseVb010Answer as choose,closeVb010Wrong as close,finishVb010Feedback as finish,observeVb010Feedback as observe,getVb010Teaching as teaching,type Vb010Session}from'./g3-l1-vb010-state';
const dir=path.dirname(fileURLToPath(import.meta.url)),source=JSON.parse(fs.readFileSync(path.join(dir,'../../../../scripts/inputs/typography-v1/g3-l1-vb010/source-contract.json'),'utf8'));
const runtime=(seed=0,frame=75):AnimationRendererProps=>({frame,frameDomain:'sprite-255',rootFrame:6,lang:'en',scenario:'source-static-frame',seed,replay:0,onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,onReplay:()=>{}});
const activity=(s:Vb010Session,frame?:number,revision=1):LessonTextActivitySnapshot=>{const id=s.feedback!.id+(s.feedback!.stage==='outro'?'-outro':''),d=c.activities.find(d=>d.id===id)!;return{id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:frame??d.endFrame,revision,status:(frame??d.endFrame)===d.endFrame?'completed':'playing'};};
const at=(curve:readonly any[],f:number)=>curve.filter(x=>x[0]<=f).at(-1)?.[1]??0;
const html=(r:AnimationRendererProps,s=create(r.seed),activities:readonly LessonTextActivitySnapshot[]=[])=>renderToStaticMarkup(<Vb010Scene runtime={r} session={s} activities={activities} onChoose={()=>{}} onClose={()=>{}}/>);
test('own-source contract hash, 7 host-selected sprites, authored 76 and 96 edges',()=>{
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(dir,'../../../../scripts/inputs/typography-v1/g3-l1-vb010/source-contract.json'))).digest('hex'),'5be656e573b026758ea2a9c85198f748262747365d50cc181fa0fcbcbe837578');
 assert.deepEqual(c.branches.map(b=>Number(b.frameDomain.slice(7))),[153,211,252,179,122,62,80]);
 assert.deepEqual(P.frameControl?.transitions,[{fromFrame:75,toFrame:76,stopFrame:136},{fromFrame:75,toFrame:96,stopFrame:136}]);
 assert.equal(P.playbackEndFrameByDomain?.['sprite-255'],75);assert.equal(P.reducedMotionFrameByDomain?.['sprite-255'],75);
 assert.deepEqual(c.answers.map(a=>[a.id,a.text,a.correct]),[['top','15 thousand 582',false],['middle','fifteen thousand, five hundred eighty-two',true],['bottom','15,582',false]]);
 assert(c.activities.every(d=>d.parentLifetime.firstFrame===75&&d.parentLifetime.lastFrameExclusive===76));
});
test('every main frame has source-bound word reveal, answer fades, native order and complete text snapshot',()=>{
 for(let f=1;f<=136;f++){
  const r=runtime(0,f),s=create(),t=teaching(f,s),markup=html(r,s),snap=getVb010Snapshot(M.getFrameState(f,r)as any,r,s);
  assert.equal(snap.status,'ready');assert.equal(snap.blocks.length,c.binding.blocks.length);
  for(const[i,w]of source.promptWords.entries()){assert.equal(t.promptWords[i].visible,f>=w.firstFrame);assert.equal(snap.blocks.find(b=>b.id==='prompt-word-'+i)!.visible,f>=w.firstFrame);}
  for(const a of source.answers){assert.equal(t.answers.find(x=>x.id===a.id)!.alpha,at(a.trace,f).alpha);assert.equal(snap.blocks.find(b=>b.id==='answer-'+a.id)!.visible,at(a.trace,f).alpha>0);}
  assert(markup.indexOf('data-lesson-text-block="answer-top"')<markup.indexOf('data-lesson-text-block="answer-middle"'));assert(markup.indexOf('data-lesson-text-block="answer-middle"')<markup.indexOf('data-lesson-text-block="answer-bottom"'));
  assert.doesNotMatch(markup,/<canvas|<img|<svg|<foreignObject/);assert.equal(markup.includes('data-vb010-focus="replay"'),f===136);
 }
 assert.deepEqual(c.promptWords.map(w=>w.firstFrame),[13,15,17,21,24,26,29,34,57]);
});
test('every reachable feedback frame uses own copy/alpha, dialog timing and active snapshot',()=>{
 for(const b of source.branches){
  const r=runtime(b.variant-1),s=choose(create(r.seed),b.kind==='wrong'?'top':'middle',r);assert.equal(s.feedback!.id,b.id);
  for(let f=2;f<=b.introStop;f++){
   const a=activity(s,f),seen=observe(s,[a]),markup=html(r,s,[a]),snap=getVb010Snapshot(M.getFrameState(75,r)as any,r,s,[a]);
   assert(seen.bound);for(const label of b.nativeFeedbackCopy.labels){
    const text=label.text.length===1?'ROCKET':label.text,match=seen.labels.find(l=>c.text[l.id as keyof typeof c.text]===text);assert(match,'missing '+b.id+' '+text);assert.equal(match.alpha,at(label.alpha,f));
    assert.equal(snap.blocks.find(x=>x.id===match.id)!.visible,match.alpha>0);
    assert.equal(markup.includes('data-lesson-text-block="'+match.id+'"'),match.alpha>0);
   }
   const popup=b.labels.find((l:any)=>l.characterId===49);assert.equal(seen.popup,!!popup&&at(popup.alpha,f)>0);assert.equal(markup.includes('role="dialog"'),seen.popup);
   for(const block of snap.blocks.filter(x=>x.id.startsWith('answer-')||x.id.startsWith('prompt-word-')))assert.equal(block.visible,!seen.popup);
  }
  if(b.kind==='wrong'){
   const out=close(s,{...r,lessonActivities:[activity(s)]});assert.equal(out.feedback!.stage,'outro');
   for(let f=23;f<=b.endFrame;f++){const a=activity(out,f,2),seen=observe(out,[a]),markup=html(r,out,[a]);assert(seen.bound);assert(!seen.popup);assert(!markup.includes('role="dialog"'));for(const l of b.nativeFeedbackCopy.labels)assert.equal(seen.labels.find(x=>c.text[x.id as keyof typeof c.text]===l.text)!.alpha,at(l.alpha,f));}
  }
 }
 // Glyph shapes fill these two source frames; they are not omitted with reflection deduplication.
 const r=runtime(2),s=choose(create(2),'top',r);for(const f of[7,15])assert(html(r,s,[activity(s,f)]).includes('>OH! NO</p>'));
});
test('all deterministic branches and both wrong answers reach retry75 then WF96, correct reaches76',()=>{
 for(let seed=0;seed<12;seed++)for(const first of['top','bottom'])for(const second of['top','bottom']){
  const requests:any[]=[];const r={...runtime(seed),onLessonFrameRequest:(x:any)=>{requests.push(x);return true;}};
  let s=choose(create(seed),first,r);assert.equal(s.wrongCount,1);assert.equal(teaching(75,s,[activity(s)]).explanation,source.wrongExplanations[0]);
  s=close(s,{...r,lessonActivities:[activity(s)]});s=finish(s,{...r,lessonActivities:[activity(s,undefined,2)]});assert.equal(s.feedback,null);assert.equal(s.pendingResume,null);assert.equal(s.focusTarget,first);assert.equal(requests.length,0);
  s=choose(s,second,r);assert.equal(s.wrongCount,2);assert.equal(teaching(75,s,[activity(s)]).explanation,source.wrongExplanations[1]);s=close(s,{...r,lessonActivities:[activity(s,22,3)]});s=finish(s,{...r,lessonActivities:[activity(s,undefined,4)]});assert.equal(s.pendingResume,96);assert.deepEqual(requests,[{fromFrame:75,toFrame:96,stopFrame:136}]);assert.equal(choose(s,'middle',r),s);
 }
 for(let seed=0;seed<4;seed++)for(const wrongFirst of[false,true]){
  const requests:any[]=[];const r={...runtime(seed),onLessonFrameRequest:(x:any)=>{requests.push(x);return true;}};let s=create(seed);
  if(wrongFirst){s=choose(s,'top',r);s=close(s,{...r,lessonActivities:[activity(s)]});s=finish(s,{...r,lessonActivities:[activity(s,undefined,2)]});}
  const count=s.wrongCount;s=choose(s,'middle',r);assert.equal(s.wrongCount,count);s=finish(s,{...r,lessonActivities:[activity(s,undefined,3)]});assert.equal(s.pendingResume,76);assert.deepEqual(requests,[{fromFrame:75,toFrame:76,stopFrame:136}]);
 }
});
test('rejected selections, identities, duplicate clicks, pause and host refusal consume no attempts',()=>{
 const r=runtime(),s=create();for(const delta of[{frame:74},{frame:76},{lang:'es'},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'capture'},{paused:true},{seed:1},{replay:1},{onLessonFrameRequest:undefined},{onLessonActivityRequest:undefined},{onLessonActivityRequest:()=>false}])assert.equal(choose(s,'top',{...r,...delta}as any),s);
 assert.equal(choose(s,'invalid',r),s);const selected=choose(s,'top',r);assert.equal(choose(selected,'bottom',r),selected);assert.equal(selected.wrongCount,1);
});
test('stale, foreign, duplicate and replacement child snapshots cannot close or finish',()=>{
 const r=runtime(),s=choose(create(),'top',r),a=activity(s);
 for(const list of[[],[{...a,id:'foreign'}],[{...a,sourceInstanceId:'foreign'}],[{...a,frameDomain:'root'}],[{...a,frame:NaN}],[{...a,frame:23}],[{...a,revision:-1}],[a,a],[a,{...a,id:'foreign'}]]){assert(!observe(s,list).bound);assert.equal(close(s,{...r,lessonActivities:list}),s);assert.equal(finish(s,{...r,lessonActivities:list}),s);}
 assert(!observe({...s,feedbackRevision:1},[{...a,revision:2}]).bound);assert(observe({...s,feedbackRevision:1},[a]).bound);
 const stale=choose(create(),'top',{...r,lessonActivities:[{...a,revision:4}]});assert.equal(stale.feedback!.revisionFloor,4);assert(!observe(stale,[{...a,revision:4}]).bound);assert(observe(stale,[{...a,revision:5}]).bound);
});
test('Close accepts the seen popup revision only; early/refused/paused Close preserves state',()=>{
 const r=runtime(),s=choose(create(),'top',r),a=activity(s);let sent:any;
 const next=close(s,{...r,lessonActivities:[a],onLessonActivityRequest:x=>{sent=x;return true;}});assert.deepEqual(sent,{id:'wrong-1-outro',parentFrame:75,fromActivity:{id:'wrong-1',revision:1}});assert.equal(next.feedback!.revisionFloor,1);
 for(const delta of[{paused:true},{onLessonActivityRequest:()=>false},{onLessonActivityRequest:undefined},{lessonActivities:[activity(s,2)]}])assert.equal(close(s,{...r,lessonActivities:[a],...delta}),s);
 assert.equal(close(next,{...r,lessonActivities:[a]}),next);
});
test('rejected correct76 and wrong96 frame requests retain the completed feedback for retry',()=>{
 const r=runtime();for(const kind of['correct','wrong']){
  let s=choose(create(),kind==='correct'?'middle':'top',r);if(kind==='wrong')s=close({...s,wrongCount:2},{...r,lessonActivities:[activity(s)]});const a=activity(s,undefined,2);
  for(const delta of[{paused:true},{onLessonFrameRequest:()=>false},{onLessonFrameRequest:undefined},{lessonActivities:[{...a,status:'playing'as const}]}])assert.equal(finish(s,{...r,lessonActivities:[a],...delta}),s);
  const next=finish(s,{...r,lessonActivities:[a]});assert.equal(next.pendingResume,kind==='correct'?76:96);assert.equal(finish(next,{...r,lessonActivities:[a]}),next);
 }
});
test('Replay, seed change and source seek reset session; accepted jumps detach feedback',()=>{
 const r=runtime(),s={...choose(create(),'top',r),feedbackRevision:7};assert.deepEqual(sync(s,{...r,replay:1}),create(0,1));assert.deepEqual(sync(s,{...r,seed:2}),create(2));assert.deepEqual(sync(s,{...r,frame:1}),create());assert.equal(sync(s,{...r,frame:96}).feedback,null);
 const pending={...s,feedback:null,pendingResume:96};assert.equal(sync(pending,r).pendingResume,96);assert.equal(sync(pending,{...r,frame:96}).pendingResume,null);
});
test('snapshot refuses wrong source/capture/language identities; candidate is unregistered',()=>{
 const r=runtime(),state=M.getFrameState(75,r)as any;assert.equal(getVb010Snapshot(state,r).status,'ready');
 for(const delta of[{lang:'es'},{frame:0},{frame:74},{frame:1.5},{seed:18},{replay:-1},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'capture'}])assert.equal(getVb010Snapshot(state,{...r,...delta}as any).status,'blocked');
 for(const delta of[{animationId:'other'},{sourceSwfSha256:'0'.repeat(64)},{status:'blocked'},{rootFrame:5},{language:'es'}])assert.equal(getVb010Snapshot({...state,...delta},r).status,'blocked');
 assert.equal(M.key,'course-g03-l01-vb-010');assert.deepEqual(M.audioCues,[]);
});

test('actual shared source-clock accepts each configured branch, guards Close, and removes children at76/96',async()=>{
 const {beginSourceClockActivity,advanceSourceActivities,sourceActivitiesAtParentFrame,releaseSourceButtonActivity}=await import('../lesson-source-clock');
 for(const b of c.branches){
  const intro=c.activities.find(d=>d.id===b.id)!,begin=beginSourceClockActivity([],intro,1)!;assert.equal(begin[0].frame,2);
  const completed=advanceSourceActivities(begin,(intro.endFrame-2)*1000/12);assert.equal(completed[0].frame,intro.endFrame);assert.equal(completed[0].status,'completed');
  assert.equal(sourceActivitiesAtParentFrame(completed,75).length,1);assert.equal(sourceActivitiesAtParentFrame(completed,76).length,0);assert.equal(sourceActivitiesAtParentFrame(completed,96).length,0);
  if(b.kind==='wrong'){
   const outro=c.activities.find(d=>d.id===b.id+'-outro')!;assert.equal(beginSourceClockActivity(begin,outro,2),undefined);
   const closing=beginSourceClockActivity(completed,outro,2)!;assert.equal(closing.length,1);assert.equal(closing[0].frame,23);assert.equal(closing[0].sourceInstanceId,intro.sourceInstanceId);
   const closeButton=c.activities.find(d=>d.id===b.closeActivityId)!;assert('buttonPress'in closeButton);assert.equal(closeButton.buttonPress.sourceButtonId,58);
   const pressed=beginSourceClockActivity(completed,closeButton,3)!.map(a=>a.id===closeButton.id?{...a,pressToken:'down'}:a);assert.equal(pressed.length,2);
   assert.equal(releaseSourceButtonActivity(pressed,closeButton.id,'stale'),undefined);assert.equal(releaseSourceButtonActivity(pressed,closeButton.id,'down')!.length,1);
  }
 }
});
