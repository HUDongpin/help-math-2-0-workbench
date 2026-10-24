'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type{AnimationRendererProps}from'../contract';
import type{SourceStaticCanvasFrameState}from'../source-static-canvas-candidate';
import {createEstimatedPairPresentation,EstimatedPairScene,createEstimatedPairState,synchronizeEstimatedPairState,dispatchEstimatedPair,bindEstimatedChildren,observeEstimatedChild,getEstimatedPairSnapshot,type EstimatedPairConfig,type EstimatedPairState,type EstimatedPairAction}from'./g4-l4-estimated-pair';
import{CourseG04L09In007Renderer,getCourseG04L09In007FrameState}from'../modules/course-g04-l09-in-007';
import source from'./g4-l9-in007/source.generated.json';
export const IN007_MATCHING_CONFIG=source as unknown as EstimatedPairConfig;
const C=IN007_MATCHING_CONFIG;
const children=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
/** Exact own Close is actionable only after its real WrongFeed child is bound. */
export function dispatchIn007Matching(s:EstimatedPairState,a:EstimatedPairAction,r:AnimationRendererProps){
 if(a.type==='close-wrong'&&!observeEstimatedChild(C,s,'estimated-wrong',children(r)))return s;
 return dispatchEstimatedPair(C,s,a,r);
}
const root='[data-modern-text-page="course-g04-l09-in-007"]';
// Keep the 44px hit area while centering each label in its source card rectangle.
const CARD_ALIGNMENT=C.cards.map(card=>`${root} [data-estimated-card="${card.id}"]{padding-block-end:max(0px,calc(44px - ${(card.bounds[3]-card.bounds[2])/C.layout.unitsPerEm[1]}em))}`).join('');
const STYLE=`${CARD_ALIGNMENT}${root} .estimated-pair__term{min-block-size:44px;white-space:nowrap}${root} p>[data-lesson-text-block]{white-space:pre-wrap}${root} .estimated-pair__feedback{scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}`;
function Renderer(r:AnimationRendererProps){
 const context={...r,frameDomain:r.frameDomain??C.frameDomain},state=(r.state??getCourseG04L09In007FrameState(r.frame,context))as SourceStaticCanvasFrameState;
 const[stored,setStored]=useState(()=>createEstimatedPairState(r.seed,r.replay??0)),all=children(r),s=synchronizeEstimatedPairState(C,stored,context,all),snapshot=getEstimatedPairSnapshot(C,state,context,s,all),live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
 const commit=(next:EstimatedPairState)=>{if(next!==live.current){live.current=next;setStored(next);}};
 useLayoutEffect(()=>{if(snapshot.status!=='ready'||r.paused||r.frame!==108)return;const bound=bindEstimatedChildren(C,s,all);if(bound!==s){commit(bound);return;}commit(dispatchIn007Matching(s,{type:'advance'},r));},[s,all,r.frame,r.paused,snapshot.status]);
 useEffect(()=>()=>{const props=runtime.current;for(const child of live.current.children){if(child.revision===null||!child.token)continue;const a=children(props).find(a=>a.id===child.id&&a.revision===child.revision&&a.cancellationToken===child.token);if(a)props.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:child.token,parentFrame:props.frame});}},[r.seed,r.replay]);
 if(snapshot.status!=='ready')return <CourseG04L09In007Renderer {...r} state={state}/>;
 return <><style>{STYLE}</style><EstimatedPairScene key={`${r.seed}:${r.replay??0}`} c={C} r={r} s={s} snapshot={snapshot} onAction={a=>commit(dispatchIn007Matching(live.current,a,runtime.current))}/></>;
}
const base=createEstimatedPairPresentation(C,getCourseG04L09In007FrameState,CourseG04L09In007Renderer);
export const G4_L9_IN007_TEXT_PRESENTATION={...base,Renderer};
export const G4_L9_IN007_TEXT_BINDING=G4_L9_IN007_TEXT_PRESENTATION.binding;
