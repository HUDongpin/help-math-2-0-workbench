'use client';
import {useCallback} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL08P050Player,type P050Controls} from '../../../packages/demos/src/alg-l08-p050-player-v1';
import {P050_LOCAL_AUDIO_POLICY,type P050AudioId} from '../../../packages/demos/src/alg-l08-p050-session-v1';
import {P050_RESOURCE_PINS,P050_AUDIO_TOKENS} from '@/lib/alg-l08-p050-local-request-v1';
const ID='shared-alg001-l08-p050';
const BINDING={frameCount:69,frameDomain:'sprite-960',fps:12,companionIdSuffix:'-p050-source-readable',glossaryEntries:{}} as const;
const readAudio=(id:P050AudioId,signal:AbortSignal)=>{if(!Object.hasOwn(P050_AUDIO_TOKENS,id))return Promise.reject(Error('ALG_L08_P050_UNKNOWN_AUDIO'));const token=P050_AUDIO_TOKENS[id as keyof typeof P050_AUDIO_TOKENS],pin=P050_RESOURCE_PINS[token];return loadBoundLessonAudio({animationId:ID,assetId:token,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},origin:window.location.origin,signal,contentType:pin.contentType,errorPrefix:'ALG_L08_P050_AUDIO'});};
/** This local policy enables only explicit existing question/option buttons.
 * Locale never starts audio; local score stays in the reviewed memory adapter. */
export function G678AlgL08P050RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING);
 const connectControls=useCallback((controls:P050Controls)=>bridge.connectControls({...controls,narration(action){controls.setPaused(action==='stop');},replay(){const accepted=controls.replay();if(accepted)props.onReplay?.();return accepted;},closeGlossary(){}}),[bridge.connectControls,props.onReplay]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-960'&&props.query.scenario==='source-quiz'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'')&&typeof props.onSourceExit==='function';
 return <div ref={bridge.source} className="runtime-shell" data-l08-p050-host-probe={ID} data-l08-p050-host-ready={scoped} data-l08-p050-host-error={scoped?'none':'scope'} data-lesson-presentation="modern-text-v1">{!scoped?<p role="alert">{props.labels.unavailable}</p>:<AlgL08P050Player seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} audioPolicy={P050_LOCAL_AUDIO_POLICY} paused={props.paused} volume={props.volume??1} readAudio={readAudio} connectControls={connectControls} onPaused={props.onRuntimePausedChange} onExitRequest={props.onSourceExit} onState={s=>{const spanish=(s.activeAudioId??s.pendingAudioId)?.startsWith('SA/')===true;bridge.onSnapshot({frame:s.state.mainFrame,phase:s.closed?'closed':s.failure?'failed':s.resetting?'start-pending':s.paused||s.state.phase==='exit-requested'?'paused':'playing',selectedAudio:spanish?'spanish':'main',audio:{phase:!spanish?s.audioPhase:'idle'},spanish:{phase:spanish?(s.loading?'loading':s.audioPhase):'idle'}});}}/>}</div>;
}
