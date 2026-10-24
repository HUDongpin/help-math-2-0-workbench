import assert from 'node:assert/strict';
import test from 'node:test';
import {lessonTextActivityRequestAllowed, lessonTextFrameRequestAllowed, validateLessonTextActivities, validateLessonTextFrameControl} from './lesson-text-frame-control';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot} from './lesson-text-contract';

const control = {frameDomain:'sprite-348',completionFrame:747,transitions:[
  {fromFrame:295,toFrame:296,stopFrame:434},
  {fromFrame:434,toFrame:435,stopFrame:550},
  {fromFrame:550,toFrame:551,stopFrame:659},
  {fromFrame:659,toFrame:660,stopFrame:728},
  {fromFrame:728,toFrame:729,stopFrame:747},
]};

test('exact authored transitions are accepted only at their source stop', () => {
  validateLessonTextFrameControl(control,747);
  for(const transition of control.transitions){
    assert.equal(lessonTextFrameRequestAllowed(control,transition,{frame:transition.fromFrame,frameDomain:'sprite-348',capture:false}),true);
    assert.equal(lessonTextFrameRequestAllowed(control,transition,{frame:transition.fromFrame-1,frameDomain:'sprite-348',capture:false}),false);
    assert.equal(lessonTextFrameRequestAllowed(control,{...transition,stopFrame:747},{frame:transition.fromFrame,frameDomain:'sprite-348',capture:false}),transition.stopFrame===747);
  }
});

test('source evidence capture and another timeline cannot request modern continuation', () => {
  const transition=control.transitions[0]!;
  assert.equal(lessonTextFrameRequestAllowed(control,transition,{frame:295,frameDomain:'sprite-348',capture:true}),false);
  assert.equal(lessonTextFrameRequestAllowed(control,transition,{frame:295,frameDomain:'root',capture:false}),false);
  assert.equal(lessonTextFrameRequestAllowed(undefined,transition,{frame:295,frameDomain:'sprite-348',capture:false}),false);
});

test('invalid, duplicate and out-of-source transition metadata is rejected before loading a page', () => {
  assert.throws(()=>validateLessonTextFrameControl({...control,completionFrame:748},747));
  assert.throws(()=>validateLessonTextFrameControl({...control,transitions:[...control.transitions,control.transitions[0]!]},747));
  assert.throws(()=>validateLessonTextFrameControl({...control,transitions:[{fromFrame:295,toFrame:296,stopFrame:295}]},747));
  assert.throws(()=>validateLessonTextFrameControl({...control,transitions:[{fromFrame:0,toFrame:296,stopFrame:434}]},747));
  assert.throws(()=>validateLessonTextFrameControl({...control,frameDomain:'some-movie'},747));
});

const activities: readonly LessonTextActivityDefinition[] = [
  {id:'wrong-1',frameDomain:'sprite-195',startFrame:2,endFrame:22,fps:12,parentFrames:[728]},
  {id:'wrong-1-outro',frameDomain:'sprite-195',startFrame:23,endFrame:28,fps:12,parentFrames:[728],
    entryFromActivity:{id:'wrong-1',firstFrame:14,lastFrame:22}},
  {id:'correct-1',frameDomain:'sprite-294',startFrame:2,endFrame:27,fps:12,parentFrames:[728]},
];
const active = (frame:number, status:'playing'|'completed'='playing'):LessonTextActivitySnapshot =>
  ({id:'wrong-1',frameDomain:'sprite-195',frame,revision:3,status});
const closeRequest={id:'wrong-1-outro',parentFrame:728,fromActivity:{id:'wrong-1',revision:3}};

test('authored Close can enter its outro while feedback plays or at its source stop',()=>{
  validateLessonTextActivities(activities,747,12);
  for(const frame of [14,17,21,22]) assert.equal(lessonTextActivityRequestAllowed(activities,closeRequest,
    {frame:728,capture:false,activity:active(frame,frame===22?'completed':'playing')})?.id,'wrong-1-outro');
  assert.equal(lessonTextActivityRequestAllowed(activities,closeRequest,{frame:728,capture:false,activity:active(13)}),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,closeRequest,{frame:728,capture:false,activity:active(23)}),undefined);
});

