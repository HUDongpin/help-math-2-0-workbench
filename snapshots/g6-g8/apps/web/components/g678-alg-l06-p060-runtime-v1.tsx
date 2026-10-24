'use client';
import {useCallback,useRef} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P060QuizPlayer} from '../../../packages/demos/src/alg-l06-p060-player-v1';
import {p060SourceState} from '../../../packages/demos/src/alg-l06-p060-state-v1';
import type {P060AudioAsset} from '../../../packages/demos/src/alg-l06-p060-source-v1';
import type {P060SessionSnapshot} from '../../../packages/demos/src/alg-l06-p060-session-v1';
import {loadBoundLessonAudio} from './source-lesson-host-bridge-v1';
const ID='shared-alg001-l06-p060';
const readAudio=(asset:P060AudioAsset,signal:AbortSignal)=>loadBoundLessonAudio({animationId:ID,
 assetId:`quiz-${asset.id.toLowerCase()}`,pin:asset.binding,origin:window.location.origin,signal,errorPrefix:'P060_SOURCE_AUDIO'});
/** Same maintained quiz as the standalone fixture, connected to real host controls. */
export function G678AlgL6P060RuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&props.moduleKey===ID&&
  props.audioEnabled===true&&props.query.frameDomain==='sprite-973'&&props.query.scenario==='source-explicit-frames'&&
  props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'');
 const observe=useCallback((snapshot:P060SessionSnapshot)=>{
  const picture=p060SourceState(snapshot.quiz);
  latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:picture.frame,frameCount:69,frameDomain:'sprite-973',fps:12,
   narration:snapshot.audio.phase==='playing'?'playing':'idle',playbackProgress:snapshot.quiz.responses.length/10,seekAvailable:false,stepFrames:1,transportMode:'none'});
 },[]);
 if(!scoped)return <p role="alert" data-p060-host-error="scope">{props.labels.unavailable}</p>;
 return <div className="runtime-shell" data-p060-host-probe={ID} data-p060-host-ready="true" data-p060-host-error="none" data-lesson-presentation="modern-text-v1">
  <P060QuizPlayer seed={0} uiLanguage={props.uiLanguage==='es'?'es':'en'} paused={props.paused} volume={props.volume??1} audioEnabled
   readAudio={readAudio} connectControls={props.connectRuntimeControls} onPaused={props.onRuntimePausedChange}
   onReplay={props.onReplay} onComplete={props.onPlaybackComplete} onState={observe}/>
 </div>;
}
