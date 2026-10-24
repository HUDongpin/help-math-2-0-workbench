'use client';
import{useState}from'react';
import type{AnimationRendererProps,RuntimeContext}from'./contract';
import{getNmsL2P032FrameState}from'./nms-l02-p032-timeline-v1';
import{NmsL2P032Presentation}from'./nms-l02-p032-presentation-v1';
import{NmsL2P032TermDialog}from'./nms-l02-p032-term-dialog-v1';
import{p032SourceTerm}from'./nms-l02-p032-term-host-v1';
export function p032ModuleFrame(frame:number,context:RuntimeContext){return getNmsL2P032FrameState(frame,context);}
function SourceTermScenario({id,language}:{id:string;language:'en'|'es'}){
 const[open,setOpen]=useState(true),term=p032SourceTerm(id);
 return open&&term?<NmsL2P032TermDialog term={term} language={language} trigger={null} onClose={()=>setOpen(false)}/>:null;
}
/** Deterministic source scenarios are static inspection states. The integrated
 * player separately owns eventful playback and source-stop glossary behavior. */
export function NmsL2P032Renderer(props:AnimationRendererProps){
 const s=p032ModuleFrame(props.frame,{...props,frame:props.frame});
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={props.lang} data-flash-seed={props.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
  <NmsL2P032Presentation state={s} uiLanguage={props.uiLanguage??props.lang}/>
  {s.activeTerm&&<SourceTermScenario key={s.activeTerm+'-'+s.frame+'-'+s.replay} id={s.activeTerm} language={props.uiLanguage??props.lang}/>}
 </div>;
}
