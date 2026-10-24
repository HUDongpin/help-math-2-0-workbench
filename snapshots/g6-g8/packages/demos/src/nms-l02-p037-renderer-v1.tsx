'use client';
import type{AnimationRendererProps}from'./contract';
import{p037ModuleFrame}from'./nms-l02-p037-frame-v1';
import{p037TextSnapshot}from'./nms-l02-p037-text-v1';
import{P037Practice}from'./nms-l02-p037-practice-v1';
import{p037SourceTerm}from'./nms-l02-p037-term-host-v1';
export function NmsL2P037Renderer(props:AnimationRendererProps){const s=p037ModuleFrame(props.frame,{...props,frame:props.frame}),snapshot=p037TextSnapshot(s),language=props.uiLanguage??props.lang,term=s.state.term?p037SourceTerm(s.state.term):undefined;return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p037-query-kind={s.queryKind} data-p037-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">{s.mainFrame!==null?<><P037Practice state={s.state} language={language} interactionEnabled={false} onTerm={()=>{}}/>{term&&<section className="p037-practice" lang={language}><h2>{term.labels[language]}</h2><p>{term.definitions[language]}</p></section>}</>:null}</div>;}
