'use client';
import type {AnimationRendererProps} from './contract';
import {p045ModuleFrame} from './nms-l02-p045-frame-v1';
import {P045IntroView} from './nms-l02-p045-intro-view-v1';
import {P045PracticeView} from './nms-l02-p045-practice-view-v1';
import './nms-l02-p045-view-v1.css';
export function NmsL2P045Renderer(props:AnimationRendererProps){
  const s=p045ModuleFrame(props.frame,props),lang=props.uiLanguage??props.lang;
  return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId}
    data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame}
    data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
    data-source-alignment="candidate-not-accepted" data-post-stop-inspection={s.postStopInspection||undefined}>
    {s.mainFrame!==null&&<><p className="p045-course-title" lang="en">Fractions, Decimals, and Percent Concepts: Try It!</p>
      {s.state.phase==='intro'?<P045IntroView frame={s.mainFrame} language={lang} interactive={false}/>
        :<P045PracticeView state={s.state} language={lang} interactive={false} onInput={()=>{}} onCheck={()=>{}} onNew={()=>{}} onHelp={()=>{}} onCloseFeedback={()=>{}}/>}</>}
  </div>;
}
