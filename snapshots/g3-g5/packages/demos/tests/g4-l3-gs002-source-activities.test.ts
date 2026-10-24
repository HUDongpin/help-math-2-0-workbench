import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import type {AnimationRendererProps} from '../src/contract';
import type {LessonTextActivitySnapshot} from '../src/lesson-text-contract';
import {Gs002SourceActivitySession,GS002_SOURCE_ACTIVITIES,GS002_BUTTON_ACTIVITIES} from '../src/modern-lessons/g4-l3-gs002-source-activities';
import {validateLessonTextActivities} from '../src/lesson-text-frame-control';
import {createCourseG04L03Gs002InteractionState,reduceCourseG04L03Gs002Interaction as reduce} from '../src/timelines/course-g04-l03-gs-002-interaction';
const observation=(id:string,revision:number,frame:number,status:'playing'|'completed'='playing'):LessonTextActivitySnapshot=>({id,revision,frame,status,frameDomain:'sprite-69',sourceInstanceId:GS002_SOURCE_ACTIVITIES.find(d=>d.id===id)!.sourceInstanceId,cancellationToken:`observed-${revision}`});
function harness(){
 const requests:string[]=[],cancels:string[]=[];
 const runtime:AnimationRendererProps={frame:427,frameDomain:'sprite-321',scenario:'source-static-frame',seed:0,lang:'en',lessonActivities:[],
 onLessonActivityRequest:r=>{requests.push(r.id);return true;},onLessonActivityCancel:r=>{cancels.push(r.cancellationToken);return true;}};
 return {session:new Gs002SourceActivitySession(),runtime,requests,cancels};
}
test('source definitions preserve exact child entries and media ranges',()=>{
 validateLessonTextActivities(GS002_SOURCE_ACTIVITIES,428,12);
 assert.deepEqual(GS002_SOURCE_ACTIVITIES.map(d=>[d.frameDomain,d.startFrame,d.endFrame,d.audio?.firstFrame,d.audio?.lastFrame]),[
 ['sprite-69',2,35,12,35],['sprite-158',2,15,1,15],['sprite-319',1,186,3,186]]);
});
test('Close-only button definitions follow actual nested source placements and down states',()=>{
 const catalog=JSON.parse(gunzipSync(readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
 validateLessonTextActivities([...GS002_SOURCE_ACTIVITIES,...GS002_BUTTON_ACTIVITIES],428,12);
 assert.deepEqual(GS002_BUTTON_ACTIVITIES.map(d=>d.id),['gs002-button-help-close','gs002-button-feedback-close']);
 for(const [index,popup,depth,button,child] of [[0,164,383,11,10],[1,158,270,155,154]]){
  const timeline=(id:number)=>catalog.timelines.find((t:any)=>t.timelineId===`sprite-${id}`);
  const parent=timeline(321).events.find((e:any)=>e.kind==='place'&&e.characterId===popup&&e.depth===depth);
  const close=timeline(popup).events.find((e:any)=>e.kind==='place'&&e.characterId===button);
  const down=catalog.buttonDefinitions.find((b:any)=>b.characterId===button).statePlacements.find((p:any)=>p.characterId===child);
  assert.equal(parent.frame,427);assert.equal(close.frame,1);assert.equal(close.name.text,'BtnClose');
  assert.deepEqual(down.states,{up:false,over:false,down:true,hitTest:false});
  const definition=GS002_BUTTON_ACTIVITIES[index];
  assert.equal(definition.sourceInstanceId,`${parent.instanceId}/${close.instanceId}/${down.instanceId}`);
  assert.deepEqual(definition.buttonPress,{sourceButtonId:button});
  assert.deepEqual([definition.frameDomain,definition.startFrame,definition.endFrame],[`sprite-${child}`,1,5]);
  assert.deepEqual(definition.parentFrames,[427]);
 }
 assert.equal(catalog.timelines.some((t:any)=>t.events.some((e:any)=>e.kind==='place'&&e.characterId===19)),false,'unused popup19 is not promoted');
});
test('hit completes once only from a fresh observed revision at source35',()=>{
 const h=harness(),id='gs002-source-69',old=observation(id,4,35,'completed');
 const runtime={...h.runtime,lessonActivities:[old]};
 assert.equal(h.session.update(runtime,'hit-resolving'),false);
 assert.equal(h.session.update(runtime,'hit-resolving'),false);assert.equal(h.requests.length,1);
 assert.equal(h.session.update({...runtime,lessonActivities:[observation(id,5,34)]},'hit-resolving'),false);
 const done={...runtime,lessonActivities:[observation(id,5,35,'completed')]};
 assert.equal(h.session.update(done,'hit-resolving'),true);assert.equal(h.session.update(done,'hit-resolving'),false);
 h.session.update(done,'ready');assert.deepEqual(h.cancels,['observed-5']);
});
test('Close before request observation waits then cancels exact returned token; pause does not prevent cleanup',()=>{
 const h=harness();h.session.update(h.runtime,'feedback');
 h.session.update(h.runtime,'ready');assert.equal(h.cancels.length,0);
 h.session.update({...h.runtime,paused:true,lessonActivities:[observation('gs002-source-158',1,3)]},'ready');
 assert.deepEqual(h.cancels,['observed-1']);
 h.session.update({...h.runtime,paused:true},'expired');assert.equal(h.requests.length,1);
 h.session.update(h.runtime,'expired');assert.deepEqual(h.requests,['gs002-source-158','gs002-source-319']);
});
test('rejected start can retry without inventing an activity; modern feedback gets no source audio',()=>{
 const h=harness();h.session.update({...h.runtime,onLessonActivityRequest:()=>false},'feedback');
 h.session.update(h.runtime,'feedback');assert.equal(h.requests.length,1);
 const n=harness();n.session.update(n.runtime,'modern-feedback');assert.equal(n.requests.length,0);
});
test('source-controlled hit is not resolved by900ms or reduced visual timing; countdown still advances',()=>{
 let state=createCourseG04L03Gs002InteractionState(0);
 state=reduce(state,{type:'set-sign',sign:'+'});state=reduce(state,{type:'set-distance',value:'7'});state=reduce(state,{type:'submit-move'});
 for(let i=0;i<7;i++)state=reduce(state,{type:'movement-step'});
 assert.equal(state.mode,'hit-resolving');
 assert.equal(reduce(state,{type:'advance-time',elapsedMs:900}).mode,'ready','legacy default retained');
 const waiting=reduce(state,{type:'advance-time',elapsedMs:3000,sourceHitActivity:true});
 assert.equal(waiting.mode,'hit-resolving');assert.equal(waiting.timerDisplay,'00:03:57');assert.equal(waiting.score,1);
 const done=reduce(waiting,{type:'resolve-hit'});assert.equal(done.mode,'ready');assert.equal(done.score,1);
});
