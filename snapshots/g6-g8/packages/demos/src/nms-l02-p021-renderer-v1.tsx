'use client';
import type{AnimationRendererProps}from'./contract';
import{P021_IR as IR}from'./generated/nms-l02-p021-source-ir-v1';
import{p021ModuleFrame}from'./nms-l02-p021-frame-v1';
import{p021TextValues}from'./nms-l02-p021-text-v1';
import{p021SectorPath}from'./nms-l02-p021-teaching-v1';
import{NmsL2P021Presentation}from'./nms-l02-p021-presentation-v1';
export function NmsL2P021Renderer(props:AnimationRendererProps){const s=p021ModuleFrame(props.frame,{...props,frame:props.frame}),values=p021TextValues(s),sector=IR.sectorComponents[s.domain];
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
 {s.component?<section className="nms-l02-p021" data-p021-component={s.domain}>{(sector||s.domain==='551')&&<svg viewBox="-120 -120 240 240" style={{width:'min(100%,19rem)',height:'auto'}} role="img" aria-label={sector?`Source sector ${sector.index+1} of ${sector.parts}`:`Circle divided into ${s.frame} equal parts`}>{sector?<path d={p021SectorPath(sector.parts,sector.index,IR.selectorRotations[sector.parts-1]!)} fill="white" stroke="#263c50"/>:Array.from({length:s.frame},(_,i)=><path key={i} d={p021SectorPath(s.frame,i,IR.selectorRotations[s.frame-1]!)} fill="white" stroke="#263c50"/>)}</svg>}{Object.entries(values).filter(([,v])=>v.visible).map(([key,v])=><p key={key} lang="en">{v.text}</p>)}</section>:s.mainFrame===null?<section className="nms-l02-p021"/>:<NmsL2P021Presentation state={s.session} language={props.uiLanguage??props.lang} capture onToggle={()=>{}} onPress={()=>{}} onRelease={()=>{}} onClose={()=>{}}/>}
 </div>;
}
