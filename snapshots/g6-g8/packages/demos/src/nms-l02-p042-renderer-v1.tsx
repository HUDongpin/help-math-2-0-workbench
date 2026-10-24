'use client';
import type { AnimationRendererProps } from './contract';
import { p042ModuleFrame } from './nms-l02-p042-frame-v1';
import { P042Presentation } from './nms-l02-p042-presentation-v1';
/** Deterministic inspection; frame626 uses initialized practice, never resumes stopped audio. */
export function NmsL2P042Renderer(props: AnimationRendererProps) {
  const state = p042ModuleFrame(props.frame, { ...props, frame: props.frame });
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={state.language} data-flash-seed={state.seed}
    data-flash-replay={state.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted"
    data-post-stop-inspection={state.postStopInspection || undefined}>
    {state.mainFrame !== null && <P042Presentation frame={state.mainFrame} percentages={state.percentages}
      language={props.uiLanguage ?? props.lang} interactive={false} onAdjust={() => {}} />}
  </div>;
}
