'use client';
import type {AnimationRendererProps} from './contract';
import {p046ModuleFrame} from './nms-l02-p046-frame-v1';
import {P046IntroView} from './nms-l02-p046-intro-view-v1';
import {P046PracticeView} from './nms-l02-p046-practice-view-v1';
import './nms-l02-p046-view-v1.css';
export function NmsL2P046Renderer(props:AnimationRendererProps){
  const s=p046ModuleFrame(props.frame,props),lang=props.uiLanguage??props.lang;
  return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId}
    data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame}
    data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
    data-source-alignment="candidate-not-accepted" data-post-stop-inspection={s.postStopInspection||undefined}>
    {s.mainFrame!==null&&<><p className="p046-course-title" lang="en">Fractions, Decimals, and Percent Concepts: Try It!</p>
      {s.state.phase==='intro'?<P046IntroView frame={s.mainFrame} language={lang} reducedMotion={props.reducedMotion} interactive={false}/>
        :<P046PracticeView state={s.state} language={lang} interactive={false} onDone={()=>{}} onParts={()=>{}} onToggle={()=>{}} onInput={()=>{}} onCheck={()=>{}} onNew={()=>{}} onHelp={()=>{}} onCloseFeedback={()=>{}}/>}</>}
  </div>;
}
