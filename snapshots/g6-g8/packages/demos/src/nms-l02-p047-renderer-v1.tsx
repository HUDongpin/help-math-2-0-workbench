'use client';
import type {AnimationRendererProps} from './contract';
import {p047ModuleFrame} from './nms-l02-p047-frame-v1';
import {P047IntroView} from './nms-l02-p047-intro-view-v1';
import {P047PracticeView} from './nms-l02-p047-practice-view-v1';
import {P047_COPY} from './nms-l02-p047-copy-v1';
import './nms-l02-p047-view-v1.css';
export function NmsL2P047Renderer(props:AnimationRendererProps){
  const s=p047ModuleFrame(props.frame,props),lang=props.uiLanguage??props.lang;
  return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId}
    data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame}
    data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
    data-source-alignment="candidate-not-accepted" data-post-stop-inspection={s.postStopInspection||undefined}>
    {s.mainFrame!==null&&<><p className="p047-course-title" lang={lang}>{P047_COPY[lang].title}</p>
      {s.state.phase==='intro'?<P047IntroView frame={s.mainFrame} language={lang} reducedMotion={props.reducedMotion} interactive={false}/>
        :<P047PracticeView state={s.state} language={lang} interactive={false} onSelect={()=>{}} onDrop={()=>{}} onCancel={()=>{}} onHelp={()=>{}}/>}</>}
  </div>;
}
