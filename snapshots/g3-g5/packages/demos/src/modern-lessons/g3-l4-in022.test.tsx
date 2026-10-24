import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {validateLessonTextActivities,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {IN022_SOURCE as SOURCE,IN022_HOLDS,IN022_ACTIVITIES,IN022_MODULE,IN022_BINDING,createIn022Practice,drawIn022Question,reduceIn022Practice,currentIn022Question,in022Feedback,in022Prelude,in022Snapshot,type In022Practice} from './g3-l4-in022-state';
import {G3_L4_IN022_TEXT_PRESENTATION as CAP,G3L4In022ModernRenderer} from './g3-l4-in022';
const ctx=(frame:number):RuntimeContext=>({frame,frameDomain:SOURCE.domain,rootFrame:6,lang:'en',scenario:'source-static-frame',seed:7,replay:0});
const clock=(id:string,revision=10)=>{const d=IN022_ACTIVITIES.find(a=>a.id===id)!;return{id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:d.endFrame,revision,status:'completed' as const};};
const ready=(s:In022Practice)=>reduceIn022Practice(drawIn022Question(s),{type:'timer-started'}).state;
function correct(s:In022Practice,revision=10){const q=currentIn022Question(s)!;for(let i=0;i<q.quotient;i++)s=reduceIn022Practice(s,{type:'skip'}).state;const result=reduceIn022Practice(s,{type:'done',revisionFloor:revision-1});assert.equal(result.state.mode,'correct-feedback');return reduceIn022Practice(result.state,{type:'feedback-complete',activity:clock(result.state.feedback!.id,revision)}).state;}
test('IN022 source grids shade only divisor multiples and quotient is child frame minus one',()=>{
 assert.deepEqual(SOURCE.questions.map(q=>[q.dividend,q.divisor,q.quotient,q.answerFrame]),[[14,7,2,3],[55,11,5,6],[16,4,4,5],[45,5,9,10],[64,8,8,9],[2,2,1,2],[45,9,5,6]]);
 assert.deepEqual(SOURCE.gridCells.map(c=>c.value),Array.from({length:100},(_,i)=>i+1));
 for(const q of SOURCE.questions){assert.equal(q.sourceFrames.length,q.answerFrame);for(const f of q.sourceFrames){assert.equal(f.frame,f.quotient+1);assert.deepEqual(f.shadedMultiples,Array.from({length:f.quotient},(_,i)=>(i+1)*q.divisor));}}
 assert.deepEqual(SOURCE.gridCells[7]!.sourceTextIds,['character-90/run-0','character-455/run-0']);
});
test('IN022 demonstration retains source quotient timing and mathematically correct multiples',()=>{
 assert.equal(in022Prelude(1).visible,false);assert.equal(in022Prelude(2).visible,true);assert.equal(in022Prelude(76).quotient,0);
 for(const [frame,quotient] of [[77,1],[85,2],[93,3],[101,4],[109,5],[117,6],[125,7]]){assert.equal(in022Prelude(frame!).quotient,quotient);assert.deepEqual(in022Prelude(frame!).multiples,Array.from({length:quotient!},(_,i)=>(i+1)*7));}
 // Source shape203 highlights43 at117..124; native intentionally retains the sixth multiple42.
 assert.deepEqual(in022Prelude(124).multiples,[7,14,21,28,35,42]);
 assert.equal(in022Prelude(153).quotient,0);assert.equal(in022Prelude(270).visible,true);assert.equal(in022Prelude(271).visible,false);
});
test('IN022 has a deterministic seven-question bag, indefinite refill and no artificial terminal',()=>{
 let a=createIn022Practice(7),b=createIn022Practice(7);const first:number[]=[],second:number[]=[];
 for(let i=0;i<14;i++){a=ready(a);b=ready(b);assert.deepEqual(a,b);assert.equal(a.quotient,0);(i<7?first:second).push(a.current!);assert.equal(a.bag.length,6-i%7);a=correct(a,10+i);b=correct(b,10+i);assert.equal(a.mode,'ready-for-new');assert.equal(a.correctCount,i+1);}
 assert.equal(new Set(first).size,7);assert.equal(new Set(second).size,7);assert.equal(a.draws,14);assert.equal(CAP.completion!.id,'in022-no-authored-practice-terminal');
 assert.deepEqual(CAP.completion!.frames,IN022_HOLDS);assert(CAP.frameControl!.transitions.every(e=>e.toFrame<=277));assert(!CAP.frameControl!.transitions.some(e=>e.toFrame===278||e.toFrame===279));
});
test('IN022 wrong close preserves counted multiples and keeps the source coach independent',()=>{
 let s=ready(createIn022Practice(7));const q=currentIn022Question(s)!;assert(q.quotient>1);s=reduceIn022Practice(s,{type:'skip'}).state;assert.equal(s.quotient,1);
 const result=reduceIn022Practice(s,{type:'done',revisionFloor:5});assert.equal(result.state.mode,'wrong');assert.deepEqual(result.activities,['in022-inactivity-reset',result.state.feedback!.id]);
 assert.equal(reduceIn022Practice(result.state,{type:'skip'}).state,result.state);assert.equal(drawIn022Question(result.state),result.state);
 const closed=reduceIn022Practice(result.state,{type:'close-wrong'});assert.equal(closed.state.quotient,1);assert.equal(closed.state.current,s.current);assert.equal(closed.state.mode,'answering');assert.deepEqual(closed.activities,['in022-skip-emphasis']);assert.equal(closed.state.correctCount,0);
 assert(!closed.activities.some(a=>a.startsWith('wrong-coach')));
});
test('IN022 Skip saturates, Done uses one atomic timer and feedback request, and only exact fresh completion unlocks New',()=>{
 let s=ready(createIn022Practice(7));const q=currentIn022Question(s)!;
 for(let i=0;i<q.quotient+3;i++){const r=reduceIn022Practice(s,{type:'skip'});if(i<q.quotient)assert.deepEqual(r.activities,['in022-inactivity-reset']);else assert.equal(r.state,s);s=r.state;}
 assert.equal(s.quotient,q.quotient);const done=reduceIn022Practice(s,{type:'done',revisionFloor:9});s=done.state;assert.equal(s.correctCount,1);assert.equal(done.activities.length,2);assert.equal(done.activities[0],'in022-inactivity-reset');assert.equal(drawIn022Question(s),s);
 const activity=clock(s.feedback!.id);for(const wrong of [{...activity,revision:9},{...activity,frame:activity.frame-1},{...activity,status:'playing' as const},{...activity,frameDomain:'sprite-1'}])assert.equal(reduceIn022Practice(s,{type:'feedback-complete',activity:wrong}).state,s);
 assert.equal(reduceIn022Practice(s,{type:'feedback-complete',activity}).state.mode,'ready-for-new');
});
test('IN022 four correct variants and four wrong coach source segments preserve exact visibility and lifetimes',()=>{
 validateLessonTextActivities(IN022_ACTIVITIES,279,12);validateLessonTextFrameControl(CAP.frameControl!,279);assert.equal(IN022_ACTIVITIES.length,13);
 assert.deepEqual(SOURCE.wrong.coachSegments.map(c=>[c.startFrame,c.endFrame]),[[3,16],[18,27],[31,36],[40,54]]);
 const coaches=IN022_ACTIVITIES.filter(a=>a.id.startsWith('wrong-coach'));assert.equal(new Set(coaches.map(a=>a.sourceInstanceId)).size,1);for(const c of coaches){assert.equal(c.audio!.firstFrame,3);assert.equal(c.audio!.lastFrame,55);}
 for(const d of SOURCE.correct){const s={...ready(createIn022Practice(7)),mode:'correct-feedback' as const,feedback:{id:d.id,revisionFloor:9}},a=clock(d.id);assert.equal(in022Feedback(s,[{...a,frame:d.visibleFrames[0]![0]-1,status:'playing'}]).visible,false);assert.equal(in022Feedback(s,[{...a,frame:d.visibleFrames[0]![0],status:'playing'}]).visible,true);assert.equal(in022Feedback(s,[{...a,revision:9}]).visible,false);}
 const button=IN022_ACTIVITIES.find(a=>a.buttonPress)!;assert.equal(button.buttonPress!.sourceButtonId,390);assert.match(button.sourceInstanceId!,/button-390\/record-10$/);assert.equal(SOURCE.terms.length,5);
});
test('IN022 source snapshot fails closed and native chart renders semantic text at source states',()=>{
 const context=ctx(100),state=IN022_MODULE.getFrameState(100,context),snapshot=in022Snapshot(state,context);assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.find(b=>b.id==='quotient')!.text,'3');
 for(const bad of [{...context,lang:'es' as const},{...context,rootFrame:7},{...context,scenario:'other'},{...context,seed:8},{...context,frame:99}])assert.equal(in022Snapshot(state,bad).status,'blocked');
 assert.equal(in022Snapshot({...state,sourceSwfSha256:'0'.repeat(64)},context).status,'blocked');
 const html=renderToStaticMarkup(<G3L4In022ModernRenderer {...context}/>);assert(!/<(?:canvas|img|image)\b/.test(html));assert.equal((html.match(/data-number=/g)??[]).length,100);assert.equal((html.match(/<td[^>]+data-shaded="true"/g)??[]).length,3);assert.match(html,/<math/);assert.match(html,/49 divided by 7 equals 3/);assert(!html.includes('Need More Help'));
 const practiceContext=ctx(277),practiceState=IN022_MODULE.getFrameState(277,practiceContext);assert.equal(in022Snapshot(practiceState,practiceContext).blocks.find(b=>b.id==='Q7')!.visible,true);assert.equal(IN022_BINDING.blocks.length,120);
});

