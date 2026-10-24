'use client';
import React,{useEffect,useLayoutEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'../contract';
import type{SourceStaticCanvasFrameState}from'../source-static-canvas-candidate';
import{createEstimatedPairPresentation,createEstimatedPairState,synchronizeEstimatedPairState,dispatchEstimatedPair,bindEstimatedChildren,observeEstimatedChild,getEstimatedPairSnapshot,type EstimatedPairState,type EstimatedPairAction}from'./g4-l4-estimated-pair';
import{CourseG04L09Ti005Renderer,getCourseG04L09Ti005FrameState}from'../modules/course-g04-l09-ti-005';
import{Ti005Scene,type Ti005Config}from'./g4-l9-ti005-view';
import source from'./g4-l9-ti005/source.generated.json';
export const TI005_MATCHING_CONFIG=source as unknown as Ti005Config;
const C=TI005_MATCHING_CONFIG,children=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
/** Own WrongFeed and later-bound duplicate-name NMH_HT start together. Both
 * clocks must be accepted atomically; no local timer or synthetic child frame. */
export type Ti005State=EstimatedPairState&{readonly sourceFinalControlsEnabled?:boolean};
export function dispatchTi005Matching(s:Ti005State,a:EstimatedPairAction,r:AnimationRendererProps):Ti005State{
 const own=r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??C.frameDomain)===C.frameDomain&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!r.paused;
 if(!own)return s;
 if(a.type==='close-wrong'){
  if(!s.wrongOpen||!observeEstimatedChild(C,s,'estimated-wrong',children(r)))return s;
  // WrongFeed's own placement survives at main113. Its Close remains callable,
  // while the removed Scr cards and Help control cannot receive new actions.
  if(s.phase==='continued'&&r.frame===113)return{...s,wrongOpen:false,focus:'replay',sourceFinalControlsEnabled:false};
 }
 let hintAccepted=false;
 const runtime={...r,onLessonActivityRequest:(q:{id:string;parentFrame:number})=>{
  if(q.id!=='estimated-wrong')return r.onLessonActivityRequest?.(q)??false;
  const accepted=r.onLessonActivitiesRequest?.([q,{id:'own030-hint',parentFrame:112}])===true;hintAccepted=accepted;return accepted;
 }};
 const finalCardAction=s.phase==='final'&&s.sourceFinalControlsEnabled&&(a.type==='select'||a.type==='drop');
 const delegated:Ti005State=finalCardAction?{...s,phase:'idle'}:s;
 let next:Ti005State=dispatchEstimatedPair(C,delegated,a,runtime);if(next===delegated)return s;
 if(finalCardAction)next={...next,phase:'final',sourceFinalControlsEnabled:!next.wrongOpen};
 // Authored Close112 enables Scr1..9, including remaining distractors after
 // Help was opened during RightFeed. Preserve final clock ownership separately.
 if(s.phase==='final'&&((a.type==='help'&&!a.open)||a.type==='close-wrong'))next={...next,sourceFinalControlsEnabled:true};
 if(s.phase==='final'&&next.phase==='continued')next={...next,wrongOpen:s.wrongOpen,focus:s.wrongOpen?'wrong-close':'replay',sourceFinalControlsEnabled:false};
 if(!hintAccepted)return next;
 const d=C.activities.find(d=>d.id==='own030-hint')!,floor=Math.max(-1,...children(r).filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),...s.children.filter(c=>c.id==='own030-hint').map(c=>c.revision??c.floor));
 return{...next,children:[...next.children.filter(c=>c.id!=='own030-hint'),{id:'own030-hint',floor,revision:null,token:null}]};
}
export function getTi005Snapshot(state:SourceStaticCanvasFrameState,r:AnimationRendererProps,s:Ti005State=createEstimatedPairState(r.seed,r.replay??0),all=children(r)){
 const snapshot=getEstimatedPairSnapshot(C,state,r,s,all);
 if(snapshot.status!=='ready'||r.frame!==113||s.phase!=='continued'||!s.wrongOpen)return snapshot;
 return{...snapshot,blocks:snapshot.blocks.map(b=>b.id==='wrong'||b.id==='close'?{...b,visible:true}:b)};
}
export function Ti005Renderer(r:AnimationRendererProps){
 const context={...r,frameDomain:r.frameDomain??C.frameDomain},state=(r.state??getCourseG04L09Ti005FrameState(r.frame,context))as SourceStaticCanvasFrameState,[stored,setStored]=useState<Ti005State>(()=>createEstimatedPairState(r.seed,r.replay??0)),all=children(r),s=synchronizeEstimatedPairState(C,stored,context,all),snapshot=getTi005Snapshot(state,context,s,all),live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
 const commit=(next:Ti005State)=>{if(next!==live.current){live.current=next;setStored(next);}};
 useLayoutEffect(()=>{if(snapshot.status!=='ready'||r.paused||r.frame!==112)return;const bound=bindEstimatedChildren(C,s,all);if(bound!==s){commit(bound);return;}commit(dispatchTi005Matching(s,{type:'advance'},r));},[s,all,r.frame,r.paused,snapshot.status]);
 useEffect(()=>()=>{const props=runtime.current;for(const child of live.current.children){if(child.revision===null||!child.token)continue;const a=children(props).find(a=>a.id===child.id&&a.revision===child.revision&&a.cancellationToken===child.token);if(a)props.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:child.token,parentFrame:props.frame});}},[r.seed,r.replay]);
 if(snapshot.status!=='ready')return<CourseG04L09Ti005Renderer {...r} state={state}/>;
 return<Ti005Scene key={`${r.seed}:${r.replay??0}`} c={C} r={r} s={s} snapshot={snapshot} onAction={a=>commit(dispatchTi005Matching(live.current,a,runtime.current))}/>;
}
const base=createEstimatedPairPresentation(C,getCourseG04L09Ti005FrameState,CourseG04L09Ti005Renderer);
export const G4_L9_TI005_TEXT_PRESENTATION={...base,Renderer:Ti005Renderer,getSnapshot:getTi005Snapshot};
export const G4_L9_TI005_TEXT_BINDING=G4_L9_TI005_TEXT_PRESENTATION.binding;
