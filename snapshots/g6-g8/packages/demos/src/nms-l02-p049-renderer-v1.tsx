'use client';
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {p049ModuleFrame} from './nms-l02-p049-frame-v1';
import {P049IntroView} from './nms-l02-p049-intro-view-v1';
import {P049PracticeView} from './nms-l02-p049-practice-view-v1';
import {P049_COPY} from './nms-l02-p049-copy-v1';
import './nms-l02-p049-view-v1.css';
/** Static inspection uses the same maintained views as the live player, with actions disabled. */
export function NmsL2P049Renderer(props:AnimationRendererProps){
 const s=p049ModuleFrame(props.frame,props),lang=props.uiLanguage??props.lang;
 return <div data-animation-id={s.animationId} data-flash-animation-id={s.animationId}
  data-flash-frame={s.frame} data-flash-frame-domain={s.frameDomain} data-flash-root-frame={s.rootFrame}
  data-flash-scenario={s.scenario} data-flash-language={s.language} data-flash-seed={s.seed} data-flash-replay={s.replay}
  data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
  data-source-alignment="candidate-not-accepted" data-post-stop-inspection={s.postStopInspection||undefined}>
  {s.mainFrame!==null&&<><p className="p049-course-title" lang={lang}>{P049_COPY[lang].title}</p>
   {s.state.phase==='intro'?<P049IntroView frame={s.mainFrame} language={lang} reducedMotion={props.reducedMotion}/>:<P049PracticeView state={s.state} frame={s.mainFrame} language={lang} interactive={false} onEvent={()=>{}}/>}</>}
 </div>;
}
