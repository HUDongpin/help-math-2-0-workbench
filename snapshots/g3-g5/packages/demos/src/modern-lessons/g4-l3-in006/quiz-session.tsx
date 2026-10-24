'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from '../../contract';
import type {CourseG04L03In006JumpMagnitude} from '../../timelines/course-g04-l03-in-006-number-line-jump-interaction';
import {G4L3In006QuizPresentation} from './quiz';
import {getIn006Snapshot} from './snapshot';
import {getCourseG04L03In006FrameState} from '../../modules/course-g04-l03-in-006';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {createSession,planAction,admitPlan,newCompletionTicket,observeCompletion,completeSession,sessionIdentity,QUIZ_FRAME,DOMAIN,type JumpAction,type CompletionTicket} from './interaction';
export const COMPLETION_ID='g4-l3-in006-question-completed';
export interface QuizSessionProps {runtime:AnimationRendererProps;sourceReady:boolean;}
function Session({runtime,sourceReady}:QuizSessionProps) {
 const [session,setSession]=useState(()=>createSession(runtime.seed));
 const current=useRef(session);current.current=session;
 const [selected,setSelected]=useState<CourseG04L03In006JumpMagnitude|null>(null);
 const [focus,setFocus]=useState<string|null>(null),root=useRef<HTMLDivElement>(null);
 const ticket=useRef<CompletionTicket|null>(null),completionSent=useRef(false);
 const activities=runtime.lessonActivities??(runtime.lessonActivity?[runtime.lessonActivity]:[]);
 const sourceState=(runtime.state??getCourseG04L03In006FrameState(runtime.frame,runtime)) as SourceStaticCanvasFrameState;
 const snapshot=getIn006Snapshot(sourceState,{...runtime,frameDomain:runtime.frameDomain??DOMAIN},session.jump);
 const live=sourceReady&&snapshot.status==='ready'&&runtime.frame===QUIZ_FRAME&&(runtime.frameDomain??DOMAIN)===DOMAIN
   &&!runtime.entryStateSha256&&!runtime.paused&&typeof runtime.onLessonActivitiesRequest==='function';
 const commit=(next:typeof session)=>{current.current=next;setSession(next);};
 useLayoutEffect(()=>{
  if(!focus)return;const element=root.current?.querySelector<HTMLButtonElement>(`[data-in006-focus-control="${focus}"]`);
  if(element&&!element.disabled){element.focus();setFocus(null);}
 },[focus,session.jump.outcome,live]);
 useEffect(()=>{
  if(!live||!ticket.current)return;
  const result=observeCompletion(ticket.current,current.current,activities);ticket.current=result.ticket;
  if(!result.completed)return;
  ticket.current={...result.ticket,handled:true};commit(completeSession(current.current));setFocus('new-number');
 },[live,activities]);
 useEffect(()=>{
  if(!live||session.jump.outcome!=='complete'||completionSent.current||!runtime.onLessonCompletionRequest)return;
  completionSent.current=runtime.onLessonCompletionRequest({id:COMPLETION_ID,frameDomain:DOMAIN,frame:QUIZ_FRAME,seed:runtime.seed,replay:runtime.replay??0});
 },[live,session.jump.outcome,runtime.onLessonCompletionRequest,runtime.seed,runtime.replay]);
 const action=(requested:JumpAction)=>{
  const plan=planAction(current.current,requested,live);if(!plan)return;
  // Capture the floor BEFORE calling the host, which may publish synchronously.
  const nextTicket=plan.awaitsCompletion?newCompletionTicket(current.current,activities):null;
  let next=admitPlan(plan,runtime);if(!next)return;
  if(plan.awaitsCompletion){
   setSelected(null);
   if(runtime.reducedMotion){next=completeSession(next);ticket.current=null;setFocus('new-number');}
   else{ticket.current=nextTicket;setFocus('clear');}
  } else if(requested.type==='clear'||requested.type==='new-number'){
   ticket.current=null;setSelected(null);setFocus('jump-1');
  } else if(next.jump.outcome==='wrong')setFocus('close-wrong');
  else if(requested.type==='close-wrong')setFocus(selected===null?'jump-1':`jump-${selected}`);
  commit(next);
 };
 if(runtime.frame!==QUIZ_FRAME)return null;
 return <div ref={root} data-in006-snapshot-status={snapshot.status} data-in006-session-generation={session.generation} data-in006-question-revision={session.jump.questionRevision} data-in006-source-activities={JSON.stringify(activities)}>
  <G4L3In006QuizPresentation runtime={runtime} interaction={session.jump} interactive={live} selectedMagnitude={selected} onSelect={m=>{if(live)setSelected(m);}} onAction={action}/>
 </div>;
}
/** Frame/layout changes preserve the session. Replay, locale and source context replace it. */
export function G4L3In006QuizSession(props:QuizSessionProps){return <Session key={sessionIdentity(props.runtime)} {...props}/>;}
