import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createSession,planAction,admitPlan,newCompletionTicket,observeCompletion,completeSession,sessionIdentity,CORRECT_ACTIVITY,CORRECT_INSTANCE} from './interaction';

test('preserved reducer bytes and atomic sibling request on success',()=>{
 const bytes=readFileSync(new URL('../../timelines/course-g04-l03-in-006-number-line-jump-interaction.ts',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'c20803c992118ae3faea9954737b76dee63e95f87521b8112013c80859545239');
 let state=createSession(0);const first=planAction(state,{type:'place',magnitude:2},true)!;
 assert.deepEqual(first.activities,['in006-correct-coach']);state=admitPlan(first,{onLessonActivitiesRequest:()=>true})!;
 const success=planAction(state,{type:'place',magnitude:1},true)!;
 assert.deepEqual(success.activities,[CORRECT_ACTIVITY,'in006-correct-coach']);
 assert.equal(admitPlan(success,{onLessonActivitiesRequest:()=>false}),null);assert.equal(state.jump.currentValue,-9);
 let calls=0;state=admitPlan(success,{onLessonActivitiesRequest:req=>{calls++;assert.deepEqual(req.map(r=>r.parentFrame),[1054,1054]);return true;}})!;
 assert.equal(calls,1);assert.equal(state.jump.currentValue,-8);assert.equal(state.jump.outcome,'correct-feedback');
});

test('normal reverse is silent and target reverse requests both siblings',()=>{
 let state=createSession(1);for(const magnitude of [5,2] as const){
  state=planAction(state,{type:'place',magnitude},true)!.next;
  const reverse=planAction(state,{type:'reverse-last'},true)!;
  assert.deepEqual(reverse.activities,magnitude===2?[CORRECT_ACTIVITY,'in006-correct-coach']:[]);state=reverse.next;
 }
 assert.equal(state.jump.target,-15);assert.equal(state.jump.currentValue,-15);
});

test('wrong cycles deterministic branch only after admission; no user-injected completion or replay',()=>{
 let state=createSession(3);
 for(const expected of [4,1,2,3]){
  const plan=planAction(state,{type:'invalid-drop'},true)!;
  assert.deepEqual(plan.activities,[`in006-wrong-s${expected}`]);assert.equal(admitPlan(plan,{}),null);
  assert.equal(state.wrongSequence,expected===4?0:expected);
  state=admitPlan(plan,{onLessonActivitiesRequest:()=>true})!;
  state=planAction(state,{type:'close-wrong'},true)!.next;
 }
 assert.equal(planAction(state,{type:'feedback-complete'},true),null);
 assert.equal(planAction(state,{type:'replay'},true),null);
 assert.equal(planAction(state,{type:'clear'},false),null);
});

test('completion requires matching child identity, current generation and actual new terminal revision',()=>{
 let state=createSession(0);state=planAction(state,{type:'place',magnitude:2},true)!.next;state=planAction(state,{type:'place',magnitude:1},true)!.next;
 const ticket=newCompletionTicket(state,[]),event={id:CORRECT_ACTIVITY,sourceInstanceId:CORRECT_INSTANCE,frameDomain:'sprite-150',frame:24,revision:1,status:'playing' as const};
 let observation=observeCompletion(ticket,state,[event]);assert.equal(observation.completed,false);
 for(const invalid of [{...event,revision:0},{...event,revision:2},{...event,sourceInstanceId:'root/other'},{...event,frameDomain:'sprite-146'}])assert.equal(observeCompletion(observation.ticket,state,[{...invalid,frame:25,status:'completed'}]).completed,false);
 const done=observeCompletion(observation.ticket,state,[{...event,frame:25,status:'completed'}]);assert.equal(done.completed,true);
 assert.equal(observeCompletion({...done.ticket,handled:true},state,[{...event,frame:25,status:'completed'}]).completed,false);
 const cleared=planAction(state,{type:'clear'},true)!.next;assert.equal(observeCompletion(ticket,cleared,[{...event,frame:25,status:'completed'}]).completed,false);
 assert.equal(completeSession(state).jump.newNumberEnabled,true);assert.equal(cleared.jump.newNumberEnabled,false);
});

test('layout and frame movement do not change session identity; Replay and seed do',()=>{
 const props={seed:5,replay:0,lang:'en' as const,scenario:'source-static-frame',frameDomain:'sprite-151'};
 assert.equal(sessionIdentity({...props,frame:10} as typeof props),sessionIdentity({...props,frame:1054} as typeof props));
 assert.notEqual(sessionIdentity(props),sessionIdentity({...props,replay:1}));assert.notEqual(sessionIdentity(props),sessionIdentity({...props,seed:6}));
});
