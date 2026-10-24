'use client';
import {useCallback} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL07P052Player} from '../../../packages/demos/src/alg-l07-p052-player-v1';
import type {L7GameControls} from '../../../packages/demos/src/alg-l07-game-controls-v1';
import {P052_RESOURCE_PINS} from '@/lib/alg-l07-p052-local-request-v1';
const ID='shared-alg001-l07-p052';
const BINDING={frameCount:6,frameDomain:'sprite-303',fps:12,companionIdSuffix:'-p052-source-readable',glossaryEntries:{}} as const;
const readAudio=(id:157|170|'sa',signal:AbortSignal)=>{
 const token=id==='sa'?'optional-spanish-audio':id===157?'feedback-157':'feedback-170',pin=P052_RESOURCE_PINS[token];
 return loadBoundLessonAudio({animationId:ID,assetId:token,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},origin:window.location.origin,signal,errorPrefix:'ALG_L07_P052_AUDIO'});
};
const imageUrl=(id:77|222)=>{const pin=P052_RESOURCE_PINS[id===77?'bitmap-77.png':'bitmap-222.png'];return `${pin.originalPath}?sha256=${pin.sha256}`;};
export function G678AlgL07P052RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING);
 const connectControls=useCallback((c:L7GameControls)=>bridge.connectControls({...c,closeGlossary(){}}),[bridge.connectControls]);
 const handoff=props.lessonHostNavigationHandoff;
 const entryLevel=handoff?.kind==='game-level'&&handoff.sourceAnimationId==='shared-alg001-l07-p051'&&handoff.targetAnimationId===ID&&handoff.level===2?2:1;
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-303'&&props.query.scenario==='source-game'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 return <div ref={bridge.source} className="runtime-shell" data-l07-p052-host-probe={ID} data-l07-p052-host-ready={scoped} data-l07-p052-host-error={scoped?'none':'scope'} data-lesson-presentation="modern-text-v1">
  {!scoped?<p role="alert">{props.labels.unavailable}</p>:<AlgL07P052Player seed={0} entryLevel={entryLevel} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1} readAudio={readAudio} imageUrl={imageUrl} connectControls={connectControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay}
   onState={s=>bridge.onSnapshot({frame:s.frame,phase:s.phase==='loading'?'start-pending':s.phase,selectedAudio:s.mode==='sa'?'spanish':'main',audio:{phase:s.mode==='game'?s.audioPhase:'paused'},spanish:{phase:s.mode==='sa'?(s.loading?'loading':s.audioPhase):'idle'}})}/>}
 </div>;
}
