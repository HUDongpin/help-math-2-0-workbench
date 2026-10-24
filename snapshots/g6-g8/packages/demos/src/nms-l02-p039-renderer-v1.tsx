'use client';
import type {AnimationRendererProps} from './contract';
import {p039ModuleFrame} from './nms-l02-p039-frame-v1';
import {P039Exercise} from './nms-l02-p039-exercise-v1';
export function NmsL2P039Renderer(props:AnimationRendererProps){
 // Capture language fixes this static view; the live player owns the separate host UI locale.
 const s=p039ModuleFrame(props.frame,{...props,frame:props.frame});
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId} data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain}
  data-flash-root-frame={s.rootFrame} data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay}
  data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
  data-p039-query-kind={s.queryKind} data-p039-local-invocation={s.localInvocation} data-p039-action-disposition={s.actionDisposition} data-source-alignment="candidate-not-accepted">
  {s.mainFrame!==null&&<P039Exercise state={s.state} closePressed={s.closePressFrame!==null} uiLanguage={props.lang} interactionEnabled={false} onPercent={()=>{}} onSubmit={()=>{}} onReset={()=>{}} onClose={()=>{}}/>}
 </div>;
}
