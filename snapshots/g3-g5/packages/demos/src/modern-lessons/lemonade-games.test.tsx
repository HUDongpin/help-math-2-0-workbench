import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {LEMONADE_CONFIGS,createLemonadeInteraction as initial,synchronizeLemonadeInteraction as sync,reduceLemonadeInteraction as reduce,lemonadeActivities,lemonadeTransitions,lemonadeCurrentQuestion as question,lemonadeFeedback,lemonadeModule,lemonadeSnapshot,lemonadeBinding} from './lemonade-games-state';
import {G3_L6_GS002_TEXT_PRESENTATION,G4_L1_GS002_TEXT_PRESENTATION} from './lemonade-games';
for(const c of LEMONADE_CONFIGS){
 const ctx=(frame:number,replay=0):RuntimeContext=>({frame,frameDomain:c.domain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed:7,replay});
 const activity=(id:string,revision=10)=>{const a=lemonadeActivities(c).find(a=>a.id===id)!;return{id,sourceInstanceId:a.sourceInstanceId,frameDomain:a.frameDomain,frame:a.endFrame,revision,status:'completed' as const};};
 test(`${c.id}: source identity, ten exact questions and independent instance lifetimes`,()=>{
  assert.equal(c.questions.length,10);assert.equal(new Set(c.questions.map(q=>q.frame)).size,10);assert.equal(c.questions[0]!.frame,c.beginFrame+1);assert.equal(c.questions[9]!.frame,c.finalFrame-1);
  const definitions=lemonadeActivities(c);validateLessonTextActivities(definitions,c.frameCount,12);validateLessonTextFrameControl({frameDomain:c.domain,completionFrame:c.finalFrame,transitions:lemonadeTransitions(c)},c.frameCount);assert.equal(definitions.length,15);for(const d of definitions){assert(d.sourceInstanceId);assert(d.parentFrames.every(f=>f>=d.parentLifetime!.firstFrame&&f<d.parentLifetime!.lastFrameExclusive));}
  for(const q of c.questions){assert.equal(q.choices.filter(a=>a.letter===q.correct).length,1);assert.equal(q.wrongMessage,`Sorry, the correct answer was ${q.correct}.`);}
  for(const from of c.questions){assert(lemonadeTransitions(c).some(e=>e.fromFrame===from.frame&&e.toFrame===c.finalFrame));}
  assert.equal(lemonadeBinding(c).blocks.length,71);
 });
 test(`${c.id}: deterministic source no-replacement path earns 100 only after ten correct`,()=>{
  let s=initial(c,7),frame=c.beginFrame;assert.deepEqual(s.order,initial(c,7).order);assert.equal(new Set(s.order).size,10);
  let r=reduce(c,s,frame,{type:'start'});assert(r.allowed);s=r.nextState;frame=r.frameRequest!.toFrame;s=sync(c,s,ctx(frame));
  for(let index=0;index<10;index++){const q=question(c,s)!;assert.equal(q.frame,frame);r=reduce(c,s,frame,{type:'answer',choice:q.correct as any});assert(r.allowed);assert.equal(r.activities.length,2);s=r.nextState;
   assert.equal(s.score,(index+1)*10);assert.equal(reduce(c,s,frame,{type:'answer',choice:q.correct as any}).allowed,false);assert.equal(r.activities[1],index===9?'score-hundred':'score-ordinary');
   const feedback=r.activities.map((id,i)=>activity(id,20+index*2+i));assert(lemonadeFeedback(c,s,feedback).complete);assert.equal(lemonadeFeedback(c,s,feedback.slice(0,1)).complete,false);
   r=reduce(c,s,frame,{type:'feedback-complete'});assert(r.allowed);s=r.nextState;frame=r.frameRequest!.toFrame;s=sync(c,s,ctx(frame));}
  assert.equal(frame,c.finalFrame);assert.equal(s.score,100);assert.equal(s.answered.length,10);assert.equal(s.complete,true);assert.equal(new Set(s.answered.map(a=>a.question)).size,10);
  assert.equal(reduce(c,s,frame,{type:'start'}).allowed,false);assert.equal(sync(c,s,ctx(1,1)).score,0);
 });
 test(`${c.id}: wrong answers reveal source answer, hold, close and consume one question`,()=>{
  let s=initial(c,7),frame=c.beginFrame,r=reduce(c,s,frame,{type:'start'});s=r.nextState;frame=r.frameRequest!.toFrame;s=sync(c,s,ctx(frame));
  r=reduce(c,s,frame,{type:'answer',choice:question(c,s)!.choices.find(a=>a.letter!==question(c,s)!.correct)!.letter as any,revisionFloor:9});s=r.nextState;
  assert.equal(s.score,0);assert.equal(r.activities.length,1);const d=activity(s.feedback!.id,10);
  // Source display lists include outlined OH! NO at 7 and 15; blank
  // turnover frames 8..14 must stay hidden. Test the complete inbound span.
  for(let childFrame=2;childFrame<=22;childFrame++){
   const child={...d,frame:childFrame,status:'playing' as const};
   const expectedVisible=(childFrame>=3&&childFrame<=7)||childFrame>=15;
   assert.equal(lemonadeFeedback(c,s,[child]).visible,expectedVisible,`wrong frame ${childFrame}`);
   const snapshot=lemonadeSnapshot(c,lemonadeModule(c.id).getFrameState(frame,ctx(frame)),ctx(frame),s,[child]);
   assert.equal(snapshot.blocks.find(b=>b.id==='feedback-wrong')!.visible,expectedVisible);
   assert.equal(lemonadeFeedback(c,s,[{...child,revision:9}]).visible,false);
   assert.equal(lemonadeFeedback(c,s,[{...child,frameDomain:'sprite-0'}]).visible,false);
  }
  assert.equal(lemonadeFeedback(c,s,[{...d,frame:12,status:'playing'}]).popup,false);assert.equal(lemonadeFeedback(c,s,[{...d,frame:13,status:'playing'}]).popup,true);assert.equal(lemonadeFeedback(c,s,[d]).complete,false);
  assert.equal(reduce(c,s,frame,{type:'close-feedback',activity:{...d,revision:9}}).allowed,false);assert.equal(reduce(c,s,frame,{type:'close-feedback',activity:{...d,frame:12}}).allowed,false);
  r=reduce(c,s,frame,{type:'close-feedback',activity:d});assert(r.allowed);assert.deepEqual(r.fromActivity,{id:d.id,revision:10});s=r.nextState;
  for(let childFrame=23;childFrame<=27;childFrame++){
   const child={...activity(s.feedback!.id,11),frame:childFrame,status:'playing' as const};
   assert.equal(lemonadeFeedback(c,s,[child]).visible,childFrame<=26,`outro frame ${childFrame}`);
  }
  assert.equal(lemonadeFeedback(c,s,[d]).complete,false);assert.equal(lemonadeFeedback(c,s,[activity(s.feedback!.id,11)]).complete,true);
  r=reduce(c,s,frame,{type:'feedback-complete'});assert.equal(r.nextState.index,1);assert.equal(r.nextState.score,0);assert.equal(r.nextState.answered.length,1);
 });
 test(`${c.id}: Repeat Close restores exactly the same unanswered question`,()=>{
  let s=initial(c,7),r=reduce(c,s,c.beginFrame,{type:'start'});s=sync(c,r.nextState,ctx(r.frameRequest!.toFrame));const frame=question(c,s)!.frame;
  r=reduce(c,s,frame,{type:'repeat'});assert(r.allowed);assert.equal(reduce(c,r.nextState,frame,{type:'answer',choice:'A'}).allowed,false);
  const closed=reduce(c,r.nextState,frame,{type:'close-directions'});assert.deepEqual(closed.nextState,s);assert.equal(closed.frameRequest,null);
 });
 test(`${c.id}: source page title stays visible through each teaching phase and rejects invalid context`,()=>{
  const cap=c.id==='g3-l6-gs002'?G3_L6_GS002_TEXT_PRESENTATION:G4_L1_GS002_TEXT_PRESENTATION,Renderer=cap.Renderer!;
  const expectedHtml=c.title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  for(const frame of [1,c.beginFrame,c.questions[0]!.frame,c.finalFrame]){
   const context=ctx(frame),state=lemonadeModule(c.id).getFrameState(frame,context),snapshot=lemonadeSnapshot(c,state,context);
   const title=snapshot.blocks.find(b=>b.id==='root-title')!;assert.equal(title.text,c.title);assert.equal(title.visible,true);
   const html=renderToStaticMarkup(<Renderer {...context}/>);
   assert.equal((html.match(/data-lesson-text-block="root-title"/g)??[]).length,1);
   assert(html.includes(`<h2 class="lemonade-game__title" data-lesson-text-block="root-title">${expectedHtml}</h2>`));
   const invalid=lemonadeSnapshot(c,state,{...context,lang:'es'});assert.equal(invalid.status,'blocked');assert.equal(invalid.blocks.find(b=>b.id==='root-title')!.visible,false);
  }
 });
 test(`${c.id}: exact context fails closed and native text has no raster or canvas`,()=>{
  const context=ctx(c.beginFrame),state=lemonadeModule(c.id).getFrameState(context.frame,context);assert.equal(state.status,'ready');assert.equal(lemonadeSnapshot(c,state,context).status,'ready');
  assert.equal(lemonadeSnapshot(c,state,{...context,lang:'es'}).status,'blocked');assert.equal(lemonadeSnapshot(c,{...state,sourceSwfSha256:'0'.repeat(64)},context).status,'blocked');
  const cap=c.id==='g3-l6-gs002'?G3_L6_GS002_TEXT_PRESENTATION:G4_L1_GS002_TEXT_PRESENTATION,Renderer=cap.Renderer!;
  const html=renderToStaticMarkup(<Renderer {...context}/>);assert(!/<(?:canvas|img|image)\b/.test(html));assert.match(html,/button to begin|Click Start/);assert.equal(cap.sourceTimelineAudioCues![0]!.frame,c.id==='g3-l6-gs002'?2:3);
 });
}
test('G4 Q5 preserves the authored distractor and G3 five fractions retain MathML semantics',()=>{
 const g3=LEMONADE_CONFIGS[0]!,g4=LEMONADE_CONFIGS[1]!;assert.equal(g4.questions[4]!.choices[1]!.text,'3,00,000');assert.equal(g3.questions.flatMap(q=>q.choices).filter(a=>a.fraction).length,5);
});
