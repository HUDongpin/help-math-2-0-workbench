'use client';
import{useEffect,useId,useRef}from'react';
import{createP033Art}from'./nms-l02-p033-art-v1';
import type{AnimationRendererProps}from'./contract';
import{p033ModuleFrame}from'./nms-l02-p033-frame-v1';
import{p033TextValues,p033TextSnapshot}from'./nms-l02-p033-text-v1';
import{P033Question}from'./nms-l02-p033-question-v1';
import{P033HelpBody}from'./nms-l02-p033-help-v1';
import{P033FeedbackPresentation}from'./nms-l02-p033-feedback-presentation-v1';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
function SourceComponentArt({domain,frame}:{domain:string;frame:number}){const svg=useRef<SVGSVGElement>(null),id=useId().replace(/[^a-zA-Z0-9]/g,'');useEffect(()=>{if(!svg.current)return;const art=createP033Art(svg.current,'p033-component-'+id);art.draw(domain,frame,true);return()=>art.close();},[domain,frame,id]);return <svg ref={svg} aria-hidden="true" style={{display:'block',width:'100%',maxHeight:'26rem'}}/>;}
/** Explicit source-local inspection. No source AS or automatic audio execution. */
export function NmsL2P033Renderer(props:AnimationRendererProps){
 const s=p033ModuleFrame(props.frame,{...props,frame:props.frame}),values=p033TextValues(s),snapshot=p033TextSnapshot(s),language=props.uiLanguage??props.lang;
 if(snapshot.status!=='ready')return <p role="alert">The page is unavailable.</p>;
 const title=<LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>;
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p033-query-kind={s.queryKind} data-p033-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">
 {s.component?<section className="p033-question">{['211','212'].includes(s.domain)?<><P033HelpBody language={language}/>{s.domain==='212'&&<button disabled data-lesson-text-block="close">Close</button>}</>:s.domain==='9'?title:['99','156'].includes(s.domain)?<SourceComponentArt domain={s.domain} frame={s.frame}/>:Object.entries(values).filter(([,v])=>v.visible).map(([key,v])=><p key={key} data-lesson-text-block={key} lang="en">{v.text}</p>)}</section>:s.mainFrame===null?<section className="p033-question"/>:s.session.feedback?<>{title}<P033FeedbackPresentation state={s.session} language={language} interactionEnabled={false} onClose={()=>{}}/></>:<><P033Question state={s.session} language={language} interactionEnabled={false} onAnswer={()=>{}} onHelp={()=>{}}/>{s.session.help&&<section className="p033-question"><P033HelpBody language={language}/><button disabled data-lesson-text-block="close">Close</button></section>}</>}
 </div>;
}
