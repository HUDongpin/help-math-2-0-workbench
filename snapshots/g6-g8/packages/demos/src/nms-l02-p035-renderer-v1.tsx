'use client';
import type {AnimationRendererProps} from './contract';
import {p035ModuleFrame} from './nms-l02-p035-frame-v1';
import {p035TextSnapshot} from './nms-l02-p035-text-v1';
import {P035Explanation} from './nms-l02-p035-explanation-v1';
import {p035SourceTerm} from './nms-l02-p035-term-host-v1';
/** Independent source-local frame inspection, with inert controls and no audio. */
export function NmsL2P035Renderer(props:AnimationRendererProps){
 const s=p035ModuleFrame(props.frame,{...props,frame:props.frame}),snapshot=p035TextSnapshot(s),language=props.uiLanguage??props.lang,term=s.state.term?p035SourceTerm(s.state.term):undefined;
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p035-query-kind={s.queryKind} data-p035-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">
  {s.mainFrame!==null?<><P035Explanation state={s.state} language={language} interactionEnabled={false} onTerm={()=>{}}/>{term&&<section className="p035-explanation" lang={language}><h2>{term.labels[language]}</h2><p>{term.definitions[language]}</p></section>}</>:null}
 </div>;
}
