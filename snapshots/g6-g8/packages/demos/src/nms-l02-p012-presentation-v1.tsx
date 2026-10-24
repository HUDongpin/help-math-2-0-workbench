'use client';
import React,{useEffect,useId,useRef,useState}from'react';
import type{AnimationRendererProps}from'./contract';
import type{P012FrameState}from'./nms-l02-p012-timeline-v1';
import type{P012VisibleRun}from'./nms-l02-p012-source-contract-v1';
import{p012TeachingState,p012TextSnapshot,P012_TERM_RUNS}from'./nms-l02-p012-text-v1';
import{NMS_L02_P012_ART as ART}from'./generated/nms-l02-p012-art-ir-v1';
const h=React.createElement;
function math(value:string,denominator?:string,final=false){return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},denominator?h('mfrac',null,h('mn',final?{'data-lesson-text-block':'value-26'}:null,value),h('mn',final?{'data-lesson-text-block':'value-27'}:null,denominator)):h(value==='='?'mo':'mn',null,value));}
/** Render the complete layered source picture into each spatial crop. Shape21
 * also supplies the middle white circle; shape23's fraction bar stays outside. */
function Pizza({state,index}:{state:P012FrameState;index:number}){
 const prefix='p012-'+useId().replace(/[^a-zA-Z0-9_-]/gu,'')+'-',namespace=(s:string)=>s.replaceAll('nms2p12-',prefix);
 return <svg className="nms-l02-p012__pizza" viewBox={`${140+index*200} 190 148 148`} role="img" aria-label={['One half of a pizza','Four eighths of a pizza','Five tenths of a pizza'][index]} data-source-pizza={index}>
 <defs>{ART.images.map(im=><image key={im.id} id={namespace(im.id)} href={im.uri} width={im.width} height={im.height}/>)}</defs>
 {state.nodes.filter(n=>ART.art[String(n.characterId)]).map(n=><g key={n.instancePath} transform={'matrix('+n.matrix.join(' ')+')'} opacity={Math.max(0,Math.min(1,n.color[3]+n.color[7]))} dangerouslySetInnerHTML={{__html:namespace(ART.art[String(n.characterId)]!.body)}}/>)}
 </svg>;
}
export type P012TermEntries=Readonly<Record<'Equivalent fraction'|'Fraction'|'Equivalent'|'Quantity',string>>;
export interface P012PresentationProps{readonly state:P012FrameState;readonly uiLanguage?:'en'|'es';readonly termEntries?:P012TermEntries;readonly onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest'];readonly onSourceStop?:()=>void;readonly reducedMotion?:boolean;}
export function NmsL2P012Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}:P012PresentationProps){
 const teaching=p012TeachingState(state),snapshot=p012TextSnapshot(state),latest=useRef(state);latest.current=state;
 const[blocked,setBlocked]=useState(false);useEffect(()=>setBlocked(false),[state.replay]);
 if(snapshot.status!=='ready')return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
 const renderRun=(run:P012VisibleRun)=>{
 if(!run.visibleText)return null;const term=P012_TERM_RUNS[run.sourceTextId as keyof typeof P012_TERM_RUNS],entryId=term?termEntries?.[term]:undefined;
 const emphasized=term==='Equivalent fraction'&&teaching.wordEmphasized&&!reducedMotion;
 if(!term||!entryId||!onLessonHostRequest||!run.complete)return <span key={run.sourceTextId} className={emphasized?'nms-l02-p012__emphasis':undefined}>{run.visibleText}</span>;
 const leading=run.visibleText.match(/^\s*/u)?.[0]??'',trailing=run.visibleText.match(/\s*$/u)?.[0]??'';
 return <React.Fragment key={run.sourceTextId}>{leading}<button type="button" className={'nms-l02-p012__term'+(emphasized?' nms-l02-p012__emphasis':'')} data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event=>{
 const current=p012TeachingState(latest.current).allRuns.find(r=>r.sourceTextId===run.sourceTextId);if(!current?.complete){setBlocked(true);return;}
 const decision=onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed')onSourceStop?.();
 }}>{run.visibleText.trim()}</button>{trailing}</React.Fragment>;
 };
 // The source period is a separate text run. Keep it attached to its preceding
 // word at narrow widths without revealing it before its own source frame.
 const text=(runs:readonly P012VisibleRun[])=>runs.map((run,index)=>{
  if(run.sourceTextId==='character-14/run-2'&&runs[index-1]?.sourceTextId==='character-14/run-1')return null;
  if(run.sourceTextId==='character-14/run-1')return <span key={run.sourceTextId} className="nms-l02-p012__word-end">{renderRun(run)}{runs[index+1]?.sourceTextId==='character-14/run-2'?renderRun(runs[index+1]!):null}</span>;
  return renderRun(run);
 });
 const value=(id:number)=>{const v=teaching.values.find(v=>v.id===id);return v?.runs.some(r=>r.visibleText)?<span data-lesson-text-block={'value-'+id} style={{opacity:v.runs[0]?.alpha??0}}>{math(v.runs[0]?.visibleText??'',v.runs[1]?.visibleText)}</span>:null;};
 const eq=(depth:number)=>{const r=teaching.equalities.find(e=>e.depth===depth)?.run;return <span data-lesson-text-block={'equals-'+depth} data-source-depth={depth} style={{opacity:r?.alpha??0}}>{r?.visibleText?math(r.visibleText):null}</span>;};
 return <section className="nms-l02-p012 lesson-text-presentation" lang="en" data-p012-frame={state.frame} data-p012-domain={state.frameDomain} data-p012-text-status={snapshot.status} data-content-language="en" data-reduced-motion={reducedMotion}>
 {uiLanguage==='es'&&<p className="nms-l02-p012__fallback" lang="es">Texto original en inglés.</p>}
 {teaching.headingVisible&&<header className="nms-l02-p012__header"><p data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts:</p><h2 data-lesson-text-block="activity-title">Vocabulary</h2></header>}
 {teaching.definition&&<div className="nms-l02-p012__definition"><p data-lesson-text-block="definition">{text(teaching.definitionRuns)}</p></div>}
 {teaching.panelAlpha>0&&<div className="nms-l02-p012__figure" data-panel-alpha={teaching.panelAlpha} style={{backgroundColor:`rgba(229,240,206,${teaching.panelAlpha})`}}>
 {[18,24,19].map((id,index)=><React.Fragment key={id}>
 <div className="nms-l02-p012__card">{teaching.pictureAlpha>0&&<Pizza state={state} index={index}/>}<div className="nms-l02-p012__value">{value(id)}{id===19&&<>{value(25)}{teaching.values.find(v=>v.id===26)?.runs[0]?.visibleText&&<span data-final-fraction="true" style={{opacity:teaching.values.find(v=>v.id===26)?.runs[0]?.alpha??0}}>{math(teaching.values.find(v=>v.id===26)?.runs[0]?.visibleText??'',teaching.values.find(v=>v.id===27)?.runs[0]?.visibleText??'',true)}</span>}</>}</div></div>
 {index<2&&<div className="nms-l02-p012__equals" style={{'--divider-progress':teaching.divider}as React.CSSProperties}>{eq(index===0?35:38)}{eq(index===0?36:39)}</div>}
 </React.Fragment>)}
 </div>}
 {blocked&&<p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
 </section>;
}
