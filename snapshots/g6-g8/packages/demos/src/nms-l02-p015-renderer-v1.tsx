'use client';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import {getNmsL2P015FrameState} from './nms-l02-p015-timeline-v1';
import {NmsL2P015Presentation} from './nms-l02-p015-presentation-v1';

export function p015ModuleFrame(frame: number, context: RuntimeContext) {
  if (context.scenario !== 'source-vocabulary') throw Error('NMS_L2_P015_SCENARIO');
  const state=getNmsL2P015FrameState(frame,context);
  if(context.rootFrame!==undefined&&context.rootFrame!==state.rootFrame)throw Error('NMS_L2_P015_ROOT_FRAME');
  return Object.freeze({...state, scenario:context.scenario});
}

/** Local deterministic candidate. Host, audio and registration are separate. */
export function NmsL2P015Renderer(props: AnimationRendererProps) {
  const state = p015ModuleFrame(props.frame,{...props,frame:props.frame});
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={props.lang} data-flash-seed={props.seed}
    data-flash-replay={props.replay??0} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted">
    <NmsL2P015Presentation state={state} uiLanguage={props.uiLanguage??props.lang}/>
  </div>;
}
