'use client';
import type{AnimationRendererProps}from'./contract';
import{p036ModuleFrame}from'./nms-l02-p036-frame-v1';
import{p036TextSnapshot}from'./nms-l02-p036-text-v1';
import{P036Explanation}from'./nms-l02-p036-explanation-v1';
import{p036SourceTerm}from'./nms-l02-p036-term-host-v1';
export function NmsL2P036Renderer(props:AnimationRendererProps){const s=p036ModuleFrame(props.frame,{...props,frame:props.frame}),snapshot=p036TextSnapshot(s),language=props.uiLanguage??props.lang,term=s.state.term?p036SourceTerm(s.state.term):undefined;return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p036-query-kind={s.queryKind} data-p036-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">{s.mainFrame!==null?<><P036Explanation state={s.state} language={language} interactionEnabled={false} onTerm={()=>{}}/>{term&&<section className="p036-explanation" lang={language}><h2>{term.labels[language]}</h2><p>{term.definitions[language]}</p></section>}</>:null}</div>;}
