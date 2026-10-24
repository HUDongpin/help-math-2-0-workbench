'use client';
import React,{useEffect,useId,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P011FrameState}from'./nms-l02-p011-timeline-v1';
import type{P011VisibleRun}from'./nms-l02-p011-source-contract-v1';
import{p011TeachingState,p011TextSnapshot,P011_TERM_RUNS}from'./nms-l02-p011-text-v1';
import{NMS_L02_P011_ART as ART}from'./generated/nms-l02-p011-art-ir-v1';
const h=React.createElement;
function math(value:string,denominator?:string,final=false){return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},denominator?h('mfrac',null,h('mn',final?{'data-lesson-text-block':'value-24'}:null,value),h('mn',final?{'data-lesson-text-block':'value-25'}:null,denominator)):h(value==='='?'mo':'mn',null,value));}
/** Render the complete layered source picture into each spatial crop. Shape15
 * also supplies the middle white circle; shape17's fraction bar stays outside. */
function Pizza({state,index}:{state:P011FrameState;index:number}){
 const prefix='p011-'+useId().replace(/[^a-zA-Z0-9_-]/gu,'')+'-',namespace=(s:string)=>s.replaceAll('nms2p11-',prefix);
 return <svg className="nms-l02-p011__pizza" viewBox={`${140+index*200} 190 148 148`} role="img" aria-label={['One half of a pizza','Four eighths of a pizza','Five tenths of a pizza'][index]} data-source-pizza={index}>
 <defs>{ART.images.map(im=><image key={im.id} id={namespace(im.id)} href={im.uri} width={im.width} height={im.height}/>)}</defs>
 {state.nodes.filter(n=>ART.art[String(n.characterId)]).map(n=><g key={n.instancePath} transform={'matrix('+n.matrix.join(' ')+')'} opacity={Math.max(0,Math.min(1,n.color[3]+n.color[7]))} dangerouslySetInnerHTML={{__html:namespace(ART.art[String(n.characterId)]!.body)}}/>)}
 </svg>;
}
export type P011TermEntries=Readonly<Record<'Equivalent'|'Value',string>>;
export interface P011PresentationProps{readonly state:P011FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P011TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P011Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P011PresentationProps){
 const teaching=p011TeachingState(state),snapshot=p011TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const renderRun=(run:P011VisibleRun)=>{
 if(!run.visibleText)return null;const term=P011_TERM_RUNS[run.sourceTextId as keyof typeof P011_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
 const emphasized=term==='Equivalent'&&teaching.wordEmphasized&&!reducedMotion;
 if(!term||!entryId||!onLessonHostRequest||!run.complete)return <span key={run.sourceTextId} className={emphasized?'nms-l02-p011__emphasis':undefined}>{run.visibleText}</span>;
 const leading=run.visibleText.match(/^\s*/u)?.[0]??'',trailing=run.visibleText.match(/\s*$/u)?.[0]??'';
 return <React.Fragment key={run.sourceTextId}>{leading}<button type="button" className={'nms-l02-p011__term'+(emphasized?' nms-l02-p011__emphasis':'')} data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
 const current=p011TeachingState(latest.current).allRuns.find(r=>r.sourceTextId===run.sourceTextId);if(!current?.complete){setBlocked(true);return;}
 const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{run.visibleText.trim()}</button>{trailing}</React.Fragment>;
 };
 // The source period is a separate text run. Keep it attached to its preceding
 // word at narrow widths without revealing it before its own source frame.
 const text=(runs:readonly P011VisibleRun[])=>runs.map((run,index)=>{
  if(run.sourceTextId==='character-7/run-3'&&runs[index-1]?.sourceTextId==='character-7/run-2')return null;
  if(run.sourceTextId==='character-7/run-2')return <span key={run.sourceTextId} className="nms-l02-p011__word-end">{renderRun(run)}{runs[index+1]?.sourceTextId==='character-7/run-3'?renderRun(runs[index+1]!):null}</span>;
  return renderRun(run);
 });
 const value=(id:number)=>{const v=teaching.values.find(v=>v.id===id);return v?.runs.some(r=>r.visibleText)?<span data-lesson-text-block={'value-'+id} style={{opacity:v.runs[0]?.alpha??0}}>{math(v.runs[0]?.visibleText??'',v.runs[1]?.visibleText)}</span>:null;};
 const eq=(depth:number)=>{const r=teaching.equalities.find(e=>e.depth===depth)?.run;return <span data-lesson-text-block={'equals-'+depth} data-source-depth={depth} style={{opacity:r?.alpha??0}}>{r?.visibleText?math(r.visibleText):null}</span>;};
 return <section className="nms-l02-p011 lesson-text-presentation" lang="en" data-p011-frame={state.frame} data-p011-domain={state.frameDomain} data-p011-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
 {uiLanguage==='es'&&<p className="nms-l02-p011__fallback" lang="es">Texto original en inglés.</p>}
 {teaching.headingVisible&&<header className="nms-l02-p011__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
 {teaching.definition&&<div className="nms-l02-p011__definition"><p data-lesson-text-block="definition">{text(teaching.definitionRuns)}</p></div>}
 {teaching.panelAlpha>0&&<div className="nms-l02-p011__figure" data-panel-alpha={teaching.panelAlpha} style={{backgroundColor:`rgba(229,240,206,${teaching.panelAlpha})`}}>
 {[12,18,13].map((id,index)=><React.Fragment key={id}>
 <div className="nms-l02-p011__card">{teaching.pictureAlpha>0&&<Pizza state={state} index={index}/>}<div className="nms-l02-p011__value">{value(id)}{id===13&&<>{value(23)}{teaching.values.find(v=>v.id===24)?.runs[0]?.visibleText&&<span data-final-fraction="true" style={{opacity:teaching.values.find(v=>v.id===24)?.runs[0]?.alpha??0}}>{math(teaching.values.find(v=>v.id===24)?.runs[0]?.visibleText??'',teaching.values.find(v=>v.id===25)?.runs[0]?.visibleText??'',true)}</span>}</>}</div></div>
 {index<2&&<div className="nms-l02-p011__equals" style={{'--divider-progress':teaching.divider}as React.CSSProperties}>{eq(index===0?27:30)}{eq(index===0?28:31)}</div>}
 </React.Fragment>)}
 </div>}
 {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
