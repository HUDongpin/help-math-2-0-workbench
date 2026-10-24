'use client';
import React,{useLayoutEffect,useReducer,useRef,useState}from'react';
import{createCourseG04L03In010TemperatureDragState as create,reduceCourseG04L03In010TemperatureDrag as reduce,type CourseG04L03In010TemperatureDragState as State,type CourseG04L03In010TemperatureDragAction as Action}from'../../timelines/course-g04-l03-in-010-temperature-drag-interaction';
import{NativeQuiz,type NativeQuizProps}from'./NativeQuiz';
import{createIn010SessionController,type Runtime}from'./controller';
/** Parent must key this hook's owner by page/runtime sessionIdentity, seed and Replay. */
export function useIn010Session(runtime:Runtime,ready:boolean,sessionIdentity:string){
 const[state,dispatch]=useReducer(reduce,undefined,create),controller=useRef<ReturnType<typeof createIn010SessionController>|null>(null);
 const identity=`${sessionIdentity}:${runtime.seed}:${runtime.replay??0}`;
 const make=()=>createIn010SessionController(identity,{seed:runtime.seed,replay:runtime.replay??0});
 if(!controller.current)controller.current=make();const[status,setStatus]=useState(controller.current.status);
 // StrictMode effect replay gets a fresh pending-state controller; no state/timer reset.
 useLayoutEffect(()=>{if(controller.current?.status==='disposed')controller.current=make();const owned=controller.current!;return()=>owned.dispose();},[]);
 useLayoutEffect(()=>{const c=controller.current!;for(const action of c.observe(state,runtime,ready))dispatch(action);c.reportCompletion(state,runtime,ready);setStatus(c.status);},[state,runtime.lessonActivities,runtime.paused,runtime.frame,runtime.entryStateSha256,ready]);
 const onDrop=(next:State,action:Extract<Action,{type:'drop-card'|'drop-outside'}>)=>{const c=controller.current!,accepted=c.admitDrop(state,next,action,runtime,ready);setStatus(c.status);return accepted;};
 return{state,dispatch,status,onDrop,onClosePress:(token:string)=>{controller.current!.closePress(token,state,runtime,ready);},onCloseRelease:(token:string)=>{controller.current!.closeRelease(token);}};
}
type View=Omit<NativeQuizProps,'state'|'dispatch'|'controlsReady'|'onDrop'|'onClosePress'|'onCloseRelease'|'lessonActivities'>;
export interface SessionProps extends View{readonly runtime:Runtime;readonly ready:boolean;readonly sessionIdentity:string;}
function SessionBody({runtime,ready,sessionIdentity,...view}:SessionProps){const session=useIn010Session(runtime,ready,sessionIdentity);return<div data-in010-session-status={session.status}><NativeQuiz {...view} state={session.state} dispatch={session.dispatch} controlsReady={ready&&!runtime.paused&&!runtime.entryStateSha256} onDrop={session.onDrop} onClosePress={session.onClosePress} onCloseRelease={session.onCloseRelease} lessonActivities={runtime.lessonActivities}/></div>;}
/** Parent supplies source snapshot readiness, source figure and exact glossary callback.
 * This wrapper keys only session identity/seed/Replay, never frame/layout/activities. */
export function Session(props:SessionProps){return<SessionBody key={`${props.sessionIdentity}:${props.runtime.seed}:${props.runtime.replay??0}`} {...props}/>;}
