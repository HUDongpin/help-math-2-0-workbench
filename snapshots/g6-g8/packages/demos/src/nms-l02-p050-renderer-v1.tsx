'use client';
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {p050ModuleFrame} from './nms-l02-p050-frame-v1';
import {P050MainGlossary} from './nms-l02-p050-main-glossary-v1';
import {P050IntroView} from './nms-l02-p050-intro-view-v1';
import {P050PracticeView} from './nms-l02-p050-practice-view-v1';
import {P050OutroView} from './nms-l02-p050-outro-view-v1';
import {P050_TEXT} from './nms-l02-p050-text-v1';
/** Candidate inspection renderer. Live playback is owned by P050Player. */
export function NmsL2P050Renderer(props:AnimationRendererProps){
 const state=p050ModuleFrame(props.frame,props),language=props.uiLanguage??props.lang;
 const outro=state.state.phase==='outro'||state.state.phase==='complete';
 return <div className="p050-practice" data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
  data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
  data-flash-scenario={state.scenario} data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay}
  data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
  data-source-alignment="candidate-not-accepted" data-post-stop-inspection={state.postStopInspection||undefined}>
  {state.mainFrame!==null&&<><p lang={language}>{P050_TEXT[language].title}</p>
   {<P050MainGlossary frame={state.mainFrame} language={language} disabled onOpen={()=>{}} onClose={()=>{}}/>}
   {state.state.phase==='intro'?<P050IntroView frame={state.mainFrame} language={language} reducedMotion={props.reducedMotion}/>:outro?
    <P050OutroView language={language} complete={state.state.phase==='complete'}/>:
    <P050PracticeView state={state.state} language={language} interactive={false} onEvent={()=>{}}/>}
  </>}
 </div>;
}
