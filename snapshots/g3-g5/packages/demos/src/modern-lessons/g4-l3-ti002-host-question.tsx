'use client';
import React,{useLayoutEffect,useReducer,useRef,useState}from'react';
import type{AnimationRendererProps}from'../contract';
import{createCourseG04L03Ti002KeyTermDragState as create,reduceCourseG04L03Ti002KeyTermDrag as reduce,type CourseG04L03Ti002KeyTermDragAction as Action}from'../timelines/course-g04-l03-ti-002-key-term-drag-interaction';
import{createTi002FeedbackController}from'./g4-l3-ti002-feedback-controller';
import{TI002_CIRCLE_ACTIVITY,TI002_FEEDBACK_ACTIVITIES}from'./g4-l3-ti002-feedback-host';
import{Ti002Question}from'./g4-l3-ti002-question';
import{Ti002NumberLine}from'./g4-l3-ti002-number-line';
import{Ti002DecreasePreview}from'./g4-l3-ti002-decrease-picture';
import{Ti002PictureDialog,type Ti002PictureButton}from'./g4-l3-ti002-picture-dialog';
import{requestTi002KeyTerm}from'./g4-l3-ti002-keyterms';
import{Ti002Reward,TI002_REWARDS}from'./g4-l3-ti002-reward';
function Session({runtime,sourceReady}:{runtime:AnimationRendererProps;sourceReady:boolean}){
 const[state,dispatch]=useReducer(reduce,undefined,create);
 const make=()=>createTi002FeedbackController({seed:runtime.seed,replay:runtime.replay??0});
 const controller=useRef<ReturnType<typeof make>|null>(null);if(!controller.current)controller.current=make();
 const[status,setStatus]=useState('ready');
 const[picture,setPicture]=useState<{id:Ti002PictureButton;trigger:HTMLButtonElement;floor:number}|null>(null);
 const ready=sourceReady&&Number.isInteger(runtime.frame)&&runtime.frame>=238&&runtime.frame<=254&&(runtime.frame===238||state.outcome==='complete')&&(runtime.frameDomain??'sprite-272')==='sprite-272'&&runtime.scenario==='source-static-frame'&&!runtime.entryStateSha256;
 useLayoutEffect(()=>{if(controller.current?.status==='disposed')controller.current=make();const c=controller.current!;return()=>c.dispose();},[]);
 useLayoutEffect(()=>{const c=controller.current!;for(const action of c.observe(state,runtime,ready))dispatch(action);setStatus(c.status);},[state,runtime.lessonActivities,runtime.paused,runtime.frame,ready]);
 const send=(action:Action)=>{if(!ready||runtime.paused)return;const c=controller.current!;if(action.type==='drop-card'){if(c.admitDrop(state,action,runtime,ready))dispatch(action);setStatus(c.status);}else if(action.type==='select-card'||action.type==='close-wrong')dispatch(action);};
 const open=(id:Ti002PictureButton,trigger:HTMLButtonElement)=>{
  if(!ready||runtime.paused)return;
  let floor=0;
  if(id===171){floor=Math.max(0,...(runtime.lessonActivities??[]).filter(a=>a.id===TI002_CIRCLE_ACTIVITY.id).map(a=>a.revision));if(!runtime.onLessonActivityRequest?.({id:TI002_CIRCLE_ACTIVITY.id,parentFrame:runtime.frame}))return;}
  setPicture({id,trigger,floor});
 };
 const circle=(runtime.lessonActivities??[]).find(a=>a.id===TI002_CIRCLE_ACTIVITY.id&&a.sourceInstanceId===TI002_CIRCLE_ACTIVITY.sourceInstanceId&&a.frameDomain==='sprite-174'&&a.revision>(picture?.floor??Infinity));
 const circleFrame=circle&&Number.isInteger(circle.frame)&&circle.frame>=1&&circle.frame<=10?circle.frame:1;
 const pending=state.outcome==='correct-feedback'?controller.current.pending:null;
 const definition=TI002_FEEDBACK_ACTIVITIES.find(d=>d.id===pending?.id);
 const matches=pending?(runtime.lessonActivities??[]).filter(a=>a.id===pending.id&&a.sourceInstanceId===definition?.sourceInstanceId&&a.frameDomain===definition?.frameDomain&&a.revision>pending.floor&&a.frame>=definition!.startFrame&&a.frame<=definition!.endFrame):[];
 const feedback=matches.length===1?matches[0]:undefined;
 if(!ready)return <div data-ti002-host-question="blocked"/>;
 return <div data-ti002-host-question={status} data-ti002-question-frame={runtime.frame}>
  <Ti002Question state={state} dispatch={send} paused={runtime.paused??false} onPictureOpen={open} onKeyTerm={(id,trigger)=>{requestTi002KeyTerm(runtime,id,trigger);}} pictures={{Scr_1:<Ti002NumberLine diagram="sprite-182"/>,Scr_2:<Ti002NumberLine diagram="sprite-178"/>,Scr_3:<Ti002DecreasePreview/>,Scr_4:<Ti002NumberLine diagram="sprite-169"/>,Scr_5:<Ti002NumberLine diagram="sprite-159"/>}}/>
  {feedback&&<Ti002Reward id={feedback.id as keyof typeof TI002_REWARDS} frame={feedback.frame}/>}
  <Ti002PictureDialog buttonId={picture?.id??null} returnFocusTo={picture?.trigger??null} circleFrame={circleFrame} onClose={()=>setPicture(null)}/>
 </div>;
}
/** Source identity validation belongs to the page renderer before sourceReady.
 * Session is replaced on Replay/seed change. No private feedback timer. */
export function Ti002HostQuestion(props:{runtime:AnimationRendererProps;sourceReady:boolean}){return <Session key={`${props.runtime.seed}:${props.runtime.replay??0}`} {...props}/>;}
