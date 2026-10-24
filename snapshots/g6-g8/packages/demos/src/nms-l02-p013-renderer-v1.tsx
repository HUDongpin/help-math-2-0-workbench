'use client';
import {useEffect,useId,useRef} from 'react';
import type {AnimationRendererProps} from './contract';
import {p013ModuleFrame} from './nms-l02-p013-frame-v1';
import {p013TextValues} from './nms-l02-p013-text-v1';
import {createP013Art} from './nms-l02-p013-art-v1';
import {NmsL2P013Presentation} from './nms-l02-p013-presentation-v1';
/** Explicit diagnostic frame capture, distinct from the event-driven player. */
export function NmsL2P013Renderer(props:AnimationRendererProps) {
 const s=p013ModuleFrame(props.frame,{...props,frame:props.frame}),ref=useRef<SVGSVGElement>(null),id=useId().replace(/[^a-zA-Z0-9]/g,'');
 useEffect(()=>{if(!s.component||!ref.current)return;const art=createP013Art(ref.current,'p013-component-'+id);art.draw(s.domain,s.frame,s.session);return()=>art.close();},[s.component,s.domain,s.frame,s.scenario,id]);
 const values=p013TextValues(s);
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
 {s.component?<section className="nms-l02-p013"><svg ref={ref} style={{width:'100%',height:'auto',maxHeight:'20rem'}} aria-hidden="true"/>{Object.entries(values).filter(([,v])=>v.visible).map(([key,v])=><p key={key} lang="en">{v.text}</p>)}</section>:s.mainFrame===null?<section className="nms-l02-p013"/>:<NmsL2P013Presentation state={s.session} language={props.uiLanguage??props.lang} capture={true} onPick={()=>false} onDrop={()=>{}} onCancel={()=>{}} onClosePress={()=>{}} onCloseRelease={()=>{}} onTerm={()=>{}}/>}
 </div>;
}
