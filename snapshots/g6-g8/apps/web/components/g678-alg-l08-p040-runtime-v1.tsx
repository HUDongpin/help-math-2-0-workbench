'use client';
import {useCallback} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL08P040Player,type P040Controls} from '../../../packages/demos/src/alg-l08-p040-player-v1';
import type {P040AudioId} from '../../../packages/demos/src/alg-l08-p040-session-v1';
import {P040_RESOURCE_PINS,type P040Resource} from '@/lib/alg-l08-p040-local-request-v1';
const ID='shared-alg001-l08-p040';
const BINDING={frameCount:737,frameDomain:'sprite-255',fps:12,companionIdSuffix:'-p040-source-readable',glossaryEntries:{}} as const;
const tokenFor=(id:P040AudioId):P040Resource=>{if(id==='sa')return'optional-spanish-audio';if(id===255)return'source-stream';if(id===237)return'feedback-237';if(id===249)return'feedback-249';throw Error('ALG_L08_P040_UNKNOWN_AUDIO');};
const readAudio=(id:P040AudioId,signal:AbortSignal)=>{const token=tokenFor(id),pin=P040_RESOURCE_PINS[token];return loadBoundLessonAudio({animationId:ID,assetId:token,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},origin:window.location.origin,signal,contentType:pin.contentType,errorPrefix:'ALG_L08_P040_AUDIO'});};
/** Only the game and its authored controls own their state. Host pause/replay
 * reflect the maintained session; no clock reaching a frame completes a lesson. */
export function G678AlgL08P040RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING);
 const connectControls=useCallback((controls:P040Controls)=>bridge.connectControls({...controls,closeGlossary(){}}),[bridge.connectControls]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&props.query.frameDomain==='sprite-255'&&props.query.scenario==='source-game'&&props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 return <div ref={bridge.source} className="runtime-shell" data-l08-p040-host-probe={ID} data-l08-p040-host-ready={scoped} data-l08-p040-host-error={scoped?'none':'scope'} data-lesson-presentation="modern-text-v1">{!scoped?<p role="alert">{props.labels.unavailable}</p>:<AlgL08P040Player seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1} readAudio={readAudio} connectControls={connectControls} onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onState={s=>bridge.onSnapshot({frame:s.state.source.mainFrame,phase:s.phase==='loading'?'start-pending':s.phase,selectedAudio:s.mode==='sa'?'spanish':'main',audio:{phase:s.mode==='main'&&s.audioOwners.some(a=>a.phase==='playing')?'playing':'idle'},spanish:{phase:s.mode==='sa'?(s.loading?'loading':s.spanish?.phase??'idle'):'idle'}})}/>}</div>;
}
