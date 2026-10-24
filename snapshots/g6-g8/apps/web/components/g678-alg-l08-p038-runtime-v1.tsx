'use client';
import {useCallback,useRef} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import {AlgL08P038Player,type AlgL08P038Controls} from '../../../packages/demos/src/alg-l08-p038-player-v1';
import {P038_AUDIO_SOURCE} from '../../../packages/demos/src/alg-l08-p038-audio-source-v1';
import {ALG_L08_P038_PRESENTATION_SOURCE as V} from '../../../packages/demos/src/alg-l08-p038-presentation-source-v1';
import {P038_RESOURCE_PINS} from '@/lib/alg-l08-p038-local-request-v1';
const ID='shared-alg001-l08-p038';
const DECODE_READY=P038_AUDIO_SOURCE.main.decoder!==null;
const BINDING={frameCount:525,frameDomain:'sprite-585',fps:12,audioAvailable:DECODE_READY,
 companionIdSuffix:'-p038-source-readable',glossaryEntries:V.sourceTermKeys} as const;
const readAudio=(id:585|'sa',signal:AbortSignal)=>{
 const token=id==='sa'?'optional-spanish-audio':'source-stream',pin=P038_RESOURCE_PINS[token];
 return loadBoundLessonAudio({animationId:ID,assetId:token,pin:{sourceBytes:pin.bytes,sourceSha256:pin.sha256},
  origin:window.location.origin,signal,contentType:pin.contentType,errorPrefix:'ALG_L08_P038_AUDIO'});
};
export function G678AlgL08P038RuntimeV1(props:LessonRuntimeAdapterProps){
 const bridge=useSourceLessonHostBridge(props,BINDING),trigger=useRef<HTMLButtonElement|null>(null);
 const connectControls=useCallback((controls:AlgL08P038Controls)=>bridge.connectControls({...controls,closeGlossary(){
  controls.closeGlossary();const target=trigger.current;trigger.current=null;if(target?.isConnected)target.focus({preventScroll:true});
 }}),[bridge.connectControls]);
 const openGlossary=useCallback((key:keyof typeof V.sourceTermKeys,button:HTMLButtonElement)=>{
  if(!Object.hasOwn(BINDING.glossaryEntries,key))return;trigger.current=button;bridge.openGlossary(key,button);
 },[bridge.openGlossary]);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-585'&&props.query.scenario==='source-vocabulary'&&props.query.lang==='en'&&
  String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 return <div ref={bridge.source} className="runtime-shell" data-l08-p038-host-probe={ID}
  data-l08-p038-host-ready={scoped&&DECODE_READY} data-l08-p038-host-error={!scoped?'scope':DECODE_READY?'none':'native-decode-pending'}
  data-lesson-presentation="modern-text-v1">{!scoped?<p role="alert">{props.labels.unavailable}</p>:
  <AlgL08P038Player seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1}
   reducedMotion={bridge.reducedMotion} audioSource={P038_AUDIO_SOURCE} readAudio={readAudio} connectControls={connectControls}
   onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onGlossary={openGlossary}
   onState={s=>bridge.onSnapshot({frame:s.frame,phase:s.phase==='loading'?'start-pending':s.phase,
    selectedAudio:s.mode==='sa'?'spanish':'main',audio:{phase:s.mode==='main'?s.audioPhase:'paused'},
    spanish:{phase:s.mode==='sa'?(s.loading?'loading':s.audioPhase):'idle'}})}/>}</div>;
}
