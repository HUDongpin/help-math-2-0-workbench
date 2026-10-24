import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {validateLessonTextActivities,lessonTextActivityRequestAllowed,validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {beginSourceClockActivity,advanceSourceActivities,cancelSourceClockActivity,sourceActivitiesAtParentFrame} from '../lesson-source-clock';
import {createCourseG04L03Vb003InteractionState,reduceCourseG04L03Vb003Interaction} from '../timelines/course-g04-l03-vb-003-interaction';
import {getCourseG04L03Vb003FrameState} from '../modules/course-g04-l03-vb-003';
import {G4_L3_VB003_NATIVE_CONFIG as C} from './generated/g4-l3-vb003-native-config';
import {createVb003Session,selectVb003Card,dropVb003Card,bindVb003Feedback,observeVb003Feedback,closeVb003Wrong,finishVb003Feedback,synchronizeVb003Session,getVb003TeachingState,getG4L3Vb003TextSnapshot,G4L3Vb003ModernRenderer,G4_L3_VB003_TEXT_PRESENTATION as P,type Vb003Session} from './g4-l3-vb003';
const runtime=(extra:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame:116,frameDomain:'sprite-106',rootFrame:6,lang:'en',seed:13,replay:0,scenario:'source-static-frame',onLessonActivityRequest:()=>true,onLessonActivityCancel:()=>true,onLessonFrameRequest:()=>true,...extra});
function seen(s:Vb003Session,frame?:number,revision=1,status:LessonTextActivitySnapshot['status']='playing'):LessonTextActivitySnapshot{
 const def=C.activities.find(a=>a.id===s.pending!.id)!;return{id:def.id,sourceInstanceId:def.sourceInstanceId,frameDomain:def.frameDomain,frame:frame??def.endFrame,revision,status,cancellationToken:'clock-'+revision};
}
function bind(s:Vb003Session,revision=1){return bindVb003Feedback(s,runtime({lessonActivities:[seen(s,undefined,revision)]}));}
function complete(s:Vb003Session,revision=1){s=bind(s,revision);return finishVb003Feedback(s,runtime({lessonActivities:[seen(s,undefined,revision,'completed')]}));}
test('exact cached 45 definitions and 61 runs retain source dispositions, not inferred lesson names',()=>{
 const root=process.env.VB003_SOURCE_ROOT!;assert(root);const asset=JSON.parse(gunzipSync(fs.readFileSync(path.join(root,'catalog/typography-v1/source-catalog/assets/'+C.sourceSwfSha256+'.json.gz'))).toString());
 assert.equal(asset.textDefinitions.length,45);assert.equal(asset.textDefinitions.reduce((n:number,d:{runs:unknown[]})=>n+d.runs.length,0),61);assert.equal(C.sourceTextDispositions.length,45);
 for(const d of asset.textDefinitions){const role=C.sourceTextDispositions.find(r=>r.characterId===d.characterId)!;assert.equal(role.sourceTagSha256,d.sourceTagSha256);assert.equal(role.literal,d.runs.map((r:{text:string})=>r.text).join(''));assert.deepEqual(role.sourceTextIds,d.runs.map((r:{sourceTextId:string})=>r.sourceTextId));}
 assert.equal(C.sourceTextDispositions.filter(r=>r.nativeBindingBlocks.length).length,33);assert.equal(C.title,'Negative Numbers: Important Words');assert.deepEqual(C.cards.map(c=>[c.id,c.sourceLiteral,c.value]),[['2','–2',-2],['3','2',2],['4','0',0],['5','–5',-5],['6','5',5]]);
 assert.deepEqual(C.ticks.map(t=>t.literal),['–8','–7','–6','–5','–4','–3','–2','–1','0','+1','+2','+3','+4','+5','+6','+7','+8']);assert.equal(C.fixedDemo.literal,'–7');assert(!C.cards.some(c=>(c.value as number)===-7));
});
test('source alpha and fixed demonstration boundary frames remain distinct from activity hold',()=>{
 assert.equal(getVb003TeachingState(4).axisAlpha,0);assert(getVb003TeachingState(5).axisAlpha>0);assert.equal(getVb003TeachingState(8).axisAlpha,1);assert.equal(getVb003TeachingState(43).instructionAlpha,0);assert(getVb003TeachingState(44).instructionAlpha>0);assert.equal(getVb003TeachingState(52).instructionAlpha,1);
 assert.equal(getVb003TeachingState(75).phase,'origin');assert.equal(getVb003TeachingState(76).phase,'moving');assert.equal(getVb003TeachingState(85).phase,'moving');assert.equal(getVb003TeachingState(86).phase,'placed');for(let f=76;f<86;f++)assert.equal(getVb003TeachingState(f).annotation,f%2===0);
 assert.equal(getVb003TeachingState(115).interactive,false);assert.equal(getVb003TeachingState(116).interactive,true);assert.equal(getVb003TeachingState(117).interactive,false);
});
test('outside and occupied-other target are source mismatches; same card is counted once',()=>{
 let q=createCourseG04L03Vb003InteractionState();q=reduceCourseG04L03Vb003Interaction(q,{type:'drop-item',itemId:'2',targetId:'2'});assert.deepEqual(q.placedItemIds,['2']);assert.equal(reduceCourseG04L03Vb003Interaction(q,{type:'drop-item',itemId:'2',targetId:'2'}),q);q=reduceCourseG04L03Vb003Interaction(q,{type:'correct-feedback-finished'});
 for(const target of [null,'2'] as const){const wrong=reduceCourseG04L03Vb003Interaction(q,{type:'drop-item',itemId:'3',targetId:target});assert.equal(wrong.mode,'wrong-feedback');assert.deepEqual(wrong.placedItemIds,['2']);assert.equal(wrong.attemptedTargetId,target);assert.equal(reduceCourseG04L03Vb003Interaction(wrong,{type:'close-wrong-feedback'}).mode,'ready');}
});
test('refused host request changes no count, selection, activity ownership or quiz mode',()=>{
 const s=selectVb003Card(createVb003Session(13),'2',runtime());
 for(const target of ['2','3',null] as const)assert.equal(dropVb003Card(s,undefined,target,runtime({onLessonActivityRequest:()=>false})),s);
 for(const extra of [{paused:true},{seed:14},{replay:1},{frame:115},{rootFrame:1},{lang:'es' as const},{entryStateSha256:'capture'},{onLessonFrameRequest:undefined},{onLessonActivityCancel:undefined}])assert.equal(dropVb003Card(s,'2','2',runtime(extra)),s);
});
test('Close is valid during local2 and at16, cancels exact current revision/token without outro',()=>{
 for(const f of [2,8,16]){let s=dropVb003Card(createVb003Session(13),'2',null,runtime());s=bind(s,7);const a=seen(s,f,7,f===16?'completed':'playing');let cancel:unknown;const next=closeVb003Wrong(s,runtime({lessonActivities:[a],onLessonActivityCancel:r=>{cancel=r;return true;}}));assert.deepEqual(cancel,{id:a.id,sourceInstanceId:a.sourceInstanceId,revision:7,cancellationToken:'clock-7',parentFrame:116});assert.equal(next.quiz.mode,'ready');assert.equal(next.pending,null);assert.equal(next.quiz.placedItemIds.length,0);
  assert.equal(closeVb003Wrong(s,runtime({lessonActivities:[a],onLessonActivityCancel:()=>false})),s);
  for(const wrong of [{...a,revision:8},{...a,cancellationToken:'clock-8'},{...a,sourceInstanceId:'sibling'},{...a,frame:1}])assert.equal(closeVb003Wrong(s,runtime({lessonActivities:[wrong]})),s);
 }
});
test('Wrong16 waits for Close; no activity complete or reduced timer silently retries',()=>{
 let s=dropVb003Card(createVb003Session(13),'2','3',runtime({reducedMotion:true}));s=bind(s);assert.equal(finishVb003Feedback(s,runtime({reducedMotion:true,lessonActivities:[seen(s,16,1,'completed')]})),s);
});
test('five successes use actual coach20, fifth final25, then exact main117 continuation',()=>{
 let s=createVb003Session(13),calls:string[]=[];
 for(const card of C.cards){s=dropVb003Card(s,card.id,card.id,runtime({onLessonActivityRequest:r=>{calls.push(r.id);return true;}}));s=bind(s,calls.length);const before=s;
  assert.equal(finishVb003Feedback(s,runtime({lessonActivities:[seen(s,19,calls.length,'playing')]})),s);
  s=finishVb003Feedback(s,runtime({lessonActivities:[seen(s,20,calls.length,'completed')],onLessonActivityRequest:r=>{calls.push(r.id);return true;}}));assert.notEqual(s,before);
 }
 assert.deepEqual(calls,['vb003-coach','vb003-coach','vb003-coach','vb003-coach','vb003-coach','vb003-final']);assert.equal(s.quiz.placedItemIds.length,5);assert.equal(s.pending!.id,'vb003-final');s=bind(s,6);let edge:unknown;
 assert.equal(finishVb003Feedback(s,runtime({lessonActivities:[seen(s,24,6,'playing')]})),s);
 assert.equal(finishVb003Feedback(s,runtime({lessonActivities:[seen(s,25,6,'completed')],onLessonFrameRequest:()=>false})),s);
 const next=finishVb003Feedback(s,runtime({lessonActivities:[seen(s,25,6,'completed')],onLessonFrameRequest:r=>{edge=r;return true;}}));assert.deepEqual(edge,{fromFrame:116,toFrame:117,stopFrame:160});assert(next.continued);assert.equal(next.pending,null);assert.equal(finishVb003Feedback(next,runtime()),next);
 for(const frame of [117,160])assert.equal(synchronizeVb003Session(next,runtime({frame})).quiz.placedItemIds.length,5);
});
test('fifth final host refusal cannot consume the coach completion; retry remains revision-bound',()=>{
 let s=createVb003Session(13);for(const c of C.cards.slice(0,4))s=complete(dropVb003Card(s,c.id,c.id,runtime()));s=bind(dropVb003Card(s,'6','6',runtime()),5);const a=seen(s,20,5,'completed');assert.equal(finishVb003Feedback(s,runtime({lessonActivities:[a],onLessonActivityRequest:()=>false})),s);assert.equal(s.quiz.mode,'correct-feedback');assert.equal(s.pending!.id,'vb003-coach');assert.equal(finishVb003Feedback(s,runtime({lessonActivities:[{...a,revision:6}]})),s);
});
test('Replay, seek away and same-frame canceled token detach pending state and card count',()=>{
 const s=bind(dropVb003Card(createVb003Session(13),'2','2',runtime()));
 for(const extra of [{replay:1},{seed:14},{frame:115},{frame:117},{frameDomain:'root'}]){const next=synchronizeVb003Session(s,runtime(extra),[seen(s)]);assert.equal(next.pending,null);assert.equal(next.quiz.placedItemIds.length,0);}
 const canceled=synchronizeVb003Session(s,runtime(),[]);assert.equal(canceled.pending,null);assert.equal(canceled.quiz.placedItemIds.length,0);assert.equal(observeVb003Feedback(s,[{...seen(s),cancellationToken:'replacement'}]).bound,false);
});
test('real source clock and existing request/cancel contracts accept configured paths and remove children at117',()=>{
 validateLessonTextActivities(C.activities,160,12);validateLessonTextFrameControl(P.frameControl!,160);const d=C.activities.find(d=>d.id==='vb003-wrong')!;
 assert.equal(lessonTextActivityRequestAllowed(C.activities,{id:d.id,parentFrame:116},{frame:116,capture:false}),d);assert.equal(lessonTextActivityRequestAllowed(C.activities,{id:d.id,parentFrame:115},{frame:115,capture:false}),undefined);
 let clock=beginSourceClockActivity([],d,1)!;clock=advanceSourceActivities(clock,14*1000/12);assert.equal(clock[0].frame,16);assert.equal(clock[0].status,'completed');assert.equal(sourceActivitiesAtParentFrame(clock,117).length,0);
 clock=clock.map(a=>({...a,cancellationToken:'native-clock-token'}));assert.equal(cancelSourceClockActivity(clock,{id:d.id,sourceInstanceId:d.sourceInstanceId,revision:2,cancellationToken:'native-clock-token',parentFrame:116}),undefined);assert.deepEqual(cancelSourceClockActivity(clock,{id:d.id,sourceInstanceId:d.sourceInstanceId,revision:1,cancellationToken:'native-clock-token',parentFrame:116}),[]);
});
test('source feedback offsets preserve wrong origin1/goto2 and independent press1/coach2',()=>{
 const wrong=C.activities[0].audio!,coach=C.activities[1].audio!,press=C.activities[3].audio!;assert.equal(wrong.firstFrame,1);assert.equal(coach.firstFrame,2);assert.equal(press.firstFrame,1);for(const a of [wrong,coach,press])assert.equal(a.offsetSeconds,1673/22050);
 assert.equal(wrong.offsetSeconds+1/12,0.15920634920634919);assert.equal('audio' in C.activities[2],false);assert.equal(C.sourceAudio.frame,6);assert.equal(C.sourceAudio.endFrame,161);assert.equal(C.sourceAudio.language,'en');assert.equal(P.reducedMotionFrameByDomain!['sprite-106'],116);
});
test('deterministic source identity guards; enlarged native atomic labels and paused glossary stay selectable',()=>{
 const r=runtime({onLessonHostRequest:()=>undefined}),source=getCourseG04L03Vb003FrameState(116,r);const a=getG4L3Vb003TextSnapshot(source,r);assert.deepEqual(a,getG4L3Vb003TextSnapshot(source,r));assert.equal(a.status,'ready');
 for(const extra of [{rootFrame:1},{lang:'es' as const},{seed:14},{frame:115},{entryStateSha256:'capture'}])assert.equal(getG4L3Vb003TextSnapshot(source,{...r,...extra}).status,'blocked');
 const html=renderToStaticMarkup(React.createElement(G4L3Vb003ModernRenderer,{...r,paused:true}));assert.match(html,/data-lesson-text-block="tick--8"/);assert.match(html,/>–<span class="six-choice-modern__numeric-token">8<\/span>/);assert.match(html,/>\+<span class="six-choice-modern__numeric-token">8<\/span>/);assert.equal((html.match(/data-vb003-card=/g)??[]).length,5);assert.doesNotMatch(html,/<canvas|<foreignObject|setTimeout/);
 const term=(html.match(/<button[^>]*data-source-keyterm[^>]*>/)??[])[0];assert(term);assert.doesNotMatch(term,/disabled/);assert.match(term,/en-0424-79116d5cfb19/);
});


