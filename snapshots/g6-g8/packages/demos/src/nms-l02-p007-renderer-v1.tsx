'use client';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import {getNmsL2P007FrameState} from './nms-l02-p007-timeline-v1';
import {NmsL2P007Presentation} from './nms-l02-p007-presentation-v1';

export function p007ModuleFrame(frame: number, context: RuntimeContext) {
  if (context.scenario !== 'source-vocabulary') throw Error('NMS_L2_P007_SCENARIO');
  return Object.freeze({...getNmsL2P007FrameState(frame,context), scenario:context.scenario});
}

/** Local deterministic candidate. Host, audio and registration are separate. */
export function NmsL2P007Renderer(props: AnimationRendererProps) {
  const state = p007ModuleFrame(props.frame,{...props,frame:props.frame});
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={props.lang} data-flash-seed={props.seed}
    data-flash-replay={props.replay??0} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
    <NmsL2P007Presentation state={state} uiLanguage={props.uiLanguage??props.lang}/>
  </div>;
}
