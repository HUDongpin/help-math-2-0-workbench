'use client';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL07P062Player} from '../../../packages/demos/src/alg-l07-p062-player-v1';
import {P062_RESOURCE_PINS,type P062Resource} from '@/lib/alg-l07-p062-local-request-v1';
const ID='shared-alg001-l07-p062';
const BINDING={frameCount:81,frameDomain:'sprite-1383',fps:12,companionIdSuffix:'-p062-source-readable',glossaryEntries:{}} as const;
const readAudio=(id:string,signal:AbortSignal)=>{if(!Object.hasOwn(P062_RESOURCE_PINS,id))return Promise.reject(Error('P062_UNKNOWN_AUDIO'));const pin=P062_RESOURCE_PINS[id as P062Resource];return loadBoundLessonAudio({animationId:ID,assetId:id,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},origin:window.location.origin,signal,contentType:pin.contentType,errorPrefix:'ALG_L07_P062_AUDIO'});};
export function G678AlgL07P062RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-1383'&&props.query.scenario==='source-quiz'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'')&&typeof props.onSourceExit==='function';
 return <div ref={bridge.source} className="runtime-shell" data-l07-p062-host-probe={ID} data-l07-p062-host-ready={scoped} data-l07-p062-host-error={scoped?'none':'scope'} data-lesson-presentation="modern-text-v1">{!scoped?<p role="alert">{props.labels.unavailable}</p>:<AlgL07P062Player seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1} readAudio={readAudio} connectControls={bridge.connectControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onExit={props.onSourceExit} onState={s=>bridge.onSnapshot({frame:s.frame,phase:s.phase==='loading'?'start-pending':s.phase,selectedAudio:s.audio?.target.language==='es'?'spanish':'main',audio:{phase:s.audio?.target.language==='en'?s.audio.phase:'idle'},spanish:{phase:s.audio?.target.language==='es'?s.audio.phase:'idle'}})}/>}</div>;
}