test('IN022 source root title remains visible before the introduction and across every practice hold',()=>{
 assert.equal(SOURCE.rootTitle.text,'Division: Learn It');
 assert.deepEqual(SOURCE.rootTitle.sourceTextIds,['character-66/run-0']);
 for(const frame of [1,2,117,124,125,270,...IN022_HOLDS,279]){
  const context=ctx(frame),state=IN022_MODULE.getFrameState(frame,context),snapshot=in022Snapshot(state,context);
  assert.equal(snapshot.status,'ready');const title=snapshot.blocks.find(b=>b.id==='root-title')!;
  assert.equal(title.text,'Division: Learn It');assert.equal(title.visible,true);
  const html=renderToStaticMarkup(<G3L4In022ModernRenderer {...context}/>);
  assert.equal((html.match(/data-lesson-text-block="root-title"/g)??[]).length,1);
  assert.match(html,/<h2 class="in022-modern__title" data-lesson-text-block="root-title">Division: Learn It<\/h2>/);
  if(frame===1)assert(!html.includes('data-number='));
 }
});
test('IN022 restored title stays hidden for mismatched source, root, domain, language and replay context',()=>{
 const context=ctx(117),state=IN022_MODULE.getFrameState(117,context);
 const invalidContexts:RuntimeContext[]=[
  {...context,lang:'es'},{...context,rootFrame:7},{...context,frameDomain:'sprite-67'},
  {...context,scenario:'other'},{...context,seed:8},{...context,frame:118},
 ];
 for(const bad of invalidContexts){
  const snapshot=in022Snapshot(state,bad);assert.equal(snapshot.status,'blocked');
  assert(snapshot.blocks.every(b=>!b.visible));
  assert(!renderToStaticMarkup(<G3L4In022ModernRenderer {...bad} state={state}/>).includes('data-lesson-text-block="root-title"'));
 }
 const invalidStates=[
  {...state,sourceSwfSha256:'0'.repeat(64)},{...state,animationId:'course-g03-l04-in-023'},
  {...state,rootFrame:7},{...state,frameDomain:'sprite-67'},{...state,frame:118},
  {...state,language:'es' as const},{...state,scenario:'other'},{...state,seed:8},
 ];
 for(const bad of invalidStates){
  const snapshot=in022Snapshot(bad,context);assert.equal(snapshot.status,'blocked');
  assert(snapshot.blocks.every(b=>!b.visible));
  assert(!renderToStaticMarkup(<G3L4In022ModernRenderer {...context} state={bad}/>).includes('data-lesson-text-block="root-title"'));
 }
});
