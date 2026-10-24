'use client';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import {getNmsL2P001FrameState} from './nms-l02-p001-timeline-v1';
import {NmsL2P001Presentation} from './nms-l02-p001-presentation-v1';

export function p001ModuleFrame(frame: number, context: RuntimeContext) {
  if (context.scenario !== 'source-introduction') throw Error('NMS_L2_P001_SCENARIO');
  return Object.freeze({...getNmsL2P001FrameState(frame, context), scenario: context.scenario});
}

/** Deterministic Current-JS capture surface; no original-runtime authority. */
export function NmsL2P001Renderer(props: AnimationRendererProps) {
  const state = p001ModuleFrame(props.frame, {...props, frame: props.frame});
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId} data-flash-frame={state.frame}
    data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={props.scenario} data-flash-language={props.lang}
    data-flash-seed={props.seed} data-flash-replay={props.replay ?? 0}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256}
    data-source-alignment="candidate-not-accepted">
    <NmsL2P001Presentation state={state} uiLanguage={props.uiLanguage ?? props.lang}/>
  </div>;
}
