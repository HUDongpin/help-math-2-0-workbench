'use client';
import type {AnimationRendererProps,RuntimeContext} from './contract';
import {p026ModuleFrame as queryFrame} from './nms-l02-p026-timeline-v1';
import {NmsL2P026Presentation} from './nms-l02-p026-presentation-v1';
export function p026ModuleFrame(frame:number,context:RuntimeContext){return queryFrame(frame,{...context,frameDomain:context.frameDomain??'sprite-82'});}
/** Deterministic inspection. The live player owns user input and audio. */
export function NmsL2P026Renderer(props:AnimationRendererProps){
 const state=p026ModuleFrame(props.frame,{...props,frame:props.frame});
 return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
  data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
  data-flash-scenario={state.scenario} data-flash-language={props.lang} data-flash-seed={props.seed}
  data-flash-replay={props.replay??0} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
  data-flash-entry-state-sha256={props.entryStateSha256} data-p026-query-kind={state.queryKind} data-source-alignment="candidate-not-accepted">
  {state.game&&<NmsL2P026Presentation state={state.game} language={props.uiLanguage??props.lang} paused={true} onChoose={()=>{}}/>}
 </div>;
}
