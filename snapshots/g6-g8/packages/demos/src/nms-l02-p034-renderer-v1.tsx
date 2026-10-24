'use client';
import {useLayoutEffect,useRef} from 'react';
import type {AnimationRendererProps} from './contract';
import {p034ModuleFrame} from './nms-l02-p034-frame-v1';
import {p034TextSnapshot} from './nms-l02-p034-text-v1';
import {P034Practice} from './nms-l02-p034-practice-v1';
import {P034_FRAME_DATA as DATA} from './generated/nms-l02-p034-frame-data-v1';
import {p034SourceTerm} from './nms-l02-p034-term-host-v1';
function Helper({domain}:{domain:string}){
 const svg=useRef<SVGSVGElement>(null),body=DATA.helperSvg[domain as keyof typeof DATA.helperSvg];
 useLayoutEffect(()=>{if(!svg.current)return;const box=svg.current.getBBox();if(box.width>0&&box.height>0)svg.current.setAttribute('viewBox',[box.x-2,box.y-2,box.width+4,box.height+4].join(' '));},[domain]);
 return body?<svg ref={svg} aria-hidden="true" style={{width:'100%',maxHeight:'20rem'}} dangerouslySetInnerHTML={{__html:body}}/>:null;
}
/** Independent source-local frame inspection, with inert controls and no audio. */
export function NmsL2P034Renderer(props:AnimationRendererProps){
 const s=p034ModuleFrame(props.frame,{...props,frame:props.frame}),snapshot=p034TextSnapshot(s),language=props.uiLanguage??props.lang,term=p034SourceTerm('decimal')!;
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-p034-query-kind={s.queryKind} data-p034-text-status={snapshot.status} data-source-alignment="candidate-not-accepted">
  {s.component?<Helper domain={s.domain}/>:s.mainFrame!==null?<><P034Practice state={s.state} language={language} interactionEnabled={false} onValue={()=>{}} onDragStart={()=>{}} onDragEnd={()=>{}} onResetPress={()=>{}} onResetCancel={()=>{}} onReset={()=>{}} onTerm={()=>{}}/>{s.state.termOpen&&<section className="p034-practice" lang={language}><h2>{term.labels[language]}</h2><p>{term.definitions[language]}</p></section>}</>:null}
 </div>;
}
