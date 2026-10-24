'use client';
import type{AnimationRendererProps}from'./contract';
import{p031ModuleFrame}from'./nms-l02-p031-frame-v1';
import{p031TextValues,p031TextSnapshot}from'./nms-l02-p031-text-v1';
import{P031Question}from'./nms-l02-p031-question-v1';
import{P031HelpBody}from'./nms-l02-p031-help-v1';
import{P031FeedbackPresentation}from'./nms-l02-p031-feedback-presentation-v1';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
/** Explicit source-local inspection. No source AS or automatic audio execution. */
export function NmsL2P031Renderer(props:AnimationRendererProps){
 const s=p031ModuleFrame(props.frame,{...props,frame:props.frame}),values=p031TextValues(s),snapshot=p031TextSnapshot(s),language=props.uiLanguage??props.lang;
 if(snapshot.status!=='ready')return <p role="alert">The page is unavailable.</p>;
 const title=<LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>;
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p031-query-kind={s.queryKind} data-p031-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">
 {s.component?<section className="p031-question">{['231','232'].includes(s.domain)?<><P031HelpBody language={language}/>{s.domain==='232'&&<button disabled data-lesson-text-block="close">Close</button>}</>:s.domain==='11'?title:Object.entries(values).filter(([,v])=>v.visible).map(([key,v])=><p key={key} data-lesson-text-block={key} lang="en">{v.text}</p>)}</section>:s.mainFrame===null?<section className="p031-question"/>:s.session.feedback?<>{title}<P031FeedbackPresentation state={s.session} language={language} onClose={()=>{}}/></>:<><P031Question state={s.session} language={language} interactionEnabled={false} onAnswer={()=>{}} onHelp={()=>{}}/>{s.session.help&&<section className="p031-question"><P031HelpBody language={language}/><button disabled data-lesson-text-block="close">Close</button></section>}</>}
 </div>;
}
