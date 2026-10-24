'use client';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import {getNmsL2P017FrameState} from './nms-l02-p017-timeline-v1';
import {NmsL2P017Presentation} from './nms-l02-p017-presentation-v1';

export function p017ModuleFrame(frame: number, context: RuntimeContext) {
  if (context.scenario !== 'source-instruction') throw Error('NMS_L2_P017_SCENARIO');
  const state=getNmsL2P017FrameState(frame,context);
  if(context.rootFrame!==undefined&&context.rootFrame!==state.rootFrame)throw Error('NMS_L2_P017_ROOT_FRAME');
  return Object.freeze({...state, scenario:context.scenario});
}

/** Local deterministic candidate. Host, audio and registration are separate. */
export function NmsL2P017Renderer(props: AnimationRendererProps) {
  const state = p017ModuleFrame(props.frame,{...props,frame:props.frame});
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={props.lang} data-flash-seed={props.seed}
    data-flash-replay={props.replay??0} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
    <NmsL2P017Presentation state={state} uiLanguage={props.uiLanguage??props.lang}/>
  </div>;
}
