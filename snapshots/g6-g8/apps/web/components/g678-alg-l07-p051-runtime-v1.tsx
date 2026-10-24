'use client';
import {useCallback} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL07P051Player} from '../../../packages/demos/src/alg-l07-p051-player-v1';
import type {L7GameControls} from '../../../packages/demos/src/alg-l07-game-controls-v1';
import {P051_RESOURCE_PINS} from '@/lib/alg-l07-p051-local-request-v1';
const ID='shared-alg001-l07-p051';
const BINDING={frameCount:683,frameDomain:'sprite-185',fps:12,companionIdSuffix:'-p051-source-readable',glossaryEntries:{}} as const;
const readAudio=(id:185|'sa',signal:AbortSignal)=>{
 const token=id==='sa'?'optional-spanish-audio':'source-stream',pin=P051_RESOURCE_PINS[token];
 return loadBoundLessonAudio({animationId:ID,assetId:token,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},origin:window.location.origin,signal,errorPrefix:'ALG_L07_P051_AUDIO'});
};
export function G678AlgL07P051RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING);
 const connectControls=useCallback((c:L7GameControls)=>bridge.connectControls({...c,closeGlossary(){}}),[bridge.connectControls]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-185'&&props.query.scenario==='source-directions'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 return <div ref={bridge.source} className="runtime-shell" data-l07-p051-host-probe={ID} data-l07-p051-host-ready={scoped} data-l07-p051-host-error={scoped?'none':'scope'} data-lesson-presentation="modern-text-v1">
  {!scoped?<p role="alert">{props.labels.unavailable}</p>:<AlgL07P051Player seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1} readAudio={readAudio} connectControls={connectControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay}
   onNavigate={intent=>{
    if(intent.sourceStem!=='L7GS03'||intent.targetAnimationId!=='shared-alg001-l07-p052'||![1,2].includes(intent.level))return false;
    const decision=props.onLessonHostRequest?.({type:'navigate',targetAnimationId:intent.targetAnimationId,handoff:{kind:'game-level',sourceAnimationId:ID,targetAnimationId:intent.targetAnimationId,level:intent.level}});
    return decision?.status==='allowed';
   }}
   onState={s=>bridge.onSnapshot({frame:s.frame,phase:s.phase==='loading'?'start-pending':s.phase,selectedAudio:s.mode==='sa'?'spanish':'main',audio:{phase:s.mode==='main'?s.audioPhase:'paused'},spanish:{phase:s.mode==='sa'?(s.loading?'loading':s.audioPhase):'idle'}})}/>} 
 </div>;
}
