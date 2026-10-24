import assert from 'node:assert/strict';
import test from 'node:test';
import type {LessonTextActivityDefinition} from './lesson-text-contract';
import {advanceSourceActivities,beginSourceClockActivity,beginSourceClockActivities,sourceActivitiesAtParentFrame,sourceActivityBlocksParent,releaseSourceButtonActivity,cancelSourceClockActivity} from './lesson-source-clock';
import {lessonTextActivityRequestAllowed,validateLessonTextActivities} from './lesson-text-frame-control';

const wrong:LessonTextActivityDefinition={id:'wrong-popup',sourceInstanceId:'root/animation_mc/animation/Pop1_mc',
  parentLifetime:{firstFrame:227,lastFrameExclusive:228},frameDomain:'sprite-90',parentFrames:[227],startFrame:2,endFrame:15,fps:12};
const coach:LessonTextActivityDefinition={...wrong,id:'correct-coach',sourceInstanceId:'root/animation_mc/animation/Coach_audio_2',frameDomain:'sprite-96',endFrame:20};
test('an explicit single source frame lasts one source tick without exposing an out-of-range frame; defaults remain unchanged',()=>{
  const hold:LessonTextActivityDefinition={...wrong,startFrame:60,endFrame:60,holdEndFrame:true};
  validateLessonTextActivities([hold],273,12);
  let state=beginSourceClockActivity([],hold,1)!;
  state=advanceSourceActivities(state,0);assert.equal(state[0]!.status,'playing');
  state=advanceSourceActivities(state,1000/12-.01);assert.equal(state[0]!.status,'playing');assert.equal(state[0]!.frame,60);
  state=advanceSourceActivities(state,.01);assert.equal(state[0]!.status,'completed');assert.equal(state[0]!.frame,60);
  assert.equal(advanceSourceActivities(beginSourceClockActivity([],{...hold,holdEndFrame:undefined},1)!,0)[0]!.status,'completed');
  assert.throws(()=>validateLessonTextActivities([{...hold,startFrame:59}],273,12));
  assert.throws(()=>validateLessonTextActivities([{...hold,holdEndFrame:false} as unknown as LessonTextActivityDefinition],273,12));
});
test('exact cancellation preserves siblings and rejects replaced, replayed and seek-stale tokens',()=>{
  const state=beginSourceClockActivities([],[wrong,coach],1)!.map(a=>({...a,cancellationToken:`epoch0:seek0:${a.revision}`}));
  const request={id:wrong.id,sourceInstanceId:wrong.sourceInstanceId,revision:1,cancellationToken:'epoch0:seek0:1',parentFrame:227};
  assert.deepEqual(cancelSourceClockActivity(state,request),[state[1]]);
  for(const change of [{revision:2},{sourceInstanceId:coach.sourceInstanceId},{cancellationToken:''},{cancellationToken:'epoch1:seek0:1'},{cancellationToken:'epoch0:seek1:1'},{id:'unknown'}])assert.equal(cancelSourceClockActivity(state,{...request,...change}),undefined);
  const replacement=state.map(a=>a.id===wrong.id?{...a,revision:3,cancellationToken:'epoch0:seek0:3'}:a);
  assert.equal(cancelSourceClockActivity(replacement,request),undefined);
  const completed=advanceSourceActivities(state,5000);
  assert.deepEqual(cancelSourceClockActivity(completed,request),[completed[1]]);
  assert.equal(state.length,2,'input remains immutable');
});
test('one elapsed interval advances both source instances and restarts only the addressed MovieClip',()=>{
  validateLessonTextActivities([wrong,coach],273,12);
  let state=beginSourceClockActivity([],wrong,1)!;
  state=advanceSourceActivities(state,250);assert.equal(state[0]!.frame,5);
  state=beginSourceClockActivity(state,coach,2)!;
  state=advanceSourceActivities(state,250);assert.deepEqual(state.map(item=>item.frame),[8,5]);
  assert.equal(sourceActivityBlocksParent(state),false);
  state=beginSourceClockActivity(state,wrong,3)!;
  assert.equal(state.find(item=>item.id===coach.id)!.frame,5);
  assert.equal(state.find(item=>item.id===wrong.id)!.frame,2);
  assert.equal(sourceActivitiesAtParentFrame(state,227).length,2);
  assert.equal(sourceActivitiesAtParentFrame(state,228).length,0);
});
test('unannotated activities retain exclusive parent hold, and stale source Close cannot cross instances',()=>{
  const primary={...wrong,sourceInstanceId:undefined,parentLifetime:undefined};
  const state=beginSourceClockActivity([],primary,1)!;
  assert.equal(sourceActivityBlocksParent(state),true);
  assert.equal(beginSourceClockActivity(state,coach,2),undefined);
  const parallel=beginSourceClockActivity([],wrong,2)!;
  assert.equal(lessonTextActivityRequestAllowed([wrong,coach],{id:coach.id,parentFrame:227},{frame:227,capture:false,activities:parallel})?.id,coach.id);
  assert.equal(lessonTextActivityRequestAllowed([wrong,coach],{id:coach.id,parentFrame:227,fromActivity:{id:wrong.id,revision:2}},{frame:227,capture:false,activities:parallel}),undefined);
  assert.equal(lessonTextActivityRequestAllowed([wrong],{id:wrong.id,parentFrame:227},{frame:227,capture:true,activities:parallel}),undefined);
});
test('concurrent source instances require a bounded placement lifetime containing every admission frame',()=>{
  for(const change of [{parentLifetime:undefined},{sourceInstanceId:'unknown'},{parentLifetime:{firstFrame:228,lastFrameExclusive:274}},
    {parentLifetime:{firstFrame:227,lastFrameExclusive:275}}]) assert.throws(()=>validateLessonTextActivities([{...wrong,...change}],273,12));
});


