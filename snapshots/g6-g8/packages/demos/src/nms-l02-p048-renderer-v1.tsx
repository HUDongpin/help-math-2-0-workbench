'use client';
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {p048ModuleFrame} from './nms-l02-p048-frame-v1';
import {P048IntroView} from './nms-l02-p048-intro-view-v1';
import {P048PracticeView} from './nms-l02-p048-practice-view-v1';
import {P048_COPY} from './nms-l02-p048-copy-v1';
import './nms-l02-p048-view-v1.css';
export function NmsL2P048Renderer(props:AnimationRendererProps){
 const s=p048ModuleFrame(props.frame,props),lang=props.uiLanguage??props.lang;
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId}
  data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame}
  data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay}
  data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
  data-source-alignment="candidate-not-accepted" data-post-stop-inspection={s.postStopInspection||undefined}>
  {s.mainFrame!==null&&<><p className="p048-course-title" lang={lang}>{P048_COPY[lang].title}</p>
   {s.state.phase==='intro'?<P048IntroView frame={s.mainFrame} language={lang} reducedMotion={props.reducedMotion} interactive={false}/>:<P048PracticeView state={s.state} language={lang} interactive={false} onEvent={()=>{}}/>}</>}
 </div>;
}
