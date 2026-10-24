'use client';
import type{AnimationRendererProps}from'./contract';
import{p040ModuleFrame}from'./nms-l02-p040-frame-v1';
import{P040Presentation}from'./nms-l02-p040-presentation-v1';
import{P040_SOURCE}from'./generated/nms-l02-p040-presentation-v1';
/** Deterministic inspection renderer: no audio clock or modal interaction. */
export function NmsL2P040Renderer(props:AnimationRendererProps){
 const s=p040ModuleFrame(props.frame,{...props,frame:props.frame}),language=props.uiLanguage??props.lang,term=P040_SOURCE.terms.find(t=>t.id===s.state.term);
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
  {s.mainFrame!==null&&<><P040Presentation state={{...s.state,term:null}} language={language} reducedMotion={props.reducedMotion} interactive={false} onTerm={()=>{}} onCloseTerm={()=>{}}/>{term&&<section className="p040-presentation" lang={language}><h2>{term.labels[language]}</h2><p>{term.definitions[language]}</p></section>}</>}
 </div>;
}
