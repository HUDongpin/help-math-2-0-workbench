'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {P054ProductBoardV1} from '../../../packages/demos/src/nms-l02-p054-product-board-v1';
import type {P054State} from '../../../packages/demos/src/nms-l02-p054-matching-state-candidate';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';

const ID='shared-nms002-l02-p054';
interface BoardControls {pause():void;resume():void;stop():void;setVolume(volume:number):void}
export const P054_MATCHING_TOOLBAR_STATE:AnimationRuntimePlaybackState=Object.freeze({
 audioAvailable:false,frame:1,frameCount:1,frameDomain:'interaction-state',fps:0,
 narration:'unavailable',playbackProgress:null,seekAvailable:false,stepFrames:0,transportMode:'none',
});

export function createP054LessonControls(get:()=>BoardControls|null,
 reportPaused:()=>void):LessonRuntimeAdapterControls {
 return {
  setPaused(paused){if(paused)get()?.pause();else get()?.resume();},
  replay(){get()?.stop();return false;},
  narration(action){if(action==='stop')get()?.pause();},
  stop(){get()?.stop();reportPaused();},
 };
}

/** Matching uses a source-bound feedback clock. The host never turns the six
 * matches into reviewed-page progress or invokes final-quiz scoring. */
export function NmsL02P054LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const controls=useRef<BoardControls|null>(null);
 const [state,setState]=useState<P054State|null>(null);
 const level=props.query.scenario==='source-matching-level-1'?'1':
  props.query.scenario==='source-matching-level-2'?'2':null;
 const validContext=props.animationId===ID&&props.moduleKey===ID&&
  props.query.frameDomain==='sprite-731'&&
  props.query.lang==='en'&&(level==='1'||level==='2');
 const connectBoard=useCallback((next:BoardControls)=>{
  controls.current=next;next.setVolume(latest.current.volume??1);
  return ()=>{next.stop();if(controls.current===next)controls.current=null;};
 },[]);
 const onState=useCallback((next:P054State)=>setState(next),[]);
 const onPlaybackChange=useCallback((paused:boolean)=>{
  latest.current.onRuntimePausedChange(paused);
  latest.current.onPlaybackStateChange?.(P054_MATCHING_TOOLBAR_STATE);
 },[]);
 useEffect(()=>{
  if(!validContext)return;
  const disconnect=props.connectRuntimeControls(createP054LessonControls(
   ()=>controls.current,()=>latest.current.onRuntimePausedChange(true)));
  latest.current.onPlaybackStateChange?.(P054_MATCHING_TOOLBAR_STATE);
  return ()=>{controls.current?.stop();disconnect();};
 },[props.connectRuntimeControls,validContext]);
 // Host pause is dispatched through connected controls. A paused toolbar at
 // entry or after feedback must not disable the next learner card selection.
 useEffect(()=>{
  if(props.seekRequest||props.narrationRequest?.action==='stop')controls.current?.pause();
 },[props.seekRequest,props.narrationRequest]);
 useEffect(()=>{controls.current?.setVolume(props.volume??1);},[props.volume]);
 if(!validContext)return <section role="alert" data-animation-id={ID} data-p054-runtime-status="blocked">
  {props.uiLanguage==='es'?'El contexto del juego no está disponible.':'The source game context is unavailable.'}
 </section>;
 return <div data-animation-id={ID} data-p054-runtime-status="contextual-candidate"
  data-p054-toolbar-domain="interaction-state" data-p054-host-phase={state?.phase??'initializing'}>
  <P054ProductBoardV1 level={level==='2'?2:1} uiLanguage={props.uiLanguage??'en'}
   connectControls={connectBoard} onState={onState} onPlaybackChange={onPlaybackChange}/>
 </div>;
}
