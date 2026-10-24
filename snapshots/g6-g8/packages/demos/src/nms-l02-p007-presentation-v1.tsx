'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P007FrameState}from'./nms-l02-p007-timeline-v1';
import{NmsL2P007Artwork}from'./nms-l02-p007-artwork-v1';
import{p007TeachingState,p007TextSnapshot,P007_TERM_RUNS}from'./nms-l02-p007-text-v1';
const h=React.createElement;
function fraction(top:string,bottom:string){return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},h('mfrac',null,h('mn',null,top),h('mn',null,bottom)));}
export type P007TermEntries=Readonly<Record<'Fraction'|'Whole'|'Group',string>>;
export interface P007PresentationProps{readonly state:P007FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P007TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
const blinkShapes:ReadonlySet<number>=new Set([18,19,25,26,27,28,29,30,31,32,33,34]);
export function NmsL2P007Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P007PresentationProps){
 const teaching=p007TeachingState(state),snapshot=p007TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const artworkState=reducedMotion?{...state,nodes:state.nodes.filter(n=>!blinkShapes.has(n.characterId))}:state;
 return <section className="nms-l02-p007 lesson-text-presentation" lang="en" data-p007-frame={state.frame} data-p007-domain={state.frameDomain} data-p007-text-status={snapshot.status} data-content-language="en">
 {uiLanguage==='es'&&<p className="nms-l02-p007__fallback" lang="es">Texto original en inglés.</p>}
 {teaching.headingVisible&&<header className="nms-l02-p007__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
 {teaching.definition&&<p className="nms-l02-p007__definition" data-lesson-text-block="definition">{teaching.definitionRuns.map(run=>{
 if(!run.visiblePrefix)return null;const term=P007_TERM_RUNS[run.sourceTextId as keyof typeof P007_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
 if(!term||!entryId||!onLessonHostRequest||run.visiblePrefix!==run.text)return <React.Fragment key={run.sourceTextId}>{run.visiblePrefix}</React.Fragment>;
 return <button key={run.sourceTextId} type="button" className="nms-l02-p007__term" data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
 const current=p007TeachingState(latest.current).definitionRuns.find(r=>r.sourceTextId===run.sourceTextId);if(!current||current.visiblePrefix!==current.text){setBlocked(true);return;}
 const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{run.visiblePrefix}</button>;
 })}</p>}
 <div className="nms-l02-p007__examples">
 {teaching.halfVisible&&<figure className="nms-l02-p007__example" aria-label="A circle divided into two equal parts, with one half shaded orange. Animated highlighting identifies the parts."><NmsL2P007Artwork state={artworkState} side="half"/><figcaption data-lesson-text-block="half" style={{opacity:teaching.halfAlpha}}>{teaching.halfFraction&&fraction('1','2')}</figcaption></figure>}
 {teaching.thirdsVisible&&<figure className="nms-l02-p007__example" aria-label="A circle divided into three equal parts, with two thirds shaded blue. Animated highlighting identifies the parts."><NmsL2P007Artwork state={artworkState} side="thirds"/><figcaption data-lesson-text-block="two-thirds" style={{opacity:teaching.thirdsAlpha}}>{teaching.thirdsFraction&&fraction('2','3')}</figcaption></figure>}
 </div>
 {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