test('one source event starts score and feedback together or leaves both unstarted',()=>{
  const old=advanceSourceActivities(beginSourceClockActivity([],wrong,1)!,250);
  const copy=JSON.stringify(old);
  const batch=beginSourceClockActivities(old,[wrong,coach],10)!;
  assert.equal(batch.length,2);assert.deepEqual(batch.map(a=>[a.frame,a.revision]),[[2,10],[2,11]]);
  const impossible={...coach,entryFromActivity:{id:'never-started',firstFrame:2,lastFrame:10}};
  assert.equal(beginSourceClockActivities(old,[wrong,impossible],10),undefined);
  assert.equal(JSON.stringify(old),copy,'Rejected event cannot partially restart wrong popup');
  assert.equal(beginSourceClockActivities(old,[wrong,wrong],10),undefined);
  assert.equal(beginSourceClockActivities(old,[],10),undefined);
  assert.equal(beginSourceClockActivities([],[{...wrong,sourceInstanceId:undefined,parentLifetime:undefined},coach],10),undefined);
});


test('button release cancels only its matching press, including a press released before the first clock tick',()=>{
  const down={...wrong,id:'close-button-down',buttonPress:{sourceButtonId:137},startFrame:1,endFrame:5};
  validateLessonTextActivities([down],273,12);
  const active=beginSourceClockActivity([],down,1)!.map(a=>({...a,pressToken:'first-press'}));
  assert.equal(releaseSourceButtonActivity(active,down.id,'old-press'),undefined);
  assert.deepEqual(releaseSourceButtonActivity(active,down.id,'first-press'),[]);
  const next=beginSourceClockActivity(active,down,2)!.map(a=>({...a,pressToken:'new-press'}));
  assert.equal(releaseSourceButtonActivity(next,down.id,'first-press'),undefined);
  assert.deepEqual(releaseSourceButtonActivity(next,down.id,'new-press'),[]);
  assert.equal(releaseSourceButtonActivity(beginSourceClockActivity([],wrong,3)!,wrong.id,'first-press'),undefined,'A popup without source button-down metadata cannot be released as a button');
});
