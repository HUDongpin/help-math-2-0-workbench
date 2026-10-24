 'use client';
import {useEffect,useId,useRef} from 'react';
import type {AnimationRendererProps} from './contract';
import {p022ModuleFrame} from './nms-l02-p022-frame-v1';
import {p022TextValues} from './nms-l02-p022-text-v1';
import {createP022Art} from './nms-l02-p022-art-v1';
import {NmsL2P022Presentation} from './nms-l02-p022-presentation-v1';
/** Static capture component. Natural interactive playback uses the registered adapter. */
export function NmsL2P022Renderer(props:AnimationRendererProps){const s=p022ModuleFrame(props.frame,{...props,frame:props.frame}),ref=useRef<SVGSVGElement>(null),id=useId().replace(/[^a-zA-Z0-9]/g,'');useEffect(()=>{if(!s.component||!ref.current)return;const art=createP022Art(ref.current,'p022-component-'+id);art.draw(s.domain,s.frame);return()=>art.close();},[s.component,s.domain,s.frame,id]);const values=p022TextValues(s);
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
 {s.component?<section className="nms-l02-p022"><svg ref={ref} className="nms-l02-p022__art" aria-hidden="true"/>{Object.entries(values).filter(([,v])=>v.visible).map(([key,v])=><p key={key} lang="en">{v.text}</p>)}</section>:s.mainFrame===null?<section className="nms-l02-p022">{values['course-title'].visible&&<p lang="en">{values['course-title'].text}</p>}</section>:<NmsL2P022Presentation state={s.session} language={props.uiLanguage??props.lang} capture={true} onHelp={()=>{}} onCloseHelp={()=>{}} onAnswer={()=>{}} onCloseFeedback={()=>{}} onTerm={()=>{}}/>}
 </div>;
}
