'use client';
import type { AnimationRendererProps } from './contract';
import { p043ModuleFrame } from './nms-l02-p043-frame-v1';
import { P043Presentation } from './nms-l02-p043-presentation-v1';
export function NmsL2P043Renderer(props: AnimationRendererProps) {
  const state = p043ModuleFrame(props.frame, props);
  return <div data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-scenario={state.scenario} data-flash-language={state.language} data-flash-seed={state.seed}
    data-flash-replay={state.replay} data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-source-alignment="candidate-not-accepted"
    data-post-stop-inspection={state.postStopInspection || undefined}>
    {state.mainFrame !== null && <P043Presentation state={state.matching} frame={state.mainFrame}
      language={props.uiLanguage ?? props.lang} completionDomain={state.completionDomain}
      interactive={false} onMatch={() => {}} onCloseWrong={() => {}} />}
  </div>;
}
