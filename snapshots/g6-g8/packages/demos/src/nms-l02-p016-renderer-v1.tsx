'use client';
import type {AnimationRendererProps} from './contract';
import {p016ModuleFrame} from './nms-l02-p016-frame-v1';
import {p016TextValues} from './nms-l02-p016-text-v1';
import {NmsL2P016Presentation} from './nms-l02-p016-presentation-v1';
/** Local-domain inspection is diagnostic. The player follows event-driven clocks. */
export function NmsL2P016Renderer(props:AnimationRendererProps){
 const s=p016ModuleFrame(props.frame,{...props,frame:props.frame}),values=p016TextValues(s);
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
  {s.component?<section className="nms-l02-p016" data-p016-component={s.domain}>
   {s.domain==='148'&&<div className="nms-l02-p016__demo-rail" aria-hidden="true"/>}
   {s.domain==='150'&&<div className="nms-l02-p016__demo-rail" aria-hidden="true"><span style={{left:0}}/></div>}
   {['151','153','189'].includes(s.domain)&&<svg viewBox={s.domain==='189'?'0 0 200 200':'0 0 20 20'} style={{width:s.domain==='189'?'min(100%,20rem)':'3rem',height:'auto'}} role="img" aria-label={s.domain==='189'?(s.frame>=2?'25 red squares in a hundred-square grid':'Empty source answer clip'):'One empty source grid cell'}>
    {s.domain==='189'?(s.frame>=2&&<><rect width="200" height="200" fill="white"/>{Array.from({length:25},(_,i)=><rect key={i} x={(i%10)*20} y={Math.floor(i/10)*20} width="20" height="20" fill="#ff0000"/>)}<path d={Array.from({length:11},(_,i)=>`M${i*20} 0V200M0 ${i*20}H200`).join(' ')} stroke="#1b3146" strokeWidth=".85" fill="none"/></>):<rect width="20" height="20" fill="white" stroke={s.domain==='153'?'#1b3146':'none'}/>}
   </svg>}
   {Object.entries(values).filter(([,v])=>v.visible).map(([key,v])=><p key={key} lang="en">{v.text}</p>)}
  </section>:s.mainFrame===null?<section className="nms-l02-p016"/>:<NmsL2P016Presentation state={s.session} language={props.uiLanguage??props.lang} capture onShaded={()=>{}} onDigit={()=>{}} onDragStart={()=>false} onDragEnd={()=>{}} onSubmit={()=>{}} onPress={()=>{}} onRelease={()=>{}} onClose={()=>{}} onTerm={()=>{}}/>}
 </div>;
}
