import React from 'react';
import {P052IntroView} from './nms-l02-p052-intro-view-v1';
import {P052PracticeView} from './nms-l02-p052-practice-view-v1';
import {p052Copy,type P052Language} from './nms-l02-p052-copy-v1';
import type {P052State,P052Event} from './nms-l02-p052-state-v1';

export function p052ViewPhase(state:P052State):'intro'|'intro-hold'|'exercise'|'outro'{
 if(!Number.isInteger(state.frame)||state.frame<1||state.frame>156)throw Error('P052_VIEW_FRAME');
 if(state.phase==='intro'){
  if(state.frame>115)throw Error('P052_VIEW_PHASE_FRAME');
  return state.frame===115?'intro-hold':'intro';
 }
 if(state.phase==='practice'||state.phase==='wrong'||state.phase==='right'){
  if(state.frame!==115)throw Error('P052_VIEW_PHASE_FRAME');return 'exercise';
 }
 if(state.phase==='outro'||state.phase==='complete'){
  if(state.frame<116||(state.phase==='complete'&&state.frame!==156))throw Error('P052_VIEW_PHASE_FRAME');
  return 'outro';
 }
 throw Error('P052_VIEW_PHASE');
}
/** Presentation composition only. Host/controller supplies the real reducer state.
 * Static source outro retains solved grid/digits; removed source controls remain absent.
 * No audio callback, frame arrival, CSS update or render advances teaching state.
 */
export function P052PageView({state,language,interactive=true,onEvent,captureIdentity}:{
 state:P052State;language:P052Language;interactive?:boolean;onEvent:(event:P052Event)=>void;
 captureIdentity?:Readonly<{requirementId:string;traceId:string;entryStateSha256:string;scenario:string;seed:number}>;
}){
 const phase=p052ViewPhase(state),copy=p052Copy(language);
 return <div className="p052-page" lang={language} data-animation-id="shared-nms002-l02-p052"
  data-flash-frame-domain="sprite-350" data-flash-frame={state.frame} data-flash-root-frame={6}
  data-flash-requirement-id={captureIdentity?.requirementId} data-flash-trace-id={captureIdentity?.traceId}
  data-flash-entry-state-sha256={captureIdentity?.entryStateSha256} data-flash-scenario={captureIdentity?.scenario}
  data-flash-language={captureIdentity?language:undefined} data-flash-seed={captureIdentity?.seed}
  data-p052-view-phase={phase} data-p052-state-phase={state.phase} data-p052-epoch={state.epoch}
  data-source-alignment="candidate-not-accepted">
  {phase==='intro'?<P052IntroView frame={state.frame} language={language}/>:<>
   <h2 className="p052-page-title" data-p052-source-text="154">{copy.title}</h2>
   <P052PracticeView state={state} language={language} interactive={interactive&&phase!=='intro-hold'&&phase!=='outro'} onEvent={onEvent}/>
  </>}
 </div>;
}
