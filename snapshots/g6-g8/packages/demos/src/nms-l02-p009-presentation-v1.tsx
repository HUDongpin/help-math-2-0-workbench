'use client';
import React,{useEffect,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P009FrameState}from'./nms-l02-p009-timeline-v1';
import type{P009VisibleRun}from'./nms-l02-p009-source-contract-v1';
import{p009TeachingState,p009TextSnapshot,P009_TERM_RUNS}from'./nms-l02-p009-text-v1';
const h=React.createElement;
function decimal(value:string){return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline'},h('mn',null,value));}
export type P009TermEntries=Readonly<Record<'Decimal point'|'Symbol'|'Whole numbers'|'Decimal fraction',string>>;
export interface P009PresentationProps{readonly state:P009FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P009TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P009Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P009PresentationProps){
 const teaching=p009TeachingState(state),snapshot=p009TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const text=(runs:readonly P009VisibleRun[])=>runs.map(run=>{
 if(!run.visibleText)return null;const term=P009_TERM_RUNS[run.sourceTextId as keyof typeof P009_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
 if(!term||!entryId||!onLessonHostRequest||!run.complete)return <React.Fragment key={run.sourceTextId}>{run.visibleText}</React.Fragment>;
 // Preserve source whitespace outside the button to keep the focus ring on its label.
 const leading=run.visibleText.match(/^\s*/u)?.[0]??'',trailing=run.visibleText.match(/\s*$/u)?.[0]??'';
 return <React.Fragment key={run.sourceTextId}>{leading}<button type="button" className="nms-l02-p009__term" data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
 const current=p009TeachingState(latest.current).allRuns.find(r=>r.sourceTextId===run.sourceTextId);if(!current||!current.complete){setBlocked(true);return;}
 const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{run.visibleText.trim()}</button>{trailing}</React.Fragment>;
 });
 return <section className="nms-l02-p009 lesson-text-presentation" lang="en" data-p009-frame={state.frame} data-p009-domain={state.frameDomain} data-p009-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
 {uiLanguage==='es'&&<p className="nms-l02-p009__fallback" lang="es">Texto original en inglés.</p>}
 {teaching.headingVisible&&<header className="nms-l02-p009__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
 {teaching.definition&&<div className="nms-l02-p009__definition"><p data-lesson-text-block="definition">{text(teaching.definitionRuns)}</p></div>}
 {teaching.number&&<div className="nms-l02-p009__number" data-lesson-text-block="number" data-spread={teaching.spread} aria-label={teaching.number}>
 <span aria-hidden="true">{teaching.numberParts.map(part=><span key={part.characterId} data-source-character={part.characterId} style={{opacity:part.alpha}} className={part.text==='.'&&teaching.pointEmphasized&&!reducedMotion?'nms-l02-p009__point-emphasis':undefined}>{part.text}</span>)}</span></div>}
 {teaching.tableVisible&&<div className="nms-l02-p009__table" data-table-progress={teaching.tableProgress}>
 {(['whole','point','decimal']as const).map(group=><section key={group} className="nms-l02-p009__group" data-group={group}>
 {group==='point'?<div className="nms-l02-p009__group-gap" aria-hidden="true"/>:<h3 data-lesson-text-block={group==='whole'?'whole-group':'decimal-group'}>{group==='whole'?teaching.wholeGroup:teaching.decimalGroup}</h3>}
 <dl className="nms-l02-p009__places">{teaching.columns.filter(c=>c.group===group).map(c=><div key={c.id} data-place={c.id} data-empty-value={!c.value}>
 <dt data-lesson-text-block={c.id+'-label'} aria-label={c.label?.visibleText||undefined}>{c.label&&<span aria-hidden="true">{Array.from(c.label.text).map((char,i)=><span key={i} style={{visibility:c.label!.glyphVisible[i]?'visible':'hidden'}}>{char}</span>)}</span>}</dt>
 <dd data-lesson-text-block={c.id+'-value'} style={{opacity:c.valueAlpha}}>{c.value&&decimal(c.value)}</dd>
 </div>)}</dl></section>)}
 </div>}
 {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