test('same-frame seek after completed coach resets partial count; ordinary hold keeps that exact child',()=>{
 const awaiting=bind(dropVb003Card(createVb003Session(13),'2','2',runtime()),7),a=seen(awaiting,20,7,'completed');
 const ready=finishVb003Feedback(awaiting,runtime({lessonActivities:[a]}));assert.equal(ready.pending,null);assert.equal(ready.quiz.placedItemIds.length,1);assert.deepEqual(ready.completedCoach,a);
 assert.equal(synchronizeVb003Session(ready,runtime(),[a]),ready);
 for(const all of [[],[{...a,revision:8}],[{...a,cancellationToken:'replacement'}]]){const reset=synchronizeVb003Session(ready,runtime(),all);assert.equal(reset.quiz.placedItemIds.length,0);assert.equal(reset.pending,null);}
 const selected=selectVb003Card(ready,'3',runtime({lessonActivities:[a]}));const wrong=bind(dropVb003Card(selected,'3','2',runtime({lessonActivities:[a]})),8),w=seen(wrong,16,8,'completed');const closed=closeVb003Wrong(wrong,runtime({lessonActivities:[a,w]}));assert.equal(synchronizeVb003Session(closed,runtime(),[a]),closed);assert.equal(closed.quiz.placedItemIds.length,1);
 const html=renderToStaticMarkup(React.createElement(G4L3Vb003ModernRenderer,runtime()));assert.match(html,/class="lesson-text-presentation"/);assert.match(html,/class="lesson-text-presentation__block lesson-text-presentation__block--title"/);assert.doesNotMatch(html,/font:700 2\.25rem|font-size:1\.75rem/);
});
