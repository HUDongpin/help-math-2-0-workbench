import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {advanceSourceActivities,beginSourceClockActivity,sourceActivitiesAtParentFrame,type SourceClockActivity} from '../lesson-source-clock';
import {lessonTextActivityRequestAllowed,lessonTextFrameRequestAllowed,validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';
import {ZOG_X_GAME_CLOCKS as clocks,ZOG_X_GAME_FRAME_CONTROL as control,createZogXSession,dispatchZogX,synchronizeZogXSession,zogXGameView,zogXOwnedActivities,zogXWrongCloseIntent,type ZogXHostAction} from './g4-l4-zog-x-host-state';
import {ZogXQuestion} from './g4-l4-zog-x-question';

function harness(seed=73){
 let frame=591,queued:number|null=null,revision=0,all:readonly SourceClockActivity[]=[],s=createZogXSession(seed);
 const runtime=():AnimationRendererProps=>({frame,frameDomain:game.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed,replay:0,lessonActivities:all,
  onLessonFrameRequest(request){if(!lessonTextFrameRequestAllowed(control,request,{frame,frameDomain:game.frameDomain,capture:false}))return false;queued=request.toFrame;return true;},
  onLessonActivityRequest(request){const d=lessonTextActivityRequestAllowed(clocks,request,{frame,capture:false,activities:all});if(!d)return false;
   const next=beginSourceClockActivity(all,d,revision+1);if(!next)return false;revision++;all=next.map(a=>({...a,cancellationToken:a.cancellationToken??`host-${revision}`}));return true;},
 });
 const sync=()=>{s=synchronizeZogXSession(s,runtime(),all);};
 return {runtime,get state(){return s;},get clocks(){return all;},get frame(){return frame;},get queued(){return queued;},
  step(action:ZogXHostAction,patch:Partial<AnimationRendererProps>={}){s=dispatchZogX(s,action,{...runtime(),...patch});sync();return s;},
  arrive(){assert.notEqual(queued,null);frame=queued!;queued=null;all=sourceActivitiesAtParentFrame(all,frame);sync();},
  tick(ms:number){all=advanceSourceActivities(all,ms);sync();},
  start(){this.step({type:'start'});this.arrive();},
  correct(){const q=game.questions.find(q=>q.id===s.pool?.question)!;this.step({type:'answer',choice:q.answers.find(a=>a.correct)!.id});},
 };
}

test('GS002 source clock lifetimes agree with pinned extraction; declared edges pass real host guards',()=>{
 const recipe=JSON.parse(readFileSync('scripts/inputs/typography-v1/g4-l4-zog-x/game.json','utf8'));
 const blob=readFileSync(recipe.sources.asset.path);assert.equal(createHash('sha256').update(blob).digest('hex'),recipe.sources.asset.sha256);
 const asset=JSON.parse(gunzipSync(blob).toString()),main=asset.timelines.find((t:any)=>t.timelineId===game.frameDomain);
 for(const d of clocks){
  const instance=main.instances.find((i:any)=>i.instanceId===d.sourceInstanceId);assert(instance);
  assert.equal(d.frameDomain,`sprite-${instance.characterId}`);
  assert.deepEqual(d.parentLifetime,{firstFrame:instance.firstFrame,lastFrameExclusive:instance.lastFrameExclusive});
  const child=asset.timelines.find((t:any)=>t.timelineId===d.frameDomain);assert(d.endFrame<=child.declaredFrameCount);
 }
 validateLessonTextActivities(clocks,602,12);validateLessonTextFrameControl(control,602);
 assert(!control.transitions.some(e=>e.fromFrame===591&&Number(e.toFrame)===602));
});

test('all eight correct branches use source frame5 and individual ends; Final does not draw a ninth question',()=>{
 const h=harness();h.start();
 for(const f of game.feedback){
  const before=h.state.pool!,question=before.question;h.correct();
  assert.equal(h.state.pool!.correctSelect,f.stage);assert.equal(h.state.pool!.correctQuestions.length,f.stage-1);
  assert.equal(h.state.pool!.question,question);assert.equal(zogXGameView(h.state,h.runtime()).answersEnabled,false);
  const clock=h.clocks.find(a=>a.id===`g4-l4-zog-x-correct-${f.stage}`)!;
  assert.equal(zogXOwnedActivities(h.state,h.clocks).length,f.stage,'hidden completed source instances remain owned until removal');
  h.tick(1000/12);h.step({type:'observe'});assert.equal(h.state.pool!.question,question,'frame4 must not draw');
  h.tick(1000/12);h.step({type:'observe'});
  assert.equal(h.state.pool!.correctQuestions.length,f.stage);assert.equal(h.state.pool!.correctQuestions.at(-1),question);
  if(f.stage<8){
   assert.notEqual(h.state.pool!.question,question);assert.equal(h.frame,before.frame,'accepted seek has not arrived yet');
   assert.equal(zogXGameView(h.state,h.runtime()).question,undefined,'no new native question before the actual host frame arrives');
   const pending=h.state;h.step({type:'answer',choice:'A'});assert.equal(h.state,pending);
   h.arrive();assert.equal(h.clocks.find(a=>a.id===clock.id)!.revision,clock.revision,'same child survives parent seek');
  }else{assert.equal(h.state.pool!.totalQuizCount,8);assert.equal(h.state.pool!.random,before.random);assert.equal(h.queued,null);}
  h.tick((f.endFrame-6)*1000/12);h.step({type:'observe'});assert(h.state.feedback,'one frame before source stop remains locked');
  h.tick(1000/12);h.step({type:'observe'});
  if(f.stage<8){assert.equal(h.state.feedback,null);assert.equal(zogXGameView(h.state,h.runtime()).answersEnabled,true);}
 }
 assert.equal(h.state.pool!.frame,602);assert.equal(h.state.pool!.totalQuizCount,8);assert.equal(h.state.pool!.quizSection,false);
 assert.equal(zogXGameView(h.state,h.runtime()).correctStage,8,'source feedback remains until the accepted Final seek actually arrives');
 assert.equal(zogXGameView(h.state,h.runtime()).correctFrame,240);
 h.arrive();assert.equal(h.clocks.length,0,'source removes all feedback instances at Final');
 h.step({type:'observe'});assert.equal(h.clocks.length,1);assert.equal(h.clocks[0]!.frame,1);
 assert.equal(zogXGameView(h.state,h.runtime()).endingComplete,false);
 h.tick(111*1000/12);assert.equal(zogXGameView(h.state,h.runtime()).endingComplete,true);
 assert.equal(zogXGameView(h.state,h.runtime()).correctStage,null);
});

test('all ten native questions retain source numbers, operators, decimal values and distinct answer letter/value bindings',()=>{
 for(const q of game.questions){
  const html=renderToStaticMarkup(React.createElement(ZogXQuestion,{question:q,number:10,enabled:false,onAnswer:()=>assert.fail('SSR must not dispatch an answer')}));
  assert(html.includes(q.prompt));assert(html.includes('>10.</span>'));
  assert.equal((html.match(/<button /g)??[]).length,4);assert.equal((html.match(/disabled=""/g)??[]).length,5);
  for(const a of q.answers){assert(html.includes(`>${a.text}</span>`));assert(html.includes(`data-source-text-ids="${a.sourceTextIds.join(' ')}"`));assert(html.includes(`data-source-text-ids="${a.sourceLetterIds.join(' ')}"`));}
  assert(!html.includes('data-correct'));assert(!html.includes('<canvas'));
 }
});

test('a skipped RAF crosses source milestones once; rejected host seeks leave pool and score history unconsumed',()=>{
 const h=harness();h.start();h.correct();h.tick(50000);
 const before=h.state;h.step({type:'observe'},{onLessonFrameRequest:()=>false});assert.equal(h.state,before);
 assert.equal(h.state.pool!.correctQuestions.length,0);assert.equal(h.state.pool!.totalQuizCount,1);
 h.step({type:'observe'});assert.equal(h.state.pool!.totalQuizCount,2);assert.equal(h.state.pool!.correctQuestions.length,1);
 h.arrive();h.step({type:'observe'});assert.equal(h.state.feedback,null);
 for(let i=0;i<10;i++)h.step({type:'observe'});
 assert.equal(h.state.pool!.totalQuizCount,2);assert.equal(h.state.pool!.correctQuestions.length,1);
});

test('activity rejection, Pause and capture cannot increment correctness or issue continuation',()=>{
 const h=harness();const initial=h.state;
 for(const patch of [{paused:true},{entryStateSha256:'a'.repeat(64)},{onLessonFrameRequest:()=>false}])assert.equal(h.step({type:'start'},patch),initial);
 h.start();const before=h.state,q=game.questions.find(q=>q.id===before.pool!.question)!,choice=q.answers.find(a=>a.correct)!.id;
 for(const patch of [{paused:true},{entryStateSha256:'a'.repeat(64)},{onLessonActivityRequest:()=>false}])assert.equal(h.step({type:'answer',choice},patch),before);
 assert.equal(h.clocks.length,0);assert.equal(h.state.pool!.correctSelect,0);
 h.correct();h.tick(50000);const feedback=h.state;
 assert.equal(h.step({type:'observe'},{paused:true}),feedback);assert.equal(h.state.pool!.correctQuestions.length,0);
});

test('foreign, stale, duplicate and replaced activity snapshots cannot trigger frame5 or unlock answers',()=>{
 const h=harness();h.start();h.correct();h.tick(50000);const s=h.state,clock=h.clocks.at(-1)!;
 const variants:LessonTextActivitySnapshot[]=[{...clock,sourceInstanceId:'foreign'},{...clock,frameDomain:'sprite-649'},
  {...clock,revision:clock.revision+1},{...clock,cancellationToken:'replaced'},{...clock,cancellationToken:undefined},
  {...clock,frame:4,status:'completed'},{...clock,frame:109}];
 for(const value of variants)assert.equal(dispatchZogX(s,{type:'observe'},{...h.runtime(),lessonActivities:[value]}),s);
 assert.equal(dispatchZogX(s,{type:'observe'},{...h.runtime(),lessonActivities:[clock,clock]}),s);
 assert.equal(zogXOwnedActivities(s,[...h.clocks,{...clock,cancellationToken:'unrelated'}]).length,1);
 assert.equal(synchronizeZogXSession(s,h.runtime(),[]).pool,null,'same-frame user seek clears real clock identity');
 assert.equal(synchronizeZogXSession(s,{...h.runtime(),replay:1},h.clocks).pool,null);
 assert.equal(synchronizeZogXSession(s,{...h.runtime(),frame:591},h.clocks).pool,null);
});

test('wrong popup Close preserves source65 overflow: one tick at60 then1, immediate draw, no frame60 parent play',()=>{
 const h=harness();h.start();const q=game.questions.find(q=>q.id===h.state.pool!.question)!;
 h.step({type:'answer',choice:q.answers.find(a=>!a.correct)!.id});h.tick(23*1000/12);
 assert.equal(zogXWrongCloseIntent(h.state,h.runtime()),null);
 h.tick(1000/12);const before=h.state,intent=zogXWrongCloseIntent(before,h.runtime());assert(intent);
 assert.equal(intent.childGotoAndPlay,65);assert.equal(intent.fromActivity.frame,26);
 assert.equal(intent.nextPool.totalQuizCount,2);assert.equal(h.state,before);assert.equal(h.queued,null);
 assert.equal(intent.projection,'hold-source60-one-tick-then-wrap1-without-frame60-actions');
 h.step({type:'repeat'});assert.equal(zogXWrongCloseIntent(h.state,h.runtime()),null);
 h.step({type:'close-directions'});assert(zogXWrongCloseIntent(h.state,h.runtime()));
 assert.equal(zogXGameView(h.state,h.runtime()).answersEnabled,false);
 const ready=h.state;assert.equal(h.step({type:'close-wrong'},{onLessonActivityRequest:()=>false}),ready);
 assert.equal(zogXGameView(h.state,{...h.runtime(),paused:true}).wrongCloseEnabled,false);
 assert.equal(h.step({type:'close-wrong'},{paused:true}),ready);
 h.step({type:'close-wrong'});assert.equal(h.state.pool!.totalQuizCount,2);assert.equal(h.state.pool!.correctSelect,0);
 h.arrive();const nextFrame=h.frame;assert.equal(zogXGameView(h.state,h.runtime()).wrongFrame,60);
 assert.equal(zogXGameView(h.state,h.runtime()).wrongPopup,true);assert.equal(zogXGameView(h.state,h.runtime()).wrongCloseEnabled,false);
 h.tick(1000/12-.01);assert.equal(zogXGameView(h.state,h.runtime()).wrongFrame,60);
 h.tick(.01);assert.equal(zogXGameView(h.state,h.runtime()).wrongFrame,1);assert.equal(zogXGameView(h.state,h.runtime()).wrongPopup,false);
 h.tick(2000);h.step({type:'observe'});assert.equal(h.frame,nextFrame);assert.equal(h.state.pool!.totalQuizCount,2);
 assert.equal(zogXGameView(h.state,h.runtime()).answersEnabled,true);
});

test('accepted wrong child survives rejected parent seek; retry commits the pending draw once without replaying child audio',()=>{
 const h=harness();h.start();const q=game.questions.find(q=>q.id===h.state.pool!.question)!;
 h.step({type:'answer',choice:q.answers.find(a=>!a.correct)!.id});h.tick(5000);
 const before=h.state.pool!,oldFrame=h.frame;h.step({type:'close-wrong'},{onLessonFrameRequest:()=>false});
 assert.equal(h.state.pool,before);assert.equal(h.frame,oldFrame);assert(h.state.pendingWrongDraw);
 const revision=h.clocks.at(-1)!.revision,s=h.state;h.step({type:'close-wrong'});assert.equal(h.state,s,'duplicate Close cannot restart accepted child');
 h.tick(1000);h.step({type:'observe'},{onLessonFrameRequest:()=>false});assert.equal(h.state.pool,before);
 assert.equal(zogXGameView(h.state,h.runtime()).wrongFrame,1);assert.equal(zogXGameView(h.state,h.runtime()).answersEnabled,false);
 h.step({type:'observe'});h.arrive();assert.equal(h.state.pool!.totalQuizCount,2);assert.equal(h.state.pendingWrongDraw,null);
 assert.equal(h.clocks.at(-1)!.revision,revision);assert.equal(h.clocks.at(-1)!.status,'completed');
 for(let i=0;i<5;i++)h.step({type:'observe'});assert.equal(h.state.pool!.totalQuizCount,2);
});
