'use client';
import type{AnimationRendererProps}from'./contract';
import{p038ModuleFrame}from'./nms-l02-p038-frame-v1';
import{p038TextSnapshot}from'./nms-l02-p038-text-v1';
import{P038Explanation}from'./nms-l02-p038-explanation-v1';
import{p038SourceTerm}from'./nms-l02-p038-term-host-v1';
export function NmsL2P038Renderer(props:AnimationRendererProps){const s=p038ModuleFrame(props.frame,{...props,frame:props.frame}),snapshot=p038TextSnapshot(s),language=props.uiLanguage??props.lang,term=s.state.term?p038SourceTerm(s.state.term):undefined;return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p038-query-kind={s.queryKind} data-p038-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">{s.mainFrame!==null?<><P038Explanation state={s.state} language={language} interactionEnabled={false} onTerm={()=>{}}/>{term&&<section className="p038-explanation" lang={language}><h2>{term.labels[language]}</h2><p>{term.definitions[language]}</p></section>}</>:null}</div>;}
