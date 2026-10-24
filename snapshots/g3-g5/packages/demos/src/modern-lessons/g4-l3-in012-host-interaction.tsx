'use client';
import React,{useLayoutEffect,useReducer,useRef,useState} from 'react';
import type {AnimationRendererProps} from '../contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {createCourseG04L03In012OwingDragState as create,reduceCourseG04L03In012OwingDrag as reduce,type CourseG04L03In012OwingDragAction as Action} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';
import {createIn012SessionController} from './g4-l3-in012-feedback-controller';
import {getIn012HostSnapshot} from './g4-l3-in012-host-snapshot';
import {In012Activity} from './g4-l3-in012-activity';
type Props={runtime:AnimationRendererProps;sourceState:SourceStaticCanvasFrameState;onKeyTerm?:(entry:string,trigger:HTMLButtonElement)=>void};
function Session({runtime,sourceState,onKeyTerm}:Props){
 const [state,dispatch]=useReducer(reduce,undefined,create);
 const identity=`course-g04-l03-in-012:${runtime.seed}:${runtime.replay??0}`;
 const make=()=>createIn012SessionController(identity,{seed:runtime.seed,replay:runtime.replay??0});
 const controller=useRef<ReturnType<typeof make>|null>(null);
 if(!controller.current)controller.current=make();
 const [status,setStatus]=useState(controller.current.status);
 const snapshot=getIn012HostSnapshot(sourceState,runtime,state),ready=snapshot.status==='ready';
 useLayoutEffect(()=>{if(controller.current?.status==='disposed')controller.current=make();const owned=controller.current!;return()=>owned.dispose();},[]);
 useLayoutEffect(()=>{const c=controller.current!;for(const action of c.observe(state,runtime,ready))dispatch(action);setStatus(c.status);},[state,runtime.lessonActivities,runtime.paused,runtime.frame,ready]);
 const send=(action:Action)=>{
  if(!ready||runtime.paused)return;
  if(action.type==='drop-card'){
   const c=controller.current!,next=reduce(state,action);
   if(c.admitDrop(state,next,action,runtime,ready))dispatch(action);
   setStatus(c.status);
  }else if(action.type==='select-card'||action.type==='close-wrong')dispatch(action);
 };
 if(!ready)return <div data-in012-session-status="blocked"/>;
 return <div data-in012-session-status={status}><In012Activity terminal={runtime.frame>174} state={state} dispatch={send} snapshot={snapshot} paused={runtime.paused} onKeyTerm={onKeyTerm}
  onClosePress={token=>controller.current!.closePress(token,state,runtime,ready)}
  onCloseRelease={token=>controller.current!.closeRelease(token)}/></div>;
}
/** Session reset identity is unrelated to viewport or activity revisions. */
export function In012HostInteraction(props:Props){return <Session key={`${props.runtime.seed}:${props.runtime.replay??0}`} {...props}/>;}
