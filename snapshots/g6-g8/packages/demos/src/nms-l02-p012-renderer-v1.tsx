'use client';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import {getNmsL2P012FrameState} from './nms-l02-p012-timeline-v1';
import {NmsL2P012Presentation} from './nms-l02-p012-presentation-v1';

export function p012ModuleFrame(frame: number, context: RuntimeContext) {
  if (context.scenario !== 'source-vocabulary') throw Error('NMS_L2_P012_SCENARIO');
  const state=getNmsL2P012FrameState(frame,context);
  if(context.rootFrame!==undefined&&context.rootFrame!==state.rootFrame)throw Error('NMS_L2_P012_ROOT_FRAME');
  return Object.freeze({...state, scenario:context.scenario});
}

/** Local deterministic candidate. Host, audio and registration are separate. */
export function NmsL2P012Renderer(props: AnimationRendererProps) {
  const state = p012ModuleFrame(props.frame,{...props,frame:props.frame});
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={props.lang} data-flash-seed={props.seed}
    data-flash-replay={props.replay??0} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
    <NmsL2P012Presentation state={state} uiLanguage={props.uiLanguage??props.lang}/>
  </div>;
}
