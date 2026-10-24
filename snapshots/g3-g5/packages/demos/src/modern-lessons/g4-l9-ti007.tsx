'use client';
import React,{useEffect,useLayoutEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'../contract';
import type{SourceStaticCanvasFrameState}from'../source-static-canvas-candidate';
import{createEstimatedPairPresentation,createEstimatedPairState,synchronizeEstimatedPairState,dispatchEstimatedPair,bindEstimatedChildren,observeEstimatedChild,getEstimatedPairSnapshot,type EstimatedPairState,type EstimatedPairAction}from'./g4-l4-estimated-pair';
import{CourseG04L09Ti007Renderer,getCourseG04L09Ti007FrameState}from'../modules/course-g04-l09-ti-007';
import{Ti007Scene,type Ti007Config}from'./g4-l9-ti007-view';
import source from'./g4-l9-ti007/source.generated.json';
export const TI007_MATCHING_CONFIG=source as unknown as Ti007Config;
const C=TI007_MATCHING_CONFIG,children=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
/** Own WrongFeed and uniquely named NMH_HT start together. Both
 * clocks must be accepted atomically; no local timer or synthetic child frame. */
export type Ti007State=EstimatedPairState&{readonly sourceFinalControlsEnabled?:boolean};
export function dispatchTi007Matching(s:Ti007State,a:EstimatedPairAction,r:AnimationRendererProps):Ti007State{
 const own=r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&(r.rootFrame??6)===6&&(r.frameDomain??C.frameDomain)===C.frameDomain&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&!r.paused;
 if(!own)return s;
 if(a.type==='close-wrong'&&(!s.wrongOpen||r.frame!==188||!observeEstimatedChild(C,s,'estimated-wrong',children(r))))return s;
 let hintAccepted=false;
 const runtime={...r,onLessonActivityRequest:(q:{id:string;parentFrame:number})=>{
  if(q.id!=='estimated-wrong')return r.onLessonActivityRequest?.(q)??false;
  const accepted=r.onLessonActivitiesRequest?.([q,{id:'own032-hint',parentFrame:188}])===true;hintAccepted=accepted;return accepted;
 }};
 const finalCardAction=s.phase==='final'&&s.sourceFinalControlsEnabled&&(a.type==='select'||a.type==='drop');
 const delegated:Ti007State=finalCardAction?{...s,phase:'idle'}:s;
 let next:Ti007State=dispatchEstimatedPair(C,delegated,a,runtime);if(next===delegated)return s;
 if(finalCardAction)next={...next,phase:'final',sourceFinalControlsEnabled:!next.wrongOpen};
 // Authored Close120 enables Scr1..9, including remaining distractors after
 // Help was opened during RightFeed. Preserve final clock ownership separately.
 if(s.phase==='final'&&((a.type==='help'&&!a.open)||a.type==='close-wrong'))next={...next,sourceFinalControlsEnabled:true};
 if(s.phase==='final'&&next.phase==='continued')next={...next,wrongOpen:false,helpOpen:false,focus:'replay',sourceFinalControlsEnabled:false};
 if(!hintAccepted)return next;
 const d=C.activities.find(d=>d.id==='own032-hint')!,floor=Math.max(-1,...children(r).filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),...s.children.filter(c=>c.id==='own032-hint').map(c=>c.revision??c.floor));
 return{...next,children:[...next.children.filter(c=>c.id!=='own032-hint'),{id:'own032-hint',floor,revision:null,token:null}]};
}
export function getTi007Snapshot(state:SourceStaticCanvasFrameState,r:AnimationRendererProps,s:Ti007State=createEstimatedPairState(r.seed,r.replay??0),all=children(r)){
 return getEstimatedPairSnapshot(C,state,r,s,all);
}
export function Ti007Renderer(r:AnimationRendererProps){
 const context={...r,frameDomain:r.frameDomain??C.frameDomain},state=(r.state??getCourseG04L09Ti007FrameState(r.frame,context))as SourceStaticCanvasFrameState,[stored,setStored]=useState<Ti007State>(()=>createEstimatedPairState(r.seed,r.replay??0)),all=children(r),s=synchronizeEstimatedPairState(C,stored,context,all),snapshot=getTi007Snapshot(state,context,s,all),live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
 const commit=(next:Ti007State)=>{if(next!==live.current){live.current=next;setStored(next);}};
 useLayoutEffect(()=>{if(snapshot.status!=='ready'||r.paused||r.frame!==188)return;const bound=bindEstimatedChildren(C,s,all);if(bound!==s){commit(bound);return;}commit(dispatchTi007Matching(s,{type:'advance'},r));},[s,all,r.frame,r.paused,snapshot.status]);
 useEffect(()=>()=>{const props=runtime.current;for(const child of live.current.children){if(child.revision===null||!child.token)continue;const a=children(props).find(a=>a.id===child.id&&a.revision===child.revision&&a.cancellationToken===child.token);if(a)props.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:child.token,parentFrame:props.frame});}},[r.seed,r.replay]);
 if(snapshot.status!=='ready')return<CourseG04L09Ti007Renderer {...r} state={state}/>;
 return<Ti007Scene key={`${r.seed}:${r.replay??0}`} c={C} r={r} s={s} snapshot={snapshot} onAction={a=>commit(dispatchTi007Matching(live.current,a,runtime.current))}/>;
}
const base=createEstimatedPairPresentation(C,getCourseG04L09Ti007FrameState,CourseG04L09Ti007Renderer);
if(!base.keyTerms)throw new Error('Own032 source key-term capability is required');
// Repeated source text fragments may share the exact same authored capability tuple.
const keyTerms={...base.keyTerms,sourceKeyBindings:base.keyTerms.sourceKeyBindings&&[...new Map(base.keyTerms.sourceKeyBindings.map(binding=>[JSON.stringify(binding),binding])).values()]};
export const G4_L9_TI007_TEXT_PRESENTATION={...base,keyTerms,Renderer:Ti007Renderer,getSnapshot:getTi007Snapshot};
export const G4_L9_TI007_TEXT_BINDING=G4_L9_TI007_TEXT_PRESENTATION.binding;
