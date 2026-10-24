'use client';
import type {AnimationRendererProps,RuntimeContext} from './contract';
import {getNmsL2P030FrameState} from './nms-l02-p030-timeline-v1';
import {NmsL2P030Presentation} from './nms-l02-p030-presentation-v1';
export function p030ModuleFrame(frame:number,context:RuntimeContext) {
  if(context.scenario!=='default')throw Error('P030_SCENARIO');
  return Object.freeze({...getNmsL2P030FrameState(frame,context),scenario:context.scenario});
}
export function NmsL2P030Renderer(props:AnimationRendererProps) {
  const s=p030ModuleFrame(props.frame,{...props,frame:props.frame});
  return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={props.lang} data-flash-seed={props.seed} data-flash-replay={s.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
    <NmsL2P030Presentation state={s} uiLanguage={props.uiLanguage??props.lang}/>
  </div>;
}
