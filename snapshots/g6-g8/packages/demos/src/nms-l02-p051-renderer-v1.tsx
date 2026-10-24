'use client';
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {p051ModuleFrame} from './nms-l02-p051-frame-v1';
import {p051IntroScene} from './nms-l02-p051-intro-scene-v1';
import {P051Glossary,type P051GlossaryId} from './nms-l02-p051-glossary-v1';
import {P051IntroView} from './nms-l02-p051-intro-view-v1';
import {P051PracticeView} from './nms-l02-p051-practice-view-v1';
import {P051OutroView} from './nms-l02-p051-outro-view-v1';
import {P051_TEXT} from './nms-l02-p051-text-v1';
/** Queryable candidate inspection. Interactive playback belongs to P051Player. */
export function NmsL2P051Renderer(props:AnimationRendererProps){
 const state=p051ModuleFrame(props.frame,props),language=props.uiLanguage??props.lang;
 const intro=state.state.phase==='intro',outro=state.state.phase==='outro'||state.state.phase==='complete';
 const terms:readonly P051GlossaryId[]=intro?p051IntroScene(Math.min(484,state.mainFrame??1)).filter(o=>o.alpha>0&&(o.characterId===62||o.characterId===63)).map(o=>o.characterId===62?'equivalent-decimal':'column'):['equivalent-decimal','column'];
 return <div className="p051-practice" data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
  data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
  data-flash-scenario={state.scenario} data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay}
  data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId} data-flash-entry-state-sha256={props.entryStateSha256}
  data-source-alignment="candidate-not-accepted" data-post-stop-inspection={state.postStopInspection||undefined}>
  {state.mainFrame!==null&&<>
   {!intro&&<p lang={language}>{P051_TEXT[language].title}</p>}
   <P051Glossary scope="main" visibleIds={terms} language={language} disabled onOpen={()=>{}} onClose={()=>{}}/>
   {intro?<P051IntroView frame={Math.min(484,state.mainFrame)} language={language} reducedMotion={props.reducedMotion}/>:outro?
    <P051OutroView language={language} complete={state.state.phase==='complete'}/>:
    <P051PracticeView state={state.state} language={language} interactive={false} onEvent={()=>{}} wrongGlossary={<P051Glossary scope="wrong" language={language} disabled onOpen={()=>{}} onClose={()=>{}}/>}/>
   }
  </>}
 </div>;
}