test('stale replay tokens, wrong child, direct outro and capture cannot use an authored Close edge',()=>{
  const current={frame:728,capture:false,activity:active(17)};
  assert.equal(lessonTextActivityRequestAllowed(activities,{...closeRequest,fromActivity:{id:'wrong-1',revision:2}},current),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,{...closeRequest,fromActivity:{id:'correct-1',revision:3}},current),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,{id:'wrong-1-outro',parentFrame:728},current),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,closeRequest,{...current,activity:undefined}),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,closeRequest,{...current,capture:true}),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,closeRequest,{...current,frame:727}),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,{id:'correct-1',parentFrame:728},current),undefined);
  assert.equal(lessonTextActivityRequestAllowed(activities,{id:'wrong-1',parentFrame:728},{frame:728,capture:false})?.id,'wrong-1');
});

test('an activity entry edge must bind one declared source segment, its exact domain and parent state',()=>{
  const outro=activities[1]!;
  for(const changed of [
    {...outro,entryFromActivity:{id:'missing',firstFrame:14,lastFrame:22}},
    {...outro,entryFromActivity:{id:'wrong-1',firstFrame:1,lastFrame:22}},
    {...outro,entryFromActivity:{id:'wrong-1',firstFrame:14,lastFrame:23}},
    {...outro,frameDomain:'sprite-294'}, {...outro,parentFrames:[727]}, {...outro,startFrame:22},
  ]) assert.throws(()=>validateLessonTextActivities([activities[0]!,changed],747,12),/entry edge/);
});


test('activity media origins are optional finite nonnegative seconds, not unvalidated metadata',()=>{
  const withOffset=(offsetSeconds:unknown):LessonTextActivityDefinition=>({...activities[0]!,audio:{
    source:'/audio/feedback.mp3',sha256:'a'.repeat(64),language:'shared',firstFrame:1,lastFrame:22,offsetSeconds:offsetSeconds as number}});
  for(const value of [undefined,0,1673/22050,.5]) assert.doesNotThrow(()=>validateLessonTextActivities([withOffset(value)],747,12));
  for(const value of [-1,NaN,Infinity,-Infinity,'0',null,{},true]) assert.throws(()=>validateLessonTextActivities([withOffset(value)],747,12),/source activity audio/);
});


test('extractor placement identities retain exact nesting and reject incomplete or malformed paths', async () => {
  const {IN008_PRESENTATION}=await import('./modern-lessons/g4-l3-in008');
  const actual=IN008_PRESENTATION.activityTimelines!;
  assert.doesNotThrow(()=>validateLessonTextActivities(actual,217,12));
  validateLessonTextFrameControl(IN008_PRESENTATION.frameControl!,217);
  const base=actual[0]!;
  for(const sourceInstanceId of[
    'sprite-57/depth-49', 'sprite-57/generation-1/depth-49',
    'sprite-57/depth-49/generation-1/sprite-52',
    'sprite-57/depth-49/generation-1/depth-1/generation-1',
    'sprite-57/depth-49/generation-1/button-49',
    'sprite-57/depth-49/generation-1/record-10/button-49',
    'sprite-57/depth-49/generation-1/../button-49/record-10',
    'sprite-57/depth--49/generation-1', 'sprite-57/depth-49/generation-1?x',
  ]) assert.throws(()=>validateLessonTextActivities([{...base,sourceInstanceId}],217,12),/source activity instance/);
  assert.throws(()=>validateLessonTextActivities([{...base,parentLifetime:{firstFrame:216,lastFrameExclusive:219}}],217,12),/source activity lifetime/);
  assert.throws(()=>validateLessonTextActivities([base,{...base,id:'conflicting-coach',frameDomain:'sprite-54'}],217,12),/Conflicting modern lesson source instance/);
});
