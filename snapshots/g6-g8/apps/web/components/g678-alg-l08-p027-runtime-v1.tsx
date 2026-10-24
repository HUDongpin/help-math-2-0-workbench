'use client';
import {useCallback} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {SourceCanvasLoopPlayerV1} from '../../../packages/demos/src/source-canvas-loop-player-v1';
import {SOURCE} from '../../../packages/demos/src/generated/alg-l08-p027-source-loop-v1';
import {P027_RESOURCE_PINS} from '@/lib/alg-l08-p027-local-request-v1';
const ID='shared-alg001-l08-p027';
const BINDING={frameCount:709,frameDomain:'sprite-41',fps:12,companionIdSuffix:'-p027-source-readable',glossaryEntries:{"Graph":"graph","Linear equation":"linear-equation","Calculate":"calculate","Point":"point"}} as const;
const readAudio=(id:number|'sa',signal:AbortSignal)=>{
 if(id!==41&&id!=='sa')return Promise.reject(Error('ALG_L08_P027_AUDIO_ID'));
 const token=id==='sa'?'optional-spanish-audio':'source-stream',pin=P027_RESOURCE_PINS[token];
 return loadBoundLessonAudio({animationId:ID,assetId:token,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},origin:window.location.origin,signal,errorPrefix:'ALG_L08_P027_AUDIO'});
};
export function G678AlgL08P027RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING);
 const openGlossary=useCallback((key:string,button:HTMLButtonElement)=>{if(!Object.hasOwn(BINDING.glossaryEntries,key))return;bridge.openGlossary(key as keyof typeof BINDING.glossaryEntries,button);},[bridge.openGlossary]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-41'&&props.query.scenario==='source-static-frame'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 return <div ref={bridge.source} className="runtime-shell" data-l08-p027-host-probe={ID} data-l08-p027-host-ready={scoped} data-l08-p027-host-error={scoped?'none':'scope'} data-lesson-presentation="modern-text-v1">{!scoped?<p role="alert">{props.labels.unavailable}</p>:<SourceCanvasLoopPlayerV1 source={SOURCE} seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1} reducedMotion={bridge.reducedMotion} readAudio={readAudio} connectControls={bridge.connectControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onGlossary={openGlossary} onState={s=>bridge.onSnapshot({frame:s.frame,phase:s.phase==='loading'?'start-pending':s.phase,selectedAudio:s.mode==='sa'?'spanish':'main',audio:{phase:s.mode==='main'?s.audioPhase:'paused'},spanish:{phase:s.mode==='sa'?(s.loading?'loading':s.audioPhase):'idle'}})}/>}</div>;
}
